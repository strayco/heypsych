// scripts/seed-resources-from-files.js
import dotenv from "dotenv";
import path from "node:path";
import { readJsonFilesRecursively } from "./utils/file-reader.js";
import { validateEntityBasic } from "./utils/data-validator.js";
import { upsertResource } from "./utils/schema-manager.js";

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

async function main() {
  const dir = path.resolve("data/resources");
  console.log(`📁 Reading resources from: ${dir}`);

  const items = readJsonFilesRecursively(dir);
  console.log(`📄 Found ${items.length} resource files`);

  for (const { file, data } of items) {
    try {
      validateEntityBasic(data, "resource");
      data.kind = data.kind || "resource";
      await upsertResource(data);
      console.log(`✅ Resource: ${data.slug} (${path.basename(file)})`);
    } catch (error) {
      console.error(`❌ Error processing ${path.basename(file)}:`, error.message);
    }
  }

  console.log(`\n🎉 Finished processing ${items.length} resource files`);
}

main().catch((e) => {
  console.error("💥 Fatal error:", e);
  process.exit(1);
});
