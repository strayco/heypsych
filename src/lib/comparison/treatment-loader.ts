/**
 * Treatment Loader
 *
 * Canonical loader for treatment data. All runtime consumers should use
 * this module - do not parse treatment JSON independently.
 *
 * SCHEMA VERSION SUPPORT:
 * - Supports both V2 and V3 treatment formats
 * - V2: slug at data.slug, name at data.name, modality at data.type
 * - V3: slug at data.identity.slug, name at data.identity.name, modality at data.taxonomy.modality
 * - Always returns TreatmentV3 format (V2 is normalized on load)
 *
 * CANONICAL SLUG RESOLUTION:
 * - Uses internal `slug` field as canonical identifier (not filename)
 * - V3: data.identity.slug, V2: data.slug
 * - Supports alias resolution from filename-derived slugs to canonical slugs
 * - Excludes .legacy.json files (superseded)
 * - Prefers -v2 files over plain files when both exist
 */

import fs from "fs";
import path from "path";
import type { TreatmentV3 } from "../schemas/treatment-v3";
import { getTreatmentAsV3, isV2Treatment, type TreatmentV2 } from "./treatment-normalizer";

const TREATMENTS_DIR = path.join(process.cwd(), "data/treatments");

// =============================================================================
// CANONICAL SLUG INDEX (cached)
// =============================================================================

interface CanonicalEntry {
  canonicalSlug: string;
  filePath: string;
  fileName: string;
  priority: number;
}

// Cached index: canonical slug -> file path
let canonicalIndex: Map<string, string> | null = null;
// Cached alias map: filename-derived slug -> canonical slug
let aliasMap: Map<string, string> | null = null;

/**
 * Derives a slug from a filename by removing version suffixes.
 */
function deriveSlugFromFilename(fileName: string): string {
  return fileName
    .replace(/\.json$/i, "")
    .replace(/\.legacy$/i, "")
    .replace(/-v2$/i, "")
    .replace(/-E$/i, "-e"); // Normalize -E to -e
}

/**
 * Gets file priority for deduplication.
 */
function getFilePriority(fileName: string): number {
  if (fileName.includes("-v2.")) return 100;
  if (!fileName.includes(".legacy.") && !fileName.includes("-E.")) return 50;
  if (fileName.includes("-E.")) return 25;
  return 0;
}

/**
 * Builds the canonical slug index from treatment files.
 * Called once and cached for subsequent lookups.
 */
