// src/lib/schemas/clinician-tool-v4.ts
// V4 Clinician Tool Schema - Designed for master spreadsheet import
// Supports EHR, RCM, Telehealth, AI Scribe, and clinical practice tools

import { z } from "zod";
import {
  UncertaintyBooleanZ,
  ToolEditorialMetadataZ,
  FactProvenanceZ,
  type UncertaintyBoolean,
} from "./tool-editorial";

// ============================================================================
// SCHEMA VERSION
// ============================================================================

export const CLINICIAN_TOOL_SCHEMA_VERSION = "4.0" as const;

// ============================================================================
// CATEGORY ENUMS
// ============================================================================

/**
 * Primary product categories for clinician tools
 * Derived from master spreadsheet categories
 */
export const ClinicianProductCategoryZ = z.enum([
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
  // Architect practice area categories
  "marketing-patient-acquisition",
  "clinical-supervision",
]);

/**
 * Human-readable labels for product categories
 */
export const CLINICIAN_PRODUCT_CATEGORY_LABELS: Record<
  z.infer<typeof ClinicianProductCategoryZ>,
  string
> = {
  "ehr-practice-management": "EHR & Practice Management",
  "billing-rcm-insurance": "Billing, RCM & Insurance",
  "telehealth-communication": "Telehealth & Communication",
  "credentialing-workforce": "Credentialing & Workforce",
  "provider-network-virtual-care": "Provider Network & Virtual Care",
  "measurement-outcomes-dtx": "Measurement, Outcomes & DTx",
  "ai-scribe-documentation": "AI Scribe & Documentation",
  "ai-copilot-clinical": "AI Copilot & Clinical AI",
  "clinical-decision-support": "Clinical Decision Support",
  "patient-engagement": "Patient Engagement",
  "intake-scheduling-forms": "Intake, Scheduling & Forms",
  "prescribing-erx": "Prescribing & e-Rx",
  "compliance-consent-security": "Compliance, Consent & Security",
  "analytics-reporting": "Analytics & Reporting",
  "care-coordination-referrals": "Care Coordination & Referrals",
  "malpractice-insurance": "Malpractice Insurance",
  // Architect practice area categories
  "marketing-patient-acquisition": "Marketing & Patient Acquisition",
  "clinical-supervision": "Clinical Supervision",
};

/**
 * Mapping from tool schema category slugs to V4 taxonomy URL slugs.
 * The V4 taxonomy uses shorter, SEO-friendly slugs for URLs.
 */
export const SCHEMA_TO_TAXONOMY_CATEGORY: Record<
  z.infer<typeof ClinicianProductCategoryZ>,
  string
> = {
  "ehr-practice-management": "ehr-practice-management",
  "billing-rcm-insurance": "billing-rcm",
  "telehealth-communication": "telehealth-communication",
  "credentialing-workforce": "credentialing-workforce",
  "provider-network-virtual-care": "provider-networks",
  "measurement-outcomes-dtx": "measurement-outcomes",
  "ai-scribe-documentation": "ai-scribe-documentation",
  "ai-copilot-clinical": "clinical-decision-support", // AI clinical tools → CDS
  "clinical-decision-support": "clinical-decision-support",
  "patient-engagement": "patient-engagement",
  "intake-scheduling-forms": "scheduling-intake",
  "prescribing-erx": "prescribing-erx",
  "compliance-consent-security": "compliance-security",
  "analytics-reporting": "analytics-reporting",
  "care-coordination-referrals": "care-coordination",
  "malpractice-insurance": "malpractice-insurance",
  // Architect practice area categories
  "marketing-patient-acquisition": "marketing-patient-acquisition",
  "clinical-supervision": "clinical-supervision",
};

/**
 * Reverse mapping: V4 taxonomy slug → schema category slugs that map to it.
 * Multiple schema categories can map to the same taxonomy category.
 */
