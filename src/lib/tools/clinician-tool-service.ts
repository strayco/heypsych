// src/lib/tools/clinician-tool-service.ts
// Service for loading and querying V4 clinician tools
//
// ARCHITECTURE: Fail-closed catalog using canonical Zod schema.
// Only schema-valid, publication-gate-passing tools appear in public APIs.
// Raw files that fail validation are logged and excluded silently.

import {
  ClinicianToolV4Z,
  isPublishReady,
  type ClinicianToolV4,
  type ClinicianProductCategory,
  CLINICIAN_PRODUCT_CATEGORY_LABELS,
  SCHEMA_TO_TAXONOMY_CATEGORY,
  TAXONOMY_TO_SCHEMA_CATEGORIES,
} from "../schemas/clinician-tool-v4";

// ============================================================================
// RE-EXPORT TYPES FROM CANONICAL SCHEMA
// ============================================================================

export type { ClinicianToolV4 } from "../schemas/clinician-tool-v4";
export { isPublishReady } from "../schemas/clinician-tool-v4";

// ============================================================================
// FILTER TYPES
// ============================================================================

export interface ClinicianToolFilters {
  category?: string;
  subcategory?: string;
  priceRange?: "budget" | "mid-market" | "premium" | "enterprise";
  freeTier?: boolean;
  hasAI?: boolean;
  hasEHR?: boolean;
  hasTelehealth?: boolean;
  hipaaCompliant?: boolean;
  practiceSize?: string;
  clinicianRole?: string;
  capabilities?: string[];
  integrations?: string[];
}

export interface ClinicianToolSearchResult {
  tools: ClinicianToolV4[];
  total: number;
  filters: ClinicianToolFilters;
}

export interface CategoryCount {
  slug: string;
  display_name: string;
  count: number;
  url: string;
}

// ============================================================================
// PUBLICATION GATE
// ============================================================================

/**
 * LAUNCH ALLOWLIST - The 9 reviewed EHR tools approved for launch
 *
 * This is a temporary safety boundary. Tools must be on this list AND pass
 * isPublishReady() to appear publicly. This prevents mass-promoted tools
 * from appearing before editorial review.
 *
 * TODO: Remove this allowlist once bulk promotion scripts require isPublishReady()
 */
const LAUNCH_ALLOWLIST = new Set([
  // Original 10 launch products
  "icanotes",
  "intakeq-practiceq",
  "jane-app",
  "kipu-health",
  "qualifacts-credible",
  "sessions-health",
  "simplepractice",
  "theranest",
  "therapynotes",
  "valant",
  // Expanded catalog (87 additional reviewed products)
  "aari-ai-native-os",
  "advancedmd-ehr",
  "akasa",
  "akili-endeavorotc",
  "alma-provider-platform",
  "amwell-converge",
  "appliedvr-relievrx",
  "availity-essentials",
  "bloomapi",
  "blueprint-measurement-based-care",
  "brellium",
  "brightside-health",
  "candid-health",
  "cedar",
  "cerebral",
  "charlie-health-iop",
  "click-therapeutics-clickotine",
  "cliniko",
  "cognoa-canvas-dx",
  "daylightrx",
  "dial3d",
  "doctor-on-demand",
  "doximity-dialer",
  "doximity-scribe",
  "doxy-me",
  "dynamicare-rewards",
  "eleos-health",
  "emma",
  "endeavorrx",
  "ensai",
  "floreo",
  "freed",
  "grow-therapy",
  "headway",
  "heard",
  "holmusk-neuroblu-database",
  "iris-telehealth",
  "jane",
  "kareo-billing",
  "kipu",
  "kipu-intelligence",
  "klara",
  "lia",
  "lyra-health",
  "mdlive",
  "mentaya",
  "microsoft-dragon-copilot",
  "mightier",
  "monument",
  "motivo",
  "nabla",
  "nirvana-health",
  "notable-ai",
  "nuance-dragon-medical-one",
  "oxfordvr-gamechange",
  "pesi",
  "qualifacts-credible-behavioral-health",
  "qualifacts-iq",
  "regard",
  "reimbursify",
  "robin-healthcare",
  "sia",
  "simcare",
  "simplepractice-note-taker",
  "sleep-reset",
  "sleepiorx",
  "sondermind-provider-network",
  "sparkrx",
  "suki-ai",
  "sunoh-ai",
  "talkiatry",
  "talkspace-psychiatry",
  "teladoc-health",
  "teladoc-solo",
  "thriveworks",
  "thrizer",
  "tigerconnect",
  "tridiuum-one",
  "uptodate",
  "waystar-eligibility",
  "weconnect-recovery",
  "wheel",
  "xrhealth",
  "youper",
  "zanda",
  "zoom-clinical-notes",
]);

