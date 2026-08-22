/**
 * Treatment API Route
 *
 * Returns treatment data in Entity-compatible format.
 *
 * CANONICAL LOADING:
 * - Uses treatment-loader.ts for all JSON access
 * - Supports both V2 and V3 treatment formats
 * - Handles slug resolution, aliases, and priority (-v2 > plain)
 */

import { NextRequest, NextResponse } from "next/server";
import { loadTreatment } from "@/lib/comparison/treatment-loader";
import { treatmentV3ToEntity } from "@/lib/comparison/treatment-entity-adapter";
import { logger } from "@/lib/utils/logger";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    logger.debug(`🔍 Looking for treatment: ${slug}`);

    // Use canonical loader - handles slug resolution, aliases, V2/V3 detection
    const treatment = await loadTreatment(slug);

    if (!treatment) {
      logger.debug(`❌ Treatment '${slug}' not found`);
      return NextResponse.json(
        {
          error: `Treatment '${slug}' not found`,
          suggestion: "Check that the slug exists in data/treatments/",
        },
        { status: 404 }
      );
    }

    // Convert to Entity format for API consistency
    const entityData = treatmentV3ToEntity(treatment);

    logger.debug(`✅ Successfully loaded ${slug}`);

    return NextResponse.json(entityData);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("❌ Error in treatment API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: message,
        slug: slug,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
