#!/usr/bin/env npx tsx
/**
 * Import Compiler for V4 Clinician Tools
 *
 * Processes the master spreadsheet records and generates V4 JSON files.
 *
 * Usage: npx tsx scripts/tools-v4/import-compiler.ts
 *
 * Features:
 * - Filters out Vendor/Company records (137 records)
 * - Excludes Legacy/Defunct status (9 records)
 * - Flags Legacy/Acquired for special handling (91 records)
 * - Merges duplicate canonical_key records (12 conflicts)
 * - Maps categories using taxonomy mappings
 * - Generates V4 JSON with placeholder sections
 * - Skips already enriched files
 */

import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

// ============================================================================
// CONFIGURATION
// ============================================================================

const DATA_ROOT = path.join(process.cwd(), "data/tools-v4");
const MASTER_RECORDS_PATH = path.join(DATA_ROOT, "raw/master-records.json");
const CATEGORY_MAPPINGS_PATH = path.join(DATA_ROOT, "taxonomies/category-mappings.json");
const PRODUCTS_DIR = path.join(DATA_ROOT, "products");
const REPORT_PATH = path.join(DATA_ROOT, "generated/import-report.json");

// ============================================================================
// TYPES
// ============================================================================

interface MasterRecord {
  source_row: number;
  record_id: string;
  company_vendor: string;
  product_tool: string;
  record_type: string;
  primary_category: string;
  subcategory: string;
  mental_health_fit: string;
  status: string;
  ai: string;
  ehr_clinical_record: string;
  rcm_billing: string;
  telehealth_comms: string;
  measurement_outcomes: string;
  target_user_setting: string;
  accelerator: string;
  batch: string;
  region: string;
  notes: string;
  evidence_tier: string;
  source_url: string;
  canonical_key: string;
  same_name_candidate_ids: string;
}

interface CategoryMapping {
  canonical_slug: string;
  spreadsheet_categories: string[];
  synonyms: string[];
  search_terms: string[];
  related_categories: string[];
}

interface CategoryMappings {
  version: string;
  category_mappings: Record<string, CategoryMapping>;
  subcategory_mappings: Record<string, {
    parent: string;
    spreadsheet_values: string[];
    synonyms: string[];
  }>;
  import_value_normalization: {
    case_insensitive: boolean;
    trim_whitespace: boolean;
    strip_special_characters: boolean;
    common_misspellings: Record<string, string>;
  };
}

interface ClinicianToolV4 {
  schema_version: "4.0";
  kind: "clinician-tool";
  id: string;
  slug: string;
  name: string;
  company_name?: string;
  import_ref: {
    record_id: string;
    source_row?: number;
    import_timestamp: string;
    source_file?: string;
    merged_from?: string[];
  };
  lifecycle: {
    status: "active" | "beta" | "deprecated" | "discontinued" | "acquired" | "merged";
    acquired_by?: string;
    notes?: string;
  };
  primary_category: string;
  secondary_categories: string[];
  capabilities: string[];
  audiences: {
    clinician_roles: string[];
    practice_settings: string[];
    organization_sizes: string[];
    specialties?: string[];
  };
  feature_flags: {
    has_ai: boolean;
    has_ehr: boolean;
    has_rcm: boolean;
    has_telehealth: boolean;
    has_measurement: boolean;
    has_e_prescribing: boolean;
    has_patient_portal: boolean;
    has_mobile_app: boolean;
    is_mental_health_specific: boolean;
    is_specialty_agnostic: boolean;
  };
  short_description?: string;
  long_description?: string;
  one_liner?: string;
  best_for?: string[];
  not_for?: string[];
  website_url?: string;
  pricing?: {
    model: string;
    quote_required: boolean;
    notes?: string;
  };
  compliance: {
    hipaa_support: string;
    baa_available: string;
    soc2: string;
    hitrust: string;
    gdpr_compliant: string;
  };
  integrations: Array<{
    name: string;
    slug: string;
    category: string;
    verified: boolean;
  }>;
  seo?: {
    title: string;
    meta_description: string;
    faqs: Array<{ q: string; a: string }>;
    keywords?: string[];
  };
  governance: {
    needs_review: boolean;
    review_priority: "low" | "medium" | "high" | "critical";
    data_quality_score?: number;
  };
  related_tools?: string[];
  created_at: string;
  updated_at: string;
  status: "draft" | "active" | "pending-review" | "archived";
}