/**
 * Check if a tool should be publicly visible
 *
 * A tool is publishable if ALL of:
 * - status is "active" (not draft, archived, or pending-review)
 * - lifecycle.status is "active" or "beta" (not deprecated, discontinued, acquired, merged)
 * - isPublishReady() returns true (has description, HIPAA known, reviewed, etc.)
 * - slug is on the LAUNCH_ALLOWLIST (temporary safety boundary)
 *
 * This is a STRICT gate. Fail-closed: any missing requirement excludes the tool.
 */
export function isToolPublishable(tool: ClinicianToolV4): boolean {
  // Status must be "active"
  if (tool.status !== "active") {
    return false;
  }

  // Lifecycle must be active or beta (not discontinued, acquired, etc.)
  const lifecycleStatus = tool.lifecycle?.status;
  if (lifecycleStatus && !["active", "beta"].includes(lifecycleStatus)) {
    return false;
  }

  // STRICT GATE: Must pass data quality requirements
  if (!isPublishReady(tool)) {
    return false;
  }

  // LAUNCH SAFETY: Must be on allowlist (temporary)
  if (!LAUNCH_ALLOWLIST.has(tool.slug)) {
    return false;
  }

  return true;
}

/**
 * Filter tools to only those that are publishable
 */
export function filterPublishableTools(
  tools: ClinicianToolV4[]
): ClinicianToolV4[] {
  return tools.filter(isToolPublishable);
}

// ============================================================================
// FILE SYSTEM LOADER
// ============================================================================

// Cache for schema-valid tools (may include drafts)
let allValidToolsCache: ClinicianToolV4[] | null = null;
let validToolsBySlugCache: Map<string, ClinicianToolV4> | null = null;

// Cache for publishable-only tools
let publishableToolsCache: ClinicianToolV4[] | null = null;
let publishableBySlugCache: Map<string, ClinicianToolV4> | null = null;

// Validation stats for debugging
let lastValidationStats: {
  total: number;
  schemaValid: number;
  schemaInvalid: number;
  publishable: number;
  errors: string[];
} | null = null;

/**
 * Webpack-safe server module loader
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function loadServerModule(moduleName: string): any {
  if (typeof window !== "undefined") return null;
  try {
    // eslint-disable-next-line no-eval
    return eval("require")(moduleName);
  } catch {
    return null;
  }
}

/**
 * Recursively find all JSON files in a directory
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findJsonFiles(dir: string, fs: any, path: any): string[] {
  const files: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip non-product directories
        if (
          ["taxonomies", "raw", "generated", "comparisons"].includes(entry.name)
        ) {
          continue;
        }
        files.push(...findJsonFiles(fullPath, fs, path));
      } else if (entry.isFile() && entry.name.endsWith(".json")) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err);
  }

  return files;
}

/**
 * Load all V4 clinician tools from /data/tools-v4/products/
 *
 * ARCHITECTURE: Fail-closed loading.
 * - Each file is validated against ClinicianToolV4Z.safeParse()
 * - Files that fail validation are logged and excluded
 * - Only schema-valid tools enter the catalog
 *
 * @param includeUnpublished - If true, returns schema-valid tools regardless of publication status.
 *                             Default false for safety.
 */
