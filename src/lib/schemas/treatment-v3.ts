/**
 * Treatment V3 Schema - Universal Treatment Explorer
 *
 * This schema provides a universal foundation for all treatment modalities while
 * allowing modality-specific extensions. It introduces `clinical_profile` as the
 * canonical source for structured comparison data.
 *
 * Design Principles:
 * 1. Universal fields for genuinely shared concepts
 * 2. Modality-specific schemas for specialized information
 * 3. Flexible narrative sections for unique content
 * 4. Explicit extension mechanisms for future modalities
 * 5. Clinical data status for uncertainty handling
 * 6. Provenance tracking for migrated data
 */

import { z } from "zod";

// =============================================================================
// CLINICAL DATA STATUS
// =============================================================================

/**
 * Explicit handling of clinical data certainty and availability
 */
export const ClinicalDataStatusSchema = z.enum([
  "known", // Data is confirmed and available
  "unknown", // Data existence is unknown
  "not_reviewed", // Not yet reviewed by clinical team
  "not_applicable", // Does not apply to this treatment
  "insufficient_evidence", // Evidence base is too limited
  "conflicting_evidence", // Studies show conflicting results
  "source_unavailable", // Source data was not accessible
]);

export type ClinicalDataStatus = z.infer<typeof ClinicalDataStatusSchema>;

// =============================================================================
// TREATMENT MODALITIES
// =============================================================================

export const TreatmentModalitySchema = z.enum([
  "medication",
  "therapy",
  "interventional",
  "investigational",
  "supplement",
  "alternative",
]);

export type TreatmentModality = z.infer<typeof TreatmentModalitySchema>;

// =============================================================================
// CONTROLLED VOCABULARIES
// =============================================================================

export const EvidenceLevelSchema = z.enum([
  "very_strong", // Multiple large RCTs, meta-analyses
  "strong", // Multiple RCTs with consistent results
  "moderate", // Some RCTs or high-quality observational
  "limited", // Few studies, mostly observational
  "emerging", // Early-stage research
  "anecdotal", // Case reports, traditional use
  "insufficient", // Not enough evidence to assess
]);

export const RegulatoryStatusSchema = z.enum([
  "fda_approved", // FDA approved for indication
  "fda_cleared", // FDA 510(k) cleared (devices)
  "off_label", // Used off-label for indication
  "investigational", // In clinical trials
  "unregulated", // Not subject to FDA regulation
  "schedule_controlled", // DEA scheduled substance
  "discontinued", // No longer marketed
]);

export const InvasivenessLevelSchema = z.enum([
  "non_invasive",
  "minimally_invasive",
  "invasive",
  "surgical",
]);

export const TreatmentRoleSchema = z.enum([
  "first_line", // Recommended initial treatment
  "second_line", // After first-line failure
  "adjunctive", // Add-on to primary treatment
  "augmentation", // Boost effect of primary treatment
  "maintenance", // Long-term continuation
  "acute", // Short-term crisis management
  "last_resort", // When all else fails
  "preventive", // Prophylactic use
]);

export const SettingSchema = z.enum([
  "home",
  "outpatient_clinic",
  "hospital_inpatient",
  "emergency",
  "residential",
  "telehealth",
  "specialty_center",
  "community",
]);

// =============================================================================
// STRUCTURED VALUE TYPES
// =============================================================================

/**
 * Represents a numeric range with optional units
 */
export const NumericRangeSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  typical: z.number().optional(),
  unit: z.string().optional(),
  display: z.string().optional(), // Human-readable form
});

/**
 * Duration specification
 */
