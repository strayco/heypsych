// src/lib/schemas/digital-tool-v3.ts
// V3 Digital Tool Schema - AEO/SEO First, Fully Dynamic
import { z } from "zod";

// ============================================================================
// TAXONOMY ENUMS
// ============================================================================

export const HubSlugZ = z.enum([
  "sleep",
  "anxiety-stress",
  "mood-depression",
  "focus-adhd",
  "trauma-ptsd",
  "substance-use",
  "serious-mental-illness",
  "find-support",
]);

export const SubHubSlugZ = z.enum([
  "therapy-platforms",
  "psychiatry-platforms",
  "ai-therapists",
]);

// Clinician hub slugs
export const ClinicianHubSlugZ = z.enum([
  "clinical-answers-evidence",
  "ai-scribes-documentation",
  "billing-coding",
  "prescribing-medication-support",
  "practice-admin-operations",
  "patient-engagement-between-visits",
]);

// Clinician workflow types
export const ClinicianWorkflowZ = z.enum([
  "clinical_answers",
  "documentation_scribe",
  "billing_coding",
  "prescribing_support",
  "admin_operations",
  "patient_engagement",
]);

export const ToolTypeZ = z.enum([
  "app",
  "therapy-platform",
  "psychiatry-platform",
  "ai-therapist",
  "mood-tracker",
  "meditation",
  "sleep-tracker",
  "journal",
  "peer-support",
  "crisis-tool",
  "assessment",
  "coaching",
]);

export const SupportLevelZ = z.enum([
  "self-help",
  "coached",
  "clinical",
  "crisis",
]);

export const PricingModelZ = z.enum([
  "free",
  "freemium",
  "subscription",
  "one-time",
  "enterprise",
  "insurance-covered",
]);

export const PrivacyGradeZ = z.enum([
  "A+",
  "A",
  "B+",
  "B",
  "C",
  "D",
  "F",
  "unknown",
]);

export const AIAttributeZ = z.enum([
  "ai-powered",
  "ai-assisted",
  "ai-matching",
  "chatbot",
  "no-ai",
]);

// ============================================================================
// CORE SCHEMAS
// ============================================================================

export const FAQZ = z.object({
  q: z.string().min(10, "FAQ question must be at least 10 characters"),
  a: z.string().min(20, "FAQ answer must be at least 20 characters"),
});

export const PlatformsZ = z.object({
  ios: z.boolean().default(false),
  android: z.boolean().default(false),
  web: z.boolean().default(false),
  desktop: z.boolean().default(false),
  wearable: z.boolean().default(false),
});

export const PricingZ = z.object({
  model: PricingModelZ,
  free_tier: z.boolean().default(false),
  starting_price: z.string().optional(),
  notes: z.string().optional(),
});

export const PrivacyZ = z.object({
  grade: PrivacyGradeZ,
  hipaa_compliant: z.boolean().default(false),
  gdpr_compliant: z.boolean().default(true),
  data_sold: z.boolean().default(false),
  notes: z.string().optional(),
  sources: z.array(z.string()).optional(),
});

export const GovernanceZ = z.object({
  reviewed_by_label: z.literal("Reviewed by HeyPsych Board"),
  reviewed_by_url: z.literal("https://heypsych.com/about/medical-review-board"),
  last_reviewed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
});

export const SEOZ = z.object({
  title: z.string().max(60, "SEO title should be under 60 characters"),
  meta_description: z.string().max(160, "Meta description should be under 160 characters"),
  canonical_url: z.string().regex(/^https:\/\/heypsych\.com\/tools\/[\w-]+\/$/, "Canonical must match /tools/{slug}/"),
  faqs: z.array(FAQZ).min(3, "Minimum 3 FAQs required"),
});

export const ClinicalMetadataZ = z.object({
  evidence_based: z.boolean().default(false),
  evidence_level: z.enum(["high", "moderate", "low", "emerging", "none"]).optional(),
  clinical_trials: z.array(z.object({
    study: z.string(),
    citation: z.object({
      authors: z.string(),
      title: z.string(),
      journal: z.string(),
      year: z.number(),
      doi: z.string().optional(),
      url: z.string().optional(),
    }).optional(),
    outcome: z.string().optional(),
    sample_size: z.number().optional(),
    study_design: z.string().optional(),
  })).optional(),
  primary_uses: z.array(z.string()).optional(),
  contraindications: z.array(z.string()).optional(),
}).optional();

// ============================================================================
// CLINICIAN-SPECIFIC SCHEMA (OPTIONAL ADD-ON)
// ============================================================================

export const ClinicianMetadataZ = z.object({
  is_clinician_relevant: z.boolean(),
  primary_clinician_hubs: z.array(ClinicianHubSlugZ).min(1),
  clinician_workflows: z.array(ClinicianWorkflowZ).min(1),
  how_clinicians_use_it: z.array(z.string()).min(3).max(6),
  implementation_notes: z.string().max(500),
  integrations: z.array(z.string()).optional(),
  billing_notes: z.string().optional(),
}).optional();

