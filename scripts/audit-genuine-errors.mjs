#!/usr/bin/env node
/**
 * AUDIT GENUINE SCHEMA ERRORS
 *
 * Only identifies actual schema violations:
 * - Invalid enum values (kind, categories, capabilities, roles, settings, sizes, pricing models)
 * - Boolean compliance values (should be strings)
 * - Null values in string fields
 * - Invalid UUIDs
 * - Fields that violate Zod constraints
 *
 * Does NOT flag as errors:
 * - needs_review: true (this is valid, just means unreviewed)
 * - hipaa_support: "unknown" (this is valid)
 * - status: "draft" (this is valid)
 * - Missing short_description (optional field)
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const PRODUCTS_DIR = '/Users/jack/heypsych/data/tools-v4/products';

// Valid enum values from schema
const VALID = {
  kind: ["clinician-tool"],
  categories: [
    "ehr-practice-management", "billing-rcm-insurance", "telehealth-communication",
    "credentialing-workforce", "provider-network-virtual-care", "measurement-outcomes-dtx",
    "ai-scribe-documentation", "ai-copilot-clinical", "clinical-decision-support",
    "patient-engagement", "intake-scheduling-forms", "prescribing-erx",
    "compliance-consent-security", "analytics-reporting", "care-coordination-referrals",
    "malpractice-insurance", "marketing-patient-acquisition", "clinical-supervision",
  ],
  capabilities: [
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
    "telehealth", "billing-rcm", "coding",
  ],
  clinicianRoles: [
    "psychiatrist", "psychologist", "therapist-lcsw-lmft", "psychiatric-np-pa",
    "practice-administrator", "billing-specialist", "care-coordinator", "medical-director",
  ],
  practiceSettings: [
    "solo-practice", "group-practice", "community-mental-health", "hospital-inpatient",
    "telehealth-only", "multi-site-enterprise", "integrated-care", "residential-treatment",
  ],
  orgSizes: [
    "solo", "small-2-10", "medium-11-50", "large-51-200", "enterprise-200-plus",
  ],
  pricingModels: [
    "free", "freemium", "per-provider-month", "per-provider-year", "per-patient",
    "per-encounter", "flat-monthly", "flat-annual", "enterprise-custom", "usage-based",
    "revenue-share",
  ],
  lifecycleStatuses: ["active", "beta", "deprecated", "discontinued", "acquired", "merged"],
  toolStatuses: ["active", "draft", "archived", "pending-review"],
  uncertaintyBoolean: ["yes", "no", "unknown", "not_applicable"],
  integrationCategories: ["ehr", "billing", "telehealth", "lab", "pharmacy", "payer", "calendar", "communication", "analytics", "other"],
  integrationTypes: ["native", "api", "hl7", "fhir", "zapier", "partner", "file-based"],
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function auditTool(tool, filePath) {
  const errors = [];
  const fixes = [];

  // Check kind
  if (!VALID.kind.includes(tool.kind)) {
    errors.push({ field: "kind", value: tool.kind, expected: "clinician-tool" });
    fixes.push({ field: "kind", from: tool.kind, to: "clinician-tool" });
  }

  // Check primary_category
  if (!VALID.categories.includes(tool.primary_category)) {
    errors.push({ field: "primary_category", value: tool.primary_category, expected: "valid category" });
  }

  // Check secondary_categories
  if (tool.secondary_categories) {
    tool.secondary_categories.forEach((cat, i) => {
      if (!VALID.categories.includes(cat)) {
        errors.push({ field: `secondary_categories[${i}]`, value: cat, expected: "valid category" });
      }
    });
  }

  // Check capabilities
  if (tool.capabilities) {
    tool.capabilities.forEach((cap, i) => {
      if (!VALID.capabilities.includes(cap)) {
        errors.push({ field: `capabilities[${i}]`, value: cap, expected: "valid capability" });
      }
    });
  }

  // Check audiences
  if (tool.audiences) {
    if (tool.audiences.clinician_roles) {
      tool.audiences.clinician_roles.forEach((role, i) => {
        if (!VALID.clinicianRoles.includes(role)) {
          errors.push({ field: `audiences.clinician_roles[${i}]`, value: role, expected: "valid role" });
        }
      });
    }
    if (tool.audiences.practice_settings) {
      tool.audiences.practice_settings.forEach((setting, i) => {
        if (!VALID.practiceSettings.includes(setting)) {
          errors.push({ field: `audiences.practice_settings[${i}]`, value: setting, expected: "valid setting" });
        }
      });
    }
    if (tool.audiences.organization_sizes) {
      tool.audiences.organization_sizes.forEach((size, i) => {
        if (!VALID.orgSizes.includes(size)) {
          errors.push({ field: `audiences.organization_sizes[${i}]`, value: size, expected: "valid size" });
        }
      });
    }
  }

  // Check compliance values - must be strings not booleans
  if (tool.compliance) {
    ['hipaa_support', 'baa_available', 'soc2', 'hitrust', 'gdpr_compliant', 'fedramp', 'iso27001'].forEach(field => {
      const val = tool.compliance[field];
      if (val === true || val === false) {
        errors.push({ field: `compliance.${field}`, value: val, expected: '"yes" or "no"' });
        fixes.push({ field: `compliance.${field}`, from: val, to: val ? "yes" : "no" });
      } else if (val !== undefined && !VALID.uncertaintyBoolean.includes(val)) {
        errors.push({ field: `compliance.${field}`, value: val, expected: "yes|no|unknown|not_applicable" });
      }
    });
  }

  // Check UUID
  if (!UUID_REGEX.test(tool.id)) {
    errors.push({ field: "id", value: tool.id, expected: "valid UUID" });
    fixes.push({ field: "id", from: tool.id, to: "GENERATE_NEW" });
  }

  // Check pricing model
  if (tool.pricing?.model && !VALID.pricingModels.includes(tool.pricing.model)) {
    errors.push({ field: "pricing.model", value: tool.pricing.model, expected: "valid pricing model" });
  }

  // Check for null values in string fields
  const stringFields = ['website_url', 'pricing_url', 'support_url', 'demo_url', 'logo_url', 'affiliate_url'];
  stringFields.forEach(field => {
    if (tool[field] === null) {
      errors.push({ field, value: "null", expected: "string or undefined" });
      fixes.push({ field, from: null, to: "REMOVE" });
    }
  });

  // Check integrations
  if (tool.integrations && !Array.isArray(tool.integrations)) {
    errors.push({ field: "integrations", value: typeof tool.integrations, expected: "array" });
    fixes.push({ field: "integrations", from: tool.integrations, to: [] });
  } else if (tool.integrations) {
    tool.integrations.forEach((int, i) => {
      if (int.category && !VALID.integrationCategories.includes(int.category)) {
        errors.push({ field: `integrations[${i}].category`, value: int.category, expected: "valid category" });
      }
      if (int.integration_type && !VALID.integrationTypes.includes(int.integration_type)) {
        errors.push({ field: `integrations[${i}].integration_type`, value: int.integration_type, expected: "valid type" });
      }
    });
  }

  // Check import_ref.record_id if import_ref exists
  if (tool.import_ref && !tool.import_ref.record_id) {
    errors.push({ field: "import_ref.record_id", value: "missing", expected: "non-empty string" });
    fixes.push({ field: "import_ref.record_id", from: undefined, to: tool.slug });
  }

  return { slug: tool.slug, file: filePath, errors, fixes };
}

async function main() {
  console.log('================================================================');
  console.log('GENUINE SCHEMA ERROR AUDIT');
  console.log('(Does NOT flag missing reviews or unknown compliance as errors)');
  console.log('================================================================\n');

  let total = 0;
  let withErrors = 0;
  const allErrors = [];
  const allFixes = [];

  const subdirs = await readdir(PRODUCTS_DIR);
  for (const subdir of subdirs.sort()) {
    const subdirPath = join(PRODUCTS_DIR, subdir);
    try {
      const files = (await readdir(subdirPath)).filter(f => f.endsWith('.json'));
      for (const file of files) {
        total++;
        const content = await readFile(join(subdirPath, file), 'utf-8');
        const tool = JSON.parse(content);
        const result = auditTool(tool, `${subdir}/${file}`);

        if (result.errors.length > 0) {
          withErrors++;
          allErrors.push(result);
        }
        if (result.fixes.length > 0) {
          allFixes.push(...result.fixes.map(f => ({ file: result.file, ...f })));
        }
      }
    } catch (e) {}
  }

  console.log(`Total files: ${total}`);
  console.log(`Files with genuine errors: ${withErrors}`);
  console.log(`Total fixable issues: ${allFixes.length}`);
  console.log('================================================================\n');

  if (allErrors.length > 0) {
    console.log('FILES WITH ERRORS:\n');
    allErrors.forEach(({ file, errors }) => {
      console.log(`${file}:`);
      errors.forEach(e => console.log(`  - ${e.field}: "${e.value}" (expected: ${e.expected})`));
    });
  }

  // Summary by error type
  const byField = {};
  allErrors.forEach(({ errors }) => {
    errors.forEach(e => {
      const key = e.field.replace(/\[\d+\]/, '[*]');
      byField[key] = (byField[key] || 0) + 1;
    });
  });

  console.log('\n================================================================');
  console.log('ERROR SUMMARY BY FIELD:');
  console.log('================================================================');
  Object.entries(byField).sort((a, b) => b[1] - a[1]).forEach(([field, count]) => {
    console.log(`  ${field}: ${count}`);
  });
}

main().catch(console.error);
