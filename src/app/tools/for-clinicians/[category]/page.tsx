// src/app/tools/for-clinicians/[category]/page.tsx
// Category hub page for V4 clinician tool categories
// Dynamic route that renders each of the 15 V4 categories

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  ArrowRight,
  ArrowLeft,
  Laptop,
  Mic,
  Receipt,
  Video,
  Network,
  LineChart,
  Pill,
  BadgeCheck,
  Heart,
  Brain,
  Calendar,
  ShieldCheck,
  BarChart3,
  Users,
  Sparkles,
  GitCompare,
  Filter,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { TrustSignal } from "../../_components/TrustSignal";
import { VendorCTA } from "../../_components/VendorCTA";
import { HubFAQ } from "@/components/tools/hubs";
import {
  ClinicianToolCard,
  ClinicianFilters,
  CategoryGrid,
} from "@/components/tools/clinician";
import {
  ClinicianToolService,
  type ClinicianToolV4,
} from "@/lib/tools/clinician-tool-service";
import clinicianCategoriesData from "../../../../../data/tools-v4/taxonomies/clinician-categories.json";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { isComplianceConfirmedYes } from "@/lib/schemas/tool-editorial";

// Types
interface CategoryPageProps {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Icon mapping for V4 categories
const categoryIcons: Record<string, LucideIcon> = {
  "ehr-practice-management": Laptop,
  "ai-scribe-documentation": Mic,
  "billing-rcm": Receipt,
  "telehealth-communication": Video,
  "provider-networks": Network,
  "measurement-outcomes": LineChart,
  "prescribing-erx": Pill,
  "credentialing-workforce": BadgeCheck,
  "patient-engagement": Heart,
  "clinical-decision-support": Brain,
  "scheduling-intake": Calendar,
  "compliance-security": ShieldCheck,
  "analytics-reporting": BarChart3,
  "care-coordination": Users,
  "digital-therapeutics": Sparkles,
};

// Color mapping for V4 categories
const categoryColors: Record<string, string> = {
  "ehr-practice-management": "bg-blue-500/10 text-blue-600 border-blue-200",
  "ai-scribe-documentation": "bg-purple-500/10 text-purple-600 border-purple-200",
  "billing-rcm": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "telehealth-communication": "bg-cyan-500/10 text-cyan-600 border-cyan-200",
  "provider-networks": "bg-indigo-500/10 text-indigo-600 border-indigo-200",
  "measurement-outcomes": "bg-emerald-500/10 text-emerald-600 border-emerald-200",
  "prescribing-erx": "bg-red-500/10 text-red-600 border-red-200",
  "credentialing-workforce": "bg-amber-500/10 text-amber-600 border-amber-200",
  "patient-engagement": "bg-pink-500/10 text-pink-600 border-pink-200",
  "clinical-decision-support": "bg-blue-500/10 text-blue-600 border-blue-200",
  "scheduling-intake": "bg-orange-500/10 text-orange-600 border-orange-200",
  "compliance-security": "bg-slate-500/10 text-slate-600 border-slate-200",
  "analytics-reporting": "bg-violet-500/10 text-violet-600 border-violet-200",
  "care-coordination": "bg-sky-500/10 text-sky-600 border-sky-200",
  "digital-therapeutics": "bg-pink-500/10 text-pink-600 border-pink-200",
};

// Get category from slug
function getCategoryBySlug(slug: string) {
  return clinicianCategoriesData.categories.find((cat) => cat.slug === slug);
}

// Generate static params for all 15 categories
export async function generateStaticParams() {
  return clinicianCategoriesData.categories.map((cat) => ({
    category: cat.slug,
  }));
}

// Generate metadata
export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    return {
      title: "Category Not Found | HeyPsych",
    };
  }

  // Check if category has any tools
  const tools = await ClinicianToolService.getByCategory(categorySlug);
  const hasTools = tools.length > 0;

  // Use canonical URL without trailing slash
  const canonicalUrl = `${siteConfig.url}${category.url}`.replace(/\/$/, "");

  return {
    title: category.seo_title,
    description: category.meta_description,
    // noindex empty categories to prevent thin content indexation
    robots: hasTools ? undefined : { index: false, follow: true },
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: category.seo_title,
      description: category.meta_description,
      url: canonicalUrl,
      type: "website",
    },
  };
}

