// src/app/api/treatments/[slug]/route.ts - Fixed TypeScript errors
import { NextRequest, NextResponse } from "next/server";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { logger } from "@/lib/utils/logger";

class DynamicTreatmentLoader {
  private static categoriesCache: string[] | null = null;
  private static slugIndex:
    | Record<
        string,
        {
          category: string;
          fileName: string;
        }
      >
    | null = null;

  /** Dynamically discover all treatment categories */
  static getTreatmentCategories(): string[] {
    if (this.categoriesCache) {
      return this.categoriesCache;
    }

    try {
      const treatmentsPath = join(process.cwd(), "data", "treatments");

      if (!existsSync(treatmentsPath)) {
        logger.warn("Treatments directory not found:", treatmentsPath);
        return [];
      }

      const categories = readdirSync(treatmentsPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
        .sort();

      this.categoriesCache = categories;
      logger.debug("🗂️ Auto-discovered treatment categories:", categories);
      return categories;
    } catch (error) {
      logger.error("Error discovering treatment categories:", error);
      return [];
    }
  }

  /** Build a case-insensitive lookup for slug -> { category, fileName } */
  private static getSlugIndex() {
    if (this.slugIndex) {
      return this.slugIndex;
    }

    const index: Record<string, { category: string; fileName: string }> = {};

    try {
      const categories = this.getTreatmentCategories();

      categories.forEach((category) => {
        const categoryPath = join(process.cwd(), "data", "treatments", category);

        if (!existsSync(categoryPath)) {
          return;
        }

        const files = readdirSync(categoryPath).filter((file) => file.endsWith(".json"));

        files.forEach((file) => {
          const slugKey = file.replace(/\.json$/i, "").toLowerCase();

          // Only index the first occurrence to avoid collisions
          if (!index[slugKey]) {
            index[slugKey] = { category, fileName: file };
          }
        });
      });

      this.slugIndex = index;
      logger.debug("🧭 Built treatment slug index with", Object.keys(index).length, "entries");
    } catch (error) {
      logger.error("Error building treatment slug index:", error);
      this.slugIndex = {};
    }

    return this.slugIndex;
  }

  /** Load treatment from any category */
  static loadTreatment(slug: string): { data: any; category: string } | null {
    const categories = this.getTreatmentCategories();

    for (const category of categories) {
      try {
        const filePath = join(process.cwd(), "data", "treatments", category, `${slug}.json`);

        if (existsSync(filePath)) {
          logger.debug(`✅ Found ${slug} in category: ${category}`);
          const fileContent = readFileSync(filePath, "utf-8");
          const treatmentData = JSON.parse(fileContent);

          return { data: treatmentData, category };
        }
      } catch (error: any) {
        // Fixed: explicitly type error as 'any'
        logger.debug(`❌ Error reading ${slug} from ${category}:`, error?.message || error);
        continue;
      }
    }

    // Case-insensitive fallback: try slug index to find the right file casing
    const slugIndex = this.getSlugIndex();
    const normalizedSlug = slug.toLowerCase();
    const indexedEntry = slugIndex?.[normalizedSlug];

    if (indexedEntry) {
      try {
        const filePath = join(
          process.cwd(),
          "data",
          "treatments",
          indexedEntry.category,
          indexedEntry.fileName
        );

        logger.debug(
          `✅ Found ${slug} via case-insensitive match (${indexedEntry.fileName}) in ${indexedEntry.category}`
        );
        const fileContent = readFileSync(filePath, "utf-8");
        const treatmentData = JSON.parse(fileContent);

        return { data: treatmentData, category: indexedEntry.category };
      } catch (error: any) {
        logger.error(`Error reading treatment file via slug index for ${slug}:`, error, {
          slug,
          category: indexedEntry.category,
          fileName: indexedEntry.fileName,
        });
        return null;
      }
    }

    return null;
  }

  /** Get all treatments in a specific category */
  static getTreatmentsInCategory(category: string): string[] {
    try {
      const categoryPath = join(process.cwd(), "data", "treatments", category);

      if (!existsSync(categoryPath)) {
        return [];
      }

      return readdirSync(categoryPath)
        .filter((file) => file.endsWith(".json"))
        .map((file) => file.replace(".json", ""))
        .sort();
    } catch (error) {
      logger.error(`Error reading category ${category}:`, error);
      return [];
    }
  }

  /** Clear cache to force re-discovery */
  static clearCache() {
    this.categoriesCache = null;
    this.slugIndex = null;
  }
}

// Helper function to map categories to entity types (moved outside class to fix 'this' issue)
function mapCategoryToEntityType(category: string): string {
  const mapping: Record<string, string> = {
    medications: "medication",
    interventional: "interventional",
    investigational: "investigational",
    alternative: "alternative",
    therapy: "therapy",
    supplements: "supplement",
  };

  return mapping[category] || "treatment";
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    logger.debug(`🔍 Looking for treatment: ${slug}`);

    // Use dynamic loader to find treatment
    const result = DynamicTreatmentLoader.loadTreatment(slug);

    if (!result) {
      const availableCategories = DynamicTreatmentLoader.getTreatmentCategories();
      logger.debug(`❌ Treatment '${slug}' not found in any category`);
      logger.debug(`📂 Available categories:`, availableCategories);

      return NextResponse.json(
        {
          error: `Treatment '${slug}' not found`,
          available_categories: availableCategories,
          suggestion: `Check if the file exists in any of these directories: ${availableCategories.join(", ")}`,
        },
        { status: 404 }
      );
    }

    const { data: treatmentData, category } = result;

    // Transform to Entity-like format for consistency with your app
    const entityData = {
      id: `json-${slug}`,
      name: treatmentData.name,
      title: treatmentData.name, // Database uses 'title' field
      slug: treatmentData.slug,
      description: treatmentData.summary || treatmentData.description,
      content: treatmentData, // Use 'content' to match database schema
      data: treatmentData, // The entire JSON becomes the data
      metadata: {
        category: treatmentData.category || category,
        source: "json-file",
        file_category: category,
        discovered_at: new Date().toISOString(),
      },
      status: "active",
      schema: {
        schema_name: category,
        display_name: category.charAt(0).toUpperCase() + category.slice(1),
        entity_type: mapCategoryToEntityType(category), // Fixed: use function instead of this.
      },
    };

    logger.debug(`✅ Successfully loaded ${slug} from ${category}`);

    return NextResponse.json(entityData);
  } catch (error: any) {
    // Fixed: explicitly type error
    logger.error("❌ Error in treatment API:", error);
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

// API endpoint to get all available categories (useful for debugging and admin)
export async function OPTIONS(_request: NextRequest) {
  const availableCategories = DynamicTreatmentLoader.getTreatmentCategories();

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
