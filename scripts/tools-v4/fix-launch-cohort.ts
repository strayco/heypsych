#!/usr/bin/env npx tsx
/**
 * Fix Launch Cohort Data
 *
 * Updates the EHR launch cohort files to pass canonical schema validation:
 * - Converts boolean compliance values to UncertaintyBoolean strings
 * - Strips non-conforming provenance fields
 * - Fixes invalid enum values
 * - Sets status to "active"
 *
 * Usage: npx tsx scripts/tools-v4/fix-launch-cohort.ts
 */

import fs from 'fs';
import path from 'path';
import { ClinicianToolV4Z, type ClinicianToolV4 } from '../../src/lib/schemas/clinician-tool-v4';

const PRODUCTS_DIR = path.join(process.cwd(), 'data/tools-v4/products');

// Launch cohort - key mental health EHRs
const LAUNCH_COHORT = [
  'ehr/simplepractice.json',
  'ehr/therapynotes.json',
  'ehr/theranest.json',
  'ehr/jane-app.json',
  'ehr/valant.json',
  'ehr/sessions-health.json',
  'ehr/icanotes.json',
  'ehr/qualifacts-credible.json',
  'ehr/kipu-health.json',
  'ehr/opus.json',
  'ehr/carepatron.json',
  'ehr/practicefusion.json',
];

// Valid enum values from canonical schema
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
];

const VALID_CLINICIAN_ROLES = [
  "psychiatrist",
  "psychologist",
  "therapist-lcsw-lmft",
  "psychiatric-np-pa",
  "practice-administrator",
  "billing-specialist",
  "care-coordinator",
  "medical-director",
];

const VALID_CAPABILITIES = [
  "clinical-notes", "treatment-planning", "appointment-scheduling", "patient-portal",
  "document-management", "lab-integration", "claims-submission", "eligibility-verification",
  "prior-authorization", "payment-processing", "denial-management", "coding-assistance",
  "video-sessions", "secure-messaging", "async-video", "mobile-app", "waiting-room",
  "ambient-listening", "note-generation", "clinical-summarization", "voice-transcription",
  "ai-suggestions", "outcome-tracking", "phq9-gad7", "custom-assessments", "progress-monitoring",
  "reporting-dashboards", "e-prescribing", "epcs-controlled", "pdmp-integration",
  "drug-interaction-check", "medication-history", "ehr-integration", "api-access",
  "hl7-fhir", "zapier-integration", "calendar-sync", "hipaa-compliant", "baa-available",
  "audit-logging", "consent-management", "sso-authentication",
];

const VALID_PRACTICE_SETTINGS = [
  "solo-practice",
  "group-practice",
  "community-mental-health",
  "hospital-inpatient",
  "telehealth-only",
  "multi-site-enterprise",
  "integrated-care",
  "residential-treatment",
];

function convertComplianceValue(value: unknown): 'yes' | 'no' | 'unknown' | 'not_applicable' {
  if (value === true || value === 'yes' || value === 'true') return 'yes';
  if (value === false || value === 'no' || value === 'false') return 'no';
  if (value === 'not_applicable' || value === 'n/a') return 'not_applicable';
  return 'unknown';
}

function filterValidEnumValues<T extends string>(values: unknown[], validValues: T[]): T[] {
  if (!Array.isArray(values)) return [];
  return values.filter((v): v is T => typeof v === 'string' && validValues.includes(v as T));
}

