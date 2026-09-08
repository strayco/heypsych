// src/app/tools/[slug]/page.tsx
// Individual Tool Page

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Scale } from "lucide-react";
import { ToolService } from "@/lib/tools/tool-service";
import { KEY_COMPARISONS, TOP_APPS } from "@/lib/seo/patient-programmatic-seo-engine";
import { DirectAnswerBlock } from "@/components/tools/DirectAnswerBlock";
import { DecisionContext } from "@/components/tools/DecisionContext";
import { BoardAttribution } from "@/components/tools/BoardAttribution";
import { ToolFAQ } from "@/components/tools/ToolFAQ";
import { RelatedTools } from "@/components/tools/RelatedTools";
import { RelatedHubs } from "@/components/tools/RelatedHubs";
import { ClinicianModule } from "@/components/tools/ClinicianModule";
import { ToolOutboundLinks } from "./ToolOutboundLinks";
import { siteConfig } from "@/lib/config/site";
import { shouldShowCommercialLink } from "@/lib/commercial/kill-switch";
import {
  getToolCanonicalUrl,
  getToolRobotsMeta,
} from "@/lib/tools/tools-seo";
import { getComplianceDisplayText } from "@/lib/schemas/tool-editorial";
import { stripBrandTitleSuffix } from "@/lib/seo/title";

// Generate static params for all tools
export async function generateStaticParams() {
  try {
    const slugs = await ToolService.getAllSlugs();
    console.log(`📦 Generating ${slugs.length} static tool pages`);
    return slugs.map((slug) => ({ slug }));
  } catch (error) {
    console.error("Failed to generate static params for tools:", error);
    return [];
  }
}

