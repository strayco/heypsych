/**
 * HIPAA Compliant Software Directory
 *
 * SEO-optimized landing page targeting compliance-focused queries:
 * - "HIPAA compliant therapy software"
 * - "HIPAA compliant EHR for therapists"
 * - "HIPAA compliant telehealth"
 * - "mental health software HIPAA"
 *
 * URL: /tools/hipaa-compliant
 */

import { Metadata } from "next";
import Link from "next/link";
import {
  Shield,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Bot,
  Video,
  Receipt,
  Users,
  ClipboardList,
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
  title: `HIPAA Compliant Mental Health Software (${CURRENT_YEAR}) | HeyPsych`,
  description: `Compare verified HIPAA compliant software for therapists and psychiatrists. Find EHRs, AI scribes, telehealth, and billing tools that meet HIPAA requirements. Updated ${CURRENT_YEAR}.`,
  alternates: {
    canonical: `${siteConfig.url}/tools/hipaa-compliant/`,
  },
  openGraph: {
    title: `HIPAA Compliant Mental Health Software (${CURRENT_YEAR})`,
    description: `Find verified HIPAA compliant tools for mental health practices. Compare EHRs, AI scribes, telehealth, and billing software.`,
    url: `${siteConfig.url}/tools/hipaa-compliant/`,
    type: "website",
  },
  keywords: [
    "HIPAA compliant therapy software",
    "HIPAA compliant EHR",
    "HIPAA compliant telehealth",
    "HIPAA compliant AI scribe",
    "mental health software HIPAA",
    "therapist software HIPAA",
    "psychiatry HIPAA software",
    `HIPAA compliant software ${CURRENT_YEAR}`,
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
    description: "Electronic health records and practice management systems",
  },
  {
    taxonomySlug: "ai-scribe-documentation",
    schemaCategory: "ai-scribe-documentation",
    displayName: "AI Scribes & Documentation",
    shortName: "AI Scribe",
    icon: Bot,
    description: "AI-powered clinical documentation tools",
  },
  {
    taxonomySlug: "telehealth-communication",
    schemaCategory: "telehealth-communication",
    displayName: "Telehealth & Communication",
    shortName: "Telehealth",
    icon: Video,
    description: "Video therapy and secure messaging platforms",
  },
  {
    taxonomySlug: "billing-rcm",
    schemaCategory: "billing-rcm-insurance",
    displayName: "Billing & RCM",
    shortName: "Billing",
    icon: Receipt,
    description: "Claims submission and revenue cycle management",
  },
  {
    taxonomySlug: "provider-networks",
    schemaCategory: "provider-network-virtual-care",
    displayName: "Provider Networks",
    shortName: "Networks",
    icon: Users,
    description: "Virtual care platforms and provider networks",
  },
  {
    taxonomySlug: "measurement-outcomes",
    schemaCategory: "measurement-outcomes-dtx",
    displayName: "Measurement & Outcomes",
    shortName: "Outcomes",
    icon: ClipboardList,
    description: "Assessment tools and outcome tracking",
  },
];

// ============================================================================
// HELPERS
// ============================================================================

