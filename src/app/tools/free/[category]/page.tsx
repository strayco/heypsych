/**
 * Free [Category] Software Landing Pages
 *
 * SEO-optimized programmatic pages targeting high-value free software queries:
 * - "free ehr software"
 * - "free ai scribe for therapists"
 * - "free telehealth platform"
 * - "free therapy practice management"
 *
 * URL: /tools/free/[category]
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Gift,
  CheckCircle2,
  AlertCircle,
  Star,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import {
  SCHEMA_TO_TAXONOMY_CATEGORY,
  TAXONOMY_TO_SCHEMA_CATEGORIES,
  CLINICIAN_PRODUCT_CATEGORY_LABELS,
  type ClinicianProductCategory,
} from "@/lib/schemas/clinician-tool-v4";
import { ClinicianToolCard } from "@/components/tools/clinician";
import { ContextualArchitectCTA } from "@/components/architect/ContextualArchitectCTA";
import type { ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";

interface PageProps {
  params: Promise<{ category: string }>;
}

// ============================================================================
// FREE CATEGORY CONFIGURATIONS
// ============================================================================

interface FreeCategoryConfig {
  taxonomySlug: string;
  schemaCategories: ClinicianProductCategory[];
  headline: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  targetKeywords: string[];
  /** What to look for in free options */
  freeConsiderations: string[];
  /** Common limitations of free tiers */
  freeTrierLimitations: string[];
  /** When to upgrade */
  upgradeSignals: string[];
}

const CURRENT_YEAR = new Date().getFullYear();

/**
 * Generate configurations for all free category pages
 */