// Generate metadata with SEO control plane integration
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = await ToolService.getBySlug(slug);

  if (!tool) {
    return {
      title: "Tool Not Found",
      description: "This tool could not be found.",
      robots: "noindex, nofollow",
    };
  }

  // Get canonical and robots from central SEO control plane
  const canonicalUrl = getToolCanonicalUrl(slug);
  const robotsMeta = getToolRobotsMeta(tool);

  return {
    // Tool data authors titles with a trailing "| HeyPsych"; the root layout
    // template appends the brand too. Open Graph keeps the authored form since
    // Next.js renders it verbatim without the template.
    title: stripBrandTitleSuffix(tool.seo.title),
    description: tool.seo.meta_description,
    alternates: {
      canonical: canonicalUrl,
    },
    // Apply robots decision from central indexation firewall
    robots: robotsMeta,
    openGraph: {
      title: tool.seo.title,
      description: tool.seo.meta_description,
      url: canonicalUrl,
      type: "website",
    },
  };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = await ToolService.getBySlug(slug);

  if (!tool) {
    notFound();
  }

  const relatedTools = await ToolService.getRelated(slug, 4);

  // Check if affiliate links are enabled for this tool (Phase 6: kill switch)
  const affiliateEnabled = shouldShowCommercialLink(
    tool.slug,
    tool.app_metadata?.commercial?.partnerSlug
  );

  // Generate structured data
  const structuredData = generateStructuredData(tool);

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

      <div className="min-h-screen bg-white">
        {/* Back Navigation */}
        <nav className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6 lg:px-8">
            <Link
              href="/tools/"
              className="inline-flex items-center gap-2 text-sm text-neutral-600 hover:text-indigo-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Tools
            </Link>
          </div>
        </nav>

        {/* Direct Answer Block (AEO Hero) */}
        <DirectAnswerBlock tool={tool} />

        {/* Board Attribution - MANDATORY */}
        <div className="bg-neutral-50 border-b border-neutral-200">
          <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 lg:px-8">
            <BoardAttribution
              label={tool.governance.reviewed_by_label}
              url={tool.governance.reviewed_by_url}
              lastReviewed={tool.governance.last_reviewed}
            />
          </div>
        </div>

        {/* Decision Context - Phase 4: Evidence, tradeoffs, uncertainty */}
        <DecisionContext tool={tool} />

        {/* Main Content */}
        <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Long Description */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              About {tool.name}
            </h2>
            <div className="prose prose-neutral max-w-none">
              <p>{tool.long_description}</p>
            </div>
          </section>

          {/* Download Links - with analytics tracking */}
          {/* Priority: affiliate_url > app stores > website */}
          {/* Phase 6: Includes commercial disclosure when affiliate active */}
          <ToolOutboundLinks
            toolSlug={tool.slug}
            toolName={tool.name}
            appStoreUrl={tool.app_metadata?.app_store_url}
            googlePlayUrl={tool.app_metadata?.google_play_url}
            websiteUrl={tool.app_metadata?.website}
            affiliateUrl={tool.app_metadata?.affiliate_url}
            commercial={tool.app_metadata?.commercial}
            affiliateDisabled={!affiliateEnabled}
          />

          {/* Clinical Evidence */}
          {tool.clinical_metadata?.clinical_trials && tool.clinical_metadata.clinical_trials.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-bold text-neutral-900 mb-4">
                Clinical Evidence
              </h2>
              <div className="space-y-4">
                {tool.clinical_metadata.clinical_trials.slice(0, 3).map((trial, i) => (
                  <div key={i} className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                    <p className="font-medium text-neutral-900">{trial.study}</p>
                    {trial.outcome && (
                      <p className="mt-2 text-sm text-neutral-600">{trial.outcome}</p>
                    )}
                    {trial.citation && (
                      <p className="mt-2 text-xs text-neutral-500">
                        {trial.citation.authors} ({trial.citation.year}). {trial.citation.journal}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Privacy Details */}
          <section className="mb-8">
            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              Privacy & Security
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 bg-neutral-50 rounded-lg">
                <dt className="text-sm text-neutral-500">Privacy Grade</dt>
                <dd className="mt-1 text-lg font-bold text-neutral-900">
                  {tool.privacy.grade !== "unknown" ? tool.privacy.grade : "Not rated"}
                </dd>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg">
                <dt className="text-sm text-neutral-500">HIPAA Compliant</dt>
                <dd className="mt-1 text-lg font-bold text-neutral-900">
                  {getComplianceDisplayText(tool.privacy.hipaa_compliant)}
                </dd>
              </div>
              <div className="p-4 bg-neutral-50 rounded-lg">
                <dt className="text-sm text-neutral-500">Data Sold</dt>
                <dd className="mt-1 text-lg font-bold text-neutral-900">
                  {tool.privacy.data_sold ? "Yes" : "No"}
                </dd>
              </div>
            </div>
            {tool.privacy.notes && (
              <p className="mt-4 text-sm text-neutral-600">{tool.privacy.notes}</p>
            )}
          </section>
        </main>

        {/* Clinician Module - conditional */}
        <ClinicianModule tool={tool} />

        {/* FAQ */}
        <ToolFAQ faqs={tool.seo.faqs} toolName={tool.name} />

        {/* Related Tools - SEO enhanced with alternatives text */}
        <RelatedTools
          tools={relatedTools}
          title={`Alternatives to ${tool.name}`}
          currentToolName={tool.name}
        />

        {/* Compare Section */}
        <PatientCompareSection currentSlug={slug} toolName={tool.name} />

        {/* Related Hubs - SEO enhanced with keyword-rich linking */}
        <RelatedHubs
          hubSlugs={tool.primary_hubs}
          currentToolSlug={tool.slug}
          currentToolName={tool.name}
        />
      </div>
    </>
  );
}

// Generate structured data for the tool
// Uses siteConfig.url for all URLs - never hardcoded
// AGGRESSIVE SEO: Multiple overlapping schemas for maximum rich result coverage
function generateStructuredData(tool: any): object[] {
  const schemas: object[] = [];
  const baseUrl = siteConfig.url;
  const toolUrl = `${baseUrl}/tools/${tool.slug}/`;
  const currentDate = new Date().toISOString();

  // 1. SoftwareApplication schema - Primary app rich result
  const appSchema: any = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${toolUrl}#app`,
    name: tool.name,
    description: tool.short_description || tool.one_liner,
    applicationCategory: "HealthApplication",
    applicationSubCategory: "Mental Health",
    operatingSystem: getOperatingSystems(tool.platforms),
    url: toolUrl,
    downloadUrl: tool.app_metadata?.app_store_url || tool.app_metadata?.website,
    softwareVersion: "Latest",
    dateModified: currentDate,
    inLanguage: "en-US",
  };

  // Enhanced aggregate rating
  if (tool.app_rating && tool.total_reviews) {
    appSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: tool.app_rating,
      reviewCount: tool.total_reviews,
      bestRating: 5,
      worstRating: 1,
      ratingExplanation: `Average rating from ${formatReviewCount(tool.total_reviews)} user reviews`,
    };
  }

  // Enhanced offer with price details
  if (tool.pricing) {
    appSchema.offers = {
      "@type": "Offer",
      price: tool.pricing.model === "free" ? "0" : (tool.pricing.starting_price ? extractPrice(tool.pricing.starting_price) : "0"),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      seller: tool.app_metadata?.publisher ? {
        "@type": "Organization",
        name: tool.app_metadata.publisher,
      } : undefined,
    };
  }

  // Add screenshot if available
  if (tool.app_metadata?.screenshots?.length > 0) {
    appSchema.screenshot = tool.app_metadata.screenshots[0];
  }

  schemas.push(appSchema);

  // 2. Product schema - For commerce-style rich results (price, rating stars)
  const productSchema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${toolUrl}#product`,
    name: tool.name,
    description: tool.short_description || tool.one_liner,
    brand: {
      "@type": "Brand",
      name: tool.app_metadata?.publisher || tool.name,
    },
    category: "Mental Health App",
    url: toolUrl,
  };

  if (tool.app_rating && tool.total_reviews) {
    productSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: tool.app_rating,
      reviewCount: tool.total_reviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // Product offers - more detailed pricing
  productSchema.offers = {
    "@type": "AggregateOffer",
    priceCurrency: "USD",
    lowPrice: tool.pricing.model === "free" || tool.pricing.free_tier ? "0" : (extractPrice(tool.pricing.starting_price) || "0"),
    highPrice: extractPrice(tool.pricing.starting_price) || "0",
    offerCount: 1,
    availability: "https://schema.org/InStock",
  };

  schemas.push(productSchema);

  // 3. WebPage with speakable - Voice search optimization
  schemas.push({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${toolUrl}#webpage`,
    name: tool.seo.title,
    description: tool.seo.meta_description,
    url: toolUrl,
    dateModified: currentDate,
    datePublished: tool.governance?.last_reviewed || currentDate,
    isPartOf: {
      "@type": "WebSite",
      "@id": `${baseUrl}/#website`,
      name: "HeyPsych",
      url: baseUrl,
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", ".direct-answer", "[data-speakable]"],
    },
    mainEntity: {
      "@type": "SoftwareApplication",
      "@id": `${toolUrl}#app`,
    },
  });

  // 4. MedicalWebPage - Health-specific rich results
  schemas.push({
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "@id": `${toolUrl}#medical`,
    name: `${tool.name} for Mental Health`,
    description: tool.patient_summary || tool.short_description,
    url: toolUrl,
    lastReviewed: tool.governance?.last_reviewed,
    reviewedBy: {
      "@type": "Organization",
      name: "HeyPsych Medical Review Board",
      url: `${baseUrl}/about/medical-review-board`,
    },
    medicalAudience: {
      "@type": "MedicalAudience",
      audienceType: "Patient",
    },
    medicineSystem: "https://schema.org/WesternConventional",
  });

  // 5. HowTo schema - Targets "how to use X" queries
  schemas.push({
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${toolUrl}#howto`,
    name: `How to Use ${tool.name}`,
    description: `Get started with ${tool.name} for mental health support`,
    totalTime: "PT5M",
    estimatedCost: {
      "@type": "MonetaryAmount",
      currency: "USD",
      value: tool.pricing.model === "free" ? "0" : (extractPrice(tool.pricing.starting_price) || "0"),
    },
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Download the app",
        text: `Download ${tool.name} from the ${tool.platforms.ios ? "App Store" : ""}${tool.platforms.ios && tool.platforms.android ? " or " : ""}${tool.platforms.android ? "Google Play Store" : ""}${tool.platforms.web ? " or access via web browser" : ""}.`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Create your account",
        text: `Sign up for a ${tool.pricing.model === "free" ? "free" : tool.pricing.free_tier ? "free" : "paid"} account to get started.`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Begin your journey",
        text: tool.best_for[0] ? `Start using ${tool.name} for ${tool.best_for[0].toLowerCase()}.` : `Start using ${tool.name} for mental health support.`,
      },
    ],
  });

  // 6. FAQPage schema - Targets "People Also Ask"
  if (tool.seo.faqs && tool.seo.faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${toolUrl}#faq`,
      mainEntity: tool.seo.faqs.map((faq: any) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.a,
        },
      })),
    });
  }

  // 7. BreadcrumbList schema - Sitelinks
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Mental Health Apps",
        item: `${baseUrl}/tools/for-patients/`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: tool.name,
        item: toolUrl,
      },
    ],
  });

  // 8. ItemList for "Best For" - Lists rich result
  if (tool.best_for && tool.best_for.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${toolUrl}#bestfor`,
      name: `Who ${tool.name} is Best For`,
      description: `${tool.name} is recommended for these use cases`,
      numberOfItems: tool.best_for.length,
      itemListElement: tool.best_for.map((useCase: string, index: number) => ({
        "@type": "ListItem",
        position: index + 1,
        name: useCase,
      })),
    });
  }

  return schemas;
}

