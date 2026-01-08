#!/usr/bin/env npx tsx
/**
 * IndexNow Push Script
 * 
 * Manually push URLs to IndexNow for instant indexing.
 * 
 * Usage:
 *   npx tsx scripts/push-indexnow.ts /treatments/lexapro /conditions/depression
 *   npx tsx scripts/push-indexnow.ts --all-comparisons
 *   npx tsx scripts/push-indexnow.ts --sitemap
 */

import { readdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";

const SITE_HOST = "heypsych.com";
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "heypsych-indexnow-key";

const INDEXNOW_ENDPOINTS = [
  "https://api.indexnow.org/indexnow",
  "https://www.bing.com/indexnow",
];

async function pushToIndexNow(urls: string[]): Promise<void> {
  if (urls.length === 0) {
    console.log("❌ No URLs to submit");
    return;
  }

  const absoluteUrls = urls.map((url) =>
    url.startsWith("http") ? url : `https://${SITE_HOST}${url.startsWith("/") ? url : "/" + url}`
  );

  const payload = {
    host: SITE_HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`,
    urlList: absoluteUrls,
  };

  console.log(`\n📤 Submitting ${absoluteUrls.length} URLs to IndexNow...\n`);

  for (const endpoint of INDEXNOW_ENDPOINTS) {
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status === 202) {
        console.log(`✅ ${endpoint}: Success (${response.status})`);
      } else {
        console.log(`⚠️ ${endpoint}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint}: Failed - ${error}`);
    }
  }

  console.log("\n📋 URLs submitted:");
  absoluteUrls.slice(0, 20).forEach((url) => console.log(`   ${url}`));
  if (absoluteUrls.length > 20) {
    console.log(`   ... and ${absoluteUrls.length - 20} more`);
  }
}

function getAllComparisonUrls(): string[] {
  const comparePath = join(process.cwd(), "data/treatments/compare");
  if (!existsSync(comparePath)) return [];

  return readdirSync(comparePath)
    .filter((f) => f.endsWith(".json"))
    .map((f) => `/treatments/compare/${f.replace(".json", "")}`);
}

function getAllConditionUrls(): string[] {
  const conditionsPath = join(process.cwd(), "data/conditions");
  if (!existsSync(conditionsPath)) return [];

  const urls: string[] = [];
  
  function scanDir(dir: string) {
    const items = readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (item.isDirectory()) {
        scanDir(join(dir, item.name));
      } else if (item.name.endsWith(".json")) {
        try {
          const content = JSON.parse(readFileSync(join(dir, item.name), "utf-8"));
          if (content.slug) {
            urls.push(`/conditions/${content.slug}`);
          }
        } catch {}
      }
    }
  }
  
  scanDir(conditionsPath);
  return urls;
}

function getAllTreatmentUrls(): string[] {
  const treatmentsPath = join(process.cwd(), "data/treatments");
  if (!existsSync(treatmentsPath)) return [];

  const urls: string[] = [];
  
  function scanDir(dir: string) {
    const items = readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      if (item.isDirectory() && item.name !== "compare") {
        scanDir(join(dir, item.name));
      } else if (item.name.endsWith(".json")) {
        try {
          const content = JSON.parse(readFileSync(join(dir, item.name), "utf-8"));
          if (content.slug) {
            urls.push(`/treatments/${content.slug}`);
          }
        } catch {}
      }
    }
  }
  
  scanDir(treatmentsPath);
  return urls;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
IndexNow Push Script
====================

Usage:
  npx tsx scripts/push-indexnow.ts [URLs or flags]

Examples:
  npx tsx scripts/push-indexnow.ts /treatments/lexapro
  npx tsx scripts/push-indexnow.ts --all-comparisons
  npx tsx scripts/push-indexnow.ts --all-conditions
  npx tsx scripts/push-indexnow.ts --all-treatments
  npx tsx scripts/push-indexnow.ts --all

Flags:
  --all-comparisons   Push all comparison pages
  --all-conditions    Push all condition pages
  --all-treatments    Push all treatment pages
  --all               Push everything
`);
    return;
  }

  let urls: string[] = [];

  for (const arg of args) {
    switch (arg) {
      case "--all-comparisons":
        urls.push(...getAllComparisonUrls());
        break;
      case "--all-conditions":
        urls.push(...getAllConditionUrls());
        break;
      case "--all-treatments":
        urls.push(...getAllTreatmentUrls());
        break;
      case "--all":
        urls.push(...getAllComparisonUrls());
        urls.push(...getAllConditionUrls());
        urls.push(...getAllTreatmentUrls());
        urls.push("/", "/treatments", "/conditions", "/resources");
        break;
      default:
        if (!arg.startsWith("--")) {
          urls.push(arg);
        }
    }
  }

  // Dedupe
  urls = [...new Set(urls)];

  await pushToIndexNow(urls);
}

main().catch(console.error);


