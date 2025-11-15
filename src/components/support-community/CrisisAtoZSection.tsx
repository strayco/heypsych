"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import Script from "next/script";
import { CrisisSearchInput } from "./CrisisSearchInput";
import { CrisisCategoryFilter } from "./CrisisCategoryFilter";
import { CrisisCard } from "./CrisisCard";
import { InternationalToggle } from "./InternationalToggle";
import { useFuzzySearch } from "@/lib/hooks/useFuzzySearch";
import { Card, CardContent } from "@/components/ui/card";

interface Hotline {
  id: string;
  name: string;
  summary: string;
  categories?: string[];
  labels: {
    free?: boolean;
    availability?: string;
    focus?: string[];
    verified?: boolean;
  };
  org: {
    name: string;
    url?: string | null;
  };
  coverage: Array<{
    region: string;
    scope: string;
  }>;
  contacts: Array<{
    region: string;
    channels: {
      call?: Array<{ label: string; value: string | null }>;
      text?: Array<{ label: string; value: string | null }>;
      chat?: Array<{ label: string; value: string | null }>;
      tty?: Array<{ label: string; value: string | null }>;
    };
  }>;
  actions: {
    site_url?: string | null;
    chat_url?: string | null;
    text?: string | null;
    tty?: string | null;
  };
  taxonomy: {
    topics?: string[];
    conditions?: string[];
    identities?: string[];
  };
  search: {
    keywords?: string[];
    aka?: string[];
  };
}

interface Props {
  hotlines: Hotline[];
}

// Category labels mapping
const CATEGORY_LABELS: Record<string, string> = {
  'lgbtq+': 'LGBTQ+',
  'veterans': 'Veterans',
  'military': 'Military',
  'domestic-violence': 'Domestic Violence',
  'sexual-assault': 'Sexual Assault',
  'safety': 'Safety & Assault',
  'youth': 'Youth',
  'indigenous': 'Indigenous',
  'bipoc': 'BIPOC',
  'transgender': 'Transgender',
  'accessibility': 'Accessibility',
  'deaf': 'Deaf/HoH',
  'substance-use': 'Substance Use',
  'addiction': 'Addiction',
  'mental-health': 'Mental Health',
  'eating-disorders': 'Eating Disorders',
  'postpartum': 'Postpartum',
  'maternal': 'Maternal',
  'pregnancy': 'Pregnancy',
  'disaster': 'Disaster',
  'trauma': 'Trauma',
  'peer-support': 'Peer Support',
  'family': 'Family',
  'child-abuse': 'Child Abuse',
  'dating-violence': 'Dating Violence',
  'suicide-prevention': 'Suicide Prevention',
  'emotional-support': 'Emotional Support',
  'international': 'International',
};

/**
 * Generate JSON-LD structured data for SEO
 */