interface ImportReport {
  generated_at: string;
  source_file: string;
  total_records: number;
  tools_imported: number;
  tools_skipped: number;
  duplicates_merged: number;
  vendors_excluded: number;
  defunct_excluded: number;
  acquired_flagged: number;
  needs_enrichment: string[];
  validation_errors: Array<{
    record_id: string;
    error: string;
    field?: string;
  }>;
  redirect_mappings: Array<{
    from_slug: string;
    to_slug: string;
    reason: string;
  }>;
  category_distribution: Record<string, number>;
}

// ============================================================================
// CATEGORY MAPPING
// ============================================================================

// V4 canonical category slugs
const V4_CATEGORIES = [
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

// Directory names for each category
const CATEGORY_TO_DIR: Record<string, string> = {
  "ehr-practice-management": "ehr",
  "billing-rcm-insurance": "billing-rcm",
  "telehealth-communication": "telehealth",
  "credentialing-workforce": "credentialing",
  "provider-network-virtual-care": "provider-networks",
  "measurement-outcomes-dtx": "measurement-dtx",
  "ai-scribe-documentation": "ai-scribe",
  "ai-copilot-clinical": "ai-copilot",
  "clinical-decision-support": "clinical-decision-support",
  "patient-engagement": "patient-engagement",
  "intake-scheduling-forms": "intake-scheduling",
  "prescribing-erx": "prescribing",
  "compliance-consent-security": "compliance",
  "analytics-reporting": "analytics",
  "care-coordination-referrals": "care-coordination",
};

// Map spreadsheet categories to V4 categories
const SPREADSHEET_TO_V4: Record<string, string> = {
  "EHR / Practice Management": "ehr-practice-management",
  "AI Copilot / Practice OS": "ai-copilot-clinical",
  "AI Admin / RCM": "billing-rcm-insurance",
  "Measurement / Data": "measurement-outcomes-dtx",
  "Training / Simulation": "clinical-decision-support",
  "AI Scribe / Documentation": "ai-scribe-documentation",
  "AI Scribe / EHR": "ai-scribe-documentation",
  "AI Scribe / Measurement": "ai-scribe-documentation",
  "AI Copilot / Documentation": "ai-copilot-clinical",
  "AI Copilot / Analytics": "ai-copilot-clinical",
  "Clinical QA / Compliance": "compliance-consent-security",
  "Clinical QA / RCM": "billing-rcm-insurance",
  "Utilization Review / RCM": "billing-rcm-insurance",
  "Admissions / AI": "ai-copilot-clinical",
  "AI Scribe / Clinical AI": "ai-scribe-documentation",
  "Telehealth / Communication": "telehealth-communication",
  "Provider Network / Virtual Mental Health": "provider-network-virtual-care",
  "Measurement / Outcomes / Digital Therapeutics": "measurement-outcomes-dtx",
  "Billing / RCM / Insurance": "billing-rcm-insurance",
  "Credentialing / Network / Evidence / Workforce": "credentialing-workforce",
  "Legacy / Acquired / Modules": "ehr-practice-management", // Default for legacy
  "Vendor / Company": "ehr-practice-management", // Should be filtered out
  "Behavioral Health Operations / RCM": "billing-rcm-insurance",
  "Interoperability / Healthcare IT": "care-coordination-referrals",
  "Mental Health Platform": "provider-network-virtual-care",
  "Legacy / Alias": "ehr-practice-management",
};

function mapCategory(spreadsheetCategory: string): string {
  const mapped = SPREADSHEET_TO_V4[spreadsheetCategory];
  if (mapped) return mapped;

  // Try partial match
  const normalized = spreadsheetCategory.toLowerCase();

  if (normalized.includes("ehr") || normalized.includes("practice management")) {
    return "ehr-practice-management";
  }
  if (normalized.includes("billing") || normalized.includes("rcm")) {
    return "billing-rcm-insurance";
  }
  if (normalized.includes("telehealth") || normalized.includes("communication")) {
    return "telehealth-communication";
  }
  if (normalized.includes("credentialing") || normalized.includes("workforce")) {
    return "credentialing-workforce";
  }
  if (normalized.includes("provider network") || normalized.includes("virtual")) {
    return "provider-network-virtual-care";
  }
  if (normalized.includes("measurement") || normalized.includes("outcomes") || normalized.includes("dtx")) {
    return "measurement-outcomes-dtx";
  }
  if (normalized.includes("ai scribe") || normalized.includes("documentation")) {
    return "ai-scribe-documentation";
  }
  if (normalized.includes("ai copilot") || normalized.includes("clinical ai")) {
    return "ai-copilot-clinical";
  }

  // Default fallback
  return "ehr-practice-management";
}

// ============================================================================
// SLUG GENERATION
// ============================================================================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, "") // Remove apostrophes
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, "") // Trim leading/trailing hyphens
    .replace(/-+/g, "-"); // Collapse multiple hyphens
}