export const TAXONOMY_TO_SCHEMA_CATEGORIES: Record<string, z.infer<typeof ClinicianProductCategoryZ>[]> = {
  "ehr-practice-management": ["ehr-practice-management"],
  "billing-rcm": ["billing-rcm-insurance"],
  "telehealth-communication": ["telehealth-communication"],
  "credentialing-workforce": ["credentialing-workforce"],
  "provider-networks": ["provider-network-virtual-care"],
  "measurement-outcomes": ["measurement-outcomes-dtx"],
  "ai-scribe-documentation": ["ai-scribe-documentation"],
  "clinical-decision-support": ["clinical-decision-support", "ai-copilot-clinical"],
  "patient-engagement": ["patient-engagement"],
  "scheduling-intake": ["intake-scheduling-forms"],
  "prescribing-erx": ["prescribing-erx"],
  "compliance-security": ["compliance-consent-security"],
  "analytics-reporting": ["analytics-reporting"],
  "care-coordination": ["care-coordination-referrals"],
  "malpractice-insurance": ["malpractice-insurance"],
  // Architect practice area categories
  "marketing-patient-acquisition": ["marketing-patient-acquisition"],
  "clinical-supervision": ["clinical-supervision"],
  // Categories with no current tool data mapping (need new tools)
  "digital-therapeutics": [], // Could map from measurement-outcomes-dtx
};

// ============================================================================
// AUDIENCE ENUMS
// ============================================================================

/**
 * Target clinician roles
 */
export const ClinicianRoleZ = z.enum([
  "psychiatrist",
  "psychologist",
  "therapist-lcsw-lmft",
  "psychiatric-np-pa",
  "practice-administrator",
  "billing-specialist",
  "care-coordinator",
  "medical-director",
]);

export const CLINICIAN_ROLE_LABELS: Record<z.infer<typeof ClinicianRoleZ>, string> = {
  psychiatrist: "Psychiatrist",
  psychologist: "Psychologist",
  "therapist-lcsw-lmft": "Therapist (LCSW/LMFT)",
  "psychiatric-np-pa": "Psychiatric NP/PA",
  "practice-administrator": "Practice Administrator",
  "billing-specialist": "Billing Specialist",
  "care-coordinator": "Care Coordinator",
  "medical-director": "Medical Director",
};

/**
 * Practice setting types
 */
export const PracticeSettingZ = z.enum([
  "solo-practice",
  "group-practice",
  "community-mental-health",
  "hospital-inpatient",
  "telehealth-only",
  "multi-site-enterprise",
  "integrated-care",
  "residential-treatment",
]);

export const PRACTICE_SETTING_LABELS: Record<z.infer<typeof PracticeSettingZ>, string> = {
  "solo-practice": "Solo Practice",
  "group-practice": "Group Practice",
  "community-mental-health": "Community Mental Health Center",
  "hospital-inpatient": "Hospital / Inpatient",
  "telehealth-only": "Telehealth Only",
  "multi-site-enterprise": "Multi-Site / Enterprise",
  "integrated-care": "Integrated Care",
  "residential-treatment": "Residential Treatment",
};

/**
 * Organization size
 */
export const OrganizationSizeZ = z.enum([
  "solo",
  "small-2-10",
  "medium-11-50",
  "large-51-200",
  "enterprise-200-plus",
]);

export const ORGANIZATION_SIZE_LABELS: Record<z.infer<typeof OrganizationSizeZ>, string> = {
  solo: "Solo (1 provider)",
  "small-2-10": "Small (2-10 providers)",
  "medium-11-50": "Medium (11-50 providers)",
  "large-51-200": "Large (51-200 providers)",
  "enterprise-200-plus": "Enterprise (200+ providers)",
};

// ============================================================================
// LIFECYCLE & STATUS
// ============================================================================

/**
 * Product lifecycle status
 */
export const ClinicianToolLifecycleStatusZ = z.enum([
  "active",
  "beta",
  "deprecated",
  "discontinued",
  "acquired",
  "merged",
]);

/**
 * Lifecycle metadata for tracking product status
 */
export const ClinicianToolLifecycleZ = z.object({
  status: ClinicianToolLifecycleStatusZ,
  discontinued_at: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format")
    .optional(),
  acquired_by: z.string().optional(),
  acquisition_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format")
    .optional(),
  successor_slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  notes: z.string().optional(),
});

