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
      title: "Comparison Not Found | HeyPsych",
      robots: { index: false, follow: false },
    };
  }

  const { comparison } = result;

  return {
    title: comparison.title,
    description: comparison.description,
    alternates: {
      canonical: `${SITE_CONFIG.url}/tools/compare/${slug}`,
    },
    openGraph: {
      title: comparison.title,
      description: comparison.description,
      type: "website",
    },
    // Curated comparisons ARE indexed (unlike dynamic ones)
    robots: {
      index: true,
      follow: true,
    },
  };
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

  return (
    <Suspense fallback={<ComparisonLoadingSkeleton />}>
      <ComparePageClient
        initialTools={toolArray}
        comparison={serializedComparison}
        curatedComparisons={publishableCurated}
        toolsManifest={toolsManifest}
      />
    </Suspense>
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
