"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import type { AccessType, Resource } from "@/lib/types/support-community";

interface OrganizationResource extends Resource {
  website?: string;
  categories?: string[];
  metadata?: {
    conditions?: string[];
    [key: string]: any;
  };
}

interface Props {
  organizations: OrganizationResource[];
  page?: number;
}

const ITEMS_PER_PAGE = 30;

// Category label mappings
const CATEGORY_LABELS: Record<string, string> = {
  'anxiety': 'Anxiety',
  'depression': 'Depression',
  'bipolar': 'Bipolar',
  'mood-disorders': 'Mood Disorders',
  'ocd': 'OCD',
  'trauma': 'Trauma / PTSD',
  'psychosis': 'Psychosis',
  'schizophrenia': 'Schizophrenia',
  'eating-disorders': 'Eating Disorders',
  'addiction': 'Addiction',
  'substance-use': 'Substance Use',
  'recovery': 'Recovery',
  'lgbtq+': 'LGBTQ+',
  'bipoc': 'BIPOC',
  'identity': 'Identity',
  'faith-based': 'Faith-Based',
  'youth': 'Youth',
  'students': 'Students',
  'family': 'Family',
  'caregivers': 'Caregivers',
  'mental-health': 'Mental Health',
  'suicide-prevention': 'Suicide Prevention',
  'support-groups': 'Support Groups',
  'peer-support': 'Peer Support',
  'panic': 'Panic',
};

const ACCESS_LABELS: Record<AccessType, string> = {
  hotline: "Hotline",
  text: "Text",
  chat: "Live Chat",
  online: "Online",
  "in-person": "In Person",
};

const GENERIC_CATEGORY_IDS = new Set([
  "support-groups",
  "peer-support",
  "mental-health",
  "identity",
  "support-community",
]);

const GENERIC_KEYWORD_TERMS = new Set([
  "support",
  "support group",
  "support groups",
  "group",
  "community",
  "mental health",
  "mental-health",
  "wellness",
  "resource",
  "resources",
  "program",
  "programs",
  "education",
  "info",
  "information",
  "treatment",
  "therapy",
]);

const TAG_FILTERS = [
  {
    id: "addiction",
    label: "Addiction & Recovery",
    matchers: ["addiction", "substance use", "substance-use", "alcohol", "alcohol use", "drug use", "recovery"],
  },
  {
    id: "anxiety",
    label: "Anxiety & Panic",
    matchers: ["anxiety", "panic"],
  },
  {
    id: "depression",
    label: "Depression & Mood",
    matchers: ["depression", "mood"],
  },
  {
    id: "ocd",
    label: "OCD & Related",
    matchers: ["ocd", "body focused", "hoarding", "bfrb"],
  },
  {
    id: "ptsd",
    label: "Trauma & PTSD",
    matchers: ["ptsd", "trauma"],
  },
  {
    id: "adhd",
    label: "ADHD & Neurodiversity",
    matchers: ["adhd", "add", "autism", "asd", "asperger", "neurodiversity"],
  },
  {
    id: "eating",
    label: "Eating Disorders",
    matchers: ["eating disorder", "anorexia", "bulimia", "binge eating"],
  },
  {
    id: "youth",
    label: "Youth & Students",
    matchers: ["youth", "student", "college"],
  },
  {
    id: "family",
    label: "Family & Caregivers",
    matchers: ["family", "caregiver", "parents"],
  },
  {
    id: "lgbtq",
    label: "LGBTQ+",
    matchers: ["lgbtq", "lgbtq+", "queer", "trans"],
  },
  {
    id: "bipoc",
    label: "BIPOC & Identity",
    matchers: ["bipoc", "latinx", "identity", "hispanic"],
  },
  {
    id: "faith",
    label: "Faith-Based",
    matchers: ["faith", "faith-based"],
  },
  {
    id: "suicide",
    label: "Suicide Prevention",
    matchers: ["suicide prevention", "suicide"],
  },
  {
    id: "perinatal",
    label: "Perinatal & Postpartum",
    matchers: ["postpartum", "perinatal", "maternal"],
  },
  {
    id: "psychosis",
    label: "Psychosis & Schizophrenia",
    matchers: ["psychosis", "schizo", "schizophrenia"],
  },
] as const;

const TAG_FILTER_LOOKUP = TAG_FILTERS.reduce<Record<string, (typeof TAG_FILTERS)[number]>>(
  (acc, filter) => {
    acc[filter.id] = filter;
    return acc;
  },
  {}
);