/**
 * Default lifecycle value for schema defaults
 */
const DEFAULT_LIFECYCLE: z.infer<typeof ClinicianToolLifecycleZ> = {
  status: "active",
};

// ============================================================================
// IMPORT REFERENCE
// ============================================================================

/**
 * Reference to original spreadsheet data for traceability
 */
export const ImportReferenceZ = z.object({
  record_id: z.string().min(1, "Record ID required"),
  source_row: z.number().int().positive().optional(),
  import_timestamp: z.string().datetime().optional(),
  raw_checksum: z.string().optional(),
  source_file: z.string().optional(),
  source_sheet: z.string().optional(),
});

// ============================================================================
// CAPABILITY SLUGS
// ============================================================================

/**
 * Granular capability slugs for filtering
 */
export const CapabilitySlugZ = z.enum([
  // EHR Capabilities
  "clinical-notes",
  "treatment-planning",
  "appointment-scheduling",
  "patient-portal",
  "document-management",
  "lab-integration",

  // Billing/RCM Capabilities
  "claims-submission",
  "eligibility-verification",
  "prior-authorization",
  "payment-processing",
  "denial-management",
  "coding-assistance",
  "patient-financing",

  // Telehealth Capabilities
  "video-sessions",
  "secure-messaging",
  "async-video",
  "mobile-app",
  "waiting-room",

  // AI Capabilities
  "ambient-listening",
  "note-generation",
  "clinical-summarization",
  "voice-transcription",
  "ai-suggestions",

  // Measurement Capabilities
  "outcome-tracking",
  "phq9-gad7",
  "custom-assessments",
  "progress-monitoring",
  "reporting-dashboards",

  // Prescribing Capabilities
  "e-prescribing",
  "epcs-controlled",
  "pdmp-integration",
  "drug-interaction-check",
  "medication-history",

  // Integration Capabilities
  "ehr-integration",
  "api-access",
  "hl7-fhir",
  "zapier-integration",
  "calendar-sync",

  // Compliance Capabilities
  "hipaa-compliant",
  "baa-available",
  "audit-logging",
  "consent-management",
  "sso-authentication",

  // Architect Practice Area Capabilities
  // Growth
  "patient-acquisition",
  "reputation-reviews",
  "referral-management",
  "crm-lead-management",
  // Operations
  "accounting",
  "payroll-compensation",
  "clinical-supervision",
  "quality-assurance",
  "analytics-bi",
  "compliance-security",
  "workforce-management",
  // Care
  "telehealth",
  "billing-rcm",
  "coding",
]);

// ============================================================================
// PRICING SCHEMA
// ============================================================================

/**
 * Pricing model types for clinician tools
 */
export const ClinicianPricingModelZ = z.enum([
  "free",
  "freemium",
  "per-provider-month",
  "per-provider-year",
  "per-patient",
  "per-encounter",
  "flat-monthly",
  "flat-annual",
  "enterprise-custom",
  "usage-based",
  "revenue-share",
]);

/**
 * Structured pricing information
 */
export const ClinicianPricingZ = z.object({
  model: ClinicianPricingModelZ,
  starting_price_cents: z.number().int().nonnegative().optional(),
  starting_price_display: z.string().optional(), // e.g., "$99/provider/month"
  free_tier: z.boolean().optional(),
  free_trial_days: z.number().int().nonnegative().optional(),
  quote_required: z.boolean().optional(),
  price_range: z.enum(["budget", "mid-market", "premium", "enterprise"]).optional(),
  notes: z.string().optional(),
  last_verified: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format")
    .optional(),
});

// ============================================================================
// COMPLIANCE SCHEMA
// ============================================================================

/**
 * Compliance value with provenance
 */
export const ComplianceValueWithProvenanceZ = z.object({
  value: UncertaintyBooleanZ,
  provenance: FactProvenanceZ.optional(),
});

/**
 * Compliance and security information
 */
