#!/usr/bin/env node
/**
 * COMPREHENSIVE V4 PRODUCT AUDIT
 *
 * Validates ALL schema requirements for:
 * - ClinicianToolV4Z schema
 * - isPublishReady() requirements
 * - isToolPublishable() requirements
 * - Practice Architect adapter compatibility
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const PRODUCTS_DIR = '/Users/jack/heypsych/data/tools-v4/products';

// ============================================================================
// VALID ENUMS (from clinician-tool-v4.ts)
// ============================================================================

const VALID_CATEGORIES = [
  "ehr-practice-management",
  "billing-rcm-insurance",
  "telehealth-communication",
  "credentialing-workforce",
  "provider-network-virtual-care",
  "measurement-outcomes-dtx",
  "ai-scribe-documentation",
  "ai-copilot-clinical",
  "clinical-decision-support",
  "patient-engagement",
  "intake-scheduling-forms",
  "prescribing-erx",
  "compliance-consent-security",
  "analytics-reporting",
  "care-coordination-referrals",
  "malpractice-insurance",
  "marketing-patient-acquisition",
  "clinical-supervision",
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
  "telehealth", "billing-rcm", "coding",
];

const VALID_CLINICIAN_ROLES = [
  "psychiatrist", "psychologist", "therapist-lcsw-lmft", "psychiatric-np-pa",
  "practice-administrator", "billing-specialist", "care-coordinator", "medical-director",
];

const VALID_PRACTICE_SETTINGS = [
  "solo-practice", "group-practice", "community-mental-health", "hospital-inpatient",
  "telehealth-only", "multi-site-enterprise", "integrated-care", "residential-treatment",
];

const VALID_ORG_SIZES = [
  "solo", "small-2-10", "medium-11-50", "large-51-200", "enterprise-200-plus",
];

const VALID_PRICING_MODELS = [
  "free", "freemium", "per-provider-month", "per-provider-year", "per-patient",
  "per-encounter", "flat-monthly", "flat-annual", "enterprise-custom", "usage-based",
  "revenue-share",
];

const VALID_LIFECYCLE_STATUSES = [
  "active", "beta", "deprecated", "discontinued", "acquired", "merged",
];

const VALID_TOOL_STATUSES = [
  "active", "draft", "archived", "pending-review",
];

const VALID_UNCERTAINTY_BOOLEAN = ["yes", "no", "unknown", "unverified"];

const VALID_INTEGRATION_CATEGORIES = [
  "ehr", "billing", "telehealth", "lab", "pharmacy", "payer", "calendar",
  "communication", "analytics", "other",
];

const VALID_INTEGRATION_TYPES = [
  "native", "api", "hl7", "fhir", "zapier", "partner", "file-based",
];

const VALID_SOC2_TYPES = ["type1", "type2", "unknown"];

const VALID_REVIEW_PRIORITIES = ["low", "medium", "high", "critical"];

const VALID_PRICE_RANGES = ["budget", "mid-market", "premium", "enterprise"];

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG_REGEX = /^[a-z0-9-]+$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
const URL_REGEX = /^https?:\/\/.+/;

function isValidUUID(val) {
  return typeof val === 'string' && UUID_REGEX.test(val);
}

function isValidSlug(val) {
  return typeof val === 'string' && SLUG_REGEX.test(val);
}

function isValidDate(val) {
  return typeof val === 'string' && DATE_REGEX.test(val);
}

function isValidDatetime(val) {
  return typeof val === 'string' && DATETIME_REGEX.test(val);
}

function isValidURL(val) {
  if (typeof val !== 'string') return false;
  try {
    new URL(val);
    return URL_REGEX.test(val);
  } catch {
    return false;
  }
}

// ============================================================================
// MAIN AUDIT FUNCTION
// ============================================================================

function auditTool(tool, filePath) {
  const issues = [];
  const warnings = [];
  const fixes = [];

  // Helper to add issue
  const addIssue = (field, msg, fixable = false, fixValue = null) => {
    issues.push({ field, message: msg });
    if (fixable && fixValue !== null) {
      fixes.push({ field, value: fixValue, message: msg });
    }
  };

  const addWarning = (field, msg) => {
    warnings.push({ field, message: msg });
  };

  // ========== REQUIRED LITERAL FIELDS ==========
  if (tool.schema_version !== "4.0") {
    addIssue("schema_version", `Must be "4.0", got "${tool.schema_version}"`, true, "4.0");
  }

  if (tool.kind !== "clinician-tool") {
    addIssue("kind", `Must be "clinician-tool", got "${tool.kind}"`, true, "clinician-tool");
  }

  // ========== IDENTITY FIELDS ==========
  if (!isValidUUID(tool.id)) {
    addIssue("id", `Invalid UUID: "${tool.id}"`, true, crypto.randomUUID());
  }

  if (!isValidSlug(tool.slug)) {
    addIssue("slug", `Invalid slug (must be lowercase alphanumeric with hyphens): "${tool.slug}"`);
  }

  if (!tool.name || typeof tool.name !== 'string') {
    addIssue("name", "Name is required");
  } else if (tool.name.length < 2 || tool.name.length > 150) {
    addIssue("name", `Name must be 2-150 chars, got ${tool.name.length}`);
  }

  if (tool.company_name !== undefined && tool.company_name !== null) {
    if (typeof tool.company_name !== 'string' || tool.company_name.length < 1 || tool.company_name.length > 150) {
      addIssue("company_name", `Company name must be 1-150 chars if provided`);
    }
  }

  // ========== PRIMARY CATEGORY ==========
  if (!VALID_CATEGORIES.includes(tool.primary_category)) {
    addIssue("primary_category", `Invalid category: "${tool.primary_category}". Valid: ${VALID_CATEGORIES.join(", ")}`);
  }

  // ========== SECONDARY CATEGORIES ==========
  if (tool.secondary_categories) {
    if (!Array.isArray(tool.secondary_categories)) {
      addIssue("secondary_categories", "Must be an array");
    } else {
      tool.secondary_categories.forEach((cat, i) => {
        if (!VALID_CATEGORIES.includes(cat)) {
          addIssue(`secondary_categories[${i}]`, `Invalid category: "${cat}"`);
        }
      });
    }
  }

  // ========== CAPABILITIES ==========
  if (tool.capabilities) {
    if (!Array.isArray(tool.capabilities)) {
      addIssue("capabilities", "Must be an array");
    } else {
      tool.capabilities.forEach((cap, i) => {
        if (!VALID_CAPABILITIES.includes(cap)) {
          addIssue(`capabilities[${i}]`, `Invalid capability: "${cap}"`);
        }
      });
    }
  }

  // ========== LIFECYCLE ==========
  if (tool.lifecycle) {
    if (!VALID_LIFECYCLE_STATUSES.includes(tool.lifecycle.status)) {
      addIssue("lifecycle.status", `Invalid status: "${tool.lifecycle.status}". Valid: ${VALID_LIFECYCLE_STATUSES.join(", ")}`, true, "active");
    }
    if (tool.lifecycle.discontinued_at && !isValidDate(tool.lifecycle.discontinued_at)) {
      addIssue("lifecycle.discontinued_at", `Invalid date format: "${tool.lifecycle.discontinued_at}". Must be YYYY-MM-DD`);
    }
    if (tool.lifecycle.acquisition_date && !isValidDate(tool.lifecycle.acquisition_date)) {
      addIssue("lifecycle.acquisition_date", `Invalid date format. Must be YYYY-MM-DD`);
    }
    if (tool.lifecycle.successor_slug && !isValidSlug(tool.lifecycle.successor_slug)) {
      addIssue("lifecycle.successor_slug", `Invalid slug format`);
    }
  }

  // ========== AUDIENCES ==========
  if (tool.audiences) {
    // Clinician roles
    if (tool.audiences.clinician_roles) {
      if (!Array.isArray(tool.audiences.clinician_roles)) {
        addIssue("audiences.clinician_roles", "Must be an array");
      } else {
        tool.audiences.clinician_roles.forEach((role, i) => {
          if (!VALID_CLINICIAN_ROLES.includes(role)) {
            addIssue(`audiences.clinician_roles[${i}]`, `Invalid role: "${role}"`);
          }
        });
      }
    }

    // Practice settings
    if (tool.audiences.practice_settings) {
      if (!Array.isArray(tool.audiences.practice_settings)) {
        addIssue("audiences.practice_settings", "Must be an array");
      } else {
        tool.audiences.practice_settings.forEach((setting, i) => {
          if (!VALID_PRACTICE_SETTINGS.includes(setting)) {
            addIssue(`audiences.practice_settings[${i}]`, `Invalid setting: "${setting}"`);
          }
        });
      }
    }

    // Organization sizes
    if (tool.audiences.organization_sizes) {
      if (!Array.isArray(tool.audiences.organization_sizes)) {
        addIssue("audiences.organization_sizes", "Must be an array");
      } else {
        tool.audiences.organization_sizes.forEach((size, i) => {
          if (!VALID_ORG_SIZES.includes(size)) {
            addIssue(`audiences.organization_sizes[${i}]`, `Invalid size: "${size}"`);
          }
        });
      }
    }
  }

  // ========== FEATURE FLAGS ==========
  if (tool.feature_flags) {
    const requiredFlags = [
      'has_ai', 'has_ehr', 'has_rcm', 'has_telehealth', 'has_measurement',
      'has_e_prescribing', 'has_patient_portal', 'has_mobile_app',
      'is_mental_health_specific', 'is_specialty_agnostic'
    ];
    requiredFlags.forEach(flag => {
      if (typeof tool.feature_flags[flag] !== 'boolean') {
        addIssue(`feature_flags.${flag}`, `Must be boolean, got ${typeof tool.feature_flags[flag]}`, true, false);
      }
    });
  }

  // ========== DESCRIPTIONS ==========
  if (tool.short_description !== undefined && tool.short_description !== null) {
    if (typeof tool.short_description !== 'string') {
      addIssue("short_description", "Must be a string");
    } else if (tool.short_description.length > 200) {
      addIssue("short_description", `Max 200 chars, got ${tool.short_description.length}`, true, tool.short_description.substring(0, 197) + "...");
    }
  }

  if (tool.one_liner !== undefined && tool.one_liner !== null) {
    if (typeof tool.one_liner !== 'string') {
      addIssue("one_liner", "Must be a string");
    } else if (tool.one_liner.length > 200) {
      addIssue("one_liner", `Max 200 chars, got ${tool.one_liner.length}`);
    }
  }

  // ========== URLS ==========
  const urlFields = ['website_url', 'demo_url', 'pricing_url', 'support_url', 'affiliate_url', 'logo_url'];
  urlFields.forEach(field => {
    if (tool[field] !== undefined && tool[field] !== null && tool[field] !== '') {
      if (!isValidURL(tool[field])) {
        addIssue(field, `Invalid URL: "${tool[field]}"`);
      }
    }
  });

  // Screenshot URLs
  if (tool.screenshot_urls) {
    if (!Array.isArray(tool.screenshot_urls)) {
      addIssue("screenshot_urls", "Must be an array");
    } else {
      tool.screenshot_urls.forEach((url, i) => {
        if (!isValidURL(url)) {
          addIssue(`screenshot_urls[${i}]`, `Invalid URL: "${url}"`);
        }
      });
    }
  }

  // ========== PRICING ==========
  if (tool.pricing) {
    if (!VALID_PRICING_MODELS.includes(tool.pricing.model)) {
      addIssue("pricing.model", `Invalid model: "${tool.pricing.model}". Valid: ${VALID_PRICING_MODELS.join(", ")}`);
    }
    if (tool.pricing.starting_price_cents !== undefined && tool.pricing.starting_price_cents !== null) {
      if (typeof tool.pricing.starting_price_cents !== 'number' || tool.pricing.starting_price_cents < 0) {
        addIssue("pricing.starting_price_cents", "Must be non-negative integer");
      }
    }
    if (tool.pricing.free_tier !== undefined && typeof tool.pricing.free_tier !== 'boolean') {
      addIssue("pricing.free_tier", "Must be boolean");
    }
    if (tool.pricing.free_trial_days !== undefined && tool.pricing.free_trial_days !== null) {
      if (typeof tool.pricing.free_trial_days !== 'number' || tool.pricing.free_trial_days < 0) {
        addIssue("pricing.free_trial_days", "Must be non-negative integer");
      }
    }
    if (tool.pricing.quote_required !== undefined && typeof tool.pricing.quote_required !== 'boolean') {
      addIssue("pricing.quote_required", "Must be boolean");
    }
    if (tool.pricing.price_range && !VALID_PRICE_RANGES.includes(tool.pricing.price_range)) {
      addIssue("pricing.price_range", `Invalid range: "${tool.pricing.price_range}"`);
    }
    if (tool.pricing.last_verified && !isValidDate(tool.pricing.last_verified)) {
      addIssue("pricing.last_verified", `Invalid date: "${tool.pricing.last_verified}". Must be YYYY-MM-DD`);
    }
  }

  // ========== COMPLIANCE ==========
  if (tool.compliance) {
    const complianceFields = ['hipaa_support', 'baa_available', 'soc2', 'hitrust', 'gdpr_compliant'];
    complianceFields.forEach(field => {
      const val = tool.compliance[field];
      if (val !== undefined && !VALID_UNCERTAINTY_BOOLEAN.includes(val)) {
        // Check for boolean values (common issue)
        if (val === true) {
          addIssue(`compliance.${field}`, `Invalid value: true. Must be "yes"|"no"|"unknown"|"unverified"`, true, "yes");
        } else if (val === false) {
          addIssue(`compliance.${field}`, `Invalid value: false. Must be "yes"|"no"|"unknown"|"unverified"`, true, "no");
        } else {
          addIssue(`compliance.${field}`, `Invalid value: "${val}". Must be "yes"|"no"|"unknown"|"unverified"`);
        }
      }
    });

    // Optional fields
    if (tool.compliance.soc2_type && !VALID_SOC2_TYPES.includes(tool.compliance.soc2_type)) {
      addIssue("compliance.soc2_type", `Invalid type: "${tool.compliance.soc2_type}"`);
    }

    if (tool.compliance.fedramp !== undefined && !VALID_UNCERTAINTY_BOOLEAN.includes(tool.compliance.fedramp)) {
      addIssue("compliance.fedramp", `Invalid value: "${tool.compliance.fedramp}"`);
    }

    if (tool.compliance.iso27001 !== undefined && !VALID_UNCERTAINTY_BOOLEAN.includes(tool.compliance.iso27001)) {
      addIssue("compliance.iso27001", `Invalid value: "${tool.compliance.iso27001}"`);
    }
  }

  // ========== INTEGRATIONS ==========
  if (tool.integrations) {
    if (!Array.isArray(tool.integrations)) {
      addIssue("integrations", "Must be an array");
    } else {
      tool.integrations.forEach((int, i) => {
        if (!int.name || typeof int.name !== 'string' || int.name.length < 1) {
          addIssue(`integrations[${i}].name`, "Name is required and must be non-empty string");
        }
        if (int.slug && !isValidSlug(int.slug)) {
          addIssue(`integrations[${i}].slug`, `Invalid slug: "${int.slug}"`);
        }
        if (int.category && !VALID_INTEGRATION_CATEGORIES.includes(int.category)) {
          addIssue(`integrations[${i}].category`, `Invalid category: "${int.category}"`);
        }
        if (int.integration_type && !VALID_INTEGRATION_TYPES.includes(int.integration_type)) {
          addIssue(`integrations[${i}].integration_type`, `Invalid type: "${int.integration_type}"`);
        }
        if (int.bidirectional !== undefined && typeof int.bidirectional !== 'boolean') {
          addIssue(`integrations[${i}].bidirectional`, "Must be boolean");
        }
        if (int.verified !== undefined && typeof int.verified !== 'boolean') {
          addIssue(`integrations[${i}].verified`, "Must be boolean");
        }
      });
    }
  }

  // ========== SEO ==========
  if (tool.seo) {
    if (tool.seo.title && tool.seo.title.length > 60) {
      addIssue("seo.title", `Max 60 chars, got ${tool.seo.title.length}`);
    }
    if (tool.seo.meta_description && tool.seo.meta_description.length > 160) {
      addIssue("seo.meta_description", `Max 160 chars, got ${tool.seo.meta_description.length}`);
    }
    if (tool.seo.canonical_url) {
      const canonicalRegex = /^https:\/\/heypsych\.com\/tools\/for-clinicians\/[\w-]+\/$/;
      if (!canonicalRegex.test(tool.seo.canonical_url)) {
        addIssue("seo.canonical_url", `Must match pattern: https://heypsych.com/tools/for-clinicians/{slug}/`);
      }
    }
    if (tool.seo.faqs) {
      if (!Array.isArray(tool.seo.faqs)) {
        addIssue("seo.faqs", "Must be an array");
      } else {
        tool.seo.faqs.forEach((faq, i) => {
          if (!faq.q || faq.q.length < 10) {
            addIssue(`seo.faqs[${i}].q`, "Question must be at least 10 chars");
          }
          if (!faq.a || faq.a.length < 20) {
            addIssue(`seo.faqs[${i}].a`, "Answer must be at least 20 chars");
          }
        });
      }
    }
  }

  // ========== GOVERNANCE ==========
  if (tool.governance) {
    if (typeof tool.governance.needs_review !== 'boolean') {
      addIssue("governance.needs_review", `Must be boolean, got ${typeof tool.governance.needs_review}`, true, false);
    }
    if (tool.governance.last_reviewed && !isValidDate(tool.governance.last_reviewed)) {
      addIssue("governance.last_reviewed", `Invalid date: "${tool.governance.last_reviewed}". Must be YYYY-MM-DD`);
    }
    if (tool.governance.data_quality_score !== undefined && tool.governance.data_quality_score !== null) {
      if (typeof tool.governance.data_quality_score !== 'number' ||
          tool.governance.data_quality_score < 0 ||
          tool.governance.data_quality_score > 100) {
        addIssue("governance.data_quality_score", "Must be number 0-100");
      }
    }
    if (tool.governance.review_priority && !VALID_REVIEW_PRIORITIES.includes(tool.governance.review_priority)) {
      addIssue("governance.review_priority", `Invalid priority: "${tool.governance.review_priority}"`);
    }
    if (tool.governance.reviewed_by_label && tool.governance.reviewed_by_label !== "Reviewed by HeyPsych Board") {
      addIssue("governance.reviewed_by_label", `Must be literal "Reviewed by HeyPsych Board"`);
    }
    if (tool.governance.reviewed_by_url && tool.governance.reviewed_by_url !== "https://heypsych.com/about/medical-review-board") {
      addIssue("governance.reviewed_by_url", `Must be literal "https://heypsych.com/about/medical-review-board"`);
    }
  }

  // ========== TIMESTAMPS ==========
  if (tool.created_at && !isValidDatetime(tool.created_at)) {
    addIssue("created_at", `Invalid datetime: "${tool.created_at}". Must be ISO 8601`);
  }
  if (tool.updated_at && !isValidDatetime(tool.updated_at)) {
    addIssue("updated_at", `Invalid datetime: "${tool.updated_at}". Must be ISO 8601`);
  }

  // ========== DISPLAY SETTINGS ==========
  if (tool.featured !== undefined && typeof tool.featured !== 'boolean') {
    addIssue("featured", "Must be boolean", true, false);
  }
  if (tool.order !== undefined && tool.order !== null) {
    if (!Number.isInteger(tool.order)) {
      addIssue("order", "Must be integer");
    }
  }
  if (tool.status && !VALID_TOOL_STATUSES.includes(tool.status)) {
    addIssue("status", `Invalid status: "${tool.status}". Valid: ${VALID_TOOL_STATUSES.join(", ")}`, true, "active");
  }

  // ========== PUBLISH READY CHECK ==========
  const publishReadyIssues = [];
  if (!tool.name) publishReadyIssues.push("missing name");
  if (!tool.slug) publishReadyIssues.push("missing slug");
  if (!tool.primary_category) publishReadyIssues.push("missing primary_category");
  if (!tool.short_description) publishReadyIssues.push("missing short_description");
  if (tool.compliance?.hipaa_support === "unknown") publishReadyIssues.push("hipaa_support is 'unknown'");
  if (!tool.governance?.last_reviewed) publishReadyIssues.push("missing governance.last_reviewed");
  if (tool.governance?.needs_review !== false) publishReadyIssues.push("governance.needs_review is not false");

  const isPublishReady = publishReadyIssues.length === 0;

  // ========== PUBLISHABLE CHECK ==========
  const publishableIssues = [...publishReadyIssues];
  if (tool.status !== "active") publishableIssues.push(`status is "${tool.status}" (must be "active")`);
  if (tool.lifecycle?.status && !["active", "beta"].includes(tool.lifecycle.status)) {
    publishableIssues.push(`lifecycle.status is "${tool.lifecycle.status}" (must be "active" or "beta")`);
  }

  const isPublishable = publishableIssues.length === 0;

  // ========== ARCHITECT COMPATIBILITY WARNINGS ==========
  // These are warnings, not errors - the adapter handles missing data gracefully
  if (!tool.audiences?.clinician_roles?.length) {
    addWarning("audiences.clinician_roles", "Empty - Architect adapter will allow all roles");
  }
  if (!tool.audiences?.practice_settings?.length) {
    addWarning("audiences.practice_settings", "Empty - Architect adapter will allow all practice types");
  }
  if (!tool.audiences?.organization_sizes?.length) {
    addWarning("audiences.organization_sizes", "Empty - Architect adapter will allow all sizes");
  }
  if (!tool.capabilities?.length) {
    addWarning("capabilities", "Empty - Architect will only derive from primary_category");
  }
  if (!tool.pricing) {
    addWarning("pricing", "Missing - Architect will have no pricing info");
  }

  return {
    slug: tool.slug,
    file: filePath,
    issues,
    warnings,
    fixes,
    isPublishReady,
    isPublishable,
    publishReadyIssues,
    publishableIssues,
  };
}

// ============================================================================
// PROCESS DIRECTORY
// ============================================================================

async function processDirectory(dirName) {
  const dirPath = join(PRODUCTS_DIR, dirName);
  const results = {
    directory: dirName,
    total: 0,
    valid: 0,
    invalid: 0,
    publishReady: 0,
    publishable: 0,
    files: [],
  };

  try {
    const files = await readdir(dirPath);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    for (const file of jsonFiles) {
      results.total++;
      const filePath = join(dirPath, file);

      try {
        const content = await readFile(filePath, 'utf-8');
        const tool = JSON.parse(content);
        const audit = auditTool(tool, filePath);

        if (audit.issues.length === 0) {
          results.valid++;
        } else {
          results.invalid++;
        }

        if (audit.isPublishReady) results.publishReady++;
        if (audit.isPublishable) results.publishable++;

        results.files.push(audit);

      } catch (err) {
        results.invalid++;
        results.files.push({
          slug: file.replace('.json', ''),
          file: filePath,
          issues: [{ field: 'JSON', message: `Parse error: ${err.message}` }],
          warnings: [],
          fixes: [],
          isPublishReady: false,
          isPublishable: false,
          publishReadyIssues: ['JSON parse error'],
          publishableIssues: ['JSON parse error'],
        });
      }
    }
  } catch (err) {
    // Directory doesn't exist
  }

  return results;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const targetDir = process.argv[2];

  console.log('================================================================');
  console.log('COMPREHENSIVE V4 PRODUCT AUDIT');
  console.log('================================================================\n');

  let allResults = [];

  if (targetDir) {
    // Audit single directory
    const results = await processDirectory(targetDir);
    allResults.push(results);
  } else {
    // Audit all directories
    const subdirs = await readdir(PRODUCTS_DIR);
    for (const subdir of subdirs.sort()) {
      const results = await processDirectory(subdir);
      if (results.total > 0) {
        allResults.push(results);
      }
    }
  }

  // Print results
  let grandTotal = 0, grandValid = 0, grandInvalid = 0, grandPublishReady = 0, grandPublishable = 0;
  const allIssues = [];

  for (const results of allResults) {
    console.log(`\n--- ${results.directory} ---`);
    console.log(`Total: ${results.total} | Valid: ${results.valid} | Invalid: ${results.invalid}`);
    console.log(`Publish Ready: ${results.publishReady} | Publishable: ${results.publishable}`);

    grandTotal += results.total;
    grandValid += results.valid;
    grandInvalid += results.invalid;
    grandPublishReady += results.publishReady;
    grandPublishable += results.publishable;

    // Show issues
    for (const file of results.files) {
      if (file.issues.length > 0) {
        console.log(`\n  ${file.slug}:`);
        file.issues.forEach(issue => {
          console.log(`    ❌ ${issue.field}: ${issue.message}`);
          allIssues.push({ dir: results.directory, slug: file.slug, ...issue });
        });
      }
    }
  }

  console.log('\n================================================================');
  console.log('GRAND TOTAL');
  console.log('================================================================');
  console.log(`Total files: ${grandTotal}`);
  console.log(`Schema valid: ${grandValid}`);
  console.log(`Schema invalid: ${grandInvalid}`);
  console.log(`Publish ready: ${grandPublishReady}`);
  console.log(`Publishable: ${grandPublishable}`);
  console.log(`Issues found: ${allIssues.length}`);
  console.log('================================================================\n');

  // Return JSON for parsing
  if (allIssues.length > 0) {
    console.log('ISSUES JSON:');
    console.log(JSON.stringify(allIssues.slice(0, 100), null, 2));
  }

  return {
    total: grandTotal,
    valid: grandValid,
    invalid: grandInvalid,
    publishReady: grandPublishReady,
    publishable: grandPublishable,
    issues: allIssues,
  };
}

main().catch(console.error);
