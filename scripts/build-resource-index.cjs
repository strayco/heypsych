#!/usr/bin/env node
// Pre-build resource index to eliminate runtime fs operations
const fs = require("fs");
const path = require("path");

const resourcesPath = path.join(__dirname, "../data/resources");
const outputPath = path.join(__dirname, "../public/resources-index.json");

const allResources = [];
let filesProcessed = 0;
let filesSkipped = 0;

function scanDirectory(dirPath, category, subCategory) {
  if (!fs.existsSync(dirPath)) {
    console.warn(`⚠️  Directory not found: ${dirPath}`);
    return;
  }

  const files = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dirPath, file.name);

    if (file.isFile() && file.name.endsWith(".json")) {
      // Skip index.json files as they have a different structure
      if (file.name === "index.json") {
        continue;
      }

      try {
        const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));

        // Skip empty or invalid files (must have name and either slug or id)
        if (!content.name || (!content.slug && !content.id)) {
          console.warn(`⚠️  Skipping invalid file: ${file.name}`);
          filesSkipped++;
          continue;
        }

        // Use slug if available, otherwise use id
        const resourceSlug = content.slug || content.id;

        allResources.push({
          id: `json-${resourceSlug || file.name.replace(".json", "")}`,
          name: content.name,
          title: content.name,
          slug: resourceSlug,
          description: content.description || "",
          type: "resource",
          content,
          pillar: content.pillar,
          metadata: {
            ...content.metadata,
            category: content.metadata?.category || category,
            subcategory: subCategory,
            source: "json-file",
          },
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        filesProcessed++;
      } catch (err) {
        console.warn(`⚠️  Skipping ${file.name}: ${err.message}`);
        filesSkipped++;
      }
    } else if (file.isDirectory()) {
      // Recursively process subdirectories
      scanDirectory(filePath, category, file.name);
    }
  }
}

console.log("🔨 Building resource index...");

if (!fs.existsSync(resourcesPath)) {
  console.error(`❌ Resources directory not found: ${resourcesPath}`);
  process.exit(1);
}

const categories = fs
  .readdirSync(resourcesPath, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

console.log(`📂 Found ${categories.length} resource categories: ${categories.join(", ")}`);

categories.forEach((cat) => {
  const catPath = path.join(resourcesPath, cat);
  console.log(`   Processing: ${cat}...`);
  scanDirectory(catPath, cat);
});

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write the index file
fs.writeFileSync(
  outputPath,
  JSON.stringify({ resources: allResources, generated: new Date().toISOString() }, null, 2)
);

console.log(`\n✅ Built resource index with ${allResources.length} resources`);
console.log(`   Files processed: ${filesProcessed}`);
console.log(`   Files skipped: ${filesSkipped}`);
console.log(`   Output: ${outputPath}`);
console.log(`   Size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
