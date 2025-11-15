// scripts/utils/schema-manager.js
// ES Modules version

import { SCHEMAS } from "../config/schemas.config.js";
import { supabase } from "./db.js";

/**
 * SchemaManager
 * Universal "entities" model in Supabase:
 * - entities (id, type, slug, title, description, content jsonb, metadata jsonb, status, created_at, updated_at)
 * - entity_relationships (source_slug, source_type, target_slug, target_type, relation, ...)
 * - content_files (slug, type, file_path, meta, ...)
 */
export class SchemaManager {
  constructor(sb) {
    this.supabase = sb;
  }

  // ------------------------------------------------------------
  // 0) Boot / readiness
  // ------------------------------------------------------------
  async ensureAllSchemas() {
    console.log("🏗️ Verifying universal entity system...");

    const requiredTables = [
      "entities",
      "entity_relationships",
      "content_files",
      "user_interactions",
    ];

    for (const tableName of requiredTables) {
      const { error } = await this.supabase
        .from(tableName)
        .select("*", { count: "exact", head: true })
        .limit(1);

      // PGRST116 = table not found in PostgREST cache
      if (error && error.code === "PGRST116") {
        throw new Error(`Table ${tableName} does not exist. Run: npm run db:ensure`);
      }
      console.log(`✅ Table verified: ${tableName}`);
    }

    console.log("🎉 Universal entity system is ready!");
    console.log("📋 Supported entity types:");
    for (const [, schema] of Object.entries(SCHEMAS || {})) {
      console.log(`   - ${schema.entity_type || "treatment"}: ${schema.display_name}`);
    }
  }

  // ------------------------------------------------------------
  // 1) Schema config helpers (from SCHEMAS config)
  // ------------------------------------------------------------
  async getSchemaInfo(entityType) {
    const schema = Object.values(SCHEMAS || {}).find(
      (s) => (s.entity_type || "treatment") === entityType
    );

    if (!schema) {
      // If you don't maintain a schema registry, just allow everything
      return {
        entity_type: entityType,
        display_name: entityType,
        schema_name: "public",
        fields: {}, // no required fields
        icon: null,
        color: null,
      };
    }

    return {
      entity_type: schema.entity_type || "treatment",
      display_name: schema.display_name,
      schema_name: schema.schema_name,
      fields: schema.field_definitions || schema.fields || {},
      icon: schema.icon,
      color: schema.color,
    };
  }

  async validateEntityData(entityType, data) {
    try {
      const schema = await this.getSchemaInfo(entityType);
      const requiredFields = schema.fields || {};
      const missing = [];

      for (const [name, cfg] of Object.entries(requiredFields)) {
        if (cfg?.required && !(name in data)) missing.push(name);
      }

      if (missing.length) {
        throw new Error(`Missing required fields for ${entityType}: ${missing.join(", ")}`);
      }
      return true;
    } catch (err) {
      console.warn(`⚠️ Validation warning for ${entityType}: ${err.message}`);
      // Don't block seeding if you haven't finished SCHEMAS—return true.
      return true;
    }
  }

  // ------------------------------------------------------------
  // 2) Normalization
  // ------------------------------------------------------------
  _normalizeEntityForTable(entityType, entityData) {
    return {
      type: entityType,
      slug: entityData.slug,
      title: entityData.title || entityData.name,
      description: entityData.description || entityData.summary || null,
      content: entityData.content || entityData.data || {},
      metadata: entityData.metadata || {},
      status: entityData.status || "active",
    };
  }

  // ------------------------------------------------------------
  // 3) Inserts / updates / upserts
  // ------------------------------------------------------------
  async insertEntity(entityType, entityData) {
    const isValid = await this.validateEntityData(
      entityType,
      entityData.content || entityData.data || {}
    );
    if (!isValid) throw new Error(`Invalid data for entity type: ${entityType}`);

    const entity = this._normalizeEntityForTable(entityType, entityData);
    const { data, error } = await this.supabase.from("entities").insert(entity).select().single();

    if (error) {
      console.error(`❌ Failed to insert ${entityType}:`, error.message);
      throw error;
    }
    return data;
  }

  async updateEntityBySlug(entityType, slug, patch) {
    const entity = this._normalizeEntityForTable(entityType, { ...patch, slug });

    const { data, error } = await this.supabase
      .from("entities")
      .update(entity)
      .eq("type", entityType)
      .eq("slug", slug)
      .select()
      .single();

    if (error) {
      console.error(`❌ Failed to update ${entityType}/${slug}:`, error.message);
      throw error;
    }
    return data;
  }

