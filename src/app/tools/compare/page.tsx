/**
 * Tool Comparison Hub
 *
 * Unified comparison experience for clinician tools:
 * - No items: Shows selector/explorer with curated comparisons
 * - With items: Shows dynamic side-by-side comparison
 *
 * URL format: /tools/compare?tools=slug1,slug2,slug3
 *
 * Design principles:
 * - Sponsorship CANNOT affect comparison results
 * - Explicit handling of missing data
 * - noindex for dynamic comparisons
 */

import { Suspense } from "react";
import { Metadata } from "next";
import { readdirSync, existsSync, readFileSync } from "fs";
import { join } from "path";
import { SITE_CONFIG } from "@/lib/seo/config";
// NOTE: fs and path imports remain for getCuratedComparisons() which still uses raw files
import {
  generateToolComparison,
  serializeToolComparisonResult,
  type ClinicianTool,
  type ToolComparisonContext,
} from "./comparison-engine";
import { ComparePageClient } from "./compare-client";
import {
  ClinicianToolService,
  isToolPublishable,
} from "@/lib/tools/clinician-tool-service";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

interface CuratedToolComparison {
  slug: string;
  name: string;
  title: string;
  description: string;
  category: string;
  tools: string[];
}

// =============================================================================
// DATA LOADING
// =============================================================================

/**
 * Parse comparison URL parameters
 */
function parseComparisonUrl(params: URLSearchParams): { tools: string[] } {
  const toolsParam = params.get("tools") || "";
  const tools = toolsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);
  return { tools };
}

/**
 * Load tool data by slug using canonical ClinicianToolService
 *
 * SECURITY: Only publishable tools are returned via the service.
 * This prevents exposure of draft, archived, or invalid tools.
 */
async function loadTools(slugs: string[]): Promise<Map<string, ClinicianTool>> {
  const tools = new Map<string, ClinicianTool>();

  // Load tools through canonical service (enforces publication gate)
  for (const slug of slugs) {
    const tool = await ClinicianToolService.getBySlug(slug);
    if (tool) {
      tools.set(slug, tool);
    }
  }

  return tools;
}

/**
 * Load curated editorial comparisons from data/tools-v4/comparisons/
 *
 * IMPORTANT: Only returns comparisons where ALL tools are publishable.
 * This prevents displaying comparisons for unpublished tools (e.g., freed-vs-nabla
 * when Freed and Nabla aren't in the launch allowlist).
 */
async function getCuratedComparisons(): Promise<CuratedToolComparison[]> {
  const comparePath = join(process.cwd(), "data/tools-v4/comparisons");

  if (!existsSync(comparePath)) {
    return [];
  }

  try {
    const files = readdirSync(comparePath);
    const allComparisons = files
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        const filePath = join(comparePath, f);
        const content = JSON.parse(readFileSync(filePath, "utf-8"));
        return {
          slug: content.slug,
          name: content.name,
          title: content.title,
          description: content.description,
          category: content.metadata?.category || "general",
          tools: content.tools || [],
        };
      });

    // Filter to only include comparisons where all tools are publishable
    const publishableComparisons: CuratedToolComparison[] = [];
    for (const comparison of allComparisons) {
      let allToolsPublishable = true;
      for (const toolSlug of comparison.tools) {
        const tool = await ClinicianToolService.getBySlug(toolSlug);
        if (!tool || !isToolPublishable(tool)) {
          allToolsPublishable = false;
          break;
        }
      }
      if (allToolsPublishable && comparison.tools.length >= 2) {
        publishableComparisons.push(comparison);
      }
    }

    return publishableComparisons.sort((a, b) => a.name.localeCompare(b.name));
  } catch (error) {
    console.error("Failed to read tool comparisons", error);
    return [];
  }
}

/**
 * Get all available tools for the selector using canonical ClinicianToolService
 *
 * SECURITY: Only publishable, schema-valid tools are returned.
 * This prevents exposure of draft, archived, or invalid tools in the selector.
 */
