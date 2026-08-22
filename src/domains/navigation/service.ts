/**
 * Navigation Service
 *
 * Converts catalog relationships into displayable NextSteps.
 * This is the bridge between the catalog domain and navigation UI.
 */
import type { NextStep, Audience, CatalogEntityType } from "./types";
import type { CatalogRelationship } from "../catalog/types";
import { getRelationshipsForEntity } from "../catalog/repository";

/**
 * Map catalog entity types to URL prefixes
 */
const entityTypeToUrlPrefix: Record<CatalogEntityType, string> = {
  condition: "/conditions",
  treatment: "/treatments",
  assessment: "/resources",
  tool: "/tools",
  resource: "/resources",
  provider: "/psychiatrists",
  article: "/guide",
};

/**
 * Map relationship types to NextStep kinds
 */
function relationToNextStepKind(
  relation: CatalogRelationship["relation"],
  targetType: CatalogEntityType
): NextStep["kind"] {
  switch (relation) {
    case "SCREENS_FOR":
      return "assessment";
    case "USED_FOR":
      return targetType === "treatment" ? "treatment" : "condition";
    case "COMPARES_WITH":
      return "comparison";
    case "SUPPORTS":
      return "tool";
    case "HAS_NEXT_STEP":
      return targetType === "condition"
        ? "condition"
        : targetType === "treatment"
          ? "treatment"
          : "article";
    case "FIND_CARE_FOR":
      return "find_care";
    default:
      return "article";
  }
}

/**
 * Build the URL for a relationship target
 */
function buildTargetUrl(relationship: CatalogRelationship): string {
  const { target, relation } = relationship;

  // Special case for Find Care - link to psychiatrist search
  if (relation === "FIND_CARE_FOR") {
    return "/psychiatrists";
  }

  const prefix = entityTypeToUrlPrefix[target.type] || "/resources";
  return `${prefix}/${target.slug}`;
}

/**
 * Convert a CatalogRelationship to a NextStep
 */
function relationshipToNextStep(
  relationship: CatalogRelationship,
  audience: Audience
): NextStep {
  return {
    id: relationship.id,
    kind: relationToNextStepKind(relationship.relation, relationship.target.type),
    title: relationship.displayLabel || formatDefaultTitle(relationship),
    description: undefined, // Could be added to relationship schema if needed
    href: buildTargetUrl(relationship),
    audience,
    reason: relationship.rationale,
    priority: relationship.priority,
    source: "editorial",
  };
}

/**
 * Format a default title from the relationship
 */
function formatDefaultTitle(relationship: CatalogRelationship): string {
  const { target, relation } = relationship;

  switch (relation) {
    case "SCREENS_FOR":
      return `Take assessment`;
    case "USED_FOR":
      return `Learn about ${formatSlug(target.slug)}`;
    case "COMPARES_WITH":
      return `Compare with ${formatSlug(target.slug)}`;
    case "SUPPORTS":
      return `Explore ${formatSlug(target.slug)}`;
    case "FIND_CARE_FOR":
      return "Find care providers";
    case "HAS_NEXT_STEP":
      return `Explore ${formatSlug(target.slug)}`;
    default:
      return formatSlug(target.slug);
  }
}

/**
 * Format a slug for display
 */
function formatSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get next steps for an entity
 */
export async function getNextStepsForEntity(
  entityType: CatalogEntityType,
  slug: string,
  audience: Audience = "patient"
): Promise<NextStep[]> {
  const relationships = await getRelationshipsForEntity(entityType, slug, {
    audience,
    publishedOnly: true,
  });

  return relationships.map((r) => relationshipToNextStep(r, audience));
}

/**
 * Get treatment-related next steps for a condition
 */
export async function getTreatmentNextSteps(
  conditionSlug: string,
  audience: Audience = "patient"
): Promise<NextStep[]> {
  const relationships = await getRelationshipsForEntity("condition", conditionSlug, {
    relation: "USED_FOR",
    audience,
    publishedOnly: true,
  });

  return relationships.map((r) => relationshipToNextStep(r, audience));
}

/**
 * Get Find Care next step for a condition
 */
export async function getFindCareNextStep(
  conditionSlug: string
): Promise<NextStep | null> {
  const relationships = await getRelationshipsForEntity("condition", conditionSlug, {
    relation: "FIND_CARE_FOR",
    publishedOnly: true,
  });

  if (relationships.length === 0) {
    return null;
  }

  return relationshipToNextStep(relationships[0], "patient");
}

/**
 * Create a "questions to ask your provider" fallback next step
 * Used when no OCD-specific assessment exists
 */
export function createProviderQuestionsNextStep(
  conditionSlug: string,
  conditionName: string
): NextStep {
  return {
    id: `${conditionSlug}-provider-questions`,
    kind: "clinician_resource",
    title: "Questions to discuss with a professional",
    description: `Helpful questions to bring to your appointment when discussing ${conditionName}`,
    href: `/conditions/${conditionSlug}#questions-for-provider`,
    audience: "patient",
    reason:
      "No validated self-assessment for this condition is currently available. Speaking with a healthcare provider is the recommended path for evaluation.",
    priority: 5,
    source: "editorial",
  };
}