export const ClinicianComplianceZ = z.object({
  hipaa_support: UncertaintyBooleanZ,
  hipaa_provenance: FactProvenanceZ.optional(),

  baa_available: UncertaintyBooleanZ,
  baa_provenance: FactProvenanceZ.optional(),

  soc2: UncertaintyBooleanZ,
  soc2_type: z.enum(["type1", "type2", "unknown"]).optional(),
  soc2_provenance: FactProvenanceZ.optional(),

  hitrust: UncertaintyBooleanZ,
  hitrust_provenance: FactProvenanceZ.optional(),

  gdpr_compliant: UncertaintyBooleanZ,

  // Additional certifications
  fedramp: UncertaintyBooleanZ.optional(),
  iso27001: UncertaintyBooleanZ.optional(),

  notes: z.string().optional(),
});

/**
 * Default compliance value for schema defaults
 */
const DEFAULT_COMPLIANCE: z.infer<typeof ClinicianComplianceZ> = {
  hipaa_support: "unknown",
  baa_available: "unknown",
  soc2: "unknown",
  hitrust: "unknown",
  gdpr_compliant: "unknown",
};

// ============================================================================
// INTEGRATION SCHEMA
// ============================================================================

/**
 * Integration with other systems
 */
export const ClinicianIntegrationZ = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens")
    .optional(),
  category: z.enum([
    "ehr",
    "billing",
    "telehealth",
    "lab",
    "pharmacy",
    "payer",
    "calendar",
    "communication",
    "analytics",
    "other",
  ]).optional(),
  integration_type: z.enum([
    "native",
    "api",
    "hl7",
    "fhir",
    "zapier",
    "partner",
    "file-based",
  ]).optional(),
  bidirectional: z.boolean().optional(),
  verified: z.boolean().default(false),
  notes: z.string().optional(),
});

// ============================================================================
// AUDIENCE SCHEMA
// ============================================================================

/**
 * Target audiences for the tool
 */
export const ClinicianAudiencesZ = z.object({
  clinician_roles: z.array(ClinicianRoleZ),
  practice_settings: z.array(PracticeSettingZ),
  organization_sizes: z.array(OrganizationSizeZ),
  specialties: z.array(z.string()).optional(), // e.g., "child-adolescent", "geriatric"
});

/**
 * Default audiences value for schema defaults
 */
const DEFAULT_AUDIENCES = {
  clinician_roles: [] as z.infer<typeof ClinicianRoleZ>[],
  practice_settings: [] as z.infer<typeof PracticeSettingZ>[],
  organization_sizes: [] as z.infer<typeof OrganizationSizeZ>[],
};

// ============================================================================
// FEATURE FLAGS SCHEMA
// ============================================================================

/**
 * Boolean feature flags for quick filtering
 */
export const ClinicianFeatureFlagsZ = z.object({
  has_ai: z.boolean(),
  has_ehr: z.boolean(),
  has_rcm: z.boolean(),
  has_telehealth: z.boolean(),
  has_measurement: z.boolean(),
  has_e_prescribing: z.boolean(),
  has_patient_portal: z.boolean(),
  has_mobile_app: z.boolean(),
  is_mental_health_specific: z.boolean(),
  is_specialty_agnostic: z.boolean(),
});

/**
 * Default feature flags value for schema defaults
 */
const DEFAULT_FEATURE_FLAGS: z.infer<typeof ClinicianFeatureFlagsZ> = {
  has_ai: false,
  has_ehr: false,
  has_rcm: false,
  has_telehealth: false,
  has_measurement: false,
  has_e_prescribing: false,
  has_patient_portal: false,
  has_mobile_app: false,
  is_mental_health_specific: false,
  is_specialty_agnostic: false,
};

// ============================================================================
// COMPANY INFO SCHEMA
// ============================================================================

/**
 * Company information for clinician tools
 */
export const ClinicianCompanyInfoZ = z.object({
  founded_year: z.number().int().min(1900).max(2100).optional(),
  headquarters: z.string().optional(),
  employee_count: z.string().optional(),
  funding_total: z.string().optional(),
  funding_stage: z.string().optional(),
  customer_count: z.string().optional(),
  notable_investors: z.array(z.string()).optional(),
});

// ============================================================================
// FEATURES SCHEMA (AI Scribe specific fields)
// ============================================================================