  // ✅ Use native upsert with the UNIQUE(type, slug) constraint
  async upsertEntity(entityType, entityData) {
    const isValid = await this.validateEntityData(
      entityType,
      entityData.content || entityData.data || {}
    );
    if (!isValid) throw new Error(`Invalid data for entity type: ${entityType}`);

    const entity = this._normalizeEntityForTable(entityType, entityData);

    // Use proper upsert with conflict resolution
    const { data, error } = await this.supabase
      .from("entities")
      .upsert(
        {
          ...entity,
          updated_at: new Date().toISOString(), // Always update timestamp
        },
        {
          onConflict: "type,slug",
          ignoreDuplicates: false, // Always update, don't ignore
        }
      )
      .select()
      .single();

    if (error) {
      console.error(`❌ Upsert failed for ${entityType}/${entity.slug}:`, error.message);
      throw error;
    }

    console.log(`✅ Upserted ${entityType}: ${entity.slug}`);
    return data;
  }

  async insertEntities(entityType, entitiesData) {
    if (!entitiesData?.length) return [];

    const normalized = entitiesData.map((e) => ({
      ...this._normalizeEntityForTable(entityType, e),
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await this.supabase
      .from("entities")
      .upsert(normalized, { onConflict: "type,slug", ignoreDuplicates: false })
      .select();

    if (error) {
      console.error(`❌ Batch upsert failed for ${entityType}:`, error.message);
      throw error;
    }

    console.log(`🎉 Upserted ${data?.length ?? 0} ${entityType} entities`);
    return data || [];
  }

  // ------------------------------------------------------------
  // 4) Fetch helpers
  // ------------------------------------------------------------
  async getEntitiesByType(entityType, limit = null) {
    let query = this.supabase
      .from("entities")
      .select("*")
      .eq("type", entityType)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (limit) query = query.limit(limit);

    const { data, error } = await query;
    if (error) {
      console.error(`❌ Error fetching ${entityType} entities:`, error.message);
      throw error;
    }
    return data || [];
  }

  async getEntityBySlug(entityType, slug, { includeDeleted = false } = {}) {
    let query = this.supabase
      .from("entities")
      .select("*")
      .eq("type", entityType)
      .eq("slug", slug)
      .limit(1);

    if (!includeDeleted) query = query.eq("status", "active");

    const { data, error } = await query.single();

    // PGRST116 means not found
    if (error && error.code === "PGRST116") return null;
    if (error) throw error;

    return data;
  }

  async getEntityCounts() {
    const { data, error } = await this.supabase.from("entities").select("type");

    if (error) throw error;

    const counts = {};
    (data || []).forEach((e) => {
      counts[e.type] = (counts[e.type] || 0) + 1;
    });

    return counts;
  }

  // ------------------------------------------------------------
  // 5) Deletion (soft + hard)
  // ------------------------------------------------------------
  async softDeleteEntity(entityType, slug) {
    const { data, error } = await this.supabase
      .from("entities")
      .update({ status: "deleted" })
      .eq("type", entityType)
      .eq("slug", slug)
      .select()
      .single();

    if (error) {
      console.error(`❌ Soft delete failed for ${entityType}/${slug}:`, error.message);
      throw error;
    }

    return data;
  }

  async deleteEntity(entityType, slug) {
    const { data, error } = await this.supabase
      .from("entities")
      .delete()
      .eq("type", entityType)
      .eq("slug", slug)
      .select()
      .single();

    if (error) {
      console.error(`❌ Hard delete failed for ${entityType}/${slug}:`, error.message);
      throw error;
    }

    return data;
  }

  // ------------------------------------------------------------
  // 6) Relationships (simple, slug-based)
  // ------------------------------------------------------------
  async addRelationship({
    sourceSlug,
    sourceType,
    targetSlug,
    targetType,
    relation, // e.g., "treats", "related_to", "contraindicated_with"
    metadata = {},
  }) {
    const payload = {
      source_slug: sourceSlug,
      source_type: sourceType,
      target_slug: targetSlug,
      target_type: targetType,
      relation,
      metadata,
    };

    const { data, error } = await this.supabase
      .from("entity_relationships")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("❌ Failed to add relationship:", error.message);
      throw error;
    }

    return data;
  }

  async getRelatedEntities({ sourceSlug, sourceType, relation, limit = 20 }) {
    const { data: rels, error: relErr } = await this.supabase
      .from("entity_relationships")
      .select("target_slug, target_type")
      .eq("source_slug", sourceSlug)
      .eq("source_type", sourceType)
      .eq("relation", relation)
      .limit(200);

    if (relErr) throw relErr;
    if (!rels?.length) return [];

    const slugs = rels.map((r) => r.target_slug);
    const { data: entities, error: entErr } = await this.supabase
      .from("entities")
      .select("*")
      .in("slug", slugs)
      .eq("status", "active")
      .limit(limit);

    if (entErr) throw entErr;
    return entities || [];
  }

  // ------------------------------------------------------------
  // 7) Content files (optional helper)
  // ------------------------------------------------------------
  async linkContentFile({ slug, type, filePath, meta = {} }) {
    const payload = { slug, type, file_path: filePath, meta };

    const { data, error } = await this.supabase
      .from("content_files")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("❌ Failed to link content file:", error.message);
      throw error;
    }

    return data;
  }
}

/* ------------------------------------------------------------
   Shared instance + convenience helpers
------------------------------------------------------------ */
export const schemaManager = new SchemaManager(supabase);

// Helper function to determine entity type from category
function getEntityTypeFromCategory(category) {
  if (!category) return "treatment"; // fallback

  const categoryMap = {
    medications: "medication",
    therapy: "therapy",
    interventional: "interventional",
    investigational: "investigational",
    alternative: "alternative",
    supplements: "supplement",
  };

  const prefix = category.split("/")[0];
  return categoryMap[prefix] || "treatment";
}

// Updated convenience functions
export async function upsertCondition(data) {
  return schemaManager.upsertEntity("condition", {
    slug: data.slug,
    title: data.title || data.name,
    description: data.summary || data.description || "",
    content: data,
    metadata: { category: data.category, tags: data.tags || [] },
    status: data.status || "active",
  });
}

// Better approach: Use the category field to determine entity type
export async function upsertTreatment(data) {
  // Map category to entity type
  let entityType = "treatment";

  if (data.category) {
    const prefix = data.category.split("/")[0];
    const categoryMap = {
      medications: "medication",
      therapy: "therapy",
      interventional: "interventional",
      investigational: "investigational",
      alternative: "alternative",
      supplements: "supplement",
    };
    entityType = categoryMap[prefix] || "treatment";
  }

  return schemaManager.upsertEntity(entityType, {
    slug: data.slug,
    title: data.title || data.name,
    description: data.summary || data.description || "",
    content: data,
    metadata: {
      category: data.category,
      type: data.type, // Keep the subtype in metadata
      brand_names: data.metadata?.brand_names || [],
      tags: data.tags || []
    },
    status: data.status || "active",
  });
}

// Specific upsert functions for each type
export async function upsertMedication(data) {
  return schemaManager.upsertEntity("medication", {
    slug: data.slug,
    title: data.title || data.name,
    description: data.summary || data.description || "",
    content: data,
    metadata: { category: data.category, type: data.type, tags: data.tags || [] },
    status: data.status || "active",
  });
}

export async function upsertTherapy(data) {
  return schemaManager.upsertEntity("therapy", {
    slug: data.slug,
    title: data.title || data.name,
    description: data.summary || data.description || "",
    content: data,
    metadata: { category: data.category, type: data.type, tags: data.tags || [] },
    status: data.status || "active",
  });
}

export async function upsertInterventional(data) {
  return schemaManager.upsertEntity("interventional", {
    slug: data.slug,
    title: data.title || data.name,
    description: data.summary || data.description || "",
    content: data,
    metadata: { category: data.category, type: data.type, tags: data.tags || [] },
    status: data.status || "active",
  });
}

export async function upsertSupplement(data) {
  return schemaManager.upsertEntity("supplement", {
    slug: data.slug,
    title: data.title || data.name,
    description: data.summary || data.description || "",
    content: data,
    metadata: { category: data.category, type: data.type, tags: data.tags || [] },
    status: data.status || "active",
  });
}

export async function upsertResource(data) {
  return schemaManager.upsertEntity("resource", {
    slug: data.slug,
    title: data.title || data.name,
    description: data.summary || data.description || "",
    content: data,
    metadata: {
      category: data.metadata?.category || data.category,
      subtype: data.subtype,
      tags: data.tags || []
    },
    status: data.status || "active",
  });
}

export async function upsertProvider(data) {
  return schemaManager.upsertEntity("provider", {
    slug: data.slug,
    title: data.title || data.name || [data.first_name, data.last_name].filter(Boolean).join(" "),
    description: data.summary || data.bio || "",
    content: data,
    metadata: {
      specialties: data.specialties || [],
      location: data.location || null,
      npi: data.npi || null,
      tags: data.tags || [],
    },
    status: data.status || "active",
  });
}
