#!/usr/bin/env node

/**
 * Resources Audit Script
 *
 * Generates a detailed audit report of resources data:
 * - Category distribution
 * - Orphaned resources (no category)
 * - Missing fields
 * - SEO issues
 * - Crosslink opportunities
 *
 * This is informational only (does not fail build).
 *
 * Usage:
 *   node scripts/audit-resources.js
 *   npm run audit:resources
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DATA_DIR = path.join(__dirname, '..', 'data', 'resources');
const INDEX_FILE = path.join(__dirname, '..', 'public', 'resources-index.json');
const OUTPUT_FILE = path.join(__dirname, '..', 'RESOURCES_AUDIT_REPORT.md');

// Audit data
const audit = {
  totalFiles: 0,
  byCategory: {},
  orphaned: [],
  missingDescription: [],
  missingMetadata: [],
  longTitles: [],
  noCrosslinks: [],
  hasCrosslinks: [],
  withFAQs: [],
  withSections: [],
  categorySlugs: new Set()
};

// Helper functions
function readJsonFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    console.error(`Failed to read ${filePath}: ${err.message}`);
    return null;
  }
}

function getAllResourceFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllResourceFiles(filePath, fileList);
    } else if (file.endsWith('.json') && file !== 'index.json' && file !== 'README.md') {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Audit functions
function auditResource(file) {
  const data = readJsonFile(file);
  if (!data) return;

  const relativePath = path.relative(DATA_DIR, file);
  audit.totalFiles++;

  const category = data.metadata?.category || 'unknown';
  audit.categorySlugs.add(category);

  // Category distribution
  if (!audit.byCategory[category]) {
    audit.byCategory[category] = [];
  }
  audit.byCategory[category].push({
    slug: data.slug,
    name: data.name,
    path: relativePath,
    status: data.status
  });

  // Orphaned resources
  if (!data.metadata?.category) {
    audit.orphaned.push({
      slug: data.slug,
      name: data.name,
      path: relativePath
    });
  }

  // Missing description/summary
  if (!data.description && !data.summary) {
    audit.missingDescription.push({
      slug: data.slug,
      name: data.name,
      path: relativePath
    });
  }

  // Missing metadata fields
  const metadataFields = ['category', 'resourceType'];
  const missingFields = metadataFields.filter(field => !data.metadata?.[field]);

  if (missingFields.length > 0) {
    audit.missingMetadata.push({
      slug: data.slug,
      name: data.name,
      path: relativePath,
      missing: missingFields
    });
  }

  // Long titles (SEO issue)
  if (data.seo?.title && data.seo.title.length > 60) {
    audit.longTitles.push({
      slug: data.slug,
      title: data.seo.title,
      length: data.seo.title.length,
      path: relativePath
    });
  }

  // Crosslink analysis
  const hasCrosslinks = !!(
    data.relatedConditionSlugs?.length ||
    data.relatedMedicationSlugs?.length ||
    data.relatedResourceSlugs?.length
  );

  if (hasCrosslinks) {
    audit.hasCrosslinks.push({
      slug: data.slug,
      name: data.name,
      conditions: data.relatedConditionSlugs?.length || 0,
      medications: data.relatedMedicationSlugs?.length || 0,
      resources: data.relatedResourceSlugs?.length || 0
    });
  } else {
    audit.noCrosslinks.push({
      slug: data.slug,
      name: data.name,
      path: relativePath
    });
  }

  // Content richness
  if (data.faqs?.length > 0) {
    audit.withFAQs.push({
      slug: data.slug,
      name: data.name,
      count: data.faqs.length
    });
  }

  if (data.sections?.length > 0) {
    audit.withSections.push({
      slug: data.slug,
      name: data.name,
      count: data.sections.length
    });
  }
}

// Generate report
function generateReport() {
  const lines = [];

  lines.push('# Resources Audit Report');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');

  // Overview
  lines.push('## Overview');
  lines.push('');
  lines.push(`- **Total Resources:** ${audit.totalFiles}`);
  lines.push(`- **Categories:** ${audit.categorySlugs.size}`);
  lines.push(`- **Orphaned (no category):** ${audit.orphaned.length}`);
  lines.push(`- **With Crosslinks:** ${audit.hasCrosslinks.length} (${Math.round(audit.hasCrosslinks.length / audit.totalFiles * 100)}%)`);
  lines.push(`- **With FAQs:** ${audit.withFAQs.length} (${Math.round(audit.withFAQs.length / audit.totalFiles * 100)}%)`);
  lines.push(`- **With Sections:** ${audit.withSections.length} (${Math.round(audit.withSections.length / audit.totalFiles * 100)}%)`);
  lines.push('');

  // Category distribution
  lines.push('## Category Distribution');
  lines.push('');
  lines.push('| Category | Count | Active | Draft | Archived |');
  lines.push('|----------|-------|--------|-------|----------|');

  Object.keys(audit.byCategory).sort().forEach(category => {
    const resources = audit.byCategory[category];
    const active = resources.filter(r => r.status === 'active').length;
    const draft = resources.filter(r => r.status === 'draft').length;
    const archived = resources.filter(r => r.status === 'archived').length;

    lines.push(`| ${category} | ${resources.length} | ${active} | ${draft} | ${archived} |`);
  });
  lines.push('');

  // Orphaned resources
  if (audit.orphaned.length > 0) {
    lines.push('## ⚠️ Orphaned Resources (No Category)');
    lines.push('');
    lines.push('These resources are missing `metadata.category` and will not appear on any category page:');
    lines.push('');
    audit.orphaned.forEach(r => {
      lines.push(`- **${r.name}** (${r.slug})`);
      lines.push(`  - Path: \`${r.path}\``);
    });
    lines.push('');
  }

  // Missing description
  if (audit.missingDescription.length > 0) {
    lines.push('## ⚠️ Missing Description/Summary');
    lines.push('');
    lines.push('These resources lack both `description` and `summary` fields (bad for SEO):');
    lines.push('');
    audit.missingDescription.forEach(r => {
      lines.push(`- **${r.name}** (${r.slug})`);
    });
    lines.push('');
  }

  // Missing metadata
  if (audit.missingMetadata.length > 0) {
    lines.push('## ⚠️ Missing Metadata Fields');
    lines.push('');
    audit.missingMetadata.forEach(r => {
      lines.push(`- **${r.name}** (${r.slug})`);
      lines.push(`  - Missing: ${r.missing.join(', ')}`);
    });
    lines.push('');
  }

  // Long SEO titles
  if (audit.longTitles.length > 0) {
    lines.push('## ⚠️ Long SEO Titles (>60 chars)');
    lines.push('');
    audit.longTitles.forEach(r => {
      lines.push(`- **${r.slug}** (${r.length} chars)`);
      lines.push(`  - Title: "${r.title}"`);
    });
    lines.push('');
  }

  // No crosslinks
  if (audit.noCrosslinks.length > 0) {
    lines.push('## 💡 Resources Without Crosslinks');
    lines.push('');
    lines.push(`${audit.noCrosslinks.length} resources have no crosslinks to conditions, medications, or other resources:`);
    lines.push('');
    audit.noCrosslinks.forEach(r => {
      lines.push(`- **${r.name}** (${r.slug})`);
    });
    lines.push('');
  }

  // Crosslink leaders
  if (audit.hasCrosslinks.length > 0) {
    lines.push('## ✅ Resources With Crosslinks');
    lines.push('');
    lines.push('| Resource | Conditions | Medications | Resources |');
    lines.push('|----------|-----------|------------|-----------|');

    audit.hasCrosslinks
      .sort((a, b) => (b.conditions + b.medications + b.resources) - (a.conditions + a.medications + a.resources))
      .forEach(r => {
        lines.push(`| ${r.name} | ${r.conditions} | ${r.medications} | ${r.resources} |`);
      });
    lines.push('');
  }

  // Content richness
  lines.push('## 📊 Content Richness');
  lines.push('');

  if (audit.withFAQs.length > 0) {
    lines.push('### Resources with FAQs');
    lines.push('');
    audit.withFAQs
      .sort((a, b) => b.count - a.count)
      .forEach(r => {
        lines.push(`- **${r.name}** (${r.count} FAQs)`);
      });
    lines.push('');
  }

  if (audit.withSections.length > 0) {
    lines.push('### Resources with Structured Sections');
    lines.push('');
    audit.withSections
      .sort((a, b) => b.count - a.count)
      .forEach(r => {
        lines.push(`- **${r.name}** (${r.count} sections)`);
      });
    lines.push('');
  }

  // Recommendations
  lines.push('## 🎯 Recommendations');
  lines.push('');

  if (audit.orphaned.length > 0) {
    lines.push(`1. **Fix ${audit.orphaned.length} orphaned resources:** Add \`metadata.category\` to all resources without categories`);
  }

  if (audit.missingDescription.length > 0) {
    lines.push(`2. **Add descriptions:** ${audit.missingDescription.length} resources need \`description\` or \`summary\` for SEO`);
  }

  const crosslinkCoverage = Math.round(audit.hasCrosslinks.length / audit.totalFiles * 100);
  if (crosslinkCoverage < 50) {
    lines.push(`3. **Improve crosslinking:** Only ${crosslinkCoverage}% of resources have crosslinks. Target: 80%+`);
  }

  const faqCoverage = Math.round(audit.withFAQs.length / audit.totalFiles * 100);
  if (faqCoverage < 30) {
    lines.push(`4. **Add FAQs:** Only ${faqCoverage}% of resources have FAQs. Consider adding to top resources`);
  }

  if (audit.longTitles.length > 0) {
    lines.push(`5. **Shorten SEO titles:** ${audit.longTitles.length} resources have titles >60 chars (will be truncated in SERPs)`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('*This report is informational only and does not fail the build. Run `npm run validate:resources` for build-blocking validation.*');

  return lines.join('\n');
}

// Main execution
function main() {
  console.log('📊 Resources Audit Script\n');
  console.log(`Data directory: ${DATA_DIR}`);
  console.log(`Output file: ${OUTPUT_FILE}\n`);

  // Get all resource files
  const files = getAllResourceFiles(DATA_DIR);
  console.log(`Found ${files.length} resource files\n`);

  // Audit each file
  files.forEach(auditResource);

  // Generate report
  const report = generateReport();
  fs.writeFileSync(OUTPUT_FILE, report);

  console.log(`✅ Audit complete!`);
  console.log(`📄 Report written to: ${OUTPUT_FILE}\n`);

  // Print summary
  console.log('📊 Quick Summary:');
  console.log(`   Total: ${audit.totalFiles}`);
  console.log(`   Categories: ${audit.categorySlugs.size}`);
  console.log(`   Orphaned: ${audit.orphaned.length}`);
  console.log(`   With crosslinks: ${audit.hasCrosslinks.length} (${Math.round(audit.hasCrosslinks.length / audit.totalFiles * 100)}%)`);
  console.log(`   With FAQs: ${audit.withFAQs.length} (${Math.round(audit.withFAQs.length / audit.totalFiles * 100)}%)\n`);

  if (audit.orphaned.length > 0 || audit.missingDescription.length > 0) {
    console.log('⚠️  Action required - see report for details');
  } else {
    console.log('✅ No critical issues found');
  }
}

main();
