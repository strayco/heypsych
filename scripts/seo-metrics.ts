#!/usr/bin/env tsx

/**
 * SEO Metrics CLI
 *
 * Generates and displays SEO health metrics.
 * Usage: npm run seo:metrics [--json] [--output=file.json]
 */

import { getSEOMetricsEngine } from '../src/lib/seo/metrics';
import * as fs from 'fs';
import * as path from 'path';

// Parse command line arguments
const args = process.argv.slice(2);
const jsonOnly = args.includes('--json');
const outputArg = args.find((arg) => arg.startsWith('--output='));
const outputFile = outputArg ? outputArg.split('=')[1] : null;

async function main() {
  console.log('🔍 SEO Metrics Analysis\n');

  const engine = getSEOMetricsEngine();
  const report = await engine.generateReport();

  // Save JSON if requested
  if (outputFile) {
    const outputPath = path.resolve(process.cwd(), outputFile);
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`✅ Report saved to: ${outputPath}\n`);
  }

  // Output JSON to stdout if requested
  if (jsonOnly) {
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.summary.issues_count > 0 ? 1 : 0);
  }

  // Human-readable output
  printHumanReadableReport(report);

  // Exit with error code if issues found
  process.exit(report.summary.issues_count > 0 ? 1 : 0);
}

