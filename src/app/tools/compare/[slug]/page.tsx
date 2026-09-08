/**
 * Curated Tool Comparison Page
 *
 * Renders pre-authored head-to-head comparisons from data/tools-v4/comparisons/
 * These are the canonical, indexed versions of tool comparisons.
 *
 * URL format: /tools/compare/[slug] (e.g., /tools/compare/simplepractice-vs-therapynotes)
 *
 * SECURITY:
 * - Slug validation prevents path traversal attacks
 * - Only statically generated paths are allowed (dynamicParams = false)
 * - Comparison JSON is validated with Zod schema
 */

import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Metadata } from "next";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { z } from "zod";
import { SITE_CONFIG } from "@/lib/seo/config";
import {
  generateToolComparison,
  serializeToolComparisonResult,
  type ToolComparisonContext,
} from "../comparison-engine";
import { ComparePageClient } from "../compare-client";
import {
  ClinicianToolService,
  isToolPublishable,
  type ClinicianToolV4,
} from "@/lib/tools/clinician-tool-service";

// =============================================================================
// SECURITY: STRICT VALIDATION
// =============================================================================

// Only allow safe slug characters: lowercase alphanumeric and hyphens
const SAFE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Zod schema for curated comparison JSON
const CuratedComparisonSchema = z.object({
  slug: z.string().regex(SAFE_SLUG_REGEX),
  type: z.literal("comparison").optional(),
  name: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  metadata: z.object({
    category: z.string(),
    comparison_type: z.string(),
    search_volume: z.string().optional(),
    last_updated: z.string().optional(),
  }),
  tools: z.array(z.string()).min(2).max(4),
  entities: z.record(z.string(), z.any()).optional(),
  summary: z.object({
    bottom_line: z.string(),
    key_differences: z.record(z.string(), z.string()),
  }).optional(),
  comparison_table: z.any().optional(),
  // `faqs` is the field the comparison files actually use. Zod strips unknown
  // keys, so declaring only the legacy singular `faq` silently discarded every
  // question and left these pages with no FAQ content to mark up.
  faqs: z
    .array(z.object({ q: z.string(), a: z.string() }).passthrough())
    .optional(),
  faq: z.any().optional(),
  seo: z.any().optional(),
});

type CuratedComparison = z.infer<typeof CuratedComparisonSchema>;

// Prevent dynamic routes - only statically generated slugs are allowed
export const dynamicParams = false;

// =============================================================================
// TYPES
// =============================================================================

interface PageProps {
  params: Promise<{ slug: string }>;
}

interface PublishableComparison {
  comparison: CuratedComparison;
  tools: Map<string, ClinicianToolV4>;
}

// =============================================================================
// DATA LOADING (SECURE)
// =============================================================================

const COMPARISONS_DIR = join(process.cwd(), "data/tools-v4/comparisons");

/**
 * Validate slug is safe (no path traversal)
 */
function isValidSlug(slug: string): boolean {
  if (!SAFE_SLUG_REGEX.test(slug)) {
    return false;
  }
  // Double-check: resolved path must be within comparisons directory
  const filePath = resolve(COMPARISONS_DIR, `${slug}.json`);
  return filePath.startsWith(resolve(COMPARISONS_DIR));
}

/**
 * Load and validate curated comparison by slug
 * Returns null if not found, invalid, or tools aren't publishable
 */
async function getPublishableComparison(
  slug: string
): Promise<PublishableComparison | null> {
  // Security: Validate slug format
  if (!isValidSlug(slug)) {
    console.warn(`[Comparison] Invalid slug format: ${slug}`);
    return null;
  }

  const filePath = join(COMPARISONS_DIR, `${slug}.json`);

  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const raw = JSON.parse(readFileSync(filePath, "utf-8"));

    // Validate against schema
    const parseResult = CuratedComparisonSchema.safeParse(raw);
    if (!parseResult.success) {
      console.error(
        `[Comparison] Schema validation failed for ${slug}:`,
        parseResult.error.issues
      );
      return null;
    }

    const comparison = parseResult.data;

    // Verify slug in JSON matches URL slug (prevent mismatch attacks)
    if (comparison.slug !== slug) {
      console.warn(
        `[Comparison] Slug mismatch: URL=${slug}, JSON=${comparison.slug}`
      );
      return null;
    }

    // Load and verify all tools are publishable
    const tools = new Map<string, ClinicianToolV4>();
    for (const toolSlug of comparison.tools) {
      const tool = await ClinicianToolService.getBySlug(toolSlug);
      if (!tool || !isToolPublishable(tool)) {
        // One or more tools not publishable - comparison not available
        return null;
      }
      tools.set(toolSlug, tool);
    }

    return { comparison, tools };
  } catch (error) {
    console.error(`[Comparison] Failed to load ${slug}:`, error);
    return null;
  }
}

