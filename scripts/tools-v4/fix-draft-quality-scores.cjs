#!/usr/bin/env node
/**
 * Fix data quality scores on draft tools
 * Draft tools should have score 30-40, not 98
 */
const fs = require('fs');
const path = require('path');

const productsDir = path.join(__dirname, '../../data/tools-v4/products');

function walkDir(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (item.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

function fixQualityScores() {
  const files = walkDir(productsDir);
  let fixed = 0;
  let skipped = 0;

  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const tool = JSON.parse(content);

      // Only fix draft tools with misleadingly high scores
      if (tool.status === 'draft' && tool.governance?.data_quality_score > 50) {
        // Calculate actual quality based on completeness
        let score = 30; // Base score for drafts

        // Add points for filled fields
        if (tool.short_description) score += 5;
        if (tool.long_description) score += 5;
        if (tool.capabilities?.length > 0) score += 5;
        if (tool.pricing?.starting_price_cents) score += 5;
        if (tool.integrations?.length > 0) score += 5;
        if (tool.company_info?.founded_year) score += 5;
        if (tool.seo?.faqs?.length > 2) score += 5;
        if (tool.compliance?.hipaa_support === true) score += 5;

        // Cap draft score at 60
        score = Math.min(score, 60);

        tool.governance.data_quality_score = score;
        tool.governance.needs_review = true;
        tool.governance.review_priority = score < 40 ? 'high' : 'medium';

        fs.writeFileSync(filePath, JSON.stringify(tool, null, 2) + '\n');
        fixed++;
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`Error processing ${filePath}:`, err.message);
    }
  }

  console.log(`Fixed ${fixed} draft tools, skipped ${skipped} (already correct or not draft)`);
}

fixQualityScores();
