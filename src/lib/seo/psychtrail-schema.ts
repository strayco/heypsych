/**
 * PsychTrails Schema.org Factory
 *
 * Generates complete stack of schema.org structured data for PsychTrails pages.
 * Ensures E-E-A-T parity with medication/treatment pages.
 *
 * Schema Stack:
 * 1. LearningResource (primary) - Interactive educational content
 * 2. MedicalWebPage - Medical content page
 * 3. BreadcrumbList - Navigation structure
 * 4. Organization - HeyPsych Medical Review Board
 */

import type { ScenarioV2 as Scenario } from '@/lib/psychTrail/types-v2';
import { SITE_CONFIG } from './config';
import { buildMedicalReviewBoardSchema } from './schema-builders/organization';

/**
 * Generate all schemas for a PsychTrails scenario page
 */
export function generatePsychTrailScenarioSchemas(scenario: Scenario): Record<string, any>[] {
  const schemas: Record<string, any>[] = [];
  const pageUrl = `${SITE_CONFIG.url}/psychtrails`;

  // 1. LearningResource schema (primary)
  schemas.push(buildLearningResourceSchema(scenario, pageUrl));

  // 2. MedicalWebPage schema
  schemas.push(buildMedicalWebPageSchemaForScenario(scenario, pageUrl));

  // 3. BreadcrumbList schema
  schemas.push(buildBreadcrumbSchemaForScenario(scenario));

  // 4. Organization schema (Medical Review Board)
  schemas.push(buildMedicalReviewBoardSchema());

  return schemas;
}

/**
 * Generate all schemas for PsychTrails hub page
 */
export function generatePsychTrailHubSchemas(): Record<string, any>[] {
  const schemas: Record<string, any>[] = [];
  const pageUrl = `${SITE_CONFIG.url}/psychtrails`;

  // 1. CollectionPage schema
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'PsychTrails™: Interactive Mental Health Simulations',
    description: 'Explore mental health care through interactive educational simulations. Learn about appointments, treatments, and mental health journeys in a safe, fictional environment.',
    url: pageUrl,
    mainEntity: {
      '@type': 'ItemList',
      name: 'Mental Health Simulations',
      description: 'Interactive educational simulations for mental health education',
      itemListElement: []
    },
    publisher: {
      '@type': 'MedicalOrganization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url
    }
  });

  // 2. BreadcrumbList schema
  schemas.push({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_CONFIG.url
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'PsychTrails™',
        item: pageUrl
      }
    ]
  });

  // 3. Organization schema
  schemas.push(buildMedicalReviewBoardSchema());

  return schemas;
}

/**
 * Build LearningResource schema for a scenario
 */
function buildLearningResourceSchema(scenario: Scenario, pageUrl: string): Record<string, any> {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: scenario.title,
    description: scenario.summary,
    url: pageUrl,
    learningResourceType: 'interactive simulation',
    educationalUse: 'mental health education',
    audience: {
      '@type': 'EducationalAudience',
      educationalRole: 'general public',
      audienceType: 'mental health learners'
    },
    isAccessibleForFree: true,
    inLanguage: 'en-US',
    provider: {
      '@type': 'MedicalOrganization',
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      medicalSpecialty: 'Psychiatry'
    }
  };

  // Add educational level
  if (scenario.difficulty) {
    const level = scenario.difficulty;
    schema.educationalLevel = level === 'beginner' ? 'Beginner' :
                               level === 'intermediate' ? 'Intermediate' :
                               'Advanced';
  }

  // Add time required
  if (scenario.estimatedMinutes) {
    schema.timeRequired = `PT${scenario.estimatedMinutes}M`;
  }

  // Add keywords from tags
  if (scenario.tags.length > 0) {
    schema.keywords = scenario.tags.join(', ');
  }

  // Add publication date
  schema.datePublished = scenario.updatedAt;

  return schema;
}

/**
 * Build MedicalWebPage schema for a scenario
 */
function buildMedicalWebPageSchemaForScenario(scenario: Scenario, pageUrl: string): Record<string, any> {
  const schema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: scenario.title,
    description: scenario.summary,
    url: pageUrl,
    mainContentOfPage: {
      '@type': 'WebPageElement',
      cssSelector: '.game-container'
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.scenario-title', '.scenario-summary']
    },
    lastReviewed: scenario.updatedAt,
    reviewedBy: {
      '@type': 'Organization',
      name: 'HeyPsych Medical Review Board'
    }
  };

  // Add publication dates
  schema.datePublished = scenario.updatedAt;
  schema.dateModified = scenario.updatedAt;

  return schema;
}

/**
 * Build BreadcrumbList schema for a scenario
 */
function buildBreadcrumbSchemaForScenario(scenario: Scenario): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_CONFIG.url
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'PsychTrails™',
        item: `${SITE_CONFIG.url}/psychtrails`
      }
    ]
  };
}
