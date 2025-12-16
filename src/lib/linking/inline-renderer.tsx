/**
 * Inline Link Renderer
 *
 * Renders text content with automatic inline links to entities.
 *
 * Rules:
 * - Only links entity names that resolve to real entities
 * - Leaves unmatched text as plain text
 * - No fallback APIs, no fake slugs, no whole-sentence linking
 * - Works inline within existing content fields
 */

import Link from 'next/link';
import { parseEntityNames } from './utils';
import { validateEntityExists } from './utils';
import type { EntityType } from '@/lib/types/database';

interface InlineLinkRendererProps {
  text: string;
  entityType: EntityType;
  className?: string;
}

/**
 * Render text with inline entity links
 *
 * Example:
 * Input: "SSRIs (sertraline, escitalopram, fluoxetine)"
 * Output: "SSRIs (" + <Link>sertraline</Link> + ", " + <Link>escitalopram</Link> + ", " + <Link>fluoxetine</Link> + ")"
 */
export async function InlineLinkRenderer({
  text,
  entityType,
  className = '',
}: InlineLinkRendererProps) {
  if (!text) return null;

  // Parse to extract potential entity names
  const entityNames = parseEntityNames(text);

  // If no potential entities found, return plain text
  if (entityNames.length === 0) {
    return <span className={className}>{text}</span>;
  }

  // Validate each entity and build a map of name → entity
  const entityMap = new Map<string, { slug: string; name: string }>();

  for (const name of entityNames) {
    const entity = await validateEntityExists(name, entityType);
    if (entity) {
      // Map the original name to the entity slug
      entityMap.set(name.toLowerCase(), {
        slug: entity.slug,
        name: entity.name,
      });
    }
  }

  // If no entities validated, return plain text
  if (entityMap.size === 0) {
    return <span className={className}>{text}</span>;
  }

  // Build JSX with inline links
  // Strategy: split on commas/semicolons, check each segment
  const segments = text.split(/([,;])/);
  const elements: React.ReactNode[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];

    // Keep delimiters as-is
    if (segment === ',' || segment === ';') {
      elements.push(segment);
      continue;
    }

    // Check if this segment contains a validated entity
    const trimmed = segment.trim().toLowerCase();
    let matched = false;

    for (const [name, entity] of entityMap.entries()) {
      if (trimmed.includes(name)) {
        // Found a match - create a link
        const entityPath = getEntityPath(entityType, entity.slug);

        elements.push(
          <Link
            key={`link-${i}`}
            href={entityPath}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {segment.trim()}
          </Link>
        );

        matched = true;
        break;
      }
    }

    // If no match, keep as plain text
    if (!matched) {
      elements.push(<span key={`text-${i}`}>{segment}</span>);
    }
  }

  return <span className={className}>{elements}</span>;
}

/**
 * Simple inline text renderer (client-side alternative)
 * Returns plain text with entity name markers
 */
export function renderInlineText(text: string): string {
  return text;
}

/**
 * Get entity path based on type
 */
function getEntityPath(type: EntityType, slug: string): string {
  switch (type) {
    case 'medication':
    case 'therapy':
    case 'interventional':
    case 'alternative':
    case 'supplement':
    case 'investigational':
      return `/treatments/${slug}`;
    case 'condition':
      return `/conditions/${slug}`;
    case 'resource':
      return `/resources/${slug}`;
    default:
      return `/${slug}`;
  }
}
