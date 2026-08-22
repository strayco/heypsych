/**
 * Navigation Domain Schemas
 *
 * Zod schemas for validating navigation and next-step data.
 */
import { z } from "zod";

/**
 * Audience schema
 */
export const AudienceSchema = z.enum(["patient", "clinician"]);

/**
 * Next step kind schema
 */
export const NextStepKindSchema = z.enum([
  "assessment",
  "condition",
  "treatment",
  "comparison",
  "tool",
  "find_care",
  "clinician_resource",
  "article",
  "external",
]);

/**
 * Catalog entity type schema
 */
export const CatalogEntityTypeSchema = z.enum([
  "condition",
  "treatment",
  "assessment",
  "tool",
  "resource",
  "provider",
  "article",
]);

/**
 * Next step source schema
 */
export const NextStepSourceSchema = z.enum([
  "editorial",
  "verified_fact",
  "system",
]);

/**
 * Next step schema with full validation
 */
export const NextStepSchema = z.object({
  id: z.string().min(1, "ID is required"),
  kind: NextStepKindSchema,
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(500, "Description too long").optional(),
  href: z.string().min(1, "href is required"),
  audience: AudienceSchema,
  reason: z.string().max(300, "Reason too long").optional(),
  priority: z.number().int().min(0).max(100).optional(),
  source: NextStepSourceSchema,
});

/**
 * Array of next steps
 */
export const NextStepsArraySchema = z.array(NextStepSchema);

/**
 * Search vertical schema
 */
export const SearchVerticalSchema = z.enum([
  "condition",
  "treatment",
  "assessment",
  "resource",
  "tool",
  "provider",
]);

/**
 * Navigation search result schema
 */
export const NavigationSearchResultSchema = z.object({
  id: z.string().min(1),
  vertical: SearchVerticalSchema,
  title: z.string().min(1),
  summary: z.string().optional(),
  href: z.string().min(1),
  matchedFields: z.array(z.string()).optional(),
  reason: z.string().optional(),
});

/**
 * Navigation intent schema
 */
export const NavigationIntentSchema = z.enum([
  "understand_symptoms",
  "understand_diagnosis",
  "compare_treatments",
  "find_care",
  "find_tool",
  "clinician_resources",
]);

/**
 * Intent entry point schema
 */
export const IntentEntryPointSchema = z.object({
  id: NavigationIntentSchema,
  label: z.string().min(1).max(50),
  description: z.string().min(1).max(200),
  href: z.string().min(1),
  icon: z.string().min(1),
  audience: AudienceSchema.optional(),
});

/**
 * Validate next steps data
 */
export function validateNextSteps(data: unknown): z.infer<typeof NextStepsArraySchema> {
  return NextStepsArraySchema.parse(data);
}

/**
 * Validate a single next step
 */
export function validateNextStep(data: unknown): z.infer<typeof NextStepSchema> {
  return NextStepSchema.parse(data);
}

/**
 * Safe validation that returns null on failure
 */
export function safeValidateNextSteps(data: unknown): z.infer<typeof NextStepsArraySchema> | null {
  const result = NextStepsArraySchema.safeParse(data);
  return result.success ? result.data : null;
}
