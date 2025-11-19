/**
 * Drug Schema Builder
 *
 * Generates schema.org Drug structured data for medication pages.
 * Includes drug class, indications, side effects, dosing, interactions, etc.
 */

import type { Entity } from '@/lib/types/database';
import { SchemaBuilder, SchemaUtils } from '../schema-builder';
import { SITE_CONFIG } from '../config';

export function buildDrugSchema(entity: Entity): Record<string, any> {
  const builder = new SchemaBuilder()
    .setContext('https://schema.org')
    .setType('Drug')
    .setId(`${SITE_CONFIG.url}/treatments/${entity.slug}#drug`)
    .addProperty('name', entity.name);

  // Description
  builder.addPropertyIfExists(
    'description',
    entity.description || entity.data?.description || entity.data?.summary
  );

  // Brand names (alternate names)
  const brandNames = extractBrandNames(entity);
  builder.addPropertyIfExists('alternateName', brandNames);

  // Active ingredient
  const activeIngredient = extractActiveIngredient(entity);
  builder.addPropertyIfExists('activeIngredient', activeIngredient);

  // Drug class
  const drugClasses = entity.data?.drug_classes || entity.metadata?.drug_classes;
  builder.addPropertyIfExists('drugClass', drugClasses);

  // Administration route
  const routes = entity.data?.administration_routes || entity.metadata?.administration_routes;
  if (Array.isArray(routes) && routes.length > 0) {
    builder.addProperty('administrationRoute', routes[0]);
  }

  // Available strengths
  const strengths = extractDosageStrengths(entity);
  builder.addPropertyIfExists('availableStrength', strengths);

  // Dosage forms
  const forms = extractDosageForms(entity);
  builder.addPropertyIfExists('dosageForm', forms);

  // Prescription status
  const prescriptionStatus = entity.data?.prescription_status || entity.metadata?.prescription_status;
  if (prescriptionStatus === 'Prescription Required') {
    builder.addProperty('prescriptionStatus', 'PrescriptionOnly');
  } else if (prescriptionStatus === 'Over-the-Counter') {
    builder.addProperty('prescriptionStatus', 'OTC');
  }

  // Generic available
  const genericAvailable = entity.data?.generic_available || entity.metadata?.generic_available;
  builder.addPropertyIfExists('isAvailableGenerically', genericAvailable);

  // Legal status (DEA schedule)
  const deaSchedule = entity.data?.dea_schedule || entity.metadata?.dea_schedule;
  if (deaSchedule) {
    builder.addProperty('legalStatus', {
      '@type': 'DrugLegalStatus',
      applicableLocation': 'US',
      schedule: deaSchedule
    });
  }

  // Indications
  const indications = extractIndications(entity);
  builder.addPropertyIfExists('indication', indications);

  // Contraindications
  const contraindications = extractContraindications(entity);
  builder.addPropertyIfExists('contraindication', contraindications);

  // Warnings
  const warnings = extractWarnings(entity);
  builder.addPropertyIfExists('warning', warnings);

  // Adverse effects (side effects)
  const adverseEffects = extractAdverseEffects(entity);
  builder.addPropertyIfExists('adverseOutcome', adverseEffects);

  // Drug interactions
  const interactions = extractInteractions(entity);
  builder.addPropertyIfExists('interactingDrug', interactions);

  // Mechanism of action
  const mechanism = entity.data?.mechanism_of_action;
  builder.addPropertyIfExists('mechanismOfAction', mechanism);

  // Pregnancy category
  const pregnancyCategory = entity.data?.pregnancy_category;
  builder.addPropertyIfExists('pregnancyCategory', pregnancyCategory);

  return builder.build();
}

function extractBrandNames(entity: Entity): string[] | null {
  const brandNames = entity.data?.brand_names || entity.metadata?.brand_names;

  if (Array.isArray(brandNames) && brandNames.length > 0) {
    return brandNames;
  }

  // Extract from name if format is "Generic (Brand)"
  const match = entity.name.match(/\(([^)]+)\)/);
  if (match) {
    return [match[1]];
  }

  return null;
}

function extractActiveIngredient(entity: Entity): string | null {
  // Usually the first part of the name
  const name = entity.name.split('(')[0].trim();

  // Remove brand name suffix
  return name;
}

function extractDosageStrengths(entity: Entity): Record<string, any>[] | null {
  const strengths: Record<string, any>[] = [];

  // From sections.dosage_forms
  const sections = entity.data?.sections;
  if (Array.isArray(sections)) {
    const dosageSection = sections.find((s: any) => s.type === 'dosage_forms');

    if (dosageSection?.items) {
      dosageSection.items.forEach((item: any) => {
        if (typeof item === 'string') {
          // Parse "25mg tablets" -> 25mg
          const match = item.match(/(\d+)\s*(mg|mcg|g)/i);
          if (match) {
            strengths.push(SchemaUtils.buildDrugStrength(match[1], match[2]));
          }
        }
      });
    }
  }

  // From metadata.available_strengths
  const metaStrengths = entity.metadata?.available_strengths;
  if (Array.isArray(metaStrengths)) {
    metaStrengths.forEach((strength: string) => {
      const match = strength.match(/(\d+)\s*(mg|mcg|g)/i);
      if (match) {
        strengths.push(SchemaUtils.buildDrugStrength(match[1], match[2]));
      }
    });
  }

  return strengths.length > 0 ? strengths : null;
}

