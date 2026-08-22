/**
 * Resource Loader
 *
 * Canonical loader for resource data from local JSON files.
 * Provides build-safe enumeration of resources without database access.
 *
 * This loader is used by:
 * - generateStaticParams() for build-time page generation
 * - Sitemap generation for URL enumeration
 * - Any code that needs to enumerate resources without Supabase
 *
 * Runtime entity fetching still uses EntityService for database access.
 *
 * @see src/lib/conditions/condition-loader.ts - Similar pattern for conditions
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

const RESOURCES_DIR = "data/resources";

// =============================================================================
// TYPES
// =============================================================================

export interface ResourceIndexEntry {
  slug: string;
  name: string;
  category: string;
  subCategory?: string;
  filePath: string;
}

export interface ResourceLocalData {
  slug: string;
  name: string;
  description?: string;
  category?: string;
  // Add other fields as needed
}

// =============================================================================
// CACHE
// =============================================================================

let resourceIndexCache: ResourceIndexEntry[] | null = null;
let resourceSlugSetCache: Set<string> | null = null;

/**
 * Clear the resource index cache (for testing or after data changes)
 */
export function clearResourceCache(): void {
  resourceIndexCache = null;
  resourceSlugSetCache = null;
}

// =============================================================================
// INDEX BUILDING
// =============================================================================

/**
 * Recursively scan a directory for JSON files
 */
function scanDirectory(
  fs: any,
  path: any,
  dirPath: string,
  category: string,
  subCategory?: string
): ResourceIndexEntry[] {
  const entries: ResourceIndexEntry[] = [];

  try {
    const items = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name);

      if (item.isDirectory()) {
        // Recurse into subdirectories
        const subEntries = scanDirectory(
          fs,
          path,
          fullPath,
          category,
          item.name
        );
        entries.push(...subEntries);
      } else if (item.name.endsWith(".json") && item.name !== "index.json") {
        // Skip taxonomy files and index files
        if (fullPath.includes("/taxonomies/")) continue;

        try {
          const content = fs.readFileSync(fullPath, "utf-8");
          const data = JSON.parse(content);

          // Skip non-resource entries (like taxonomies)
          if (data.kind && data.kind !== "resource" && data.kind !== "tool") {
            continue;
          }

          const slug = data.slug || item.name.replace(".json", "");
          const name = data.name || slug;

          entries.push({
            slug,
            name,
            category,
            subCategory,
            filePath: fullPath,
          });
        } catch (err) {
          console.warn(`[ResourceLoader] Failed to parse ${item.name}:`, err);
        }
      }
    }
  } catch (err) {
    // Directory doesn't exist or can't be read
  }

  return entries;
}

/**
 * Builds a lightweight index of all resources from local JSON files.
 * Server-side only.
 */
export function buildResourceIndex(): ResourceIndexEntry[] {
  if (resourceIndexCache) {
    return resourceIndexCache;
  }

  const fs = loadServerModule("fs");
  const path = loadServerModule("path");

  if (!fs || !path) {
    console.warn("[ResourceLoader] File system not available");
    return [];
  }

  const index: ResourceIndexEntry[] = [];

  try {
    const resourcesPath = path.join(process.cwd(), RESOURCES_DIR);

    if (!fs.existsSync(resourcesPath)) {
      console.warn("[ResourceLoader] Resources directory not found");
      return [];
    }

    // Scan category directories
    const categories = fs.readdirSync(resourcesPath, { withFileTypes: true });

    for (const categoryDir of categories) {
      if (!categoryDir.isDirectory()) continue;

      const categoryPath = path.join(resourcesPath, categoryDir.name);
      const entries = scanDirectory(
        fs,
        path,
        categoryPath,
        categoryDir.name
      );
      index.push(...entries);
    }

    // Sort alphabetically by name
    index.sort((a, b) => a.name.localeCompare(b.name));

    resourceIndexCache = index;
    return index;
  } catch (error) {
    console.error("[ResourceLoader] Error building index:", error);
    return [];
  }
}

// =============================================================================
// SLUG ACCESS
// =============================================================================

/**
 * Get all resource slugs from local JSON files.
 * Build-safe - does not require database access.
 */
export function getAllResourceSlugs(): string[] {
  const index = buildResourceIndex();
  return index.map((r) => r.slug);
}

