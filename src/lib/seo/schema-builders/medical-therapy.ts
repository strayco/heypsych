/**
 * MedicalTherapy Schema Builder
 *
 * Generates schema.org MedicalTherapy structured data for therapy/psychotherapy pages.
 */

import type { Entity } from '@/lib/types/database';
import { SchemaBuilder, SchemaUtils } from '../schema-builder';
import { SITE_CONFIG } from '../config';

export function buildMedicalTherapySchema(entity: Entity): Record<string, any> {
  const builder = new SchemaBuilder()
    .setContext('https://schema.org')
    .setType('MedicalTherapy')
    .setId(`${SITE_CONFIG.url}/treatments/${entity.slug}#therapy`)
    .addProperty('name', entity.name);

  // Description
  builder.addPropertyIfExists(
    'description',
    entity.description || entity.data?.description || entity.data?.summary
  );

  // Indications (conditions treated)
  const indications = extractTherapyIndications(entity);
  builder.addPropertyIfExists('indication', indications);

  // Contraindications
  const contraindications = entity.data?.contraindications ||
                           entity.metadata?.clinical?.contraindications;
  builder.addPropertyIfExists('contraindication', contraindications);

  // Duration of treatment
  const duration = entity.data?.duration || entity.data?.typical_duration;
  builder.addPropertyIfExists('durationOfTreatment', duration);

  // Therapy type
  const therapyType = extractTherapyType(entity);
  builder.addPropertyIfExists('therapyType', therapyType);

  return builder.build();
}

function extractTherapyIndications(entity: Entity): Record<string, any>[] | null {
  const indications: Record<string, any>[] = [];

  // From clinical_metadata.primary_indications
  const primaryIndications = entity.data?.primary_indications ||
                            entity.metadata?.clinical?.primary_indications;

  if (Array.isArray(primaryIndications)) {
    primaryIndications.forEach((indication: string) => {
      indications.push(SchemaUtils.buildMedicalIndication(
        SchemaUtils.cleanText(indication)
      ));
    });
  }

  // From conditions_treated
  const conditions = entity.data?.conditions_treated ||
                    entity.metadata?.clinical?.conditions_treated;

  if (Array.isArray(conditions)) {
    conditions.forEach((condition: string) => {
      indications.push(SchemaUtils.buildMedicalIndication(
        SchemaUtils.cleanText(condition)
      ));
    });
  }

  return indications.length > 0 ? indications : null;
}

function extractTherapyType(entity: Entity): string | null {
  // Map therapy names to types
  const name = entity.name.toLowerCase();

  if (name.includes('cognitive') && name.includes('behavioral')) {
    return 'Cognitive Behavioral Therapy';
  }

  if (name.includes('dialectical')) {
    return 'Dialectical Behavior Therapy';
  }

  if (name.includes('psychodynamic')) {
    return 'Psychodynamic Therapy';
  }

  if (name.includes('interpersonal')) {
    return 'Interpersonal Therapy';
  }

  return 'Psychotherapy';
}
