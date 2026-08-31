// src/lib/platforms/provider-platform-service.ts
// Service for loading provider platforms (Headway, Grow, Alma, etc.)
// These are "where to work" decisions, NOT software tools

import { z } from "zod";

// ============================================================================
// SCHEMA
// ============================================================================

/**
 * Provider Platform Schema - for therapist contractor platforms
 * Lighter schema than clinician tools since these aren't software
 */
export const ProviderPlatformZ = z.object({
  schema_version: z.literal("4.0"),
  kind: z.literal("provider-network"),
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  company_name: z.string().optional(),

  // Descriptions
  one_liner: z.string().optional(),
  short_description: z.string().optional(),
  long_description: z.string().optional(),

  // Key decision factors
  best_for: z.array(z.string()).default([]),
  not_for: z.array(z.string()).default([]),

  // Platform details
  pricing: z.object({
    model: z.string().optional(),
    starting_price_display: z.string().optional(),
    free_tier: z.boolean().optional(),
    notes: z.string().optional(),
  }).passthrough().optional(),

  // Credentialing
  features: z.record(z.string(), z.any()).optional(),
  reimbursement_rates: z.record(z.string(), z.any()).optional(),
  network_info: z.record(z.string(), z.any()).optional(),

  // Company info
  company_info: z.object({
    founded_year: z.union([z.number(), z.string()]).optional(),
    headquarters: z.string().optional(),
    employee_count: z.string().optional(),
    funding_status: z.string().optional(),
    total_funding: z.string().optional(),
  }).passthrough().optional(),

  // SEO
  seo: z.object({
    title: z.string().optional(),
    meta_description: z.string().optional(),
    faqs: z.array(z.object({
      q: z.string(),
      a: z.string(),
    })).optional(),
  }).passthrough().optional(),

  // Governance
  governance: z.object({
    data_quality_score: z.number().optional(),
    last_reviewed: z.string().optional(),
  }).passthrough().optional(),

  // Relations
  related_tools: z.array(z.string()).optional(),
  competitor_tools: z.array(z.string()).optional(),

  // Status
  featured: z.boolean().optional(),
  status: z.string().optional(),
}).passthrough();

export type ProviderPlatform = z.infer<typeof ProviderPlatformZ>;

// ============================================================================
// KEY PLATFORMS FOR COMPARISON
// ============================================================================

/**
 * The main "where to work" platforms that therapists actually compare
 * These are the contractor/credentialing platforms, not B2B or specialized providers
 */
export const KEY_COMPARISON_PLATFORMS = [
  "headway",
  "grow-therapy",
  "alma",
  "rula",
  "sondermind",
  "lifestance-health",
  "talkiatry",
  "thriveworks",
  "talkspace",
  "betterhelp",
] as const;

/**
 * Platform type categorization
 */
export const PLATFORM_TYPES = {
  // Therapist contractor platforms (main comparison set)
  "therapist-contractor": [
    "headway",
    "grow-therapy",
    "alma",
    "rula",
    "sondermind",
    "thriveworks",
  ],
  // W2 employer platforms (employment, not contractor)
  "w2-employer": [
    "lifestance-health",
    "talkiatry",
  ],
  // Direct-to-consumer with provider networks
  "dtc-provider": [
    "talkspace",
    "betterhelp",
    "cerebral",
  ],
  // B2B employer platforms (different decision)
  "b2b-employer": [
    "lyra-health",
    "spring-health",
    "modern-health",
    "headspace-health",
  ],
  // Specialized treatment (niche)
  "specialized": [
    "charlie-health",
    "equip",
    "nocd",
    "monument",
  ],
} as const;

// ============================================================================
// CACHE
// ============================================================================

let platformsCache: ProviderPlatform[] | null = null;
let platformsBySlugCache: Map<string, ProviderPlatform> | null = null;

// ============================================================================
// LOADER
// ============================================================================

function loadServerModule(moduleName: string): any {
  if (typeof window !== "undefined") return null;
  try {
    return eval("require")(moduleName);
  } catch {
    return null;
  }
}

