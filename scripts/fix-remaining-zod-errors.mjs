import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

// Mapping fixes for common issues
const CAPABILITY_FIXES = {
  'online-scheduling': 'appointment-scheduling',
  'patient-forms': 'document-management',
  'session-analytics': 'outcome-tracking',
  'census-management': 'analytics-bi',
  'alumni-tracking': 'crm-lead-management',
  'utilization-review': 'compliance-security',
  'crm-intake': 'crm-lead-management',
  'clinical-documentation': 'clinical-notes',
  'prescription-routing': 'e-prescribing',
  'state-reporting': 'compliance-security',
  'ehr-writes': 'ehr-integration',
  'real-time-communication': 'secure-messaging',
  'appointment-reminders': 'appointment-scheduling',
  'patient-intake': 'document-management',
  'sms-messaging': 'secure-messaging',
  'referral-routing': 'referral-management',
};

const SECONDARY_CATEGORY_FIXES = {
  'billing-rcm': 'billing-rcm-insurance',
  'measurement-dtx': 'measurement-outcomes-dtx',
  'telehealth': 'telehealth-communication',
  'patient-engagement': 'patient-engagement',  // valid
  'credentialing': 'credentialing-workforce',
  'ai-scribe': 'ai-scribe-documentation',
  'provider-network': 'provider-network-virtual-care',
};

const CLINICIAN_ROLE_FIXES = {
  'practice-manager': 'practice-administrator',
  'addiction-counselor': 'therapist-lcsw-lmft',
  'nurse': 'care-coordinator',
  'social-worker': 'therapist-lcsw-lmft',
  'counselor': 'therapist-lcsw-lmft',
  'physician': 'medical-director',
  'primary-care-physician': 'medical-director',
};

const PRACTICE_SETTING_FIXES = {
  'solo-private-practice': 'solo-practice',
  'outpatient-clinic': 'group-practice',
  'inpatient-facility': 'hospital-inpatient',
  'behavioral-health-organization': 'multi-site-enterprise',
  'health-system': 'multi-site-enterprise',
  'urgent-care': 'integrated-care',
  'private-practice': 'solo-practice',
};

const ORGANIZATION_SIZE_FIXES = {
  'solo-1': 'solo',
  'enterprise-200+': 'enterprise-200-plus',
};

const PRICING_MODEL_FIXES = {
  'per-provider': 'per-provider-month',
  'subscription': 'flat-monthly',
  'enterprise': 'enterprise-custom',
  'tiered': 'freemium',
  'custom': 'enterprise-custom',
};

const HIPAA_SUPPORT_FIXES = {
  'full': 'yes',
  'partial': 'yes',
  'enterprise-only': 'yes',
  'true': 'yes',
  'false': 'no',
};

const INTEGRATION_TYPE_FIXES = {
  'embedded': 'native',
  'internal': 'native',
  'chrome-extension': 'api',
  'direct': 'native',
  'bidirectional': 'api',
  'autopilot': 'api',
  'copy-paste': 'api',
  'custom': 'api',
};

const VALID_CAPABILITIES = new Set([
  'clinical-notes', 'treatment-planning', 'appointment-scheduling', 'patient-portal',
  'document-management', 'lab-integration', 'claims-submission', 'eligibility-verification',
  'prior-authorization', 'payment-processing', 'denial-management', 'coding-assistance',
  'patient-financing', 'video-sessions', 'secure-messaging', 'async-video', 'mobile-app',
  'waiting-room', 'ambient-listening', 'note-generation', 'clinical-summarization',
  'voice-transcription', 'ai-suggestions', 'outcome-tracking', 'phq9-gad7', 'custom-assessments',
  'progress-monitoring', 'reporting-dashboards', 'e-prescribing', 'epcs-controlled',
  'pdmp-integration', 'drug-interaction-check', 'medication-history', 'ehr-integration',
  'api-access', 'hl7-fhir', 'zapier-integration', 'calendar-sync', 'hipaa-compliant',
  'baa-available', 'audit-logging', 'consent-management', 'sso-authentication',
  'patient-acquisition', 'reputation-reviews', 'referral-management', 'crm-lead-management',
  'accounting', 'payroll-compensation', 'clinical-supervision', 'quality-assurance',
  'analytics-bi', 'compliance-security', 'workforce-management', 'telehealth', 'billing-rcm', 'coding'
]);