// Helper: Extract numeric price from string like "$9.99/month"
function extractPrice(priceString: string | undefined): string {
  if (!priceString) return "0";
  const match = priceString.match(/\$?([\d.]+)/);
  return match ? match[1] : "0";
}

// Helper: Format review count for display
function formatReviewCount(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)} million`;
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return count.toString();
}

function getOperatingSystems(platforms: any): string[] {
  const os: string[] = [];
  if (platforms.ios) os.push("iOS");
  if (platforms.android) os.push("Android");
  if (platforms.web) os.push("Web");
  if (platforms.desktop) os.push("Windows", "macOS");
  return os;
}

/**
 * Compare section showing VS pages that include this tool
 */
function PatientCompareSection({ currentSlug, toolName }: { currentSlug: string; toolName: string }) {
  // Find comparisons that include this tool
  const relevantComparisons = KEY_COMPARISONS.filter(
    ({ a, b }) => a === currentSlug || b === currentSlug
  );

  if (relevantComparisons.length === 0) return null;

  return (
    <section className="border-t border-neutral-200 bg-neutral-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-2 mb-4">
          <Scale className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-neutral-900">
            Compare {toolName}
          </h2>
        </div>
        <div className="flex flex-wrap gap-3">
          {relevantComparisons.map(({ a, b }) => {
            const otherSlug = a === currentSlug ? b : a;
            const otherApp = TOP_APPS.find((app) => app.slug === otherSlug);
            const otherName = otherApp?.name || otherSlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

            return (
              <Link
                key={`${a}-vs-${b}`}
                href={`/tools/for-patients/compare/${a}-vs-${b}/`}
                className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {toolName} vs {otherName}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            );
          })}
        </div>
        <Link
          href="/tools/for-patients/compare/"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          View all comparisons
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

export const revalidate = 86400; // 24 hours
export const dynamicParams = true;
