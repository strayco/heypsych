/**
 * Counselor Software Landing Page
 *
 * High-intent SEO page targeting searches like:
 * - "best EHR for counselors"
 * - "software for LMHC"
 * - "counseling practice management software"
 * - "mental health counselor software"
 *
 * URL: /tools/for-counselors
 */

import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  MessageCircle,
  CheckCircle2,
  Users,
  FileText,
  Video,
  Receipt,
  Bot,
  BarChart3,
  Calendar,
  Shield,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import {
  SCHEMA_TO_TAXONOMY_CATEGORY,
} from "@/lib/schemas/clinician-tool-v4";
import { ClinicianToolCard } from "@/components/tools/clinician";
import { ContextualArchitectCTA } from "@/components/architect/ContextualArchitectCTA";

const CURRENT_YEAR = new Date().getFullYear();

// ============================================================================
// PAGE CONFIGURATION
// ============================================================================

const PAGE_CONFIG = {
  role: "therapist-lcsw-lmft" as const, // Counselors share the therapist role in our schema
  displayName: "Counselors",
  headline: "Best Software for Counselors",
  subheadline: "LMHC, LPC, NCC & Professional Counselors",
  description: `Find the best EHR, practice management, and telehealth software designed for counseling practices. Compare ${CURRENT_YEAR}'s top-rated tools with features tailored to LMHC, LPC, and professional counselors.`,
  seoTitle: `Best Software for Counselors (${CURRENT_YEAR}) | EHR & Practice Management`,
  seoDescription: `Compare the best EHR and practice management software for counselors in ${CURRENT_YEAR}. Expert recommendations for LMHC, LPC, and NCC professionals. HIPAA-compliant with transparent pricing.`,
  categories: [
    {
      slug: "ehr-practice-management",
      schemaCategory: "ehr-practice-management",
      name: "EHR & Practice Management",
      icon: FileText,
      description: "All-in-one platforms for scheduling, notes, and client management",
    },
    {
      slug: "telehealth-communication",
      schemaCategory: "telehealth-communication",
      name: "Telehealth & Video",
      icon: Video,
      description: "HIPAA-compliant video platforms for virtual counseling sessions",
    },
    {
      slug: "ai-scribe-documentation",
      schemaCategory: "ai-scribe-documentation",
      name: "AI Scribes & Documentation",
      icon: Bot,
      description: "AI-powered progress note generation and clinical documentation",
    },
    {
      slug: "billing-rcm",
      schemaCategory: "billing-rcm-insurance",
      name: "Billing & Insurance",
      icon: Receipt,
      description: "Claims submission, superbill generation, and payment processing",
    },
    {
      slug: "measurement-outcomes",
      schemaCategory: "measurement-outcomes-dtx",
      name: "Outcome Measurement",
      icon: BarChart3,
      description: "Standardized assessments and progress tracking tools",
    },
    {
      slug: "scheduling-intake",
      schemaCategory: "intake-scheduling-forms",
      name: "Scheduling & Intake",
      icon: Calendar,
      description: "Online booking, intake forms, and client self-service",
    },
  ],
  licenseTypes: [
    { code: "LMHC", name: "Licensed Mental Health Counselor" },
    { code: "LPC", name: "Licensed Professional Counselor" },
    { code: "LCPC", name: "Licensed Clinical Professional Counselor" },
    { code: "NCC", name: "National Certified Counselor" },
    { code: "LPCC", name: "Licensed Professional Clinical Counselor" },
  ],
  considerations: [
    "Look for note templates aligned with counseling models (CBT, DBT, person-centered, etc.)",
    "Ensure support for your specific license type and state requirements",
    "Check if the platform supports group counseling documentation",
    "Verify telehealth quality for reliable virtual sessions",
    "Consider integrated billing vs. separate billing service based on volume",
    "Look for client portal features for homework and between-session support",
  ],
  relatedPages: [
    { href: "/tools/for-therapists/", label: "Software for Therapists" },
    { href: "/tools/for-practices/solo-therapist/", label: "Solo Practice Software" },
    { href: `/tools/best/therapy-software-${CURRENT_YEAR}/`, label: `Best Therapy Software ${CURRENT_YEAR}` },
    { href: "/tools/compare/simplepractice-vs-theranest/", label: "SimplePractice vs TheraNest" },
  ],
};

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: PAGE_CONFIG.seoTitle,
  description: PAGE_CONFIG.seoDescription,
  alternates: {
    canonical: `${siteConfig.url}/tools/for-counselors/`,
  },
  openGraph: {
    title: PAGE_CONFIG.seoTitle,
    description: PAGE_CONFIG.seoDescription,
    url: `${siteConfig.url}/tools/for-counselors/`,
    type: "website",
  },
  keywords: [
    "best ehr for counselors",
    "counseling practice management software",
    "software for lmhc",
    "lpc practice software",
    "mental health counselor software",
    "counseling notes software",
    "telehealth for counselors",
    "counselor billing software",
  ],
};

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function ForCounselorsPage() {
  // Load all tools
  const allTools = await ClinicianToolService.loadClinicianTools();

  // Filter tools suitable for counselors (using therapist role since counselors are included)
  const counselorTools = allTools.filter(
    (tool) =>
      tool.audiences.clinician_roles.length === 0 ||
      tool.audiences.clinician_roles.includes("therapist-lcsw-lmft")
  );

  // Group tools by category
  const toolsByCategory = PAGE_CONFIG.categories.map((category) => ({
    ...category,
    tools: counselorTools
      .filter((tool) => tool.primary_category === category.schemaCategory)
      .slice(0, 4),
  }));

  // Get featured tools (top tools with most complete data)
  const featuredTools = counselorTools
    .filter((t) => t.featured || (t.governance?.data_quality_score || 0) > 70)
    .slice(0, 6);

  // Count tools by feature
  const telehealthCount = counselorTools.filter(
    (t) => t.feature_flags.has_telehealth
  ).length;

  // ============================================================================
  // STRUCTURED DATA
  // ============================================================================

  const structuredData = [
    // BreadcrumbList
    {
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
          name: "For Counselors",
          item: `${siteConfig.url}/tools/for-counselors/`,
        },
      ],
    },
    // CollectionPage
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: PAGE_CONFIG.seoTitle,
      description: PAGE_CONFIG.seoDescription,
      url: `${siteConfig.url}/tools/for-counselors/`,
      mainEntity: {
        "@type": "ItemList",
        name: "Best Software for Counselors",
        description: `Top-rated software tools for counseling practices in ${CURRENT_YEAR}`,
        numberOfItems: featuredTools.length,
        itemListElement: featuredTools.slice(0, 10).map((tool, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          item: {
            "@type": "SoftwareApplication",
            name: tool.name,
            applicationCategory: "HealthApplication",
            description: tool.short_description || tool.one_liner,
            url: `${siteConfig.url}/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${tool.slug}/`,
          },
        })),
      },
      isPartOf: {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
      },
    },
    // FAQPage
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is the best EHR for counselors?",
          acceptedAnswer: {
            "@type": "Answer",
            text: `Popular EHRs for counselors include SimplePractice, TheraNest, TherapyNotes, and Jane App. SimplePractice is widely used for its intuitive interface, while TheraNest offers strong billing features. The best choice depends on your specific needs for telehealth, billing, and documentation.`,
          },
        },
        {
          "@type": "Question",
          name: "What software do LMHC counselors need?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "LMHC counselors typically need: (1) A HIPAA-compliant EHR for client records and notes, (2) Telehealth platform for virtual sessions, (3) Scheduling and intake software, and (4) Billing solution for insurance claims or superbills. Many all-in-one platforms combine these features.",
          },
        },
        {
          "@type": "Question",
          name: "Is there free software for counselors?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Some platforms offer free tiers with limited features, and many offer free trials (typically 14-30 days). However, robust HIPAA-compliant software typically requires a paid subscription. Most counseling software ranges from $29-100/month depending on features and practice size.",
          },
        },
      ],
    },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

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
        <section className="relative overflow-hidden border-b border-separator bg-surface">
          <div className="absolute inset-0 bg-gradient-to-br from-treatment/[0.03] via-transparent to-accent/[0.02]" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm">
              <Link
                href="/tools/"
                className="text-label-secondary hover:text-treatment"
              >
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">
                For Counselors
              </span>
            </nav>

            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-treatment/20 bg-treatment/10">
                <MessageCircle className="h-7 w-7 text-treatment" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl">
                  {PAGE_CONFIG.headline}
                </h1>
                <p className="mt-1 text-sm text-label-tertiary">
                  {PAGE_CONFIG.subheadline}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mt-4 rounded-xl border border-treatment/20 bg-treatment/5 p-5">
              <p className="text-lg text-label-primary leading-relaxed">
                {PAGE_CONFIG.description}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-label-secondary">
                <Users className="h-4 w-4 text-treatment" />
                <span>{counselorTools.length} tools reviewed</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-label-secondary">
                <Video className="h-4 w-4 text-accent" />
                <span>{telehealthCount} with telehealth</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-label-secondary">
                <Shield className="h-4 w-4 text-positive" />
                <span>HIPAA compliance verified</span>
              </div>
            </div>
          </div>
        </section>

        {/* License Types Supported */}
        <section className="border-b border-separator bg-canvas px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-medium text-label-tertiary uppercase tracking-wider mb-3">
              License Types Supported
            </p>
            <div className="flex flex-wrap gap-2">
              {PAGE_CONFIG.licenseTypes.map((license) => (
                <span
                  key={license.code}
                  className="inline-flex items-center rounded-full bg-treatment/10 px-3 py-1 text-sm font-medium text-treatment border border-treatment/20"
                  title={license.name}
                >
                  {license.code}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Practice Architect CTA */}
        <section className="border-b border-separator bg-surface px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <ContextualArchitectCTA
              context={{
                source: "category",
                practiceTypeHint: "solo-therapist",
                utmSource: "for-counselors",
              }}
              variant="banner"
            />
          </div>
        </section>

        {/* Featured Tools */}
        {featuredTools.length > 0 && (
          <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-xl font-semibold text-label-primary mb-2">
                Top Picks for Counselors
              </h2>
              <p className="text-sm text-label-secondary mb-6">
                Most popular tools among counseling practices
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featuredTools.map((tool) => (
                  <ClinicianToolCard key={tool.slug} tool={tool} showCategory />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Category Sections */}
        {toolsByCategory.map(
          (category) =>
            category.tools.length > 0 && (
              <section
                key={category.slug}
                className="border-b border-separator bg-surface odd:bg-canvas px-4 py-12 sm:px-6 lg:px-8"
              >
                <div className="mx-auto max-w-6xl">
                  <div className="flex items-center gap-3 mb-2">
                    <category.icon className="h-5 w-5 text-treatment" />
                    <h2 className="text-xl font-semibold text-label-primary">
                      {category.name}
                    </h2>
                  </div>
                  <p className="text-sm text-label-secondary mb-6">
                    {category.description}
                  </p>

                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {category.tools.map((tool) => (
                      <ClinicianToolCard
                        key={tool.slug}
                        tool={tool}
                        variant="compact"
                      />
                    ))}
                  </div>

                  <div className="mt-4">
                    <Link
                      href={`/tools/for-clinicians/${category.slug}/`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
                    >
                      View all {category.name}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </section>
            )
        )}

        {/* Considerations */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              What Counselors Should Look For
            </h2>

            <div className="space-y-4">
              {PAGE_CONFIG.considerations.map((consideration, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-separator bg-canvas p-4"
                >
                  <CheckCircle2 className="h-5 w-5 text-positive shrink-0 mt-0.5" />
                  <p className="text-label-secondary">{consideration}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Related Pages */}
        <section className="bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h3 className="text-sm font-medium text-label-tertiary uppercase tracking-wider mb-4">
              Related Resources
            </h3>
            <div className="flex flex-wrap gap-3">
              {PAGE_CONFIG.relatedPages.map((page) => (
                <Link
                  key={page.href}
                  href={page.href}
                  className="flex items-center gap-2 rounded-lg border border-separator bg-surface px-4 py-2 text-sm text-label-secondary hover:border-treatment/30 hover:text-treatment transition-colors"
                >
                  {page.label}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export const revalidate = 3600; // Revalidate hourly
