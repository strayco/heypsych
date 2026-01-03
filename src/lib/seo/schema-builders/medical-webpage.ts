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
import { getEntityType } from '@/lib/utils/entity-type';

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
  const entityType = getEntityType(entity);
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

  // Speakable schema for voice search and AI citations
  // Tells Google/AI which content is best for TTS and quick answers
  builder.addProperty('speakable', {
    '@type': 'SpeakableSpecification',
    cssSelector: [
      '[itemprop="description"]',      // Entity description/definition
      '[itemprop="abstract"]',         // Golden answer paragraph
      '.golden-answer',                // Explicit golden answer sections
      'h1',                            // Main heading
      '.key-points',                   // Key points/takeaways
      '.faq-answer'                    // FAQ answers
    ]
  });

  // Medical specialty
  builder.addProperty('specialty', 'Psychiatry');

  // Citations/references from editorial (E-E-A-T signal)
  const citations = extractCitations(entity);
  if (citations && citations.length > 0) {
    builder.addProperty('citation', citations);
  }

  return builder.build();
}

/**
 * Extract citations from editorial section or references section
 */
function extractCitations(entity: Entity): Record<string, any>[] | null {
  const citations: Record<string, any>[] = [];

  // From editorial.citations (new format)
  const editorialCitations = entity.data?.editorial?.citations;
  if (Array.isArray(editorialCitations)) {
    editorialCitations.forEach((url: string) => {
      if (typeof url === 'string' && url.startsWith('http')) {
        citations.push({
          '@type': 'CreativeWork',
          url: url,
          ...(url.includes('fda.gov') && { name: 'FDA Prescribing Information' }),
          ...(url.includes('ncbi.nlm.nih.gov') && { name: 'NCBI/PubMed Reference' }),
          ...(url.includes('niaaa.nih.gov') && { name: 'NIAAA Clinical Resource' })
        });
      }
    });
  }

  // From sections.references (legacy format)
  const sections = entity.data?.sections;
  if (Array.isArray(sections)) {
    const referencesSection = sections.find((s: any) => s.type === 'references');
    if (referencesSection?.items) {
      referencesSection.items.forEach((ref: any) => {
        if (ref.url && typeof ref.url === 'string') {
          citations.push({
            '@type': 'CreativeWork',
            name: ref.label || 'Reference',
            url: ref.url
          });
        }
      });
    }
  }

  return citations.length > 0 ? citations : null;
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
