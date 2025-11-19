/**
 * FAQPage Schema Builder
 *
 * Generates schema.org FAQPage structured data.
 * Auto-generates FAQs for conditions or uses explicit FAQ data.
 */

import type { Entity } from '@/lib/types/database';
import { SchemaBuilder, SchemaUtils } from '../schema-builder';

interface FAQ {
  question: string;
  answer: string;
}

export function buildFAQPageSchema(entity: Entity): Record<string, any> | null {
  // Get FAQs (explicit or auto-generated)
  const faqs = extractFAQs(entity);

  if (!faqs || faqs.length === 0) {
    return null; // No FAQs available
  }

  const builder = new SchemaBuilder()
    .setContext('https://schema.org')
    .setType('FAQPage');

  const mainEntity = faqs.map(faq => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.answer
    }
  }));

  builder.addProperty('mainEntity', mainEntity);

  return builder.build();
}

function extractFAQs(entity: Entity): FAQ[] | null {
  // Priority 1: Explicit FAQs in entity data
  const explicitFAQs = entity.data?.faqs || entity.data?.faq;

  if (Array.isArray(explicitFAQs) && explicitFAQs.length > 0) {
    return explicitFAQs.map((faq: any) => ({
      question: faq.question || faq.q,
      answer: SchemaUtils.cleanText(faq.answer || faq.a)
    }));
  }

  // Priority 2: Auto-generate FAQs for conditions
  const entityType = entity.type || entity.schema?.entity_type;

  if (entityType === 'condition') {
    return generateConditionFAQs(entity);
  }

  // Priority 3: Auto-generate FAQs for medications
  if (entityType === 'medication') {
    return generateMedicationFAQs(entity);
  }

  return null;
}

function generateConditionFAQs(entity: Entity): FAQ[] {
  const faqs: FAQ[] = [];
  const name = entity.name;

  // FAQ 1: What is {condition}?
  const description = entity.description || entity.data?.description;
  if (description) {
    faqs.push({
      question: `What is ${name}?`,
      answer: SchemaUtils.cleanText(description)
    });
  }

  // FAQ 2: What causes {condition}?
  const riskFactors = entity.data?.risk_factors;
  if (Array.isArray(riskFactors) && riskFactors.length > 0) {
    const factorsText = riskFactors
      .slice(0, 5)
      .map((f: string) => SchemaUtils.cleanText(f))
      .join(', ');

    faqs.push({
      question: `What causes ${name}?`,
      answer: `${name} can be caused by multiple factors including: ${factorsText}.`
    });
  }

  // FAQ 3: What are the symptoms?
  const symptoms = entity.data?.symptoms?.core;
  if (Array.isArray(symptoms) && symptoms.length > 0) {
    const symptomsText = symptoms
      .slice(0, 5)
      .map((s: string) => SchemaUtils.cleanText(s))
      .join(', ');

    faqs.push({
      question: `What are the symptoms of ${name}?`,
      answer: `Common symptoms of ${name} include: ${symptomsText}.`
    });
  }

  // FAQ 4: How is it diagnosed?
  const evaluation = entity.data?.evaluation?.diagnostic_criteria ||
                    entity.data?.diagnostic_criteria;
  if (evaluation) {
    faqs.push({
      question: `How is ${name} diagnosed?`,
      answer: SchemaUtils.cleanText(evaluation)
    });
  }

  // FAQ 5: What treatments are available?
  const treatments = entity.data?.treatment_approaches;
  if (treatments) {
    let treatmentText = `Treatment for ${name} typically includes `;
    const options: string[] = [];

    if (treatments.medications?.length > 0) {
      options.push('medications');
    }
    if (treatments.psychotherapy?.length > 0) {
      options.push('psychotherapy');
    }
    if (treatments.lifestyle?.length > 0) {
      options.push('lifestyle changes');
    }

    treatmentText += options.join(', ') + '.';

    faqs.push({
      question: `What treatments are available for ${name}?`,
      answer: treatmentText
    });
  }

  // FAQ 6: Can it be cured?
  const prognosis = entity.data?.prognosis;
  if (prognosis) {
    faqs.push({
      question: `Can ${name} be cured?`,
      answer: SchemaUtils.cleanText(prognosis)
    });
  }

  return faqs.slice(0, 10); // Max 10 FAQs
}

function generateMedicationFAQs(entity: Entity): FAQ[] {
  const faqs: FAQ[] = [];
  const name = entity.name;

  // FAQ 1: What is {medication} used for?
  const indications = entity.data?.primary_indications ||
                     entity.clinical_metadata?.primary_indications;

  if (Array.isArray(indications) && indications.length > 0) {
    const indicationsText = indications
      .slice(0, 3)
      .map((i: string) => SchemaUtils.cleanText(i))
      .join(', ');

    faqs.push({
      question: `What is ${name} used for?`,
      answer: `${name} is primarily used to treat ${indicationsText}.`
    });
  }

  // FAQ 2: How does it work?
  const mechanism = entity.data?.mechanism_of_action;
  if (mechanism) {
    faqs.push({
      question: `How does ${name} work?`,
      answer: SchemaUtils.cleanText(mechanism)
    });
  }

  // FAQ 3: What are common side effects?
  const sections = entity.data?.sections;
  if (Array.isArray(sections)) {
    const sideEffectsSection = sections.find((s: any) => s.type === 'side_effects');

    if (sideEffectsSection?.subsections) {
      const commonEffects = sideEffectsSection.subsections.find((s: any) =>
        s.title?.toLowerCase().includes('common')
      );

      if (commonEffects?.items) {
        const effectsText = commonEffects.items
          .slice(0, 5)
          .map((e: string) => SchemaUtils.cleanText(e))
          .join(', ');

        faqs.push({
          question: `What are the common side effects of ${name}?`,
          answer: `Common side effects of ${name} may include: ${effectsText}.`
        });
      }
    }
  }

  // FAQ 4: What is the typical dosage?
  const sections2 = entity.data?.sections;
  if (Array.isArray(sections2)) {
    const dosageSection = sections2.find((s: any) => s.type === 'dosage');

    if (dosageSection?.items && dosageSection.items.length > 0) {
      faqs.push({
        question: `What is the typical dosage of ${name}?`,
        answer: `Dosage varies by condition and individual factors. Consult your healthcare provider for personalized dosing.`
      });
    }
  }

  return faqs.slice(0, 6); // Max 6 FAQs for medications
}
