/**
 * Zod Schema for Dual-Layer Treatment JSON Architecture
 * 
 * Validates treatment JSON files with:
 * - User-facing layer (sections, summary, etc.)
 * - SEO layer (seo_extensions block)
 * 
 * Usage:
 * ```typescript
 * import { TreatmentSchema } from '@/lib/schemas/treatment';
 * 
 * try {
 *   const validated = TreatmentSchema.parse(jsonData);
 *   // Valid treatment JSON
 * } catch (error) {
 *   // Validation errors
 * }
 * ```
 */

import { z } from "zod";

// Common section types
const SectionTypeZ = z.enum([
  "indications",
  "patient_experience",
  "onset_duration",
  "efficacy",
  "adverse_effects",
  "warnings",
  "tapering",
  "interactions",
  "dosing",
  "special_populations",
  "clinical_notes",
  "monitoring",
  "dosage_forms",
  "mechanism",
  "references",
]);

// UX Display modes
const UxDisplayModeZ = z.enum([
  "fully_visible",
  "top_two_visible",
  "patient_text_only",
  "symptom_only",
]);

// Base section schema
const BaseSectionZ = z.object({
  type: SectionTypeZ,
  heading: z.string().optional(),
  ux_display: UxDisplayModeZ.optional(),
  collapsible: z.boolean().optional(),
});

// Specific section schemas
const IndicationsSectionZ = BaseSectionZ.extend({
  type: z.literal("indications"),
  items: z.array(z.string()).optional(),
  off_label: z.array(z.string()).optional(),
  text: z.string().optional(),
  patient_text: z.string().optional(),
});

const PatientExperienceSectionZ = BaseSectionZ.extend({
  type: z.literal("patient_experience"),
  intro: z.string().optional(),
  items: z.array(
    z.object({
      category: z.string(),
      quotes: z.array(z.string()),
      note: z.string().optional(),
    })
  ),
});

const OnsetDurationSectionZ = BaseSectionZ.extend({
  type: z.literal("onset_duration"),
  text: z.string().optional(),
  key_points: z.array(z.string()).optional(),
});

const EfficacySectionZ = BaseSectionZ.extend({
  type: z.literal("efficacy"),
  metric: z.string().optional(),
  value: z.string().optional(),
  comparison: z.string().optional(),
  text: z.string().optional(),
  patient_text: z.string().optional(),
  citation: z
    .object({
      label: z.string(),
      url: z.string().url(),
    })
    .optional(),
});

const AdverseEffectsSectionZ = BaseSectionZ.extend({
  type: z.literal("adverse_effects"),
  summary: z.string().optional(),
  plain_language_list: z.array(z.string()).optional(),
  common: z
    .array(
      z.object({
        symptom: z.string(),
        incidence: z.string().optional(),
        patient_note: z.string().optional(),
      })
    )
    .optional(),
  serious: z.array(z.string()).optional(),
});

const WarningsSectionZ = BaseSectionZ.extend({
  type: z.literal("warnings"),
  highlight: z.string().optional(),
  black_box: z.string().optional(),
  other: z.array(z.string()).optional(),
  patient_counseling: z.array(z.string()).optional(),
});

const TaperingSectionZ = BaseSectionZ.extend({
  type: z.literal("tapering"),
  text: z.string().optional(),
  patient_text: z.string().optional(),
  key_points: z.array(z.string()).optional(),
});

const InteractionsSectionZ = BaseSectionZ.extend({
  type: z.literal("interactions"),
  intro: z.string().optional(),
  items: z.array(
    z.object({
      with: z.string(),
      risk: z.string(),
      action: z.string(),
    })
  ).optional(),
});

const DosingSectionZ = BaseSectionZ.extend({
  type: z.literal("dosing"),
  adult: z
    .object({
      start: z.string().optional(),
      max: z.string().optional(),
      notes: z.string().optional(),
    })
    .optional(),
  patient_text: z.string().optional(),
  simple_explanation: z.string().optional(),
  renal_adjustments: z
    .object({
      condition: z.string(),
      dose: z.string(),
      patient_note: z.string().optional(),
    })
    .optional(),
  hepatic_adjustments: z
    .object({
      condition: z.string(),
      dose: z.string(),
      patient_note: z.string().optional(),
    })
    .optional(),
});

const SpecialPopulationsSectionZ = BaseSectionZ.extend({
  type: z.literal("special_populations"),
  pregnancy: z.string().optional(),
  lactation: z.string().optional(),
  pediatrics: z.string().optional(),
  geriatrics: z.string().optional(),
  patient_text: z.string().optional(),
});

