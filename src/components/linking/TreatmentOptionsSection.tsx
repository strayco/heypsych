"use client";

/**
 * Treatment Options Section
 *
 * Renders treatment links organized by category (medications, therapy, etc.).
 * Takes structured link data, no embedded linking logic.
 */

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Heart, Pill, MessageCircle, Zap, Sparkles } from 'lucide-react';
import type { CandidateLink } from '@/lib/linking/types';

interface TreatmentOptionsSectionProps {
  /** Treatment links */
  links: CandidateLink[];

  /** Section title (optional, defaults to "Treatment Options") */
  title?: string;

  /** Group by category */
  groupByCategory?: boolean;

  /** Maximum links to display per category */
  maxPerCategory?: number;
}

export function TreatmentOptionsSection({
  links,
  title = 'Treatment Options',
  groupByCategory = true,
  maxPerCategory = 10,
}: TreatmentOptionsSectionProps) {
  // Filter to only treatment-related links
  const treatmentLinks = links.filter(
    (link) =>
      link.linkType === 'condition_to_treatment' ||
      link.targetType === 'medication' ||
      link.targetType === 'therapy' ||
      link.targetType === 'treatment'
  );

  // Nothing to render
  if (treatmentLinks.length === 0) {
    return null;
  }

  if (!groupByCategory) {
    return renderSimpleList(treatmentLinks, title);
  }

  // Group by category
  const byCategory = groupTreatmentsByCategory(treatmentLinks);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-green-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {byCategory.medications.length > 0 && (
            <CategoryGroup
              title="Medications"
              icon={<Pill className="h-4 w-4" />}
              links={byCategory.medications.slice(0, maxPerCategory)}
              baseColor="blue"
            />
          )}

          {byCategory.therapy.length > 0 && (
            <CategoryGroup
              title="Psychotherapy"
              icon={<MessageCircle className="h-4 w-4" />}
              links={byCategory.therapy.slice(0, maxPerCategory)}
              baseColor="purple"
            />
          )}

          {byCategory.interventional.length > 0 && (
            <CategoryGroup
              title="Interventional"
              icon={<Zap className="h-4 w-4" />}
              links={byCategory.interventional.slice(0, maxPerCategory)}
              baseColor="orange"
            />
          )}

          {byCategory.alternative.length > 0 && (
            <CategoryGroup
              title="Alternative & Complementary"
              icon={<Sparkles className="h-4 w-4" />}
              links={byCategory.alternative.slice(0, maxPerCategory)}
              baseColor="green"
            />
          )}

          {byCategory.other.length > 0 && (
            <CategoryGroup
              title="Other Treatments"
              icon={<Heart className="h-4 w-4" />}
              links={byCategory.other.slice(0, maxPerCategory)}
              baseColor="gray"
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function CategoryGroup({
  title,
  icon,
  links,
  baseColor,
}: {
  title: string;
  icon: React.ReactNode;
  links: CandidateLink[];
  baseColor: string;
}) {
  return (
    <div>
      <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-900">
        {icon}
        {title}
      </h4>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {links.map((link, index) => (
          <Link
            key={`${link.targetSlug}-${index}`}
            href={`/treatments/${link.targetSlug}`}
            className={`group block rounded-lg border border-${baseColor}-200 bg-${baseColor}-50 p-3 transition-all hover:border-${baseColor}-400 hover:bg-${baseColor}-100`}
          >
            <span className={`text-sm font-medium text-${baseColor}-900 group-hover:text-${baseColor}-700`}>
              {link.anchorOptions[0]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function renderSimpleList(links: CandidateLink[], title: string) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-green-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {links.map((link, index) => (
              <Link
                key={`${link.targetSlug}-${index}`}
                href={`/treatments/${link.targetSlug}`}
                className="group block rounded-lg border border-neutral-200 bg-neutral-50 p-3 transition-all hover:border-blue-300 hover:bg-blue-50"
              >
                <span className="text-sm font-medium text-neutral-900 group-hover:text-blue-700">
                  {link.anchorOptions[0]}
                </span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function groupTreatmentsByCategory(links: CandidateLink[]): {
  medications: CandidateLink[];
  therapy: CandidateLink[];
  interventional: CandidateLink[];
  alternative: CandidateLink[];
  other: CandidateLink[];
} {
  const groups = {
    medications: [] as CandidateLink[],
    therapy: [] as CandidateLink[],
    interventional: [] as CandidateLink[],
    alternative: [] as CandidateLink[],
    other: [] as CandidateLink[],
  };

  for (const link of links) {
    const category = link.metadata?.category || link.targetType;

    if (category === 'medication' || link.targetType === 'medication') {
      groups.medications.push(link);
    } else if (category === 'therapy' || link.targetType === 'therapy') {
      groups.therapy.push(link);
    } else if (category === 'interventional' || link.targetType === 'interventional') {
      groups.interventional.push(link);
    } else if (
      category === 'alternative' ||
      category === 'supplement' ||
      link.targetType === 'alternative' ||
      link.targetType === 'supplement'
    ) {
      groups.alternative.push(link);
    } else {
      groups.other.push(link);
    }
  }

  return groups;
}
