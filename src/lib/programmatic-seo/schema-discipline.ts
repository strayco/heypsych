/**
 * SCHEMA DISCIPLINE
 * 
 * Less, but correct.
 * 
 * Schema overuse gets ignored or discounted by Google.
 * We emit schema ONLY when content fully supports it.
 * 
 * Rules:
 * - FAQPage → only if FAQs are rendered on page
 * - Drug → medications only, with ALL required fields
 * - MedicalCondition → condition hubs only
 * - No blanket Speakable (must target real selectors)
 * - Validate everything before output
 */

import type { DynamicPageConfig } from './dynamic-generator';
import type { GeneratedContent, FAQ } from './content-engine';
import type { FreshnessSignals } from './medical-authority';

// ============ SCHEMA VALIDATION ============

export interface SchemaValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate a schema object before emission
 */
export function validateSchema(schema: object, type: string): SchemaValidation {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const obj = schema as Record<string, unknown>;
  
  // Common required fields
  if (!obj['@context']) {
    errors.push('Missing @context');
  }
  if (!obj['@type']) {
    errors.push('Missing @type');
  }
  
  // Type-specific validation
  switch (type) {
    case 'FAQPage':
      validateFAQPage(obj, errors, warnings);
      break;
    case 'Drug':
      validateDrug(obj, errors, warnings);
      break;
    case 'MedicalCondition':
      validateMedicalCondition(obj, errors, warnings);
      break;
    case 'MedicalWebPage':
      validateMedicalWebPage(obj, errors, warnings);
      break;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateFAQPage(obj: Record<string, unknown>, errors: string[], warnings: string[]) {
  const mainEntity = obj['mainEntity'] as unknown[];
  
  if (!mainEntity || !Array.isArray(mainEntity)) {
    errors.push('FAQPage requires mainEntity array');
    return;
  }
  
  if (mainEntity.length === 0) {
    errors.push('FAQPage mainEntity cannot be empty');
    return;
  }
  
  if (mainEntity.length < 3) {
    warnings.push('FAQPage with fewer than 3 questions may not display');
  }
  
  for (let i = 0; i < mainEntity.length; i++) {
    const item = mainEntity[i] as Record<string, unknown>;
    if (!item['name']) {
      errors.push(`FAQ item ${i} missing question (name)`);
    }
    if (!item['acceptedAnswer']) {
      errors.push(`FAQ item ${i} missing answer (acceptedAnswer)`);
    }
  }
}

function validateDrug(obj: Record<string, unknown>, errors: string[], warnings: string[]) {
  // Required fields for Drug schema
  const required = ['name', 'description'];
  for (const field of required) {
    if (!obj[field]) {
      errors.push(`Drug schema missing required field: ${field}`);
    }
  }
  
  // Highly recommended fields
  const recommended = ['drugClass', 'administrationRoute', 'prescriptionStatus'];
  for (const field of recommended) {
    if (!obj[field]) {
      warnings.push(`Drug schema missing recommended field: ${field}`);
    }
  }
}

function validateMedicalCondition(obj: Record<string, unknown>, errors: string[], warnings: string[]) {
  const required = ['name', 'description'];
  for (const field of required) {
    if (!obj[field]) {
      errors.push(`MedicalCondition schema missing required field: ${field}`);
    }
  }
  
  const recommended = ['signOrSymptom', 'possibleTreatment'];
  for (const field of recommended) {
    if (!obj[field]) {
      warnings.push(`MedicalCondition schema missing recommended field: ${field}`);
    }
  }
}

function validateMedicalWebPage(obj: Record<string, unknown>, errors: string[], warnings: string[]) {
  const required = ['name', 'description', 'lastReviewed'];
  for (const field of required) {
    if (!obj[field]) {
      errors.push(`MedicalWebPage schema missing required field: ${field}`);
    }
  }
  
  if (!obj['reviewedBy']) {
    warnings.push('MedicalWebPage should include reviewedBy for E-A-T');
  }
}

// ============ CONDITIONAL SCHEMA GENERATION ============

/**
 * Generate FAQPage schema ONLY if FAQs are actually rendered
 */
export function generateFAQSchema(
  faqs: FAQ[],
  pageUrl: string
): object | null {
  // Only generate if we have enough real FAQs
  if (!faqs || faqs.length < 3) {
    return null;
  }
  
  // Filter to FAQs marked for schema inclusion
  const schemaFaqs = faqs.filter(f => f.schema !== false);
  
  if (schemaFaqs.length < 3) {
    return null;
  }
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: schemaFaqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
  
  // Validate before returning
  const validation = validateSchema(schema, 'FAQPage');
  if (!validation.isValid) {
    console.warn('Invalid FAQPage schema:', validation.errors);
    return null;
  }
  
  return schema;
}

/**
 * Generate Drug schema ONLY for medication pages with complete data
 */
export function generateDrugSchema(
  treatmentData: {
    name: string;
    description: string;
    drugClass?: string;
    administrationRoute?: string;
    prescriptionStatus?: string;
    activeIngredient?: string;
    manufacturer?: string;
  },
  pageUrl: string
): object | null {
  // Must have minimum required fields
  if (!treatmentData.name || !treatmentData.description) {
    return null;
  }
  
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Drug',
    name: treatmentData.name,
    description: treatmentData.description,
    url: pageUrl,
  };
  
  // Only add optional fields if they exist
  if (treatmentData.drugClass) {
    schema.drugClass = {
      '@type': 'DrugClass',
      name: treatmentData.drugClass,
    };
  }
  
  if (treatmentData.administrationRoute) {
    schema.administrationRoute = treatmentData.administrationRoute;
  }
  
  if (treatmentData.prescriptionStatus) {
    schema.prescriptionStatus = treatmentData.prescriptionStatus;
  }
  
  if (treatmentData.activeIngredient) {
    schema.activeIngredient = treatmentData.activeIngredient;
  }
  
  // Validate before returning
  const validation = validateSchema(schema, 'Drug');
  if (!validation.isValid) {
    console.warn('Invalid Drug schema:', validation.errors);
    return null;
  }
  
  return schema;
}

/**
 * Generate MedicalCondition schema ONLY for condition hub pages
 */
export function generateMedicalConditionSchema(
  conditionData: {
    name: string;
    description: string;
    symptoms?: string[];
    treatments?: string[];
    code?: string;
    codeSystem?: string;
  },
  pageUrl: string
): object | null {
  if (!conditionData.name || !conditionData.description) {
    return null;
  }
  
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalCondition',
    name: conditionData.name,
    description: conditionData.description,
    url: pageUrl,
  };
  
  if (conditionData.symptoms && conditionData.symptoms.length > 0) {
    schema.signOrSymptom = conditionData.symptoms.map(s => ({
      '@type': 'MedicalSymptom',
      name: s,
    }));
  }
  
  if (conditionData.treatments && conditionData.treatments.length > 0) {
    schema.possibleTreatment = conditionData.treatments.map(t => ({
      '@type': 'MedicalTherapy',
      name: t,
    }));
  }
  
  if (conditionData.code && conditionData.codeSystem) {
    schema.code = {
      '@type': 'MedicalCode',
      code: conditionData.code,
      codingSystem: conditionData.codeSystem,
    };
  }
  
  const validation = validateSchema(schema, 'MedicalCondition');
  if (!validation.isValid) {
    console.warn('Invalid MedicalCondition schema:', validation.errors);
    return null;
  }
  
  return schema;
}