const VALID_SECONDARY_CATEGORIES = new Set([
  'ehr-practice-management', 'billing-rcm-insurance', 'telehealth-communication',
  'credentialing-workforce', 'provider-network-virtual-care', 'measurement-outcomes-dtx',
  'ai-scribe-documentation', 'ai-copilot-clinical', 'clinical-decision-support',
  'patient-engagement', 'intake-scheduling-forms', 'prescribing-erx',
  'compliance-consent-security', 'analytics-reporting', 'care-coordination-referrals',
  'malpractice-insurance', 'marketing-patient-acquisition', 'clinical-supervision'
]);

const VALID_CLINICIAN_ROLES = new Set([
  'psychiatrist', 'psychologist', 'therapist-lcsw-lmft', 'psychiatric-np-pa',
  'practice-administrator', 'billing-specialist', 'care-coordinator', 'medical-director'
]);

const VALID_PRACTICE_SETTINGS = new Set([
  'solo-practice', 'group-practice', 'community-mental-health', 'hospital-inpatient',
  'telehealth-only', 'multi-site-enterprise', 'integrated-care', 'residential-treatment'
]);

const VALID_ORGANIZATION_SIZES = new Set([
  'solo', 'small-2-10', 'medium-11-50', 'large-51-200', 'enterprise-200-plus'
]);

const VALID_PRICING_MODELS = new Set([
  'free', 'freemium', 'per-provider-month', 'per-provider-year', 'per-patient',
  'per-encounter', 'flat-monthly', 'flat-annual', 'enterprise-custom', 'usage-based', 'revenue-share'
]);

const VALID_HIPAA_SUPPORT = new Set(['yes', 'no', 'unknown', 'not_applicable']);
const VALID_BAA_AVAILABLE = new Set(['yes', 'no', 'unknown', 'not_applicable']);
const VALID_SOC2 = new Set(['yes', 'no', 'unknown', 'type1', 'type2']);
const VALID_HITRUST = new Set(['yes', 'no', 'unknown']);
const VALID_INTEGRATION_TYPES = new Set(['native', 'api', 'hl7', 'fhir', 'zapier', 'partner', 'file-based']);

