#!/usr/bin/env tsx
// scripts/validate-tools-v3.ts
// Validation script for v3 digital tools

import fs from "fs";
import path from "path";
import { DigitalToolV3Z } from "../src/lib/schemas/digital-tool-v3";

const LEGACY_DIR = path.join(process.cwd(), "data/resources/digital-tools");
const V3_DIR = path.join(process.cwd(), "data/resources/tools");

interface ValidationResult {
  slug: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}

function validateTool(data: unknown, slug: string): ValidationResult {
  const result: ValidationResult = {
    slug,
    valid: true,
    errors: [],
    warnings: [],
  };

  // Try Zod validation
  const zodResult = DigitalToolV3Z.safeParse(data);
  if (!zodResult.success) {
    result.valid = false;
    const issues = zodResult.error.issues || [];
    for (const err of issues) {
      const pathStr = err.path.map(String).join(".");
      result.errors.push(`${pathStr}: ${err.message}`);
    }
    return result;
  }

  const tool = zodResult.data;

  // Custom validation rules

  // 1. Governance must be exactly as required
  if (tool.governance.reviewed_by_label !== "Reviewed by HeyPsych Board") {
    result.valid = false;
    result.errors.push("governance.reviewed_by_label must be 'Reviewed by HeyPsych Board'");
  }

  if (tool.governance.reviewed_by_url !== "https://heypsych.com/about/medical-review-board") {
    result.valid = false;
    result.errors.push("governance.reviewed_by_url must be 'https://heypsych.com/about/medical-review-board'");
  }

  // 2. Minimum 3 FAQs
  if (tool.seo.faqs.length < 3) {
    result.valid = false;
    result.errors.push(`seo.faqs: Minimum 3 FAQs required (found ${tool.seo.faqs.length})`);
  }

  // 3. Canonical URL format
  const expectedCanonical = `https://heypsych.com/tools/${tool.slug}/`;
  if (tool.seo.canonical_url !== expectedCanonical) {
    result.valid = false;
    result.errors.push(`seo.canonical_url: Expected '${expectedCanonical}', got '${tool.seo.canonical_url}'`);
  }

  // 4. Valid hub slugs
  const validHubs = [
    "sleep",
    "anxiety-stress",
    "mood-depression",
    "focus-adhd",
    "trauma-ptsd",
    "substance-use",
    "serious-mental-illness",
    "find-support",
  ];

  for (const hub of tool.primary_hubs) {
    if (!validHubs.includes(hub)) {
      result.valid = false;
      result.errors.push(`primary_hubs: Invalid hub '${hub}'`);
    }
  }

  // Warnings (don't fail validation)
  if (tool.privacy.grade === "unknown") {
    result.warnings.push("privacy.grade is 'unknown' - consider adding a grade");
  }

  if (!tool.app_rating) {
    result.warnings.push("app_rating is missing - no SERP stars");
  }

  if (tool.one_liner.length < 50) {
    result.warnings.push("one_liner is short - consider expanding for AEO");
  }

  return result;
}

async function main() {
  console.log("🔍 Validating v3 tools...\n");

  const results: ValidationResult[] = [];
  let dir = V3_DIR;

  // Check which directory has files
  if (!fs.existsSync(V3_DIR) || fs.readdirSync(V3_DIR).filter((f) => f.endsWith(".json")).length === 0) {
    console.log("No v3 files found, validating legacy files with v3 migration...\n");
    dir = LEGACY_DIR;
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json") && !f.includes(".v1-backup"));

  console.log(`📂 Found ${files.length} files to validate\n`);

  for (const file of files) {
    try {
      const filePath = path.join(dir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(content);

      const slug = data.slug || file.replace(".json", "").replace(".v3", "");
      const result = validateTool(data, slug);
      results.push(result);

      if (result.valid) {
        console.log(`✅ ${slug}`);
        if (result.warnings.length > 0) {
          result.warnings.forEach((w) => console.log(`   ⚠️  ${w}`));
        }
      } else {
        console.log(`❌ ${slug}`);
        result.errors.forEach((e) => console.log(`   🚫 ${e}`));
        result.warnings.forEach((w) => console.log(`   ⚠️  ${w}`));
      }
    } catch (error) {
      console.error(`❌ Error reading ${file}:`, error);
      results.push({
        slug: file,
        valid: false,
        errors: [`Parse error: ${error}`],
        warnings: [],
      });
    }
  }

  // Summary
  const valid = results.filter((r) => r.valid).length;
  const invalid = results.filter((r) => !r.valid).length;
  const withWarnings = results.filter((r) => r.warnings.length > 0).length;

  console.log("\n" + "=".repeat(60));
  console.log("📊 VALIDATION SUMMARY");
  console.log("=".repeat(60));
  console.log(`✅ Valid: ${valid}`);
  console.log(`❌ Invalid: ${invalid}`);
  console.log(`⚠️  With warnings: ${withWarnings}`);

  if (invalid > 0) {
    console.log("\n❌ INVALID TOOLS (LAUNCH BLOCKERS):");
    results
      .filter((r) => !r.valid)
      .forEach((r) => {
        console.log(`\n   ${r.slug}:`);
        r.errors.forEach((e) => console.log(`      - ${e}`));
      });

    process.exit(1);
  }

  console.log("\n✅ All tools pass validation!");
}

main().catch(console.error);