const GenericSectionZ = BaseSectionZ.extend({
  type: z.string(),
  text: z.string().optional(),
  items: z.any().optional(),
  patient_text: z.string().optional(),
});

// Union of all section types
const SectionZ = z.union([
  IndicationsSectionZ,
  PatientExperienceSectionZ,
  OnsetDurationSectionZ,
  EfficacySectionZ,
  AdverseEffectsSectionZ,
  WarningsSectionZ,
  TaperingSectionZ,
  InteractionsSectionZ,
  DosingSectionZ,
  SpecialPopulationsSectionZ,
  GenericSectionZ,
]);

// SEO Extensions Schema (Dual-Layer Architecture)
const SeoExtensionsZ = z.object({
  keywords: z.array(z.string()).optional(),
  search_intent_phrases: z.array(z.string()).optional(),
  search_intent_clusters: z
    .record(
      z.string(),
      z.array(z.string())
    )
    .optional(),
  schema_org: z.record(z.string(), z.any()).optional(),
});

// Clinical Metadata Schema
const ClinicalMetadataZ = z.object({
  primary_indications: z.array(z.string()).optional(),
  linked_conditions: z
    .array(
      z.object({
        slug: z.string(),
        relationship: z.string(),
        context: z.string().optional(),
      })
    )
    .optional(),
  contraindications: z.array(z.string()).optional(),
  efficacy_response: z
    .object({
      metric: z.string().optional(),
      percentage_value: z.string().optional(),
      comparison_data: z.string().optional(),
      patient_text: z.string().optional(),
      citation_tag: z.string().optional(),
    })
    .optional(),
  pharmacokinetics: z.record(z.string(), z.any()).optional(),
}).optional();

// Main Treatment Schema
export const TreatmentSchema = z.object({
  // Core fields
  kind: z.literal("treatment").optional(),
  slug: z.string(),
  type: z.string(),
  name: z.string(),
  summary: z.string().optional(),
  description: z.string().optional(),
  patient_summary: z.string().optional(),
  category: z.string().optional(),

  // Metadata
  metadata: z
    .object({
      drug_classes: z.array(z.string()).optional(),
      brand_names: z.array(z.string()).optional(),
      administration_routes: z.array(z.string()).optional(),
      prescription_status: z.string().optional(),
      generic_available: z.boolean().optional(),
      fda_approval_year: z.number().optional(),
      pharmacologic_category: z.string().optional(),
    })
    .optional(),

  // Clinical metadata
  clinical_metadata: ClinicalMetadataZ,

  // User-facing sections
  sections: z.array(SectionZ),

  // SEO layer (dual-layer architecture)
  seo_extensions: SeoExtensionsZ.optional(),

  // Standard SEO (legacy support)
  seo: z
    .object({
      description: z.string().optional(),
      canonical: z.string().url().optional(),
      no_index: z.boolean().optional(),
    })
    .optional(),

  // Editorial metadata
  editorial: z
    .object({
      medicalReviewerIds: z.array(z.string()).optional(),
      reviewBoard: z.string().optional(),
      lastReviewed: z.string().optional(),
      lastUpdated: z.string().optional(),
      citations: z.array(z.any()).optional(),
      reviewStatement: z.string().optional(),
    })
    .optional(),

  // FAQs
  faqs: z
    .array(
      z.object({
        q: z.string(),
        a: z.string(),
      })
    )
    .optional(),

  // Allow additional fields
}).passthrough();

export type Treatment = z.infer<typeof TreatmentSchema>;

/**
 * Validate a treatment JSON file
 * 
 * @param data - JSON data to validate
 * @returns Validation result with errors if any
 */
export function validateTreatmentJSON(data: unknown): {
  valid: boolean;
  errors: z.ZodIssue[];
  data?: Treatment;
} {
  try {
    const validated = TreatmentSchema.parse(data);
    return {
      valid: true,
      errors: [],
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.issues,
      };
    }
    throw error;
  }
}

/**
 * Safe validation that returns null on error instead of throwing
 */
export function safeValidateTreatmentJSON(data: unknown): {
  valid: boolean;
  errors: z.ZodIssue[];
  data?: Treatment;
} | null {
  try {
    return validateTreatmentJSON(data);
  } catch (error) {
    console.error("Unexpected error validating treatment JSON:", error);
    return null;
  }
}