function buildCanonicalIndex(): { index: Map<string, string>; aliases: Map<string, string> } {
  const index = new Map<string, string>();
  const aliases = new Map<string, string>();
  const candidates = new Map<string, CanonicalEntry>();

  const modalityDirs = ["medications", "therapy", "interventional", "investigational", "supplements", "alternative"];

  for (const modality of modalityDirs) {
    const dir = path.join(TREATMENTS_DIR, modality);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

    for (const file of files) {
      // Skip legacy files
      if (file.includes(".legacy.")) continue;

      try {
        const filePath = path.join(dir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(content);

        // Skip non-treatments, drafts, noIndex
        if (data.kind && data.kind !== "treatment") continue;
        if (data.draft === true || data.noIndex === true) continue;

        // Support both V2 (data.slug) and V3 (data.identity.slug) formats
        const canonicalSlug = data.identity?.slug || data.slug;
        if (!canonicalSlug) continue;
        const fileNameSlug = deriveSlugFromFilename(file);
        const priority = getFilePriority(file);

        // Track best candidate for this canonical slug
        const existing = candidates.get(canonicalSlug);
        if (!existing || priority > existing.priority) {
          candidates.set(canonicalSlug, {
            canonicalSlug,
            filePath,
            fileName: file,
            priority,
          });
        }

        // Create alias if filename-derived slug differs from canonical
        if (fileNameSlug !== canonicalSlug) {
          aliases.set(fileNameSlug, canonicalSlug);
        }
      } catch {
        // Skip files that can't be parsed
      }
    }
  }

  // Build final index from best candidates
  for (const [slug, entry] of candidates) {
    index.set(slug, entry.filePath);
  }

  return { index, aliases };
}

/**
 * Gets the canonical index, building it if necessary.
 */
function getCanonicalIndex(): Map<string, string> {
  if (!canonicalIndex) {
    const result = buildCanonicalIndex();
    canonicalIndex = result.index;
    aliasMap = result.aliases;
  }
  return canonicalIndex;
}

/**
 * Gets the alias map, building the index if necessary.
 */
function getAliasMap(): Map<string, string> {
  if (!aliasMap) {
    const result = buildCanonicalIndex();
    canonicalIndex = result.index;
    aliasMap = result.aliases;
  }
  return aliasMap;
}

/**
 * Resolves a slug to its canonical form.
 * Handles both direct canonical slugs and aliases.
 */
export function resolveCanonicalSlug(slug: string): string {
  const index = getCanonicalIndex();
  const aliases = getAliasMap();

  // If it's already a canonical slug, return it
  if (index.has(slug)) {
    return slug;
  }

  // Check if it's an alias
  const canonical = aliases.get(slug);
  if (canonical && index.has(canonical)) {
    return canonical;
  }

  // Not found - return original (will fail on load)
  return slug;
}

/**
 * Clears the cached index (useful for testing or after data changes)
 */
export function clearCanonicalIndexCache(): void {
  canonicalIndex = null;
  aliasMap = null;
}

// =============================================================================
// TREATMENT INDEX
// =============================================================================

export interface TreatmentIndexEntry {
  slug: string;
  name: string;
  genericName?: string;
  brandNames?: string[];
  modality: string;
  category: string;
  summary: string;
  tags?: string[];
  wikidataQid?: string;
  filePath: string;
}

/**
 * Builds a lightweight index of all treatments for the selector.
 * Uses canonical index to ensure deduplication (e.g., sertraline-zoloft-v2.json
 * takes priority over sertraline-zoloft.json when both share the same canonical slug).
 */
export function buildTreatmentIndex(): TreatmentIndexEntry[] {
  const index: TreatmentIndexEntry[] = [];

  // Use canonical index for deduplication
  const canonicalIdx = getCanonicalIndex();

  for (const [slug, filePath] of canonicalIdx) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(content);

      // Skip compare files (shouldn't be in canonical index, but defensive)
      if (data.type === "resource" || data.comparison_table) continue;

      // Support both V2 and V3 formats
      const name = data.identity?.name || data.name;
      if (!name) continue;

      // V3 uses taxonomy.modality, V2 uses type
      const modality = data.taxonomy?.modality || data.type || "unknown";
      // V3 uses taxonomy.category, V2 uses category
      const category = data.taxonomy?.category || data.category || modality;
      // V3 uses identity.brand_names, V2 uses metadata.brand_names
      const brandNames = data.identity?.brand_names || data.metadata?.brand_names;
      // V3 uses identity.wikidata_qid, V2 uses metadata.wikidata_qid
      const wikidataQid = data.identity?.wikidata_qid || data.metadata?.wikidata_qid;
      // V3 uses taxonomy.tags, V2 uses tags
      const tags = data.taxonomy?.tags || data.tags;

      index.push({
        slug,
        name,
        genericName: extractGenericName(name),
        brandNames,
        modality,
        category,
        summary: data.summary || "",
        tags,
        wikidataQid,
        filePath,
      });
    } catch (err) {
      console.warn(`Failed to index ${filePath}:`, err);
    }
  }

  // Sort alphabetically
  index.sort((a, b) => a.name.localeCompare(b.name));

  return index;
}

/**
 * Extracts generic name from a name like "Sertraline (Zoloft)"
 */
function extractGenericName(name: string): string | undefined {
  const match = name.match(/^([^(]+)\s*\(/);
  if (match) {
    return match[1].trim().toLowerCase();
  }
  return undefined;
}

// =============================================================================
// TREATMENT LOADING
// =============================================================================

/**
 * Loads a treatment by slug and returns it in v3 format
 */
export async function loadTreatment(slug: string): Promise<TreatmentV3 | null> {
  const filePath = findTreatmentFile(slug);
  if (!filePath) return null;

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);
    return getTreatmentAsV3(data);
  } catch (err) {
    console.error(`Failed to load treatment ${slug}:`, err);
    return null;
  }
}

/**
 * Loads multiple treatments by slug.
 *
 * Returns a map keyed by CANONICAL slugs (not input slugs).
 * This ensures consistent URL generation regardless of how the slug was requested.
 */
export async function loadTreatments(slugs: string[]): Promise<Map<string, TreatmentV3>> {
  const treatments = new Map<string, TreatmentV3>();

  for (const slug of slugs) {
    const treatment = await loadTreatment(slug);
    if (treatment) {
      // Always use the canonical slug from the treatment itself
      const canonicalSlug = treatment.identity.slug;
      treatments.set(canonicalSlug, treatment);
    }
  }

  return treatments;
}