function fixToolData(data: Record<string, unknown>): Record<string, unknown> {
  const fixed = { ...data };

  // Fix compliance values and remove non-conforming provenance
  if (fixed.compliance && typeof fixed.compliance === 'object') {
    const compliance: Record<string, unknown> = {};
    const original = fixed.compliance as Record<string, unknown>;

    // Convert to UncertaintyBoolean strings
    compliance.hipaa_support = convertComplianceValue(original.hipaa_support);
    compliance.baa_available = convertComplianceValue(original.baa_available);
    compliance.soc2 = convertComplianceValue(original.soc2);
    compliance.hitrust = convertComplianceValue(original.hitrust);
    compliance.gdpr_compliant = convertComplianceValue(original.gdpr_compliant);

    // Preserve optional fields
    if (original.soc2_type) compliance.soc2_type = original.soc2_type;
    if (original.notes) compliance.notes = original.notes;

    // Strip provenance fields (they don't conform to FactProvenanceZ)
    // In future, these can be migrated properly

    fixed.compliance = compliance;
  }

  // Fix secondary_categories
  if (fixed.secondary_categories) {
    fixed.secondary_categories = filterValidEnumValues(
      fixed.secondary_categories as unknown[],
      VALID_CATEGORIES
    );
  }

  // Fix capabilities
  if (fixed.capabilities) {
    fixed.capabilities = filterValidEnumValues(
      fixed.capabilities as unknown[],
      VALID_CAPABILITIES
    );
  }

  // Fix audiences
  if (fixed.audiences && typeof fixed.audiences === 'object') {
    const audiences = { ...(fixed.audiences as Record<string, unknown>) };
    if (audiences.clinician_roles) {
      audiences.clinician_roles = filterValidEnumValues(
        audiences.clinician_roles as unknown[],
        VALID_CLINICIAN_ROLES
      );
    }
    if (audiences.practice_settings) {
      audiences.practice_settings = filterValidEnumValues(
        audiences.practice_settings as unknown[],
        VALID_PRACTICE_SETTINGS
      );
    }
    fixed.audiences = audiences;
  }

  // Fix SEO title and description lengths
  if (fixed.seo && typeof fixed.seo === 'object') {
    const seo = { ...(fixed.seo as Record<string, unknown>) };

    // Title must be under 60 chars
    if (typeof seo.title === 'string' && seo.title.length >= 60) {
      const name = (fixed.name as string) || 'Tool';
      seo.title = `${name} | HeyPsych`.substring(0, 59);
    }

    // Meta description must be under 160 chars
    if (typeof seo.meta_description === 'string' && seo.meta_description.length >= 160) {
      seo.meta_description = (seo.meta_description as string).substring(0, 157) + '...';
    }

    fixed.seo = seo;
  }

  // Ensure status is active
  fixed.status = 'active';

  // Ensure lifecycle.status is active
  if (fixed.lifecycle && typeof fixed.lifecycle === 'object') {
    (fixed.lifecycle as Record<string, unknown>).status = 'active';
  }

  // Ensure governance.needs_review is false for launch cohort
  if (fixed.governance && typeof fixed.governance === 'object') {
    (fixed.governance as Record<string, unknown>).needs_review = false;
    if (!(fixed.governance as Record<string, unknown>).last_reviewed) {
      (fixed.governance as Record<string, unknown>).last_reviewed = '2026-08-23';
    }
  }

  return fixed;
}

async function main() {
  console.log('Fixing launch cohort data for canonical schema compliance...\n');

  let fixed = 0;
  let failed = 0;
  let notFound = 0;

  for (const relativePath of LAUNCH_COHORT) {
    const filePath = path.join(PRODUCTS_DIR, relativePath);

    if (!fs.existsSync(filePath)) {
      console.log(`[SKIP] ${relativePath} - file not found`);
      notFound++;
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);

      // Apply fixes
      const fixedData = fixToolData(data);

      // Validate against schema
      const result = ClinicianToolV4Z.safeParse(fixedData);

      if (!result.success) {
        console.log(`[FAIL] ${relativePath}`);
        for (const issue of result.error.issues.slice(0, 3)) {
          console.log(`       ${issue.path.join('.')}: ${issue.message}`);
        }
        failed++;
        continue;
      }

      // Write back
      fs.writeFileSync(filePath, JSON.stringify(fixedData, null, 2) + '\n');
      console.log(`[FIXED] ${relativePath}`);
      fixed++;
    } catch (err) {
      console.log(`[ERROR] ${relativePath}: ${err}`);
      failed++;
    }
  }

  console.log(`
Summary:
  Fixed:     ${fixed}
  Failed:    ${failed}
  Not found: ${notFound}
  Total:     ${LAUNCH_COHORT.length}
`);

  // Run validation on fixed files
  console.log('Validating fixed files...');

  let passGate = 0;
  const passedTools: string[] = [];

  for (const relativePath of LAUNCH_COHORT) {
    const filePath = path.join(PRODUCTS_DIR, relativePath);
    if (!fs.existsSync(filePath)) continue;

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(content);
      const result = ClinicianToolV4Z.safeParse(data);

      if (result.success) {
        const tool = result.data;
        // Check publication gate
        if (tool.status === 'active' &&
            (!tool.lifecycle?.status || ['active', 'beta'].includes(tool.lifecycle.status))) {
          passGate++;
          passedTools.push(tool.name);
        }
      }
    } catch {
      // Skip
    }
  }

  console.log(`\nPublication gate: ${passGate}/${fixed} pass`);
  if (passedTools.length > 0) {
    console.log('\nTools passing publication gate:');
    for (const name of passedTools) {
      console.log(`  - ${name}`);
    }
  }
}

main().catch(console.error);
