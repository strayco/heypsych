/**
 * Treatment Manifest API
 *
 * Returns a list of all treatments with their basic metadata
 * for use in the treatment selector and comparison UI.
 *
 * Uses canonical loader for consistent slug resolution and deduplication.
 */

import { NextResponse } from "next/server";
import { generateTreatmentManifest } from "@/lib/comparison/treatment-loader";
import { logger } from "@/lib/utils/logger";

interface ManifestCache {
  data: ReturnType<typeof generateTreatmentManifest>;
  timestamp: number;
}

// Cache for 5 minutes in production
const CACHE_TTL_MS = process.env.NODE_ENV === "production" ? 5 * 60 * 1000 : 30 * 1000;
let manifestCache: ManifestCache | null = null;

/**
 * GET /api/treatments/manifest
 * Returns all treatments with basic metadata for the selector
 */
export async function GET() {
  try {
    const now = Date.now();

    // Return cached data if still valid
    if (manifestCache && now - manifestCache.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        treatments: manifestCache.data.treatments,
        count: manifestCache.data.treatments.length,
        modalities: manifestCache.data.modalities,
        categories: manifestCache.data.categories,
        cached: true,
      });
    }

    // Build fresh manifest using canonical loader
    const manifest = generateTreatmentManifest();

    // Update cache
    manifestCache = {
      data: manifest,
      timestamp: now,
    };

    return NextResponse.json({
      treatments: manifest.treatments,
      count: manifest.treatments.length,
      modalities: manifest.modalities,
      categories: manifest.categories,
      cached: false,
    });
  } catch (error) {
    logger.error("Error in treatment manifest API:", error);
    return NextResponse.json(
      { error: "Failed to load treatment manifest", treatments: [] },
      { status: 500 }
    );
  }
}