function findJsonFiles(dir: string, fs: any, path: any): string[] {
  const files: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
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

async function loadPlatformsFromFiles(): Promise<ProviderPlatform[]> {
  if (platformsCache) return platformsCache;

  const fs = loadServerModule("fs");
  const path = loadServerModule("path");

  if (!fs || !path) {
    console.warn("File system not available");
    return [];
  }

  try {
    const platformsDir = path.join(process.cwd(), "data/tools-v4/products/provider-networks");

    if (!fs.existsSync(platformsDir)) {
      console.warn("Provider networks directory does not exist:", platformsDir);
      return [];
    }

    const files = findJsonFiles(platformsDir, fs, path);
    const platforms: ProviderPlatform[] = [];
    const bySlug = new Map<string, ProviderPlatform>();

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, "utf-8");
        const data = JSON.parse(content);

        // Only process provider networks
        if (data.schema_version !== "4.0" || data.kind !== "provider-network") {
          continue;
        }

        const result = ProviderPlatformZ.safeParse(data);
        if (!result.success) {
          continue;
        }

        const platform = result.data;

        // Only include active platforms
        if (platform.status !== "active") continue;

        platforms.push(platform);
        bySlug.set(platform.slug, platform);
      } catch (err) {
        // Skip invalid files
      }
    }

    // Sort featured first, then by name
    platforms.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return a.name.localeCompare(b.name);
    });

    platformsCache = platforms;
    platformsBySlugCache = bySlug;

    console.log(`[ProviderPlatformService] Loaded ${platforms.length} platforms`);

    return platforms;
  } catch (error) {
    console.error("Error loading platforms:", error);
    return [];
  }
}

// ============================================================================
// SERVICE
// ============================================================================

export class ProviderPlatformService {
  /**
   * Load all provider platforms
   */
  static async loadAll(): Promise<ProviderPlatform[]> {
    return loadPlatformsFromFiles();
  }

  /**
   * Get a platform by slug
   */
  static async getBySlug(slug: string): Promise<ProviderPlatform | null> {
    await loadPlatformsFromFiles();
    return platformsBySlugCache?.get(slug) ?? null;
  }

  /**
   * Get the key comparison platforms (therapist contractor platforms)
   */
  static async getKeyComparisonPlatforms(): Promise<ProviderPlatform[]> {
    const all = await this.loadAll();
    return all.filter(p =>
      KEY_COMPARISON_PLATFORMS.includes(p.slug as any)
    ).sort((a, b) => {
      // Sort by the order in KEY_COMPARISON_PLATFORMS
      const aIndex = KEY_COMPARISON_PLATFORMS.indexOf(a.slug as any);
      const bIndex = KEY_COMPARISON_PLATFORMS.indexOf(b.slug as any);
      return aIndex - bIndex;
    });
  }

  /**
   * Get platforms by type
   */
  static async getByType(type: keyof typeof PLATFORM_TYPES): Promise<ProviderPlatform[]> {
    const all = await this.loadAll();
    const slugs = PLATFORM_TYPES[type] as readonly string[];
    return all.filter(p => slugs.includes(p.slug));
  }

  /**
   * Get therapist contractor platforms (the main comparison set)
   */
  static async getTherapistContractorPlatforms(): Promise<ProviderPlatform[]> {
    return this.getByType("therapist-contractor");
  }

  /**
   * Get all slugs
   */
  static async getAllSlugs(): Promise<string[]> {
    const all = await this.loadAll();
    return all.map(p => p.slug);
  }

  /**
   * Clear cache
   */
  static clearCache(): void {
    platformsCache = null;
    platformsBySlugCache = null;
  }
}

// Convenience exports
export const loadProviderPlatforms = ProviderPlatformService.loadAll.bind(ProviderPlatformService);
export const getProviderPlatformBySlug = ProviderPlatformService.getBySlug.bind(ProviderPlatformService);
export const getKeyComparisonPlatforms = ProviderPlatformService.getKeyComparisonPlatforms.bind(ProviderPlatformService);
