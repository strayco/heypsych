import { NextRequest, NextResponse } from "next/server";
import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";
import { logger } from "@/lib/utils/logger";

class DynamicResourceLoader {
  private static categoriesCache: string[] | null = null;

  /** Dynamically discover all resource categories */
  static getResourceCategories(): string[] {
    if (this.categoriesCache) {
      return this.categoriesCache;
    }

    try {
      const resourcesPath = join(process.cwd(), "data", "resources");

      if (!existsSync(resourcesPath)) {
        logger.warn("Resources directory not found:", resourcesPath);
        return [];
      }

      const categories = readdirSync(resourcesPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)
        .sort();

      this.categoriesCache = categories;
      logger.debug("🗂️ Auto-discovered resource categories:", categories);
      return categories;
    } catch (error) {
      logger.error("Error discovering resource categories", error);
      return [];
    }
  }

  /** Load resource from any category (searches subdirectories too) */
  static loadResource(slug: string): { data: any; category: string } | null {
    const categories = this.getResourceCategories();

    for (const category of categories) {
      try {
        // First try root of category
        const rootPath = join(process.cwd(), "data", "resources", category, `${slug}.json`);

        if (existsSync(rootPath)) {
          logger.debug(`✅ Found ${slug} in category: ${category}`);
          const fileContent = readFileSync(rootPath, "utf-8");
          const resourceData = JSON.parse(fileContent);
          return { data: resourceData, category };
        }

        // Then search subdirectories (for articles-guides structure)
        const categoryPath = join(process.cwd(), "data", "resources", category);
        if (existsSync(categoryPath)) {
          const subdirs = readdirSync(categoryPath, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

          for (const subdir of subdirs) {
            const subPath = join(categoryPath, subdir, `${slug}.json`);
            if (existsSync(subPath)) {
              logger.debug(`✅ Found ${slug} in ${category}/${subdir}`);
              const fileContent = readFileSync(subPath, "utf-8");
              const resourceData = JSON.parse(fileContent);
              return { data: resourceData, category };
            }
          }
        }
      } catch (error: any) {
        logger.debug(`Error reading ${slug} from ${category}:`, error?.message || error);
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
    logger.debug(`🔍 Looking for resource: ${slug}`);

    // Use dynamic loader to find resource
    const result = DynamicResourceLoader.loadResource(slug);

    if (!result) {
      const availableCategories = DynamicResourceLoader.getResourceCategories();
      logger.debug(`Resource '${slug}' not found in any category`);

      return NextResponse.json(
        {
          error: `Resource '${slug}' not found`,
          available_categories: availableCategories,
          suggestion: `Check if the file exists in any of these directories: ${availableCategories.join(", ")}`,
        },
        { status: 404 }
      );
    }

    const { data: resourceData, category } = result;

    // Return the resource content directly (matches what normalizeResource expects)
    logger.debug(`✅ Successfully loaded ${slug} from ${category}`);

    return NextResponse.json(resourceData);
  } catch (error: any) {
    logger.error("Error in resource API", error, { slug });
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
  const availableCategories = DynamicResourceLoader.getResourceCategories();

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
