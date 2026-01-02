/**
 * Organization Schema Builder
 * Generates schema.org Organization and MedicalOrganization schemas
 */

import { SITE_CONFIG } from '../config';

/**
 * Build Medical Review Board Organization schema
 * This schema represents the HeyPsych Medical Review Board as a whole
 */
export function buildMedicalReviewBoardSchema(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalOrganization',
    '@id': `${SITE_CONFIG.url}/about/medical-review-board#organization`,
    'name': 'HeyPsych Medical Review Board',
    'description': 'Board-certified psychiatrists and licensed mental health professionals dedicated to ensuring the accuracy and reliability of mental health information',
    'url': `${SITE_CONFIG.url}/about/medical-review-board`,
    'logo': `${SITE_CONFIG.url}/favicon-48x48.png`,
    'sameAs': [
      'https://twitter.com/heypsych',
      'https://linkedin.com/company/heypsych'
    ],
    'foundingDate': '2024',
    'areaServed': 'United States',
    'medicalSpecialty': 'Psychiatry'
  };
}

/**
 * Build default Person schema for Medical Review Board
 * Used when no individual reviewer is specified
 */
export function buildDefaultReviewBoardPersonSchema(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE_CONFIG.url}/about/medical-review-board#board`,
    'name': 'HeyPsych Medical Review Board',
    'description': 'Board-certified psychiatrists and mental health professionals',
    'affiliation': {
      '@type': 'MedicalOrganization',
      'name': 'HeyPsych Medical Review Board',
      'url': `${SITE_CONFIG.url}/about/medical-review-board`
    },
    'jobTitle': 'Medical Review Board',
    'knowsAbout': [
      'Psychiatry',
      'Mental Health',
      'Clinical Psychology',
      'Psychopharmacology',
      'Evidence-Based Medicine'
    ]
  };
}

/**
 * Build HeyPsych Organization schema
 * Represents HeyPsych as the publisher
 */
export function buildPublisherOrganizationSchema(): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_CONFIG.url}/#organization`,
    'name': SITE_CONFIG.name,
    'description': SITE_CONFIG.description,
    'url': SITE_CONFIG.url,
    'logo': `${SITE_CONFIG.url}/favicon-48x48.png`,
    'sameAs': [
      'https://twitter.com/heypsych',
      'https://linkedin.com/company/heypsych'
    ],
    'contactPoint': {
      '@type': 'ContactPoint',
      'contactType': 'Customer Support',
      'email': 'support@heypsych.com'
    }
  };
}
