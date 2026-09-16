/**
 * Telehealth Platforms Comparison Landing Page
 *
 * SEO-focused comparison hub for telehealth platforms targeting therapists
 * and mental health professionals. Compares key features:
 * - Video quality
 * - HIPAA compliance
 * - Virtual waiting room
 * - Screen sharing
 * - Recording capability
 * - Mobile support
 * - Pricing
 *
 * Links to individual products and head-to-head comparisons.
 */

import { Metadata } from "next";
import Link from "next/link";
import {
  Video,
  Shield,
  Clock,
  Monitor,
  Smartphone,
  DollarSign,
  CheckCircle,
  XCircle,
  ArrowRight,
  Star,
  Mic,
  ExternalLink,
} from "lucide-react";
import { SITE_CONFIG } from "@/lib/seo/config";
import { ClinicianToolService, type ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";
import { TrustSignal } from "../_components/TrustSignal";
import { VendorCTA } from "../_components/VendorCTA";

// =============================================================================
// METADATA
// =============================================================================

export const metadata: Metadata = {
  title: "Telehealth Platforms for Therapists Compared (2026)",
  description:
    "Compare HIPAA-compliant telehealth platforms for mental health practices. See video quality, pricing, virtual waiting rooms, and features side by side. Find the best telehealth solution for your therapy practice.",
  keywords: [
    "telehealth for therapists",
    "HIPAA compliant video",
    "therapy telehealth platform",
    "doxy.me vs zoom",
    "best telehealth for mental health",
    "therapist video platform",
    "virtual therapy platform",
    "telehealth comparison 2026",
  ],
  alternates: {
    canonical: `${SITE_CONFIG.url}/tools/telehealth-comparison/`,
  },
  openGraph: {
    title: "Telehealth Platforms for Therapists Compared (2026)",
    description:
      "Compare HIPAA-compliant telehealth platforms side by side. Find the best video solution for your mental health practice.",
    type: "article",
    url: `${SITE_CONFIG.url}/tools/telehealth-comparison/`,
  },
};

// =============================================================================
// TYPES
// =============================================================================

interface TelehealthFeature {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface CategoryPick {
  title: string;
  slug: string;
  name: string;
  reason: string;
  bestFor: string;
}

// =============================================================================
// DATA
// =============================================================================

const TELEHEALTH_FEATURES: TelehealthFeature[] = [
  {
    name: "Video Quality",
    description: "HD video for clear, professional sessions",
    icon: Video,
  },
  {
    name: "HIPAA Compliance",
    description: "Required for protected health information",
    icon: Shield,
  },
  {
    name: "Virtual Waiting Room",
    description: "Professional client experience before sessions",
    icon: Clock,
  },
  {
    name: "Screen Sharing",
    description: "Share worksheets and psychoeducation materials",
    icon: Monitor,
  },
  {
    name: "Recording",
    description: "Record sessions for supervision or documentation",
    icon: Mic,
  },
  {
    name: "Mobile Support",
    description: "Apps for providers and patients",
    icon: Smartphone,
  },
];

// Top platforms for comparison table
const TOP_PLATFORMS = [
  "doxy-me",
  "zoom-for-healthcare",
  "thera-link",
  "telehealth-by-simplepractice",
  "vsee",
];

// Category picks
const CATEGORY_PICKS: CategoryPick[] = [
  {
    title: "Best Free Telehealth",
    slug: "doxy-me",
    name: "Doxy.me",
    reason:
      "Free tier with full HIPAA compliance and BAA included. No downloads required for patients.",
    bestFor: "Solo practitioners and small practices starting telehealth",
  },
  {
    title: "Best for Video Quality",
    slug: "zoom-for-healthcare",
    name: "Zoom for Healthcare",
    reason:
      "Enterprise-grade infrastructure with HD/1080p video, 99.9% uptime, and familiar interface patients already know.",
    bestFor: "Large practices needing reliable, high-quality video",
  },
  {
    title: "Best for EHR Integration",
    slug: "telehealth-by-simplepractice",
    name: "SimplePractice Telehealth",
    reason:
      "Seamlessly integrated with SimplePractice EHR. One-click session start, built-in documentation, unified billing.",
    bestFor: "Practices already using SimplePractice",
  },
  {
    title: "Best Mental Health-Specific",
    slug: "thera-link",
    name: "Thera-LINK",
    reason:
      "Built by therapists for therapy. Customizable calming waiting rooms, therapy-focused workflows.",
    bestFor: "Therapists wanting a purpose-built mental health platform",
  },
];

// Popular comparisons to link to
const POPULAR_COMPARISONS = [
  {
    slug: "doxyme-vs-zoom-healthcare",
    title: "Doxy.me vs Zoom for Healthcare",
    description: "Free vs enterprise telehealth",
  },
  {
    slug: "doxy-me-vs-thera-link",
    title: "Doxy.me vs Thera-LINK",
    description: "Browser-based telehealth comparison",
  },
  {
    slug: "doxy-me-vs-simplepractice",
    title: "Doxy.me vs SimplePractice Telehealth",
    description: "Standalone vs integrated telehealth",
  },
];

// =============================================================================
// HELPERS
// =============================================================================

function getFeatureValue(
  tool: ClinicianToolV4,
  feature: string
): string | boolean {
  // Access telehealth as extended property (may not exist in base schema)
  const telehealth = (tool as unknown as Record<string, unknown>).telehealth as Record<string, unknown> | undefined;
  const features = telehealth?.features as Record<string, unknown> | undefined;
  const videoQuality = telehealth?.video_quality as Record<string, unknown> | undefined;
  const patientExperience = telehealth?.patient_experience as Record<string, unknown> | undefined;

  switch (feature) {
    case "Video Quality":
      if (videoQuality?.full_hd_1080p) return "1080p HD";
      if (videoQuality?.hd_available) return "HD 720p";
      return videoQuality?.standard as string || "Standard";

    case "HIPAA Compliance":
      return tool.compliance?.hipaa_support === "yes";

    case "BAA Available":
      return tool.compliance?.baa_available === "yes";

    case "Virtual Waiting Room":
      return features?.waiting_room === true;

    case "Screen Sharing":
      return features?.screen_share === true;

    case "Recording":
      return features?.session_recording === true;

    case "Mobile Apps":
      return tool.feature_flags?.has_mobile_app === true;

    case "No Download Required":
      return patientExperience?.no_download_required === true;

    case "Group Sessions":
      return features?.group_sessions === true;

    case "Free Tier":
      return tool.pricing?.free_tier === true;

    case "Pricing":
      return tool.pricing?.starting_price_display || "Contact for pricing";

    default:
      return "Unknown";
  }
}

function renderFeatureCell(value: string | boolean): React.ReactNode {
  if (typeof value === "boolean") {
    return value ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-gray-300" />
    );
  }
  return <span className="text-sm text-label-primary">{value}</span>;
}

// =============================================================================
// STRUCTURED DATA
// =============================================================================

function generateStructuredData(tools: ClinicianToolV4[]): object[] {
  const schemas: object[] = [];
  const pageUrl = `${SITE_CONFIG.url}/tools/telehealth-comparison/`;

  // BreadcrumbList
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Tools",
        item: `${SITE_CONFIG.url}/tools/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "For Clinicians",
        item: `${SITE_CONFIG.url}/tools/for-clinicians/`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: "Telehealth Comparison",
        item: pageUrl,
      },
    ],
  });

  // FAQPage
  schemas.push({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the best free HIPAA-compliant telehealth platform?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Doxy.me offers the best free HIPAA-compliant telehealth with a permanent free tier that includes a Business Associate Agreement (BAA), unlimited 1:1 sessions, virtual waiting room, and browser-based video requiring no patient downloads.",
        },
      },
      {
        "@type": "Question",
        name: "Is regular Zoom HIPAA compliant for therapy?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No, standard Zoom plans are NOT HIPAA compliant. Only Zoom for Healthcare includes the required BAA and healthcare-specific security features. Using regular Zoom for therapy sessions creates compliance risk now that COVID-era enforcement discretion has ended.",
        },
      },
      {
        "@type": "Question",
        name: "Do patients need to download an app for telehealth sessions?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "It depends on the platform. Doxy.me, Thera-LINK, and SimplePractice Telehealth are browser-based and require no downloads. Zoom works best with the app installed, though a browser option exists with limited features.",
        },
      },
      {
        "@type": "Question",
        name: "What features should I look for in a telehealth platform for therapy?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Key features include: HIPAA compliance with BAA, virtual waiting room, HD video quality, screen sharing for worksheets, mobile support, no-download patient experience, and integration with your EHR if applicable. Recording capability is useful for supervision but not essential for most practices.",
        },
      },
    ],
  });

  // ItemList for comparison
  schemas.push({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Best Telehealth Platforms for Therapists (2026)",
    description:
      "Comparison of top HIPAA-compliant telehealth platforms for mental health practices",
    numberOfItems: tools.length,
    itemListElement: tools.map((tool, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SoftwareApplication",
        name: tool.name,
        applicationCategory: "HealthApplication",
        description: tool.short_description,
        url: `${SITE_CONFIG.url}/tools/for-clinicians/telehealth-communication/${tool.slug}/`,
      },
    })),
  });

  // Article schema
  schemas.push({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: "Telehealth Platforms for Therapists Compared (2026)",
    description:
      "Comprehensive comparison of HIPAA-compliant telehealth platforms for mental health practices",
    datePublished: "2026-01-01T00:00:00Z",
    dateModified: new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: "HeyPsych Editorial Team",
      url: `${SITE_CONFIG.url}/about/`,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_CONFIG.url}/logo.png`,
      },
    },
  });

  return schemas;
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function TelehealthComparisonPage() {
  // Load telehealth tools
  const allTools = await ClinicianToolService.getByCategory(
    "telehealth-communication"
  );

  // Filter to our top platforms that exist and are publishable
  const topTools = TOP_PLATFORMS.map((slug) =>
    allTools.find((t) => t.slug === slug)
  ).filter((t): t is ClinicianToolV4 => t !== undefined);

  // Get category picks tools
  const categoryPickTools = await Promise.all(
    CATEGORY_PICKS.map(async (pick) => {
      const tool = await ClinicianToolService.getBySlug(pick.slug);
      return { ...pick, tool };
    })
  );

  const structuredData = generateStructuredData(topTools);

  // Comparison features for the table
  const comparisonFeatures = [
    "Video Quality",
    "HIPAA Compliance",
    "BAA Available",
    "Virtual Waiting Room",
    "Screen Sharing",
    "Recording",
    "Mobile Apps",
    "No Download Required",
    "Group Sessions",
    "Free Tier",
    "Pricing",
  ];

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
        <section className="bg-surface border-b border-separator">
          <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm">
              <Link
                href="/tools/"
                className="text-label-secondary hover:text-accent transition-colors"
              >
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <Link
                href="/tools/for-clinicians/"
                className="text-label-secondary hover:text-accent transition-colors"
              >
                For Clinicians
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">
                Telehealth Comparison
              </span>
            </nav>

            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-canvas p-3 border border-separator">
                <Video className="h-8 w-8 text-treatment" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
                  Clinician Tools
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-label-primary sm:text-3xl">
                  Telehealth Platforms for Therapists Compared
                </h1>
                <p className="mt-2 text-sm text-label-secondary">
                  {allTools.length} platforms reviewed | Updated September 2026
                </p>
              </div>
            </div>

            {/* Direct Answer */}
            <div
              className="mt-6 rounded-xl border border-separator bg-canvas p-5"
              data-speakable="true"
            >
              <p className="text-lg text-label-primary leading-relaxed">
                <strong>Quick Answer:</strong> For most solo therapists and
                small practices,{" "}
                <Link
                  href="/tools/for-clinicians/telehealth-communication/doxy-me/"
                  className="text-treatment hover:underline font-medium"
                >
                  Doxy.me
                </Link>{" "}
                offers the best value with free HIPAA-compliant video, no
                patient downloads, and included BAA. Practices needing
                enterprise reliability should consider{" "}
                <Link
                  href="/tools/for-clinicians/telehealth-communication/zoom-for-healthcare/"
                  className="text-treatment hover:underline font-medium"
                >
                  Zoom for Healthcare
                </Link>
                . If you already use{" "}
                <Link
                  href="/tools/for-clinicians/ehr-practice-management/simplepractice/"
                  className="text-treatment hover:underline font-medium"
                >
                  SimplePractice
                </Link>
                , their built-in telehealth provides seamless workflow
                integration.
              </p>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="bg-canvas border-b border-separator px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              Key Features to Compare
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TELEHEALTH_FEATURES.map((feature) => (
                <div
                  key={feature.name}
                  className="flex items-start gap-3 rounded-lg border border-separator bg-surface p-4"
                >
                  <feature.icon className="h-5 w-5 text-treatment mt-0.5" />
                  <div>
                    <h3 className="font-medium text-label-primary">
                      {feature.name}
                    </h3>
                    <p className="text-sm text-label-secondary">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="bg-surface border-b border-separator px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary mb-2">
              Side-by-Side Comparison
            </h2>
            <p className="text-label-secondary mb-6">
              Compare the top {topTools.length} telehealth platforms for mental
              health practices
            </p>

            <div className="overflow-x-auto rounded-xl border border-separator">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="bg-canvas border-b border-separator">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-label-primary">
                      Feature
                    </th>
                    {topTools.map((tool) => (
                      <th
                        key={tool.slug}
                        className="px-4 py-3 text-center text-sm font-semibold text-label-primary"
                      >
                        <Link
                          href={`/tools/for-clinicians/telehealth-communication/${tool.slug}/`}
                          className="hover:text-treatment transition-colors"
                        >
                          {tool.name}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((feature, idx) => (
                    <tr
                      key={feature}
                      className={
                        idx % 2 === 0 ? "bg-surface" : "bg-canvas/50"
                      }
                    >
                      <td className="px-4 py-3 text-sm font-medium text-label-primary">
                        {feature}
                      </td>
                      {topTools.map((tool) => (
                        <td
                          key={tool.slug}
                          className="px-4 py-3 text-center"
                        >
                          {renderFeatureCell(getFeatureValue(tool, feature))}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Compare tools link */}
            <div className="mt-6 flex justify-center">
              <Link
                href={`/tools/compare/?tools=${topTools.map((t) => t.slug).join(",")}`}
                className="group inline-flex items-center gap-2 rounded-lg bg-treatment px-5 py-2.5 text-sm font-medium text-treatment-foreground transition-all hover:bg-treatment-600"
              >
                Compare All Features Side by Side
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Category Picks */}
        <section className="bg-canvas border-b border-separator px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6">
              Our Top Picks by Category
            </h2>

            <div className="grid gap-6 sm:grid-cols-2">
              {categoryPickTools.map((pick) => (
                <div
                  key={pick.slug}
                  className="rounded-xl border border-separator bg-surface p-6"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="h-5 w-5 text-amber-500" />
                    <span className="text-sm font-semibold text-amber-600 uppercase tracking-wide">
                      {pick.title}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-label-primary mb-2">
                    <Link
                      href={`/tools/for-clinicians/telehealth-communication/${pick.slug}/`}
                      className="hover:text-treatment transition-colors"
                    >
                      {pick.name}
                    </Link>
                  </h3>
                  <p className="text-label-secondary text-sm mb-3">
                    {pick.reason}
                  </p>
                  <p className="text-xs text-label-tertiary">
                    <strong>Best for:</strong> {pick.bestFor}
                  </p>
                  {pick.tool?.pricing?.starting_price_display && (
                    <div className="mt-3 flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-label-tertiary" />
                      <span className="text-label-secondary">
                        {pick.tool.pricing.starting_price_display}
                      </span>
                    </div>
                  )}
                  <Link
                    href={`/tools/for-clinicians/telehealth-communication/${pick.slug}/`}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
                  >
                    View full details
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular Comparisons */}
        <section className="bg-surface border-b border-separator px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-xl font-semibold text-label-primary mb-2">
              Popular Head-to-Head Comparisons
            </h2>
            <p className="text-label-secondary mb-6">
              Detailed comparisons of the most searched telehealth matchups
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              {POPULAR_COMPARISONS.map((comparison) => (
                <Link
                  key={comparison.slug}
                  href={`/tools/compare/${comparison.slug}/`}
                  className="group rounded-xl border border-separator bg-canvas p-5 transition-all hover:border-treatment/30 hover:shadow-sm"
                >
                  <h3 className="font-semibold text-label-primary group-hover:text-treatment transition-colors">
                    {comparison.title}
                  </h3>
                  <p className="text-sm text-label-secondary mt-1">
                    {comparison.description}
                  </p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-treatment">
                    Compare now
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>

            {/* Link to all comparisons */}
            <div className="mt-6 text-center">
              <Link
                href="/tools/compare/"
                className="text-sm text-treatment hover:underline"
              >
                View all tool comparisons
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-canvas border-b border-separator px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-6 text-center">
              Frequently Asked Questions
            </h2>

            <div className="space-y-4">
              <details className="group rounded-xl border border-separator bg-surface">
                <summary className="cursor-pointer px-5 py-4 font-medium text-label-primary hover:text-treatment transition-colors">
                  What is the best free HIPAA-compliant telehealth platform?
                </summary>
                <div className="px-5 pb-4 text-label-secondary">
                  <p>
                    <strong>Doxy.me</strong> offers the best free HIPAA-compliant
                    telehealth with a permanent free tier that includes a
                    Business Associate Agreement (BAA), unlimited 1:1 sessions,
                    virtual waiting room, and browser-based video requiring no
                    patient downloads. VSee also offers a free tier but with more
                    limited features.
                  </p>
                </div>
              </details>

              <details className="group rounded-xl border border-separator bg-surface">
                <summary className="cursor-pointer px-5 py-4 font-medium text-label-primary hover:text-treatment transition-colors">
                  Is regular Zoom HIPAA compliant for therapy sessions?
                </summary>
                <div className="px-5 pb-4 text-label-secondary">
                  <p>
                    <strong>No.</strong> Standard Zoom plans (including Zoom
                    Pro) are NOT HIPAA compliant. Only{" "}
                    <strong>Zoom for Healthcare</strong> includes the required
                    BAA and healthcare-specific security features. The COVID-era
                    enforcement discretion has ended, so using regular Zoom for
                    therapy sessions with PHI creates compliance risk.
                  </p>
                </div>
              </details>

              <details className="group rounded-xl border border-separator bg-surface">
                <summary className="cursor-pointer px-5 py-4 font-medium text-label-primary hover:text-treatment transition-colors">
                  Do patients need to download an app for telehealth?
                </summary>
                <div className="px-5 pb-4 text-label-secondary">
                  <p>
                    It depends on the platform. <strong>Doxy.me</strong>,{" "}
                    <strong>Thera-LINK</strong>, and{" "}
                    <strong>SimplePractice Telehealth</strong> are browser-based
                    and require no downloads - patients simply click a link.
                    Zoom works best with the app installed, though a browser
                    option exists with limited features. For patients with
                    limited tech experience, no-download platforms reduce
                    friction and missed sessions.
                  </p>
                </div>
              </details>

              <details className="group rounded-xl border border-separator bg-surface">
                <summary className="cursor-pointer px-5 py-4 font-medium text-label-primary hover:text-treatment transition-colors">
                  Should I use standalone telehealth or my EHR's built-in
                  telehealth?
                </summary>
                <div className="px-5 pb-4 text-label-secondary">
                  <p>
                    If you're already using an EHR like{" "}
                    <strong>SimplePractice</strong>,{" "}
                    <strong>TherapyNotes</strong>, or <strong>Jane</strong>,
                    their built-in telehealth is usually the best choice. You
                    get one-click session start, integrated documentation, and
                    unified billing without juggling multiple tools. Standalone
                    platforms like Doxy.me or Zoom make sense if you need
                    specific features your EHR doesn't offer, or if you're not
                    using an EHR.
                  </p>
                </div>
              </details>

              <details className="group rounded-xl border border-separator bg-surface">
                <summary className="cursor-pointer px-5 py-4 font-medium text-label-primary hover:text-treatment transition-colors">
                  What features are most important for therapy telehealth?
                </summary>
                <div className="px-5 pb-4 text-label-secondary">
                  <p>
                    <strong>Essential:</strong> HIPAA compliance with BAA,
                    reliable video quality, virtual waiting room.
                    <br />
                    <strong>Important:</strong> Screen sharing (for worksheets),
                    no-download patient experience, mobile support.
                    <br />
                    <strong>Nice to have:</strong> Recording capability (for
                    supervision), group sessions, EHR integration, custom
                    branding.
                  </p>
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* All Telehealth Tools */}
        <section className="bg-surface border-b border-separator px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-label-primary">
                  All Telehealth Platforms
                </h2>
                <p className="text-label-secondary text-sm">
                  Browse all {allTools.length} telehealth platforms in our
                  directory
                </p>
              </div>
              <Link
                href="/tools/for-clinicians/telehealth-communication/"
                className="text-sm font-medium text-treatment hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {allTools.slice(0, 12).map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/for-clinicians/telehealth-communication/${tool.slug}/`}
                  className="flex items-center gap-3 rounded-lg border border-separator bg-canvas p-3 transition-all hover:border-treatment/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-label-primary truncate">
                      {tool.name}
                    </p>
                    <p className="text-xs text-label-tertiary truncate">
                      {tool.pricing?.starting_price_display || "Contact for pricing"}
                    </p>
                  </div>
                  {tool.pricing?.free_tier && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                      Free
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {allTools.length > 12 && (
              <div className="mt-6 text-center">
                <Link
                  href="/tools/for-clinicians/telehealth-communication/"
                  className="inline-flex items-center gap-2 text-sm font-medium text-treatment hover:underline"
                >
                  View all {allTools.length} telehealth platforms
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Trust Signal */}
        <TrustSignal />

        {/* Vendor CTA */}
        <VendorCTA />
      </div>
    </>
  );
}

// =============================================================================
// STATIC GENERATION
// =============================================================================

export const revalidate = 86400; // 24 hours