async function loadV4ToolsFromFiles(
  includeUnpublished = false
): Promise<ClinicianToolV4[]> {
  // Return cached publishable tools if available
  if (!includeUnpublished && publishableToolsCache) {
    return publishableToolsCache;
  }

  // Return cached all-valid tools if available
  if (includeUnpublished && allValidToolsCache) {
    return allValidToolsCache;
  }

  // Need to load from files
  if (!allValidToolsCache) {
    const fs = loadServerModule("fs");
    const path = loadServerModule("path");

    if (!fs || !path) {
      console.warn("File system not available - returning empty tools list");
      return [];
    }

    try {
      const toolsDir = path.join(process.cwd(), "data/tools-v4/products");

      if (!fs.existsSync(toolsDir)) {
        console.warn("V4 tools directory does not exist:", toolsDir);
        return [];
      }

      const files = findJsonFiles(toolsDir, fs, path);
      const validTools: ClinicianToolV4[] = [];
      const bySlug = new Map<string, ClinicianToolV4>();
      const errors: string[] = [];

      for (const filePath of files) {
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          const data = JSON.parse(content);

          // Only process V4 clinician tools
          if (data.schema_version !== "4.0" || data.kind !== "clinician-tool") {
            continue;
          }

          // FAIL-CLOSED: Validate against canonical schema
          const result = ClinicianToolV4Z.safeParse(data);

          if (!result.success) {
            // Log schema failures but don't include in catalog
            const relativePath = path.relative(process.cwd(), filePath);
            const errorSummary = result.error.issues
              .slice(0, 2)
              .map((i) => `${i.path.join(".")}: ${i.message}`)
              .join("; ");
            errors.push(`${relativePath}: ${errorSummary}`);
            continue;
          }

          const tool = result.data;
          validTools.push(tool);

          // Track by slug (last one wins if duplicates)
          bySlug.set(tool.slug, tool);
        } catch (err) {
          const relativePath = path.relative(process.cwd(), filePath);
          errors.push(`${relativePath}: JSON parse error`);
        }
      }

      // Sort by featured, then by name
      validTools.sort((a, b) => {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.name.localeCompare(b.name);
      });

      allValidToolsCache = validTools;
      validToolsBySlugCache = bySlug;

      // Compute publishable subset
      const publishable = filterPublishableTools(validTools);
      publishableToolsCache = publishable;
      publishableBySlugCache = new Map(
        publishable.map((t) => [t.slug, t])
      );

      // Store stats for debugging
      lastValidationStats = {
        total: files.length,
        schemaValid: validTools.length,
        schemaInvalid: files.length - validTools.length,
        publishable: publishable.length,
        errors: errors.slice(0, 20),
      };

      // Log summary in development
      if (process.env.NODE_ENV === "development") {
        console.log(
          `[ClinicianToolService] Loaded ${validTools.length}/${files.length} schema-valid tools, ${publishable.length} publishable`
        );
      }
    } catch (error) {
      console.error("Error loading V4 tools from files:", error);
      return [];
    }
  }

  // Return appropriate cache
  if (includeUnpublished) {
    return allValidToolsCache || [];
  }
  return publishableToolsCache || [];
}

// ============================================================================
// CLINICIAN TOOL SERVICE
// ============================================================================

export class ClinicianToolService {
  /**
   * Load all V4 clinician tools (publishable only by default)
   *
   * @param options.includeUnpublished - Include drafts and non-active tools (admin only)
   */
  static async loadClinicianTools(options?: {
    includeUnpublished?: boolean;
  }): Promise<ClinicianToolV4[]> {
    return loadV4ToolsFromFiles(options?.includeUnpublished ?? false);
  }

  /**
   * Load ALL schema-valid tools including drafts (for admin/validation use only)
   */
  static async loadAllToolsIncludingDrafts(): Promise<ClinicianToolV4[]> {
    return loadV4ToolsFromFiles(true);
  }

