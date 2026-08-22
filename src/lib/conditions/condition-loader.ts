/**
 * Condition Loader
 *
 * Canonical loader for condition data from local JSON files.
 * Provides build-safe enumeration of conditions without database access.
 *
 * This loader is used by:
 * - generateStaticParams() for build-time page generation
 * - Sitemap generation for URL enumeration
 * - Any code that needs to enumerate conditions without Supabase
 *
 * Runtime entity fetching still uses EntityService for database access.
 *
 * @see src/lib/comparison/treatment-loader.ts - Similar pattern for treatments
 * @see src/lib/data/entity-service.ts - Runtime database access
 */

// Lazy-loaded SEO service to avoid circular dependencies at module load time
let _indexDecisionService: typeof import("@/lib/seo/index-decision-service") | null = null;

async function getIndexDecisionService() {
  if (_indexDecisionService) return _indexDecisionService;
  _indexDecisionService = await import("@/lib/seo/index-decision-service");
  return _indexDecisionService;
}

// =============================================================================
// FILE SYSTEM LOADING (Server-side only)
// =============================================================================

/**
 * Webpack-safe server module loader
 */
function loadServerModule(moduleName: string): any {
  if (typeof window !== "undefined") return null;
  try {
    // eslint-disable-next-line no-eval
    return eval("require")(moduleName);
  } catch {
    return null;
  }
}

const CONDITIONS_DIR = "data/conditions";

// =============================================================================
// TYPES
// =============================================================================

export interface ConditionIndexEntry {
  slug: string;
  name: string;
  category: string;
  filePath: string;
}

export interface ConditionLocalData {
  slug: string;
  name: string;
  description?: string;
  category?: string;
  // Add other fields as needed
}

// =============================================================================
// CACHE
// =============================================================================

let conditionIndexCache: ConditionIndexEntry[] | null = null;
let conditionSlugSetCache: Set<string> | null = null;

/**
 * Clear the condition index cache (for testing or after data changes)
 */
export function clearConditionCache(): void {
  conditionIndexCache = null;
  conditionSlugSetCache = null;
}

// =============================================================================
// INDEX BUILDING
// =============================================================================

/**
 * Builds a lightweight index of all conditions from local JSON files.
 * Server-side only.
 */
export function buildConditionIndex(): ConditionIndexEntry[] {
  if (conditionIndexCache) {
    return conditionIndexCache;
  }

  const fs = loadServerModule("fs");
  const path = loadServerModule("path");

  if (!fs || !path) {
    console.warn("[ConditionLoader] File system not available");
    return [];
  }

  const index: ConditionIndexEntry[] = [];

  try {
    const conditionsPath = path.join(process.cwd(), CONDITIONS_DIR);

    if (!fs.existsSync(conditionsPath)) {
      console.warn("[ConditionLoader] Conditions directory not found");
      return [];
    }

    // Scan category directories
    const categories = fs.readdirSync(conditionsPath, { withFileTypes: true });

    for (const categoryDir of categories) {
      if (!categoryDir.isDirectory()) continue;

      const categoryPath = path.join(conditionsPath, categoryDir.name);
      const files = fs.readdirSync(categoryPath);

      for (const file of files) {
        if (!file.endsWith(".json")) continue;

        try {
          const filePath = path.join(categoryPath, file);
          const content = fs.readFileSync(filePath, "utf-8");
          const data = JSON.parse(content);

          // Extract slug and name
          const slug = data.slug || file.replace(".json", "");
          const name = data.name || slug;

          index.push({
            slug,
            name,
            category: categoryDir.name,
            filePath,
          });
        } catch (err) {
          console.warn(`[ConditionLoader] Failed to parse ${file}:`, err);
        }
      }
    }

    // Sort alphabetically by name
    index.sort((a, b) => a.name.localeCompare(b.name));

    conditionIndexCache = index;
    return index;
  } catch (error) {
    console.error("[ConditionLoader] Error building index:", error);
    return [];
  }
}

// =============================================================================
// SLUG ACCESS
// =============================================================================

/**
 * Get all condition slugs from local JSON files.
 * Build-safe - does not require database access.
 */
export function getAllConditionSlugs(): string[] {
  const index = buildConditionIndex();
  return index.map((c) => c.slug);
}

/**
 * Get a set of all valid condition slugs for fast lookup.
 */
export function getConditionSlugSet(): Set<string> {
  if (conditionSlugSetCache) {
    return conditionSlugSetCache;
  }

  const slugs = getAllConditionSlugs();
  conditionSlugSetCache = new Set(slugs);
  return conditionSlugSetCache;
}

