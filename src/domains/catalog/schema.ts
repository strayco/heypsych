/**
 * Catalog Domain Schemas
 *
 * Zod schemas for validating catalog relationships.
 */
import { z } from "zod";
import { AudienceSchema, CatalogEntityTypeSchema } from "../navigation/schema";

/**
 * Relationship type schema
 */
export const CatalogRelationTypeSchema = z.enum([
  "SCREENS_FOR",
  "USED_FOR",
  "COMPARES_WITH",
  "SUPPORTS",
  "HAS_NEXT_STEP",
  "FIND_CARE_FOR",
]);

/**
 * Relationship status schema
 */
export const RelationshipStatusSchema = z.enum(["draft", "reviewed", "published"]);

/**
 * Catalog relationship schema
 */
export const CatalogRelationshipSchema = z.object({
  id: z.string().min(1, "ID is required"),
  source: z.object({
    type: CatalogEntityTypeSchema,
    slug: z.string().min(1, "Source slug is required"),
  }),
  target: z.object({
    type: CatalogEntityTypeSchema,
    slug: z.string().min(1, "Target slug is required"),
  }),
  relation: CatalogRelationTypeSchema,
  audience: z.array(AudienceSchema).min(1, "At least one audience is required"),
  displayLabel: z.string().max(100).optional(),
  rationale: z.string().max(500).optional(),
  priority: z.number().int().min(0).max(100),
  provenance: z.literal("editorial"),
  status: RelationshipStatusSchema,
});

/**
 * Relationship file schema
 */
export const RelationshipFileSchema = z.object({
  schemaVersion: z.string().regex(/^\d+\.\d+$/, "Schema version must be X.Y format"),
  entity: z.object({
    type: CatalogEntityTypeSchema,
    slug: z.string().min(1),
  }),
  updatedAt: z.string().datetime(),
  updatedBy: z.string().optional(),
  relationships: z.array(CatalogRelationshipSchema),
});

/**
 * Validate a relationship file
 */
export function validateRelationshipFile(
  data: unknown
): z.infer<typeof RelationshipFileSchema> {
  return RelationshipFileSchema.parse(data);
}

/**
 * Safe validation that returns result object
 */
export function safeValidateRelationshipFile(data: unknown): {
  success: boolean;
  data?: z.infer<typeof RelationshipFileSchema>;
  errors?: z.ZodError;
} {
  const result = RelationshipFileSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}

/**
 * Validate a single relationship
 */
export function validateRelationship(
  data: unknown
): z.infer<typeof CatalogRelationshipSchema> {
  return CatalogRelationshipSchema.parse(data);
}
