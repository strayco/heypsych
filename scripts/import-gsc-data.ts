#!/usr/bin/env ts-node
/**
 * GSC Data Import Script
 *
 * Imports Google Search Console data for the SEO control plane.
 *
 * Usage:
 *   npx ts-node scripts/import-gsc-data.ts [options]
 *
 * Options:
 *   --mock      Import mock data for testing
 *   --csv FILE  Import from CSV file (exported from GSC UI)
 *
 * @see Phase I of Wave 3 directive
 */

import path from "path";
import fs from "fs";
import {
  importFromMockData,
  importFromCsv,
  importFromGSCApi,
  getStoreMetadata,
} from "../src/lib/seo/search-performance";

const SITE_URL = "https://heypsych.com";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const useMock = args.includes("--mock");
  const csvIndex = args.indexOf("--csv");
  const csvFile = csvIndex !== -1 ? args[csvIndex + 1] : null;

  console.log("GSC Data Import\n");

  let result;

  if (useMock) {
    console.log("Importing mock data for testing...");
    result = importFromMockData(SITE_URL);
  } else if (csvFile) {
    console.log(`Importing from CSV file: ${csvFile}`);
    if (!fs.existsSync(csvFile)) {
      console.error(`Error: File not found: ${csvFile}`);
      process.exit(1);
    }
    const csvContent = fs.readFileSync(csvFile, "utf-8");
    result = importFromCsv(csvContent, SITE_URL);
  } else {
    console.log("Attempting GSC API import...");
    result = await importFromGSCApi({
      siteUrl: SITE_URL,
      clientEmail: process.env.GSC_CLIENT_EMAIL,
      privateKey: process.env.GSC_PRIVATE_KEY,
    });
  }

  if (result.success) {
    console.log(`\n✓ Import successful!`);
    console.log(`  Rows imported: ${result.rowsImported}`);
    console.log(`  Date range: ${result.dateRange.startDate} to ${result.dateRange.endDate}`);
    console.log(`  Imported at: ${result.importedAt}`);

    const metadata = getStoreMetadata();
    console.log(`\nStore stats:`);
    console.log(`  Total pages: ${metadata.pageCount}`);
    console.log(`  Last updated: ${metadata.lastUpdated}`);
  } else {
    console.log(`\n✗ Import failed`);
    if (result.errors) {
      for (const err of result.errors) {
        console.log(`  Error: ${err}`);
      }
    }

    if (!useMock && !csvFile) {
      console.log(`\nTip: Use --mock to import test data, or --csv FILE to import from CSV.`);
    }
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
