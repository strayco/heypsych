/**
 * Software with BAA Available Directory
 *
 * SEO-optimized landing page targeting BAA-focused queries:
 * - "EHR with BAA"
 * - "telehealth with BAA"
 * - "mental health software BAA"
 * - "therapy software business associate agreement"
 *
 * URL: /tools/with-baa
 */

import { Metadata } from "next";
import Link from "next/link";
import {
  FileCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Bot,
  Video,
  Receipt,
  Users,
  ClipboardList,
  Scale,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import {
  SCHEMA_TO_TAXONOMY_CATEGORY,
  CLINICIAN_PRODUCT_CATEGORY_LABELS,
  type ClinicianProductCategory,
} from "@/lib/schemas/clinician-tool-v4";
import { ClinicianToolCard } from "@/components/tools/clinician";
import type { ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";

// ============================================================================
// METADATA
// ============================================================================

const CURRENT_YEAR = new Date().getFullYear();

export const metadata: Metadata = {
  title: `Mental Health Software with BAA (${CURRENT_YEAR}) | Business Associate Agreement | HeyPsych`,
  description: `Find mental health software with Business Associate Agreements. Compare EHRs, AI scribes, telehealth, and billing tools that offer BAAs for HIPAA compliance. Updated ${CURRENT_YEAR}.`,
  alternates: {
    canonical: `${siteConfig.url}/tools/with-baa/`,
  },
  openGraph: {
    title: `Mental Health Software with BAA Available (${CURRENT_YEAR})`,
    description: `Find tools that offer Business Associate Agreements for mental health practices. Compare EHRs, AI scribes, telehealth, and billing software with BAA.`,
    url: `${siteConfig.url}/tools/with-baa/`,
    type: "website",
  },
  keywords: [
    "EHR with BAA",
    "telehealth with BAA",
    "AI scribe with BAA",
    "therapy software BAA",
    "business associate agreement software",
    "mental health software BAA",
    "HIPAA BAA software",
    `software with BAA ${CURRENT_YEAR}`,
  ],
};

// ============================================================================
// CATEGORY CONFIG
// ============================================================================

interface CategoryConfig {
  taxonomySlug: string;
  schemaCategory: ClinicianProductCategory;
  displayName: string;
  shortName: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    taxonomySlug: "ehr-practice-management",
    schemaCategory: "ehr-practice-management",
    displayName: "EHR & Practice Management",
    shortName: "EHR",
    icon: FileText,
    description: "Electronic health records with BAA for secure PHI storage",
  },
  {
    taxonomySlug: "ai-scribe-documentation",
    schemaCategory: "ai-scribe-documentation",
    displayName: "AI Scribes & Documentation",
    shortName: "AI Scribe",
    icon: Bot,
    description: "AI documentation tools with BAA for session recordings",
  },
  {
    taxonomySlug: "telehealth-communication",
    schemaCategory: "telehealth-communication",
    displayName: "Telehealth & Communication",
    shortName: "Telehealth",
    icon: Video,
    description: "Video therapy platforms with BAA for virtual sessions",
  },
  {
    taxonomySlug: "billing-rcm",
    schemaCategory: "billing-rcm-insurance",
    displayName: "Billing & RCM",
    shortName: "Billing",
    icon: Receipt,
    description: "Claims software with BAA for patient billing data",
  },
  {
    taxonomySlug: "provider-networks",
    schemaCategory: "provider-network-virtual-care",
    displayName: "Provider Networks",
    shortName: "Networks",
    icon: Users,
    description: "Virtual care platforms with BAA for patient matching",
  },
  {
    taxonomySlug: "measurement-outcomes",
    schemaCategory: "measurement-outcomes-dtx",
    displayName: "Measurement & Outcomes",
    shortName: "Outcomes",
    icon: ClipboardList,
    description: "Assessment tools with BAA for patient outcome data",
  },
];

// ============================================================================
// HELPERS
// ============================================================================

function filterBaaTools(tools: ClinicianToolV4[]): ClinicianToolV4[] {
  return tools.filter((tool) => tool.compliance?.baa_available === "yes");
}

function groupToolsByCategory(
  tools: ClinicianToolV4[],
  configs: CategoryConfig[]
): Map<string, ClinicianToolV4[]> {
  const grouped = new Map<string, ClinicianToolV4[]>();

  for (const config of configs) {
    const categoryTools = tools.filter(
      (tool) => tool.primary_category === config.schemaCategory
    );
    if (categoryTools.length > 0) {
      grouped.set(config.taxonomySlug, categoryTools);
    }
  }

  return grouped;
}

function rankByComplianceQuality(tools: ClinicianToolV4[]): ClinicianToolV4[] {
  return [...tools].sort((a, b) => {
    let scoreA = a.governance?.data_quality_score || 0;
    let scoreB = b.governance?.data_quality_score || 0;

    // HIPAA bonus
    if (a.compliance?.hipaa_support === "yes") scoreA += 15;
    if (b.compliance?.hipaa_support === "yes") scoreB += 15;

    // SOC2 bonus
    if (a.compliance?.soc2 === "yes") scoreA += 10;
    if (b.compliance?.soc2 === "yes") scoreB += 10;

    // Featured bonus
    if (a.featured) scoreA += 5;
    if (b.featured) scoreB += 5;

    return scoreB - scoreA;
  });
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function WithBaaPage() {
  // Load all tools and filter for BAA available
  const allTools = await ClinicianToolService.loadClinicianTools();
  const baaTools = filterBaaTools(allTools);
  const rankedTools = rankByComplianceQuality(baaTools);

  // Group by category
  const toolsByCategory = groupToolsByCategory(rankedTools, CATEGORY_CONFIGS);

  // Count tools that are also HIPAA compliant
  const alsoHipaa = baaTools.filter(
    (t) => t.compliance?.hipaa_support === "yes"
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
          name: "For Clinicians",
          item: `${siteConfig.url}/tools/for-clinicians/`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "With BAA",
          item: `${siteConfig.url}/tools/with-baa/`,
        },
      ],
    },
    // WebPage
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `Mental Health Software with BAA (${CURRENT_YEAR})`,
      description: metadata.description,
      url: `${siteConfig.url}/tools/with-baa/`,
      dateModified: new Date().toISOString(),
      mainEntity: {
        "@type": "ItemList",
        name: "Software with Business Associate Agreement",
        numberOfItems: baaTools.length,
      },
    },
    // ItemList
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Mental Health Software with BAA (${CURRENT_YEAR})`,
      description: `${baaTools.length} tools that offer Business Associate Agreements`,
      numberOfItems: baaTools.length,
      itemListElement: rankedTools.slice(0, 20).map((tool, idx) => ({
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
    // FAQPage
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What is a Business Associate Agreement (BAA)?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A BAA is a legal contract required by HIPAA between a healthcare provider (covered entity) and any vendor (business associate) that handles protected health information (PHI). The BAA ensures the vendor will appropriately safeguard PHI and be held accountable for any breaches.",
          },
        },
        {
          "@type": "Question",
          name: "When do I need a BAA?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "You need a BAA with any vendor that creates, receives, maintains, or transmits PHI on your behalf. This includes EHR systems, telehealth platforms, AI scribes, billing software, cloud storage, and even email services if you discuss patient information. The BAA must be signed before any PHI is shared.",
          },
        },
        {
          "@type": "Question",
          name: "What should a BAA include?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A valid BAA should include: permitted uses of PHI, safeguards the vendor will implement, breach notification requirements, termination provisions, and subcontractor requirements. The vendor should also specify their liability coverage and incident response procedures.",
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
          <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.03] via-transparent to-treatment/[0.02]" />
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
              <Link
                href="/tools/for-clinicians/"
                className="text-label-secondary hover:text-treatment"
              >
                For Clinicians
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">With BAA</span>
            </nav>

            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10">
                <FileCheck className="h-7 w-7 text-accent" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl">
                  Mental Health Software with BAA
                </h1>
                <p className="mt-1 text-sm text-label-tertiary">
                  {baaTools.length} tools with Business Associate Agreements |
                  Updated {CURRENT_YEAR}
                </p>
              </div>
            </div>

            {/* Direct Answer */}
            <div className="mt-4 rounded-xl border border-accent/20 bg-accent/5 p-5">
              <p className="text-lg text-label-primary leading-relaxed">
                Find {baaTools.length} mental health software tools that offer
                Business Associate Agreements (BAAs). A signed BAA is required
                before any vendor handles your patients&apos; protected health
                information (PHI).
              </p>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-separator bg-canvas p-4 text-center">
                <div className="text-2xl font-bold text-accent">
                  {baaTools.length}
                </div>
                <div className="text-xs text-label-tertiary">BAA Available</div>
              </div>
              <div className="rounded-lg border border-separator bg-canvas p-4 text-center">
                <div className="text-2xl font-bold text-treatment">
                  {alsoHipaa}
                </div>
                <div className="text-xs text-label-tertiary">
                  Also HIPAA Verified
                </div>
              </div>
              <div className="rounded-lg border border-separator bg-canvas p-4 text-center">
                <div className="text-2xl font-bold text-positive">
                  {toolsByCategory.size}
                </div>
                <div className="text-xs text-label-tertiary">Categories</div>
              </div>
              <div className="rounded-lg border border-separator bg-canvas p-4 text-center">
                <div className="text-2xl font-bold text-warning">
                  {CURRENT_YEAR}
                </div>
                <div className="text-xs text-label-tertiary">Last Verified</div>
              </div>
            </div>
          </div>
        </section>

        {/* What is a BAA */}
        <section className="border-b border-separator bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-lg font-semibold text-label-primary mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5 text-accent" />
              What Should a BAA Include?
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Permitted and required uses of PHI",
                "Safeguards to prevent unauthorized use",
                "Breach notification requirements",
                "Termination provisions",
                "Subcontractor accountability",
                "Return or destruction of PHI on termination",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2 rounded-lg bg-surface border border-separator px-4 py-3"
                >
                  <CheckCircle2 className="h-4 w-4 text-positive shrink-0 mt-0.5" />
                  <span className="text-sm text-label-secondary">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Important Notice */}
        <section className="border-b border-separator bg-warning/5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-label-primary">
                  Sign Before You Share
                </h3>
                <p className="mt-1 text-sm text-label-secondary">
                  A BAA must be signed before you transmit any PHI to the
                  vendor. Even if software claims HIPAA compliance, you remain
                  liable without a signed BAA. Request the BAA during your trial
                  period and review it with legal counsel if needed.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Tools by Category */}
        {CATEGORY_CONFIGS.map((config) => {
          const tools = toolsByCategory.get(config.taxonomySlug);
          if (!tools || tools.length === 0) return null;

          const Icon = config.icon;

          return (
            <section
              key={config.taxonomySlug}
              className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8"
            >
              <div className="mx-auto max-w-6xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 text-accent" />
                    <h2 className="text-xl font-semibold text-label-primary">
                      {config.shortName} with BAA
                    </h2>
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      {tools.length} tools
                    </span>
                  </div>
                  <Link
                    href={`/tools/for-clinicians/${config.taxonomySlug}/`}
                    className="text-sm font-medium text-treatment hover:text-treatment/80 flex items-center gap-1"
                  >
                    View all {config.shortName}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <p className="text-sm text-label-secondary mb-6">
                  {config.description}
                </p>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tools.slice(0, 6).map((tool) => (
                    <ClinicianToolCard key={tool.slug} tool={tool} showCategory />
                  ))}
                </div>

                {tools.length > 6 && (
                  <div className="mt-6 text-center">
                    <Link
                      href={`/tools/for-clinicians/${config.taxonomySlug}/`}
                      className="inline-flex items-center gap-2 text-sm font-medium text-treatment hover:text-treatment/80"
                    >
                      View all {tools.length} {config.shortName} tools
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>
            </section>
          );
        })}

        {/* Related Pages */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              Related Resources
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/tools/hipaa-compliant/"
                className="group rounded-xl border border-separator bg-surface p-5 hover:border-treatment/30 transition-colors"
              >
                <h3 className="font-semibold text-label-primary group-hover:text-treatment">
                  HIPAA Compliant Tools
                </h3>
                <p className="mt-2 text-sm text-label-secondary">
                  {alsoHipaa} tools with verified HIPAA compliance
                </p>
              </Link>
              <Link
                href="/tools/for-clinicians/"
                className="group rounded-xl border border-separator bg-surface p-5 hover:border-treatment/30 transition-colors"
              >
                <h3 className="font-semibold text-label-primary group-hover:text-treatment">
                  All Clinician Tools
                </h3>
                <p className="mt-2 text-sm text-label-secondary">
                  Browse the complete directory of practice software
                </p>
              </Link>
              <Link
                href="/tools/pricing/"
                className="group rounded-xl border border-separator bg-surface p-5 hover:border-treatment/30 transition-colors"
              >
                <h3 className="font-semibold text-label-primary group-hover:text-treatment">
                  Pricing Comparisons
                </h3>
                <p className="mt-2 text-sm text-label-secondary">
                  Compare costs across EHRs, AI scribes, and more
                </p>
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="rounded-xl border border-separator bg-canvas p-5">
                <h3 className="font-medium text-label-primary">
                  What is a Business Associate Agreement (BAA)?
                </h3>
                <p className="mt-2 text-sm text-label-secondary">
                  A BAA is a legal contract required by HIPAA between a
                  healthcare provider (covered entity) and any vendor (business
                  associate) that handles protected health information (PHI).
                  The BAA ensures the vendor will appropriately safeguard PHI
                  and be held accountable for any breaches.
                </p>
              </div>
              <div className="rounded-xl border border-separator bg-canvas p-5">
                <h3 className="font-medium text-label-primary">
                  When do I need a BAA?
                </h3>
                <p className="mt-2 text-sm text-label-secondary">
                  You need a BAA with any vendor that creates, receives,
                  maintains, or transmits PHI on your behalf. This includes EHR
                  systems, telehealth platforms, AI scribes, billing software,
                  cloud storage, and even email services if you discuss patient
                  information. The BAA must be signed before any PHI is shared.
                </p>
              </div>
              <div className="rounded-xl border border-separator bg-canvas p-5">
                <h3 className="font-medium text-label-primary">
                  What if a vendor won&apos;t sign a BAA?
                </h3>
                <p className="mt-2 text-sm text-label-secondary">
                  If a vendor refuses to sign a BAA, you cannot use them for any
                  activity involving PHI. This is a red flag for HIPAA
                  compliance. Look for alternative vendors that provide BAAs, or
                  use the tool only for non-PHI purposes (if that&apos;s possible for
                  your workflow).
                </p>
              </div>
              <div className="rounded-xl border border-separator bg-canvas p-5">
                <h3 className="font-medium text-label-primary">
                  Is a BAA the same as HIPAA compliance?
                </h3>
                <p className="mt-2 text-sm text-label-secondary">
                  No. A BAA is a legal contract, while HIPAA compliance refers
                  to the actual security measures and practices. A vendor can
                  sign a BAA but still have poor security practices. You need
                  both: a signed BAA AND confidence that the vendor actually
                  implements proper security safeguards.
                </p>
              </div>
              <div className="rounded-xl border border-separator bg-canvas p-5">
                <h3 className="font-medium text-label-primary">
                  Do I need a BAA for free tools?
                </h3>
                <p className="mt-2 text-sm text-label-secondary">
                  Yes. There is no exception for free tools. If any software
                  handles PHI, you need a BAA regardless of cost. Be cautious of
                  free tools that don&apos;t offer BAAs -- they may not have invested
                  in the security infrastructure HIPAA requires.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-xl font-semibold text-label-primary">
              Need help building your compliant tech stack?
            </h2>
            <p className="mt-2 text-label-secondary">
              Practice Architect helps you select tools that work together while
              meeting compliance requirements.
            </p>
            <Link
              href="/architect/"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-treatment px-6 py-3 text-sm font-medium text-white hover:bg-treatment/90 transition-colors"
            >
              Try Practice Architect
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}

export const revalidate = 3600; // 1 hour
