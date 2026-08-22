import { NextRequest, NextResponse } from "next/server";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { logger } from "@/lib/utils/logger";

export async function GET(request: NextRequest) {
  try {
    // Use pre-built index generated at build time
    const indexPath = join(process.cwd(), "public", "resources-index.json");

    if (!existsSync(indexPath)) {
      logger.warn("⚠️  Resource index not found. Run 'npm run build:index' to generate it.");
      return NextResponse.json({ resources: [] });
    }

    const indexData = JSON.parse(readFileSync(indexPath, "utf-8"));

    logger.debug(`📚 Loaded ${indexData.resources.length} resources from pre-built index`);

    return NextResponse.json({ resources: indexData.resources });
  } catch (error: any) {
    logger.error("Failed to load resources", error);
    return NextResponse.json(
      { error: "Failed to load resources", details: error?.message },
      { status: 500 }
    );
  }
}
