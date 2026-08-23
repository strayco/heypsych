#!/usr/bin/env node
// Script to promote tools with active lifecycle to active publishing status

const fs = require("fs");
const path = require("path");

const productsDir = path.join(process.cwd(), "data/tools-v4/products");
let updated = 0;
let skipped = 0;
let errors = 0;

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.name.endsWith(".json")) {
      try {
        const content = fs.readFileSync(fullPath, "utf-8");
        const data = JSON.parse(content);

        // Only process V4 clinician tools
        if (data.schema_version !== "4.0" || data.kind !== "clinician-tool") {
          continue;
        }

        // If lifecycle is active or beta and status is draft, promote to active
        const lifecycleStatus = data.lifecycle?.status;
        const currentStatus = data.status;

        if (["active", "beta"].includes(lifecycleStatus) && currentStatus === "draft") {
          data.status = "active";
          fs.writeFileSync(fullPath, JSON.stringify(data, null, 2) + "\n");
          updated++;
        } else {
          skipped++;
        }
      } catch (err) {
        console.error("Error processing", fullPath, err.message);
        errors++;
      }
    }
  }
}

processDir(productsDir);
console.log(`Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
