// scripts/seed-conditions-from-files.js
import dotenv from "dotenv";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { readJsonFilesRecursively } from "./utils/file-reader.js";
import { validateEntityBasic } from "./utils/data-validator.js";

// Load environment variables
dotenv.config({ path: ".env.local" });

// Debug environment variables
console.log("🔧 Environment check:");
console.log(
  "NEXT_PUBLIC_SUPABASE_URL:",
  process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Found" : "❌ Missing"
);
console.log(
  "SUPABASE_SERVICE_ROLE_KEY:",
  process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ Found" : "❌ Missing"
);
console.log("");

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function upsertConditionFixed(data) {
  try {
    // Map JSON structure to database structure
    const entity = {
      type: "condition",
      slug: data.slug,
      title: data.name, // JSON "name" -> DB "title"
      description: data.content?.description || null,
      content: data.content || {}, // Store the content object
      metadata: data.metadata || {}, // Store the metadata object (including category)
      status: data.status || "active",
    };

    console.log(`  📝 Upserting condition:`, {
      slug: entity.slug,
      title: entity.title,
      category: entity.metadata?.category,
      contentKeys: Object.keys(entity.content),
    });

    const { data: result, error } = await supabase
      .from("entities")
      .upsert(entity, {
        onConflict: "slug,type",
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    console.log(`  ✅ Successfully upserted: ${entity.slug}`);
    return result;
  } catch (error) {
    console.error(`  ❌ Error upserting condition ${data.slug}:`, error);
    throw error;
  }
}

async function main() {
  const dir = path.resolve("data/conditions");
  console.log(`📁 Reading conditions from: ${dir}`);

  const items = readJsonFilesRecursively(dir);
  console.log(`📄 Found ${items.length} condition files`);

  let successCount = 0;
  let errorCount = 0;

  for (const { file, data } of items) {
    try {
      console.log(`\n📝 Processing: ${path.basename(file)}`);
      console.log(`  Data preview:`, {
        name: data.name,
        slug: data.slug,
        category: data.metadata?.category,
        hasContent: !!data.content,
        hasDescription: !!data.content?.description,
      });

      validateEntityBasic(data, "condition");

      await upsertConditionFixed(data);
      successCount++;
      console.log(`✅ Success: ${data.slug} (${path.basename(file)})`);
    } catch (error) {
      errorCount++;
      console.error(`❌ Error processing ${path.basename(file)}:`, error.message);
    }
  }

  console.log(`\n🎉 Finished processing ${items.length} condition files`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  // Verify the seeded data
  console.log("\n🔍 Verifying seeded conditions...");
  const { data: conditions, error } = await supabase
    .from("entities")
    .select("slug, title, type, metadata")
    .eq("type", "condition")
    .order("title");

  if (error) {
    console.error("❌ Error verifying conditions:", error);
  } else {
    console.log(`📊 Total conditions in database: ${conditions.length}`);
    conditions.forEach((condition) => {
      console.log(
        `  - ${condition.title} (${condition.slug}) - category: ${condition.metadata?.category || "null"}`
      );
    });
  }
}

main().catch((e) => {
  console.error("💥 Fatal error:", e);
  process.exit(1);
});