function parseFeatureFlags(record: MasterRecord): ClinicianToolV4["feature_flags"] {
  const isYes = (value: string): boolean => {
    const v = (value || "").toLowerCase().trim();
    return v === "yes" || v === "y" || v === "true" || v === "primary";
  };

  const hasAI = (record.ai || "").toLowerCase().includes("yes") ||
                (record.ai || "").toLowerCase().includes("primary") ||
                record.primary_category.toLowerCase().includes("ai");

  const hasEHR = isYes(record.ehr_clinical_record) ||
                 record.primary_category.includes("EHR");

  const hasRCM = isYes(record.rcm_billing) ||
                 record.primary_category.includes("RCM") ||
                 record.primary_category.includes("Billing");

  const hasTelehealth = isYes(record.telehealth_comms) ||
                        record.primary_category.includes("Telehealth");

  const hasMeasurement = isYes(record.measurement_outcomes) ||
                         record.primary_category.includes("Measurement") ||
                         record.primary_category.includes("Outcomes");

  const isMentalHealthSpecific =
    (record.mental_health_fit || "").toLowerCase() === "core" ||
    (record.subcategory || "").toLowerCase().includes("mental") ||
    (record.subcategory || "").toLowerCase().includes("behavioral") ||
    (record.subcategory || "").toLowerCase().includes("psychiatry");

  return {
    has_ai: hasAI,
    has_ehr: hasEHR,
    has_rcm: hasRCM,
    has_telehealth: hasTelehealth,
    has_measurement: hasMeasurement,
    has_e_prescribing: false, // Not in spreadsheet, needs enrichment
    has_patient_portal: false, // Not in spreadsheet, needs enrichment
    has_mobile_app: false, // Not in spreadsheet, needs enrichment
    is_mental_health_specific: isMentalHealthSpecific,
    is_specialty_agnostic: !isMentalHealthSpecific,
  };
}

function parseAudiences(record: MasterRecord): ClinicianToolV4["audiences"] {
  const targetSetting = record.target_user_setting || "";
  const roles: string[] = [];
  const settings: string[] = [];
  const sizes: string[] = [];
  const specialties: string[] = [];

  // Parse clinician roles from target_user_setting
  const targetLower = targetSetting.toLowerCase();

  if (targetLower.includes("psychiatrist")) {
    roles.push("psychiatrist");
  }
  if (targetLower.includes("psychologist")) {
    roles.push("psychologist");
  }
  if (targetLower.includes("therapist") || targetLower.includes("counselor") ||
      targetLower.includes("lcsw") || targetLower.includes("lmft")) {
    roles.push("therapist-lcsw-lmft");
  }
  if (targetLower.includes("np") || targetLower.includes("pa") ||
      targetLower.includes("nurse practitioner") || targetLower.includes("physician assistant")) {
    roles.push("psychiatric-np-pa");
  }
  if (targetLower.includes("administrator") || targetLower.includes("practice manager")) {
    roles.push("practice-administrator");
  }
  if (targetLower.includes("billing")) {
    roles.push("billing-specialist");
  }

  // Parse practice settings
  if (targetLower.includes("solo") || targetLower.includes("individual")) {
    settings.push("solo-practice");
    sizes.push("solo");
  }
  if (targetLower.includes("group") || targetLower.includes("practices")) {
    settings.push("group-practice");
    sizes.push("small-2-10");
  }
  if (targetLower.includes("hospital") || targetLower.includes("inpatient")) {
    settings.push("hospital-inpatient");
    sizes.push("large-51-200");
  }
  if (targetLower.includes("community") || targetLower.includes("cmhc")) {
    settings.push("community-mental-health");
    sizes.push("medium-11-50");
  }
  if (targetLower.includes("enterprise") || targetLower.includes("health system")) {
    settings.push("multi-site-enterprise");
    sizes.push("enterprise-200-plus");
  }
  if (targetLower.includes("telehealth") || targetLower.includes("virtual")) {
    settings.push("telehealth-only");
  }

  // Parse specialties from subcategory
  const subLower = (record.subcategory || "").toLowerCase();
  if (subLower.includes("mental health") || subLower.includes("behavioral health")) {
    specialties.push("mental-health", "behavioral-health");
  }
  if (subLower.includes("psychiatry")) {
    specialties.push("psychiatry");
  }
  if (subLower.includes("therapy")) {
    specialties.push("therapy");
  }
  if (subLower.includes("addiction") || subLower.includes("substance")) {
    specialties.push("addiction-medicine");
  }

  return {
    clinician_roles: [...new Set(roles)],
    practice_settings: [...new Set(settings)],
    organization_sizes: [...new Set(sizes)],
    specialties: [...new Set(specialties)],
  };
}

