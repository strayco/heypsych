// src/lib/schemas/resource.ts
import { z } from "zod";

export const ResourceCategoryZ = z.enum([
  "assessments-screeners",
  "support-community",
  "knowledge-hub",
  "crisis-helplines",
  "education-guides",
  "digital-tools",
]);

// Base resource (shared fields)
const Base = z
  .object({
    kind: z.literal("resource"),
    slug: z.string(),
    name: z.string(),
    full_name: z.string().optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    purpose: z.string().optional(),
    tags: z.array(z.string()).optional(),
    validated: z.boolean().optional(),
    free: z.boolean().optional(),
    duration: z.string().optional(),
    age_range: z.string().optional(),
    languages: z.array(z.string()).optional(),
    administration: z.string().optional(),
    order: z.number().optional(),
    featured: z.boolean().optional(),
    downloadable_pdf: z.boolean().optional(),
    interactive_version: z.boolean().optional(),
    conditions: z.array(z.string()).optional(),
    target_populations: z.array(z.string()).optional(),
    limitations: z.array(z.string()).optional(),
    metadata: z
      .object({
        category: ResourceCategoryZ.optional(),
      })
      .passthrough()
      .optional(),
    sections: z
      .array(
        z
          .object({
            type: z.string().optional(),
            title: z.string().optional(),
            text: z.string().optional(),
          })
          .passthrough()
      )
      .optional(),
    psychometric_properties: z.record(z.string(), z.string()).optional(),
    clinical_alerts: z.record(z.string(), z.string()).optional(),
    clinical_use: z.record(z.string(), z.boolean()).optional(),
    references: z
      .array(
        z.object({
          title: z.string().optional(),
          authors: z.string().optional(),
          journal: z.string().optional(),
          year: z.union([z.number(), z.string()]).optional(),
          volume: z.union([z.string(), z.number()]).optional(),
          pages: z.string().optional(),
          doi: z.string().optional(),
        })
      )
      .optional(),
    copyright: z
      .object({
        notice: z.string().optional(),
        usage: z.string().optional(),
      })
      .optional(),
    seo: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        keywords: z.array(z.string()).optional(),
      })
      .optional(),
  })
  .passthrough();

// Assessments & Screeners (adds questions + scoring)
export const AssessmentResourceZ = Base.extend({
  metadata: z
    .object({
      category: z.literal("assessments-screeners"),
    })
    .passthrough(),

  // New items array (preferred format)
  items: z
    .array(
      z.object({
        id: z.string(),
        text: z.string(),
        type: z.string().optional(),
        response_set: z.string().optional(),
        alert: z.union([z.boolean(), z.string()]).optional(),
      })
    )
    .optional(),

  // Legacy questions array (for backward compatibility)
  questions: z
    .array(
      z.object({
        number: z.number(),
        text: z.string(),
        weight: z.number().optional(),
        warning: z.string().optional(),
        dsm_criterion: z.string().optional(),
        options: z
          .array(
            z.object({
              value: z.number(),
              label: z.string(),
            })
          )
          .optional(),
      })
    )
    .optional(),

  // Response options - supports both legacy and new formats
  response_options: z
    .union([
      // Legacy format (array)
      z.array(
        z.object({
          value: z.number(),
          label: z.string(),
        })
      ),
      // New format (object with named sets)
      z.record(
        z.string(),
        z.array(
          z.object({
            value: z.number(),
            label: z.string(),
          })
        )
      ),
    ])
    .optional(),

  functional_question: z
    .object({
      number: z.number().optional(),
      text: z.string().optional(),
      options: z.array(z.string()).optional(),
      note: z.string().optional(),
    })
    .optional(),

  // Updated scoring structure
  scoring: z
    .object({
      type: z.enum(["sum", "weighted-sum", "custom"]).optional(),
      engineKey: z.string().optional(),
      engine: z.string().optional(),
      max_per_item: z.number().optional(),
      range: z.string().optional(),
      interpretation: z.record(z.string(), z.string()).optional(),
      cutoff_scores: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
      additional_scoring: z.record(z.string(), z.string()).optional(),
      bands: z
        .array(
          z.object({
            min: z.number(),
            max: z.number(),
            label: z.string(),
          })
        )
        .optional(),
      rules: z
        .object({
          numeric_mapping: z.record(z.string(), z.number()).optional(),
          // ASSIST-specific fields
          substance_mapping: z.record(z.string(), z.any()).optional(),
          risk_thresholds: z.record(z.string(), z.any()).optional(),
          injection_question: z.string().optional(),
          // ASRS-specific fields
          part_a: z.array(z.number()).optional(),
          part_b: z.array(z.number()).optional(),
          domains: z.record(z.string(), z.array(z.number())).optional(),
          // Generic fields
          total: z
            .object({
              items: z.array(z.string()).optional(),
              method: z.string().optional(),
            })
            .optional(),
          severity: z
            .object({
              input: z.string().optional(),
              bands: z.record(z.string(), z.string()).optional(),
            })
            .optional(),
          alerts: z.record(z.string(), z.any()).optional(),
          types: z.array(z.any()).optional(),
        })
        .optional(),
    })
    .optional(),

  // UI configuration
  ui: z
    .object({
      result_panels: z
        .array(
          z.object({
            title: z.string(),
            rows: z.array(
              z.object({
                key: z.string(),
                label: z.string(),
                suffix: z.string().optional(),
                format: z
                  .object({
                    type: z.string(),
                    true: z.string().optional(),
                    false: z.string().optional(),
                    show_if_present: z.boolean().optional(),
                  })
                  .optional(),
              })
            ),
          })
        )
        .optional(),
    })
    .optional(),

  // Clinical interpretations for each severity band
  clinical_interpretations: z.record(z.string(), z.string()).optional(),

  assessment_type: z.string().optional(),
  category: z.string().optional(),
});