function fixTool(data) {
  let modified = false;

  // Fix capabilities
  if (data.capabilities && Array.isArray(data.capabilities)) {
    const fixedCaps = data.capabilities.map(cap => {
      if (CAPABILITY_FIXES[cap]) {
        modified = true;
        return CAPABILITY_FIXES[cap];
      }
      if (!VALID_CAPABILITIES.has(cap)) {
        modified = true;
        return null; // Will be filtered out
      }
      return cap;
    }).filter(Boolean);
    data.capabilities = [...new Set(fixedCaps)]; // dedupe
  }

  // Fix secondary_categories
  if (data.secondary_categories && Array.isArray(data.secondary_categories)) {
    const fixedCats = data.secondary_categories.map(cat => {
      if (SECONDARY_CATEGORY_FIXES[cat]) {
        modified = true;
        return SECONDARY_CATEGORY_FIXES[cat];
      }
      if (!VALID_SECONDARY_CATEGORIES.has(cat)) {
        modified = true;
        return null;
      }
      return cat;
    }).filter(Boolean);
    data.secondary_categories = [...new Set(fixedCats)];
  }

  // Fix audiences.clinician_roles
  if (data.audiences?.clinician_roles && Array.isArray(data.audiences.clinician_roles)) {
    const fixedRoles = data.audiences.clinician_roles.map(role => {
      if (CLINICIAN_ROLE_FIXES[role]) {
        modified = true;
        return CLINICIAN_ROLE_FIXES[role];
      }
      if (!VALID_CLINICIAN_ROLES.has(role)) {
        modified = true;
        return null;
      }
      return role;
    }).filter(Boolean);
    data.audiences.clinician_roles = [...new Set(fixedRoles)];
  }

  // Fix audiences.practice_settings
  if (data.audiences?.practice_settings && Array.isArray(data.audiences.practice_settings)) {
    const fixedSettings = data.audiences.practice_settings.map(setting => {
      if (PRACTICE_SETTING_FIXES[setting]) {
        modified = true;
        return PRACTICE_SETTING_FIXES[setting];
      }
      if (!VALID_PRACTICE_SETTINGS.has(setting)) {
        modified = true;
        return null;
      }
      return setting;
    }).filter(Boolean);
    data.audiences.practice_settings = [...new Set(fixedSettings)];
  }

  // Fix audiences.organization_sizes
  if (data.audiences?.organization_sizes && Array.isArray(data.audiences.organization_sizes)) {
    const fixedSizes = data.audiences.organization_sizes.map(size => {
      if (ORGANIZATION_SIZE_FIXES[size]) {
        modified = true;
        return ORGANIZATION_SIZE_FIXES[size];
      }
      if (!VALID_ORGANIZATION_SIZES.has(size)) {
        modified = true;
        return null;
      }
      return size;
    }).filter(Boolean);
    data.audiences.organization_sizes = [...new Set(fixedSizes)];
  }

  // Fix pricing.model
  if (data.pricing?.model) {
    if (PRICING_MODEL_FIXES[data.pricing.model]) {
      data.pricing.model = PRICING_MODEL_FIXES[data.pricing.model];
      modified = true;
    } else if (!VALID_PRICING_MODELS.has(data.pricing.model)) {
      data.pricing.model = 'enterprise-custom';
      modified = true;
    }
  }

  // Fix compliance fields
  if (data.compliance) {
    if (data.compliance.hipaa_support && !VALID_HIPAA_SUPPORT.has(data.compliance.hipaa_support)) {
      const fix = HIPAA_SUPPORT_FIXES[data.compliance.hipaa_support];
      data.compliance.hipaa_support = fix || 'yes';
      modified = true;
    }

    if (data.compliance.baa_available && !VALID_BAA_AVAILABLE.has(data.compliance.baa_available)) {
      const fix = HIPAA_SUPPORT_FIXES[data.compliance.baa_available];
      data.compliance.baa_available = fix || 'unknown';
      modified = true;
    }

    if (data.compliance.soc2 && !VALID_SOC2.has(data.compliance.soc2)) {
      if (data.compliance.soc2.toLowerCase().includes('type 2') || data.compliance.soc2.toLowerCase().includes('type2')) {
        data.compliance.soc2 = 'type2';
      } else if (data.compliance.soc2.toLowerCase().includes('type 1') || data.compliance.soc2.toLowerCase().includes('type1')) {
        data.compliance.soc2 = 'type1';
      } else {
        data.compliance.soc2 = 'unknown';
      }
      modified = true;
    }

    if (data.compliance.hitrust && !VALID_HITRUST.has(data.compliance.hitrust)) {
      data.compliance.hitrust = 'unknown';
      modified = true;
    }
  }

  // Fix integrations
  if (data.integrations && Array.isArray(data.integrations)) {
    data.integrations = data.integrations.map(integration => {
      // Convert "type" to "integration_type"
      if (integration.type && !integration.integration_type) {
        integration.integration_type = 'api';
        delete integration.type;
        modified = true;
      }

      // Fix integration_type values
      if (integration.integration_type) {
        if (INTEGRATION_TYPE_FIXES[integration.integration_type]) {
          integration.integration_type = INTEGRATION_TYPE_FIXES[integration.integration_type];
          modified = true;
        } else if (!VALID_INTEGRATION_TYPES.has(integration.integration_type)) {
          integration.integration_type = 'api';
          modified = true;
        }
      }

      // Ensure required fields
      if (!integration.name) {
        return null;
      }
      if (!integration.slug) {
        integration.slug = integration.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        modified = true;
      }
      if (!integration.category) {
        integration.category = 'other';
        modified = true;
      }
      if (!integration.integration_type) {
        integration.integration_type = 'api';
        modified = true;
      }
      if (integration.verified === undefined) {
        integration.verified = false;
        modified = true;
      }

      return integration;
    }).filter(Boolean);
  }

  return modified;
}

// Process all JSON files recursively
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

const dir = 'data/tools-v4/products';
const files = getAllJsonFiles(dir);

let totalFixed = 0;

for (const filepath of files) {
  try {
    const content = readFileSync(filepath, 'utf8');
    const data = JSON.parse(content);

    if (fixTool(data)) {
      writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n');
      totalFixed++;
      console.log(`Fixed: ${filepath.replace(dir + '/', '')}`);
    }
  } catch (e) {
    console.error(`Error processing ${filepath}: ${e.message}`);
  }
}

console.log(`\nTotal files fixed: ${totalFixed}`);