  /**
   * Get a single tool by slug
   *
   * SECURITY: Only returns publishable tools by default.
   * Use options.includeUnpublished for admin access.
   */
  static async getBySlug(
    slug: string,
    options?: { includeUnpublished?: boolean }
  ): Promise<ClinicianToolV4 | null> {
    // Ensure cache is populated
    await loadV4ToolsFromFiles(options?.includeUnpublished ?? false);

    if (options?.includeUnpublished) {
      return validToolsBySlugCache?.get(slug) ?? null;
    }

    // PUBLICATION GATE: Only return from publishable cache
    return publishableBySlugCache?.get(slug) ?? null;
  }

  /**
   * Get tools by category.
   * Accepts both schema category slugs and V4 taxonomy slugs.
   */
  static async getByCategory(
    categorySlug: string
  ): Promise<ClinicianToolV4[]> {
    const allTools = await this.loadClinicianTools();

    // Get schema categories that map to this taxonomy slug
    const schemaCategories = TAXONOMY_TO_SCHEMA_CATEGORIES[categorySlug];

    if (schemaCategories && schemaCategories.length > 0) {
      // This is a taxonomy slug - filter by mapped schema categories
      return allTools.filter((tool) =>
        schemaCategories.includes(tool.primary_category)
      );
    }

    // Fallback: treat as schema category slug (direct match)
    return allTools.filter((tool) => tool.primary_category === categorySlug);
  }

  /**
   * Get tools by category (including secondary categories).
   * Accepts both schema category slugs and V4 taxonomy slugs.
   */
  static async getByCategoryInclusive(
    categorySlug: string
  ): Promise<ClinicianToolV4[]> {
    const allTools = await this.loadClinicianTools();

    // Get schema categories that map to this taxonomy slug
    const schemaCategories = TAXONOMY_TO_SCHEMA_CATEGORIES[categorySlug];

    if (schemaCategories && schemaCategories.length > 0) {
      // This is a taxonomy slug
      return allTools.filter(
        (tool) =>
          schemaCategories.includes(tool.primary_category) ||
          tool.secondary_categories.some((cat) => schemaCategories.includes(cat))
      );
    }

    // Fallback: treat as schema category slug
    return allTools.filter(
      (tool) =>
        tool.primary_category === categorySlug ||
        tool.secondary_categories.includes(categorySlug as ClinicianProductCategory)
    );
  }

  /**
   * Get tool counts per category (publishable only).
   * Returns counts by SCHEMA category slugs (as stored in tool data).
   */
  static async getToolCounts(): Promise<Record<string, number>> {
    const allTools = await this.loadClinicianTools();
    const counts: Record<string, number> = {};

    for (const tool of allTools) {
      counts[tool.primary_category] = (counts[tool.primary_category] || 0) + 1;
    }

    return counts;
  }

  /**
   * Get tool counts by V4 TAXONOMY category slugs (SEO-friendly URLs).
   * Maps schema categories to taxonomy categories for consistent URL structure.
   */
  static async getToolCountsByTaxonomy(): Promise<Record<string, number>> {
    const allTools = await this.loadClinicianTools();
    const counts: Record<string, number> = {};

    for (const tool of allTools) {
      // Map schema category to taxonomy category
      const taxonomySlug = SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category];
      if (taxonomySlug) {
        counts[taxonomySlug] = (counts[taxonomySlug] || 0) + 1;
      }
    }

