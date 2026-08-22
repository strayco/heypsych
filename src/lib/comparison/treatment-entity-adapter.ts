/**
 * Treatment Entity Adapter
 *
 * Converts TreatmentV3 to Entity format for compatibility with existing
 * components that expect the Entity interface.
 *
 * This is a transitional adapter - long-term, components should be updated
 * to accept TreatmentV3 directly.
 */

import type { TreatmentV3 } from "../schemas/treatment-v3";
import type { Entity, EntityType } from "../types/database";

/**
 * Maps treatment modality to entity type
 */
function modalityToEntityType(modality: string): EntityType {
  const mapping: Record<string, EntityType> = {
    medication: "medication",
    therapy: "therapy",
    interventional: "interventional",
    investigational: "investigational",
    alternative: "alternative",
    supplement: "supplement",
  };
  return mapping[modality] || "treatment";
}

/**
 * Converts TreatmentV3 to Entity format for backward compatibility
 */
export function treatmentV3ToEntity(treatment: TreatmentV3): Entity {
  const modality = treatment.taxonomy.modality;
  const entityType = modalityToEntityType(modality);

  return {
    // Required fields
    id: `treatment-${treatment.identity.slug}`,
    schema_id: modality,
    name: treatment.identity.name,
    slug: treatment.identity.slug,
    description: treatment.summary || treatment.description,

    // Content/data - the full V3 treatment
    data: treatment as unknown as Record<string, unknown>,

    // Metadata
    metadata: {
      category: treatment.taxonomy.category,
      drug_classes: treatment.taxonomy.drug_classes,
      source: "json-file",
      schema_version: treatment.schema_version,
      brand_names: treatment.identity.brand_names,
      wikidata_qid: treatment.identity.wikidata_qid,
    },

    // Status
    status: "active",
    visibility: "public",

    // Timestamps (not available in V3, use current time)
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),

    // Entity type
    type: entityType,

    // Tags from taxonomy
    tags: treatment.taxonomy.tags,

    // SEO from V3
    seo: treatment.seo,

    // Editorial from V3 (cast to handle citation type differences)
    editorial: treatment.editorial as Entity['editorial'],

    // Schema info
    schema: {
      id: modality,
      entity_type: entityType,
      schema_name: modality,
      display_name: modality.charAt(0).toUpperCase() + modality.slice(1),
      icon: "",
      color: "",
      field_definitions: {},
      ui_config: {},
      validation_rules: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
}

/**
 * Checks if an entity has V3 treatment data
 */
export function hasV3TreatmentData(entity: Entity): boolean {
  const data = entity.data as Record<string, unknown> | undefined;
  return data?.schema_version === 3 && data?.kind === "treatment";
}

/**
 * Extracts TreatmentV3 from an entity if present
 */
export function extractV3Treatment(entity: Entity): TreatmentV3 | null {
  if (!hasV3TreatmentData(entity)) return null;
  return entity.data as unknown as TreatmentV3;
}
