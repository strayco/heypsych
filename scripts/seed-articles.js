import { createClient } from "@supabase/supabase-js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function getAllJsonFiles(dir, fileList = []) {
  const files = await fs.readdir(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);

    if (stat.isDirectory()) {
      await getAllJsonFiles(filePath, fileList);
    } else if (file.endsWith(".json")) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

async function seedArticles() {
  console.log("🚀 Starting articles seeding...\n");

  const articlesPath = path.join(process.cwd(), "data/resources/articles-blogs");

  try {
    const jsonFiles = await getAllJsonFiles(articlesPath);
    console.log(`📁 Found ${jsonFiles.length} JSON files\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const filePath of jsonFiles) {
      try {
        const fileContent = await fs.readFile(filePath, "utf8");

        if (!fileContent.trim()) {
          skipCount++;
          continue;
        }

        const articleData = JSON.parse(fileContent);
        const slug = articleData.slug || path.basename(filePath, ".json");

        const metadata = articleData.metadata || {};
        const articleType = metadata.article_type || "article";

        // Check if article already exists
        const { data: existing } = await supabase
          .from("entities")
          .select("id")
          .eq("slug", slug)
          .eq("type", "resource")
          .single();

        let error;

        if (existing) {
          const result = await supabase
            .from("entities")
            .update({
              title: articleData.name || slug,
              description: articleData.description || "",
              content: articleData,
              metadata: {
                category: "articles-blogs",
                article_type: articleType,
                ...metadata,
              },
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
          error = result.error;
        } else {
          const result = await supabase.from("entities").insert({
            type: "resource",
            slug: slug,
            title: articleData.name || slug,
            description: articleData.description || "",
            content: articleData,
            metadata: {
              category: "articles-blogs",
              article_type: articleType,
              ...metadata,
            },
            status: "active",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          error = result.error;
        }

        if (error) {
          console.error(`❌ Error inserting ${slug}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Inserted: ${slug} (${articleType})`);
          successCount++;
        }
      } catch (parseError) {
        const filename = path.basename(filePath);
        console.error(`⚠️  Skipping ${filename}: ${parseError.message}`);
        skipCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 Articles seeding completed!");
    console.log("=".repeat(50));
    console.log(`✅ Successfully inserted: ${successCount}`);
    console.log(`⚠️  Skipped (empty/invalid): ${skipCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log("=".repeat(50) + "\n");
  } catch (error) {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  }
}

seedArticles();