function generateFreeCategoryConfigs(): Record<string, FreeCategoryConfig> {
  return {
    "ehr-practice-management": {
      taxonomySlug: "ehr-practice-management",
      schemaCategories: ["ehr-practice-management"],
      headline: `Free EHR Software for Mental Health (${CURRENT_YEAR})`,
      description:
        "Find genuinely free EHR and practice management software for therapists, psychiatrists, and mental health clinicians. Compare free tiers, freemium options, and open-source alternatives.",
      seoTitle: `Best Free EHR Software for Mental Health (${CURRENT_YEAR}) | No Credit Card Required`,
      seoDescription: `Compare free EHR software for therapists and psychiatrists. Find free tiers, freemium options, and truly free practice management tools. Updated ${CURRENT_YEAR}.`,
      targetKeywords: [
        "free ehr software",
        "free ehr for therapists",
        "free practice management software",
        "free mental health ehr",
        "free therapy software",
        `best free ehr ${CURRENT_YEAR}`,
      ],
      freeConsiderations: [
        "Check if HIPAA compliance is included or requires paid upgrade",
        "Verify how many clients/patients the free tier supports",
        "Look for hidden costs like payment processing fees",
        "Ensure telehealth is included if you need it",
        "Check if data export is available on free tier",
      ],
      freeTrierLimitations: [
        "Limited to solo practitioner (no staff accounts)",
        "Client/patient caps (often 30-50 active clients)",
        "No insurance billing or claims submission",
        "Basic reporting only",
        "Limited or no telehealth",
        "HeyPsych branding on client-facing materials",
      ],
      upgradeSignals: [
        "You exceed the client limit regularly",
        "You need insurance billing capabilities",
        "You're hiring staff or adding clinicians",
        "You need advanced reporting for compliance",
        "Telehealth becomes essential to your practice",
      ],
    },

    "ai-scribe-documentation": {
      taxonomySlug: "ai-scribe-documentation",
      schemaCategories: ["ai-scribe-documentation"],
      headline: `Free AI Scribe for Therapists (${CURRENT_YEAR})`,
      description:
        "Discover free AI documentation tools for mental health clinicians. Compare free trials, freemium AI scribes, and genuinely free note-taking assistants for therapy and psychiatry.",
      seoTitle: `Best Free AI Scribe for Therapists (${CURRENT_YEAR}) | Free Trials & Freemium`,
      seoDescription: `Find free AI scribes for therapists and psychiatrists. Compare free trials, freemium tiers, and free documentation tools. HIPAA-compliant options reviewed.`,
      targetKeywords: [
        "free ai scribe",
        "free ai scribe for therapists",
        "free therapy note generator",
        "free ai documentation",
        "free clinical notes ai",
        `best free ai scribe ${CURRENT_YEAR}`,
      ],
      freeConsiderations: [
        "Verify HIPAA compliance is included on free tier",
        "Check session or minute limits per month",
        "Ensure BAA is available even for free users",
        "Look for note format options (SOAP, DAP, BIRP)",
        "Test accuracy with mental health terminology",
      ],
      freeTrierLimitations: [
        "Limited sessions or minutes per month (often 5-10 sessions)",
        "Basic note formats only",
        "No EHR integration on free tier",
        "Watermarked or branded outputs",
        "Limited customization options",
        "Slower processing during peak times",
      ],
      upgradeSignals: [
        "You consistently hit session limits",
        "You need direct EHR integration",
        "Custom templates become necessary",
        "You want priority processing speeds",
        "You need team or supervision features",
      ],
    },

    "telehealth-communication": {
      taxonomySlug: "telehealth-communication",
      schemaCategories: ["telehealth-communication"],
      headline: `Free Telehealth Platforms for Therapists (${CURRENT_YEAR})`,
      description:
        "Find free HIPAA-compliant telehealth platforms for mental health practice. Compare free video therapy tools, secure messaging, and virtual waiting room features.",
      seoTitle: `Best Free Telehealth for Therapists (${CURRENT_YEAR}) | HIPAA-Compliant Video`,
      seoDescription: `Compare free HIPAA-compliant telehealth platforms for therapists. Find free video therapy tools with BAA included. No credit card options available.`,
      targetKeywords: [
        "free telehealth for therapists",
        "free hipaa video",
        "free teletherapy platform",
        "free secure video for therapy",
        "free mental health telehealth",
        `best free telehealth ${CURRENT_YEAR}`,
      ],
      freeConsiderations: [
        "Confirm HIPAA compliance and BAA availability",
        "Check session length limits",
        "Verify client experience (downloads required?)",
        "Look for virtual waiting room features",
        "Ensure recording is disabled or HIPAA-compliant if enabled",
      ],
      freeTrierLimitations: [
        "Session length limits (often 40-45 minutes)",
        "Limited concurrent sessions",
        "Basic waiting room only",
        "No screen sharing on free tier",
        "No session recording",
        "Limited branding options",
      ],
      upgradeSignals: [
        "You need longer session times",
        "Screen sharing becomes essential",
        "You want custom branding",
        "You need group session capability",
        "Recording for supervision is required",
      ],
    },

    "billing-rcm": {
      taxonomySlug: "billing-rcm",
      schemaCategories: ["billing-rcm-insurance"],
      headline: `Free Mental Health Billing Software (${CURRENT_YEAR})`,
      description:
        "Find free billing and revenue cycle management tools for mental health practices. Compare free superbill generators, basic claims tools, and freemium billing platforms.",
      seoTitle: `Best Free Mental Health Billing Software (${CURRENT_YEAR}) | Claims & Superbills`,
      seoDescription: `Compare free billing software for therapists and psychiatrists. Find free superbill generators, basic claims submission, and freemium RCM tools.`,
      targetKeywords: [
        "free therapy billing software",
        "free mental health billing",
        "free superbill generator",
        "free claims submission",
        "free rcm software",
        `best free billing software ${CURRENT_YEAR}`,
      ],
      freeConsiderations: [
        "Check if clearinghouse fees are separate",
        "Verify ERA/EOB posting capabilities",
        "Look for basic eligibility verification",
        "Ensure claim tracking is included",
        "Check superbill generation features",
      ],
      freeTrierLimitations: [
        "Per-claim fees may apply",
        "Limited payer connections",
        "Manual eligibility checking only",
        "Basic denial tracking",
        "No automated payment posting",
        "Limited reporting capabilities",
      ],
      upgradeSignals: [
        "Your claim volume justifies subscription pricing",
        "You need automated ERA posting",
        "Real-time eligibility becomes essential",
        "You want denial management workflows",
        "Revenue reporting needs to improve",
      ],
    },

    "measurement-outcomes": {
      taxonomySlug: "measurement-outcomes",
      schemaCategories: ["measurement-outcomes-dtx"],
      headline: `Free Outcome Measurement Tools for Therapy (${CURRENT_YEAR})`,
      description:
        "Discover free outcome measurement and progress tracking tools for mental health clinicians. Compare free PHQ-9, GAD-7 administration, and basic outcome tracking platforms.",
      seoTitle: `Best Free Outcome Measurement Tools (${CURRENT_YEAR}) | PHQ-9, GAD-7 & More`,
      seoDescription: `Find free outcome measurement tools for therapists. Compare free PHQ-9 and GAD-7 administration, progress tracking, and measurement-based care platforms.`,
      targetKeywords: [
        "free phq-9 tool",
        "free gad-7 administration",
        "free outcome measures therapy",
        "free progress tracking",
        "free measurement based care",
        `best free outcome tools ${CURRENT_YEAR}`,
      ],
      freeConsiderations: [
        "Check which assessments are included",
        "Verify automated scoring capabilities",
        "Look for progress visualization",
        "Ensure EHR integration options exist",
        "Check client self-administration features",
      ],
      freeTrierLimitations: [
        "Limited assessment library",
        "Basic scoring only (no interpretation)",
        "Limited client capacity",
        "No longitudinal tracking",
        "Basic or no EHR integration",
        "Limited reporting and exports",
      ],
      upgradeSignals: [
        "You need more assessment instruments",
        "Longitudinal tracking becomes important",
        "You want automated interpretation",
        "EHR integration is required",
        "You need population-level analytics",
      ],
    },

    "patient-engagement": {
      taxonomySlug: "patient-engagement",
      schemaCategories: ["patient-engagement"],
      headline: `Free Patient Engagement Tools for Mental Health (${CURRENT_YEAR})`,
      description:
        "Find free patient engagement and communication tools for mental health practices. Compare free appointment reminders, secure messaging, and client portal options.",
      seoTitle: `Best Free Patient Engagement Tools (${CURRENT_YEAR}) | Reminders & Portals`,
      seoDescription: `Compare free patient engagement tools for therapists. Find free appointment reminders, secure messaging, and client portal solutions.`,
      targetKeywords: [
        "free appointment reminders",
        "free client portal therapy",
        "free patient engagement",
        "free secure messaging hipaa",
        "free therapy reminders",
        `best free engagement tools ${CURRENT_YEAR}`,
      ],
      freeConsiderations: [
        "Check reminder delivery methods (SMS, email)",
        "Verify HIPAA compliance for messaging",
        "Look for client portal capabilities",
        "Ensure customization of reminder timing",
        "Check integration with scheduling tools",
      ],
      freeTrierLimitations: [
        "Limited reminder volume per month",
        "Email only (no SMS) on free tier",
        "Basic client portal features",
        "Limited customization",
        "No two-way messaging",
        "HeyPsych branding on communications",
      ],
      upgradeSignals: [
        "SMS reminders become necessary",
        "Two-way messaging is needed",
        "You want custom branding",
        "Client portal features need expansion",
        "Integration requirements grow",
      ],
    },

    "scheduling-intake": {
      taxonomySlug: "scheduling-intake",
      schemaCategories: ["intake-scheduling-forms"],
      headline: `Free Scheduling Software for Therapists (${CURRENT_YEAR})`,
      description:
        "Find free appointment scheduling and intake form tools for mental health practices. Compare free online booking, HIPAA-compliant forms, and calendar integration options.",
      seoTitle: `Best Free Scheduling Software for Therapists (${CURRENT_YEAR}) | Online Booking`,
      seoDescription: `Compare free scheduling software for therapists. Find free online booking, HIPAA-compliant intake forms, and calendar sync tools.`,
      targetKeywords: [
        "free scheduling software therapists",
        "free therapy booking",
        "free intake forms hipaa",
        "free appointment scheduling",
        "free online booking therapy",
        `best free scheduling ${CURRENT_YEAR}`,
      ],
      freeConsiderations: [
        "Check HIPAA compliance for intake forms",
        "Verify calendar integration options",
        "Look for automated confirmation emails",
        "Ensure timezone handling works correctly",
        "Check payment collection capabilities",
      ],
      freeTrierLimitations: [
        "Limited number of appointment types",
        "Basic calendar sync only",
        "No payment collection on free tier",
        "Limited form customization",
        "Basic or no automated reminders",
        "HeyPsych branding on booking pages",
      ],
      upgradeSignals: [
        "You need multiple appointment types",
        "Payment collection at booking is needed",
        "Custom intake forms are required",
        "Team scheduling becomes necessary",
        "Automated workflows are needed",
      ],
    },

    "prescribing-erx": {
      taxonomySlug: "prescribing-erx",
      schemaCategories: ["prescribing-erx"],
      headline: `Free e-Prescribing for Psychiatrists (${CURRENT_YEAR})`,
      description:
        "Find free and low-cost e-prescribing solutions for psychiatrists and PMHNPs. Compare free trials, included e-Rx features in EHRs, and standalone prescribing tools.",
      seoTitle: `Free e-Prescribing for Psychiatrists (${CURRENT_YEAR}) | EPCS Options`,
      seoDescription: `Find free e-prescribing options for psychiatrists and PMHNPs. Compare free trials, bundled e-Rx, and affordable EPCS solutions.`,
      targetKeywords: [
        "free e-prescribing",
        "free epcs software",
        "free prescription software",
        "free erx psychiatry",
        "free prescribing tool",
        `best free e-prescribing ${CURRENT_YEAR}`,
      ],
      freeConsiderations: [
        "Note: True free e-prescribing is rare due to regulatory costs",
        "Look for EHRs that include e-Rx in base pricing",
        "Check EPCS certification for controlled substances",
        "Verify state-specific compliance",
        "Consider identity proofing costs",
      ],
      freeTrierLimitations: [
        "Standalone free e-Rx is very rare",
        "EPCS typically requires paid subscription",
        "Identity proofing often has separate fees",
        "Limited pharmacy network on free tiers",
        "No PDMP integration on free options",
        "Basic medication history only",
      ],
      upgradeSignals: [
        "EPCS for controlled substances is required",
        "PDMP integration becomes essential",
        "You need comprehensive drug interaction checking",
        "Prior authorization workflows are needed",
        "Multi-state prescribing is required",
      ],
    },
  };
}

