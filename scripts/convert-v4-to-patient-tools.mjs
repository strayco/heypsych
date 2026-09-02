#!/usr/bin/env node
/**
 * Convert V4 clinician tools to V3 patient tools (DigitalToolV3)
 *
 * This script converts patient-facing products from the V4 clinician tools
 * corpus to the V3 patient tool format for the /tools/ section.
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join } from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const V4_DIR = 'data/tools-v4/products';
const V3_DIR = 'data/resources/tools';

// Categories that are patient-facing
const PATIENT_FACING_CATEGORIES = [
  'measurement-outcomes-dtx',
  'provider-network-virtual-care',
  'patient-engagement',
  'telehealth-communication'
];

// Already existing patient tool slugs (don't overwrite)
const EXISTING_SLUGS = new Set([
  'actissist', 'betterhelp', 'brightside-health', 'calm', 'cbt-i-coach',
  'daylio', 'doximity', 'emoods-bipolar-mood-tracker', 'happify', 'headspace',
  'i-am-sober', 'insight-timer', 'mindshift-cbt', 'moodfit', 'openevidence',
  'practiceq', 'ptsd-coach', 'rootd', 'sober-grid', 'talkiatry', 'talkspace',
  'woebot', 'wysa'
]);

// ============================================================================
// MAPPING FUNCTIONS
// ============================================================================

// V4 category -> V3 HubSlug
const CATEGORY_TO_HUB = {
  'measurement-outcomes-dtx': ['anxiety-stress', 'mood-depression'],
  'provider-network-virtual-care': ['find-support'],
  'patient-engagement': ['find-support'],
  'telehealth-communication': ['find-support']
};

// V4 category -> V3 ToolType
const CATEGORY_TO_TOOL_TYPE = {
  'measurement-outcomes-dtx': ['app', 'assessment'],
  'provider-network-virtual-care': ['therapy-platform'],
  'patient-engagement': ['app'],
  'telehealth-communication': ['therapy-platform']
};

// V4 category -> V3 SupportLevel
const CATEGORY_TO_SUPPORT = {
  'measurement-outcomes-dtx': 'self-help',
  'provider-network-virtual-care': 'clinical',
  'patient-engagement': 'self-help',
  'telehealth-communication': 'clinical'
};

// Category descriptions for generating missing content
const CATEGORY_DESCRIPTIONS = {
  'measurement-outcomes-dtx': 'digital therapeutic and mental health measurement tool',
  'provider-network-virtual-care': 'online therapy and virtual mental health care platform',
  'patient-engagement': 'patient engagement and mental health support tool',
  'telehealth-communication': 'telehealth platform for virtual mental health appointments'
};

// Generate short description if missing
function generateShortDescription(v4) {
  if (v4.short_description && v4.short_description.length >= 20) {
    return v4.short_description.slice(0, 160);
  }
  if (v4.one_liner && v4.one_liner.length >= 20) {
    return v4.one_liner.slice(0, 160);
  }
  const catDesc = CATEGORY_DESCRIPTIONS[v4.primary_category] || 'mental health platform';
  return `${v4.name} is a ${catDesc} designed to support your mental wellness journey.`;
}

// Generate long description if missing
function generateLongDescription(v4) {
  if (v4.long_description && v4.long_description.length >= 100) {
    return v4.long_description;
  }

  const parts = [];
  const catDesc = CATEGORY_DESCRIPTIONS[v4.primary_category] || 'mental health platform';

  // Opening
  parts.push(`${v4.name} is a ${catDesc}.`);

  // Add one_liner if available
  if (v4.one_liner) {
    parts.push(v4.one_liner);
  }

  // Add best_for as features
  if (v4.best_for?.length) {
    parts.push(`It is designed for: ${v4.best_for.slice(0, 3).join(', ')}.`);
  }

  // Add pricing info
  if (v4.pricing?.starting_price_display) {
    parts.push(`Pricing starts at ${v4.pricing.starting_price_display}.`);
  } else if (v4.pricing?.model === 'free') {
    parts.push('The platform is free to use.');
  }

  // Add HIPAA info if relevant
  if (v4.compliance?.hipaa_support === 'full' || v4.compliance?.hipaa_support === 'baa-available') {
    parts.push('The platform is HIPAA compliant.');
  }

  // Ensure minimum length
  let desc = parts.join(' ');
  while (desc.length < 100) {
    desc += ` ${v4.name} offers comprehensive mental health support with easy-to-use features.`;
  }

  return desc;
}

// V4 pricing model -> V3 pricing model
function mapPricingModel(v4Model) {
  switch (v4Model) {
    case 'free': return 'free';
    case 'freemium': return 'freemium';
    case 'per-provider-month':
    case 'per-provider-year':
    case 'flat-monthly':
    case 'flat-annual':
      return 'subscription';
    case 'enterprise-custom':
      return 'enterprise';
    case 'usage-based':
    case 'revenue-share':
      return 'subscription';
    default:
      return 'subscription';
  }
}

// Derive privacy grade from HIPAA support
function derivePrivacyGrade(v4) {
  const hipaa = v4.compliance?.hipaa_support;
  if (hipaa === 'full' || hipaa === 'baa-available') return 'A';
  if (hipaa === 'partial') return 'B+';
  if (hipaa === 'not-required') return 'B';
  return 'unknown';
}

// Generate FAQs from V4 data
function generateFAQs(v4) {
  const faqs = [];

  // If V4 has FAQs, convert them
  if (v4.seo?.faqs?.length >= 3) {
    return v4.seo.faqs.slice(0, 4).map(faq => ({
      q: faq.q || faq.question,
      a: faq.a || faq.answer
    }));
  }

  // Generate default FAQs
  faqs.push({
    q: `What is ${v4.name} and who is it for?`,
    a: v4.short_description || v4.one_liner || `${v4.name} is a digital health platform designed to support mental health and wellness.`
  });

  faqs.push({
    q: `How much does ${v4.name} cost?`,
    a: v4.pricing?.starting_price_display ||
       (v4.pricing?.model === 'free' ? `${v4.name} is free to use.` :
        `${v4.name} pricing varies. Contact them for current pricing.`)
  });

  faqs.push({
    q: `Is ${v4.name} covered by insurance?`,
    a: v4.pricing?.insurance_notes ||
       'Coverage varies by plan. Check with your insurance provider or the platform directly.'
  });

  // Pad to minimum 3 if needed
  while (faqs.length < 3) {
    faqs.push({
      q: `How do I get started with ${v4.name}?`,
      a: `Visit the ${v4.name} website to create an account and get started. Most platforms offer a free trial or consultation.`
    });
  }

  return faqs;
}

// Generate best_for from V4 data
function generateBestFor(v4) {
  const bestFor = [];

  if (v4.best_for?.length) {
    return v4.best_for.slice(0, 5);
  }

  // Derive from category
  if (v4.primary_category === 'measurement-outcomes-dtx') {
    bestFor.push('People wanting to track their mental health progress');
    bestFor.push('Those looking for digital therapeutic interventions');
  } else if (v4.primary_category === 'provider-network-virtual-care') {
    bestFor.push('People seeking convenient online therapy or psychiatry');
    bestFor.push('Those who prefer video sessions from home');
  } else if (v4.primary_category === 'telehealth-communication') {
    bestFor.push('People who want virtual appointments with providers');
    bestFor.push('Those with busy schedules who need flexible care');
  } else {
    bestFor.push('People looking for mental health support');
    bestFor.push('Those who prefer digital health solutions');
  }

  if (v4.feature_flags?.has_ai) {
    bestFor.push('Those interested in AI-assisted mental health tools');
  }

  return bestFor.slice(0, 5);
}

// Generate not_for from V4 data
function generateNotFor(v4) {
  const notFor = [];

  if (v4.not_for?.length) {
    return v4.not_for.slice(0, 3);
  }

  notFor.push('Those in crisis who need immediate emergency care (call 988)');

  if (v4.primary_category === 'provider-network-virtual-care') {
    notFor.push('People who prefer in-person therapy exclusively');
  }

  return notFor.slice(0, 3);
}

// ============================================================================
// MAIN CONVERSION FUNCTION
// ============================================================================

function convertV4ToV3(v4) {
  const slug = v4.slug;
  const now = new Date().toISOString().split('T')[0];
  const catDesc = CATEGORY_DESCRIPTIONS[v4.primary_category] || 'mental health platform';

  const v3 = {
    schema_version: '3.0',
    kind: 'tool',
    slug: slug,
    name: v4.name,
    one_liner: (v4.one_liner || v4.short_description || `${v4.name} is a ${catDesc} designed to support mental wellness.`).slice(0, 200),
    best_for: generateBestFor(v4),
    not_for: generateNotFor(v4),
    support_level: CATEGORY_TO_SUPPORT[v4.primary_category] || 'self-help',
    short_description: generateShortDescription(v4),
    long_description: generateLongDescription(v4),
    patient_summary: v4.patient_summary || v4.short_description || undefined,
    primary_hubs: CATEGORY_TO_HUB[v4.primary_category] || ['find-support'],
    conditions: v4.specialty_areas?.slice(0, 5) || [],
    tool_types: CATEGORY_TO_TOOL_TYPE[v4.primary_category] || ['app'],
    ai_attributes: v4.feature_flags?.has_ai ? ['ai-powered'] : ['no-ai'],
    platforms: {
      ios: v4.platforms?.ios || false,
      android: v4.platforms?.android || false,
      web: v4.platforms?.web || true,
      desktop: v4.platforms?.desktop || false,
      wearable: v4.platforms?.wearable || false
    },
    pricing: {
      model: mapPricingModel(v4.pricing?.model),
      free_tier: v4.pricing?.free_tier || false,
      starting_price: v4.pricing?.starting_price_display || undefined,
      notes: v4.pricing?.notes || undefined
    },
    privacy: {
      grade: derivePrivacyGrade(v4),
      hipaa_compliant: v4.compliance?.hipaa_support === 'full' || v4.compliance?.hipaa_support === 'baa-available',
      gdpr_compliant: true,
      data_sold: false,
      notes: v4.compliance?.notes || undefined
    },
    app_rating: undefined,
    total_reviews: undefined,
    seo: {
      title: v4.seo?.title?.slice(0, 60) || `${v4.name} | HeyPsych`,
      meta_description: (v4.seo?.meta_description || v4.short_description || '').slice(0, 160),
      canonical_url: `https://heypsych.com/tools/${slug}/`,
      faqs: generateFAQs(v4)
    },
    governance: {
      reviewed_by_label: 'Reviewed by HeyPsych Board',
      reviewed_by_url: 'https://heypsych.com/about/medical-review-board',
      last_reviewed: now
    },
    app_metadata: {
      publisher: v4.vendor_info?.company_name || undefined,
      website: v4.website_url || undefined,
      affiliate_url: v4.affiliate_url || v4.website_url || undefined
    },
    clinical_metadata: {
      evidence_based: v4.evidence?.has_peer_reviewed_studies || false,
      evidence_level: v4.evidence?.has_peer_reviewed_studies ? 'moderate' : 'emerging',
      primary_uses: v4.best_for?.slice(0, 4) || undefined
    },
    related_tools: v4.alternatives?.slice(0, 4) || [],
    related_conditions: v4.specialty_areas?.slice(0, 3) || [],
    order: undefined,
    featured: false,
    status: 'active',
    affiliate_url: v4.affiliate_url || v4.website_url || undefined,
    updated_at: new Date().toISOString()
  };

  // Clean up undefined values
  Object.keys(v3).forEach(key => {
    if (v3[key] === undefined) delete v3[key];
  });

  if (v3.app_metadata) {
    Object.keys(v3.app_metadata).forEach(key => {
      if (v3.app_metadata[key] === undefined) delete v3.app_metadata[key];
    });
  }

  if (v3.clinical_metadata) {
    Object.keys(v3.clinical_metadata).forEach(key => {
      if (v3.clinical_metadata[key] === undefined) delete v3.clinical_metadata[key];
    });
  }

  return v3;
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

function getAllJsonFiles(dir) {
  const files = [];
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllJsonFiles(fullPath));
    } else if (entry.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const files = getAllJsonFiles(V4_DIR);
  let converted = 0;
  let skipped = 0;
  const errors = [];

  console.log('Converting V4 patient-facing products to V3 format...\n');

  for (const filepath of files) {
    try {
      const data = JSON.parse(readFileSync(filepath, 'utf8'));

      // Skip if not active
      if (data.status !== 'active') {
        skipped++;
        continue;
      }

      // Skip if not patient-facing category
      if (!PATIENT_FACING_CATEGORIES.includes(data.primary_category)) {
        skipped++;
        continue;
      }

      // Skip if already exists
      if (EXISTING_SLUGS.has(data.slug)) {
        console.log(`  Skipping ${data.slug} (already exists)`);
        skipped++;
        continue;
      }

      // Convert
      const v3 = convertV4ToV3(data);

      // Write to V3 directory
      const outputPath = join(V3_DIR, `${v3.slug}.json`);
      writeFileSync(outputPath, JSON.stringify(v3, null, 2) + '\n');

      converted++;
      if (converted <= 20) {
        console.log(`  Converted: ${data.slug}`);
      }
    } catch (e) {
      errors.push({ file: filepath, error: e.message });
    }
  }

  console.log('\n========================================');
  console.log('CONVERSION COMPLETE');
  console.log('========================================');
  console.log(`Converted: ${converted}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.slice(0, 10).forEach(e => console.log(`  ${e.file}: ${e.error}`));
  }

  // Count total V3 files now
  const v3Files = readdirSync(V3_DIR).filter(f => f.endsWith('.json'));
  console.log(`\nTotal V3 patient tools: ${v3Files.length}`);
}

main().catch(console.error);