/**
 * Ambient AI feature info
 */
export const AmbientAIZ = z.object({
  supported: z.boolean().optional(),
  description: z.string().optional(),
});

/**
 * Extended features for clinician tools (especially AI scribes)
 */
export const ClinicianFeaturesZ = z.object({
  ambient_ai: AmbientAIZ.optional(),
  note_types: z.array(z.string()).optional(),
  specialty_templates: z.boolean().optional(),
  custom_templates: z.boolean().optional(),
  voice_commands: z.boolean().optional(),
  multi_language: z.boolean().optional(),
  accuracy_rate: z.string().optional(),
});

// ============================================================================
// SEO SCHEMA
// ============================================================================

/**
 * FAQ schema for SEO
 */
export const ClinicianFAQZ = z.object({
  q: z.string().min(10, "FAQ question must be at least 10 characters"),
  a: z.string().min(20, "FAQ answer must be at least 20 characters"),
});

/**
 * SEO metadata for clinician tools
 */
export const ClinicianSEOZ = z.object({
  title: z.string().max(60, "SEO title should be under 60 characters"),
  meta_description: z.string().max(160, "Meta description should be under 160 characters"),
  canonical_url: z
    .string()
    .regex(
      /^https:\/\/heypsych\.com\/tools\/for-clinicians\/[\w-]+\/$/,
      "Canonical must match /tools/for-clinicians/{slug}/"
    )
    .optional(),
  faqs: z.array(ClinicianFAQZ).default([]),
  keywords: z.array(z.string()).optional(),
});

// ============================================================================
// GOVERNANCE SCHEMA
// ============================================================================

/**
 * Review and governance metadata
 */
export const ClinicianGovernanceZ = z.object({
  reviewed_by_label: z.literal("Reviewed by HeyPsych Board").optional(),
  reviewed_by_url: z.literal("https://heypsych.com/about/medical-review-board").optional(),
  last_reviewed: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format")
    .optional(),
  review_notes: z.string().optional(),
  data_quality_score: z.number().min(0).max(100).optional(),
  needs_review: z.boolean(),
  review_priority: z.enum(["low", "medium", "high", "critical"]).optional(),
});

/**
 * Default governance value for schema defaults
 */
const DEFAULT_GOVERNANCE: z.infer<typeof ClinicianGovernanceZ> = {
  needs_review: true,
};

// ============================================================================
// MAIN V4 CLINICIAN TOOL SCHEMA
// ============================================================================

