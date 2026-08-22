"use client";

/**
 * ValidatedTags - Client component that validates tags against entities
 * Only renders tags that map to real entities (conditions, treatments, etc.)
 *
 * Uses the same strict validation rules as inline linking:
 * - No guessing, no fuzzy matching
 * - Tag must map cleanly to a validated entity
 * - Non-validated tags are hidden entirely
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { Entity, EntityType } from "@/lib/types/database";

// Client-safe validation function
async function validateEntityExists(name: string, type: EntityType): Promise<Entity | null> {
  try {
    // Make API call instead of direct database access
    const response = await fetch(`/api/entities/validate?name=${encodeURIComponent(name)}&type=${type}`);
    if (!response.ok) return null;
    const entity = await response.json();
    return entity;
  } catch (error) {
    console.error(`Error validating entity ${name}:`, error);
    return null;
  }
}

interface ValidatedTag {
  text: string;
  entity: Entity;
  route: string;
}

interface ValidatedTagsProps {
  tags: string[];
  className?: string;
}

/**
 * Get canonical route for entity type
 */
function getCanonicalRoute(entityType: string): string {
  switch (entityType) {
    case 'medication':
    case 'therapy':
    case 'treatment':
    case 'interventional':
    case 'alternative':
    case 'supplement':
    case 'investigational':
      return '/treatments';
    case 'condition':
      return '/conditions';
    case 'resource':
      return '/resources';
    case 'provider':
      return '/providers';
    default:
      return '/treatments';
  }
}

export function ValidatedTags({ tags, className = "" }: ValidatedTagsProps) {
  const [validatedTags, setValidatedTags] = useState<ValidatedTag[]>([]);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    async function validateTags() {
      if (!tags || tags.length === 0) {
        setIsValidating(false);
        return;
      }

      const validated: ValidatedTag[] = [];

      // Try to validate each tag as a condition first, then as other entity types
      const entityTypesToTry: EntityType[] = ['condition', 'treatment', 'medication'];

      for (const tag of tags) {
        let foundEntity: Entity | null = null;

        // Try each entity type until we find a match
        for (const entityType of entityTypesToTry) {
          try {
            const entity = await validateEntityExists(tag, entityType);
            if (entity && entity.id && entity.slug && entity.type && entity.name) {
              foundEntity = entity;
              break; // Stop on first valid match
            }
          } catch (error) {
            // Validation failed, try next type
            console.error(`Error validating tag "${tag}" as ${entityType}:`, error);
            continue;
          }
        }

        // If we found a valid entity, add it to validated tags
        if (foundEntity && foundEntity.type) {
          const route = getCanonicalRoute(foundEntity.type);
          validated.push({
            text: tag,
            entity: foundEntity,
            route: `${route}/${foundEntity.slug}`
          });
        }
      }

      setValidatedTags(validated);
      setIsValidating(false);
    }

    validateTags().catch((error) => {
      console.error('Error during tag validation:', error);
      setIsValidating(false);
    });
  }, [tags]);

  // Show a subtle loading state while validating (single line)
  if (isValidating) {
    return (
      <div className="flex gap-2 opacity-50">
        <Badge variant="outline" className="animate-pulse">
          Loading tags...
        </Badge>
      </div>
    );
  }

  // Don't render if no validated tags
  if (validatedTags.length === 0) {
    return null;
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {validatedTags.map((tag, i) => (
        <Link key={i} href={tag.route}>
          <Badge
            variant="outline"
            className="cursor-pointer transition-colors hover:bg-accent-tint hover:border-accent-border hover:text-accent-700"
          >
            {tag.text}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
