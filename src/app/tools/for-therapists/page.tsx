/**
 * Therapist Software Landing Page
 *
 * High-intent SEO page targeting searches like:
 * - "best EHR for therapists"
 * - "software for therapists"
 * - "therapy practice management software"
 *
 * URL: /tools/for-therapists
 */

import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Heart,
  CheckCircle2,
  Stethoscope,
  FileText,
  Video,
  Receipt,
  Bot,
  BarChart3,
  Users,
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
  role: "therapist-lcsw-lmft" as const,
  displayName: "Therapists",
  headline: "Best Software for Therapists",
  subheadline: "LCSW, LMFT, LPC & Licensed Counselors",
  description: `Find the best EHR, practice management, billing, and telehealth software designed for therapy practices. Compare ${CURRENT_YEAR}'s top-rated tools with transparent pricing and features tailored to therapists' workflows.`,
  seoTitle: `Best Software for Therapists (${CURRENT_YEAR}) | EHR, Billing & Telehealth`,
  seoDescription: `Compare the best EHR, billing, and telehealth software for therapists in ${CURRENT_YEAR}. Expert recommendations for LCSW, LMFT, and LPC practices. Transparent pricing and HIPAA compliance verified.`,
  categories: [
    {
      slug: "ehr-practice-management",
      schemaCategory: "ehr-practice-management",
      name: "EHR & Practice Management",
      icon: FileText,
      description: "All-in-one platforms for scheduling, notes, and client management",
    },
    {
      slug: "ai-scribe-documentation",
      schemaCategory: "ai-scribe-documentation",
      name: "AI Scribes & Documentation",
      icon: Bot,
      description: "AI-powered note generation and clinical documentation",
    },
    {
      slug: "billing-rcm",
      schemaCategory: "billing-rcm-insurance",
      name: "Billing & Insurance",
      icon: Receipt,
      description: "Claims submission, eligibility verification, and revenue cycle management",
    },
    {
      slug: "telehealth-communication",
      schemaCategory: "telehealth-communication",
      name: "Telehealth & Video",
      icon: Video,
      description: "HIPAA-compliant video platforms for virtual sessions",
    },
    {
      slug: "measurement-outcomes",
      schemaCategory: "measurement-outcomes-dtx",
      name: "Outcome Measurement",
      icon: BarChart3,
      description: "PHQ-9, GAD-7, and progress tracking tools",
    },
  ],
  considerations: [
    "Look for therapy-specific note templates and treatment planning workflows",
    "Ensure the platform supports your license type (LCSW, LMFT, LPC, etc.)",
    "Check if telehealth is built-in or requires a separate subscription",
    "Verify insurance billing support for behavioral health codes",
    "Consider all-in-one vs. best-of-breed based on your practice size",
  ],
  relatedPages: [
    { href: "/tools/for-practices/solo-therapist/", label: "Solo Therapist Software" },
    { href: "/tools/for-practices/therapy-group/", label: "Group Practice Software" },
    { href: `/tools/best/therapy-software-${CURRENT_YEAR}/`, label: `Best Therapy Software ${CURRENT_YEAR}` },
    { href: "/tools/compare/simplepractice-vs-therapynotes/", label: "SimplePractice vs TherapyNotes" },
  ],
};

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: PAGE_CONFIG.seoTitle,
  description: PAGE_CONFIG.seoDescription,
  alternates: {
    canonical: `${siteConfig.url}/tools/for-therapists/`,
  },
  openGraph: {
    title: PAGE_CONFIG.seoTitle,
    description: PAGE_CONFIG.seoDescription,
    url: `${siteConfig.url}/tools/for-therapists/`,
    type: "website",
  },
  keywords: [
    "best ehr for therapists",
    "therapy practice management software",
    "software for therapists",
    "best ehr for lcsw",
    "therapist billing software",
    "telehealth for therapists",
    "therapy notes software",
    "lmft practice software",
  ],
};

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function ForTherapistsPage() {
  // Load all tools
  const allTools = await ClinicianToolService.loadClinicianTools();

  // Filter tools suitable for therapists
  const therapistTools = allTools.filter(
    (tool) =>
      tool.audiences.clinician_roles.length === 0 ||
      tool.audiences.clinician_roles.includes("therapist-lcsw-lmft")
  );

  // Group tools by category
  const toolsByCategory = PAGE_CONFIG.categories.map((category) => ({
    ...category,
    tools: therapistTools
      .filter((tool) => tool.primary_category === category.schemaCategory)
      .slice(0, 4),
  }));

  // Get featured tools (top tools with most complete data)
  const featuredTools = therapistTools
    .filter((t) => t.featured || (t.governance?.data_quality_score || 0) > 70)
    .slice(0, 6);

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
          name: "For Therapists",
          item: `${siteConfig.url}/tools/for-therapists/`,
        },
      ],
    },
    // CollectionPage
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: PAGE_CONFIG.seoTitle,
      description: PAGE_CONFIG.seoDescription,
      url: `${siteConfig.url}/tools/for-therapists/`,
      mainEntity: {
        "@type": "ItemList",
        name: "Best Software for Therapists",
        description: `Top-rated software tools for therapy practices in ${CURRENT_YEAR}`,
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
          name: "What is the best EHR for therapists?",
          acceptedAnswer: {
            "@type": "Answer",
            text: `The best EHR for therapists depends on your practice type and needs. Popular options include SimplePractice, TherapyNotes, and Jane App. SimplePractice is great for solo practitioners, while TherapyNotes offers robust clinical documentation. Consider your specific needs for telehealth, billing, and note templates when choosing.`,
          },
        },
        {
          "@type": "Question",
          name: "Do therapists need HIPAA-compliant software?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, therapists must use HIPAA-compliant software for any tool that stores or transmits protected health information (PHI). This includes your EHR, telehealth platform, scheduling system, and billing software. Always verify that a Business Associate Agreement (BAA) is available.",
          },
        },
        {
          "@type": "Question",
          name: "How much does therapy practice software cost?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Therapy practice software typically costs $30-100/month for solo practitioners and $50-150/provider/month for group practices. All-in-one platforms like SimplePractice start around $29/month, while separate billing services may charge 3-7% of collections.",
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
                For Therapists
              </span>
            </nav>

            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-treatment/20 bg-treatment/10">
                <Heart className="h-7 w-7 text-treatment" />
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
                <span>{therapistTools.length} tools reviewed</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-label-secondary">
                <CheckCircle2 className="h-4 w-4 text-positive" />
                <span>HIPAA compliance verified</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-label-secondary">
                <Stethoscope className="h-4 w-4 text-accent" />
                <span>Therapy-specific features</span>
              </div>
            </div>
          </div>
        </section>

        {/* Practice Architect CTA */}
        <section className="border-b border-separator bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <ContextualArchitectCTA
              context={{
                source: "category",
                practiceTypeHint: "solo-therapist",
                utmSource: "for-therapists",
              }}
              variant="banner"
            />
          </div>
        </section>

        {/* Featured Tools */}
        {featuredTools.length > 0 && (
          <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <h2 className="text-xl font-semibold text-label-primary mb-2">
                Top Picks for Therapists
              </h2>
              <p className="text-sm text-label-secondary mb-6">
                Most popular tools among therapy practices
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
                className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8"
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
              What to Look For
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