/**
 * Get all publishable curated comparisons for navigation
 */
async function getAllPublishableCurated(): Promise<
  Array<{
    slug: string;
    name: string;
    title: string;
    description: string;
    category: string;
    tools: string[];
  }>
> {
  if (!existsSync(COMPARISONS_DIR)) {
    return [];
  }

  try {
    const files = readdirSync(COMPARISONS_DIR);
    const publishable: Array<{
      slug: string;
      name: string;
      title: string;
      description: string;
      category: string;
      tools: string[];
    }> = [];

    for (const f of files) {
      if (!f.endsWith(".json")) continue;

      const slug = f.replace(".json", "");
      const result = await getPublishableComparison(slug);

      if (result) {
        publishable.push({
          slug: result.comparison.slug,
          name: result.comparison.name,
          title: result.comparison.title,
          description: result.comparison.description,
          category: result.comparison.metadata.category,
          tools: result.comparison.tools,
        });
      }
    }

    return publishable.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("[Comparison] Failed to read comparisons:", error);
    return [];
  }
}

// =============================================================================
// STATIC PATHS
// =============================================================================

export async function generateStaticParams() {
  const publishable = await getAllPublishableCurated();
  return publishable.map((c) => ({ slug: c.slug }));
}

// =============================================================================
// METADATA
// =============================================================================

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // Use same publication gate as rendering
  const result = await getPublishableComparison(slug);

  if (!result) {
    // Return noindex metadata for non-publishable comparisons
    return {
      title: "Comparison Not Found",
      robots: { index: false, follow: false },
    };
  }

  const { comparison, tools } = result;
  const toolNames = comparison.tools.map((s) => tools.get(s)?.name || s);
  const vsTitle = toolNames.join(" vs ");

  // AGGRESSIVE SEO: Keyword-rich title with year and qualifier
  const title = comparison.seo?.title ||
    `${vsTitle}: Which Is Best in 2026? [Detailed Comparison]`;

  // Direct answer in description - snippet bait
  const bottomLine = comparison.summary?.bottom_line || comparison.description;
  const description = comparison.seo?.description ||
    `${vsTitle} compared: ${bottomLine.slice(0, 140)}...`;

  // Comprehensive keyword list targeting all query variations
  const keywords = [
    ...(comparison.seo?.keywords || []),
    `${toolNames[0]} vs ${toolNames[1]}`,
    `${toolNames[1]} vs ${toolNames[0]}`,
    `${toolNames[0]} or ${toolNames[1]}`,
    `${toolNames[0]} alternative`,
    `${toolNames[1]} alternative`,
    `${toolNames[0]} vs ${toolNames[1]} comparison`,
    `${toolNames[0]} vs ${toolNames[1]} 2026`,
    `is ${toolNames[0]} better than ${toolNames[1]}`,
    `${toolNames[0]} vs ${toolNames[1]} pricing`,
    `${toolNames[0]} vs ${toolNames[1]} features`,
    `switch from ${toolNames[0]} to ${toolNames[1]}`,
    `best ${comparison.metadata.category.replace(/-/g, " ")}`,
  ];

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: `${SITE_CONFIG.url}/tools/compare/${slug}/`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${SITE_CONFIG.url}/tools/compare/${slug}/`,
      modifiedTime: comparison.metadata.last_updated,
      images: [{
        url: `${SITE_CONFIG.url}/og/compare/${slug}.png`,
        width: 1200,
        height: 630,
        alt: `${vsTitle} Comparison`,
      }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    other: {
      "article:modified_time": comparison.metadata.last_updated || new Date().toISOString(),
      "article:tag": keywords.slice(0, 10).join(","),
    },
    // Curated comparisons ARE indexed (unlike dynamic ones)
    robots: {
      index: true,
      follow: true,
    },
  };
}

// =============================================================================
// STRUCTURED DATA
// =============================================================================

/**
 * Build the schema.org stack for a head-to-head comparison.
 *
 * AGGRESSIVE SEO: Stack multiple overlapping schemas for maximum SERP coverage.
 * This targets: FAQ rich results, table snippets, knowledge graph, article
 * carousels, and AI answer engine citations.
 */
function generateComparisonStructuredData(
  comparison: CuratedComparison,
  tools: Map<string, ClinicianToolV4>
): object[] {
  const schemas: object[] = [];
  const pageUrl = `${SITE_CONFIG.url}/tools/compare/${comparison.slug}`;
  const toolList = comparison.tools
    .map((slug) => tools.get(slug))
    .filter((tool): tool is ClinicianToolV4 => Boolean(tool));
  const toolNames = toolList.map((t) => t.name);
  const vsTitle = toolNames.join(" vs ");

  // 1. BreadcrumbList - Sitelinks
  schemas.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_CONFIG.url },
      { "@type": "ListItem", position: 2, name: "Tools", item: `${SITE_CONFIG.url}/tools/` },
      { "@type": "ListItem", position: 3, name: "For Clinicians", item: `${SITE_CONFIG.url}/tools/for-clinicians/` },
      { "@type": "ListItem", position: 4, name: vsTitle, item: pageUrl },
    ],
  });

  // 2. FAQPage - "People Also Ask" domination
  if (comparison.faqs && comparison.faqs.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      mainEntity: comparison.faqs.map((faq) => ({
        "@type": "Question",
        name: faq.q,
        acceptedAnswer: { "@type": "Answer", text: faq.a },
      })),
    });
  }

  // 3. ItemList with detailed products
  if (toolList.length > 0) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${pageUrl}#comparison`,
      name: `${vsTitle} Comparison`,
      description: comparison.summary?.bottom_line || comparison.description,
      numberOfItems: toolList.length,
      itemListElement: toolList.map((tool, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "SoftwareApplication",
          "@id": `${pageUrl}#${tool.slug}`,
          name: tool.name,
          applicationCategory: "HealthApplication",
          applicationSubCategory: "Mental Health Practice Management",
          url: `${SITE_CONFIG.url}/tools/for-clinicians/${comparison.metadata.category}/${tool.slug}/`,
          // INSIDER: sameAs links for Knowledge Graph entity connection
          sameAs: [
            `https://www.g2.com/products/${tool.slug}`,
            `https://www.capterra.com/p/${tool.slug}`,
            `https://www.crunchbase.com/organization/${tool.slug}`,
          ].filter(Boolean),
          ...(tool.company_name
            ? { publisher: { "@type": "Organization", name: tool.company_name } }
            : {}),
          ...(tool.pricing?.starting_price_display
            ? {
                offers: {
                  "@type": "Offer",
                  price: tool.pricing.starting_price_cents ? tool.pricing.starting_price_cents / 100 : 0,
                  priceCurrency: "USD",
                  availability: "https://schema.org/InStock",
                },
              }
            : {}),
        },
      })),
    });
  }

  // 4. WebPage with speakable - Voice search
  schemas.push({
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    name: comparison.title,
    description: comparison.description,
    url: pageUrl,
    dateModified: comparison.metadata.last_updated || new Date().toISOString(),
    isPartOf: { "@type": "WebSite", "@id": `${SITE_CONFIG.url}/#website`, name: SITE_CONFIG.name, url: SITE_CONFIG.url },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".direct-answer", "[data-speakable]", "h1", ".bottom-line"],
    },
    mainEntity: { "@type": "ItemList", "@id": `${pageUrl}#comparison` },
  });

  // 5. Article schema - News/article rich results
  schemas.push({
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${pageUrl}#article`,
    headline: comparison.title,
    description: comparison.description,
    datePublished: comparison.metadata.last_updated || new Date().toISOString(),
    dateModified: comparison.metadata.last_updated || new Date().toISOString(),
    author: {
      "@type": "Organization",
      name: "HeyPsych Editorial Team",
      url: `${SITE_CONFIG.url}/about/`,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      logo: { "@type": "ImageObject", url: `${SITE_CONFIG.url}/logo.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${pageUrl}#webpage` },
    articleSection: "Software Comparison",
    keywords: comparison.seo?.keywords?.join(", ") || vsTitle,
  });

  // 6. HowTo - Targets "how to choose between X and Y" queries
  schemas.push({
    "@context": "https://schema.org",
    "@type": "HowTo",
    "@id": `${pageUrl}#howto`,
    name: `How to Choose Between ${vsTitle}`,
    description: `A decision guide for selecting the right option between ${toolNames.join(" and ")} for your mental health practice`,
    totalTime: "PT10M",
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Assess your practice needs",
        text: "Consider your practice size, specialty, current workflow, and budget constraints.",
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Compare key features",
        text: `Review the feature comparison table to see how ${toolNames[0]} and ${toolNames[1]} differ on capabilities important to you.`,
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Evaluate pricing",
        text: "Compare total cost of ownership including per-user fees, implementation costs, and contract terms.",
      },
      {
        "@type": "HowToStep",
        position: 4,
        name: "Check integrations",
        text: "Verify each option integrates with your existing EHR, billing, and other practice tools.",
      },
      {
        "@type": "HowToStep",
        position: 5,
        name: "Read the verdict",
        text: `See our bottom-line recommendation for when to choose ${toolNames[0]} vs ${toolNames[1]}.`,
      },
    ],
  });

  // 7. Review schema - For review rich results
  if (comparison.summary?.bottom_line) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Review",
      "@id": `${pageUrl}#review`,
      name: `${vsTitle} Comparison Review`,
      reviewBody: comparison.summary.bottom_line,
      author: { "@type": "Organization", name: SITE_CONFIG.name },
      datePublished: comparison.metadata.last_updated,
      itemReviewed: {
        "@type": "ItemList",
        name: vsTitle,
        numberOfItems: toolList.length,
      },
    });
  }

  // 8. Table schema - For table snippet capture
  if (comparison.comparison_table) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Table",
      "@id": `${pageUrl}#table`,
      about: `${vsTitle} feature comparison table`,
      name: `${vsTitle} Features Compared`,
    });
  }

  return schemas;
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function CuratedComparisonPage({ params }: PageProps) {
  const { slug } = await params;

  // Use unified publication gate
  const result = await getPublishableComparison(slug);

  if (!result) {
    notFound();
  }

  const { comparison, tools } = result;

  // Get publishable curated comparisons for sidebar/navigation
  const publishableCurated = await getAllPublishableCurated();

  // Get all tools manifest for the selector
  const allTools = await ClinicianToolService.loadClinicianTools();
  const toolsManifest = allTools.map((t) => ({
    slug: t.slug,
    name: t.name,
    category: t.primary_category,
    company: t.company_name,
  }));

  // Generate the comparison
  const context: ToolComparisonContext = {
    depthLevel: "detailed",
  };
  const toolArray = Array.from(tools.values());
  const comparisonResult = generateToolComparison(toolArray, context);
  const serializedComparison = serializeToolComparisonResult(comparisonResult);

  const schemas = generateComparisonStructuredData(comparison, tools);

  return (
    <>
      {schemas.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <Suspense fallback={<ComparisonLoadingSkeleton />}>
        <ComparePageClient
          initialTools={toolArray}
          comparison={serializedComparison}
          curatedComparisons={publishableCurated}
          toolsManifest={toolsManifest}
        />
      </Suspense>
    </>
  );
}

// =============================================================================
// LOADING SKELETON
// =============================================================================

function ComparisonLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="animate-pulse">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-4 h-32"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Revalidate every 24 hours
export const revalidate = 86400;
