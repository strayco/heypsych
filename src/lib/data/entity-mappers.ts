// Entity mapping utilities - centralizes entity normalization logic
import type { Entity, SchemaName, EntityType } from "@/lib/types/database";
import type { EditorialMetadata, EditorialDates } from "@/lib/types/editorial";
import { EditorialService } from "./editorial-service";

type SchemaConfig = {
  icon: string;
  color: string;
  display: string;
};

const SCHEMA_CONFIG: Record<SchemaName, SchemaConfig> = {
  medication: { icon: "pill", color: "purple", display: "Medication" },
  interventional: { icon: "zap", color: "yellow", display: "Interventional" },
  investigational: { icon: "flask-conical", color: "cyan", display: "Investigational" },
  alternative: { icon: "leaf", color: "emerald", display: "Alternative" },
  therapy: { icon: "message-circle", color: "orange", display: "Therapy" },
  supplement: { icon: "heart", color: "pink", display: "Supplement" },
  treatment: { icon: "pill", color: "green", display: "Treatment" },
  condition: { icon: "brain", color: "blue", display: "Condition" },
  resource: { icon: "book", color: "slate", display: "Resource" },
  provider: { icon: "user", color: "gray", display: "Provider" },
};

/**
 * Map category path to schema name
 * SINGLE SOURCE OF TRUTH - imported by entity-service.ts and use-entities.ts
 * 
 * @param category - Category path like "medications/antidepressants"
 * @returns SchemaName for the category
 */
export function categoryToSchemaName(category?: string | null): SchemaName {
  if (!category) return "treatment";
  const first = category.split("/")[0];
  switch (first) {
    case "medications":
      return "medication";
    case "interventional":
      return "interventional";
    case "investigational":
      return "investigational";
    case "alternative":
      return "alternative";
    case "therapy":
      return "therapy";
    case "supplements":
      return "supplement";
    default:
      return "treatment";
  }
}

// Comprehensive medication type mapping
export const TREATMENT_TYPE_MAP: Record<string, string[]> = {
  medication: [
    "medication",
    "antidepressant",
    "antipsychotic",
    "anxiolytic",
    "benzodiazepine",
    "hypnotic",
    "sedative-hypnotic",
    "stimulant",
    "mood-stabilizer",
    "anticonvulsant",
    "nootropic",
    "cognitive-enhancer",
    "adhd-medication",
    "addiction-treatment",
    "opioid-dependence-treatment",
    "alcohol-dependence-treatment",
    "smoking-cessation-antidepressant",
    "antihistamine",
    "muscle-relaxant",
    "barbiturate",
    "anesthetic",
    "antiemetic",
    "antihypertensive",
    "opioid-antagonist",
    "combination-medication",
    "antidepressant-antipsychotic-combination",
    "combination-antipsychotic-antihistamine",
    "wakefulness-promoting-agent",
    "non-stimulant-adhd-medication",
    "sleep-medication",
    "herbal",
  ],
  interventional: ["interventional"],
  investigational: ["investigational"],
  alternative: ["alternative"],
  therapy: ["therapy"],
  supplement: ["supplement"],
};