function printHumanReadableReport(report: any) {
  const { summary, metadata, schema, links, eat, clusters, broken_links, issues, warnings } = report;

  // Summary
  console.log('📊 SUMMARY');
  console.log('═'.repeat(80));
  console.log(`Total Pages:    ${summary.total_pages}`);
  console.log(`Health Score:   ${summary.health_score}/100 ${getHealthEmoji(summary.health_score)}`);
  console.log(`Issues:         ${summary.issues_count} ${summary.issues_count === 0 ? '✅' : '❌'}`);
  console.log(`Warnings:       ${summary.warnings_count} ${summary.warnings_count === 0 ? '✅' : '⚠️'}`);
  console.log('');

  // Metadata Coverage
  console.log('📝 METADATA COVERAGE');
  console.log('─'.repeat(80));
  printCoverageRow('Title', metadata.with_title, metadata.total_pages, metadata.coverage_percentage.title);
  printCoverageRow('Description', metadata.with_description, metadata.total_pages, metadata.coverage_percentage.description);
  printCoverageRow('OG Image', metadata.with_og_image, metadata.total_pages, metadata.coverage_percentage.og_image);
  printCoverageRow('Twitter Card', metadata.with_twitter_card, metadata.total_pages, metadata.coverage_percentage.twitter_card);
  printCoverageRow('Canonical', metadata.with_canonical, metadata.total_pages, metadata.coverage_percentage.canonical);
  printCoverageRow('Keywords', metadata.with_keywords, metadata.total_pages, metadata.coverage_percentage.keywords);
  console.log('');

  // Schema Coverage
  console.log('🏗️  SCHEMA COVERAGE');
  console.log('─'.repeat(80));
  printCoverageRow('Pages with Schema', schema.with_schema, schema.total_pages, schema.coverage_percentage);
  console.log(`Avg Schemas/Page:     ${schema.avg_schemas_per_page.toFixed(2)}`);
  console.log('Schema Types:');
  Object.entries(schema.schema_types).forEach(([type, count]) => {
    console.log(`  • ${type}: ${count}`);
  });
  console.log('');

  // Link Coverage
  console.log('🔗 INTERNAL LINKS');
  console.log('─'.repeat(80));
  console.log(`Total Links:          ${links.total_internal_links}`);
  console.log(`Avg Links/Page:       ${links.avg_links_per_page.toFixed(1)}`);
  console.log(`Pages w/ Min Links:   ${links.pages_with_min_links}/${links.total_pages}`);
  console.log(`Orphan Pages:         ${links.orphan_pages} ${links.orphan_pages === 0 ? '✅' : '❌'}`);
  console.log(`Distribution:`);
  console.log(`  • Min:    ${links.link_distribution.min}`);
  console.log(`  • Median: ${links.link_distribution.median}`);
  console.log(`  • Max:    ${links.link_distribution.max}`);
  console.log('');

  // E-A-T Coverage
  console.log('👨‍⚕️ E-A-T COVERAGE');
  console.log('─'.repeat(80));
  printCoverageRow('Author', eat.with_author, eat.total_pages, eat.coverage_percentage.author);
  printCoverageRow('Medical Reviewer', eat.with_medical_reviewer, eat.total_pages, eat.coverage_percentage.medical_reviewer);
  printCoverageRow('Review Date', eat.with_review_date, eat.total_pages, eat.coverage_percentage.review_date);
  printCoverageRow('Published Date', eat.with_published_date, eat.total_pages, eat.coverage_percentage.published_date);
  printCoverageRow('Updated Date', eat.with_updated_date, eat.total_pages, eat.coverage_percentage.updated_date);
  console.log('');

  // Cluster Coverage
  console.log('🗂️  CONTENT CLUSTERS');
  console.log('─'.repeat(80));
  console.log(`Total Clusters:       ${clusters.total_clusters}`);
  console.log(`Clustered Entities:   ${clusters.clustered_entities}/${clusters.total_entities} (${clusters.coverage_percentage.toFixed(1)}%)`);
  console.log(`Orphan Entities:      ${clusters.orphan_entities}`);
  console.log(`Avg Cluster Size:     ${clusters.avg_cluster_size.toFixed(1)}`);
  console.log(`Avg Strength:         ${clusters.avg_cluster_strength.toFixed(1)}/100`);
  console.log('Clusters by Category:');
  Object.entries(clusters.clusters_by_category).forEach(([category, count]) => {
    console.log(`  • ${category}: ${count}`);
  });
  console.log('');

  // Broken Links
  console.log('🔴 BROKEN LINKS');
  console.log('─'.repeat(80));
  console.log(`Total Links Checked:  ${broken_links.total_links_checked}`);
  console.log(`Broken Links:         ${broken_links.broken_count} ${broken_links.broken_count === 0 ? '✅' : '❌'}`);
  if (broken_links.broken_count > 0 && broken_links.broken_count <= 10) {
    console.log('First 10 broken links:');
    broken_links.broken_links.slice(0, 10).forEach((link: any) => {
      console.log(`  • ${link.source_page} → ${link.target_slug} (${link.link_type})`);
    });
  }
  console.log('');

  // Issues
  if (issues.length > 0) {
    console.log('❌ ISSUES (must fix)');
    console.log('─'.repeat(80));
    issues.forEach((issue: string) => {
      console.log(`  • ${issue}`);
    });
    console.log('');
  }

  // Warnings
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS (should fix)');
    console.log('─'.repeat(80));
    warnings.forEach((warning: string) => {
      console.log(`  • ${warning}`);
    });
    console.log('');
  }

  // Final status
  console.log('═'.repeat(80));
  if (summary.issues_count === 0) {
    console.log('✅ All checks passed! SEO health is good.');
  } else {
    console.log(`❌ Found ${summary.issues_count} issue(s) that must be fixed.`);
  }
  console.log('');
}

function printCoverageRow(label: string, count: number, total: number, percentage: number) {
  const status = percentage === 100 ? '✅' : percentage >= 90 ? '⚠️' : '❌';
  const paddedLabel = label.padEnd(20);
  console.log(`${paddedLabel} ${count.toString().padStart(4)}/${total.toString().padEnd(4)} (${percentage.toFixed(1).padStart(5)}%) ${status}`);
}

function getHealthEmoji(score: number): string {
  if (score >= 90) return '🟢';
  if (score >= 70) return '🟡';
  if (score >= 50) return '🟠';
  return '🔴';
}

// Run
main().catch((error) => {
  console.error('❌ Error generating metrics:', error);
  process.exit(1);
});