export const AppMetadataZ = z.object({
  publisher: z.string().optional(),
  release_date: z.string().optional(),
  latest_version: z.string().optional(),
  app_size: z.string().optional(),
  content_rating: z.string().optional(),
  languages: z.array(z.string()).optional(),
  app_store_url: z.string().url().optional(),
  google_play_url: z.string().url().optional(),
  website: z.string().url().optional(),
  wikidata_qid: z.string().optional(),
});

// ============================================================================
// MAIN V3 DIGITAL TOOL SCHEMA
// ============================================================================

export const DigitalToolV3Z = z.object({
  // Schema version
  schema_version: z.literal("3.0"),
  kind: z.literal("tool"),
  
  // Identity
  id: z.string().uuid().optional(), // Auto-generated if not provided
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  name: z.string().min(2).max(100),
  
  // Hero Content (AEO-first)
  one_liner: z.string().min(20).max(200, "One-liner should be 20-200 characters for AEO"),
  best_for: z.array(z.string()).min(2, "At least 2 'best for' items required"),
  not_for: z.array(z.string()).min(1, "At least 1 'not for' item required"),
  support_level: SupportLevelZ,
  
  // Descriptions
  short_description: z.string().max(160, "Short description should be under 160 chars for snippets"),
  long_description: z.string().min(100),
  patient_summary: z.string().optional(),
  
  // Classification
  primary_hubs: z.array(HubSlugZ).min(1, "At least one primary hub required"),
  sub_hubs: z.array(SubHubSlugZ).optional(),
  conditions: z.array(z.string()),
  tool_types: z.array(ToolTypeZ).min(1),
  ai_attributes: z.array(AIAttributeZ).default(["no-ai"]),
  
  // Platforms
  platforms: PlatformsZ,
  
  // Pricing
  pricing: PricingZ,
  
  // Privacy
  privacy: PrivacyZ,
  
  // Ratings
  app_rating: z.number().min(0).max(5).optional(),
  total_reviews: z.number().optional(),
  
  // SEO (all required for indexing)
  seo: SEOZ,
  
  // Governance (MANDATORY)
  governance: GovernanceZ,
  
  // App Metadata
  app_metadata: AppMetadataZ.optional(),
  
  // Clinical Metadata
  clinical_metadata: ClinicalMetadataZ,
  
  // Clinician Metadata (optional add-on)
  clinician: ClinicianMetadataZ,
  
  // Related Content
  related_tools: z.array(z.string()).optional(),
  related_conditions: z.array(z.string()).optional(),
  
  // Legacy compatibility
  order: z.number().optional(),
  featured: z.boolean().default(false),
  status: z.enum(["active", "draft", "archived"]).default("active"),
});

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type HubSlug = z.infer<typeof HubSlugZ>;
export type SubHubSlug = z.infer<typeof SubHubSlugZ>;
export type ToolType = z.infer<typeof ToolTypeZ>;
export type SupportLevel = z.infer<typeof SupportLevelZ>;
export type PricingModel = z.infer<typeof PricingModelZ>;
export type PrivacyGrade = z.infer<typeof PrivacyGradeZ>;
export type AIAttribute = z.infer<typeof AIAttributeZ>;
export type ClinicianHubSlug = z.infer<typeof ClinicianHubSlugZ>;
export type ClinicianWorkflow = z.infer<typeof ClinicianWorkflowZ>;
export type FAQ = z.infer<typeof FAQZ>;
export type Platforms = z.infer<typeof PlatformsZ>;
export type Pricing = z.infer<typeof PricingZ>;
export type Privacy = z.infer<typeof PrivacyZ>;
export type Governance = z.infer<typeof GovernanceZ>;
export type SEO = z.infer<typeof SEOZ>;
export type ClinicianMetadata = z.infer<typeof ClinicianMetadataZ>;
export type DigitalToolV3 = z.infer<typeof DigitalToolV3Z>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateToolV3(data: unknown): { success: boolean; data?: DigitalToolV3; errors?: z.ZodError } {
  const result = DigitalToolV3Z.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

export function isValidToolV3(data: unknown): data is DigitalToolV3 {
  return DigitalToolV3Z.safeParse(data).success;
}

// Governance validation - critical for launch
export function hasValidGovernance(tool: DigitalToolV3): boolean {
  return (
    tool.governance.reviewed_by_label === "Reviewed by HeyPsych Board" &&
    tool.governance.reviewed_by_url === "https://heypsych.com/about/medical-review-board" &&
    /^\d{4}-\d{2}-\d{2}$/.test(tool.governance.last_reviewed)
  );
}

// FAQ validation
export function hasMinimumFAQs(tool: DigitalToolV3): boolean {
  return tool.seo.faqs.length >= 3;
}
