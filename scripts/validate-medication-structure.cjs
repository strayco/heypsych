#!/usr/bin/env node
/**
 * Validate medication JSON files against v2 structure
 * Compares each file to alprazolam-Xanax-v2.json structure
 */

const fs = require('fs');
const path = require('path');

const MEDICATIONS_DIR = path.join(__dirname, '../data/treatments/medications');
const V2_REFERENCE = path.join(MEDICATIONS_DIR, 'alprazolam-Xanax-v2.json');

// Load v2 reference
const v2 = JSON.parse(fs.readFileSync(V2_REFERENCE, 'utf8'));

// Expected v2 structure
const V2_SCHEMA = {
  topLevel: ['kind', 'slug', 'type', 'name', 'summary', 'description', 'patient_summary', 'category', 'metadata', 'clinical_metadata', 'sections', 'seo', 'editorial', 'faqs'],
  metadata: ['drug_classes', 'brand_names', 'administration_routes', 'prescription_status', 'controlled_substance', 'generic_available', 'fda_approval_year', 'pharmacologic_category', 'published_date', 'last_updated', 'medical_review'],
  clinical_metadata: ['primary_indications', 'linked_conditions', 'contraindications', 'efficacy_response', 'pharmacokinetics'],
  seo: ['title', 'description', 'canonical', 'no_index'],
  editorial: ['medicalReviewerIds', 'reviewBoard', 'lastReviewed', 'lastUpdated', 'reviewStatement'],

  // Fields that should NOT exist
  forbidden: ['tags', 'search_metadata'],

  // brand_names should be array, not object
  brandNamesType: 'array'
};

function analyzeFile(filePath) {
  const issues = [];
  const fileName = path.basename(filePath);

  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Check for forbidden fields
    V2_SCHEMA.forbidden.forEach(field => {
      if (content[field] !== undefined) {
        issues.push(`❌ Has forbidden field: "${field}" (should be removed)`);
      }
    });

    // Check top-level fields
    V2_SCHEMA.topLevel.forEach(field => {
      if (content[field] === undefined) {
        issues.push(`⚠️  Missing top-level field: "${field}"`);
      }
    });

    // Check metadata structure
    if (content.metadata) {
      // Check brand_names type
      if (content.metadata.brand_names) {
        if (!Array.isArray(content.metadata.brand_names)) {
          issues.push(`❌ metadata.brand_names is ${typeof content.metadata.brand_names}, should be array`);
        }
      } else {
        issues.push(`⚠️  Missing metadata.brand_names`);
      }

      // Check other metadata fields
      V2_SCHEMA.metadata.forEach(field => {
        if (field !== 'brand_names' && content.metadata[field] === undefined) {
          issues.push(`⚠️  Missing metadata.${field}`);
        }
      });
    } else {
      issues.push(`❌ Missing metadata object`);
    }

    // Check clinical_metadata
    if (content.clinical_metadata) {
      V2_SCHEMA.clinical_metadata.forEach(field => {
        if (content.clinical_metadata[field] === undefined) {
          issues.push(`⚠️  Missing clinical_metadata.${field}`);
        }
      });
    } else {
      issues.push(`❌ Missing clinical_metadata object`);
    }

    // Check seo
    if (content.seo) {
      V2_SCHEMA.seo.forEach(field => {
        if (content.seo[field] === undefined) {
          issues.push(`⚠️  Missing seo.${field}`);
        }
      });
    } else {
      issues.push(`❌ Missing seo object`);
    }

    // Check editorial
    if (content.editorial) {
      V2_SCHEMA.editorial.forEach(field => {
        if (content.editorial[field] === undefined) {
          issues.push(`⚠️  Missing editorial.${field}`);
        }
      });
    } else {
      issues.push(`❌ Missing editorial object`);
    }

    // Check faqs
    if (!content.faqs) {
      issues.push(`⚠️  Missing faqs array`);
    } else if (!Array.isArray(content.faqs)) {
      issues.push(`❌ faqs should be array, got ${typeof content.faqs}`);
    }

    // Check sections
    if (!content.sections) {
      issues.push(`❌ Missing sections array`);
    } else if (!Array.isArray(content.sections)) {
      issues.push(`❌ sections should be array, got ${typeof content.sections}`);
    }

  } catch (error) {
    issues.push(`💥 Failed to parse JSON: ${error.message}`);
  }

  return { fileName, issues };
}

function main() {
  const args = process.argv.slice(2);
  const startLetter = args[0] || 'a';
  const endLetter = args[1] || 'b';

  console.log(`\n🔍 Validating medication files from ${startLetter.toUpperCase()} to ${endLetter.toUpperCase()}...\n`);

  const files = fs.readdirSync(MEDICATIONS_DIR)
    .filter(f => f.endsWith('.json') && !f.includes('legacy'))
    .sort()
    .filter(f => {
      const first = f.charAt(0).toLowerCase();
      return first >= startLetter.toLowerCase() && first <= endLetter.toLowerCase();
    })
    .map(f => path.join(MEDICATIONS_DIR, f));

  console.log(`Found ${files.length} files to validate\n`);

  const results = files.map(analyzeFile);

  // Summary
  const filesWithIssues = results.filter(r => r.issues.length > 0);
  const cleanFiles = results.filter(r => r.issues.length === 0);

  // Print clean files
  if (cleanFiles.length > 0) {
    console.log(`✅ CLEAN FILES (${cleanFiles.length}):`);
    cleanFiles.forEach(r => console.log(`   ✓ ${r.fileName}`));
    console.log();
  }

  // Print files with issues
  if (filesWithIssues.length > 0) {
    console.log(`⚠️  FILES WITH ISSUES (${filesWithIssues.length}):\n`);
    filesWithIssues.forEach(result => {
      console.log(`📄 ${result.fileName}`);
      result.issues.forEach(issue => console.log(`   ${issue}`));
      console.log();
    });
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`);
  console.log(`SUMMARY:`);
  console.log(`  Total files: ${results.length}`);
  console.log(`  ✅ Clean: ${cleanFiles.length}`);
  console.log(`  ⚠️  With issues: ${filesWithIssues.length}`);
  console.log(`${'='.repeat(60)}\n`);

  process.exit(filesWithIssues.length > 0 ? 1 : 0);
}

main();