    return counts;
  }

  /**
   * Get tool counts with category metadata using V4 taxonomy slugs.
   * This is the primary method for the landing page.
   */
  static async getCategoryCounts(): Promise<CategoryCount[]> {
    const counts = await this.getToolCountsByTaxonomy();

    return Object.entries(counts)
      .map(([slug, count]) => ({
        slug,
        display_name: slug, // Will be enriched by page from taxonomy JSON
        count,
        url: `/tools/for-clinicians/${slug}/`,
      }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Search clinician tools with filters
   */
  static async searchClinicianTools(
    query?: string,
    filters?: ClinicianToolFilters
  ): Promise<ClinicianToolSearchResult> {
    let tools = await this.loadClinicianTools();

    // Apply text search
    if (query) {
      const lowerQuery = query.toLowerCase();
      tools = tools.filter(
        (tool) =>
          tool.name.toLowerCase().includes(lowerQuery) ||
          (tool.short_description?.toLowerCase().includes(lowerQuery) ?? false) ||
          (tool.one_liner?.toLowerCase().includes(lowerQuery) ?? false) ||
          tool.capabilities.some((c) => c.toLowerCase().includes(lowerQuery))
      );
    }

    // Apply filters
    if (filters) {
      if (filters.category) {
        tools = tools.filter(
          (t) =>
            t.primary_category === filters.category ||
            t.secondary_categories.includes(
              filters.category as ClinicianProductCategory
            )
        );
      }

      if (filters.priceRange) {
        tools = tools.filter(
          (t) => t.pricing?.price_range === filters.priceRange
        );
      }

      if (filters.freeTier !== undefined) {
        tools = tools.filter((t) => t.pricing?.free_tier === filters.freeTier);
      }

      if (filters.hasAI !== undefined) {
        tools = tools.filter((t) => t.feature_flags.has_ai === filters.hasAI);
      }

      if (filters.hasEHR !== undefined) {
        tools = tools.filter((t) => t.feature_flags.has_ehr === filters.hasEHR);
      }

      if (filters.hasTelehealth !== undefined) {
        tools = tools.filter(
          (t) => t.feature_flags.has_telehealth === filters.hasTelehealth
        );
      }

      if (filters.hipaaCompliant !== undefined) {
        // CORRECT: Check for "yes" not truthy
        tools = tools.filter(
          (t) =>
            (t.compliance.hipaa_support === "yes") === filters.hipaaCompliant
        );
      }

      if (filters.practiceSize) {
        tools = tools.filter(
          (t) =>
            t.audiences?.organization_sizes?.includes(
              filters.practiceSize as ClinicianToolV4["audiences"]["organization_sizes"][number]
            ) ?? false
        );
      }

      if (filters.clinicianRole) {
        tools = tools.filter(
          (t) =>
            t.audiences?.clinician_roles?.includes(
              filters.clinicianRole as ClinicianToolV4["audiences"]["clinician_roles"][number]
            ) ?? false
        );
      }

      if (filters.capabilities?.length) {
        tools = tools.filter((t) =>
          filters.capabilities!.some((cap) =>
            t.capabilities.includes(
              cap as ClinicianToolV4["capabilities"][number]
            )
          )
        );
      }

      if (filters.integrations?.length) {
        tools = tools.filter((t) =>
          filters.integrations!.some((int) =>
            t.integrations.some((i) => i.slug === int)
          )
        );
      }
    }

    return {
      tools,
      total: tools.length,
      filters: filters || {},
    };
  }

  /**
   * Get comparison candidates for a category (publishable only)
   *
   * P0-12 FIX: Removed featured bias from ranking
   * Ranking is now based on:
   * 1. Data quality score (governance.data_quality_score)
   * 2. Compliance verification (HIPAA and BAA confirmed)
   * 3. Content completeness (has description, pricing info)
   * 4. Alphabetical as tiebreaker
   */
  static async getComparisonCandidates(
    category: string,
    limit = 10
  ): Promise<ClinicianToolV4[]> {
    const tools = await this.getByCategory(category);

    return tools
      .sort((a, b) => {
        // P0-12: Score based on objective data quality, NOT featured status
        const aScore = this.calculateComparisonScore(a);
        const bScore = this.calculateComparisonScore(b);
        if (aScore !== bScore) return bScore - aScore;
        return a.name.localeCompare(b.name);
      })
      .slice(0, limit);
  }

  /**
   * Calculate comparison score for a tool
   *
   * P0-12: Objective scoring based on data completeness and verification
   * Score breakdown:
   * - Base data quality score (0-100 from governance)
   * - +10 if HIPAA confirmed "yes"
   * - +10 if BAA confirmed "yes"
   * - +5 if has pricing information
   * - +5 if has description > 100 chars
   * - +5 if has website URL
   */
  private static calculateComparisonScore(tool: ClinicianToolV4): number {
    let score = tool.governance?.data_quality_score || 0;

    // Compliance bonuses (separate HIPAA and BAA per P0-12)
    if (tool.compliance?.hipaa_support === "yes") score += 10;
    if (tool.compliance?.baa_available === "yes") score += 10;

    // Content completeness bonuses
    if (tool.pricing?.starting_price_display || tool.pricing?.model) score += 5;
    if (tool.short_description && tool.short_description.length > 100) score += 5;
    if (tool.website_url) score += 5;

    return score;
  }

  /**
   * Get featured tools for a category
   */
  static async getFeaturedByCategory(
    category: string,
    limit = 6
  ): Promise<ClinicianToolV4[]> {
    const tools = await this.getByCategory(category);
    return tools.filter((t) => t.featured).slice(0, limit);
  }

  /**
   * Get all featured clinician tools
   */
  static async getFeatured(limit = 6): Promise<ClinicianToolV4[]> {
    const tools = await this.loadClinicianTools();
    return tools.filter((t) => t.featured).slice(0, limit);
  }

  /**
   * Get related tools for a tool (publishable only)
   *
   * SECURITY: Only returns publishable tools even if source tool
   * has related_tools pointing to drafts.
   */
  static async getRelated(
    toolSlug: string,
    limit = 4
  ): Promise<ClinicianToolV4[]> {
    const tool = await this.getBySlug(toolSlug);
    if (!tool) return [];

    const related: ClinicianToolV4[] = [];

    // First, try explicit related tools (only publishable ones)
    if (tool.related_tools) {
      for (const relSlug of tool.related_tools.slice(0, limit * 2)) {
        // SECURITY: getBySlug only returns publishable by default
        const relTool = await this.getBySlug(relSlug);
        if (relTool) {
          related.push(relTool);
          if (related.length >= limit) break;
        }
      }
    }

    if (related.length >= limit) {
      return related.slice(0, limit);
    }

    // Fill with tools from same category
    const categoryTools = await this.getByCategory(tool.primary_category);
    for (const catTool of categoryTools) {
      if (
        catTool.slug !== toolSlug &&
        !related.some((r) => r.slug === catTool.slug)
      ) {
        related.push(catTool);
        if (related.length >= limit) break;
      }
    }

    return related.slice(0, limit);
  }

  /**
   * Get all tool slugs (for static generation) - publishable only
   */
  static async getAllSlugs(): Promise<string[]> {
    const tools = await this.loadClinicianTools();
    return tools.map((t) => t.slug);
  }

  /**
   * Get all unique categories from publishable tools
   */
  static async getAllCategories(): Promise<ClinicianProductCategory[]> {
    const tools = await this.loadClinicianTools();
    const categories = new Set<ClinicianProductCategory>();

    for (const tool of tools) {
      categories.add(tool.primary_category);
    }

    return Array.from(categories).sort();
  }

  /**
   * Get validation stats (for admin/debugging)
   */
  static getValidationStats(): typeof lastValidationStats {
    return lastValidationStats;
  }

  /**
   * Clear cache (useful for development)
   */
  static clearCache(): void {
    allValidToolsCache = null;
    validToolsBySlugCache = null;
    publishableToolsCache = null;
    publishableBySlugCache = null;
    lastValidationStats = null;
  }
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const loadClinicianTools =
  ClinicianToolService.loadClinicianTools.bind(ClinicianToolService);

export const loadAllToolsIncludingDrafts =
  ClinicianToolService.loadAllToolsIncludingDrafts.bind(ClinicianToolService);

export const getClinicianToolBySlug =
  ClinicianToolService.getBySlug.bind(ClinicianToolService);

export const getClinicianToolsByCategory =
  ClinicianToolService.getByCategory.bind(ClinicianToolService);

export const getClinicianToolCounts =
  ClinicianToolService.getToolCounts.bind(ClinicianToolService);

export const searchClinicianTools =
  ClinicianToolService.searchClinicianTools.bind(ClinicianToolService);

export const getComparisonCandidates =
  ClinicianToolService.getComparisonCandidates.bind(ClinicianToolService);
