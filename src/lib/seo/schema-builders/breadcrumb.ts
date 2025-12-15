/**
 * BreadcrumbList Schema Builder
 *
 * Generates schema.org BreadcrumbList structured data for navigation context.
 * Shows hierarchical position of page in site structure.
 */

import type { Entity } from '@/lib/types/database';
import { SchemaBuilder } from '../schema-builder';
import { SITE_CONFIG } from '../config';
import { getEntityType, getCanonicalRoute } from '@/lib/utils/entity-type';

interface Breadcrumb {
  name: string;
  path: string;
}

export function buildBreadcrumbSchema(entity: Entity): Record<string, any> {
  const breadcrumbs = buildBreadcrumbPath(entity);

  const builder = new SchemaBuilder()
    .setContext('https://schema.org')
    .setType('BreadcrumbList');

  const items = breadcrumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: `${SITE_CONFIG.url}${crumb.path}`
  }));

  builder.addProperty('itemListElement', items);

  return builder.build();
}

function buildBreadcrumbPath(entity: Entity): Breadcrumb[] {
  const path: Breadcrumb[] = [
    { name: 'Home', path: '/' }
  ];

  const entityType = getEntityType(entity);

  switch (entityType) {
    case 'condition':
      path.push({ name: 'Conditions', path: '/conditions' });

      // Add category if available
      const conditionCategory = entity.data?.category || entity.metadata?.category;
      if (conditionCategory) {
        path.push({
          name: formatCategoryName(conditionCategory),
          path: `/conditions/${conditionCategory}`
        });
      }
      break;

    case 'medication':
    case 'therapy':
    case 'treatment':
    case 'interventional':
    case 'investigational':
    case 'alternative':
    case 'supplement':
      path.push({ name: 'Treatments', path: '/treatments' });

      // Add treatment category
      const treatmentCategory = extractTreatmentCategory(entity);
      if (treatmentCategory) {
        path.push({
          name: formatCategoryName(treatmentCategory),
          path: `/treatments/${treatmentCategory}`
        });
      }
      break;

    case 'resource':
      path.push({ name: 'Resources', path: '/resources' });

      // Add resource category
      const resourceCategory = entity.data?.category || entity.metadata?.category;
      if (resourceCategory) {
        path.push({
          name: formatCategoryName(resourceCategory),
          path: `/resources/${resourceCategory}`
        });
      }
      break;

    case 'provider':
      path.push({ name: 'Find a Psychiatrist', path: '/psychiatrists' });
      break;
  }

  // Add current entity as final breadcrumb
  path.push({
    name: entity.name,
    path: getEntityPath(entity)
  });

  return path;
}

function extractTreatmentCategory(entity: Entity): string | null {
  // From category field (e.g., "medications/antidepressants")
  const category = entity.data?.category || entity.metadata?.category;

  if (category && typeof category === 'string') {
    const parts = category.split('/');
    return parts[0]; // Return "medications" from "medications/antidepressants"
  }

  // Infer from entity type using consolidated utility
  const entityType = getEntityType(entity);
  const typeToCategory: Record<string, string> = {
    medication: 'medications',
    therapy: 'therapy',
    interventional: 'interventional',
    investigational: 'investigational',
    alternative: 'alternative',
    supplement: 'supplements',
  };

  return typeToCategory[entityType] ?? null;
}

function formatCategoryName(category: string): string {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' & ');
}

function getEntityPathForBreadcrumb(entity: Entity): string {
  const entityType = getEntityType(entity);
  const route = getCanonicalRoute(entityType);

  // Provider has special path
  if (entityType === 'provider') {
    return `/psychiatrists/${entity.slug}`;
  }

  // Use canonical route from utility
  return `${route}/${entity.slug}`;
}

// Legacy function name alias (can be removed after refactor)
function getEntityPath(entity: Entity): string {
  const entityType = getEntityType(entity);

  switch (entityType) {
    case 'condition':
      return `/conditions/${entity.slug}`;

    case 'medication':
    case 'therapy':
    case 'treatment':
    case 'interventional':
    case 'investigational':
    case 'alternative':
    case 'supplement':
      return `/treatments/${entity.slug}`;

    case 'resource':
      // All resources use canonical /resources/[slug] path
      return `/resources/${entity.slug}`;

    case 'provider':
      return `/psychiatrists/${entity.slug}`;

    default:
      return `/${entity.slug}`;
  }
}
