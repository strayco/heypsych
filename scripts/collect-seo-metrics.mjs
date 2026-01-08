#!/usr/bin/env node
/**
 * SEO Metrics Collection Script
 * 
 * Run with: node scripts/collect-seo-metrics.mjs
 * 
 * Collects SEO health metrics across all entities and outputs a report.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Load environment variables
dotenv.config({ path: join(rootDir, '.env.local') });
dotenv.config({ path: join(rootDir, '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Load all entities from database
 */
async function loadEntities() {
  console.log('📦 Loading entities from database...');
  
  const { data, error } = await supabase
    .from('entities')
    .select('*')
    .eq('status', 'active')
    .order('type')
    .order('title');
  
  if (error) {
    console.error('❌ Error loading entities:', error);
    throw error;
  }
  
  console.log(`   Found ${data.length} active entities`);
  return data;
}

/**
 * Collect metrics for a single entity (simplified version for CLI)
 */
function collectEntityMetrics(entity) {
  const issues = [];
  
  // Determine entity type
  const entityType = entity.type || 
    entity.content?.type || 
    entity.metadata?.type || 
    'treatment';
  
  // Check title and description
  const title = entity.title || '';
  const description = entity.description || entity.content?.description || '';
  
  const hasTitle = title.length > 0;
  const hasTitleCorrectLength = title.length >= 30 && title.length <= 60;
  const hasDescription = description.length > 0;
  const hasDescriptionCorrectLength = description.length >= 70 && description.length <= 160;
  
  if (!hasTitle) issues.push('Missing title');
  if (!hasTitleCorrectLength && hasTitle) issues.push('Title length outside 30-60 chars');
  if (!hasDescription) issues.push('Missing description');
  if (!hasDescriptionCorrectLength && hasDescription) issues.push('Description length outside 70-160 chars');
  
  // Check editorial metadata
  const editorial = entity.content?.editorial || entity.metadata?.editorial || {};
  const hasReviewerIds = editorial.medicalReviewerIds && editorial.medicalReviewerIds.length > 0;
  const hasReviewBoard = editorial.reviewBoard === 'official';
  const hasReviewDate = !!editorial.lastReviewed || !!editorial.lastUpdated;
  
  if (!hasReviewerIds && !hasReviewBoard) {
    issues.push('No medical reviewer attribution');
  }
  
  // Calculate days since last review
  let daysSinceLastReview = null;
  if (editorial.lastReviewed || editorial.lastUpdated) {
    const lastReview = new Date(editorial.lastReviewed || editorial.lastUpdated);
    daysSinceLastReview = Math.floor((Date.now() - lastReview.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceLastReview > 365) {
      issues.push(`Content needs review (${daysSinceLastReview} days old)`);
    }
  }
  
  // Count internal links
  let internalLinkCount = 0;
  const contentString = JSON.stringify(entity.content || {});
  const linkMatches = contentString.match(/\{link:[^}]+\}/g);
  if (linkMatches) {
    internalLinkCount = linkMatches.length;
  }
  
  // Calculate health score
  let healthScore = 100;
  
  // Metadata penalties
  if (!hasTitle) healthScore -= 20;
  else if (!hasTitleCorrectLength) healthScore -= 5;
  if (!hasDescription) healthScore -= 15;
  else if (!hasDescriptionCorrectLength) healthScore -= 5;
  
  // E-A-T penalties
  if (!hasReviewerIds && !hasReviewBoard) healthScore -= 15;
  if (daysSinceLastReview && daysSinceLastReview > 365) healthScore -= 10;
  
  // Linking penalties
  if (internalLinkCount < 3) healthScore -= 5;
  
  healthScore = Math.max(0, healthScore);
  
  return {
    slug: entity.slug,
    entityType,
    hasTitle,
    hasTitleCorrectLength,
    hasDescription,
    hasDescriptionCorrectLength,
    hasReviewerIds,
    hasReviewBoard,
    hasReviewDate,
    daysSinceLastReview,
    internalLinkCount,
    healthScore,
    issues,
  };
}

/**
 * Calculate aggregate metrics
 */
