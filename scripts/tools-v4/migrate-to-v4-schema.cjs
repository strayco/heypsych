#!/usr/bin/env node
/**
 * Migrate tools from various formats to V4 schema
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const productsDir = path.join(__dirname, '../../data/tools-v4/products');

function generateUUID() {
  return crypto.randomUUID();
}

function mapCategoryToV4(category) {
  const mappings = {
    'AI Scribe / Clinical Documentation': 'ai-scribe-documentation',
    'AI Scribe / Documentation': 'ai-scribe-documentation',
    'AI Scribe / Clinical AI': 'ai-scribe-documentation',
    'AI Copilot / Clinical': 'ai-copilot-clinical',
    'EHR / Practice Management': 'ehr-practice-management',
    'Billing / RCM / Insurance': 'billing-rcm-insurance',
    'Telehealth / Communication': 'telehealth-communication',
    'Measurement / Outcomes / Digital Therapeutics': 'measurement-outcomes-dtx',
    'Credentialing / Network / Evidence / Workforce': 'credentialing-workforce',
    'Provider Network / Virtual Mental Health': 'provider-networks'
  };
  return mappings[category] || 'ehr-practice-management';
}

function migrateToV4(tool, filePath) {
  // Already V4
  if (tool.schema_version === '4.0' && tool.kind === 'clinician-tool') {
    return null;
  }

  const v4Tool = {
    schema_version: '4.0',
    kind: 'clinician-tool',
    id: tool.id || generateUUID(),
    slug: tool.slug || tool.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: tool.name,
    company_name: tool.company || tool.company_name,
    import_ref: tool.import_ref || {
      source_file: 'ai-scribe-research-2026',
      import_timestamp: new Date().toISOString()
    },
    lifecycle: {
      status: 'active'
    },
    primary_category: mapCategoryToV4(tool.category),
    secondary_categories: [],
    capabilities: (() => {
      if (!tool.features) return [];
      if (Array.isArray(tool.features)) {
        return tool.features.map(f => typeof f === 'string' ? f.toLowerCase().replace(/[^a-z0-9]+/g, '-') : '').filter(Boolean);
      }
      if (typeof tool.features === 'object') {
        // Extract feature names from object
        return Object.keys(tool.features).map(k => k.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
      }
      return [];
    })(),
    audiences: {
      clinician_roles: tool.target_users?.map(u => u.toLowerCase().replace(/[^a-z0-9]+/g, '-')) || [],
      practice_settings: ['solo-practice', 'group-practice'],
      organization_sizes: ['solo', 'small-2-10', 'medium-11-50'],
      specialties: tool.specialties?.map(s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-')) || ['mental-health']
    },
    feature_flags: (() => {
      const hasFeature = (searchTerms) => {
        if (Array.isArray(tool.features)) {
          return tool.features.some(f => typeof f === 'string' && searchTerms.some(t => f.toLowerCase().includes(t)));
        }
        if (tool.features && typeof tool.features === 'object') {
          return Object.keys(tool.features).some(k => searchTerms.some(t => k.toLowerCase().includes(t)));
        }
        return false;
      };
      const hasSpecialty = (searchTerms) => {
        if (Array.isArray(tool.specialties)) {
          return tool.specialties.some(s => searchTerms.some(t => s.toLowerCase().includes(t)));
        }
        return false;
      };
      return {
        has_ai: tool.category?.toLowerCase().includes('ai') || hasFeature(['ai', 'machine learning']),
        has_ehr: tool.category?.toLowerCase().includes('ehr') || hasFeature(['ehr', 'electronic health record']),
        has_rcm: hasFeature(['billing', 'coding', 'rcm', 'revenue cycle']),
        has_telehealth: tool.features?.telehealth || hasFeature(['telehealth', 'video', 'telemedicine']),
        has_measurement: hasFeature(['measurement', 'outcomes', 'phq', 'gad']),
        has_e_prescribing: tool.features?.e_prescribing || hasFeature(['e-prescrib', 'eprescrib', 'prescrib']),
        has_patient_portal: tool.features?.patient_portal || hasFeature(['portal', 'client portal']),
        has_mobile_app: tool.platforms?.mobile || tool.platforms?.ios || tool.platforms?.android || false,
        is_mental_health_specific: hasSpecialty(['mental', 'psych', 'behavioral']) || tool.category?.toLowerCase().includes('mental'),
        is_specialty_agnostic: hasSpecialty(['all specialties']) || false
      };
    })(),
    short_description: tool.description?.substring(0, 200) || '',
    long_description: tool.description || '',
    one_liner: tool.tagline || tool.description?.split('.')[0] || '',
    best_for: tool.best_for || [],
    not_for: (() => {
      if (!tool.limitations) return [];
      if (Array.isArray(tool.limitations)) {
        return tool.limitations.map(l => typeof l === 'string' ? l : l.description || l.limitation || String(l));
      }
      if (typeof tool.limitations === 'object') {
        return Object.values(tool.limitations).filter(v => typeof v === 'string');
      }
      return [];
    })(),
    website_url: tool.website,
    pricing_url: tool.pricing?.url || tool.website + '/pricing',
    pricing: {
      model: tool.pricing?.model?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'subscription',
      starting_price_display: tool.pricing?.starting_price || tool.pricing?.monthly_cost,
      free_tier: tool.pricing?.free_tier || false,
      free_trial_days: tool.pricing?.free_trial ? 14 : 0,
      quote_required: tool.pricing?.enterprise_pricing || false,
      notes: tool.pricing?.details
    },
    compliance: {
      hipaa_support: tool.compliance?.hipaa ? true : 'unknown',
      hipaa_provenance: tool.compliance?.hipaa ? {
        source_url: tool.website,
        verified_date: new Date().toISOString().split('T')[0],
        confidence: 'medium'
      } : undefined,
      baa_available: tool.compliance?.baa ? true : 'unknown',
      soc2: tool.compliance?.soc2 ? 'yes' : 'unknown',
      hitrust: 'unknown',
      gdpr_compliant: 'unknown'
    },
    integrations: (() => {
      let ehrList = [];
      if (Array.isArray(tool.ehr_integrations)) {
        ehrList = tool.ehr_integrations;
      } else if (tool.ehr_integrations?.native_integrations) {
        ehrList = tool.ehr_integrations.native_integrations;
      } else if (tool.integrations && Array.isArray(tool.integrations)) {
        return tool.integrations; // Already in correct format
      }
      return ehrList.map(ehr => ({
        name: ehr,
        slug: ehr.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        category: 'ehr',
        integration_type: 'native',
        verified: true
      }));
    })(),
    seo: {
      title: `${tool.name}: AI Medical Scribe | HeyPsych`,
      meta_description: tool.description?.substring(0, 155) || '',
      faqs: [],
      keywords: [tool.name, 'AI scribe', 'medical documentation', 'clinical notes']
    },
    governance: {
      last_reviewed: new Date().toISOString().split('T')[0],
      needs_review: false,
      review_priority: 'low',
      data_quality_score: 85
    },
    related_tools: tool.competitors?.slice(0, 4).map(c => c.toLowerCase().replace(/[^a-z0-9]+/g, '-')) || [],
    competitor_tools: tool.competitors?.slice(0, 4).map(c => c.toLowerCase().replace(/[^a-z0-9]+/g, '-')) || [],
    company_info: {
      founded_year: tool.founded,
      headquarters: tool.headquarters,
      employee_count: tool.employee_count,
      funding_status: tool.funding?.latest_round ? `${tool.funding.latest_round} (${tool.funding.total})` : undefined
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    featured: tool.featured || false,
    status: 'active'
  };

  // Clean up undefined values
  const clean = (obj) => {
    if (Array.isArray(obj)) {
      return obj.filter(v => v !== undefined && v !== null);
    }
    if (obj && typeof obj === 'object') {
      const cleaned = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value !== undefined && value !== null) {
          cleaned[key] = clean(value);
        }
      }
      return cleaned;
    }
    return obj;
  };

  return clean(v4Tool);
}

function walkDir(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...walkDir(fullPath));
    } else if (item.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
}

function main() {
  const files = walkDir(productsDir);
  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const filePath of files) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const tool = JSON.parse(content);

      const v4Tool = migrateToV4(tool, filePath);

      if (v4Tool) {
        fs.writeFileSync(filePath, JSON.stringify(v4Tool, null, 2) + '\n');
        migrated++;
        console.log(`Migrated: ${path.basename(filePath)}`);
      } else {
        skipped++;
      }
    } catch (err) {
      console.error(`Error migrating ${filePath}:`, err.message);
      errors++;
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Migrated: ${migrated}`);
  console.log(`  Skipped (already V4): ${skipped}`);
  console.log(`  Errors: ${errors}`);
}

main();