function buildEntitySchema(schemaName: SchemaName) {
  const config = SCHEMA_CONFIG[schemaName] || SCHEMA_CONFIG.treatment;
  return {
    id: `schema-${schemaName}`,
    entity_type: schemaName as EntityType,
    schema_name: schemaName,
    display_name: config.display,
    icon: config.icon,
    color: config.color,
    field_definitions: {},
    ui_config: {},
    validation_rules: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Normalize stored JSON so consumers always get the actual entity payload.
 * Some legacy rows store the entire file (with a nested `content` object);
 * peel that layer off so downstream UI can read `description`, `symptoms`, etc.
 *
 * IMPORTANT: Preserves top-level fields (like `author`, `pillar`) when unwrapping
 */
export function normalizeEntityContent(content: any): Record<string, any> {
  if (!content || typeof content !== "object") {
    return content ?? {};
  }

  // Some entries persisted as { ..., content: { ...actualFields } }
  if (
    "content" in content &&
    content.content &&
    typeof content.content === "object" &&
    !Array.isArray(content.content)
  ) {
    // Unwrap the nested content, but preserve top-level fields
    const { content: nestedContent, ...topLevelFields } = content;

    // Merge: nested content takes precedence, but preserve unique top-level fields
    return {
      ...topLevelFields,      // author, pillar, etc.
      ...nestedContent,       // sections, conclusion, introduction
    };
  }

  return content;
}

/**
 * Extract and resolve editorial metadata from content or metadata fields
 * 
 * This function:
 * 1. Extracts raw editorial data from content.editorial or metadata.editorial
 * 2. Resolves medicalReviewerIds to full MedicalReviewerInfo objects
 * 3. Resolves authorId to full AuthorInfo objects
 * 4. Builds EditorialDates from lastReviewed/lastUpdated fields
 * 
 * @param content - Entity content object
 * @param metadata - Entity metadata object
 * @param entityTimestamps - Entity created_at/updated_at for fallback dates
 */
function extractEditorialMetadata(
  content: any, 
  metadata: any, 
  entityTimestamps?: { created_at?: string; updated_at?: string }
): EditorialMetadata | undefined {
  // Check for editorial data in content.editorial
  const contentEditorial = content?.editorial;

  // Check for editorial data in metadata.editorial
  const metadataEditorial = metadata?.editorial;

  // Merge both sources (content takes precedence)
  const rawEditorial = { ...metadataEditorial, ...contentEditorial };

  // Return undefined if no editorial data
  if (!rawEditorial || Object.keys(rawEditorial).length === 0) {
    return undefined;
  }

  // Build resolved editorial metadata
  const editorial: EditorialMetadata = {
    // Preserve raw fields
    medicalReviewerIds: rawEditorial.medicalReviewerIds,
    authorId: rawEditorial.authorId,
    reviewBoard: rawEditorial.reviewBoard,
    lastReviewed: rawEditorial.lastReviewed,
    lastUpdated: rawEditorial.lastUpdated,
  };

  // Resolve medicalReviewerIds to full MedicalReviewerInfo
  if (rawEditorial.medicalReviewerIds && Array.isArray(rawEditorial.medicalReviewerIds)) {
    const reviewer = EditorialService.getFirstReviewer(rawEditorial.medicalReviewerIds);
    if (reviewer) {
      editorial.medicalReviewer = reviewer;
    }
  }

  // Resolve authorId to full AuthorInfo
  if (rawEditorial.authorId) {
    const author = EditorialService.getAuthorById(rawEditorial.authorId);
    if (author) {
      editorial.author = author;
    }
  }

  // Build EditorialDates from available date fields
  const lastReviewed = rawEditorial.lastReviewed || rawEditorial.lastUpdated || entityTimestamps?.updated_at;
  const lastUpdated = rawEditorial.lastUpdated || entityTimestamps?.updated_at;
  const published = entityTimestamps?.created_at;

  if (lastReviewed || lastUpdated || published) {
    editorial.dates = {
      published: published || lastUpdated || new Date().toISOString(),
      lastUpdated: lastUpdated || new Date().toISOString(),
      lastMedicallyReviewed: lastReviewed || lastUpdated || new Date().toISOString(),
    };
  }

  // Pass through any other fields
  if (rawEditorial.reviewHistory) editorial.reviewHistory = rawEditorial.reviewHistory;
  if (rawEditorial.citations) editorial.citations = rawEditorial.citations;
  if (rawEditorial.customDisclaimer) editorial.customDisclaimer = rawEditorial.customDisclaimer;
  if (rawEditorial.evidenceLevel) editorial.evidenceLevel = rawEditorial.evidenceLevel;
  if (rawEditorial.qualityRating) editorial.qualityRating = rawEditorial.qualityRating;
  if (rawEditorial.internalNotes) editorial.internalNotes = rawEditorial.internalNotes;

  return editorial;
}

/**
 * Extract SEO overrides from content or metadata
 */
function extractSEOMetadata(content: any, metadata: any) {
  const contentSEO = content?.seo;
  const metadataSEO = metadata?.seo;

  const seo = { ...metadataSEO, ...contentSEO };

  if (!seo || Object.keys(seo).length === 0) {
    return undefined;
  }

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords
  };
}

/**
 * Extract entity type from schema name or explicit type field
 */
function extractEntityType(schemaName: SchemaName, content: any, metadata: any): EntityType | undefined {
  // Explicit type in content takes precedence
  if (content?.type) return content.type as EntityType;
  if (content?.kind) return content.kind as EntityType;

  // Metadata type
  if (metadata?.type) return metadata.type as EntityType;

  // Fall back to schema name
  return schemaName as EntityType;
}

/**
 * Extract tags from content or metadata
 */
function extractTags(content: any, metadata: any): string[] | undefined {
  const contentTags = content?.tags;
  const metadataTags = metadata?.tags;

  // Merge and deduplicate
  const allTags = [
    ...(Array.isArray(contentTags) ? contentTags : []),
    ...(Array.isArray(metadataTags) ? metadataTags : [])
  ];

  const uniqueTags = Array.from(new Set(allTags));

  return uniqueTags.length > 0 ? uniqueTags : undefined;
}

/**
 * Maps a database row to an Entity with proper schema metadata
 * This centralizes the mapping logic used across all hooks
 */
export function mapRowToEntity(row: any, schemaName: SchemaName): Entity {
  const normalizedContent = normalizeEntityContent(row.content);

  // Extract timestamps for editorial date fallbacks
  const entityTimestamps = {
    created_at: row.created_at,
    updated_at: row.updated_at,
  };

  return {
    id: row.id,
    schema_id: `schema-${schemaName}`,
    name: row.title,
    slug: row.slug,
    description: row.description ?? normalizedContent?.description ?? null,
    data: normalizedContent || {},
    metadata: row.metadata,
    status: row.status,
    visibility: "public" as const,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
    updated_by: row.updated_by,
    schema: buildEntitySchema(schemaName),

    // E-A-T and SEO fields (with resolved reviewer/author objects)
    editorial: extractEditorialMetadata(normalizedContent, row.metadata, entityTimestamps),
    seo: extractSEOMetadata(normalizedContent, row.metadata),
    type: extractEntityType(schemaName, normalizedContent, row.metadata),
    tags: extractTags(normalizedContent, row.metadata),
  };
}
