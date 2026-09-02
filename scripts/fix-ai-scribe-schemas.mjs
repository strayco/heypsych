import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const dir = 'data/tools-v4/products/ai-scribe';

// Valid enum values from schema
const VALID_CLINICIAN_ROLES = new Set([
  "psychiatrist", "psychologist", "therapist-lcsw-lmft", "psychiatric-np-pa",
  "practice-administrator", "billing-specialist", "care-coordinator", "medical-director"
]);

const VALID_ORGANIZATION_SIZES = new Set([
  "solo", "small-2-10", "medium-11-50", "large-51-200", "enterprise-200-plus"
]);

const VALID_PRICING_MODELS = new Set([
  "free", "freemium", "per-provider-month", "per-provider-year", "per-patient",
  "per-encounter", "flat-monthly", "flat-annual", "enterprise-custom", "usage-based", "revenue-share"
]);

const VALID_INTEGRATION_CATEGORIES = new Set([
  "ehr", "billing", "telehealth", "lab", "pharmacy", "payer", "calendar", "communication", "analytics", "other"
]);

const VALID_PRACTICE_SETTINGS = new Set([
  "solo-practice", "group-practice", "community-mental-health", "hospital-inpatient",
  "telehealth-only", "multi-site-enterprise", "integrated-care", "residential-treatment"
]);

const VALID_CATEGORIES = new Set([
  "ehr-practice-management", "billing-rcm-insurance", "telehealth-communication",
  "credentialing-workforce", "provider-network-virtual-care", "measurement-outcomes-dtx",
  "ai-scribe-documentation", "ai-copilot-clinical", "clinical-decision-support",
  "patient-engagement", "intake-scheduling-forms", "prescribing-erx",
  "compliance-consent-security", "analytics-reporting", "care-coordination-referrals",
  "malpractice-insurance", "marketing-patient-acquisition", "clinical-supervision"
]);

// Mapping fixes
const ROLE_FIXES = {
  "primary-care-physician": "medical-director",
  "counselor": "therapist-lcsw-lmft",
  "nurse-practitioner": "psychiatric-np-pa",
  "physician-assistant": "psychiatric-np-pa",
  "social-worker": "therapist-lcsw-lmft",
};

const ORG_SIZE_FIXES = {
  "enterprise-200+": "enterprise-200-plus",
};

const PRICING_MODEL_FIXES = {
  "ehr-included": "enterprise-custom",
  "tiered-features": "freemium",
  "per-user-month": "per-provider-month",
  "subscription": "flat-monthly",
};

const INTEGRATION_CATEGORY_FIXES = {
  "ai-scribe": "other",
  "payments": "billing",
  "scheduling": "calendar",
  "video": "telehealth",
  "crm": "other",
  "hr": "other",
};

const PRACTICE_SETTING_FIXES = {
  "telehealth": "telehealth-only",
  "outpatient": "group-practice",
  "clinic": "group-practice",
  "private-practice": "solo-practice",
  "enterprise": "multi-site-enterprise",
  "health-system": "multi-site-enterprise",
};

const CATEGORY_FIXES = {
  "practice-management": "ehr-practice-management",
  "ai-scribe": "ai-scribe-documentation",
  "documentation": "ai-scribe-documentation",
  "telehealth": "telehealth-communication",
  "billing": "billing-rcm-insurance",
  "rcm": "billing-rcm-insurance",
  "measurement": "measurement-outcomes-dtx",
  "outcomes": "measurement-outcomes-dtx",
};

const files = readdirSync(dir).filter(f => f.endsWith('.json'));
let totalFixed = 0;