function calculateAggregateMetrics(pageMetrics) {
  const totalPages = pageMetrics.length;
  
  if (totalPages === 0) {
    return {
      totalPages: 0,
      timestamp: new Date().toISOString(),
      averageHealthScore: 0,
      criticalIssues: [],
    };
  }
  
  // Calculate coverage percentages
  const metadataCoverage = {
    withTitle: (pageMetrics.filter(p => p.hasTitle).length / totalPages) * 100,
    withDescription: (pageMetrics.filter(p => p.hasDescription).length / totalPages) * 100,
    withTitleCorrectLength: (pageMetrics.filter(p => p.hasTitleCorrectLength).length / totalPages) * 100,
    withDescriptionCorrectLength: (pageMetrics.filter(p => p.hasDescriptionCorrectLength).length / totalPages) * 100,
  };
  
  const eatCoverage = {
    withReviewerIds: (pageMetrics.filter(p => p.hasReviewerIds).length / totalPages) * 100,
    withReviewBoard: (pageMetrics.filter(p => p.hasReviewBoard).length / totalPages) * 100,
    withReviewDate: (pageMetrics.filter(p => p.hasReviewDate).length / totalPages) * 100,
    pagesNeedingReview: pageMetrics.filter(p => 
      p.daysSinceLastReview !== null && p.daysSinceLastReview > 365
    ).length,
  };
  
  // Calculate average links per page
  const avgLinksPerPage = pageMetrics.reduce((sum, p) => sum + p.internalLinkCount, 0) / totalPages;
  
  // Calculate health by type
  const healthByType = {};
  const countByType = {};
  for (const p of pageMetrics) {
    if (!healthByType[p.entityType]) {
      healthByType[p.entityType] = 0;
      countByType[p.entityType] = 0;
    }
    healthByType[p.entityType] += p.healthScore;
    countByType[p.entityType]++;
  }
  
  for (const type of Object.keys(healthByType)) {
    healthByType[type] = healthByType[type] / countByType[type];
  }
  
  // Collect critical issues
  const issueCounts = {};
  for (const p of pageMetrics) {
    for (const issue of p.issues) {
      issueCounts[issue] = (issueCounts[issue] || 0) + 1;
    }
  }
  
  const criticalIssues = Object.entries(issueCounts)
    .filter(([_, count]) => count > totalPages * 0.05) // Issues affecting >5% of pages
    .sort((a, b) => b[1] - a[1])
    .map(([issue, count]) => `${issue} (${count} pages, ${((count / totalPages) * 100).toFixed(1)}%)`);
  
  return {
    totalPages,
    timestamp: new Date().toISOString(),
    metadataCoverage,
    eatCoverage,
    avgLinksPerPage,
    healthByType,
    countByType,
    averageHealthScore: pageMetrics.reduce((sum, p) => sum + p.healthScore, 0) / totalPages,
    criticalIssues,
  };
}

/**
 * Format and print metrics report
 */
function printReport(metrics) {
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    SEO HEALTH REPORT');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log(`📊 Total Pages Analyzed: ${metrics.totalPages}`);
  console.log(`⏰ Generated: ${new Date(metrics.timestamp).toLocaleString()}`);
  console.log('');
  console.log('📝 METADATA COVERAGE');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  ✅ With Title:              ${metrics.metadataCoverage.withTitle.toFixed(1)}%`);
  console.log(`  ✅ Title Correct Length:    ${metrics.metadataCoverage.withTitleCorrectLength.toFixed(1)}%`);
  console.log(`  ✅ With Description:        ${metrics.metadataCoverage.withDescription.toFixed(1)}%`);
  console.log(`  ✅ Desc Correct Length:     ${metrics.metadataCoverage.withDescriptionCorrectLength.toFixed(1)}%`);
  console.log('');
  console.log('🏆 E-A-T COMPLIANCE');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  ✅ With Reviewer IDs:       ${metrics.eatCoverage.withReviewerIds.toFixed(1)}%`);
  console.log(`  ✅ With Review Board:       ${metrics.eatCoverage.withReviewBoard.toFixed(1)}%`);
  console.log(`  ✅ With Review Date:        ${metrics.eatCoverage.withReviewDate.toFixed(1)}%`);
  console.log(`  ⚠️  Needs Review (>365d):   ${metrics.eatCoverage.pagesNeedingReview} pages`);
  console.log('');
  console.log('🔗 INTERNAL LINKING');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  📈 Avg Links/Page:          ${metrics.avgLinksPerPage.toFixed(1)}`);
  console.log('');
  console.log('💯 HEALTH SCORES BY TYPE');
  console.log('───────────────────────────────────────────────────────────────');
  console.log(`  Overall:                    ${metrics.averageHealthScore.toFixed(1)}/100`);
  
  for (const [type, score] of Object.entries(metrics.healthByType).sort((a, b) => b[1] - a[1])) {
    const count = metrics.countByType[type];
    console.log(`  ${type.padEnd(24)} ${score.toFixed(1)}/100  (${count} pages)`);
  }
  
  if (metrics.criticalIssues.length > 0) {
    console.log('');
    console.log('⚠️  CRITICAL ISSUES (affecting >5% of pages)');
    console.log('───────────────────────────────────────────────────────────────');
    for (const issue of metrics.criticalIssues) {
      console.log(`  ❌ ${issue}`);
    }
  }
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
}

/**
 * Main execution
 */
async function main() {
  console.log('');
  console.log('🔍 HeyPsych SEO Metrics Collection');
  console.log('───────────────────────────────────────────────────────────────');
  
  try {
    // Load entities
    const entities = await loadEntities();
    
    // Collect metrics for each entity
    console.log('📊 Collecting metrics...');
    const pageMetrics = entities.map(collectEntityMetrics);
    
    // Calculate aggregate metrics
    console.log('📈 Calculating aggregates...');
    const aggregateMetrics = calculateAggregateMetrics(pageMetrics);
    
    // Print report
    printReport(aggregateMetrics);
    
    // Save report to file
    const reportPath = join(rootDir, 'docs', 'seo-metrics-report.json');
    writeFileSync(reportPath, JSON.stringify({
      aggregate: aggregateMetrics,
      pages: pageMetrics.map(p => ({
        slug: p.slug,
        type: p.entityType,
        healthScore: p.healthScore,
        issues: p.issues,
      })),
    }, null, 2));
    console.log(`📄 Full report saved to: docs/seo-metrics-report.json`);
    
    // Exit with non-zero if health score is below threshold
    if (aggregateMetrics.averageHealthScore < 70) {
      console.log('');
      console.log('❌ SEO health score below 70 threshold - needs attention');
      process.exit(1);
    }
    
    console.log('');
    console.log('✅ SEO metrics collection complete');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();


















