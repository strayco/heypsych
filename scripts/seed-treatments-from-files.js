// Enhanced seed-treatments-from-files.js
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs"; // 👈 add this
import { readJsonFilesRecursively } from "./utils/file-reader.js";
import { validateEntityBasic } from "./utils/data-validator.js";
import { upsertTreatment } from "./utils/schema-manager.js";

// Load environment variables
dotenv.config({ path: ".env.local" });

function isFileComplete(data, fileName) {
  if (!data || typeof data !== "object") return false;
  if (!data.slug || !data.name) return false;
  if (!data.sections || !Array.isArray(data.sections) || data.sections.length === 0) return false;
  return true;
}

async function main() {
  console.log("🚀 Starting treatment seeding process...\n");

  // Allow optional CLI arg: file or folder
  const inputPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve("data/treatments");

  console.log(`📁 Reading treatments from: ${inputPath}`);

  let items;
  try {
    const stats = fs.statSync(inputPath);
    if (stats.isDirectory()) {
      items = readJsonFilesRecursively(inputPath);
    } else {
      // Single file support
      const raw = fs.readFileSync(inputPath, "utf8");
      const data = JSON.parse(raw);
      items = [{ file: inputPath, data }];
    }
  } catch (error) {
    console.error("❌ Error reading files:", error.message);
    process.exit(1);
  }

  console.log(`📄 Found ${items.length} treatment files\n`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const { file, data } of items) {
    const fileName = path.basename(file);

    try {
      console.log(`🔄 Processing: ${fileName}`);

      if (!isFileComplete(data, fileName)) {
        console.log(`⏭️  Skipped: ${fileName} (incomplete - missing required fields)`);
        skippedCount++;
        continue;
      }

      validateEntityBasic(data, "treatment");

      data.kind = data.kind || "treatment";

      await upsertTreatment(data);

      console.log(`✅ Success: ${data.slug}`);
      successCount++;
    } catch (error) {
      if (
        error.message.includes("Unexpected end of JSON input") ||
        error.message.includes("JSON") ||
        error.name === "SyntaxError"
      ) {
        console.log(`⏭️  Skipped: ${fileName} (empty or malformed JSON)`);
        skippedCount++;
      } else {
        console.error(`❌ Error processing ${fileName}:`, error.message);
        errorCount++;
      }
    }

    console.log("");
  }

  console.log("📊 Seeding Summary:");
  console.log(`✅ Successful: ${successCount}`);
  console.log(`⏭️  Skipped: ${skippedCount} (incomplete or empty files)`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`📄 Total files: ${items.length}`);

  if (successCount > 0) {
    console.log(`🎉 Successfully seeded ${successCount} treatments!`);
  }

  if (skippedCount > 0) {
    console.log(
      `💡 Tip: ${skippedCount} files were skipped. Complete them when ready and run the script again.`
    );
  }
}

main().catch((e) => {
  console.error("💥 Fatal error:", e);
  process.exit(1);
});