async function getAllToolsManifest(): Promise<Array<{
  slug: string;
  name: string;
  category: string;
  company?: string;
}>> {
  const allTools = await ClinicianToolService.loadClinicianTools();

  return allTools
    .map((tool) => ({
      slug: tool.slug,
      name: tool.name,
      category: tool.primary_category,
      company: tool.company_name,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// =============================================================================
// METADATA
// =============================================================================

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const toolsParam = typeof params.tools === "string" ? params.tools : "";
  const items = toolsParam.split(",").filter(Boolean);

  // Base metadata for empty state (selector/explorer)
  if (items.length < 2) {
    return {
      title: "Compare Clinician Tools | Side-by-Side Analysis",
      description:
        "Compare EHRs, AI scribes, billing software, and other clinician tools side by side. See differences in features, pricing, integrations, and find the right fit for your practice.",
      alternates: {
        canonical: `${SITE_CONFIG.url}/tools/compare`,
      },
      openGraph: {
        title: "Clinician Tool Comparisons",
        description:
          "Compare mental health practice tools side by side. EHRs, AI scribes, billing, and more.",
      },
      // Prevent indexing of incomplete states
      robots: items.length === 1 ? { index: false, follow: true } : undefined,
    };
  }

  // Dynamic metadata for comparisons
  const tools = await loadTools(items);
  const names = Array.from(tools.values()).map((t) => t.name);

  const title = `Compare ${names.join(" vs ")}`;
  const description = `Side-by-side comparison of ${names.join(", ")}. Compare features, pricing, integrations, and compliance.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    // Dynamic comparisons are noindex to prevent duplicate content
    // Curated comparisons at /tools/compare/[slug] are the canonical indexed versions
    robots: {
      index: false,
      follow: true,
    },
  };
}

// =============================================================================
// PAGE COMPONENT
// =============================================================================

export default async function ToolComparePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { tools: toolSlugs } = parseComparisonUrl(
    new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => typeof v === "string")
        .map(([k, v]) => [k, v as string])
    )
  );

  // Load curated comparisons and tools manifest for the selector view
  const curatedComparisons = await getCuratedComparisons();
  const toolsManifest = await getAllToolsManifest();

  // If no items, show the selector/explorer
  if (toolSlugs.length === 0) {
    return (
      <Suspense fallback={<ComparisonLoadingSkeleton />}>
        <ComparePageClient
          initialTools={[]}
          comparison={null}
          curatedComparisons={curatedComparisons}
          toolsManifest={toolsManifest}
        />
      </Suspense>
    );
  }

  // Handle validation errors
  if (toolSlugs.length === 1) {
    return (
      <Suspense fallback={<ComparisonLoadingSkeleton />}>
        <ComparePageClient
          initialTools={[]}
          comparison={null}
          error="Select at least 2 tools to compare"
          curatedComparisons={curatedComparisons}
          toolsManifest={toolsManifest}
        />
      </Suspense>
    );
  }

  if (toolSlugs.length > 4) {
    return (
      <Suspense fallback={<ComparisonLoadingSkeleton />}>
        <ComparePageClient
          initialTools={[]}
          comparison={null}
          error="Maximum 4 tools allowed"
          curatedComparisons={curatedComparisons}
          toolsManifest={toolsManifest}
        />
      </Suspense>
    );
  }

  // Load tools
  const tools = await loadTools(toolSlugs);

  // Check if all tools were found
  const missing = toolSlugs.filter((slug) => !tools.has(slug));
  if (missing.length > 0) {
    return (
      <Suspense fallback={<ComparisonLoadingSkeleton />}>
        <ComparePageClient
          initialTools={Array.from(tools.values())}
          comparison={null}
          error={`Could not find: ${missing.join(", ")}`}
          curatedComparisons={curatedComparisons}
          toolsManifest={toolsManifest}
        />
      </Suspense>
    );
  }

  // Generate comparison
  const context: ToolComparisonContext = {
    depthLevel: "detailed",
  };

  const toolArray = Array.from(tools.values());
  const comparison = generateToolComparison(toolArray, context);

  // Serialize for client component (removes functions)
  const serializedComparison = serializeToolComparisonResult(comparison);

  return (
    <Suspense fallback={<ComparisonLoadingSkeleton />}>
      <ComparePageClient
        initialTools={toolArray}
        comparison={serializedComparison}
        curatedComparisons={curatedComparisons}
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
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>

        {/* Tool cards skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-4 h-32"></div>
          ))}
        </div>

        {/* Table skeleton */}
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
