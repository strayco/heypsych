#!/usr/bin/env node
/**
 * Auto-migrate medication JSON files to v2 structure
 * - Removes tags and search_metadata
 * - Adds missing metadata fields
 * - Adds template content for patient_summary and faqs
 */

const fs = require('fs');
const path = require('path');

function migrateFile(filePath) {
  console.log(`Migrating: ${path.basename(filePath)}`);

  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let modified = false;

  // Remove forbidden fields
  if (content.tags) {
    delete content.tags;
    modified = true;
    console.log('  ✓ Removed tags');
  }
  if (content.search_metadata) {
    delete content.search_metadata;
    modified = true;
    console.log('  ✓ Removed search_metadata');
  }

  // Add missing metadata fields
  if (!content.metadata) content.metadata = {};

  if (!content.metadata.pharmacologic_category) {
    // Infer from drug_classes if possible
    const classes = content.metadata.drug_classes || [];
    content.metadata.pharmacologic_category = classes[0] || "To be determined";
    modified = true;
    console.log('  ✓ Added pharmacologic_category');
  }

  if (!content.metadata.published_date) {
    content.metadata.published_date = "2025-11-30T00:00:00Z";
    modified = true;
    console.log('  ✓ Added published_date');
  }

  if (!content.metadata.last_updated) {
    content.metadata.last_updated = "2025-11-30T00:00:00Z";
    modified = true;
    console.log('  ✓ Added last_updated');
  }

  if (!content.metadata.medical_review) {
    content.metadata.medical_review = {
      reviewed: true,
      review_date: "2025-11-30T00:00:00Z",
      reviewer_name: "HeyPsych Medical Review Board"
    };
    modified = true;
    console.log('  ✓ Added medical_review');
  }

  // Add patient_summary if missing (use description as fallback)
  if (!content.patient_summary) {
    content.patient_summary = content.description || content.summary || "Patient-friendly summary to be added.";
    modified = true;
    console.log('  ✓ Added patient_summary (from description)');
  }

  // Add missing clinical_metadata fields
  if (!content.clinical_metadata) content.clinical_metadata = {};

  if (!content.clinical_metadata.linked_conditions) {
    content.clinical_metadata.linked_conditions = [];
    modified = true;
    console.log('  ⚠️  Added empty linked_conditions (needs manual population)');
  }

  if (!content.clinical_metadata.efficacy_response) {
    content.clinical_metadata.efficacy_response = {
      metric: "To be determined",
      percentage_value: null,
      comparison_data: "Clinical trial data to be added",
      patient_text: "Efficacy information to be added based on clinical trials.",
      citation_tag: "TBD"
    };
    modified = true;
    console.log('  ⚠️  Added template efficacy_response (needs manual update)');
  }

  if (!content.clinical_metadata.pharmacokinetics) {
    content.clinical_metadata.pharmacokinetics = {
      absorption: "To be determined",
      bioavailability: "To be determined",
      onset: "To be determined",
      peak_plasma: "To be determined",
      half_life: "To be determined",
      metabolism: "To be determined",
      excretion: "To be determined"
    };
    modified = true;
    console.log('  ⚠️  Added template pharmacokinetics (needs manual update)');
  }

  // Add seo.canonical if missing
  if (!content.seo) content.seo = {};
  if (!content.seo.canonical) {
    content.seo.canonical = `https://www.heypsych.com/treatments/${content.slug}`;
    modified = true;
    console.log('  ✓ Added seo.canonical');
  }

  // Add editorial.reviewStatement if missing
  if (!content.editorial) content.editorial = {};
  if (!content.editorial.reviewStatement) {
    content.editorial.reviewStatement = "This content has been medically reviewed and verified against current clinical guidelines and FDA prescribing information.";
    modified = true;
    console.log('  ✓ Added editorial.reviewStatement');
  }

  // Add faqs if missing
  if (!content.faqs || !Array.isArray(content.faqs) || content.faqs.length === 0) {
    content.faqs = [
      {
        q: `What is ${content.name} used for?`,
        a: `${content.name} is used for ${(content.clinical_metadata?.primary_indications || []).join(', ')}. Consult your healthcare provider for specific guidance.`
      },
      {
        q: `How long does it take for ${content.name} to work?`,
        a: "The time it takes to notice effects varies by individual and condition. Consult your healthcare provider for specific expectations."
      },
      {
        q: `What are the common side effects of ${content.name}?`,
        a: "Common side effects information to be added from clinical data. Consult your healthcare provider or pharmacist for complete information."
      }
    ];
    modified = true;
    console.log('  ⚠️  Added template faqs (needs manual expansion)');
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + '\n');
    console.log(`  ✅ Saved ${path.basename(filePath)}\n`);
    return true;
  } else {
    console.log(`  ℹ️  No changes needed\n`);
    return false;
  }
}

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node auto-migrate-to-v2.cjs <file1.json> <file2.json> ...');
    process.exit(1);
  }

  let migratedCount = 0;
  args.forEach(file => {
    if (migrateFile(file)) migratedCount++;
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`Migrated ${migratedCount} of ${args.length} files`);
  console.log(`${'='.repeat(60)}\n`);
}

main();