export const ClinicianToolV4Z = z.object({
  // Schema identification
  schema_version: z.literal("4.0"),
  kind: z.literal("clinician-tool"),

  // Identity
  id: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  name: z.string().min(2).max(150),
  company_name: z.string().min(1).max(150).optional(),

  // Company info (includes founded_year, headquarters, etc.)
  company: ClinicianCompanyInfoZ.optional(),

  // Import reference for traceability
  import_ref: ImportReferenceZ.optional(),

  // Lifecycle tracking
  lifecycle: ClinicianToolLifecycleZ.default(DEFAULT_LIFECYCLE),

  // Classification
  primary_category: ClinicianProductCategoryZ,
  secondary_categories: z.array(ClinicianProductCategoryZ).default([]),
  capabilities: z.array(CapabilitySlugZ).default([]),

  // Target audiences
  audiences: ClinicianAudiencesZ.default(DEFAULT_AUDIENCES),

  // Feature flags for filtering
  feature_flags: ClinicianFeatureFlagsZ.default(DEFAULT_FEATURE_FLAGS),

  // Extended features (AI scribe specific fields like ambient_ai, note_types, etc.)
  features: ClinicianFeaturesZ.optional(),

  // Descriptions
  short_description: z.string().max(200).optional(),
  long_description: z.string().optional(),
  one_liner: z.string().max(200).optional(),

  // Use cases
  best_for: z.array(z.string()).optional(),
  not_for: z.array(z.string()).optional(),

  // Links
  website_url: z.string().url().optional(),
  demo_url: z.string().url().optional(),
  pricing_url: z.string().url().optional(),
  support_url: z.string().url().optional(),
  affiliate_url: z.string().url().optional(), // Affiliate link for monetization

  // Logo and media
  logo_url: z.string().url().optional(),
  screenshot_urls: z.array(z.string().url()).optional(),

  // Pricing
  pricing: ClinicianPricingZ.optional(),

  // Compliance and security
  compliance: ClinicianComplianceZ.default(DEFAULT_COMPLIANCE),

  // Integrations
  integrations: z.array(ClinicianIntegrationZ).default([]),

  // Editorial metadata (from existing schema)
  editorial: ToolEditorialMetadataZ.optional(),

  // SEO
  seo: ClinicianSEOZ.optional(),

  // Governance
  governance: ClinicianGovernanceZ.default(DEFAULT_GOVERNANCE),

  // Related content
  related_tools: z.array(z.string()).optional(),
  competitor_tools: z.array(z.string()).optional(),

  // Timestamps
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional(),

  // Display settings
  featured: z.boolean().default(false),
  order: z.number().int().optional(),
  status: z.enum(["active", "draft", "archived", "pending-review"]).default("draft"),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type ClinicianProductCategory = z.infer<typeof ClinicianProductCategoryZ>;
export type ClinicianRole = z.infer<typeof ClinicianRoleZ>;
export type PracticeSetting = z.infer<typeof PracticeSettingZ>;
export type OrganizationSize = z.infer<typeof OrganizationSizeZ>;
export type ClinicianToolLifecycleStatus = z.infer<typeof ClinicianToolLifecycleStatusZ>;
export type ClinicianToolLifecycle = z.infer<typeof ClinicianToolLifecycleZ>;
export type ImportReference = z.infer<typeof ImportReferenceZ>;
export type CapabilitySlug = z.infer<typeof CapabilitySlugZ>;
export type ClinicianPricingModel = z.infer<typeof ClinicianPricingModelZ>;
export type ClinicianPricing = z.infer<typeof ClinicianPricingZ>;
export type ClinicianCompanyInfo = z.infer<typeof ClinicianCompanyInfoZ>;
export type ClinicianFeatures = z.infer<typeof ClinicianFeaturesZ>;
export type ClinicianCompliance = z.infer<typeof ClinicianComplianceZ>;
export type ClinicianIntegration = z.infer<typeof ClinicianIntegrationZ>;
export type ClinicianAudiences = z.infer<typeof ClinicianAudiencesZ>;
export type ClinicianFeatureFlags = z.infer<typeof ClinicianFeatureFlagsZ>;
export type ClinicianFAQ = z.infer<typeof ClinicianFAQZ>;
export type ClinicianSEO = z.infer<typeof ClinicianSEOZ>;
export type ClinicianGovernance = z.infer<typeof ClinicianGovernanceZ>;
export type ClinicianToolV4 = z.infer<typeof ClinicianToolV4Z>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validate a clinician tool against the V4 schema
 */
export function validateClinicianToolV4(
  data: unknown
): { success: boolean; data?: ClinicianToolV4; errors?: z.ZodError } {
  const result = ClinicianToolV4Z.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Type guard for clinician tool V4
 */
export function isValidClinicianToolV4(data: unknown): data is ClinicianToolV4 {
  return ClinicianToolV4Z.safeParse(data).success;
}

/**
 * Validate that all required fields for publishing are present
 */
export function isPublishReady(tool: ClinicianToolV4): boolean {
  return !!(
    tool.name &&
    tool.slug &&
    tool.primary_category &&
    tool.short_description &&
    tool.compliance.hipaa_support !== "unknown" &&
    tool.governance.last_reviewed &&
    !tool.governance.needs_review
  );
}

// ============================================================================
// SPREADSHEET MAPPING HELPERS
// ============================================================================

/**
 * Category string mappings from spreadsheet to enum values
 */
export const SPREADSHEET_CATEGORY_MAP: Record<string, ClinicianProductCategory> = {
  // Direct mappings
  "EHR / Practice Management": "ehr-practice-management",
  "Billing / RCM / Insurance": "billing-rcm-insurance",
  "Telehealth / Communication": "telehealth-communication",
  "Credentialing / Network / Evidence / Workforce": "credentialing-workforce",
  "Provider Network / Virtual Mental Health": "provider-network-virtual-care",
  "Measurement / Outcomes / Digital Therapeutics": "measurement-outcomes-dtx",
  "AI Scribe / Clinical AI": "ai-copilot-clinical",
  "AI Scribe / Documentation": "ai-scribe-documentation",

  // Alternative variations
  "EHR": "ehr-practice-management",
  "Practice Management": "ehr-practice-management",
  "EHR/Practice Management": "ehr-practice-management",
  "Billing": "billing-rcm-insurance",
  "RCM": "billing-rcm-insurance",
  "Revenue Cycle": "billing-rcm-insurance",
  "Billing/RCM": "billing-rcm-insurance",
  "Telehealth": "telehealth-communication",
  "Communication": "telehealth-communication",
  "Credentialing": "credentialing-workforce",
  "Workforce": "credentialing-workforce",
  "Provider Network": "provider-network-virtual-care",
  "Virtual Care": "provider-network-virtual-care",
  "Virtual Mental Health": "provider-network-virtual-care",
  "Measurement": "measurement-outcomes-dtx",
  "Outcomes": "measurement-outcomes-dtx",
  "Digital Therapeutics": "measurement-outcomes-dtx",
  "DTx": "measurement-outcomes-dtx",
  "AI Scribe": "ai-scribe-documentation",
  "Documentation": "ai-scribe-documentation",
  "Clinical AI": "ai-copilot-clinical",
  "AI Copilot": "ai-copilot-clinical",
  "Clinical Decision Support": "clinical-decision-support",
  "CDS": "clinical-decision-support",
  "Patient Engagement": "patient-engagement",
  "Intake": "intake-scheduling-forms",
  "Scheduling": "intake-scheduling-forms",
  "Forms": "intake-scheduling-forms",
  "Prescribing": "prescribing-erx",
  "e-Prescribing": "prescribing-erx",
  "eRx": "prescribing-erx",
  "Compliance": "compliance-consent-security",
  "Consent": "compliance-consent-security",
  "Security": "compliance-consent-security",
  "Analytics": "analytics-reporting",
  "Reporting": "analytics-reporting",
  "Care Coordination": "care-coordination-referrals",
  "Referrals": "care-coordination-referrals",
};

/**
 * Map a spreadsheet category string to enum value
 */
export function mapCategoryFromSpreadsheet(
  categoryString: string
): ClinicianProductCategory | null {
  // Direct lookup
  const direct = SPREADSHEET_CATEGORY_MAP[categoryString.trim()];
  if (direct) return direct;

  // Case-insensitive lookup
  const normalized = categoryString.trim().toLowerCase();
  for (const [key, value] of Object.entries(SPREADSHEET_CATEGORY_MAP)) {
    if (key.toLowerCase() === normalized) {
      return value;
    }
  }

  // Partial match (contains)
  for (const [key, value] of Object.entries(SPREADSHEET_CATEGORY_MAP)) {
    if (
      normalized.includes(key.toLowerCase()) ||
      key.toLowerCase().includes(normalized)
    ) {
      return value;
    }
  }

  return null;
}

/**
 * Stub: Map raw spreadsheet row to V4 clinician tool
 * This should be expanded based on actual spreadsheet column mappings
 */
export function mapSpreadsheetToV4(
  row: Record<string, unknown>,
  options?: {
    recordId?: string;
    sourceRow?: number;
    sourceFile?: string;
  }
): Partial<ClinicianToolV4> {
  const primaryCategoryRaw = row["Primary Category"] || row["Category"] || "";
  const primaryCategory = mapCategoryFromSpreadsheet(String(primaryCategoryRaw));

  // Generate UUID if not provided
  const id = (row["id"] as string) || crypto.randomUUID();

  // Generate slug from name if not provided
  const name = String(row["Name"] || row["Product Name"] || row["name"] || "");
  const slug =
    (row["slug"] as string) ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const tool: Partial<ClinicianToolV4> = {
    schema_version: "4.0",
    kind: "clinician-tool",
    id,
    slug,
    name,
    company_name: String(row["Company"] || row["Vendor"] || row["company_name"] || ""),

    import_ref: {
      record_id: options?.recordId || String(row["Record ID"] || id),
      source_row: options?.sourceRow,
      source_file: options?.sourceFile,
      import_timestamp: new Date().toISOString(),
    },

    lifecycle: {
      status: "active",
    },

    primary_category: primaryCategory || "ehr-practice-management",
    secondary_categories: [],
    capabilities: [],

    audiences: {
      clinician_roles: [],
      practice_settings: [],
      organization_sizes: [],
    },

    feature_flags: {
      has_ai: Boolean(
        String(row["Has AI"] || row["AI"] || "").toLowerCase() === "yes" ||
        String(row["Has AI"] || row["AI"] || "").toLowerCase() === "true"
      ),
      has_ehr: primaryCategory === "ehr-practice-management",
      has_rcm: primaryCategory === "billing-rcm-insurance",
      has_telehealth: primaryCategory === "telehealth-communication",
      has_measurement: primaryCategory === "measurement-outcomes-dtx",
      has_e_prescribing: primaryCategory === "prescribing-erx",
      has_patient_portal: false,
      has_mobile_app: false,
      is_mental_health_specific: Boolean(
        String(row["Mental Health Specific"] || "").toLowerCase() === "yes"
      ),
      is_specialty_agnostic: false,
    },

    short_description: String(row["Description"] || row["Short Description"] || ""),
    website_url: String(row["Website"] || row["URL"] || "") || undefined,

    pricing: {
      model: "enterprise-custom",
      free_tier: false,
      quote_required: true,
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
      review_priority: "medium",
    },

    status: "draft",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return tool;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all categories for a tool (primary + secondary)
 */
export function getAllCategories(tool: ClinicianToolV4): ClinicianProductCategory[] {
  return [tool.primary_category, ...tool.secondary_categories];
}

/**
 * Check if tool has a specific capability
 */
export function hasCapability(tool: ClinicianToolV4, capability: CapabilitySlug): boolean {
  return tool.capabilities.includes(capability);
}

/**
 * Check if tool is suitable for a specific role
 */
export function isSuitableForRole(tool: ClinicianToolV4, role: ClinicianRole): boolean {
  return (
    tool.audiences.clinician_roles.length === 0 ||
    tool.audiences.clinician_roles.includes(role)
  );
}

/**
 * Check if tool is suitable for a specific practice setting
 */
export function isSuitableForSetting(
  tool: ClinicianToolV4,
  setting: PracticeSetting
): boolean {
  return (
    tool.audiences.practice_settings.length === 0 ||
    tool.audiences.practice_settings.includes(setting)
  );
}

/**
 * Get compliance summary for display
 */
export function getComplianceSummary(
  compliance: ClinicianCompliance
): { label: string; status: UncertaintyBoolean }[] {
  return [
    { label: "HIPAA", status: compliance.hipaa_support },
    { label: "BAA Available", status: compliance.baa_available },
    { label: "SOC 2", status: compliance.soc2 },
    { label: "HITRUST", status: compliance.hitrust },
  ];
}

/**
 * Generate canonical URL for a clinician tool
 */
export function generateCanonicalUrl(slug: string): string {
  return `https://heypsych.com/tools/for-clinicians/${slug}/`;
}

/**
 * Get label for a product category
 */
export function getCategoryLabel(category: ClinicianProductCategory): string {
  return CLINICIAN_PRODUCT_CATEGORY_LABELS[category] || category;
}

/**
 * Get label for a clinician role
 */
export function getRoleLabel(role: ClinicianRole): string {
  return CLINICIAN_ROLE_LABELS[role] || role;
}

/**
 * Get label for a practice setting
 */
export function getSettingLabel(setting: PracticeSetting): string {
  return PRACTICE_SETTING_LABELS[setting] || setting;
}

/**
 * Get label for organization size
 */
export function getOrgSizeLabel(size: OrganizationSize): string {
  return ORGANIZATION_SIZE_LABELS[size] || size;
}
