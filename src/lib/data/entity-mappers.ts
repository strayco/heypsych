// Entity mapping utilities - centralizes entity normalization logic
import type { Entity, SchemaName, EntityType } from "@/lib/types/database";

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
 * Maps a database row to an Entity with proper schema metadata
 * This centralizes the mapping logic used across all hooks
 */
export function mapRowToEntity(row: any, schemaName: SchemaName): Entity {
  return {
    id: row.id,
    schema_id: `schema-${schemaName}`,
    name: row.title,
    slug: row.slug,
    description: row.description,
    data: (row.content as Record<string, any>) || {},
    metadata: row.metadata,
    status: row.status,
    visibility: "public" as const,
    created_at: row.created_at,
    updated_at: row.updated_at,
    created_by: row.created_by,
    updated_by: row.updated_by,
    schema: buildEntitySchema(schemaName),
  };
}
