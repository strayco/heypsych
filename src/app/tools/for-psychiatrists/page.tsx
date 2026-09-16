/**
 * Psychiatrist Software Landing Page
 *
 * High-intent SEO page targeting searches like:
 * - "best EHR for psychiatrists"
 * - "psychiatry practice management software"
 * - "e-prescribing software for psychiatrists"
 * - "EPCS software psychiatry"
 *
 * URL: /tools/for-psychiatrists
 */

import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  Pill,
  FileText,
  Video,
  Receipt,
  Bot,
  Shield,
  AlertTriangle,
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
  role: "psychiatrist" as const,
  displayName: "Psychiatrists",
  headline: "Best Software for Psychiatrists",
  subheadline: "Psychiatrists, Psychiatric NPs & PAs",
  description: `Find the best EHR, e-prescribing, and practice management software designed for psychiatric practices. Compare ${CURRENT_YEAR}'s top-rated tools with EPCS certification, controlled substance tracking, and medication management features.`,
  seoTitle: `Best Software for Psychiatrists (${CURRENT_YEAR}) | EHR, e-Prescribing & EPCS`,
  seoDescription: `Compare the best EHR and e-prescribing software for psychiatrists in ${CURRENT_YEAR}. EPCS-certified, controlled substance tracking, and psychiatric-specific workflows. Expert recommendations with transparent pricing.`,
  categories: [
    {
      slug: "ehr-practice-management",
      schemaCategory: "ehr-practice-management",
      name: "EHR & Practice Management",
      icon: FileText,
      description: "Psychiatric-specific EHR platforms with medication tracking",
    },
    {
      slug: "prescribing-erx",
      schemaCategory: "prescribing-erx",
      name: "e-Prescribing & EPCS",
      icon: Pill,
      description: "DEA-certified electronic prescribing for controlled substances",
    },
    {
      slug: "ai-scribe-documentation",
      schemaCategory: "ai-scribe-documentation",
      name: "AI Scribes & Documentation",
      icon: Bot,
      description: "AI-powered psychiatric note generation and clinical documentation",
    },
    {
      slug: "billing-rcm",
      schemaCategory: "billing-rcm-insurance",
      name: "Billing & RCM",
      icon: Receipt,
      description: "Psychiatric billing codes, prior authorization automation",
    },
    {
      slug: "telehealth-communication",
      schemaCategory: "telehealth-communication",
      name: "Telehealth & Video",
      icon: Video,
      description: "HIPAA-compliant telepsychiatry platforms",
    },
  ],
  epcsRequirements: [
    "DEA certification and EPCS software certification",
    "Two-factor authentication with identity proofing",
    "PDMP (Prescription Drug Monitoring Program) integration",
    "Audit trail and prescription tracking logs",
    "Support for Schedule II-V controlled substances",
  ],
  considerations: [
    "Verify EPCS certification is current and meets DEA requirements",
    "Check PDMP integration for your state (requirements vary)",
    "Look for medication interaction checking and allergy alerts",
    "Ensure support for psychiatric medication tracking and titration",
    "Consider e-prior authorization features for controlled substances",
    "Verify lab integration for medication monitoring (lithium, clozapine, etc.)",
  ],
  relatedPages: [
    { href: "/tools/for-practices/psychiatry/", label: "Psychiatry Practice Software" },
    { href: `/tools/best/psychiatry-ehr-${CURRENT_YEAR}/`, label: `Best Psychiatry EHR ${CURRENT_YEAR}` },
    { href: `/tools/best/e-prescribing-${CURRENT_YEAR}/`, label: `Best e-Prescribing ${CURRENT_YEAR}` },
    { href: "/tools/compare/valant-vs-simplepractice/", label: "Valant vs SimplePractice" },
  ],
};

// ============================================================================
// METADATA
// ============================================================================