// ============================================================================
// DUPLICATE HANDLING
// ============================================================================

interface MergedRecord {
  primary: MasterRecord;
  merged_from: string[];
  aliases: string[];
}

function mergeRecords(records: MasterRecord[]): MergedRecord {
  // Sort by source_row to prefer earlier records (usually more authoritative)
  const sorted = [...records].sort((a, b) => a.source_row - b.source_row);
  const primary = sorted[0];
  const merged_from = sorted.slice(1).map(r => r.record_id);

  // Collect all unique product names as aliases
  const aliases = [...new Set(records.map(r => r.product_tool))];

  // Use the more complete record (prefer the one with more filled fields)
  const countFields = (r: MasterRecord): number => {
    return Object.values(r).filter(v => v && String(v).trim()).length;
  };

  let bestRecord = primary;
  let bestCount = countFields(primary);

  for (const record of sorted.slice(1)) {
    const count = countFields(record);
    if (count > bestCount) {
      bestRecord = record;
      bestCount = count;
    }
  }

  return {
    primary: bestRecord,
    merged_from: merged_from.length > 0 ? merged_from : [],
    aliases: aliases.filter(a => a !== bestRecord.product_tool),
  };
}

// ============================================================================
// V4 TOOL GENERATION
// ============================================================================

function generateV4Tool(
  record: MasterRecord,
  mergeInfo?: { merged_from: string[]; aliases: string[] }
): ClinicianToolV4 {
  const now = new Date().toISOString();
  const slug = generateSlug(record.product_tool);
  const category = mapCategory(record.primary_category);

  const tool: ClinicianToolV4 = {
    schema_version: "4.0",
    kind: "clinician-tool",
    id: uuidv4(),
    slug,
    name: record.product_tool,
    company_name: record.company_vendor !== record.product_tool ? record.company_vendor : undefined,
    import_ref: {
      record_id: record.record_id,
      source_row: record.source_row,
      import_timestamp: now,
      source_file: "master-records.json",
      merged_from: mergeInfo?.merged_from,
    },
    lifecycle: {
      status: record.status === "Legacy/Acquired" ? "acquired" : "active",
      notes: record.notes || undefined,
    },
    primary_category: category,
    secondary_categories: [],
    capabilities: [],
    audiences: parseAudiences(record),
    feature_flags: parseFeatureFlags(record),
    short_description: undefined,
    website_url: undefined,
    pricing: {
      model: "enterprise-custom",
      quote_required: true,
      notes: "Pricing information needs verification",
    },
    compliance: {
      hipaa_support: "unknown",
      baa_available: "unknown",
      soc2: "unknown",
      hitrust: "unknown",
      gdpr_compliant: "unknown",
    },
    integrations: [],
    governance: {
      needs_review: true,
      review_priority: determinePriority(record),
      data_quality_score: calculateDataQuality(record),
    },
    related_tools: [],
    created_at: now,
    updated_at: now,
    status: "draft",
  };

  // Add SEO placeholder
  tool.seo = {
    title: `${record.product_tool}: Review & Pricing | HeyPsych`,
    meta_description: `${record.product_tool} review for mental health professionals. Compare features, pricing, and alternatives.`,
    faqs: [],
    keywords: [record.product_tool, category.replace(/-/g, " ")],
  };

  return tool;
}

function determinePriority(record: MasterRecord): "low" | "medium" | "high" | "critical" {
  // Higher priority for mental health core products
  if (record.mental_health_fit === "Core") return "high";

  // Higher priority for active AI tools
  if ((record.ai || "").toLowerCase().includes("yes")) return "high";

  // Medium priority for active EHR/RCM tools
  if (record.primary_category.includes("EHR") || record.primary_category.includes("RCM")) {
    return "medium";
  }

  return "low";
}