function extractDosageForms(entity: Entity): string[] | null {
  const forms: Set<string> = new Set();

  // From sections.dosage_forms
  const sections = entity.data?.sections;
  if (Array.isArray(sections)) {
    const dosageSection = sections.find((s: any) => s.type === 'dosage_forms');

    if (dosageSection?.items) {
      dosageSection.items.forEach((item: any) => {
        if (typeof item === 'string') {
          // Extract form from "25mg tablets"
          if (item.includes('tablet')) forms.add('Tablet');
          if (item.includes('capsule')) forms.add('Capsule');
          if (item.includes('liquid') || item.includes('solution')) forms.add('Solution');
          if (item.includes('injection')) forms.add('Injection');
          if (item.includes('patch')) forms.add('Patch');
        }
      });
    }
  }

  return forms.size > 0 ? Array.from(forms) : null;
}

function extractIndications(entity: Entity): Record<string, any>[] | null {
  const indications: Record<string, any>[] = [];

  // From clinical_metadata.primary_indications
  const primaryIndications = entity.data?.primary_indications ||
                            entity.clinical_metadata?.primary_indications;

  if (Array.isArray(primaryIndications)) {
    primaryIndications.forEach((indication: string) => {
      indications.push(SchemaUtils.buildMedicalIndication(
        SchemaUtils.cleanText(indication)
      ));
    });
  }

  // From clinical_metadata.conditions_treated
  const conditions = entity.data?.conditions_treated ||
                    entity.clinical_metadata?.conditions_treated;

  if (Array.isArray(conditions)) {
    conditions.forEach((condition: string) => {
      indications.push(SchemaUtils.buildMedicalIndication(
        SchemaUtils.cleanText(condition)
      ));
    });
  }

  // From sections.indications
  const sections = entity.data?.sections;
  if (Array.isArray(sections)) {
    const indicationsSection = sections.find((s: any) => s.type === 'indications');

    if (indicationsSection?.items) {
      indicationsSection.items.forEach((item: any) => {
        if (typeof item === 'string') {
          indications.push(SchemaUtils.buildMedicalIndication(
            SchemaUtils.cleanText(item)
          ));
        }
      });
    }
  }

  return indications.length > 0 ? indications : null;
}

function extractContraindications(entity: Entity): string[] | null {
  const contraindications = entity.data?.contraindications ||
                           entity.clinical_metadata?.contraindications;

  if (Array.isArray(contraindications) && contraindications.length > 0) {
    return SchemaUtils.cleanTextArray(contraindications);
  }

  return null;
}

function extractWarnings(entity: Entity): string[] | null {
  const warnings: string[] = [];

  // From sections.warnings or sections.precautions
  const sections = entity.data?.sections;
  if (Array.isArray(sections)) {
    const warningsSection = sections.find((s: any) =>
      s.type === 'warnings' || s.type === 'precautions'
    );

    if (warningsSection?.items) {
      warningsSection.items.forEach((item: any) => {
        if (typeof item === 'string') {
          warnings.push(SchemaUtils.cleanText(item));
        }
      });
    }
  }

  // From clinical_metadata.warnings
  const clinicalWarnings = entity.clinical_metadata?.warnings;
  if (Array.isArray(clinicalWarnings)) {
    warnings.push(...SchemaUtils.cleanTextArray(clinicalWarnings));
  }

  return warnings.length > 0 ? warnings : null;
}

function extractAdverseEffects(entity: Entity): Record<string, any>[] | null {
  const effects: Record<string, any>[] = [];

  // From sections.side_effects
  const sections = entity.data?.sections;
  if (Array.isArray(sections)) {
    const sideEffectsSection = sections.find((s: any) => s.type === 'side_effects');

    if (sideEffectsSection?.subsections) {
      sideEffectsSection.subsections.forEach((subsection: any) => {
        if (subsection.items) {
          subsection.items.forEach((item: any) => {
            if (typeof item === 'string') {
              effects.push({
                '@type': 'MedicalEntity',
                name: SchemaUtils.cleanText(item)
              });
            }
          });
        }
      });
    }
  }

  return effects.length > 0 ? effects.slice(0, 20) : null; // Limit to 20
}

function extractInteractions(entity: Entity): Record<string, any>[] | null {
  const interactions: Record<string, any>[] = [];

  // From sections.interactions
  const sections = entity.data?.sections;
  if (Array.isArray(sections)) {
    const interactionsSection = sections.find((s: any) => s.type === 'interactions');

    if (interactionsSection?.items) {
      interactionsSection.items.forEach((item: any) => {
        if (typeof item === 'string') {
          const drugName = SchemaUtils.cleanText(item);
          if (drugName) {
            interactions.push({
              '@type': 'Drug',
              name: drugName
            });
          }
        }
      });
    }
  }

  return interactions.length > 0 ? interactions.slice(0, 10) : null; // Limit to 10
}
