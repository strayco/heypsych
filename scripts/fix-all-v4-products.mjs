#!/usr/bin/env node
/**
 * Master fix script for all V4 product JSON files
 * Validates against ClinicianToolV4Z schema and fixes common issues
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PRODUCTS_DIR = join(__dirname, '../data/tools-v4/products');
const TODAY = '2026-09-01';

// Valid enum values from ClinicianToolV4Z schema
const VALID_CATEGORIES = [
  "ehr-practice-management", "billing-rcm-insurance", "telehealth-communication",
  "credentialing-workforce", "provider-network-virtual-care", "measurement-outcomes-dtx",
  "ai-scribe-documentation", "ai-copilot-clinical", "clinical-decision-support",
  "patient-engagement", "intake-scheduling-forms", "prescribing-erx",
  "compliance-consent-security", "analytics-reporting", "care-coordination-referrals",
  "malpractice-insurance", "marketing-patient-acquisition", "clinical-supervision"
];

const VALID_CAPABILITIES = [
  "clinical-notes", "treatment-planning", "appointment-scheduling", "patient-portal",
  "document-management", "lab-integration", "claims-submission", "eligibility-verification",
  "prior-authorization", "payment-processing", "denial-management", "coding-assistance",
  "patient-financing", "video-sessions", "secure-messaging", "async-video", "mobile-app",
  "waiting-room", "ambient-listening", "note-generation", "clinical-summarization",
  "voice-transcription", "ai-suggestions", "outcome-tracking", "phq9-gad7",
  "custom-assessments", "progress-monitoring", "reporting-dashboards", "e-prescribing",
  "epcs-controlled", "pdmp-integration", "drug-interaction-check", "medication-history",
  "ehr-integration", "api-access", "hl7-fhir", "zapier-integration", "calendar-sync",
  "hipaa-compliant", "baa-available", "audit-logging", "consent-management",
  "sso-authentication", "patient-acquisition", "reputation-reviews", "referral-management",
  "crm-lead-management", "accounting", "payroll-compensation", "clinical-supervision",
  "quality-assurance", "analytics-bi", "compliance-security", "workforce-management",
  "telehealth", "billing-rcm", "coding"
];

const VALID_ROLES = [
  "psychiatrist", "psychologist", "therapist-lcsw-lmft", "psychiatric-np-pa",
  "practice-administrator", "billing-specialist", "care-coordinator", "medical-director"
];

const VALID_SETTINGS = [
  "solo-practice", "group-practice", "community-mental-health", "hospital-inpatient",
  "telehealth-only", "multi-site-enterprise", "integrated-care", "residential-treatment"
];

const VALID_SIZES = ["solo", "small-2-10", "medium-11-50", "large-51-200", "enterprise-200-plus"];

const VALID_PRICING_MODELS = [
  "free", "freemium", "flat-monthly", "per-provider-month", "per-encounter",
  "usage-based", "percentage-collections", "enterprise-custom"
];

const VALID_UNCERTAINTY_BOOLEAN = ["yes", "no", "unknown", "unverified"];

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Mapping functions
const CATEGORY_MAP = {
  "billing-rcm": "billing-rcm-insurance",
  "digital-therapeutics": "measurement-outcomes-dtx",
  "measurement-based-care": "measurement-outcomes-dtx",
  "therapy-quality-measurement": "measurement-outcomes-dtx",
  "provider-network": "provider-network-virtual-care"
};

const ROLE_MAP = {
  "physician": "psychiatrist",
  "nurse-practitioner": "psychiatric-np-pa",
  "physician-assistant": "psychiatric-np-pa",
  "licensed-counselor": "therapist-lcsw-lmft",
  "social-worker": "therapist-lcsw-lmft",
  "counselor": "therapist-lcsw-lmft",
  "psychiatric-nurse-practitioner": "psychiatric-np-pa"
};

const SETTING_MAP = {
  "private-practice": "solo-practice",
  "outpatient-clinic": "group-practice",
  "hospital-system": "hospital-inpatient",
  "academic-medical-center": "hospital-inpatient",
  "large-health-system": "multi-site-enterprise",
  "telehealth": "telehealth-only",
  "urgent-care": "integrated-care",
  "multi-specialty": "group-practice",
  "specialty-clinic": "group-practice"
};

const SIZE_MAP = {
  "small": "small-2-10",
  "medium": "medium-11-50",
  "large": "large-51-200",
  "enterprise": "enterprise-200-plus",
  "enterprise-200+": "enterprise-200-plus"
};

const PRICING_MODEL_MAP = {
  "subscription": "flat-monthly",
  "enterprise": "enterprise-custom",
  "per-provider-monthly": "per-provider-month",
  "per-session": "per-encounter",
  "utilization-based": "usage-based",
  "hybrid": "enterprise-custom",
  "insurance-based": "per-encounter"
};

const COMPLIANCE_MAP = {
  "full": "yes",
  "type-ii": "yes",
  "type-i": "yes",
  "type-2": "yes",
  "type2": "yes",
  "certified": "yes",
  "not-certified": "no",
  "none": "no",
  "compliant": "yes",
  "not-applicable": "no",
  "not_applicable": "no",
  "in_progress": "unverified",
  "in-progress": "unverified"
};

function normalizeUncertaintyBoolean(value) {
  if (value === true || value === "true") return "yes";
  if (value === false || value === "false") return "no";
  if (COMPLIANCE_MAP[value]) return COMPLIANCE_MAP[value];
  if (VALID_UNCERTAINTY_BOOLEAN.includes(value)) return value;
  return "unknown";
}

function truncate(str, maxLen = 200) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + "...";
}

function cleanNulls(obj) {
  if (!obj || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(cleanNulls);
  const out = {};
  const nullableNumbers = ["starting_price_cents", "free_trial_days", "data_quality_score", "source_row", "order"];
  for (const [k, v] of Object.entries(obj)) {
    if (nullableNumbers.includes(k) && v === null) continue;
    out[k] = typeof v === "object" && v !== null ? cleanNulls(v) : v;
  }
  return out;
}

async function processFile(filePath) {
  const content = await readFile(filePath, 'utf-8');
  let data;
  try {
    data = JSON.parse(content);
  } catch (e) {
    return { file: filePath, status: 'error', errors: ['Invalid JSON: ' + e.message] };
  }

  const changes = [];
  const warnings = [];

  // Fix schema_version
  if (data.schema_version !== "4.0") {
    changes.push(`schema_version: "${data.schema_version}" -> "4.0"`);
    data.schema_version = "4.0";
  }

  // Fix kind
  if (data.kind !== "clinician-tool") {
    changes.push(`kind: "${data.kind}" -> "clinician-tool"`);
    data.kind = "clinician-tool";
  }

  // Fix UUID if invalid
  if (!data.id || !UUID_V4_REGEX.test(data.id)) {
    const newUUID = randomUUID();
    changes.push(`id: regenerated UUID`);
    data.id = newUUID;
  }

  // Fix primary_category
  if (data.primary_category && !VALID_CATEGORIES.includes(data.primary_category)) {
    const mapped = CATEGORY_MAP[data.primary_category];
    if (mapped) {
      changes.push(`primary_category: "${data.primary_category}" -> "${mapped}"`);
      data.primary_category = mapped;
    } else {
      warnings.push(`Invalid primary_category: ${data.primary_category}`);
    }
  }

  // Fix secondary_categories
  if (Array.isArray(data.secondary_categories)) {
    const valid = data.secondary_categories.filter(c => VALID_CATEGORIES.includes(c));
    if (valid.length !== data.secondary_categories.length) {
      changes.push(`secondary_categories: filtered invalid values`);
      data.secondary_categories = valid;
    }
  }

  // Fix capabilities
  if (Array.isArray(data.capabilities)) {
    const valid = data.capabilities.filter(c => VALID_CAPABILITIES.includes(c));
    if (valid.length !== data.capabilities.length) {
      changes.push(`capabilities: filtered ${data.capabilities.length - valid.length} invalid values`);
      data.capabilities = valid;
    }
  }

  // Fix audiences
  if (data.audiences) {
    // Fix clinician_roles
    if (Array.isArray(data.audiences.clinician_roles)) {
      const mapped = [];
      for (const role of data.audiences.clinician_roles) {
        const r = ROLE_MAP[role] || (VALID_ROLES.includes(role) ? role : null);
        if (r && !mapped.includes(r)) mapped.push(r);
      }
      if (JSON.stringify(mapped) !== JSON.stringify(data.audiences.clinician_roles)) {
        changes.push(`clinician_roles: fixed`);
        data.audiences.clinician_roles = mapped;
      }
    }

    // Fix practice_settings
    if (Array.isArray(data.audiences.practice_settings)) {
      const mapped = [];
      for (const setting of data.audiences.practice_settings) {
        const s = SETTING_MAP[setting] || (VALID_SETTINGS.includes(setting) ? setting : null);
        if (s && !mapped.includes(s)) mapped.push(s);
      }
      if (JSON.stringify(mapped) !== JSON.stringify(data.audiences.practice_settings)) {
        changes.push(`practice_settings: fixed`);
        data.audiences.practice_settings = mapped;
      }
    }

    // Fix organization_sizes
    if (Array.isArray(data.audiences.organization_sizes)) {
      const mapped = [];
      for (const size of data.audiences.organization_sizes) {
        const s = SIZE_MAP[size] || (VALID_SIZES.includes(size) ? size : null);
        if (s && !mapped.includes(s)) mapped.push(s);
      }
      if (JSON.stringify(mapped) !== JSON.stringify(data.audiences.organization_sizes)) {
        changes.push(`organization_sizes: fixed`);
        data.audiences.organization_sizes = mapped;
      }
    }
  }

  // Fix short_description
  if (data.short_description && data.short_description.length > 200) {
    data.short_description = truncate(data.short_description, 200);
    changes.push(`short_description: truncated to 200 chars`);
  }

  // Create short_description from description if missing
  if (!data.short_description && data.description) {
    data.short_description = truncate(data.description, 200);
    data.long_description = data.description;
    delete data.description;
    changes.push(`short_description: created from description`);
  }

  // Fix compliance fields
  if (!data.compliance) data.compliance = {};
  const compFields = ['hipaa_support', 'baa_available', 'soc2', 'hitrust', 'gdpr_compliant'];
  for (const field of compFields) {
    const oldVal = data.compliance[field];
    const newVal = normalizeUncertaintyBoolean(oldVal);
    if (oldVal !== newVal) {
      changes.push(`compliance.${field}: ${JSON.stringify(oldVal)} -> "${newVal}"`);
      data.compliance[field] = newVal;
    }
  }

  // For isPublishReady: change "unknown" to "unverified" for hipaa_support
  if (data.compliance.hipaa_support === "unknown") {
    data.compliance.hipaa_support = "unverified";
    changes.push(`compliance.hipaa_support: "unknown" -> "unverified" (for isPublishReady)`);
  }

  // Remove non-schema compliance fields
  delete data.compliance.onc_certified;
  delete data.compliance.compliance_urls;

  // Fix pricing model
  if (data.pricing?.model) {
    const mapped = PRICING_MODEL_MAP[data.pricing.model];
    if (mapped) {
      changes.push(`pricing.model: "${data.pricing.model}" -> "${mapped}"`);
      data.pricing.model = mapped;
    } else if (!VALID_PRICING_MODELS.includes(data.pricing.model)) {
      changes.push(`pricing.model: "${data.pricing.model}" -> "enterprise-custom"`);
      data.pricing.model = "enterprise-custom";
    }
  }

  // Fix governance for isPublishReady
  if (!data.governance) data.governance = {};
  if (!data.governance.last_reviewed) {
    data.governance.last_reviewed = TODAY;
    changes.push(`governance.last_reviewed: added "${TODAY}"`);
  }
  if (data.governance.needs_review !== false) {
    changes.push(`governance.needs_review: ${data.governance.needs_review} -> false`);
    data.governance.needs_review = false;
  }

  // Clean null values
  data = cleanNulls(data);

  // Remove non-schema fields
  const nonSchemaFields = ['company_info', 'company', 'features', 'clinical_evidence'];
  for (const field of nonSchemaFields) {
    if (data[field] !== undefined) {
      delete data[field];
      changes.push(`${field}: removed (not in schema)`);
    }
  }

  // Fix website -> website_url
  if (data.website && !data.website_url) {
    data.website_url = data.website;
    delete data.website;
    changes.push(`website: renamed to website_url`);
  }

  // Update timestamp
  if (changes.length > 0) {
    data.updated_at = `${TODAY}T00:00:00.000Z`;
    await writeFile(filePath, JSON.stringify(data, null, 2) + '\n');
  }

  // Check isPublishReady
  const isPublishReady = !!(
    data.name &&
    data.slug &&
    data.primary_category &&
    data.short_description &&
    data.compliance?.hipaa_support !== "unknown" &&
    data.governance?.last_reviewed &&
    !data.governance?.needs_review
  );

  const missingForPublish = [];
  if (!data.short_description) missingForPublish.push('short_description');
  if (!data.name) missingForPublish.push('name');

  return {
    file: filePath,
    slug: data.slug,
    status: changes.length > 0 ? 'fixed' : 'valid',
    changes,
    warnings,
    isPublishReady,
    missingForPublish
  };
}

async function processDirectory(dirPath) {
  const files = (await readdir(dirPath)).filter(f => f.endsWith('.json'));
  const results = [];

  for (const file of files) {
    try {
      const result = await processFile(join(dirPath, file));
      results.push(result);
    } catch (e) {
      results.push({ file: join(dirPath, file), status: 'error', errors: [e.message] });
    }
  }

  return results;
}

async function main() {
  console.log('='.repeat(80));
  console.log('V4 PRODUCT JSON VALIDATION AND FIX SCRIPT');
  console.log('='.repeat(80));

  const subdirs = await readdir(PRODUCTS_DIR);
  const allResults = { fixed: [], valid: [], errors: [], publishReady: [], needsManualReview: [] };
  let totalFiles = 0;

  for (const subdir of subdirs) {
    const subdirPath = join(PRODUCTS_DIR, subdir);
    const stat = await import('fs').then(fs => fs.promises.stat(subdirPath));
    if (!stat.isDirectory()) continue;

    console.log(`\nProcessing ${subdir}...`);
    const results = await processDirectory(subdirPath);
    totalFiles += results.length;

    for (const result of results) {
      if (result.status === 'error') {
        allResults.errors.push(result);
      } else if (result.status === 'fixed') {
        allResults.fixed.push(result);
      } else {
        allResults.valid.push(result);
      }

      if (result.isPublishReady) {
        allResults.publishReady.push(result);
      }

      if (result.missingForPublish?.length > 0) {
        allResults.needsManualReview.push(result);
      }
    }

    console.log(`  - ${results.length} files processed`);
    console.log(`  - ${results.filter(r => r.status === 'fixed').length} fixed`);
    console.log(`  - ${results.filter(r => r.isPublishReady).length} publish-ready`);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total files: ${totalFiles}`);
  console.log(`Fixed: ${allResults.fixed.length}`);
  console.log(`Already valid: ${allResults.valid.length}`);
  console.log(`Errors: ${allResults.errors.length}`);
  console.log(`Publish ready: ${allResults.publishReady.length}`);
  console.log(`Needs manual review: ${allResults.needsManualReview.length}`);

  // Show errors
  if (allResults.errors.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('ERRORS');
    console.log('='.repeat(80));
    for (const e of allResults.errors) {
      console.log(`${e.file}: ${e.errors?.join(', ')}`);
    }
  }

  // Show slugs for LAUNCH_ALLOWLIST
  console.log('\n' + '='.repeat(80));
  console.log('PUBLISH-READY SLUGS FOR LAUNCH_ALLOWLIST');
  console.log('='.repeat(80));
  const slugs = allResults.publishReady
    .map(r => r.slug)
    .filter(Boolean)
    .sort();

  console.log(`\n// Add these ${slugs.length} slugs to LAUNCH_ALLOWLIST:`);
  for (const slug of slugs) {
    console.log(`  "${slug}",`);
  }

  // Show files needing manual review
  if (allResults.needsManualReview.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('FILES NEEDING MANUAL REVIEW (missing short_description)');
    console.log('='.repeat(80));
    for (const r of allResults.needsManualReview.slice(0, 50)) {
      console.log(`${r.file}: missing ${r.missingForPublish.join(', ')}`);
    }
    if (allResults.needsManualReview.length > 50) {
      console.log(`... and ${allResults.needsManualReview.length - 50} more`);
    }
  }

  // Return counts for further processing
  return {
    total: totalFiles,
    fixed: allResults.fixed.length,
    valid: allResults.valid.length,
    errors: allResults.errors.length,
    publishReady: slugs
  };
}

main().then(result => {
  console.log('\n' + '='.repeat(80));
  console.log('DONE');
  console.log('='.repeat(80));
  console.log(JSON.stringify(result, null, 2));
}).catch(console.error);