for (const file of files) {
  const filepath = join(dir, file);
  const data = JSON.parse(readFileSync(filepath, 'utf8'));
  let changed = false;

  // Fix clinician_roles
  if (data.audiences?.clinician_roles) {
    const newRoles = [];
    for (const role of data.audiences.clinician_roles) {
      if (VALID_CLINICIAN_ROLES.has(role)) {
        newRoles.push(role);
      } else if (ROLE_FIXES[role]) {
        if (!newRoles.includes(ROLE_FIXES[role])) {
          newRoles.push(ROLE_FIXES[role]);
        }
        console.log(`${file}: role ${role} -> ${ROLE_FIXES[role]}`);
        changed = true;
      } else {
        console.log(`${file}: removed invalid role: ${role}`);
        changed = true;
      }
    }
    if (changed) {
      data.audiences.clinician_roles = newRoles;
    }
  }

  // Fix organization_sizes
  if (data.audiences?.organization_sizes) {
    const newSizes = [];
    for (const size of data.audiences.organization_sizes) {
      if (VALID_ORGANIZATION_SIZES.has(size)) {
        newSizes.push(size);
      } else if (ORG_SIZE_FIXES[size]) {
        if (!newSizes.includes(ORG_SIZE_FIXES[size])) {
          newSizes.push(ORG_SIZE_FIXES[size]);
        }
        console.log(`${file}: size ${size} -> ${ORG_SIZE_FIXES[size]}`);
        changed = true;
      } else {
        console.log(`${file}: removed invalid size: ${size}`);
        changed = true;
      }
    }
    data.audiences.organization_sizes = newSizes;
  }

  // Fix pricing.model
  if (data.pricing?.model) {
    const model = data.pricing.model;
    if (!VALID_PRICING_MODELS.has(model)) {
      if (PRICING_MODEL_FIXES[model]) {
        console.log(`${file}: pricing model ${model} -> ${PRICING_MODEL_FIXES[model]}`);
        data.pricing.model = PRICING_MODEL_FIXES[model];
        changed = true;
      } else {
        console.log(`${file}: unknown pricing model ${model}, using per-provider-month`);
        data.pricing.model = "per-provider-month";
        changed = true;
      }
    }
  }

  // Fix integration categories
  if (data.integrations && Array.isArray(data.integrations)) {
    for (const integration of data.integrations) {
      if (integration.category && !VALID_INTEGRATION_CATEGORIES.has(integration.category)) {
        const oldCat = integration.category;
        if (INTEGRATION_CATEGORY_FIXES[oldCat]) {
          console.log(`${file}: integration category ${oldCat} -> ${INTEGRATION_CATEGORY_FIXES[oldCat]}`);
          integration.category = INTEGRATION_CATEGORY_FIXES[oldCat];
          changed = true;
        } else {
          console.log(`${file}: unknown integration category ${oldCat}, using other`);
          integration.category = "other";
          changed = true;
        }
      }
    }
  }

  // Fix practice_settings
  if (data.audiences?.practice_settings) {
    const newSettings = [];
    for (const setting of data.audiences.practice_settings) {
      if (VALID_PRACTICE_SETTINGS.has(setting)) {
        newSettings.push(setting);
      } else if (PRACTICE_SETTING_FIXES[setting]) {
        if (!newSettings.includes(PRACTICE_SETTING_FIXES[setting])) {
          newSettings.push(PRACTICE_SETTING_FIXES[setting]);
        }
        console.log(`${file}: practice_setting ${setting} -> ${PRACTICE_SETTING_FIXES[setting]}`);
        changed = true;
      } else {
        console.log(`${file}: removed invalid practice_setting: ${setting}`);
        changed = true;
      }
    }
    data.audiences.practice_settings = newSettings;
  }

  // Fix secondary_categories
  if (data.secondary_categories && Array.isArray(data.secondary_categories)) {
    const newCats = [];
    for (const cat of data.secondary_categories) {
      if (VALID_CATEGORIES.has(cat)) {
        newCats.push(cat);
      } else if (CATEGORY_FIXES[cat]) {
        if (!newCats.includes(CATEGORY_FIXES[cat])) {
          newCats.push(CATEGORY_FIXES[cat]);
        }
        console.log(`${file}: secondary_category ${cat} -> ${CATEGORY_FIXES[cat]}`);
        changed = true;
      } else {
        console.log(`${file}: removed invalid secondary_category: ${cat}`);
        changed = true;
      }
    }
    data.secondary_categories = newCats;
  }

  // Fix one_liner too long (max 200)
  if (data.one_liner && data.one_liner.length > 200) {
    const old = data.one_liner;
    data.one_liner = data.one_liner.substring(0, 197) + "...";
    console.log(`${file}: truncated one_liner from ${old.length} to 200 chars`);
    changed = true;
  }

  // Fix short_description too long (max 200)
  if (data.short_description && data.short_description.length > 200) {
    const old = data.short_description;
    data.short_description = data.short_description.substring(0, 197) + "...";
    console.log(`${file}: truncated short_description from ${old.length} to 200 chars`);
    changed = true;
  }

  // Fix starting_price_cents - must be a number (not null or string)
  if (data.pricing) {
    if (data.pricing.starting_price_cents === null) {
      data.pricing.starting_price_cents = 0;
      console.log(`${file}: set null starting_price_cents to 0`);
      changed = true;
    } else if (typeof data.pricing.starting_price_cents === 'string') {
      const parsed = parseInt(data.pricing.starting_price_cents.replace(/[^0-9]/g, ''), 10);
      data.pricing.starting_price_cents = isNaN(parsed) ? 0 : parsed;
      console.log(`${file}: converted starting_price_cents to number: ${data.pricing.starting_price_cents}`);
      changed = true;
    }

    // Also fix free_trial_days if it's null
    if (data.pricing.free_trial_days === null) {
      delete data.pricing.free_trial_days;
      console.log(`${file}: removed null free_trial_days`);
      changed = true;
    }
  }

  // Fix related_tools - should be array of strings, not objects
  if (data.related_tools && Array.isArray(data.related_tools)) {
    const newTools = [];
    for (const tool of data.related_tools) {
      if (typeof tool === 'string') {
        newTools.push(tool);
      } else if (tool && typeof tool === 'object' && tool.slug) {
        newTools.push(tool.slug);
        console.log(`${file}: converted related_tools object to slug: ${tool.slug}`);
        changed = true;
      }
    }
    data.related_tools = newTools;
  }

  // Fix competitor_tools - should be array of strings, not objects
  if (data.competitor_tools && Array.isArray(data.competitor_tools)) {
    const newTools = [];
    for (const tool of data.competitor_tools) {
      if (typeof tool === 'string') {
        newTools.push(tool);
      } else if (tool && typeof tool === 'object' && tool.slug) {
        newTools.push(tool.slug);
        console.log(`${file}: converted competitor_tools object to slug: ${tool.slug}`);
        changed = true;
      }
    }
    data.competitor_tools = newTools;
  }

  // Fix meta_description too long (max 160)
  if (data.seo?.meta_description && data.seo.meta_description.length > 160) {
    const old = data.seo.meta_description;
    data.seo.meta_description = data.seo.meta_description.substring(0, 157) + "...";
    console.log(`${file}: truncated meta_description from ${old.length} to 160 chars`);
    changed = true;
  }

  // Fix compliance values
  if (data.compliance) {
    const VALID_HIPAA = new Set(["yes", "no", "unknown", "not_applicable"]);
    const VALID_SOC2_TYPE = new Set(["type1", "type2", "unknown"]);

    // Fix hipaa_support
    if (data.compliance.hipaa_support && !VALID_HIPAA.has(data.compliance.hipaa_support)) {
      const old = data.compliance.hipaa_support;
      // Map enterprise-only, partial, etc. to appropriate values
      if (old.includes("enterprise") || old.includes("partial") || old.includes("yes")) {
        data.compliance.hipaa_support = "yes";
      } else {
        data.compliance.hipaa_support = "unknown";
      }
      console.log(`${file}: hipaa_support ${old} -> ${data.compliance.hipaa_support}`);
      changed = true;
    }

    // Fix baa_available
    if (data.compliance.baa_available && !VALID_HIPAA.has(data.compliance.baa_available)) {
      const old = data.compliance.baa_available;
      if (old.includes("enterprise") || old.includes("partial") || old.includes("yes")) {
        data.compliance.baa_available = "yes";
      } else {
        data.compliance.baa_available = "unknown";
      }
      console.log(`${file}: baa_available ${old} -> ${data.compliance.baa_available}`);
      changed = true;
    }

    // Fix soc2_type
    if (data.compliance.soc2_type && !VALID_SOC2_TYPE.has(data.compliance.soc2_type)) {
      const old = data.compliance.soc2_type;
      if (old.toLowerCase().includes("ii") || old.toLowerCase().includes("2")) {
        data.compliance.soc2_type = "type2";
      } else if (old.toLowerCase().includes("i") || old.toLowerCase().includes("1")) {
        data.compliance.soc2_type = "type1";
      } else {
        data.compliance.soc2_type = "unknown";
      }
      console.log(`${file}: soc2_type ${old} -> ${data.compliance.soc2_type}`);
      changed = true;
    }
  }

  if (changed) {
    writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n');
    totalFixed++;
  }
}

console.log('\nTotal files fixed:', totalFixed);
