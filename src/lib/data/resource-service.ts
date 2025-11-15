// SERVER-SIDE RESOURCE LOADING
// Eliminates 321KB client-side fetch

import fs from "fs";
import path from "path";
import { logger } from "@/lib/utils/logger";

// Cache in memory for server-side reuse
let resourceIndexCache: any[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class ResourceService {
  /**
   * Load resources from pre-built index (server-side only)
   * Uses in-memory cache with 5-minute TTL
   */
  static async getResourceIndex(): Promise<any[]> {
    const now = Date.now();

    // Return cached data if still valid
    if (resourceIndexCache && now - cacheTimestamp < CACHE_TTL) {
      logger.debug("📦 Using cached resource index");
      return resourceIndexCache;
    }

    try {
      // Load from public directory
      const indexPath = path.join(process.cwd(), "public", "resources-index.json");
      const content = fs.readFileSync(indexPath, "utf-8");
      const data = JSON.parse(content);

      // Update cache
      resourceIndexCache = data;
      cacheTimestamp = now;

      logger.debug(`📦 Loaded ${data.length} resources from index`);
      return data;
    } catch (error) {
      logger.error("Failed to load resource index", error);
      return [];
    }
  }

  /**
   * Get resources filtered by category
   */
  static async getResourcesByCategory(category: string): Promise<any[]> {
    const allResources = await this.getResourceIndex();
    return allResources.filter((r) => r.pillar === category || r.metadata?.category === category);
  }

  /**
   * Get single resource by slug
   */
  static async getResourceBySlug(slug: string): Promise<any | null> {
    const allResources = await this.getResourceIndex();
    return allResources.find((r) => r.slug === slug) || null;
  }
}