export default async function CategoryHubPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { category: categorySlug } = await params;
  const searchParamsResolved = await searchParams;
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  // Load tools for this category
  const allCategoryTools = await ClinicianToolService.getByCategory(categorySlug);

  // Apply filters from search params
  const filteredTools = applyFilters(allCategoryTools, searchParamsResolved);

  // Get comparison candidates (top tools for comparison)
  const comparisonCandidates = await ClinicianToolService.getComparisonCandidates(
    categorySlug,
    4
  );

  // Get related categories
  const relatedCategories = getRelatedCategories(categorySlug);

  // Get icon and color
  const Icon = categoryIcons[categorySlug] || Laptop;
  const colorClass = categoryColors[categorySlug] || "bg-gray-500/10 text-gray-600";

  // Generate structured data
  const structuredData = generateCategoryStructuredData(
    category,
    allCategoryTools
  );

  return (
    <>
      {/* Structured Data */}
      {structuredData.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="min-h-screen bg-canvas">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-surface border-b border-separator">
          <div className="absolute inset-0 bg-gradient-to-br from-treatment/3 via-transparent to-accent/2" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm">
              <Link
                href="/tools/"
                className="text-label-secondary hover:text-treatment transition-colors"
              >
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <Link
                href="/tools/for-clinicians/"
                className="text-label-secondary hover:text-treatment transition-colors"
              >
                For Clinicians
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">
                {category.short_name || category.display_name}
              </span>
            </nav>

            <div className="flex items-center gap-4 mb-4">
              <div
                className={cn(
                  "flex h-14 w-14 items-center justify-center rounded-2xl border",
                  colorClass
                )}
              >
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl">
                  {category.display_name}
                </h1>
                <p className="mt-1 text-sm text-label-tertiary">
                  {allCategoryTools.length} tools in this category
                </p>
              </div>
            </div>

            {/* Direct Answer Block */}
            <div className="mt-4 rounded-xl border border-treatment/20 bg-treatment/5 p-5">
              <p className="text-lg text-label-primary leading-relaxed">
                {category.direct_answer}
              </p>
            </div>

            <p className="mt-4 max-w-3xl text-label-secondary">
              {category.intro}
            </p>
          </div>
        </section>

        {/* EHR Matcher CTA (only for EHR category) */}
        {categorySlug === "ehr-practice-management" && (
          <section className="border-b border-separator bg-canvas px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-accent/20 bg-accent/5 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                    <Sparkles className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-label-primary text-lg">
                      Find Your EHR Match
                    </p>
                    <p className="text-sm text-label-secondary">
                      Answer 7 quick questions to find the best EHR for your practice
                    </p>
                  </div>
                </div>
                <Link
                  href="/tools/for-clinicians/ehr-practice-management/match/"
                  className="group flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-accent-hover"
                >
                  Start Matching
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Comparison CTA */}
        {comparisonCandidates.length >= 2 && (
          <section className="border-b border-separator bg-canvas px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="flex items-center justify-between rounded-xl border border-treatment/20 bg-treatment/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-treatment/10">
                    <GitCompare className="h-5 w-5 text-treatment" />
                  </div>
                  <div>
                    <p className="font-medium text-label-primary">
                      Compare {category.short_name || category.display_name}
                    </p>
                    <p className="text-sm text-label-secondary">
                      Side-by-side comparison of top{" "}
                      {comparisonCandidates.length} tools
                    </p>
                  </div>
                </div>
                <Link
                  href={`/tools/compare/?tools=${comparisonCandidates.map(t => t.slug).join(",")}`}
                  className="group flex items-center gap-2 rounded-lg bg-treatment px-4 py-2 text-sm font-medium text-white transition-all hover:bg-treatment-600"
                >
                  Compare tools
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Subcategories (if any) */}
        {category.subcategories && category.subcategories.length > 0 && (
          <section className="border-b border-separator bg-surface px-4 py-8 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-lg font-semibold text-label-primary">
                Browse by Type
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {category.subcategories.map((sub) => (
                  <Link
                    key={sub.slug}
                    href={`/tools/for-clinicians/${categorySlug}/?subcategory=${sub.slug}`}
                    scroll={false}
                    className="rounded-lg border border-separator bg-canvas px-4 py-2 text-sm font-medium text-label-secondary transition-all hover:border-treatment/30 hover:text-treatment"
                  >
                    {sub.display_name}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Filters + Tool Grid */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            {/* Filter Bar */}
            <Suspense fallback={<div className="h-16 animate-pulse bg-surface rounded-xl" />}>
              <ClinicianFilters
                category={categorySlug}
                totalCount={allCategoryTools.length}
                filteredCount={filteredTools.length}
              />
            </Suspense>

            {/* Tool Grid */}
            <div className="mt-6">
              {filteredTools.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredTools.map((tool) => (
                    <ClinicianToolCard key={tool.slug} tool={tool} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Filter className="mx-auto h-12 w-12 text-label-quaternary" />
                  <h3 className="mt-4 text-lg font-semibold text-label-primary">
                    No tools match your filters
                  </h3>
                  <p className="mt-2 text-label-secondary">
                    Try adjusting your filters or{" "}
                    <Link
                      href={`/tools/for-clinicians/${categorySlug}/`}
                      className="text-treatment hover:underline"
                    >
                      clear all filters
                    </Link>
                  </p>
                </div>
              )}
            </div>

            {/* Pagination placeholder - implement when needed */}
            {filteredTools.length > 12 && (
              <div className="mt-8 flex justify-center">
                <p className="text-sm text-label-tertiary">
                  Showing all {filteredTools.length} tools
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Category FAQs */}
        {category.faqs && category.faqs.length > 0 && (
          <HubFAQ faqs={category.faqs} hubName={category.display_name} />
        )}

        {/* Related Categories */}
        {relatedCategories.length > 0 && (
          <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-xl font-semibold text-label-primary">
                Related Categories
              </h2>
              <p className="mt-1 text-sm text-label-secondary">
                Explore other tools that work well with {category.short_name}
              </p>

              <div className="mt-6">
                <CategoryGrid categories={relatedCategories} variant="compact" />
              </div>
            </div>
          </section>
        )}

        {/* Trust Signal */}
        <TrustSignal />

        {/* Back to All Categories */}
        <section className="bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Link
              href="/tools/for-clinicians/"
              className="group inline-flex items-center gap-2 text-sm font-medium text-treatment hover:text-treatment-600"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Back to all clinician categories
            </Link>
          </div>
        </section>

        {/* Vendor CTA */}
        <VendorCTA />
      </div>
    </>
  );
}

// Subcategory to filter mapping
const SUBCATEGORY_FILTERS: Record<string, (tool: ClinicianToolV4) => boolean> = {
  // EHR subcategories → organization_sizes
  "ehr-solo-practice": (t) =>
    t.audiences?.organization_sizes?.includes("solo") ?? false,
  "ehr-group-practice": (t) =>
    (t.audiences?.organization_sizes?.includes("small-2-10") ||
     t.audiences?.organization_sizes?.includes("medium-11-50")) ?? false,
  "ehr-enterprise": (t) =>
    (t.audiences?.organization_sizes?.includes("large-51-200") ||
     t.audiences?.organization_sizes?.includes("enterprise-200-plus")) ?? false,
  // Note: "practice-management-only" has no reliable filter - falls through to show all tools

  // AI Scribe subcategories → capabilities/feature_flags
  "ambient-scribes": (t) =>
    t.capabilities?.includes("ambient-listening") ?? false,
  "dictation-transcription": (t) =>
    t.capabilities?.includes("voice-transcription") ?? false,
  "note-assistants": (t) =>
    t.capabilities?.includes("note-generation") ?? false,

  // Telehealth subcategories
  "video-platforms": (t) =>
    t.feature_flags?.has_telehealth ?? false,
  "secure-messaging": (t) =>
    t.capabilities?.includes("secure-messaging") ?? false,

  // Provider networks subcategories → use RCM flag as proxy
  "insurance-enablers": (t) =>
    t.feature_flags?.has_rcm ?? false,

  // Measurement/DTx subcategories
  "mbc-platforms": (t) =>
    t.feature_flags?.has_measurement ?? false,

  // Prescribing subcategories
  "eprescribing-platforms": (t) =>
    t.feature_flags?.has_e_prescribing ?? false,
};

// Apply filters from search params
function applyFilters(
  tools: ClinicianToolV4[],
  searchParams: { [key: string]: string | string[] | undefined }
): ClinicianToolV4[] {
  let filtered = [...tools];

  const priceRange = searchParams.priceRange as string | undefined;
  const practiceSize = searchParams.practiceSize as string | undefined;
  const features = (searchParams.features as string)?.split(",").filter(Boolean) || [];
  const subcategory = searchParams.subcategory as string | undefined;

  if (priceRange) {
    filtered = filtered.filter((t) => t.pricing?.price_range === priceRange);
  }

  if (practiceSize) {
    filtered = filtered.filter((t) =>
      t.audiences?.organization_sizes?.includes(
        practiceSize as "solo" | "small-2-10" | "medium-11-50" | "large-51-200" | "enterprise-200-plus"
      ) ?? false
    );
  }

  // P0 FIX: Use proper compliance checking, not JavaScript truthiness
  // "unknown" is truthy but should NOT pass HIPAA/BAA filters
  if (features.includes("hipaa")) {
    filtered = filtered.filter((t) => isComplianceConfirmedYes(t.compliance.hipaa_support));
  }

  if (features.includes("baa")) {
    filtered = filtered.filter((t) => isComplianceConfirmedYes(t.compliance.baa_available));
  }

  if (features.includes("ai")) {
    filtered = filtered.filter((t) => t.feature_flags.has_ai);
  }

  if (features.includes("telehealth")) {
    filtered = filtered.filter((t) => t.feature_flags.has_telehealth);
  }

  if (features.includes("free-tier")) {
    filtered = filtered.filter((t) => t.pricing?.free_tier);
  }

  if (features.includes("e-prescribing")) {
    filtered = filtered.filter((t) => t.feature_flags.has_e_prescribing);
  }

  // Apply subcategory filter if defined
  if (subcategory && SUBCATEGORY_FILTERS[subcategory]) {
    filtered = filtered.filter(SUBCATEGORY_FILTERS[subcategory]);
  }

  return filtered;
}

// Get related categories based on category mappings
function getRelatedCategories(currentSlug: string) {
  // Related category mapping from category-mappings.json structure
  const relatedMap: Record<string, string[]> = {
    "ehr-practice-management": [
      "scheduling-intake",
      "billing-rcm",
      "telehealth-communication",
    ],
    "ai-scribe-documentation": [
      "ehr-practice-management",
      "clinical-decision-support",
    ],
    "billing-rcm": ["ehr-practice-management", "credentialing-workforce"],
    "telehealth-communication": [
      "ehr-practice-management",
      "patient-engagement",
    ],
    "provider-networks": ["credentialing-workforce", "billing-rcm"],
    "measurement-outcomes": ["patient-engagement", "analytics-reporting"],
    "prescribing-erx": ["ehr-practice-management", "clinical-decision-support"],
    "credentialing-workforce": ["provider-networks", "billing-rcm"],
    "patient-engagement": ["measurement-outcomes", "digital-therapeutics"],
    "clinical-decision-support": [
      "ai-scribe-documentation",
      "prescribing-erx",
    ],
    "scheduling-intake": ["ehr-practice-management", "patient-engagement"],
    "compliance-security": ["ehr-practice-management", "telehealth-communication"],
    "analytics-reporting": ["measurement-outcomes", "billing-rcm"],
    "care-coordination": ["telehealth-communication", "ehr-practice-management"],
    "digital-therapeutics": ["patient-engagement", "measurement-outcomes"],
  };

  const relatedSlugs = relatedMap[currentSlug] || [];

  return relatedSlugs.map((slug) => {
    const cat = getCategoryBySlug(slug);
    return {
      slug,
      display_name: cat?.display_name || slug,
      short_name: cat?.short_name,
      url: cat?.url || `/tools/for-clinicians/${slug}/`,
      count: 0, // Would need async count
      intro: cat?.intro,
    };
  });
}

// Generate structured data for category page
function generateCategoryStructuredData(
  category: (typeof clinicianCategoriesData.categories)[0],
  tools: ClinicianToolV4[]
): object[] {
  const schemas: object[] = [];

  // BreadcrumbList
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Tools",
        item: `${siteConfig.url}/tools/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "For Clinicians",
        item: `${siteConfig.url}/tools/for-clinicians/`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: category.display_name,
        item: `${siteConfig.url}${category.url}`,
      },
    ],
  });

  // FAQPage
  if (category.faqs && category.faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: category.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    });
  }

  // ItemList for tools
  if (tools.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${category.display_name} Tools`,
      numberOfItems: tools.length,
      itemListElement: tools.slice(0, 10).map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: tool.name,
        url: `${siteConfig.url}/tools/for-clinicians/${category.slug}/${tool.slug}/`,
      })),
    });
  }

  // WebPage
  schemas.push({
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: category.seo_title,
    description: category.meta_description,
    url: `${siteConfig.url}${category.url}`,
    isPartOf: {
      "@type": "WebSite",
      name: siteConfig.name,
      url: siteConfig.url,
    },
    about: {
      "@type": "Thing",
      name: category.display_name,
      description: category.intro,
    },
  });

  return schemas;
}

export const revalidate = 3600; // 1 hour