const FREE_CATEGORY_CONFIGS = generateFreeCategoryConfigs();

// ============================================================================
// STATIC PARAMS
// ============================================================================

export function generateStaticParams() {
  return Object.keys(FREE_CATEGORY_CONFIGS).map((category) => ({ category }));
}

// ============================================================================
// METADATA
// ============================================================================

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const config = FREE_CATEGORY_CONFIGS[category];

  if (!config) {
    return { title: "Free Software" };
  }

  return {
    title: config.seoTitle,
    description: config.seoDescription,
    alternates: {
      canonical: `${siteConfig.url}/tools/free/${category}/`,
    },
    openGraph: {
      title: config.seoTitle,
      description: config.seoDescription,
      url: `${siteConfig.url}/tools/free/${category}/`,
      type: "website",
    },
    keywords: config.targetKeywords,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Filter tools that have free tiers or are freemium
 */
function filterFreeTools(tools: ClinicianToolV4[]): ClinicianToolV4[] {
  return tools.filter((tool) => {
    const pricing = tool.pricing;
    if (!pricing) return false;

    return (
      pricing.model === "free" ||
      pricing.model === "freemium" ||
      pricing.free_tier === true ||
      (pricing.free_trial_days && pricing.free_trial_days >= 14)
    );
  });
}

/**
 * Sort free tools by quality and free tier generosity
 */
function rankFreeTools(tools: ClinicianToolV4[]): ClinicianToolV4[] {
  return tools
    .map((tool) => {
      let score = tool.governance?.data_quality_score || 0;

      // Free model bonuses
      if (tool.pricing?.model === "free") score += 30;
      if (tool.pricing?.model === "freemium") score += 20;
      if (tool.pricing?.free_tier) score += 15;

      // Compliance on free tier is valuable
      if (tool.compliance?.hipaa_support === "yes") score += 15;
      if (tool.compliance?.baa_available === "yes") score += 10;

      // Long free trials are valuable
      if (tool.pricing?.free_trial_days) {
        score += Math.min(tool.pricing.free_trial_days, 30);
      }

      // Featured bonus
      if (tool.featured) score += 10;

      return { tool, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ tool }) => tool);
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function FreeCategoryPage({ params }: PageProps) {
  const { category } = await params;
  const config = FREE_CATEGORY_CONFIGS[category];

  if (!config) {
    notFound();
  }

  // Load and filter tools
  const allTools = await ClinicianToolService.loadClinicianTools();

  // Filter by category
  const categoryTools = allTools.filter((tool) =>
    config.schemaCategories.includes(tool.primary_category)
  );

  // Filter to free/freemium tools
  const freeTools = filterFreeTools(categoryTools);
  const rankedFreeTools = rankFreeTools(freeTools);

  // Separate by type
  const trulyFreeTools = rankedFreeTools.filter(
    (t) => t.pricing?.model === "free"
  );
  const freemiumTools = rankedFreeTools.filter(
    (t) => t.pricing?.model === "freemium" || t.pricing?.free_tier
  );
  const freeTrialTools = rankedFreeTools.filter(
    (t) =>
      t.pricing?.free_trial_days &&
      t.pricing.free_trial_days >= 14 &&
      t.pricing?.model !== "free" &&
      t.pricing?.model !== "freemium" &&
      !t.pricing?.free_tier
  );

  const categoryLabel =
    CLINICIAN_PRODUCT_CATEGORY_LABELS[
      config.schemaCategories[0] as ClinicianProductCategory
    ] || category;

  // ============================================================================
  // STRUCTURED DATA - AGGRESSIVE SEO
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
          name: "Free Software",
          item: `${siteConfig.url}/tools/free/`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: `Free ${categoryLabel}`,
          item: `${siteConfig.url}/tools/free/${category}/`,
        },
      ],
    },
    // WebPage with speakable for voice search
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: config.seoTitle,
      description: config.seoDescription,
      url: `${siteConfig.url}/tools/free/${category}/`,
      dateModified: new Date().toISOString(),
      speakable: {
        "@type": "SpeakableSpecification",
        cssSelector: ["[data-speakable='true']", ".direct-answer"],
      },
      mainEntity: {
        "@type": "ItemList",
        name: `Free ${categoryLabel} Software`,
        numberOfItems: rankedFreeTools.length,
      },
    },
    // ItemList for rich results
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Best Free ${categoryLabel} (${CURRENT_YEAR})`,
      description: config.description,
      numberOfItems: rankedFreeTools.length,
      itemListElement: rankedFreeTools.slice(0, 10).map((tool, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        item: {
          "@type": "SoftwareApplication",
          name: tool.name,
          applicationCategory: "HealthApplication",
          description: tool.short_description || tool.one_liner,
          url: `${siteConfig.url}/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${tool.slug}/`,
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            description:
              tool.pricing?.model === "free"
                ? "Completely free"
                : tool.pricing?.model === "freemium"
                  ? "Free tier available"
                  : `${tool.pricing?.free_trial_days}-day free trial`,
          },
        },
      })),
    },
    // FAQPage for "People Also Ask"
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `Is there truly free ${categoryLabel.toLowerCase()} software?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: `Yes, there are ${trulyFreeTools.length} completely free options and ${freemiumTools.length} freemium tools with free tiers available for ${categoryLabel.toLowerCase()}. However, free tiers often have limitations like client caps, limited features, or branding requirements.`,
          },
        },
        {
          "@type": "Question",
          name: `What are the limitations of free ${categoryLabel.toLowerCase()} software?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: config.freeTrierLimitations.join(" "),
          },
        },
        {
          "@type": "Question",
          name: `When should I upgrade from free ${categoryLabel.toLowerCase()} to paid?`,
          acceptedAnswer: {
            "@type": "Answer",
            text: config.upgradeSignals.join(" "),
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
          <div className="absolute inset-0 bg-gradient-to-br from-positive/[0.03] via-transparent to-accent/[0.02]" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm">
              <Link href="/tools/" className="text-label-secondary hover:text-treatment">
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <Link href="/tools/for-clinicians/" className="text-label-secondary hover:text-treatment">
                For Clinicians
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">Free {categoryLabel}</span>
            </nav>

            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-positive/20 bg-positive/10">
                <Gift className="h-7 w-7 text-positive" />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl"
                  data-speakable="true"
                >
                  {config.headline}
                </h1>
                <p className="mt-1 text-sm text-label-tertiary">
                  {rankedFreeTools.length} free options available
                </p>
              </div>
            </div>

            {/* Direct Answer Block - Voice Search Optimized */}
            <div
              className="direct-answer mt-4 rounded-xl border border-positive/20 bg-positive/5 p-5"
              data-speakable="true"
            >
              <p className="text-lg text-label-primary leading-relaxed">{config.description}</p>
            </div>

            {/* Quick Stats */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-separator bg-canvas p-4 text-center">
                <div className="text-2xl font-bold text-positive">{trulyFreeTools.length}</div>
                <div className="text-xs text-label-tertiary">Completely Free</div>
              </div>
              <div className="rounded-lg border border-separator bg-canvas p-4 text-center">
                <div className="text-2xl font-bold text-accent">{freemiumTools.length}</div>
                <div className="text-xs text-label-tertiary">Free Tier Available</div>
              </div>
              <div className="rounded-lg border border-separator bg-canvas p-4 text-center">
                <div className="text-2xl font-bold text-treatment">{freeTrialTools.length}</div>
                <div className="text-xs text-label-tertiary">Extended Free Trial</div>
              </div>
            </div>
          </div>
        </section>

        {/* Free Considerations */}
        <section className="border-b border-separator bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-lg font-semibold text-label-primary mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-treatment" />
              What to Check Before Choosing Free Software
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {config.freeConsiderations.map((consideration) => (
                <div
                  key={consideration}
                  className="flex items-start gap-2 rounded-lg bg-surface border border-separator px-4 py-3"
                >
                  <CheckCircle2 className="h-4 w-4 text-positive shrink-0 mt-0.5" />
                  <span className="text-sm text-label-secondary">{consideration}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Truly Free Tools */}
        {trulyFreeTools.length > 0 && (
          <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="flex items-center gap-2 mb-6">
                <Gift className="h-5 w-5 text-positive" />
                <h2 className="text-xl font-semibold text-label-primary">
                  Completely Free {categoryLabel}
                </h2>
                <span className="rounded-full bg-positive/10 px-2 py-0.5 text-xs font-medium text-positive">
                  No credit card required
                </span>
              </div>
              <p className="text-sm text-label-secondary mb-6">
                These tools are genuinely free to use without payment information
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {trulyFreeTools.map((tool, idx) => (
                  <div key={tool.slug} className="relative">
                    {idx === 0 && (
                      <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 rounded-full bg-positive px-2 py-1 text-xs font-medium text-white">
                        <Star className="h-3 w-3" />
                        Top Pick
                      </div>
                    )}
                    <ClinicianToolCard tool={tool} showCategory />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Freemium Tools */}
        {freemiumTools.length > 0 && (
          <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="flex items-center gap-2 mb-6">
                <Sparkles className="h-5 w-5 text-accent" />
                <h2 className="text-xl font-semibold text-label-primary">
                  Freemium {categoryLabel}
                </h2>
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  Free tier available
                </span>
              </div>
              <p className="text-sm text-label-secondary mb-6">
                These tools offer free tiers with optional paid upgrades for more features
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {freemiumTools.map((tool) => (
                  <ClinicianToolCard key={tool.slug} tool={tool} showCategory />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Free Trial Tools */}
        {freeTrialTools.length > 0 && (
          <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="h-5 w-5 text-treatment" />
                <h2 className="text-xl font-semibold text-label-primary">
                  Extended Free Trials
                </h2>
                <span className="rounded-full bg-treatment/10 px-2 py-0.5 text-xs font-medium text-treatment">
                  14+ day trials
                </span>
              </div>
              <p className="text-sm text-label-secondary mb-6">
                Premium tools offering extended free trials to evaluate before committing
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {freeTrialTools.map((tool) => (
                  <ClinicianToolCard key={tool.slug} tool={tool} showCategory />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Practice Architect CTA */}
        <section className="border-b border-separator bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <ContextualArchitectCTA
              context={{
                source: "category",
                categorySlug: config.schemaCategories[0],
                utmSource: `free-${category}`,
              }}
              variant="banner"
            />
          </div>
        </section>

        {/* Free Tier Limitations */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-warning" />
              Common Free Tier Limitations
            </h2>
            <p className="text-sm text-label-secondary mb-6">
              Understand what you might be giving up with free options
            </p>

            <div className="space-y-3">
              {config.freeTrierLimitations.map((limitation, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-separator bg-canvas p-4"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warning/10 text-warning text-sm font-medium">
                    {idx + 1}
                  </div>
                  <p className="text-label-secondary">{limitation}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* When to Upgrade */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-2">
              Signs It&apos;s Time to Upgrade from Free
            </h2>
            <p className="text-sm text-label-secondary mb-6">
              When free tiers stop serving your practice needs
            </p>

            <div className="space-y-3">
              {config.upgradeSignals.map((signal, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-treatment/20 bg-treatment/5 p-4"
                >
                  <ArrowRight className="h-5 w-5 text-treatment shrink-0 mt-0.5" />
                  <p className="text-label-secondary">{signal}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Browse Other Free Categories */}
        <section className="bg-surface px-4 py-8 sm:px-6 lg:px-8 border-t border-separator">
          <div className="mx-auto max-w-6xl">
            <h3 className="text-sm font-medium text-label-tertiary uppercase tracking-wider mb-4">
              Free Software in Other Categories
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(FREE_CATEGORY_CONFIGS)
                .filter(([slug]) => slug !== category)
                .map(([slug, cfg]) => (
                  <Link
                    key={slug}
                    href={`/tools/free/${slug}/`}
                    className="flex items-center gap-2 rounded-lg border border-separator bg-canvas px-4 py-2 text-sm text-label-secondary hover:border-positive/30 hover:text-positive transition-colors"
                  >
                    <Gift className="h-3.5 w-3.5" />
                    Free{" "}
                    {CLINICIAN_PRODUCT_CATEGORY_LABELS[
                      cfg.schemaCategories[0] as ClinicianProductCategory
                    ] || slug}
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

export const revalidate = 3600; // Revalidate every hour