/**
 * Get a set of all valid resource slugs for fast lookup.
 */
export function getResourceSlugSet(): Set<string> {
  if (resourceSlugSetCache) {
    return resourceSlugSetCache;
  }

  const slugs = getAllResourceSlugs();
  resourceSlugSetCache = new Set(slugs);
  return resourceSlugSetCache;
}

/**
 * Check if a slug corresponds to a valid local resource.
 */
export function isValidResourceSlug(slug: string): boolean {
  const slugSet = getResourceSlugSet();
  return slugSet.has(slug);
}

/**
 * Get resource by slug from local JSON files.
 * For build-time/sitemap use only - runtime should use EntityService.
 */
export function getResourceBySlug(slug: string): ResourceLocalData | null {
  const fs = loadServerModule("fs");
  const path = loadServerModule("path");

  if (!fs || !path) {
    return null;
  }

  const index = buildResourceIndex();
  const entry = index.find((r) => r.slug === slug);

  if (!entry) {
    return null;
  }

  try {
    const content = fs.readFileSync(entry.filePath, "utf-8");
    return JSON.parse(content) as ResourceLocalData;
  } catch {
    return null;
  }
}

// =============================================================================
// CATEGORY ACCESS
// =============================================================================

/**
 * Get all resource categories
 */
export function getAllResourceCategories(): string[] {
  const index = buildResourceIndex();
  const categories = new Set(index.map((r) => r.category));
  return Array.from(categories).sort();
}

/**
 * Get resources by category
 */
export function getResourcesByCategory(
  category: string
): ResourceIndexEntry[] {
  const index = buildResourceIndex();
  return index.filter((r) => r.category === category);
}

// =============================================================================
// STATS
// =============================================================================

/**
 * Get statistics about local resource data
 */
export function getResourceStats(): {
  total: number;
  byCategory: Record<string, number>;
} {
  const index = buildResourceIndex();

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
// SITEMAP-ELIGIBLE RESOURCES
// =============================================================================

/**
 * Get all resources that are eligible for sitemap inclusion.
 *
 * This applies the same SEO eligibility checks as the database path,
 * ensuring consistent sitemap behavior during database fallback.
 *
 * @param excludeCategory - Optional category to exclude (e.g., "assessments-screeners")
 */
export async function getSitemapEligibleResources(
  excludeCategory?: string
): Promise<Array<{
  slug: string;
  name: string;
  category: string;
  lastmod?: string;
}>> {
  // Load SEO service lazily to avoid circular dependencies
  const { makeEntityIndexDecision, isQuarantined } = await getIndexDecisionService();

  const fs = loadServerModule("fs");
  const path = loadServerModule("path");

  if (!fs || !path) {
    console.warn("[ResourceLoader] File system not available for sitemap eligibility check");
    return [];
  }

  const index = buildResourceIndex();
  const eligible: Array<{ slug: string; name: string; category: string; lastmod?: string }> = [];

  for (const entry of index) {
    // Apply category exclusion filter
    if (excludeCategory && entry.category === excludeCategory) {
      continue;
    }

    // Quick check: is path quarantined?
    const resourcePath = `/resources/${entry.slug}`;
    if (isQuarantined(resourcePath)) {
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
        type: "resource" as const,
        schema_id: data.schema_id || "resource-v1",
        status: data.status || "active",
        visibility: data.visibility || "public",
        description: data.description || data.summary || "",
        data: data,
        metadata: data.metadata || { category: entry.category },
        editorial: data.editorial || {},
        seo: data.seo || {},
        created_at: data.created_at || "",
        updated_at: actualUpdatedAt || "",
      };

      // Apply full SEO decision
      const decision = makeEntityIndexDecision(entityLike, resourcePath);

      if (decision.sitemapEligible) {
        eligible.push({
          slug: entry.slug,
          name: entry.name,
          category: entry.category,
          // Only include lastmod if we have a real date, not a fabricated one
          ...(actualUpdatedAt ? { lastmod: actualUpdatedAt } : {}),
        });
      }
    } catch (err) {
      // If we can't load the full data, skip this resource for sitemap
      console.warn(`[ResourceLoader] Skipping ${entry.slug} for sitemap - failed to load:`, err);
    }
  }

  return eligible;
}