export const DurationSchema = z.object({
  value: z.union([z.number(), NumericRangeSchema]).optional(),
  unit: z.enum(["minutes", "hours", "days", "weeks", "months", "years", "sessions", "ongoing"]),
  display: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * Clinical fact with provenance and status
 */
export const ClinicalFactSchema = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.object({
    value: valueSchema,
    display: z.string().optional(),
    status: ClinicalDataStatusSchema.default("known"),
    provenance: z
      .object({
        source_kind: z.enum([
          "fda_label",
          "clinical_guideline",
          "meta_analysis",
          "rct",
          "observational_study",
          "case_report",
          "expert_consensus",
          "legacy_treatment_json",
          "editorial_review",
        ]),
        source_path: z.string().optional(),
        transformation: z.enum(["verbatim", "deterministic_mapping", "editorial_interpretation"]).optional(),
        confidence: z.enum(["verified", "reviewed", "automated", "needs_review"]).optional(),
      })
      .optional(),
    citations: z.array(z.string()).optional(), // Reference IDs
  });

// =============================================================================
// IDENTITY
// =============================================================================

export const TreatmentIdentitySchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  generic_name: z.string().optional(), // For medications
  brand_names: z.array(z.string()).optional(),
  aliases: z.array(z.string()).optional(), // Alternative names, abbreviations
  wikidata_qid: z.string().regex(/^Q\d+$/).optional(),
});

// =============================================================================
// TAXONOMY
// =============================================================================

