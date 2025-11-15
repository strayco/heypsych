// seed-assessments-from-files.js
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { readJsonFilesRecursively } from "./utils/file-reader.js";
import { validateEntityBasic } from "./utils/data-validator.js";
import { supabase } from "./utils/db.js";

// Load environment variables
dotenv.config({ path: ".env.local" });

function isFileComplete(data, fileName) {
  if (!data || typeof data !== "object") return false;
  if (!data.slug || !data.name) return false;
  if (!data.description) return false;
  return true;
}

// Transform assessment data for database
function transformAssessmentForDB(assessment) {
  const slug = assessment.slug || assessment.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return {
    type: "resource",
    title: assessment.name,
    slug: slug,
    description: assessment.description,
    content: assessment, // Store full JSON data in content field
    metadata: {
      category: "assessments-screeners",
      assessment_category: assessment.category, // depression, anxiety, etc.
      validated: assessment.validated,
      free: assessment.free,
      duration: assessment.duration,
      age_range: assessment.age_range,
      featured: assessment.featured,
      order: assessment.order || 999,
      conditions: assessment.conditions || [],
      question_count: assessment.questions?.length || assessment.question_count,
    },
    status: "active",
  };
}

async function upsertAssessment(data) {
  const transformedData = transformAssessmentForDB(data);

  // Check if assessment already exists
  const { data: existing, error: selectError } = await supabase
    .from("entities")
    .select("id")
    .eq("slug", transformedData.slug)
    .eq("type", "resource")
    .single();

  if (selectError && selectError.code !== "PGRST116") {
    throw selectError;
  }

  if (existing) {
    // Update existing
    const { error } = await supabase.from("entities").update(transformedData).eq("id", existing.id);

    if (error) throw error;
    console.log(`Updated existing assessment: ${transformedData.slug}`);
  } else {
    // Insert new
    const { error } = await supabase.from("entities").insert([transformedData]);

    if (error) throw error;
    console.log(`Inserted new assessment: ${transformedData.slug}`);
  }
}

async function main() {
  console.log("Starting assessment seeding process...\n");

  // Allow optional CLI arg: file or folder
  const inputPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : path.resolve("data/resources/assessments-screeners");

  console.log(`Reading assessments from: ${inputPath}`);

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
    console.error("Error reading files:", error.message);
    process.exit(1);
  }

  console.log(`Found ${items.length} assessment files\n`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (const { file, data } of items) {
    const fileName = path.basename(file);

    try {
      console.log(`Processing: ${fileName}`);

      if (!isFileComplete(data, fileName)) {
        console.log(`Skipped: ${fileName} (incomplete - missing required fields)`);
        skippedCount++;
        continue;
      }

      validateEntityBasic(data, "resource");

      await upsertAssessment(data);

      console.log(`Success: ${data.slug}`);
      successCount++;
    } catch (error) {
      if (
        error.message.includes("Unexpected end of JSON input") ||
        error.message.includes("JSON") ||
        error.name === "SyntaxError"
      ) {
        console.log(`Skipped: ${fileName} (empty or malformed JSON)`);
        skippedCount++;
      } else {
        console.error(`Error processing ${fileName}:`, error.message);
        errorCount++;
      }
    }

    console.log("");
  }

  console.log("Seeding Summary:");
  console.log(`Successful: ${successCount}`);
  console.log(`Skipped: ${skippedCount} (incomplete or empty files)`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Total files: ${items.length}`);

  if (successCount > 0) {
    console.log(`Successfully seeded ${successCount} assessments!`);
  }

  if (skippedCount > 0) {
    console.log(
      `Tip: ${skippedCount} files were skipped. Complete them when ready and run the script again.`
    );
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
