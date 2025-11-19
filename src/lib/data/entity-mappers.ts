// Entity mapping utilities - centralizes entity normalization logic
import type { Entity, SchemaName, EntityType } from "@/lib/types/database";
import type { EditorialMetadata } from "@/lib/types/editorial";

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
    return content.content;
  }

  return content;
}

/**
 * Extract editorial metadata from content or metadata fields
 */
function extractEditorialMetadata(content: any, metadata: any): EditorialMetadata | undefined {
  // Check for editorial data in content.editorial
  const contentEditorial = content?.editorial;

  // Check for editorial data in metadata.editorial
  const metadataEditorial = metadata?.editorial;

  // Merge both sources (content takes precedence)
  const editorial = { ...metadataEditorial, ...contentEditorial };

  // Return undefined if no editorial data
  if (!editorial || Object.keys(editorial).length === 0) {
    return undefined;
  }

  return editorial as EditorialMetadata;
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

    // NEW: E-A-T and SEO fields
    editorial: extractEditorialMetadata(normalizedContent, row.metadata),
    seo: extractSEOMetadata(normalizedContent, row.metadata),
    type: extractEntityType(schemaName, normalizedContent, row.metadata),
    tags: extractTags(normalizedContent, row.metadata),
  };
}