const CONDITION_KEYWORD_PATTERNS = [
  "adhd",
  "add",
  "autism",
  "asd",
  "anxiety",
  "panic",
  "depression",
  "bipolar",
  "ocd",
  "ptsd",
  "trauma",
  "substance",
  "alcohol",
  "addiction",
  "suicide",
  "psychosis",
  "schizo",
  "eating",
  "grief",
  "loss",
];

function formatTagLabel(tag: string) {
  const trimmed = tag.trim();
  if (!trimmed) return "";
  if (/^[A-Z0-9+]+$/.test(trimmed)) {
    return trimmed;
  }
  if (/^[a-z0-9+]+$/.test(trimmed) && trimmed.length <= 6) {
    return trimmed.toUpperCase();
  }
  return trimmed
    .split(/[-_/]/)
    .map((segment) =>
      segment
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    )
    .join(" ");
}

function isConditionKeyword(keyword: string) {
  const normalized = keyword.trim().toLowerCase();
  if (!normalized || GENERIC_KEYWORD_TERMS.has(normalized)) {
    return false;
  }
  return CONDITION_KEYWORD_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function escapeRegExp(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getOrganizationTags(organization: OrganizationResource): string[] {
  const defaultFallback = organization.subcategory || organization.category || "Community Support";
  const normalizedDefault = defaultFallback.trim().toLowerCase();
  const fallbackLabel = normalizedDefault === "support-community" ? "" : defaultFallback;

  const baseTagLabels =
    organization.tags?.map((tag) => formatTagLabel(tag)).filter(Boolean) || [];

  const categoryTags =
    organization.categories
      ?.filter((cat) => !GENERIC_CATEGORY_IDS.has(cat))
      .map((cat) => CATEGORY_LABELS[cat] || formatTagLabel(cat)) || [];

  const metadataConditionTags =
    organization.metadata?.conditions?.map((condition) => formatTagLabel(condition)) || [];

  const keywordConditionTags =
    organization.keywords
      ?.filter(isConditionKeyword)
      .map((keyword) => formatTagLabel(keyword)) || [];

  const tagCandidates = [
    ...baseTagLabels,
    ...categoryTags,
    ...metadataConditionTags,
    ...keywordConditionTags,
    ...(fallbackLabel ? [fallbackLabel] : []),
  ];

  const seen = new Set<string>();
  const tags: string[] = [];

  tagCandidates.forEach((tag) => {
    const normalized = tag.trim();
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    tags.push(normalized);
  });

  if (tags.length === 0) {
    tags.push("Community Support");
  }

  return tags;
}

function tagMatches(tag: string, matcher: string): boolean {
  const pattern = new RegExp(`\\b${escapeRegExp(matcher)}\\b`, "i");
  return pattern.test(tag);
}

function doesOrganizationMatchFilter(organization: OrganizationResource, filterId: string): boolean {
  const filter = TAG_FILTER_LOOKUP[filterId];
  if (!filter) return false;
  const tags = getOrganizationTags(organization);
  return tags.some((tag) => filter.matchers.some((matcher) => tagMatches(tag, matcher)));
}

interface TagFilterProps {
  tags: Array<{ id: string; label: string; count: number }>;
  selectedTag: string | null;
  onSelectTag: (tagId: string | null) => void;
}

function TagFilter({ tags, selectedTag, onSelectTag }: TagFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelectTag(null)}
        className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
          selectedTag === null
            ? "bg-accent text-white shadow-md"
            : "bg-surface-grouped text-label-secondary hover:bg-fill-secondary"
        }`}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => onSelectTag(tag.id)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
            selectedTag === tag.id
              ? "bg-accent text-white shadow-md"
              : "bg-surface-grouped text-label-secondary hover:bg-fill-secondary"
          }`}
        >
          {tag.label}
          <span className="ml-1.5 text-xs opacity-75">({tag.count})</span>
        </button>
      ))}
    </div>
  );
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
}

function SearchInput({ value, onChange, resultCount }: SearchInputProps) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        placeholder="Search organizations by name, condition, or focus..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-separator px-4 py-3 text-label-primary placeholder:text-label-quaternary focus:border-accent-500 focus:outline-none focus:ring-2 focus:ring-accent-900/40"
        aria-label="Search organizations"
      />
      {value && (
        <p className="text-sm text-label-primary" role="status" aria-live="polite">
          Found {resultCount} {resultCount === 1 ? "organization" : "organizations"}
        </p>
      )}
    </div>
  );
}

interface OrganizationCardProps {
  organization: OrganizationResource;
}