function generateJsonLd(hotlines: Hotline[]) {
  const usHotlines = hotlines.filter((h) => !h.coverage.some((c) => c.region === "INTL"));

  const itemListElement = usHotlines.map((hotline, index) => {
    const orgSchema: any = {
      "@type": "Organization",
      "@id": `https://heypsych.com/crisis/${hotline.id}`,
      name: hotline.name,
      url: hotline.actions.site_url || hotline.org.url,
      description: hotline.summary,
    };

    // Add contact points if available
    const callNumbers = hotline.contacts
      .flatMap((c) => c.channels.call || [])
      .filter((c) => c.value);

    if (callNumbers.length > 0) {
      orgSchema.contactPoint = callNumbers.map((call) => ({
        "@type": "ContactPoint",
        telephone: call.value,
        contactType: "Crisis Hotline",
        areaServed: "US",
        availableLanguage: hotline.actions.site_url ? "en" : undefined,
      }));
    }

    return {
      "@type": "ListItem",
      position: index + 1,
      item: orgSchema,
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "A-Z Specialized Crisis Hotlines",
    description:
      "Comprehensive directory of specialized crisis hotlines for LGBTQ+ individuals, veterans, domestic violence survivors, and other specific communities.",
    numberOfItems: usHotlines.length,
    itemListElement,
  };
}

export function CrisisAtoZSection({ hotlines }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const jsonLd = useMemo(() => generateJsonLd(hotlines), [hotlines]);

  // Separate US and International hotlines
  const { usHotlines, internationalHotlines } = useMemo(() => {
    const us: Hotline[] = [];
    const intl: Hotline[] = [];

    for (const hotline of hotlines) {
      const isInternational = hotline.coverage.some((c) => c.region === "INTL");
      if (isInternational) {
        intl.push(hotline);
      } else {
        us.push(hotline);
      }
    }

    return { usHotlines: us, internationalHotlines: intl };
  }, [hotlines]);

  // Get available categories with counts
  const categories = useMemo(() => {
    const categoryCounts = new Map<string, number>();

    usHotlines.forEach((hotline) => {
      (hotline.categories || []).forEach((cat) => {
        if (cat !== 'international') {
          categoryCounts.set(cat, (categoryCounts.get(cat) || 0) + 1);
        }
      });
    });

    // Add International category with count
    if (internationalHotlines.length > 0) {
      categoryCounts.set('international', internationalHotlines.length);
    }

    return Array.from(categoryCounts.entries())
      .map(([id, count]) => ({
        id,
        label: CATEGORY_LABELS[id] || id,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  }, [usHotlines, internationalHotlines]);

  // Apply fuzzy search to US hotlines
  const searchFilteredUS = useFuzzySearch(usHotlines, searchQuery);

  // Apply category filter and determine what to show
  const { filteredHotlines, showInternationalSection } = useMemo(() => {
    // If "International" category is selected, show only international hotlines
    if (selectedCategory === 'international') {
      const filtered = internationalHotlines.filter((hotline) => {
        if (!searchQuery) return true;
        const searchLower = searchQuery.toLowerCase();
        return (
          hotline.name.toLowerCase().includes(searchLower) ||
          hotline.summary.toLowerCase().includes(searchLower)
        );
      });
      return { filteredHotlines: filtered, showInternationalSection: false };
    }

    // Apply specialized category filter (if selected) to US hotlines
    const filtered = selectedCategory
      ? searchFilteredUS.filter((h) => h.categories?.includes(selectedCategory))
      : searchFilteredUS;

    // Show international section only when "All" is selected (no category filter)
    return {
      filteredHotlines: filtered,
      showInternationalSection: !selectedCategory && internationalHotlines.length > 0
    };
  }, [searchFilteredUS, internationalHotlines, searchQuery, selectedCategory]);

  return (
    <>
      {/* JSON-LD Structured Data for SEO */}
      <Script
        id="crisis-hotlines-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="space-y-8">
        {/* Section Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="mb-4 text-2xl font-bold text-slate-900">
            Specialized Crisis Hotlines
          </h2>
          <p className="mb-6 text-slate-600">
            Find specialized support for specific communities, situations, and needs. All hotlines
            are free and confidential.
          </p>
        </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <CrisisCategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />
      </motion.div>

      {/* Search Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <CrisisSearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          resultCount={filteredHotlines.length}
        />
      </motion.div>

      {/* Hotlines List */}
      {filteredHotlines.length > 0 ? (
        <div className="space-y-4">
          {filteredHotlines.map((hotline, index) => (
            <motion.div
              key={hotline.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * Math.min(index, 10) }}
            >
              <CrisisCard hotline={hotline} />
            </motion.div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-slate-600">
            <p className="mb-2 text-lg font-medium">No hotlines found</p>
            <p className="text-sm">
              {searchQuery
                ? `No results for "${searchQuery}". Try different keywords or clear filters.`
                : selectedCategory === 'international'
                ? "No international hotlines match your search. Try clearing the search."
                : selectedCategory
                ? "No hotlines in this category. Try selecting a different category."
                : "No hotlines available."}
            </p>
          </CardContent>
        </Card>
      )}

        {/* International Section - Only show when "All" is selected */}
        {showInternationalSection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="mb-4 text-2xl font-bold text-slate-900">International Support</h2>
            <InternationalToggle hotlines={internationalHotlines} />
          </motion.div>
        )}
      </div>
    </>
  );
}
