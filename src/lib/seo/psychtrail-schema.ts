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
 * 5. Person - Author and/or Medical Reviewer
 */

import type { Scenario } from '@/lib/psychTrail/types';
import { SITE_CONFIG } from './config';
import { buildMedicalReviewBoardSchema } from './schema-builders/organization';

/**
 * Generate all schemas for a PsychTrails scenario page
 * Note: Individual scenarios are no longer directly accessible.
 * They are only accessible through the tile-based map system.
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

  // 5. Person schemas (author and/or medical reviewer)
  const personSchemas = buildPersonSchemasForScenario(scenario);
  schemas.push(...personSchemas);

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
      itemListElement: [] // Will be populated dynamically with scenarios
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

  // Add educational level if available
  if (scenario.educationalLevel || scenario.difficulty) {
    const level = scenario.educationalLevel || scenario.difficulty;
    schema.educationalLevel = level === 'beginner' ? 'Beginner' :
                               level === 'intermediate' ? 'Intermediate' :
                               'Advanced';
  }

  // Add learning objectives if available
  if (scenario.learningObjectives && scenario.learningObjectives.length > 0) {
    schema.teaches = scenario.learningObjectives;
  }

  // Add time required
  if (scenario.estimatedMinutes) {
    schema.timeRequired = `PT${scenario.estimatedMinutes}M`;
  }

  // Add keywords
  if (scenario.keywords && scenario.keywords.length > 0) {
    schema.keywords = scenario.keywords.join(', ');
  } else if (scenario.tags.length > 0) {
    schema.keywords = scenario.tags.join(', ');
  }

  // Add review information
  if (scenario.medicalReviewer && scenario.clinicalReviewDate) {
    schema.reviewedBy = {
      '@type': 'Organization',
      name: scenario.medicalReviewer
    };
    schema.dateModified = scenario.clinicalReviewDate;
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
    lastReviewed: scenario.clinicalReviewDate || scenario.updatedAt,
    reviewedBy: scenario.medicalReviewer ? {
      '@type': 'Organization',
      name: scenario.medicalReviewer
    } : {
      '@type': 'Organization',
      name: 'HeyPsych Medical Review Board'
    }
  };

  // Add author if available
  if (scenario.author) {
    schema.author = {
      '@type': 'Organization',
      name: scenario.author
    };
  }

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

/**
 * Build Person schemas for author and medical reviewer
 */
function buildPersonSchemasForScenario(scenario: Scenario): Record<string, any>[] {
  const schemas: Record<string, any>[] = [];

  // Author schema (if individual author, not team)
  if (scenario.author && !scenario.author.toLowerCase().includes('team')) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: scenario.author,
      ...(scenario.authorRole && { jobTitle: scenario.authorRole }),
      affiliation: {
        '@type': 'MedicalOrganization',
        name: SITE_CONFIG.name
      }
    });
  }

  // Medical Reviewer schema (if individual, not board)
  if (scenario.medicalReviewer &&
      !scenario.medicalReviewer.toLowerCase().includes('board') &&
      !scenario.medicalReviewer.toLowerCase().includes('team')) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: scenario.medicalReviewer,
      ...(scenario.medicalReviewerCredentials && {
        honorificSuffix: scenario.medicalReviewerCredentials
      }),
      affiliation: {
        '@type': 'MedicalOrganization',
        name: SITE_CONFIG.name
      },
      medicalSpecialty: 'Psychiatry'
    });
  }

  // If no individual schemas created, add default board member schema
  if (schemas.length === 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'HeyPsych Medical Review Board',
      affiliation: {
        '@type': 'MedicalOrganization',
        name: SITE_CONFIG.name,
        medicalSpecialty: 'Psychiatry'
      }
    });
  }

  return schemas;
}
