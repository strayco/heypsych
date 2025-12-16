/**
 * Editorial Service - Provides editorial data resolution
 *
 * Resolves reviewer IDs (e.g., "john-lee-md") to full MedicalReviewerInfo objects.
 *
 * Loads editorial data from JSON files at build time for easy content team updates.
 */

import type { AuthorInfo, MedicalReviewerInfo } from '@/lib/types/editorial';
import reviewersData from '../../../data/editorial/reviewers/medical-review-board.json';
import authorsData from '../../../data/editorial/authors/authors.json';

/**
 * Build reviewers map from JSON data
 */
function buildReviewersMap(): Record<string, MedicalReviewerInfo> {
  const map: Record<string, MedicalReviewerInfo> = {};

  for (const reviewer of reviewersData.reviewers) {
    map[reviewer.id] = {
      name: reviewer.name,
      slug: reviewer.id,
      credentials: reviewer.credentials,
      specialty: reviewer.specialty,
      bio: reviewer.bio,
      profileUrl: reviewer.profile_url,
      clinicalExpertise: reviewer.clinical_expertise,
      yearsOfPractice: reviewer.years_of_practice,
    };
  }

  return map;
}

/**
 * Build authors map from JSON data
 */
function buildAuthorsMap(): Record<string, AuthorInfo> {
  const map: Record<string, AuthorInfo> = {};

  for (const author of authorsData.authors) {
    map[author.id] = {
      name: author.name,
      slug: author.id,
      credentials: author.credentials,
      jobTitle: author.jobTitle,
      bio: author.bio,
      profileUrl: author.profileUrl,
      expertise: author.expertise,
      education: author.education,
      affiliations: author.affiliations,
    };
  }

  return map;
}

/**
 * Static reviewer data - loaded from JSON at build time
 */
const STATIC_REVIEWERS = buildReviewersMap();

/**
 * Static author data - loaded from JSON at build time
 */
const STATIC_AUTHORS = buildAuthorsMap();

/**
 * Editorial Service
 * 
 * Provides methods to resolve editorial IDs to full objects.
 * Uses static embedded data for client-side compatibility.
 */
export class EditorialService {
  /**
   * Get a reviewer by ID/slug
   */
  static getReviewerById(id: string): MedicalReviewerInfo | null {
    return STATIC_REVIEWERS[id] || null;
  }

  /**
   * Get an author by ID/slug
   */
  static getAuthorById(id: string): AuthorInfo | null {
    return STATIC_AUTHORS[id] || null;
  }

  /**
   * Get all reviewers
   */
  static getAllReviewers(): MedicalReviewerInfo[] {
    return Object.values(STATIC_REVIEWERS);
  }

  /**
   * Get all authors
   */
  static getAllAuthors(): AuthorInfo[] {
    return Object.values(STATIC_AUTHORS);
  }

  /**
   * Get the Medical Review Board organization info
   */
  static getReviewBoardOrganization(): {
    name: string;
    description: string;
    url: string;
  } {
    return {
      name: 'HeyPsych Medical Review Board',
      description: 'Board-certified psychiatrists and mental health professionals',
      url: 'https://heypsych.com/about/medical-review-board',
    };
  }

  /**
   * Resolve reviewer IDs to full objects
   * Returns the first found reviewer, or null if none found
   */
  static resolveReviewerIds(ids: string[]): MedicalReviewerInfo | null {
    if (!ids || ids.length === 0) return null;
    
    for (const id of ids) {
      const reviewer = this.getReviewerById(id);
      if (reviewer) return reviewer;
    }
    
    return null;
  }

  /**
   * Get first reviewer from array of IDs
   * Alias for resolveReviewerIds for cleaner API
   */
  static getFirstReviewer(ids: string[]): MedicalReviewerInfo | null {
    return this.resolveReviewerIds(ids);
  }

  /**
   * Resolve author ID to full object
   */
  static resolveAuthorId(id: string | undefined): AuthorInfo | null {
    if (!id) return null;
    return this.getAuthorById(id);
  }

  /**
   * Get default Medical Review Board info for fallback
   */
  static getDefaultReviewBoard(): MedicalReviewerInfo {
    return {
      name: 'HeyPsych Medical Review Board',
      slug: 'medical-review-board',
      credentials: 'Board-Certified Psychiatrists',
      specialty: 'Psychiatry',
      bio: 'Board-certified psychiatrists and licensed mental health professionals dedicated to ensuring the accuracy and reliability of mental health information',
      profileUrl: '/about/medical-review-board',
      clinicalExpertise: [
        'Psychiatry',
        'Mental Health',
        'Clinical Psychology',
        'Psychopharmacology',
        'Evidence-Based Medicine',
      ],
    };
  }

  /**
   * Clear caches - no-op for static implementation
   */
  static clearCaches(): void {
    // No-op: static data doesn't need cache clearing
  }
}

export default EditorialService;