/**
 * Check if a slug corresponds to a valid local condition.
 */
export function isValidConditionSlug(slug: string): boolean {
  const slugSet = getConditionSlugSet();
  return slugSet.has(slug);
}

/**
 * Get condition by slug from local JSON files.
 * For build-time/sitemap use only - runtime should use EntityService.
 */
export function getConditionBySlug(slug: string): ConditionLocalData | null {
  const fs = loadServerModule("fs");
  const path = loadServerModule("path");

  if (!fs || !path) {
    return null;
  }

  const index = buildConditionIndex();
  const entry = index.find((c) => c.slug === slug);

  if (!entry) {
    return null;
  }

  try {
    const content = fs.readFileSync(entry.filePath, "utf-8");
    return JSON.parse(content) as ConditionLocalData;
  } catch {
    return null;
  }
}

// =============================================================================
// CATEGORY ACCESS
// =============================================================================

/**
 * Get all condition categories
 */
export function getAllConditionCategories(): string[] {
  const index = buildConditionIndex();
  const categories = new Set(index.map((c) => c.category));
  return Array.from(categories).sort();
}

/**
 * Get conditions by category
 */
export function getConditionsByCategory(
  category: string
): ConditionIndexEntry[] {
  const index = buildConditionIndex();
  return index.filter((c) => c.category === category);
}

// =============================================================================
// STATS
// =============================================================================

/**
 * Get statistics about local condition data
 */
export function getConditionStats(): {
  total: number;
  byCategory: Record<string, number>;
} {
  const index = buildConditionIndex();

  const byCategory: Record<string, number> = {};
  for (const entry of index) {
    byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
  }

  return {
    total: index.length,
    byCategory,
  };
}

// =============================================================================
// SITEMAP-ELIGIBLE CONDITIONS
// =============================================================================

/**
 * Get all conditions that are eligible for sitemap inclusion.
 *
 * This applies the same SEO eligibility checks as the database path,
 * ensuring consistent sitemap behavior during database fallback.
 *
 * Only includes conditions that:
 * - Are active (exist in local JSON)
 * - Are public visibility
 * - Are not quarantined
 * - Pass basic quality gates (word count, etc.)
 */
export async function getSitemapEligibleConditions(): Promise<Array<{
  slug: string;
  name: string;
  lastmod?: string;
}>> {
  // Load SEO service lazily to avoid circular dependencies
  const { makeEntityIndexDecision, isQuarantined } = await getIndexDecisionService();

  const fs = loadServerModule("fs");
  const path = loadServerModule("path");

  if (!fs || !path) {
    console.warn("[ConditionLoader] File system not available for sitemap eligibility check");
    return [];
  }

  const index = buildConditionIndex();
  const eligible: Array<{ slug: string; name: string; lastmod?: string }> = [];

  for (const entry of index) {
    // Quick check: is path quarantined?
    const conditionPath = `/conditions/${entry.slug}`;
    if (isQuarantined(conditionPath)) {
      continue;
    }

    try {
      // Load full JSON to build entity-like structure
      const content = fs.readFileSync(entry.filePath, "utf-8");
      const data = JSON.parse(content);

      // Build minimal Entity structure for decision service
      // IMPORTANT: Do not use current time as fallback - that creates false freshness
      // Use actual dates from data, or omit entirely if unavailable
      const actualUpdatedAt = data.updated_at || data.last_updated || data.created_at;
      const entityLike = {
        id: entry.slug,
        slug: entry.slug,
        name: data.name || entry.name,
        type: "condition" as const,
        schema_id: data.schema_id || "condition-v1",
        status: data.status || "active",
        visibility: data.visibility || "public",
        description: data.description || "",
        data: data.content || data,
        metadata: data.metadata || {},
        editorial: data.editorial || {},
        seo: data.seo || {},
        created_at: data.created_at || "",
        updated_at: actualUpdatedAt || "",
      };

      // Apply full SEO decision
      const decision = makeEntityIndexDecision(entityLike, conditionPath);

      if (decision.sitemapEligible) {
        eligible.push({
          slug: entry.slug,
          name: entry.name,
          // Only include lastmod if we have a real date, not a fabricated one
          ...(actualUpdatedAt ? { lastmod: actualUpdatedAt } : {}),
        });
      }
    } catch (err) {
      // If we can't load the full data, skip this condition for sitemap
      console.warn(`[ConditionLoader] Skipping ${entry.slug} for sitemap - failed to load:`, err);
    }
  }

  return eligible;
}
