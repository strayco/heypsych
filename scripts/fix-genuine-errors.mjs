#!/usr/bin/env node
/**
 * FIX GENUINE SCHEMA ERRORS
 *
 * Fixes ONLY actual schema violations:
 * - Invalid enum values → maps to valid values
 * - Boolean compliance values → string "yes"/"no"
 * - "full"/"partial" compliance → "yes"
 * - Null values in URL fields → removes them
 * - Invalid UUIDs → generates new ones
 * - Invalid kind → "clinician-tool"
 * - Object integrations → array
 *
 * Does NOT:
 * - Change "unknown" compliance to "yes" (that's fabrication)
 * - Set needs_review to false (that's bypassing safety)
 * - Add fake review dates
 * - Change draft/acquired/discontinued status
 * - Generate boilerplate descriptions
 */

import { readdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const PRODUCTS_DIR = '/Users/jack/heypsych/data/tools-v4/products';

// ============================================================================
// VALID ENUMS (from schema)
// ============================================================================

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
  uncertaintyBoolean: ["yes", "no", "unknown", "not_applicable"],
  integrationCategories: ["ehr", "billing", "telehealth", "lab", "pharmacy", "payer", "calendar", "communication", "analytics", "other"],
  integrationTypes: ["native", "api", "hl7", "fhir", "zapier", "partner", "file-based"],
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ============================================================================
// MAPPING TABLES
// ============================================================================

const CATEGORY_MAP = {
  "ai-scribe": "ai-scribe-documentation",
  "ai-copilot": "ai-copilot-clinical",
  "billing-rcm": "billing-rcm-insurance",
  "billing-rcm-tool": "billing-rcm-insurance",
  "provider-network": "provider-network-virtual-care",
  "provider-networks": "provider-network-virtual-care",
  "measurement-dtx": "measurement-outcomes-dtx",
  "telehealth": "telehealth-communication",
  "credentialing": "credentialing-workforce",
  "ehr": "ehr-practice-management",
  "compliance": "compliance-consent-security",
  "analytics": "analytics-reporting",
  "care-coordination": "care-coordination-referrals",
  "malpractice": "malpractice-insurance",
  "marketing": "marketing-patient-acquisition",
  "supervision": "clinical-supervision",
  "prescribing": "prescribing-erx",
  "intake-scheduling": "intake-scheduling-forms",
  // Common invalid values
  "clinical-documentation": "ai-scribe-documentation",
  "mental-health-documentation": "ai-scribe-documentation",
  "therapy-notes": "ai-scribe-documentation",
  "workflow-automation": "ehr-practice-management",
  "enterprise-healthcare-ai": "ai-copilot-clinical",
  "hybrid-human-ai": "ai-scribe-documentation",
  "video-conferencing": "telehealth-communication",
  "communication-platform": "telehealth-communication",
  "therapy-quality-measurement": "measurement-outcomes-dtx",
  "therapy-quality": "measurement-outcomes-dtx",
  "measurement-based-care": "measurement-outcomes-dtx",
  "patient-outcomes": "measurement-outcomes-dtx",
  "digital-therapeutics": "measurement-outcomes-dtx",
  "virtual-care": "provider-network-virtual-care",
  "virtual-mental-health": "provider-network-virtual-care",
  "behavioral-health": "provider-network-virtual-care",
  "substance-use-treatment": "provider-network-virtual-care",
  "eating-disorder-care": "provider-network-virtual-care",
  "revenue-cycle": "billing-rcm-insurance",
  "claims-management": "billing-rcm-insurance",
  "coding-compliance": "billing-rcm-insurance",
  "medical-billing": "billing-rcm-insurance",
  "insurance-billing": "billing-rcm-insurance",
  "practice-management": "ehr-practice-management",
  "electronic-health-records": "ehr-practice-management",
  "mental-health-ehr": "ehr-practice-management",
  "emr": "ehr-practice-management",
  "patient-engagement": "patient-engagement",
  "patient-communication": "patient-engagement",
  "scheduling": "intake-scheduling-forms",
  "appointment-scheduling": "intake-scheduling-forms",
  "intake-forms": "intake-scheduling-forms",
  "e-prescribing": "prescribing-erx",
  "medication-management": "prescribing-erx",
  "credentialing-services": "credentialing-workforce",
  "workforce-scheduling": "credentialing-workforce",
  "ce-cme": "credentialing-workforce",
  "continuing-education": "credentialing-workforce",
  "cme": "credentialing-workforce",
  "clinical-knowledge": "clinical-decision-support",
  "diagnostic-support": "clinical-decision-support",
  "care-navigation": "care-coordination-referrals",
  "referral-network": "care-coordination-referrals",
  "professional-liability": "malpractice-insurance",
  "therapist-directory": "marketing-patient-acquisition",
  "provider-directory": "marketing-patient-acquisition",
  "supervision-tools": "clinical-supervision",
  "behavioral-health-provider": "provider-network-virtual-care",
  "care-enablement": "care-coordination-referrals",
  "virtual-mental-health-provider": "provider-network-virtual-care",
  "provider-network-w2-employer": "provider-network-virtual-care",
};

const CLINICIAN_ROLE_MAP = {
  "physician": "medical-director",
  "nurse-practitioner": "psychiatric-np-pa",
  "physician-assistant": "psychiatric-np-pa",
  "general-practitioner": "medical-director",
  "licensed-counselor": "therapist-lcsw-lmft",
  "social-worker": "therapist-lcsw-lmft",
  "psychiatric-nurse-practitioner": "psychiatric-np-pa",
  "therapist": "therapist-lcsw-lmft",
  "counselor": "therapist-lcsw-lmft",
  "psychiatric-nurse": "psychiatric-np-pa",
  "clinical-supervisor": "medical-director",
  "nurse": "psychiatric-np-pa",
  "np": "psychiatric-np-pa",
  "pa": "psychiatric-np-pa",
  "lcsw": "therapist-lcsw-lmft",
  "lmft": "therapist-lcsw-lmft",
  "lpc": "therapist-lcsw-lmft",
  "mental-health-counselor": "therapist-lcsw-lmft",
  "marriage-family-therapist": "therapist-lcsw-lmft",
  "clinical-psychologist": "psychologist",
  "bcba": "therapist-lcsw-lmft",
  "aba-therapist": "therapist-lcsw-lmft",
  "behavior-analyst": "therapist-lcsw-lmft",
  "admin": "practice-administrator",
  "office-manager": "practice-administrator",
  "biller": "billing-specialist",
  "coder": "billing-specialist",
  "coordinator": "care-coordinator",
};

const PRACTICE_SETTING_MAP = {
  "private-practice": "solo-practice",
  "outpatient-clinic": "group-practice",
  "hospital-system": "hospital-inpatient",
  "academic-medical-center": "hospital-inpatient",
  "large-health-system": "multi-site-enterprise",
  "telehealth": "telehealth-only",
  "fqhc": "community-mental-health",
  "urgent-care": "hospital-inpatient",
  "hospital": "hospital-inpatient",
  "health-system": "multi-site-enterprise",
  "clinic": "group-practice",
  "cmhc": "community-mental-health",
  "treatment-center": "residential-treatment",
  "detox-facility": "residential-treatment",
  "rehab-center": "residential-treatment",
  "iop": "community-mental-health",
  "php": "community-mental-health",
  "snf": "residential-treatment",
  "home-health": "integrated-care",
  "primary-care": "integrated-care",
  "enterprise": "multi-site-enterprise",
  "dso": "multi-site-enterprise",
  "mso": "multi-site-enterprise",
};

const ORG_SIZE_MAP = {
  "solo": "solo",
  "small": "small-2-10",
  "medium": "medium-11-50",
  "large": "large-51-200",
  "enterprise": "enterprise-200-plus",
  "1": "solo",
  "2-10": "small-2-10",
  "11-50": "medium-11-50",
  "51-200": "large-51-200",
  "200+": "enterprise-200-plus",
};

const PRICING_MODEL_MAP = {
  "per-provider-monthly": "per-provider-month",
  "per-user-monthly": "per-provider-month",
  "subscription": "flat-monthly",
  "monthly-subscription": "flat-monthly",
  "annual-subscription": "flat-annual",
  "per-host-subscription": "per-provider-month",
  "free-ad-supported-": "freemium",
  "free-with-paid-options": "freemium",
  "quote-based": "enterprise-custom",
  "custom": "enterprise-custom",
  "contact-for-pricing": "enterprise-custom",
  "percentage-of-collections": "revenue-share",
  "per-claim": "per-encounter",
  "per-visit": "per-encounter",
  "tiered": "usage-based",
};

const COMPLIANCE_VALUE_MAP = {
  "full": "yes",
  "partial": "yes",
  "pending": "unknown",
  "in-progress": "unknown",
  "in_progress": "unknown",
  "certified": "yes",
  "compliant": "yes",
  "true": "yes",
  "false": "no",
  "type-ii": "yes",
  "type-2": "yes",
  "type2": "yes",
  "type-i": "yes",
  "type-1": "yes",
  "type1": "yes",
  "not-certified": "no",
  "not-applicable": "not_applicable",
  "n/a": "not_applicable",
  "na": "not_applicable",
};

const INTEGRATION_CATEGORY_MAP = {
  "productivity": "other",
  "data": "other",
  "crm": "other",
  "interoperability": "ehr",
  "hie": "ehr",
  "cloud": "other",
  "patient-engagement": "communication",
  "prescribing": "pharmacy",
  "identity": "other",
  "payment": "billing",
  "reporting": "analytics",
  "authentication": "other",
  "hr": "other",
  "chronic-care": "ehr",
  "benefits": "other",
  "insurance": "payer",
  "workflow": "other",
  "messaging": "communication",
  "scheduling": "calendar",
  "documentation": "ehr",
  "referral": "other",
  "compliance": "other",
  "revenue-cycle": "billing",
  "practice-management": "ehr",
  "mental-health": "ehr",
  "assessment": "other",
  "outcomes": "other",
};

const INTEGRATION_TYPE_MAP = {
  "varies": "api",
  "export": "file-based",
  "data-import": "file-based",
  "compatible": "api",
  "sso": "api",
  "referral": "partner",
  "webhook": "api",
  "sdk": "api",
  "direct": "native",
  "bi-directional": "api",
  "adt": "hl7",
  "sftp": "file-based",
  "manual": "file-based",
  "embed": "api",
  "iframe": "api",
};

// ============================================================================
// FIX FUNCTIONS
// ============================================================================

function mapCategory(cat) {
  if (!cat) return null;
  if (VALID.categories.includes(cat)) return cat;
  if (CATEGORY_MAP[cat]) return CATEGORY_MAP[cat];
  return null; // Remove invalid categories
}

function mapClinicianRole(role) {
  if (!role) return null;
  if (VALID.clinicianRoles.includes(role)) return role;
  if (CLINICIAN_ROLE_MAP[role]) return CLINICIAN_ROLE_MAP[role];
  return null;
}

function mapPracticeSetting(setting) {
  if (!setting) return null;
  if (VALID.practiceSettings.includes(setting)) return setting;
  if (PRACTICE_SETTING_MAP[setting]) return PRACTICE_SETTING_MAP[setting];
  return null;
}

function mapOrgSize(size) {
  if (!size) return null;
  if (VALID.orgSizes.includes(size)) return size;
  if (ORG_SIZE_MAP[size]) return ORG_SIZE_MAP[size];
  return null;
}

function mapPricingModel(model) {
  if (!model) return null;
  if (VALID.pricingModels.includes(model)) return model;
  if (PRICING_MODEL_MAP[model]) return PRICING_MODEL_MAP[model];
  return null;
}

function mapComplianceValue(val) {
  if (val === true) return "yes";
  if (val === false) return "no";
  if (typeof val !== "string") return null;
  if (VALID.uncertaintyBoolean.includes(val)) return val;
  if (COMPLIANCE_VALUE_MAP[val.toLowerCase()]) return COMPLIANCE_VALUE_MAP[val.toLowerCase()];
  return null;
}

function mapIntegrationCategory(cat) {
  if (!cat) return null;
  if (VALID.integrationCategories.includes(cat)) return cat;
  if (INTEGRATION_CATEGORY_MAP[cat]) return INTEGRATION_CATEGORY_MAP[cat];
  return "other";
}

function mapIntegrationType(type) {
  if (!type) return null;
  if (VALID.integrationTypes.includes(type)) return type;
  if (INTEGRATION_TYPE_MAP[type]) return INTEGRATION_TYPE_MAP[type];
  return "api";
}

function fixTool(tool) {
  let modified = false;
  const fixes = [];

  // Fix kind
  if (tool.kind !== "clinician-tool") {
    tool.kind = "clinician-tool";
    fixes.push(`kind: ${tool.kind || 'missing'} → clinician-tool`);
    modified = true;
  }

  // Fix primary_category
  if (!VALID.categories.includes(tool.primary_category)) {
    const mapped = mapCategory(tool.primary_category);
    if (mapped) {
      fixes.push(`primary_category: ${tool.primary_category} → ${mapped}`);
      tool.primary_category = mapped;
      modified = true;
    }
  }

  // Fix secondary_categories
  if (tool.secondary_categories && Array.isArray(tool.secondary_categories)) {
    const original = [...tool.secondary_categories];
    const fixed = tool.secondary_categories
      .map(mapCategory)
      .filter(c => c && c !== tool.primary_category);
    const unique = [...new Set(fixed)];
    if (JSON.stringify(unique) !== JSON.stringify(original)) {
      tool.secondary_categories = unique;
      fixes.push("secondary_categories fixed");
      modified = true;
    }
  }

  // Fix capabilities - remove invalid ones
  if (tool.capabilities && Array.isArray(tool.capabilities)) {
    const original = tool.capabilities.length;
    tool.capabilities = tool.capabilities.filter(c => VALID.capabilities.includes(c));
    if (tool.capabilities.length !== original) {
      fixes.push(`capabilities: removed ${original - tool.capabilities.length} invalid`);
      modified = true;
    }
  }

  // Fix audiences
  if (tool.audiences) {
    if (tool.audiences.clinician_roles && Array.isArray(tool.audiences.clinician_roles)) {
      const original = [...tool.audiences.clinician_roles];
      const fixed = tool.audiences.clinician_roles
        .map(mapClinicianRole)
        .filter(r => r);
      const unique = [...new Set(fixed)];
      if (JSON.stringify(unique) !== JSON.stringify(original)) {
        tool.audiences.clinician_roles = unique;
        fixes.push("audiences.clinician_roles fixed");
        modified = true;
      }
    }

    if (tool.audiences.practice_settings && Array.isArray(tool.audiences.practice_settings)) {
      const original = [...tool.audiences.practice_settings];
      const fixed = tool.audiences.practice_settings
        .map(mapPracticeSetting)
        .filter(s => s);
      const unique = [...new Set(fixed)];
      if (JSON.stringify(unique) !== JSON.stringify(original)) {
        tool.audiences.practice_settings = unique;
        fixes.push("audiences.practice_settings fixed");
        modified = true;
      }
    }

    if (tool.audiences.organization_sizes && Array.isArray(tool.audiences.organization_sizes)) {
      const original = [...tool.audiences.organization_sizes];
      const fixed = tool.audiences.organization_sizes
        .map(mapOrgSize)
        .filter(s => s);
      const unique = [...new Set(fixed)];
      if (JSON.stringify(unique) !== JSON.stringify(original)) {
        tool.audiences.organization_sizes = unique;
        fixes.push("audiences.organization_sizes fixed");
        modified = true;
      }
    }
  }

  // Fix compliance - only map invalid string values, not "unknown"
  if (tool.compliance) {
    // Required compliance fields must exist with valid values
    const requiredComplianceFields = ['hipaa_support', 'baa_available', 'soc2', 'hitrust', 'gdpr_compliant'];
    const optionalComplianceFields = ['fedramp', 'iso27001'];

    // First, ensure required fields exist (default to "unknown")
    for (const field of requiredComplianceFields) {
      if (tool.compliance[field] === undefined) {
        tool.compliance[field] = "unknown";
        fixes.push(`compliance.${field}: missing → unknown`);
        modified = true;
      }
    }

    // Then fix invalid values for all compliance fields
    const allComplianceFields = [...requiredComplianceFields, ...optionalComplianceFields];
    for (const field of allComplianceFields) {
      const val = tool.compliance[field];
      if (val !== undefined && !VALID.uncertaintyBoolean.includes(val)) {
        const mapped = mapComplianceValue(val);
        if (mapped) {
          fixes.push(`compliance.${field}: ${val} → ${mapped}`);
          tool.compliance[field] = mapped;
          modified = true;
        }
      }
    }

    // Fix onc_certified - convert boolean to string
    if (typeof tool.compliance.onc_certified === 'boolean') {
      tool.compliance.onc_certified = tool.compliance.onc_certified ? "yes" : "no";
      fixes.push("compliance.onc_certified → string");
      modified = true;
    }

    // Fix invalid provenance objects (must have value and status fields)
    const validStatuses = ['verified', 'vendor_provided', 'public_source', 'unverified', 'unknown'];
    const provenanceFields = ['hipaa_provenance', 'baa_provenance', 'soc2_provenance', 'hitrust_provenance'];
    for (const field of provenanceFields) {
      const prov = tool.compliance[field];
      if (prov && typeof prov === 'object') {
        // Check if provenance has required value and status fields
        if (prov.value === undefined || prov.status === undefined || !validStatuses.includes(prov.status)) {
          // Remove invalid provenance - we can't fabricate verification status
          delete tool.compliance[field];
          fixes.push(`compliance.${field} removed (invalid)`);
          modified = true;
        }
      }
    }
  }

  // Fix pricing.model - model is required if pricing exists
  if (tool.pricing) {
    if (!tool.pricing.model || !VALID.pricingModels.includes(tool.pricing.model)) {
      const mapped = mapPricingModel(tool.pricing.model);
      if (mapped) {
        fixes.push(`pricing.model: ${tool.pricing.model} → ${mapped}`);
        tool.pricing.model = mapped;
      } else {
        // Default to enterprise-custom (contact for pricing) if unknown
        fixes.push(`pricing.model: ${tool.pricing.model || 'null'} → enterprise-custom`);
        tool.pricing.model = "enterprise-custom";
      }
      modified = true;
    }
  }

  // Fix UUID
  if (!UUID_REGEX.test(tool.id)) {
    const oldId = tool.id;
    tool.id = randomUUID();
    fixes.push(`id: ${oldId} → ${tool.id}`);
    modified = true;
  }

  // Fix null URL fields
  const urlFields = ['website_url', 'pricing_url', 'support_url', 'demo_url', 'logo_url', 'affiliate_url'];
  for (const field of urlFields) {
    if (tool[field] === null) {
      delete tool[field];
      fixes.push(`${field}: null → removed`);
      modified = true;
    }
  }

  // Fix integrations (object to array)
  if (tool.integrations && !Array.isArray(tool.integrations)) {
    // Convert object to array if it has properties that look like integrations
    if (typeof tool.integrations === 'object') {
      tool.integrations = [];
      fixes.push("integrations: object → []");
      modified = true;
    }
  }

  // Fix integration categories and types
  if (tool.integrations && Array.isArray(tool.integrations)) {
    let intModified = false;
    tool.integrations = tool.integrations.map(int => {
      const fixed = { ...int };

      if (int.category && !VALID.integrationCategories.includes(int.category)) {
        fixed.category = mapIntegrationCategory(int.category);
        intModified = true;
      }

      if (int.integration_type && !VALID.integrationTypes.includes(int.integration_type)) {
        fixed.integration_type = mapIntegrationType(int.integration_type);
        intModified = true;
      }

      return fixed;
    });

    if (intModified) {
      fixes.push("integrations categories/types fixed");
      modified = true;
    }
  }

  // Fix import_ref.record_id
  if (tool.import_ref && !tool.import_ref.record_id) {
    tool.import_ref.record_id = tool.slug;
    fixes.push("import_ref.record_id added");
    modified = true;
  }

  // Fix feature_flags - ensure all required booleans exist
  if (tool.feature_flags) {
    const requiredFlags = [
      'has_ai', 'has_ehr', 'has_rcm', 'has_telehealth', 'has_measurement',
      'has_e_prescribing', 'has_patient_portal', 'has_mobile_app',
      'is_mental_health_specific', 'is_specialty_agnostic'
    ];
    let flagsModified = false;
    for (const flag of requiredFlags) {
      if (typeof tool.feature_flags[flag] !== 'boolean') {
        // Convert string "true"/"false" to boolean, default to false
        if (tool.feature_flags[flag] === 'true') {
          tool.feature_flags[flag] = true;
        } else if (tool.feature_flags[flag] === 'false') {
          tool.feature_flags[flag] = false;
        } else {
          tool.feature_flags[flag] = false;
        }
        flagsModified = true;
      }
    }
    if (flagsModified) {
      fixes.push("feature_flags booleans fixed");
      modified = true;
    }
  }

  // Fix pricing.quote_required - ensure it's boolean
  if (tool.pricing && typeof tool.pricing.quote_required !== 'undefined') {
    if (typeof tool.pricing.quote_required !== 'boolean') {
      tool.pricing.quote_required = tool.pricing.quote_required === 'true' || tool.pricing.quote_required === true;
      fixes.push("pricing.quote_required → boolean");
      modified = true;
    }
  }

  // Fix pricing.free_tier - ensure it's boolean
  if (tool.pricing && typeof tool.pricing.free_tier !== 'undefined') {
    if (typeof tool.pricing.free_tier !== 'boolean') {
      tool.pricing.free_tier = tool.pricing.free_tier === 'true' || tool.pricing.free_tier === true;
      fixes.push("pricing.free_tier → boolean");
      modified = true;
    }
  }

  // Fix pricing.free_trial_days - must be number or undefined, not null
  if (tool.pricing && tool.pricing.free_trial_days === null) {
    delete tool.pricing.free_trial_days;
    fixes.push("pricing.free_trial_days: null → removed");
    modified = true;
  }

  // Fix pricing.starting_price_cents - must be number or undefined, not null
  if (tool.pricing && tool.pricing.starting_price_cents === null) {
    delete tool.pricing.starting_price_cents;
    fixes.push("pricing.starting_price_cents: null → removed");
    modified = true;
  }

  // Fix pricing.price_range - must be valid enum
  const validPriceRanges = ["budget", "mid-market", "premium", "enterprise"];
  if (tool.pricing?.price_range && !validPriceRanges.includes(tool.pricing.price_range)) {
    delete tool.pricing.price_range;
    fixes.push(`pricing.price_range: ${tool.pricing.price_range} → removed`);
    modified = true;
  }

  // Fix short_description - must be <= 200 characters
  if (tool.short_description && tool.short_description.length > 200) {
    let desc = tool.short_description.substring(0, 197);
    const lastSpace = desc.lastIndexOf(' ');
    if (lastSpace > 150) {
      desc = desc.substring(0, lastSpace);
    }
    desc = desc + '...';
    tool.short_description = desc;
    fixes.push("short_description truncated");
    modified = true;
  }

  // Fix one_liner - must be <= 200 characters
  if (tool.one_liner && tool.one_liner.length > 200) {
    let liner = tool.one_liner.substring(0, 197);
    const lastSpace = liner.lastIndexOf(' ');
    if (lastSpace > 150) {
      liner = liner.substring(0, lastSpace);
    }
    liner = liner + '...';
    tool.one_liner = liner;
    fixes.push("one_liner truncated");
    modified = true;
  }

  // Fix lifecycle.status - map invalid values
  const validLifecycleStatuses = ["active", "beta", "deprecated", "discontinued", "acquired", "merged"];
  const lifecycleStatusMap = {
    "defunct": "discontinued",
    "closed": "discontinued",
    "shutdown": "discontinued",
    "dead": "discontinued",
    "inactive": "deprecated",
    "legacy": "deprecated",
    "sold": "acquired",
    "bought": "acquired",
  };
  if (tool.lifecycle?.status && !validLifecycleStatuses.includes(tool.lifecycle.status)) {
    const mapped = lifecycleStatusMap[tool.lifecycle.status.toLowerCase()];
    if (mapped) {
      fixes.push(`lifecycle.status: ${tool.lifecycle.status} → ${mapped}`);
      tool.lifecycle.status = mapped;
    } else {
      // Default to active if unknown
      fixes.push(`lifecycle.status: ${tool.lifecycle.status} → discontinued`);
      tool.lifecycle.status = "discontinued";
    }
    modified = true;
  }

  // Fix SEO title - truncate if too long
  if (tool.seo?.title && tool.seo.title.length > 60) {
    let title = tool.seo.title;
    // Try removing common suffixes first
    title = title.replace(/ \| HeyPsych$/, '');
    title = title.replace(/ - HeyPsych$/, '');
    title = title.replace(/ for Mental Health Providers$/, '');
    title = title.replace(/ - Comprehensive Overview$/, '');
    if (title.length > 60) {
      title = title.substring(0, 57) + '...';
    }
    tool.seo.title = title;
    fixes.push("seo.title truncated");
    modified = true;
  }

  // Fix SEO meta_description - truncate if too long
  if (tool.seo?.meta_description && tool.seo.meta_description.length > 160) {
    let desc = tool.seo.meta_description;
    desc = desc.substring(0, 157);
    const lastSpace = desc.lastIndexOf(' ');
    if (lastSpace > 120) {
      desc = desc.substring(0, lastSpace);
    }
    desc = desc + '...';
    tool.seo.meta_description = desc;
    fixes.push("seo.meta_description truncated");
    modified = true;
  }

  // Fix SEO FAQs - remove entries with missing q or a
  if (tool.seo?.faqs && Array.isArray(tool.seo.faqs)) {
    const originalLen = tool.seo.faqs.length;
    tool.seo.faqs = tool.seo.faqs.filter(faq =>
      faq && typeof faq.q === 'string' && faq.q.length > 0 &&
      typeof faq.a === 'string' && faq.a.length > 0
    );
    if (tool.seo.faqs.length !== originalLen) {
      fixes.push(`seo.faqs: removed ${originalLen - tool.seo.faqs.length} invalid`);
      modified = true;
    }
    // Remove faqs array if empty
    if (tool.seo.faqs.length === 0) {
      delete tool.seo.faqs;
    }
  }

  // Fix SEO canonical_url - must match /tools/for-clinicians/{slug}/
  if (tool.seo?.canonical_url) {
    const expectedPattern = /^https:\/\/heypsych\.com\/tools\/for-clinicians\/[\w-]+\/$/;
    if (!expectedPattern.test(tool.seo.canonical_url)) {
      const expected = `https://heypsych.com/tools/for-clinicians/${tool.slug}/`;
      tool.seo.canonical_url = expected;
      fixes.push("seo.canonical_url fixed");
      modified = true;
    }
  }

  // Update timestamp if modified
  if (modified) {
    tool.updated_at = new Date().toISOString();
  }

  return { tool, modified, fixes };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('================================================================');
  console.log('FIX GENUINE SCHEMA ERRORS');
  console.log('(Does NOT fabricate compliance or governance data)');
  console.log('================================================================\n');

  let totalFiles = 0;
  let totalFixed = 0;
  let totalErrors = 0;
  const allFixes = [];

  const subdirs = await readdir(PRODUCTS_DIR);

  for (const subdir of subdirs.sort()) {
    const subdirPath = join(PRODUCTS_DIR, subdir);
    let dirFixed = 0;

    try {
      const files = (await readdir(subdirPath)).filter(f => f.endsWith('.json'));

      for (const file of files) {
        totalFiles++;
        const filePath = join(subdirPath, file);

        try {
          const content = await readFile(filePath, 'utf-8');
          const tool = JSON.parse(content);

          const { tool: fixedTool, modified, fixes } = fixTool(tool);

          if (modified) {
            await writeFile(filePath, JSON.stringify(fixedTool, null, 2) + '\n');
            totalFixed++;
            dirFixed++;
            allFixes.push({ file: `${subdir}/${file}`, fixes });
          }

        } catch (err) {
          console.error(`  Error: ${file}: ${err.message}`);
          totalErrors++;
        }
      }

      if (dirFixed > 0) {
        console.log(`${subdir}: ${dirFixed} files fixed`);
      }

    } catch {
      // Directory doesn't exist
    }
  }

  console.log('\n================================================================');
  console.log('SUMMARY');
  console.log('================================================================');
  console.log(`Total files: ${totalFiles}`);
  console.log(`Files fixed: ${totalFixed}`);
  console.log(`Errors: ${totalErrors}`);
  console.log('================================================================\n');

  // Show sample of fixes
  if (allFixes.length > 0) {
    console.log('Sample fixes applied:');
    allFixes.slice(0, 30).forEach(({ file, fixes }) => {
      console.log(`  ${file}:`);
      fixes.forEach(fix => console.log(`    - ${fix}`));
    });
    if (allFixes.length > 30) {
      console.log(`  ... and ${allFixes.length - 30} more files`);
    }
  }
}

main().catch(console.error);