export const metadata: Metadata = {
  title: PAGE_CONFIG.seoTitle,
  description: PAGE_CONFIG.seoDescription,
  alternates: {
    canonical: `${siteConfig.url}/tools/for-psychiatrists/`,
  },
  openGraph: {
    title: PAGE_CONFIG.seoTitle,
    description: PAGE_CONFIG.seoDescription,
    url: `${siteConfig.url}/tools/for-psychiatrists/`,
    type: "website",
  },
  keywords: [
    "best ehr for psychiatrists",
    "psychiatry practice management software",
    "e-prescribing software psychiatrists",
    "epcs software psychiatry",
    "psychiatry emr",
    "controlled substance prescribing software",
    "telepsychiatry platform",
    "psychiatric medication management software",
  ],
};

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function ForPsychiatristsPage() {
  // Load all tools
  const allTools = await ClinicianToolService.loadClinicianTools();

  // Filter tools suitable for psychiatrists
  const psychiatristTools = allTools.filter(
    (tool) =>
      tool.audiences.clinician_roles.length === 0 ||
      tool.audiences.clinician_roles.includes("psychiatrist") ||
      tool.audiences.clinician_roles.includes("psychiatric-np-pa")
  );

  // Filter tools with e-prescribing capability
  const prescribingTools = psychiatristTools.filter(
    (tool) =>
      tool.feature_flags.has_e_prescribing ||
      tool.primary_category === "prescribing-erx" ||
      tool.capabilities.includes("e-prescribing") ||
      tool.capabilities.includes("epcs-controlled")
  );

  // Group tools by category
  const toolsByCategory = PAGE_CONFIG.categories.map((category) => ({
    ...category,
    tools: psychiatristTools
      .filter((tool) => tool.primary_category === category.schemaCategory)
      .slice(0, 4),
  }));

  // Get featured tools prioritizing those with prescribing features
  const featuredTools = psychiatristTools
    .map((tool) => {
      let score = tool.governance?.data_quality_score || 0;
      if (tool.featured) score += 20;
      if (tool.feature_flags.has_e_prescribing) score += 15;
      if (tool.capabilities.includes("epcs-controlled")) score += 10;
      if (tool.capabilities.includes("pdmp-integration")) score += 10;
      return { tool, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ tool }) => tool);

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
          name: "For Psychiatrists",
          item: `${siteConfig.url}/tools/for-psychiatrists/`,
        },
      ],
    },
    // CollectionPage
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: PAGE_CONFIG.seoTitle,
      description: PAGE_CONFIG.seoDescription,
      url: `${siteConfig.url}/tools/for-psychiatrists/`,
      mainEntity: {
        "@type": "ItemList",
        name: "Best Software for Psychiatrists",
        description: `Top-rated software tools for psychiatric practices in ${CURRENT_YEAR}`,
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
          name: "What is EPCS and why do psychiatrists need it?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "EPCS (Electronic Prescribing for Controlled Substances) is DEA-mandated technology that allows psychiatrists to electronically prescribe Schedule II-V controlled substances like stimulants, benzodiazepines, and certain sleep medications. Most states now require EPCS for controlled substance prescriptions.",
          },
        },
        {
          "@type": "Question",
          name: "What is the best EHR for psychiatrists?",
          acceptedAnswer: {
            "@type": "Answer",
            text: `Popular EHRs for psychiatrists include Valant (psychiatry-specific), Luminello, SimplePractice, and DrChrono. The best choice depends on your practice needs: Valant offers deep psychiatric workflows, while SimplePractice provides broader practice management. Always verify EPCS certification and PDMP integration.`,
          },
        },
        {
          "@type": "Question",
          name: "Do psychiatrists need PDMP integration?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, most states require psychiatrists to check the Prescription Drug Monitoring Program (PDMP) before prescribing controlled substances. Many EHRs now offer integrated PDMP queries directly in the prescribing workflow, saving time and ensuring compliance.",
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
                For Psychiatrists
              </span>
            </nav>

            {/* Header */}
            <div className="flex items-start gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-treatment/20 bg-treatment/10">
                <Brain className="h-7 w-7 text-treatment" />
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
                <span>{psychiatristTools.length} tools reviewed</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-label-secondary">
                <Pill className="h-4 w-4 text-accent" />
                <span>{prescribingTools.length} with e-prescribing</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-label-secondary">
                <Shield className="h-4 w-4 text-positive" />
                <span>EPCS compliance verified</span>
              </div>
            </div>
          </div>
        </section>

        {/* EPCS Requirements Alert */}
        <section className="border-b border-separator bg-amber-50 dark:bg-amber-950/20 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-amber-900 dark:text-amber-100">
                  EPCS Requirements for Controlled Substances
                </h2>
                <p className="mt-1 text-sm text-amber-800 dark:text-amber-200">
                  When prescribing controlled substances electronically, your
                  software must meet DEA EPCS certification requirements.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PAGE_CONFIG.epcsRequirements.slice(0, 3).map((req, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/50 px-3 py-1 text-xs font-medium text-amber-800 dark:text-amber-200"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      {req}
                    </span>
                  ))}
                </div>
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
                practiceTypeHint: "psychiatry",
                preloadedCapabilities: ["e-prescribing", "epcs-controlled"],
                utmSource: "for-psychiatrists",
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
                Top Picks for Psychiatrists
              </h2>
              <p className="text-sm text-label-secondary mb-6">
                Most popular tools among psychiatric practices
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featuredTools.map((tool) => (
                  <ClinicianToolCard key={tool.slug} tool={tool} showCategory />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* e-Prescribing Highlight Section */}
        <section className="border-b border-separator bg-treatment/5 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center gap-3 mb-2">
              <Pill className="h-5 w-5 text-treatment" />
              <h2 className="text-xl font-semibold text-label-primary">
                e-Prescribing & EPCS Solutions
              </h2>
            </div>
            <p className="text-sm text-label-secondary mb-6">
              DEA-certified electronic prescribing for controlled substances
            </p>

            {prescribingTools.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {prescribingTools.slice(0, 4).map((tool) => (
                  <ClinicianToolCard
                    key={tool.slug}
                    tool={tool}
                    variant="compact"
                  />
                ))}
              </div>
            ) : (
              <p className="text-label-tertiary">
                Loading e-prescribing tools...
              </p>
            )}

            <div className="mt-4">
              <Link
                href="/tools/for-clinicians/prescribing-erx/"
                className="inline-flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
              >
                View all e-Prescribing tools
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Category Sections */}
        {toolsByCategory
          .filter((cat) => cat.slug !== "prescribing-erx")
          .map(
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
              What Psychiatrists Should Look For
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
