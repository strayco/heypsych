/**
 * Person Schema Builders
 *
 * Generates schema.org Person structured data for authors and medical reviewers.
 * Critical for E-A-T (Expertise, Authoritativeness, Trustworthiness) compliance.
 */

import type { AuthorInfo, MedicalReviewerInfo } from '@/lib/types/editorial';
import { SchemaBuilder } from '../schema-builder';
import { SITE_CONFIG } from '../config';
import { getORCIDUrl } from '../knowledge-graph-mapper';

/**
 * Build Person schema for content author
 */
export function buildAuthorSchema(author: AuthorInfo): Record<string, any> {
  const builder = new SchemaBuilder()
    .setContext('https://schema.org')
    .setType('Person')
    .setId(`${SITE_CONFIG.url}${author.profileUrl}#person`)
    .addProperty('name', author.name);

  // Job title
  builder.addPropertyIfExists('jobTitle', author.jobTitle);

  // Credentials
  if (author.credentials) {
    builder.addProperty('honorificSuffix', author.credentials);
  }

  // Bio/description
  builder.addPropertyIfExists('description', author.bio);

  // Profile URL
  builder.addProperty('url', `${SITE_CONFIG.url}${author.profileUrl}`);

  // Expertise areas
  builder.addPropertyIfExists('knowsAbout', author.expertise);

  // Education
  if (author.education && author.education.length > 0) {
    builder.addProperty('alumniOf', author.education.map(edu => ({
      '@type': 'EducationalOrganization',
      name: edu
    })));
  }

  // Affiliations
  if (author.affiliations && author.affiliations.length > 0) {
    builder.addProperty('affiliation', author.affiliations.map(aff => ({
      '@type': 'Organization',
      name: aff
    })));
  }

  // Email
  builder.addPropertyIfExists('email', author.email);

  // Verified Identity Links: ORCID, LinkedIn, Twitter
  // Critical for E-E-A-T verification in Google Search
  const sameAs: string[] = [];

  // ORCID (highest priority - gold standard for researcher identification)
  if (author.orcid) {
    sameAs.push(getORCIDUrl(author.orcid));
  }

  // LinkedIn (professional verification)
  if (author.social?.linkedin) {
    sameAs.push(author.social.linkedin);
  }

  // Twitter (social proof)
  if (author.social?.twitter) {
    sameAs.push(author.social.twitter);
  }

  if (sameAs.length > 0) {
    builder.addProperty('sameAs', sameAs);
  }

  return builder.build();
}

/**
 * Build Person schema for medical reviewer
 */
export function buildMedicalReviewerSchema(reviewer: MedicalReviewerInfo): Record<string, any> {
  const builder = new SchemaBuilder()
    .setContext('https://schema.org')
    .setType('Person')
    .setId(`${SITE_CONFIG.url}${reviewer.profileUrl}#person`)
    .addProperty('name', reviewer.name);

  // Job title/specialty
  builder.addPropertyIfExists('jobTitle', reviewer.specialty);

  // Credentials
  if (reviewer.credentials) {
    builder.addProperty('honorificSuffix', reviewer.credentials);
  }

  // Bio/description
  builder.addPropertyIfExists('description', reviewer.bio);

  // Profile URL
  builder.addProperty('url', `${SITE_CONFIG.url}${reviewer.profileUrl}`);

  // Clinical expertise
  builder.addPropertyIfExists('knowsAbout', reviewer.clinicalExpertise);

  // Professional affiliation
  if (reviewer.affiliation) {
    builder.addProperty('memberOf', {
      '@type': 'MedicalOrganization',
      name: reviewer.affiliation
    });
  }

  // Board certifications (as credentials)
  if (reviewer.boardCertifications && reviewer.boardCertifications.length > 0) {
    builder.addProperty('hasCredential', reviewer.boardCertifications.map(cert => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'Board Certification',
      name: cert
    })));
  }

  // Years of practice
  if (reviewer.yearsOfPractice) {
    builder.addProperty('award', `${reviewer.yearsOfPractice}+ years of clinical practice`);
  }

  // Verified Identity Links: ORCID, LinkedIn, NPI
  // Critical for E-E-A-T verification - allows Google to verify medical credentials
  const sameAs: string[] = [];

  // ORCID (highest priority for academic/research credentials)
  if (reviewer.orcid) {
    sameAs.push(getORCIDUrl(reviewer.orcid));
  }

  // NPI (National Provider Identifier - verifies medical license)
  if (reviewer.npi) {
    sameAs.push(`https://npiregistry.cms.hhs.gov/provider-view/${reviewer.npi}`);
  }

  // LinkedIn (professional verification)
  if (reviewer.social?.linkedin) {
    sameAs.push(reviewer.social.linkedin);
  }

  if (sameAs.length > 0) {
    builder.addProperty('sameAs', sameAs);
  }

  return builder.build();
}
