/**
 * PsychTrails Metadata Generator
 *
 * Generates SEO metadata for PsychTrails scenario pages.
 * Ensures E-E-A-T parity with medication/treatment pages.
 *
 * Title Formula: "{Scenario Title}: Interactive Mental Health Simulation | HeyPsych"
 * Description Formula: "{Summary}. Educational simulation reviewed by {reviewer}."
 */

import type { Metadata } from 'next';
import type { ScenarioV2 as Scenario } from '@/lib/psychTrail/types-v2';
import { SITE_CONFIG, METADATA_LIMITS } from './config';
import { renderedTitleLength } from './title';

/**
 * Generate complete SEO metadata for a PsychTrails scenario
 */
export function generatePsychTrailScenarioMetadata(scenario: Scenario): Metadata {
  const title = generateTitle(scenario);
  const description = generateDescription(scenario);
  const canonical = generateCanonical(scenario);
  const keywords = extractKeywords(scenario);

  return {
    title,
    description,
    keywords: keywords.join(', '),
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      images: [
        {
          url: `${SITE_CONFIG.url}${SITE_CONFIG.defaultOGImage}`,
          width: 1200,
          height: 630,
          alt: `${title} - ${SITE_CONFIG.name}`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE_CONFIG.twitter,
      title,
      description
    }
  };
}

/**
 * Generate title for scenario page
 */
function generateTitle(scenario: Scenario): string {
  // Format: "First Psychiatry Appointment: Interactive Mental Health Simulation"
  // The root layout's title template appends " | HeyPsych", so length is
  // measured against the final rendered form.
  const baseTitle = `${scenario.title}: Interactive Mental Health Simulation`;

  // If too long, try shorter version
  if (renderedTitleLength(baseTitle) > 60) {
    const shortTitle = `${scenario.title}: Mental Health Simulation`;
    if (renderedTitleLength(shortTitle) > 60) {
      // Even shorter if needed
      return ensureTitleLength(scenario.title);
    }
    return shortTitle;
  }

  return baseTitle;
}

/**
 * Generate description for scenario page
 */
function generateDescription(scenario: Scenario): string {
  let description = scenario.summary;

  // Add educational disclaimer
  description += ' Educational simulation only. Fictional scenarios. Not medical advice.';

  // Add clinical review signal if available via llmHints
  if (scenario.llmHints?.scenarioContext) {
    description += ' Clinically designed scenario.';
  }

  return ensureDescriptionLength(description);
}

/**
 * Extract SEO keywords from scenario
 */
function extractKeywords(scenario: Scenario): string[] {
  const keywords = new Set<string>();

  // Add scenario title
  keywords.add(scenario.title.toLowerCase());

  // Add tags
  scenario.tags.forEach(tag => keywords.add(tag));

  // Add category-specific keywords
  keywords.add(`${scenario.category} simulation`);
  keywords.add('mental health education');
  keywords.add('interactive mental health simulation');
  keywords.add('psychtrails');

  // Add difficulty-based keywords
  if (scenario.difficulty) {
    keywords.add(`${scenario.difficulty} mental health education`);
  }

  // Limit to max keywords
  return Array.from(keywords)
    .slice(0, METADATA_LIMITS.keywords.max)
    .filter(kw => kw.length >= 3);
}

/**
 * Generate canonical URL for scenario
 * Note: Individual scenarios are no longer directly accessible.
 * They are only accessible through the tile-based map system.
 */
function generateCanonical(scenario: Scenario): string {
  return `${SITE_CONFIG.url}/psychtrails`;
}

/**
 * Ensure description meets length requirements
 */
function ensureDescriptionLength(description: string): string {
  const { min, max, ideal } = METADATA_LIMITS.description;

  if (description.length < min) {
    return description;
  }

  if (description.length <= ideal) {
    return description;
  }

  if (description.length > max) {
    return truncate(description, ideal);
  }

  return description;
}

/**
 * Ensure title meets length requirements
 */
function ensureTitleLength(title: string): string {
  const { max, ideal } = METADATA_LIMITS.title;

  if (title.length <= ideal) {
    return title;
  }

  if (title.length > max) {
    return truncate(title, ideal);
  }

  return title;
}

/**
 * Truncate text to specified length with ellipsis
 */
function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Generate hub page metadata
 */
export function generatePsychTrailHubMetadata(): Metadata {
  const title = 'PsychTrails™: Interactive Mental Health Simulations | HeyPsych';
  const description = 'Explore mental health care through interactive educational simulations. Learn about appointments, treatments, and mental health journeys in a safe, fictional environment. Clinically reviewed by the HeyPsych Medical Review Board.';
  const canonical = `${SITE_CONFIG.url}/psychtrails`;

  const keywords = [
    'mental health simulations',
    'interactive mental health education',
    'psychtrails',
    'psychiatry appointment simulation',
    'mental health care education',
    'treatment decision simulation',
    'mental health learning platform',
    'psychiatric care walkthrough'
  ];

  return {
    title,
    description,
    keywords: keywords.join(', '),
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'website',
      siteName: SITE_CONFIG.name,
      locale: SITE_CONFIG.locale,
      images: [
        {
          url: `${SITE_CONFIG.url}${SITE_CONFIG.defaultOGImage}`,
          width: 1200,
          height: 630,
          alt: `${title} - ${SITE_CONFIG.name}`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      site: SITE_CONFIG.twitter,
      title,
      description
    }
  };
}