function filterHipaaCompliantTools(tools: ClinicianToolV4[]): ClinicianToolV4[] {
  return tools.filter((tool) => tool.compliance?.hipaa_support === "yes");
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

    // BAA bonus
    if (a.compliance?.baa_available === "yes") scoreA += 15;
    if (b.compliance?.baa_available === "yes") scoreB += 15;

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

export default async function HipaaCompliantPage() {
  // Load all tools and filter for HIPAA compliant
  const allTools = await ClinicianToolService.loadClinicianTools();
  const hipaaTools = filterHipaaCompliantTools(allTools);
  const rankedTools = rankByComplianceQuality(hipaaTools);

  // Group by category
  const toolsByCategory = groupToolsByCategory(rankedTools, CATEGORY_CONFIGS);

  // Count tools with BAA as well
  const withBaa = hipaaTools.filter(
    (t) => t.compliance?.baa_available === "yes"
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
          name: "HIPAA Compliant",
          item: `${siteConfig.url}/tools/hipaa-compliant/`,
        },
      ],
    },
    // WebPage
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: `HIPAA Compliant Mental Health Software (${CURRENT_YEAR})`,
      description: metadata.description,
      url: `${siteConfig.url}/tools/hipaa-compliant/`,
      dateModified: new Date().toISOString(),
      mainEntity: {
        "@type": "ItemList",
        name: "HIPAA Compliant Mental Health Software",
        numberOfItems: hipaaTools.length,
      },
    },
    // ItemList
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `HIPAA Compliant Mental Health Software (${CURRENT_YEAR})`,
      description: `${hipaaTools.length} verified HIPAA compliant tools for mental health practices`,
      numberOfItems: hipaaTools.length,
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
          name: "What makes software HIPAA compliant?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "HIPAA compliant software must implement administrative, physical, and technical safeguards to protect PHI. This includes encryption (in transit and at rest), access controls, audit logging, automatic logoff, and the ability to enter into a Business Associate Agreement (BAA). The software must also have breach notification procedures and regular security assessments.",
          },
        },
        {
          "@type": "Question",
          name: "Do I need a BAA with all my software vendors?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes, you need a BAA with any vendor that will create, receive, maintain, or transmit PHI on your behalf. This includes EHRs, telehealth platforms, billing software, AI scribes, and any cloud storage. Without a BAA, you bear full liability for any data breaches involving that vendor.",
          },
        },
        {
          "@type": "Question",
          name: "Is HIPAA compliance the same as having a BAA?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. HIPAA compliance refers to the security and privacy measures implemented by the software. A BAA is a legal contract that makes the vendor responsible for protecting your patients' data. You need both: compliant software AND a signed BAA before transmitting any PHI.",
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
          <div className="absolute inset-0 bg-gradient-to-br from-treatment/[0.03] via-transparent to-positive/[0.02]" />
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
              <span className="text-label-primary font-medium">
                HIPAA Compliant
              </span>
            </nav>

            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-treatment/20 bg-treatment/10">
                <Shield className="h-7 w-7 text-treatment" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl">
                  HIPAA Compliant Mental Health Software
                </h1>
                <p className="mt-1 text-sm text-label-tertiary">
                  {hipaaTools.length} verified tools | Updated {CURRENT_YEAR}
                </p>
              </div>
            </div>

            {/* Direct Answer */}
            <div className="mt-4 rounded-xl border border-treatment/20 bg-treatment/5 p-5">
              <p className="text-lg text-label-primary leading-relaxed">
                Compare {hipaaTools.length} HIPAA compliant tools verified for
                mental health practices. Filter by EHRs, AI scribes, telehealth,
                and billing software with confirmed compliance and BAA
                availability.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border border-separator bg-canvas p-4 text-center">
                <div className="text-2xl font-bold text-treatment">
                  {hipaaTools.length}
                </div>
                <div className="text-xs text-label-tertiary">HIPAA Compliant</div>
              </div>
              <div className="rounded-lg border border-separator bg-canvas p-4 text-center">
                <div className="text-2xl font-bold text-positive">{withBaa}</div>
                <div className="text-xs text-label-tertiary">BAA Available</div>
              </div>
              <div className="rounded-lg border border-separator bg-canvas p-4 text-center">
                <div className="text-2xl font-bold text-accent">
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

        {/* Compliance Checklist */}
        <section className="border-b border-separator bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-lg font-semibold text-label-primary mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-positive" />
              HIPAA Compliance Requirements
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                "Data encryption in transit and at rest",
                "Business Associate Agreement (BAA)",
                "Access controls and user authentication",
                "Audit logging and activity monitoring",
                "Automatic session timeout",
                "Breach notification procedures",
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
                  Verify Before You Buy
                </h3>
                <p className="mt-1 text-sm text-label-secondary">
                  While we verify HIPAA compliance claims, always obtain and
                  review the vendor&apos;s BAA before transmitting any PHI. Compliance
                  status can change. HeyPsych does not independently audit
                  vendor security practices.
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
                    <Icon className="h-5 w-5 text-treatment" />
                    <h2 className="text-xl font-semibold text-label-primary">
                      HIPAA Compliant {config.shortName}
                    </h2>
                    <span className="rounded-full bg-treatment/10 px-2 py-0.5 text-xs font-medium text-treatment">
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
                href="/tools/with-baa/"
                className="group rounded-xl border border-separator bg-surface p-5 hover:border-treatment/30 transition-colors"
              >
                <h3 className="font-semibold text-label-primary group-hover:text-treatment">
                  Tools with BAA Available
                </h3>
                <p className="mt-2 text-sm text-label-secondary">
                  {withBaa} tools that offer Business Associate Agreements
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
                  What makes software HIPAA compliant?
                </h3>
                <p className="mt-2 text-sm text-label-secondary">
                  HIPAA compliant software must implement administrative,
                  physical, and technical safeguards to protect PHI. This
                  includes encryption (in transit and at rest), access controls,
                  audit logging, automatic logoff, and the ability to enter into
                  a Business Associate Agreement (BAA). The software must also
                  have breach notification procedures and regular security
                  assessments.
                </p>
              </div>
              <div className="rounded-xl border border-separator bg-canvas p-5">
                <h3 className="font-medium text-label-primary">
                  Do I need a BAA with all my software vendors?
                </h3>
                <p className="mt-2 text-sm text-label-secondary">
                  Yes, you need a BAA with any vendor that will create, receive,
                  maintain, or transmit PHI on your behalf. This includes EHRs,
                  telehealth platforms, billing software, AI scribes, and any
                  cloud storage. Without a BAA, you bear full liability for any
                  data breaches involving that vendor.
                </p>
              </div>
              <div className="rounded-xl border border-separator bg-canvas p-5">
                <h3 className="font-medium text-label-primary">
                  Is HIPAA compliance the same as having a BAA?
                </h3>
                <p className="mt-2 text-sm text-label-secondary">
                  No. HIPAA compliance refers to the security and privacy
                  measures implemented by the software. A BAA is a legal
                  contract that makes the vendor responsible for protecting your
                  patients&apos; data. You need both: compliant software AND a signed
                  BAA before transmitting any PHI.
                </p>
              </div>
              <div className="rounded-xl border border-separator bg-canvas p-5">
                <h3 className="font-medium text-label-primary">
                  Can I use consumer software like regular Zoom or Google Drive?
                </h3>
                <p className="mt-2 text-sm text-label-secondary">
                  Consumer versions of these tools are not HIPAA compliant. You
                  must use healthcare-specific versions (Zoom for Healthcare,
                  Google Workspace with BAA) that include necessary security
                  features and offer BAAs. Using consumer versions with PHI
                  violates HIPAA regulations.
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
