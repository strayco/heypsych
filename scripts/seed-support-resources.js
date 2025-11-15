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

async function seedSupportResources() {
  console.log("🚀 Starting support resources seeding...\n");

  const supportResourcesPath = path.join(process.cwd(), "data/resources/support-community");

  try {
    // Get all JSON files recursively
    const jsonFiles = await getAllJsonFiles(supportResourcesPath);
    console.log(`📁 Found ${jsonFiles.length} JSON files\n`);

    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const filePath of jsonFiles) {
      try {
        const fileContent = await fs.readFile(filePath, "utf8");

        // Skip empty files
        if (!fileContent.trim()) {
          skipCount++;
          continue;
        }

        const resourceData = JSON.parse(fileContent);
        const slug = resourceData.slug || path.basename(filePath, ".json");

        // Extract metadata from resource data
        const metadata = resourceData.metadata || {};
        const subcategory = metadata.subcategory || "other";

        // Check if resource already exists
        const { data: existing } = await supabase
          .from("entities")
          .select("id")
          .eq("slug", slug)
          .eq("type", "resource")
          .single();

        let error;

        if (existing) {
          // Update existing resource
          const result = await supabase
            .from("entities")
            .update({
              title: resourceData.name || slug,
              description: resourceData.description || "",
              content: resourceData,
              metadata: {
                category: "support-community",
                subcategory: subcategory,
                ...metadata,
              },
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
          error = result.error;
        } else {
          // Insert new resource
          const result = await supabase.from("entities").insert({
            type: "resource",
            slug: slug,
            title: resourceData.name || slug,
            description: resourceData.description || "",
            content: resourceData,
            metadata: {
              category: "support-community",
              subcategory: subcategory,
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
          console.log(`✅ Inserted: ${slug} (${subcategory})`);
          successCount++;
        }
      } catch (parseError) {
        const filename = path.basename(filePath);
        console.error(`⚠️  Skipping ${filename}: ${parseError.message}`);
        skipCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎉 Support resources seeding completed!");
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

// Run the seeding
seedSupportResources();