function calculateDataQuality(record: MasterRecord): number {
  let score = 0;
  const fields = [
    record.product_tool,
    record.company_vendor,
    record.primary_category,
    record.subcategory,
    record.mental_health_fit,
    record.target_user_setting,
    record.source_url,
  ];

  for (const field of fields) {
    if (field && String(field).trim()) {
      score += 14; // ~100 / 7 fields
    }
  }

  return Math.min(score, 100);
}

function needsEnrichment(tool: ClinicianToolV4): boolean {
  // A tool needs enrichment if it's missing critical data
  return (
    !tool.short_description ||
    !tool.website_url ||
    tool.compliance.hipaa_support === "unknown" ||
    tool.pricing.quote_required ||
    tool.capabilities.length === 0
  );
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

function getExistingTools(): Set<string> {
  const existing = new Set<string>();

  // Scan all category directories
  for (const dir of Object.values(CATEGORY_TO_DIR)) {
    const dirPath = path.join(PRODUCTS_DIR, dir);
    if (fs.existsSync(dirPath)) {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        if (file.endsWith(".json")) {
          const slug = file.replace(".json", "");
          existing.add(slug);
        }
      }
    }
  }

  return existing;
}

function isEnrichedTool(filePath: string): boolean {
  try {
    const content = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    // Consider a tool enriched if it has a description and compliance info
    return (
      content.short_description &&
      content.short_description.length > 50 &&
      (content.compliance?.hipaa_support === true ||
       content.compliance?.hipaa_support === false)
    );
  } catch {
    return false;
  }
}