function OrganizationCard({ organization }: OrganizationCardProps) {
  const tags = getOrganizationTags(organization);
  const [primaryPillLabel = organization.subcategory || organization.category || "Community Support", ...secondaryTags] =
    tags;
  const accessLabels =
    organization.access && organization.access.length
      ? organization.access.map((access) => ACCESS_LABELS[access] || formatTagLabel(access))
      : [];
  const websiteUrl = organization.url || organization.website || null;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-label-primary">{organization.name}</h3>
            <span className="inline-flex items-center rounded-full bg-surface-grouped px-3 py-1 text-xs font-semibold text-label-secondary">
              {primaryPillLabel}
            </span>
          </div>

          {/* Description */}
          <p className="text-label-primary">{organization.description}</p>

          {/* Tags/Labels */}
          <div className="flex flex-wrap gap-2">
            {accessLabels.map((access) => (
              <span
                key={access}
                className="rounded-full bg-accent-tint px-3 py-1 text-xs font-medium text-accent-700"
              >
                {access}
              </span>
            ))}
            {secondaryTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-positive-tint px-3 py-1 text-xs font-medium text-positive-700"
              >
                {tag}
              </span>
            ))}
            {organization.regions?.includes("INTL") && (
              <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-purple-700">
                International
              </span>
            )}
          </div>

          {/* Contact Info */}
          <div className="space-y-2 border-t border-separator pt-4">
            {organization.phones?.map((phone, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="font-medium text-label-secondary">{phone.label}:</span>
                <a
                  href={`tel:${phone.number}`}
                  className="text-accent hover:text-accent-700 hover:underline"
                >
                  {phone.number}
                </a>
              </div>
            ))}
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-label-secondary">Website:</span>
              {websiteUrl ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent-700 hover:underline"
                >
                  {websiteUrl.replace(/^https?:\/\/(www\.)?/, "")}
                </a>
              ) : (
                <span className="text-label-tertiary">Not provided</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function OrganizationsAtoZSection({ organizations, page = 1 }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Build tag list with curated filters
  const filterTags = TAG_FILTERS.map((filter) => {
    const count = organizations.reduce(
      (acc, org) => acc + (doesOrganizationMatchFilter(org, filter.id) ? 1 : 0),
      0
    );
    return {
      id: filter.id,
      label: filter.label,
      count,
    };
  }).filter((tag) => tag.count > 0);

  // Apply search + tag filters
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchFiltered = normalizedQuery
    ? organizations.filter((org) => {
        const tags = getOrganizationTags(org);
        return (
          org.name.toLowerCase().includes(normalizedQuery) ||
          org.description.toLowerCase().includes(normalizedQuery) ||
          org.organization?.toLowerCase().includes(normalizedQuery) ||
          org.subcategory?.toLowerCase().includes(normalizedQuery) ||
          tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
        );
      })
    : organizations;

  const filteredOrganizations = selectedTag
    ? searchFiltered.filter((org) => doesOrganizationMatchFilter(org, selectedTag))
    : searchFiltered;

  // Pagination logic
  const { paginatedOrganizations, totalPages } = useMemo(() => {
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginated = filteredOrganizations.slice(startIndex, endIndex);
    const total = Math.ceil(filteredOrganizations.length / ITEMS_PER_PAGE);
    return { paginatedOrganizations: paginated, totalPages: total };
  }, [filteredOrganizations, page]);

  return (
    <div className="space-y-8">
      {/* Section Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="mb-4 text-2xl font-bold text-label-primary">
          Mental Health Organizations & Support Groups
        </h2>
        <p className="mb-6 text-label-primary">
          Find peer support groups, advocacy organizations, and communities for specific conditions,
          identities, and life situations. All organizations offer free or low-cost support.
        </p>
      </motion.div>

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <TagFilter
          tags={filterTags}
          selectedTag={selectedTag}
          onSelectTag={setSelectedTag}
        />
      </motion.div>

      {/* Search Input */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          resultCount={filteredOrganizations.length}
        />
      </motion.div>

      {/* Organizations List */}
      {paginatedOrganizations.length > 0 ? (
        <>
          <div className="space-y-4">
            {paginatedOrganizations.map((org, index) => {
              const key = org.id ? `${org.id}-${index}` : `${org.name}-${index}`;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * Math.min(index, 10) }}
                >
                  <OrganizationCard organization={org} />
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8"
            >
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                baseUrl="/resources/support-community"
                tabParam="organizations"
              />
            </motion.div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-label-primary">
            <p className="mb-2 text-lg font-medium">No organizations found</p>
            <p className="text-sm">
              {searchQuery
                ? `No results for "${searchQuery}". Try different keywords or clear filters.`
                : selectedTag
                ? "No organizations in this category. Try selecting a different category."
                : "No organizations available."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
