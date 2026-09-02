#!/usr/bin/env node
/**
 * FIX REMAINING ISSUES
 * Handles integration categories, types, SEO canonical URLs, and other edge cases
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const PRODUCTS_DIR = '/Users/jack/heypsych/data/tools-v4/products';

// ============================================================================
// VALID ENUMS
// ============================================================================

const VALID_INTEGRATION_CATEGORIES = [
  "ehr", "billing", "telehealth", "lab", "pharmacy", "payer", "calendar",
  "communication", "analytics", "other",
];

const VALID_INTEGRATION_TYPES = [
  "native", "api", "hl7", "fhir", "zapier", "partner", "file-based",
];

const VALID_PRICE_RANGES = ["budget", "mid-market", "premium", "enterprise"];

// ============================================================================
// CATEGORY MAPPINGS
// ============================================================================

const INTEGRATION_CATEGORY_MAP = {
  "productivity": "other",
  "data": "other",
  "crm": "other",
  "interoperability": "ehr",
  "hie": "ehr",
  "cloud": "other",
  "patient-engagement": "communication",
  "prescribing": "pharmacy",
  "identity": "other",
  "payment": "billing",
  "reporting": "analytics",
  "authentication": "other",
  "hr": "other",
  "chronic-care": "ehr",
  "benefits": "other",
  "insurance": "payer",
  "workflow": "other",
  "messaging": "communication",
  "scheduling": "calendar",
  "documentation": "ehr",
  "referral": "other",
  "compliance": "other",
  "revenue-cycle": "billing",
  "practice-management": "ehr",
  "mental-health": "ehr",
  "assessment": "other",
  "outcomes": "other",
};

const INTEGRATION_TYPE_MAP = {
  "varies": "api",
  "export": "file-based",
  "data-import": "file-based",
  "compatible": "api",
  "sso": "api",
  "referral": "partner",
  "webhook": "api",
  "sdk": "api",
  "direct": "native",
  "bi-directional": "api",
  "adt": "hl7",
  "sftp": "file-based",
  "manual": "file-based",
  "embed": "api",
  "iframe": "api",
};

// ============================================================================
// FIX FUNCTIONS
// ============================================================================

function fixIntegrationCategory(cat) {
  if (!cat) return undefined;
  if (VALID_INTEGRATION_CATEGORIES.includes(cat)) return cat;
  if (INTEGRATION_CATEGORY_MAP[cat]) return INTEGRATION_CATEGORY_MAP[cat];
  return "other";
}

function fixIntegrationType(type) {
  if (!type) return undefined;
  if (VALID_INTEGRATION_TYPES.includes(type)) return type;
  if (INTEGRATION_TYPE_MAP[type]) return INTEGRATION_TYPE_MAP[type];
  return "api"; // Default to API
}

function fixPriceRange(range) {
  if (!range) return undefined;
  if (VALID_PRICE_RANGES.includes(range)) return range;
  if (range === "varies" || range === "custom") return undefined; // Remove invalid
  return undefined;
}

function fixCanonicalUrl(url, slug) {
  if (!url) return undefined;
  const expected = `https://heypsych.com/tools/for-clinicians/${slug}/`;
  const pattern = /^https:\/\/heypsych\.com\/tools\/for-clinicians\/[\w-]+\/$/;
  if (pattern.test(url)) return url;
  return expected;
}

function fixTool(tool) {
  let modified = false;
  const fixes = [];

  // Fix integrations
  if (tool.integrations && Array.isArray(tool.integrations)) {
    tool.integrations = tool.integrations.map((int, i) => {
      let intModified = false;

      // Fix category
      if (int.category && !VALID_INTEGRATION_CATEGORIES.includes(int.category)) {
        const fixed = fixIntegrationCategory(int.category);
        if (fixed !== int.category) {
          int.category = fixed;
          intModified = true;
        }
      }

      // Fix integration_type
      if (int.integration_type && !VALID_INTEGRATION_TYPES.includes(int.integration_type)) {
        const fixed = fixIntegrationType(int.integration_type);
        if (fixed !== int.integration_type) {
          int.integration_type = fixed;
          intModified = true;
        }
      }

      if (intModified) {
        modified = true;
        fixes.push(`integrations[${i}] fixed`);
      }

      return int;
    });
  }

  // Fix pricing
  if (tool.pricing) {
    // Fix quote_required
    if (tool.pricing.quote_required !== undefined && typeof tool.pricing.quote_required !== 'boolean') {
      tool.pricing.quote_required = tool.pricing.quote_required === "true" || tool.pricing.quote_required === true;
      fixes.push("pricing.quote_required → boolean");
      modified = true;
    }

    // Fix free_tier
    if (tool.pricing.free_tier !== undefined && typeof tool.pricing.free_tier !== 'boolean') {
      tool.pricing.free_tier = tool.pricing.free_tier === "true" || tool.pricing.free_tier === true;
      fixes.push("pricing.free_tier → boolean");
      modified = true;
    }

    // Fix price_range
    if (tool.pricing.price_range && !VALID_PRICE_RANGES.includes(tool.pricing.price_range)) {
      const fixed = fixPriceRange(tool.pricing.price_range);
      if (fixed) {
        tool.pricing.price_range = fixed;
      } else {
        delete tool.pricing.price_range;
      }
      fixes.push("pricing.price_range fixed");
      modified = true;
    }
  }

  // Fix SEO canonical_url
  if (tool.seo?.canonical_url) {
    const pattern = /^https:\/\/heypsych\.com\/tools\/for-clinicians\/[\w-]+\/$/;
    if (!pattern.test(tool.seo.canonical_url)) {
      tool.seo.canonical_url = fixCanonicalUrl(tool.seo.canonical_url, tool.slug);
      fixes.push("seo.canonical_url fixed");
      modified = true;
    }
  }

  // Fix compliance.fedramp
  if (tool.compliance?.fedramp !== undefined) {
    if (tool.compliance.fedramp === "true" || tool.compliance.fedramp === true) {
      tool.compliance.fedramp = "yes";
      fixes.push("compliance.fedramp → yes");
      modified = true;
    } else if (tool.compliance.fedramp === "false" || tool.compliance.fedramp === false) {
      tool.compliance.fedramp = "no";
      fixes.push("compliance.fedramp → no");
      modified = true;
    }
  }

  // Fix compliance.iso27001
  if (tool.compliance?.iso27001 !== undefined) {
    if (tool.compliance.iso27001 === "true" || tool.compliance.iso27001 === true) {
      tool.compliance.iso27001 = "yes";
      fixes.push("compliance.iso27001 → yes");
      modified = true;
    } else if (tool.compliance.iso27001 === "false" || tool.compliance.iso27001 === false) {
      tool.compliance.iso27001 = "no";
      fixes.push("compliance.iso27001 → no");
      modified = true;
    }
  }

  // Update timestamp
  if (modified) {
    tool.updated_at = new Date().toISOString();
  }

  return { tool, modified, fixes };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('================================================================');
  console.log('FIX REMAINING ISSUES');
  console.log('================================================================\n');

  let totalFiles = 0;
  let totalFixed = 0;
  let totalErrors = 0;

  const subdirs = await readdir(PRODUCTS_DIR);

  for (const subdir of subdirs.sort()) {
    const subdirPath = join(PRODUCTS_DIR, subdir);
    let dirFixed = 0;

    try {
      const files = (await readdir(subdirPath)).filter(f => f.endsWith('.json'));

      for (const file of files) {
        totalFiles++;
        const filePath = join(subdirPath, file);

        try {
          const content = await readFile(filePath, 'utf-8');
          const tool = JSON.parse(content);

          const { tool: fixedTool, modified, fixes } = fixTool(tool);

          if (modified) {
            await writeFile(filePath, JSON.stringify(fixedTool, null, 2) + '\n');
            totalFixed++;
            dirFixed++;
            console.log(`  ${subdir}/${file}: ${fixes.join(', ')}`);
          }

        } catch (err) {
          console.error(`  Error: ${file}: ${err.message}`);
          totalErrors++;
        }
      }

    } catch (err) {
      // Directory doesn't exist
    }
  }

  console.log('\n================================================================');
  console.log('SUMMARY');
  console.log('================================================================');
  console.log(`Total files: ${totalFiles}`);
  console.log(`Files fixed: ${totalFixed}`);
  console.log(`Errors: ${totalErrors}`);
  console.log('================================================================\n');
}

main().catch(console.error);
