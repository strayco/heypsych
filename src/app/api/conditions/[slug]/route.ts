import { NextRequest, NextResponse } from "next/server";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { logger } from "@/lib/utils/logger";

class DynamicConditionLoader {
  private static categoriesCache: string[] | null = null;

  /** Dynamically discover all condition categories */
  static getConditionCategories(): string[] {
    if (this.categoriesCache) {
      return this.categoriesCache;
    }

    try {
      const conditionsPath = join(process.cwd(), "data", "conditions");

      if (!existsSync(conditionsPath)) {
        logger.warn("Conditions directory not found:", conditionsPath);
        return [];
      }

      const categories = readdirSync(conditionsPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
        .sort();

      this.categoriesCache = categories;
      logger.debug("🗂️ Auto-discovered condition categories:", categories);
      return categories;
    } catch (error) {
      logger.error("Error discovering condition categories:", error);
      return [];
    }
  }

  /** Load condition from any category */
  static loadCondition(slug: string): { data: any; category: string } | null {
    const categories = this.getConditionCategories();

    for (const category of categories) {
      try {
        const filePath = join(process.cwd(), "data", "conditions", category, `${slug}.json`);

        if (existsSync(filePath)) {
          logger.debug(`✅ Found ${slug} in category: ${category}`);
          const fileContent = readFileSync(filePath, "utf-8");
          const conditionData = JSON.parse(fileContent);

          return { data: conditionData, category };
        }
      } catch (error: any) {
        logger.debug(`❌ Error reading ${slug} from ${category}:`, error?.message || error);
        continue;
      }
    }

    return null;
  }

  /** Clear cache to force re-discovery */
  static clearCache() {
    this.categoriesCache = null;
  }
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    logger.debug(`🔍 Looking for condition: ${slug}`);

    // Use dynamic loader to find condition
    const result = DynamicConditionLoader.loadCondition(slug);

    if (!result) {
      const availableCategories = DynamicConditionLoader.getConditionCategories();
      logger.debug(`❌ Condition '${slug}' not found in any category`);
      logger.debug(`📂 Available categories:`, availableCategories);

      return NextResponse.json(
        {
          error: `Condition '${slug}' not found`,
          available_categories: availableCategories,
          suggestion: `Check if the file exists in any of these directories: ${availableCategories.join(", ")}`,
        },
        { status: 404 }
      );
    }

    const { data: conditionData, category } = result;

    // Transform to Entity-like format for consistency with your app
    const entityData = {
      id: `json-${slug}`,
      name: conditionData.name,
      title: conditionData.name, // Database uses 'title' field
      slug: conditionData.slug,
      type: conditionData.type || "condition",
      content: conditionData.content || conditionData, // Use 'content' to match database schema
      data: conditionData.content || conditionData,
      metadata: {
        ...conditionData.metadata,
        category: conditionData.metadata?.category || category,
        source: "json-file",
        file_category: category,
        discovered_at: new Date().toISOString(),
      },
      status: "active",
      schema: {
        schema_name: "condition",
        display_name: "Condition",
        entity_type: "condition",
      },
    };

    logger.debug(`✅ Successfully loaded ${slug} from ${category}`);

    return NextResponse.json(entityData);
  } catch (error: any) {
    logger.error("❌ Error in condition API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error?.message || "Unknown error",
        slug: slug,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// API endpoint to get all available categories
export async function OPTIONS(_request: NextRequest) {
  const availableCategories = DynamicConditionLoader.getConditionCategories();

  return new NextResponse(
    JSON.stringify({
      available_categories: availableCategories,
      category_count: availableCategories.length,
      discovered_at: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
