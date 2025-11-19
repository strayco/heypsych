/**
 * MedicalWebPage Schema Builder
 *
 * Generates schema.org MedicalWebPage structured data.
 * Applied universally to all entity pages for medical content context.
 */

import type { Entity } from '@/lib/types/database';
import { SchemaBuilder } from '../schema-builder';
import { SITE_CONFIG } from '../config';
import { hasEditorialDates, hasMedicalReviewer } from '@/lib/types/editorial';

export function buildMedicalWebPageSchema(entity: Entity, pageUrl: string): Record<string, any> {
  const builder = new SchemaBuilder()
    .setContext('https://schema.org')
    .setType('MedicalWebPage')
    .setId(`${pageUrl}#webpage`)
    .addProperty('name', entity.name)
    .addProperty('url', pageUrl);

  // Description
  builder.addPropertyIfExists(
    'description',
    entity.description || entity.data?.description
  );

  // Language
  builder.addProperty('inLanguage', 'en-US');

  // Is part of website
  builder.addProperty('isPartOf', {
    '@type': 'MedicalWebsite',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url
  });

  // About (main entity reference)
  const entityType = entity.type || entity.schema?.entity_type;
  const aboutType = getAboutType(entityType);

  if (aboutType) {
    builder.addProperty('about', {
      '@type': aboutType,
      '@id': `${pageUrl}#${aboutType.toLowerCase()}`,
      name: entity.name
    });
  }

  // Audience
  builder.addProperty('audience', {
    '@type': 'MedicalAudience',
    audienceType: 'Patient'
  });

  // Medical reviewer (if present)
  if (hasMedicalReviewer(entity)) {
    const reviewer = entity.editorial!.medicalReviewer!;
    builder.addProperty('reviewedBy', {
      '@type': 'Person',
      name: reviewer.name,
      credentials: reviewer.credentials,
      jobTitle: reviewer.specialty
    });
  }

  // Editorial dates (if present)
  if (hasEditorialDates(entity)) {
    const dates = entity.editorial!.dates!;

    builder.addProperty('datePublished', dates.published);
    builder.addProperty('dateModified', dates.lastUpdated);

    if (dates.lastMedicallyReviewed) {
      builder.addProperty('lastReviewed', dates.lastMedicallyReviewed);
    }
  }

  // Main content selector
  builder.addProperty('mainContentOfPage', {
    '@type': 'WebPageElement',
    cssSelector: 'main'
  });

  // Medical specialty
  builder.addProperty('specialty', 'Psychiatry');

  return builder.build();
}

function getAboutType(entityType?: string): string | null {
  switch (entityType) {
    case 'condition':
      return 'MedicalCondition';
    case 'medication':
      return 'Drug';
    case 'therapy':
    case 'treatment':
    case 'interventional':
    case 'investigational':
    case 'alternative':
    case 'supplement':
      return 'MedicalTherapy';
    default:
      return null;
  }
}
