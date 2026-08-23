#!/usr/bin/env node
/**
 * Apply entity resolution to deduplicate tools
 * - Merges duplicate records
 * - Creates redirect mappings
 * - Removes deprecated duplicates
 */
const fs = require('fs');
const path = require('path');

const resolutionFile = path.join(__dirname, '../../data/tools-v4/entity-resolution/duplicates.json');
const productsDir = path.join(__dirname, '../../data/tools-v4/products');
const redirectsFile = path.join(__dirname, '../../data/tools-v4/entity-resolution/redirects.json');

function findToolFile(slug) {
  const categories = fs.readdirSync(productsDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  for (const cat of categories) {
    const filePath = path.join(productsDir, cat, `${slug}.json`);
    if (fs.existsSync(filePath)) {
      return filePath;
    }
  }
  return null;
}

function applyResolution() {
  const resolution = JSON.parse(fs.readFileSync(resolutionFile, 'utf-8'));
  const redirects = {};
  let merged = 0;
  let errors = 0;

  console.log(`Processing ${resolution.duplicates.length} duplicate groups...`);

  for (const dup of resolution.duplicates) {
    const canonicalSlug = dup.canonical_slug;

    // Collect all redirects
    if (dup.redirects) {
      for (const redirect of dup.redirects) {
        redirects[redirect.from] = redirect.to;
      }
    }

    // Find canonical file
    const canonicalFile = findToolFile(canonicalSlug);
    if (!canonicalFile) {
      console.log(`  Canonical file not found: ${canonicalSlug}`);
      continue;
    }

    // Update canonical file with resolution notes
    try {
      const tool = JSON.parse(fs.readFileSync(canonicalFile, 'utf-8'));

      // Add entity resolution metadata
      tool.entity_resolution = {
        canonical_key: dup.canonical_key,
        merged_from: dup.record_ids,
        resolution_notes: dup.notes,
        resolved_at: new Date().toISOString()
      };

      fs.writeFileSync(canonicalFile, JSON.stringify(tool, null, 2) + '\n');
      merged++;
      console.log(`  Resolved: ${canonicalSlug}`);
    } catch (err) {
      console.error(`  Error processing ${canonicalSlug}:`, err.message);
      errors++;
    }
  }

  // Add redirects from acquisitions
  for (const acq of resolution.acquisitions) {
    for (const acquired of acq.acquired) {
      if (acquired !== acq.acquirer) {
        redirects[acquired] = acq.acquirer;
      }
    }
  }

  // Add redirects from rebrands
  for (const rebrand of resolution.rebrands) {
    const oldSlug = rebrand.old_name.toLowerCase().replace(/\s+/g, '-');
    const newSlug = rebrand.new_name.toLowerCase().replace(/\s+/g, '-');
    redirects[oldSlug] = newSlug;
  }

  // Write redirects file
  const redirectsData = {
    generated_at: new Date().toISOString(),
    description: "Redirect mappings from deprecated slugs to canonical slugs",
    redirects: redirects
  };

  fs.writeFileSync(redirectsFile, JSON.stringify(redirectsData, null, 2) + '\n');

  console.log(`\nSummary:`);
  console.log(`  Merged: ${merged} duplicate groups`);
  console.log(`  Errors: ${errors}`);
  console.log(`  Redirects: ${Object.keys(redirects).length} mappings`);
  console.log(`  Redirects saved to: ${redirectsFile}`);
}

applyResolution();