export const TreatmentTaxonomySchema = z.object({
  modality: TreatmentModalitySchema,
  category: z.string(), // e.g., "medications/antidepressants/ssri"
  subcategory: z.string().optional(),
  drug_classes: z.array(z.string()).optional(), // For medications
  intervention_types: z.array(z.string()).optional(), // For therapies/interventional
  therapeutic_categories: z.array(z.string()).optional(),
  mechanism_categories: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

// =============================================================================
// CONDITION LINK
// =============================================================================

export const ConditionLinkSchema = z.object({
  condition_slug: z.string(),
  condition_name: z.string().optional(),
  relationship: z.enum([
    "primary_indication",
    "secondary_indication",
    "off_label",
    "investigational",
    "contraindicated",
    "adjunctive",
    "augmentation",
    "preventive",
  ]),
  fda_approved: z.boolean().optional(),
  evidence_level: EvidenceLevelSchema.optional(),
  efficacy_rating: z.number().min(1).max(5).optional(),
  context: z.string().optional(), // Clinical context for this relationship
});

// =============================================================================
// CLINICAL PROFILE - Core Comparison Dimensions
// =============================================================================

/**
 * Indications and conditions treated
 */
export const IndicationsProfileSchema = z.object({
  primary: z.array(ConditionLinkSchema).optional(),
  secondary: z.array(ConditionLinkSchema).optional(),
  off_label: z.array(ConditionLinkSchema).optional(),
  contraindicated_conditions: z.array(z.string()).optional(),
  summary: z.string().optional(),
});

/**
 * Evidence and effectiveness data
 */
export const EvidenceProfileSchema = z.object({
  overall_level: EvidenceLevelSchema.optional(),
  // Preserves original evidence text verbatim when it couldn't be normalized
  // Distinguishes "ambiguous evidence data" from "no evidence data"
  overall_level_original: z.string().optional(),
  efficacy_ratings: z
    .record(
      z.string(), // condition or outcome key
      z.object({
        rating: z.union([z.number(), z.string()]), // Allow string for edge cases
        evidence_level: EvidenceLevelSchema.optional(),
        context: z.string().optional(),
      })
    )
    .optional(),
  key_studies: z
    .array(
      z.object({
        citation: z.string(),
        finding: z.string(),
        study_type: z.string().optional(),
        url: z.string().url().optional(),
      })
    )
    .optional(),
  research_support: z.string().optional(),
  limitations: z.string().optional(),
});

/**
 * Treatment experience and timeline
 */
export const ExperienceProfileSchema = z.object({
  onset: z
    .object({
      initial_effects: DurationSchema.optional(),
      therapeutic_response: DurationSchema.optional(),
      full_effect: DurationSchema.optional(),
      notes: z.string().optional(),
    })
    .optional(),
  duration: z
    .object({
      typical_course: DurationSchema.optional(),
      maintenance: DurationSchema.optional(),
      acute_use: DurationSchema.optional(),
      notes: z.string().optional(),
    })
    .optional(),
  treatment_course: z.string().optional(), // Narrative description
});

/**
 * Delivery and logistics
 */
export const DeliveryProfileSchema = z.object({
  // Medication-specific
  routes: z.array(z.string()).optional(), // oral, IV, topical, etc.
  dosage_forms: z.array(z.string()).optional(),

  // Therapy/interventional-specific
  format: z.array(z.string()).optional(), // individual, group, family
  modality_details: z.string().optional(), // in-person, telehealth, etc.

  // Universal
  setting: z.array(SettingSchema).optional(),
  session_duration: DurationSchema.optional(),
  frequency: z.string().optional(),
  total_sessions: NumericRangeSchema.optional(),
  professional_required: z
    .object({
      required: z.boolean(),
      credential_types: z.array(z.string()).optional(),
      notes: z.string().optional(),
    })
    .optional(),
  home_practice: z
    .object({
      required: z.boolean().optional(),
      description: z.string().optional(),
    })
    .optional(),
  invasiveness: InvasivenessLevelSchema.optional(),
});

/**
 * Safety profile
 */
export const SafetyProfileSchema = z.object({
  overall_safety: z.string().optional(), // Brief safety summary

  common_adverse_effects: z
    .array(
      z.object({
        effect: z.string(),
        incidence: z.string().optional(), // e.g., "~10-20%", "common"
        severity: z.enum(["mild", "moderate", "severe"]).optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),

  serious_risks: z
    .array(
      z.object({
        risk: z.string(),
        incidence: z.string().optional(),
        monitoring_required: z.boolean().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),

  black_box_warning: z.union([z.string(), z.array(z.string())]).optional(),

  contraindications: z
    .array(
      z.object({
        contraindication: z.string(),
        type: z.enum(["absolute", "relative"]).optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),

  precautions: z.array(z.string()).optional(),

  interactions: z
    .array(
      z.object({
        interactant: z.string(),
        severity: z.enum(["major", "moderate", "minor"]).optional(),
        mechanism: z.string().optional(),
        action: z.string().optional(),
      })
    )
    .optional(),

  monitoring_requirements: z
    .array(
      z.object({
        parameter: z.string(),
        frequency: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),

  special_populations: z
    .object({
      pregnancy: z.string().optional(),
      lactation: z.string().optional(),
      pediatric: z.string().optional(),
      geriatric: z.string().optional(),
      renal_impairment: z.string().optional(),
      hepatic_impairment: z.string().optional(),
    })
    .optional(),
});

/**
 * Access and practical considerations
 */
export const AccessProfileSchema = z.object({
  regulatory_status: RegulatoryStatusSchema.optional(),
  prescription_required: z.boolean().optional(),
  controlled_substance: z
    .object({
      is_controlled: z.boolean(),
      schedule: z.string().optional(), // e.g., "Schedule II"
    })
    .optional(),
  generic_available: z.boolean().optional(),
  fda_approval_year: z.number().optional(),

  // Cost indicators (not precise prices)
  cost_category: z.enum(["low", "moderate", "high", "very_high", "variable"]).optional(),
  insurance_coverage: z.string().optional(),
  cost_notes: z.string().optional(),

  // Availability
  availability: z.string().optional(),
  wait_times: z.string().optional(),
  geographic_limitations: z.string().optional(),
});

// =============================================================================
// MODALITY-SPECIFIC DETAILS
// =============================================================================

/**
 * Medication-specific clinical details
 */
export const MedicationDetailsSchema = z.object({
  pharmacokinetics: z
    .object({
      absorption: z.string().nullish(),
      bioavailability: z.string().nullish(),
      peak_plasma: z.string().nullish(),
      half_life: z.string().nullish(),
      metabolism: z.string().nullish(),
      excretion: z.string().nullish(),
      protein_binding: z.string().nullish(),
      food_effect: z.string().nullish(),
    })
    .optional(),

  dosing: z
    .object({
      starting_dose: z.string().optional(),
      typical_dose: z.string().optional(),
      max_dose: z.string().optional(),
      titration: z.string().optional(),
      adjustments: z.record(z.string(), z.string()).optional(), // by indication or population
    })
    .optional(),

  discontinuation: z
    .object({
      taper_required: z.boolean().optional(),
      taper_guidance: z.string().optional(),
      withdrawal_symptoms: z.array(z.string()).optional(),
    })
    .optional(),
});

/**
 * Therapy-specific clinical details
 */
export const TherapyDetailsSchema = z.object({
  therapy_type: z.string().optional(),
  theoretical_basis: z.string().optional(),
  key_techniques: z.array(z.string()).optional(),
  session_structure: z
    .object({
      pre_session: z.string().optional(),
      during_session: z.string().optional(),
      post_session: z.string().optional(),
      homework: z.string().optional(),
    })
    .optional(),
  training_requirements: z
    .object({
      practitioner: z.array(z.string()).optional(),
      certification: z.string().optional(),
    })
    .optional(),
  variants: z.array(z.string()).optional(),
});

/**
 * Interventional treatment details
 */
export const InterventionalDetailsSchema = z.object({
  procedure_type: z.string().optional(),
  device_name: z.string().optional(),
  anesthesia_required: z.boolean().optional(),
  anesthesia_type: z.string().optional(),
  recovery_time: DurationSchema.optional(),
  equipment_required: z.array(z.string()).optional(),
  session_protocol: z.string().optional(),
  maintenance_schedule: z.string().optional(),
});

/**
 * Supplement-specific details
 */
export const SupplementDetailsSchema = z.object({
  compound_type: z.string().optional(),
  natural_source: z.string().optional(),
  typical_dose_range: z.string().optional(),
  quality_considerations: z.string().optional(),
  regulatory_notes: z.string().optional(),
});

/**
 * Alternative treatment details
 */
export const AlternativeDetailsSchema = z.object({
  practice_style: z.string().optional(),
  tradition_origin: z.string().optional(),
  variants: z.array(z.string()).optional(),
  self_practice_possible: z.boolean().optional(),
  equipment_needed: z.array(z.string()).optional(),
});

/**
 * Combined modality details using discriminated union
 */
export const ModalityDetailsSchema = z.discriminatedUnion("modality", [
  z.object({ modality: z.literal("medication"), details: MedicationDetailsSchema }),
  z.object({ modality: z.literal("therapy"), details: TherapyDetailsSchema }),
  z.object({ modality: z.literal("interventional"), details: InterventionalDetailsSchema }),
  z.object({ modality: z.literal("investigational"), details: InterventionalDetailsSchema }),
  z.object({ modality: z.literal("supplement"), details: SupplementDetailsSchema }),
  z.object({ modality: z.literal("alternative"), details: AlternativeDetailsSchema }),
]);

// =============================================================================
// COMPLETE CLINICAL PROFILE
// =============================================================================

export const ClinicalProfileSchema = z.object({
  indications: IndicationsProfileSchema.optional(),
  evidence: EvidenceProfileSchema.optional(),
  experience: ExperienceProfileSchema.optional(),
  delivery: DeliveryProfileSchema.optional(),
  safety: SafetyProfileSchema.optional(),
  access: AccessProfileSchema.optional(),
  modality_details: ModalityDetailsSchema.optional(),
});

// =============================================================================
// SECTIONS (Narrative Content)
// =============================================================================

/**
 * Section types that preserve rich narrative content
 */
export const SectionTypeSchema = z.enum([
  // Universal
  "indications",
  "mechanism",
  "clinical_notes",
  "references",

  // Medication/Supplement
  "adverse_effects",
  "interactions",
  "dosing",
  "dosage_forms",
  "onset_duration",
  "tapering",
  "warnings",
  "monitoring",
  "efficacy",
  "patient_experience",
  "clinical_context",

  // Therapy/Alternative/Interventional
  "protocol",
  "expected_outcomes",
  "side_effects",
  "cost_considerations",
  "contraindications",
  "patient_selection",
  "training_requirements",
  "session_structure",
  "research_evidence",
  "integration_support",
  "treatment_variants",
  "equipment",
  "special_populations",

  // Other
  "faqs",
  "seo",
  "editorial",
  "overview",
  "effectiveness",
  "drug_interactions",
  "switching",
  "cost",
  "verdict",
]);

export const ContentSectionSchema = z.object({
  type: z.string(), // Flexible to accommodate any section type
  id: z.string().optional(), // Unique identifier for the section
  heading: z.string().optional(),
  text: z.string().optional(),
  items: z.union([z.array(z.any()), z.string()]).optional(), // Flexible: array or string
  subsections: z.array(z.any()).optional(),
  // Additional flexible fields for different section types
}).passthrough(); // Allow additional fields

// =============================================================================
// SOURCES AND CITATIONS
// =============================================================================

export const SourceSchema = z.object({
  id: z.string(), // Reference ID used in citations
  type: z.enum(["journal_article", "guideline", "fda_label", "book", "website", "other"]),
  authors: z.string().optional(),
  title: z.string(),
  journal: z.string().optional(),
  year: z.number().optional(),
  volume: z.string().optional(),
  issue: z.string().optional(),
  pages: z.string().optional(),
  doi: z.string().optional(),
  pmid: z.string().optional(),
  url: z.string().optional(), // Allow any string (URLs may be incomplete/placeholder)
  accessed_date: z.string().optional(),
  description: z.string().optional(),
});

// =============================================================================
// SEARCH METADATA
// =============================================================================

export const SearchMetadataSchema = z.object({
  searchable_terms: z.array(z.string()).optional(),
  synonyms: z.array(z.string()).optional(),
  common_misspellings: z.array(z.string()).optional(),
  related_searches: z.array(z.string()).optional(),
});

// =============================================================================
// SEO
// =============================================================================

export const SeoSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  canonical: z.string().optional(), // Allow any string (may be relative path or incomplete)
  no_index: z.boolean().optional(),
});

// =============================================================================
// EDITORIAL
// =============================================================================

export const EditorialSchema = z.object({
  medicalReviewerIds: z.array(z.string()).optional(),
  reviewBoard: z.string().nullish(),
  lastReviewed: z.string().nullish(), // ISO date
  lastUpdated: z.string().nullish(), // ISO date
  reviewStatement: z.string().nullish(),
  citations: z.array(z.string()).optional(),
});

// =============================================================================
// FAQs
// =============================================================================

export const FaqSchema = z.object({
  q: z.string(),
  a: z.string(),
});

// =============================================================================
// LEGACY PRESERVATION
// =============================================================================

/**
 * Preserves fields from legacy formats that couldn't be normalized
 */
export const LegacyPreservationSchema = z.object({
  original_schema_version: z.number().optional(),
  unmapped_fields: z.record(z.string(), z.any()).optional(),
  migration_notes: z.array(z.string()).optional(),
  requires_review: z.boolean().optional(),
  review_reasons: z.array(z.string()).optional(),
});

// =============================================================================
// COMPLETE TREATMENT V3 SCHEMA
// =============================================================================

export const TreatmentV3Schema = z.object({
  // Schema version
  schema_version: z.literal(3),

  // Kind discriminator (always "treatment")
  kind: z.literal("treatment"),

  // Identity
  identity: TreatmentIdentitySchema,

  // Taxonomy
  taxonomy: TreatmentTaxonomySchema,

  // Summaries (preserved from v2)
  summary: z.string(),
  description: z.string(),
  patient_summary: z.string().optional(),

  // Clinical Profile (new canonical layer for comparisons)
  clinical_profile: ClinicalProfileSchema,

  // Narrative sections (preserved from v2)
  sections: z.array(ContentSectionSchema),

  // Sources
  sources: z.array(SourceSchema).optional(),

  // FAQs
  faqs: z.array(FaqSchema).optional(),

  // Search metadata
  search_metadata: SearchMetadataSchema.optional(),

  // SEO
  seo: SeoSchema.optional(),

  // Editorial
  editorial: EditorialSchema.optional(),

  // Legacy preservation
  legacy_preservation: LegacyPreservationSchema.optional(),
});

export type TreatmentV3 = z.infer<typeof TreatmentV3Schema>;

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

export function validateTreatmentV3(data: unknown): {
  success: boolean;
  data?: TreatmentV3;
  errors?: z.ZodError;
} {
  const result = TreatmentV3Schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Detects the schema version of a treatment JSON
 */
export function detectSchemaVersion(data: unknown): number {
  if (typeof data !== "object" || data === null) return 0;

  const obj = data as Record<string, unknown>;

  // Explicit version
  if (obj.schema_version === 3) return 3;
  if (obj.schema_version === 2) return 2;
  if (obj.schema_version === 1) return 1;

  // Infer from structure
  if ("clinical_profile" in obj) return 3;
  if ("clinical_metadata" in obj && "sections" in obj) return 2;
  if ("sections" in obj) return 1;

  return 0; // Legacy
}

/**
 * Detects the modality from treatment data
 */
export function detectModality(data: unknown): TreatmentModality | null {
  if (typeof data !== "object" || data === null) return null;

  const obj = data as Record<string, unknown>;

  // Check explicit type field
  if (typeof obj.type === "string") {
    const modality = obj.type as TreatmentModality;
    if (TreatmentModalitySchema.safeParse(modality).success) {
      return modality;
    }
  }

  // Check taxonomy
  if (typeof obj.taxonomy === "object" && obj.taxonomy !== null) {
    const taxonomy = obj.taxonomy as Record<string, unknown>;
    if (typeof taxonomy.modality === "string") {
      const modality = taxonomy.modality as TreatmentModality;
      if (TreatmentModalitySchema.safeParse(modality).success) {
        return modality;
      }
    }
  }

  return null;
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type TreatmentIdentity = z.infer<typeof TreatmentIdentitySchema>;
export type TreatmentTaxonomy = z.infer<typeof TreatmentTaxonomySchema>;
export type ClinicalProfile = z.infer<typeof ClinicalProfileSchema>;
export type IndicationsProfile = z.infer<typeof IndicationsProfileSchema>;
export type EvidenceProfile = z.infer<typeof EvidenceProfileSchema>;
export type ExperienceProfile = z.infer<typeof ExperienceProfileSchema>;
export type DeliveryProfile = z.infer<typeof DeliveryProfileSchema>;
export type SafetyProfile = z.infer<typeof SafetyProfileSchema>;
export type AccessProfile = z.infer<typeof AccessProfileSchema>;
export type MedicationDetails = z.infer<typeof MedicationDetailsSchema>;
export type TherapyDetails = z.infer<typeof TherapyDetailsSchema>;
export type InterventionalDetails = z.infer<typeof InterventionalDetailsSchema>;
export type SupplementDetails = z.infer<typeof SupplementDetailsSchema>;
export type AlternativeDetails = z.infer<typeof AlternativeDetailsSchema>;
export type ContentSection = z.infer<typeof ContentSectionSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Faq = z.infer<typeof FaqSchema>;
export type LegacyPreservation = z.infer<typeof LegacyPreservationSchema>;
export type EvidenceLevel = z.infer<typeof EvidenceLevelSchema>;
export type RegulatoryStatus = z.infer<typeof RegulatoryStatusSchema>;
export type ConditionLink = z.infer<typeof ConditionLinkSchema>;
export type NumericRange = z.infer<typeof NumericRangeSchema>;
export type Duration = z.infer<typeof DurationSchema>;