function writeToolFile(tool: ClinicianToolV4): void {
  const dirName = CATEGORY_TO_DIR[tool.primary_category] || "other";
  const dirPath = path.join(PRODUCTS_DIR, dirName);

  // Ensure directory exists
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filePath = path.join(dirPath, `${tool.slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify(tool, null, 2) + "\n");
}

// ============================================================================
// MAIN IMPORT PROCESS
// ============================================================================

function runImport(): ImportReport {
  console.log("=== V4 Import Compiler ===\n");

  // Load data
  console.log("Loading master records...");
  const records: MasterRecord[] = JSON.parse(
    fs.readFileSync(MASTER_RECORDS_PATH, "utf-8")
  );
  console.log(`  Loaded ${records.length} records\n`);

  // Initialize report
  const report: ImportReport = {
    generated_at: new Date().toISOString(),
    source_file: "master-records.json",
    total_records: records.length,
    tools_imported: 0,
    tools_skipped: 0,
    duplicates_merged: 0,
    vendors_excluded: 0,
    defunct_excluded: 0,
    acquired_flagged: 0,
    needs_enrichment: [],
    validation_errors: [],
    redirect_mappings: [],
    category_distribution: {},
  };

  // Get existing enriched tools
  const existingTools = getExistingTools();
  console.log(`Found ${existingTools.size} existing tool files\n`);

  // Filter records
  console.log("Filtering records...");

  // 1. Exclude Vendor/Company records
  const vendorRecords = records.filter(r => r.record_type === "Vendor / Company");
  report.vendors_excluded = vendorRecords.length;
  console.log(`  Excluded ${vendorRecords.length} Vendor/Company records`);

  // 2. Exclude Legacy/Defunct
  const defunctRecords = records.filter(r => r.status === "Legacy/Defunct");
  report.defunct_excluded = defunctRecords.length;
  console.log(`  Excluded ${defunctRecords.length} Legacy/Defunct records`);

  // 3. Flag Legacy/Acquired
  const acquiredRecords = records.filter(r => r.status === "Legacy/Acquired");
  report.acquired_flagged = acquiredRecords.length;
  console.log(`  Flagged ${acquiredRecords.length} Legacy/Acquired records for special handling`);

  // Filter to processable records
  const processableRecords = records.filter(r =>
    r.record_type !== "Vendor / Company" &&
    r.status !== "Legacy/Defunct"
  );
  console.log(`  ${processableRecords.length} records to process\n`);

  // Group by canonical_key to find duplicates
  console.log("Analyzing duplicates...");
  const byCanonicalKey = new Map<string, MasterRecord[]>();
  for (const record of processableRecords) {
    const key = record.canonical_key;
    if (!byCanonicalKey.has(key)) {
      byCanonicalKey.set(key, []);
    }
    byCanonicalKey.get(key)!.push(record);
  }

  // Process duplicates
  const duplicateGroups = Array.from(byCanonicalKey.entries())
    .filter(([_, records]) => records.length > 1);

  console.log(`  Found ${duplicateGroups.length} duplicate canonical_key groups\n`);

  // Merge duplicates and create redirect mappings
  const mergedRecords: MergedRecord[] = [];
  const singleRecords: MasterRecord[] = [];

  for (const [canonicalKey, group] of byCanonicalKey.entries()) {
    if (group.length > 1) {
      const merged = mergeRecords(group);
      mergedRecords.push(merged);
      report.duplicates_merged++;

      // Create redirect mappings for non-primary slugs
      for (const record of group) {
        if (record.record_id !== merged.primary.record_id) {
          const fromSlug = generateSlug(record.product_tool);
          const toSlug = generateSlug(merged.primary.product_tool);
          if (fromSlug !== toSlug) {
            report.redirect_mappings.push({
              from_slug: fromSlug,
              to_slug: toSlug,
              reason: `Merged duplicate canonical_key: ${canonicalKey}`,
            });
          }
        }
      }
    } else {
      singleRecords.push(group[0]);
    }
  }

  // Process all records
  console.log("Generating V4 JSON files...");

  // Process single records
  for (const record of singleRecords) {
    const slug = generateSlug(record.product_tool);

    // Check if already exists and is enriched
    const category = mapCategory(record.primary_category);
    const dirName = CATEGORY_TO_DIR[category] || "other";
    const filePath = path.join(PRODUCTS_DIR, dirName, `${slug}.json`);

    if (fs.existsSync(filePath) && isEnrichedTool(filePath)) {
      report.tools_skipped++;
      continue;
    }

    try {
      const tool = generateV4Tool(record);
      writeToolFile(tool);
      report.tools_imported++;

      // Track category distribution
      report.category_distribution[category] =
        (report.category_distribution[category] || 0) + 1;

      // Track if needs enrichment
      if (needsEnrichment(tool)) {
        report.needs_enrichment.push(tool.slug);
      }
    } catch (error) {
      report.validation_errors.push({
        record_id: record.record_id,
        error: String(error),
      });
    }
  }

  // Process merged records
  for (const merged of mergedRecords) {
    const slug = generateSlug(merged.primary.product_tool);

    // Check if already exists and is enriched
    const category = mapCategory(merged.primary.primary_category);
    const dirName = CATEGORY_TO_DIR[category] || "other";
    const filePath = path.join(PRODUCTS_DIR, dirName, `${slug}.json`);

    if (fs.existsSync(filePath) && isEnrichedTool(filePath)) {
      report.tools_skipped++;
      continue;
    }

    try {
      const tool = generateV4Tool(merged.primary, {
        merged_from: merged.merged_from,
        aliases: merged.aliases,
      });
      writeToolFile(tool);
      report.tools_imported++;

      // Track category distribution
      report.category_distribution[category] =
        (report.category_distribution[category] || 0) + 1;

      // Track if needs enrichment
      if (needsEnrichment(tool)) {
        report.needs_enrichment.push(tool.slug);
      }
    } catch (error) {
      report.validation_errors.push({
        record_id: merged.primary.record_id,
        error: String(error),
      });
    }
  }

  console.log(`  Imported: ${report.tools_imported}`);
  console.log(`  Skipped (already enriched): ${report.tools_skipped}`);
  console.log(`  Duplicates merged: ${report.duplicates_merged}`);
  console.log(`  Validation errors: ${report.validation_errors.length}\n`);

  // Write report
  console.log("Writing import report...");
  const reportDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2) + "\n");
  console.log(`  Report written to: ${REPORT_PATH}\n`);

  // Summary
  console.log("=== Import Summary ===");
  console.log(`Total records: ${report.total_records}`);
  console.log(`Vendors excluded: ${report.vendors_excluded}`);
  console.log(`Defunct excluded: ${report.defunct_excluded}`);
  console.log(`Acquired flagged: ${report.acquired_flagged}`);
  console.log(`Duplicates merged: ${report.duplicates_merged}`);
  console.log(`Tools imported: ${report.tools_imported}`);
  console.log(`Tools skipped: ${report.tools_skipped}`);
  console.log(`Needs enrichment: ${report.needs_enrichment.length}`);
  console.log(`Validation errors: ${report.validation_errors.length}`);
  console.log("\nCategory distribution:");
  for (const [cat, count] of Object.entries(report.category_distribution).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count}`);
  }

  return report;
}

// Run the import
runImport();