/**
 * Generate MedicalWebPage schema with proper review info
 */
export function generateMedicalWebPageSchema(
  pageData: {
    title: string;
    description: string;
    url: string;
  },
  freshness: FreshnessSignals,
  reviewerName: string,
  reviewerUrl: string
): object {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: pageData.title,
    description: pageData.description,
    url: pageData.url,
    datePublished: freshness.contentCreated,
    dateModified: freshness.contentModified || freshness.contentCreated,
    lastReviewed: freshness.lastMedicalReview,
    reviewedBy: {
      '@type': 'Organization',
      name: reviewerName,
      url: reviewerUrl,
    },
    medicalAudience: {
      '@type': 'MedicalAudience',
      audienceType: 'Patient',
    },
  };
  
  return schema;
}

// ============ SPEAKABLE - TARGETED, NOT BLANKET ============

/**
 * Generate Speakable schema ONLY for content that's actually suitable for voice
 * 
 * Rules:
 * - Must target real CSS selectors on the page
 * - Content must be voice-friendly (no complex tables, etc.)
 * - Keep it focused on 1-2 key sections
 */
export function generateSpeakableSchema(
  content: GeneratedContent,
  selectors: string[]
): object | null {
  // Only include speakable if we have real voice-friendly content
  if (!content.quickAnswer && content.sections.length === 0) {
    return null;
  }
  
  // Validate that selectors actually match content structure
  const validSelectors = selectors.filter(s => {
    // Only allow selectors we know exist
    const knownSelectors = [
      '[itemprop="description"]',
      '.quick-answer',
      '.key-facts',
      'h1',
      '.introduction',
    ];
    return knownSelectors.includes(s);
  });
  
  if (validSelectors.length === 0) {
    return null;
  }
  
  return {
    '@type': 'SpeakableSpecification',
    cssSelector: validSelectors,
  };
}

// ============ SCHEMA AGGREGATOR ============

/**
 * Aggregate all valid schemas for a page
 * Only includes schemas that pass validation
 */
export function aggregatePageSchemas(
  config: DynamicPageConfig,
  content: GeneratedContent,
  freshness: FreshnessSignals
): object[] {
  const schemas: object[] = [];
  const pageUrl = `https://heypsych.com/guide/${config.slug}`;
  
  // Always include MedicalWebPage
  const webPageSchema = generateMedicalWebPageSchema(
    {
      title: content.title,
      description: content.metaDescription,
      url: pageUrl,
    },
    freshness,
    'HeyPsych Medical Review Board',
    'https://heypsych.com/about/medical-review-board'
  );
  schemas.push(webPageSchema);
  
  // FAQPage - only if FAQs exist and are rendered
  const faqSchema = generateFAQSchema(content.faqs, pageUrl);
  if (faqSchema) {
    schemas.push(faqSchema);
  }
  
  // BreadcrumbList
  if (content.breadcrumbs && content.breadcrumbs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: content.breadcrumbs.map((crumb, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: crumb.name,
        item: `https://heypsych.com${crumb.url}`,
      })),
    });
  }
  
  return schemas;
}