// Other categories (keep existing but allow more fields)
export const SupportCommunityResourceZ = Base.extend({
  metadata: z.object({ category: z.literal("support-community") }).passthrough(),
  meeting_times: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  group_type: z.string().optional(),
  cost: z.string().optional(),
  registration_required: z.boolean().optional(),
  accessibility: z.string().optional(),
});

// Knowledge Hub pillars
export const KnowledgeHubPillarZ = z.enum([
  "self-help-and-wellness",
  "research-and-science",
  "how-to-guides",
  "latest",
  "community-and-stories",
]);

export const KnowledgeHubResourceZ = Base.extend({
  metadata: z.object({ category: z.literal("knowledge-hub") }).passthrough(),
  pillar: KnowledgeHubPillarZ.optional(),
  subcategory: z.string().optional(),
  authors: z.array(z.string()).optional(),
  author: z.string().optional(), // Legacy support
  publishedAt: z.string().optional(),
  updatedAt: z.string().optional(),
  readingMinutes: z.number().optional(),
  reading_time: z.string().optional(), // Legacy support
  audience: z.array(z.string()).optional(),
  format: z.enum(["article", "video", "podcast", "infographic"]).optional(),
  external_url: z.string().optional(),
  excerpt: z.string().optional(),
  related_topics: z.array(z.string()).optional(),
  body: z.array(z.any()).optional(), // Structured content blocks
});

export const CrisisHelplinesResourceZ = Base.extend({
  metadata: z.object({ category: z.literal("crisis-helplines") }).passthrough(),
  phone: z.string().optional(),
  text_number: z.string().optional(),
  hours: z.string().optional(),
  coverage_area: z.string().optional(),
  specialties: z.array(z.string()).optional(),
  training_required: z.string().optional(),
});

export const EducationGuidesResourceZ = Base.extend({
  metadata: z.object({ category: z.literal("education-guides") }).passthrough(),
  learning_objectives: z.array(z.string()).optional(),
  difficulty_level: z.string().optional(),
  downloadable: z.boolean().optional(),
  external_url: z.string().optional(),
  format: z.string().optional(),
  prerequisites: z.array(z.string()).optional(),
  certification: z.boolean().optional(),
  continuing_education: z.string().optional(),
});

export const DigitalToolsResourceZ = Base.extend({
  metadata: z.object({ category: z.literal("digital-tools") }).passthrough(),
  app_rating: z.number().optional(),
  total_reviews: z.number().optional(),
  platforms: z.array(z.string()).optional(),
  privacy_certified: z.boolean().optional(),
  app_store_url: z.string().optional(),
  website: z.string().optional(),
  system_requirements: z.string().optional(),
  offline_access: z.boolean().optional(),
  subscription_model: z.string().optional(),
  data_export: z.boolean().optional(),
});

// Union of all resource shapes
export const AnyResourceZ = z.union([
  AssessmentResourceZ,
  SupportCommunityResourceZ,
  KnowledgeHubResourceZ,
  CrisisHelplinesResourceZ,
  EducationGuidesResourceZ,
  DigitalToolsResourceZ,
]);

// TS types
export type AnyResource = z.infer<typeof AnyResourceZ>;
export type ResourceCategory = z.infer<typeof ResourceCategoryZ>;
export type AssessmentResource = z.infer<typeof AssessmentResourceZ>;
export type KnowledgeHubResource = z.infer<typeof KnowledgeHubResourceZ>;
export type KnowledgeHubPillar = z.infer<typeof KnowledgeHubPillarZ>;
