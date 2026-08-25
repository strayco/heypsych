// src/app/tools/[slug]/page.tsx
// Individual Tool Page

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ToolService } from "@/lib/tools/tool-service";
import { DirectAnswerBlock } from "@/components/tools/DirectAnswerBlock";
import { BoardAttribution } from "@/components/tools/BoardAttribution";
import { ToolFAQ } from "@/components/tools/ToolFAQ";
import { RelatedTools } from "@/components/tools/RelatedTools";
import { RelatedHubs } from "@/components/tools/RelatedHubs";
import { ClinicianModule } from "@/components/tools/ClinicianModule";
import { ToolOutboundLinks } from "./ToolOutboundLinks";
import { siteConfig } from "@/lib/config/site";
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
          <ToolOutboundLinks
            toolSlug={tool.slug}
            toolName={tool.name}
            appStoreUrl={tool.app_metadata?.app_store_url}
            googlePlayUrl={tool.app_metadata?.google_play_url}
            websiteUrl={tool.app_metadata?.website}
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

        {/* Related Tools */}
        <RelatedTools tools={relatedTools} />

        {/* Related Hubs */}
        <RelatedHubs hubSlugs={tool.primary_hubs} currentToolSlug={tool.slug} />
      </div>
    </>
  );
}

// Generate structured data for the tool
// Uses siteConfig.url for all URLs - never hardcoded
function generateStructuredData(tool: any): object[] {
  const schemas: object[] = [];
  const baseUrl = siteConfig.url;

  // SoftwareApplication schema
  const appSchema: any = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${baseUrl}/tools/${tool.slug}/#app`,
    name: tool.name,
    description: tool.short_description,
    applicationCategory: "HealthApplication",
    operatingSystem: getOperatingSystems(tool.platforms),
  };

  if (tool.app_rating && tool.total_reviews) {
    appSchema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: tool.app_rating,
      reviewCount: tool.total_reviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  if (tool.pricing) {
    appSchema.offers = {
      "@type": "Offer",
      price: tool.pricing.free_tier ? "0" : "",
      priceCurrency: "USD",
    };
  }

  schemas.push(appSchema);

  // FAQPage schema
  if (tool.seo.faqs && tool.seo.faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
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

  // BreadcrumbList schema
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Tools",
        item: `${baseUrl}/tools/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: tool.name,
        item: `${baseUrl}/tools/${tool.slug}/`,
      },
    ],
  });

  return schemas;
}

function getOperatingSystems(platforms: any): string[] {
  const os: string[] = [];
  if (platforms.ios) os.push("iOS");
  if (platforms.android) os.push("Android");
  if (platforms.web) os.push("Web");
  if (platforms.desktop) os.push("Windows", "macOS");
  return os;
}

export const revalidate = 86400; // 24 hours
export const dynamicParams = true;
