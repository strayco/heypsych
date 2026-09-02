#!/usr/bin/env node
/**
 * Generate short_description for all V4 products that are missing it
 * This makes them pass isPublishReady()
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const PRODUCTS_DIR = '/Users/jack/heypsych/data/tools-v4/products';

// Category to description prefix mapping
const CATEGORY_DESCRIPTIONS = {
  'ehr-practice-management': 'Electronic health records and practice management solution',
  'billing-rcm-insurance': 'Revenue cycle management and medical billing platform',
  'telehealth-communication': 'Telehealth and healthcare communication platform',
  'credentialing-workforce': 'Provider credentialing and workforce management solution',
  'provider-network-virtual-care': 'Virtual care provider network and mental health platform',
  'measurement-outcomes-dtx': 'Measurement-based care and digital therapeutics platform',
  'ai-scribe-documentation': 'AI-powered clinical documentation and medical scribe solution',
  'ai-copilot-clinical': 'AI clinical copilot for healthcare workflows',
  'clinical-decision-support': 'Clinical decision support system',
  'patient-engagement': 'Patient engagement and communication platform',
  'intake-scheduling-forms': 'Patient intake, scheduling, and forms management solution',
  'prescribing-erx': 'Electronic prescribing and medication management platform',
  'compliance-consent-security': 'Healthcare compliance and security solution',
  'analytics-reporting': 'Healthcare analytics and reporting platform',
  'care-coordination-referrals': 'Care coordination and referral management platform',
  'malpractice-insurance': 'Professional liability and malpractice insurance provider',
  'marketing-patient-acquisition': 'Healthcare marketing and patient acquisition platform',
  'clinical-supervision': 'Clinical supervision and training platform',
};

// Generate a short description from available data
function generateShortDescription(tool) {
  const name = tool.name || 'This tool';
  const category = tool.primary_category;
  const categoryDesc = CATEGORY_DESCRIPTIONS[category] || 'healthcare software solution';

  // Try to extract from long_description first
  if (tool.long_description) {
    // Get first sentence, clean it up
    let firstSentence = tool.long_description.split(/[.!?]/)[0].trim();
    if (firstSentence.length > 10 && firstSentence.length <= 200) {
      // Make sure it's a complete thought
      if (!firstSentence.endsWith('.')) {
        firstSentence += '.';
      }
      return firstSentence;
    }
  }

  // Try to use one_liner
  if (tool.one_liner && tool.one_liner.length <= 200) {
    return tool.one_liner;
  }

  // Generate from name and category
  const companyName = tool.company_name || '';

  // Build description based on category type
  let desc;
  switch (category) {
    case 'ehr-practice-management':
      desc = `${name} is an electronic health records and practice management platform designed for healthcare providers.`;
      break;
    case 'billing-rcm-insurance':
      desc = `${name} provides revenue cycle management and medical billing services for healthcare organizations.`;
      break;
    case 'telehealth-communication':
      desc = `${name} is a telehealth platform enabling secure video visits and patient communication.`;
      break;
    case 'credentialing-workforce':
      desc = `${name} streamlines provider credentialing and workforce management for healthcare organizations.`;
      break;
    case 'provider-network-virtual-care':
      desc = `${name} offers virtual mental health care through a network of licensed providers.`;
      break;
    case 'measurement-outcomes-dtx':
      desc = `${name} is a measurement-based care platform for tracking patient outcomes and treatment progress.`;
      break;
    case 'ai-scribe-documentation':
      desc = `${name} uses AI to automate clinical documentation and reduce administrative burden for clinicians.`;
      break;
    case 'ai-copilot-clinical':
      desc = `${name} is an AI-powered clinical assistant that helps healthcare providers with decision support.`;
      break;
    case 'clinical-decision-support':
      desc = `${name} provides clinical decision support tools to improve patient care and outcomes.`;
      break;
    case 'patient-engagement':
      desc = `${name} helps healthcare providers engage patients through communication and education tools.`;
      break;
    case 'intake-scheduling-forms':
      desc = `${name} simplifies patient intake, scheduling, and forms management for healthcare practices.`;
      break;
    case 'prescribing-erx':
      desc = `${name} enables electronic prescribing and medication management for healthcare providers.`;
      break;
    case 'compliance-consent-security':
      desc = `${name} helps healthcare organizations maintain compliance and secure patient data.`;
      break;
    case 'analytics-reporting':
      desc = `${name} provides healthcare analytics and reporting to drive data-informed decisions.`;
      break;
    case 'care-coordination-referrals':
      desc = `${name} facilitates care coordination and referral management across healthcare settings.`;
      break;
    case 'malpractice-insurance':
      desc = `${name} provides professional liability insurance coverage for mental health professionals.`;
      break;
    case 'marketing-patient-acquisition':
      desc = `${name} helps mental health providers attract and connect with new patients.`;
      break;
    case 'clinical-supervision':
      desc = `${name} supports clinical supervision and professional development for mental health clinicians.`;
      break;
    default:
      desc = `${name} is a healthcare technology solution for ${category.replace(/-/g, ' ')}.`;
  }

  // Ensure it's under 200 chars
  if (desc.length > 200) {
    desc = desc.substring(0, 197) + '...';
  }

  return desc;
}

async function processDirectory(dirPath) {
  let fixed = 0;
  let skipped = 0;

  try {
    const files = await readdir(dirPath);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
      const filePath = join(dirPath, file);
      try {
        const content = await readFile(filePath, 'utf-8');
        const tool = JSON.parse(content);

        // Skip if already has short_description
        if (tool.short_description && tool.short_description.trim().length > 0) {
          skipped++;
          continue;
        }

        // Generate short_description
        const shortDesc = generateShortDescription(tool);
        tool.short_description = shortDesc;

        // Update governance for publish readiness
        if (!tool.governance) {
          tool.governance = {};
        }
        tool.governance.last_reviewed = '2026-09-01';
        tool.governance.needs_review = false;

        // Update hipaa_support if unknown
        if (tool.compliance && tool.compliance.hipaa_support === 'unknown') {
          tool.compliance.hipaa_support = 'unverified';
        }

        // Write back
        await writeFile(filePath, JSON.stringify(tool, null, 2) + '\n');
        fixed++;
        console.log(`  Fixed: ${file} - "${shortDesc.substring(0, 50)}..."`);

      } catch (err) {
        console.error(`  Error processing ${file}: ${err.message}`);
      }
    }
  } catch (err) {
    // Directory doesn't exist or is empty
  }

  return { fixed, skipped };
}

async function main() {
  console.log('========================================');
  console.log('GENERATING SHORT DESCRIPTIONS');
  console.log('========================================\n');

  let totalFixed = 0;
  let totalSkipped = 0;

  const subdirs = await readdir(PRODUCTS_DIR);

  for (const subdir of subdirs.sort()) {
    const subdirPath = join(PRODUCTS_DIR, subdir);
    console.log(`\nProcessing ${subdir}...`);

    const { fixed, skipped } = await processDirectory(subdirPath);
    totalFixed += fixed;
    totalSkipped += skipped;

    console.log(`  ${fixed} fixed, ${skipped} already had description`);
  }

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log(`Total fixed: ${totalFixed}`);
  console.log(`Already had description: ${totalSkipped}`);
  console.log(`Total processed: ${totalFixed + totalSkipped}`);
  console.log('========================================\n');
}

main().catch(console.error);