/**
 * Finds the file path for a treatment slug.
 *
 * Uses the canonical index for fast, consistent lookups.
 * Supports both canonical slugs and aliases (filename-derived slugs).
 */
export function findTreatmentFile(slug: string): string | null {
  const index = getCanonicalIndex();
  const aliases = getAliasMap();

  // Direct lookup by canonical slug
  const directPath = index.get(slug);
  if (directPath) {
    return directPath;
  }

  // Try alias resolution
  const canonicalSlug = aliases.get(slug);
  if (canonicalSlug) {
    const aliasPath = index.get(canonicalSlug);
    if (aliasPath) {
      return aliasPath;
    }
  }

  // Not found in index - try case-insensitive match as fallback
  const slugLower = slug.toLowerCase();
  for (const [canonical, filePath] of index) {
    if (canonical.toLowerCase() === slugLower) {
      return filePath;
    }
  }

  return null;
}

/**
 * Gets all available treatment slugs
 */
export function getAllTreatmentSlugs(): string[] {
  const index = buildTreatmentIndex();
  return index.map((t) => t.slug);
}

/**
 * Searches treatments by query
 */
export function searchTreatments(
  query: string,
  options?: {
    modality?: string;
    limit?: number;
  }
): TreatmentIndexEntry[] {
  const index = buildTreatmentIndex();
  const queryLower = query.toLowerCase();
  const limit = options?.limit || 20;

  let results = index.filter((t) => {
    // Filter by modality if specified
    if (options?.modality && t.modality !== options.modality) {
      return false;
    }

    // Match against name, generic name, brand names, tags
    if (t.name.toLowerCase().includes(queryLower)) return true;
    if (t.genericName?.includes(queryLower)) return true;
    if (t.brandNames?.some((b) => b.toLowerCase().includes(queryLower))) return true;
    if (t.tags?.some((tag) => tag.toLowerCase().includes(queryLower))) return true;

    return false;
  });

  // Sort by relevance (exact name match first)
  results.sort((a, b) => {
    const aExact = a.name.toLowerCase() === queryLower;
    const bExact = b.name.toLowerCase() === queryLower;
    if (aExact && !bExact) return -1;
    if (!aExact && bExact) return 1;

    const aStarts = a.name.toLowerCase().startsWith(queryLower);
    const bStarts = b.name.toLowerCase().startsWith(queryLower);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    return a.name.localeCompare(b.name);
  });

  return results.slice(0, limit);
}

/**
 * Gets treatments by modality
 */
export function getTreatmentsByModality(modality: string): TreatmentIndexEntry[] {
  const index = buildTreatmentIndex();
  return index.filter((t) => t.modality === modality);
}

// =============================================================================
// COMPARISON URL HELPERS
// =============================================================================

/**
 * Parses a comparison URL query string
 */
export function parseComparisonUrl(searchParams: URLSearchParams): {
  items: string[];
  condition?: string;
} {
  const items = searchParams.get("items")?.split(",").filter(Boolean) || [];
  const condition = searchParams.get("condition") || undefined;

  return { items, condition };
}

/**
 * Builds a comparison URL
 */
export function buildComparisonUrl(
  slugs: string[],
  condition?: string
): string {
  const params = new URLSearchParams();
  params.set("items", slugs.join(","));
  if (condition) {
    params.set("condition", condition);
  }
  return `/treatments/compare?${params.toString()}`;
}

// =============================================================================
// MANIFEST GENERATION
// =============================================================================

/**
 * Generates a lightweight manifest for client-side treatment selection
 */
export function generateTreatmentManifest(): {
  treatments: Array<{
    slug: string;
    name: string;
    modality: string;
    category: string;
  }>;
  modalities: string[];
  categories: string[];
  generated: string;
} {
  const index = buildTreatmentIndex();

  const treatments = index.map((t) => ({
    slug: t.slug,
    name: t.name,
    modality: t.modality,
    category: t.category,
  }));

  const modalities = [...new Set(index.map((t) => t.modality))].sort();
  const categories = [...new Set(index.map((t) => t.category))].sort();

  return {
    treatments,
    modalities,
    categories,
    generated: new Date().toISOString(),
  };
}
