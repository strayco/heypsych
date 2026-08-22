/**
 * Catalog Relationship Repository
 *
 * Loads and queries catalog relationships from JSON files.
 * This is the V1 implementation that can be replaced with PostgreSQL later.
 */
import { promises as fs } from "fs";
import path from "path";
import type {
  CatalogRelationship,
  RelationshipFile,
  RelationshipQueryOptions,
} from "./types";
import type { Audience, CatalogEntityType } from "../navigation/types";
import { safeValidateRelationshipFile } from "./schema";

// Cache for loaded relationship files
const relationshipCache = new Map<string, RelationshipFile>();

/**
 * Get the path to a relationship file
 */
function getRelationshipFilePath(entityType: CatalogEntityType, slug: string): string {
  return path.join(process.cwd(), "data", "relationships", `${slug}.json`);
}

/**
 * Load a relationship file from disk
 */
async function loadRelationshipFile(
  entityType: CatalogEntityType,
  slug: string
): Promise<RelationshipFile | null> {
  const cacheKey = `${entityType}:${slug}`;

  // Check cache first
  if (relationshipCache.has(cacheKey)) {
    return relationshipCache.get(cacheKey)!;
  }

  const filePath = getRelationshipFilePath(entityType, slug);

  try {
    const content = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(content);

    // Validate the file
    const result = safeValidateRelationshipFile(data);
    if (!result.success) {
      console.error(`Invalid relationship file ${filePath}:`, result.errors);
      return null;
    }

    // Cache and return
    relationshipCache.set(cacheKey, result.data!);
    return result.data!;
  } catch (error) {
    // File doesn't exist is not an error - many entities won't have relationships
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    console.error(`Error loading relationship file ${filePath}:`, error);
    return null;
  }
}

/**
 * Get relationships for an entity
 */
export async function getRelationshipsForEntity(
  entityType: CatalogEntityType,
  slug: string,
  options: RelationshipQueryOptions = {}
): Promise<CatalogRelationship[]> {
  const file = await loadRelationshipFile(entityType, slug);
  if (!file) {
    return [];
  }

  let relationships = file.relationships;

  // Filter by published status (default: only published)
  if (options.publishedOnly !== false) {
    relationships = relationships.filter((r) => r.status === "published");
  }

  // Filter by relation type
  if (options.relation) {
    relationships = relationships.filter((r) => r.relation === options.relation);
  }

  // Filter by audience
  if (options.audience) {
    relationships = relationships.filter((r) =>
      r.audience.includes(options.audience as Audience)
    );
  }

  // Sort by priority
  relationships = [...relationships].sort((a, b) => a.priority - b.priority);

  return relationships;
}

/**
 * Get relationships of a specific type for an entity
 */
export async function getRelationshipsByType(
  entityType: CatalogEntityType,
  slug: string,
  relationType: CatalogRelationship["relation"],
  audience?: Audience
): Promise<CatalogRelationship[]> {
  return getRelationshipsForEntity(entityType, slug, {
    relation: relationType,
    audience,
    publishedOnly: true,
  });
}

/**
 * Check if an entity has any relationships defined
 */
export async function hasRelationships(
  entityType: CatalogEntityType,
  slug: string
): Promise<boolean> {
  const relationships = await getRelationshipsForEntity(entityType, slug);
  return relationships.length > 0;
}

/**
 * Clear the relationship cache (useful for tests or hot reload)
 */
export function clearRelationshipCache(): void {
  relationshipCache.clear();
}
