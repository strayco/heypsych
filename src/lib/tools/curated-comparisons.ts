/**
 * Curated clinician comparisons (data/tools-v4/comparisons) and their
 * publication gate: a comparison is shown only when its JSON validates and
 * every product it names is publishable. Shared by /tools/compare/[slug]
 * and the clinician hubs so a listed comparison never 404s.
 */

import { existsSync, readFileSync, readdirSync } from "fs";
import { join, resolve } from "path";
import { z } from "zod";
import {
  ClinicianToolService,
  isToolPublishable,
  type ClinicianToolV4,
} from "@/lib/tools/clinician-tool-service";

// Only allow safe slug characters: lowercase alphanumeric and hyphens
const SAFE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Zod schema for curated comparison JSON
export const CuratedComparisonSchema = z.object({
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
  sections: z
    .array(z.object({ type: z.string().optional(), heading: z.string(), content: z.string() }).passthrough())
    .optional(),
  editorial: z
    .object({ lastReviewed: z.string().optional(), lastUpdated: z.string().optional() })
    .passthrough()
    .optional(),
  related_comparisons: z.array(z.string()).optional(),
  seo: z.any().optional(),
});

export type CuratedComparison = z.infer<typeof CuratedComparisonSchema>;


export interface PublishableComparison {
  comparison: CuratedComparison;
  tools: Map<string, ClinicianToolV4>;
}

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
export async function getPublishableComparison(
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
export async function getAllPublishableCurated(): Promise<
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
