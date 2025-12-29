/**
 * Editorial & E-A-T (Expertise, Authoritativeness, Trustworthiness) Types
 *
 * These types support YMYL (Your Money or Your Life) compliance for medical content.
 * All clinical content should have author attribution, medical review, and timestamps.
 */

/**
 * Author information for content attribution
 */
export interface AuthorInfo {
  /** Author's full name */
  name: string;

  /** Author's slug for profile URL */
  slug: string;

  /** Professional credentials (e.g., "BA Psychology, Health Writer") */
  credentials: string;

  /** Job title or role */
  jobTitle?: string;

  /** Short biography (1-2 sentences) */
  bio: string;

  /** Profile URL path (relative) */
  profileUrl: string;

  /** Areas of expertise */
  expertise?: string[];

  /** Educational background */
  education?: string[];

  /** Professional affiliations */
  affiliations?: string[];

  /** Contact email (optional, for schema.org) */
  email?: string;

  /** Social media profiles */
  social?: {
    twitter?: string;
    linkedin?: string;
  };

  /** ORCID (Open Researcher and Contributor ID) for academic verification */
  orcid?: string;
}

/**
 * Medical reviewer information for clinical content
 */
export interface MedicalReviewerInfo {
  /** Reviewer's full name */
  name: string;

  /** Reviewer's slug for profile URL */
  slug: string;

  /** Professional credentials (e.g., "MD, Board-Certified Psychiatrist") */
  credentials: string;

  /** Medical specialty */
  specialty: string;

  /** Board certifications */
  boardCertifications?: string[];

  /** Medical license number (optional, for verification) */
  licenseNumber?: string;

  /** License state/jurisdiction */
  licenseState?: string;

  /** Professional affiliation (e.g., "American Psychiatric Association") */
  affiliation?: string;

  /** Short biography */
  bio: string;

  /** Profile URL path (relative) */
  profileUrl: string;

  /** Years of practice */
  yearsOfPractice?: number;

  /** Areas of clinical expertise */
  clinicalExpertise?: string[];

  /** ORCID (Open Researcher and Contributor ID) for academic verification */
  orcid?: string;

  /** NPI (National Provider Identifier) for medical license verification */
  npi?: string;

  /** Social media profiles */
  social?: {
    linkedin?: string;
  };
}

/**
 * Editorial dates for content freshness and currency
 */
export interface EditorialDates {
  /** Original publication date (ISO 8601) */
  published: string;

  /** Last content update date (ISO 8601) */
  lastUpdated: string;

  /** Last medical review date (ISO 8601) */
  lastMedicallyReviewed: string;

  /** Next scheduled review date (ISO 8601) */
  nextReviewDue?: string;
}

/**
 * Review history entry for tracking content updates
 */
export interface ReviewHistoryEntry {
  /** Review date (ISO 8601) */
  date: string;

  /** Reviewer name and credentials */
  reviewer: string;

  /** Summary of changes made */
  changes: string;

  /** Source citations for updates */
  sources?: string[];

  /** Reason for review (e.g., "annual review", "new guidelines", "user feedback") */
  reason?: string;
}

/**
 * Citation/reference information
 */
export interface Citation {
  /** Citation ID (for in-text references like [1]) */
  id: number;

  /** Full citation text */
  text: string;

  /** DOI link (if applicable) */
  doi?: string;

  /** PubMed ID (if applicable) */
  pmid?: string;

  /** Direct URL to source */
  url?: string;

  /** Citation type (journal, guideline, textbook, etc.) */
  type?: 'journal' | 'guideline' | 'textbook' | 'government' | 'professional' | 'other';

  /** Publication year */
  year?: number;

  /** Authors (for structured citations) */
  authors?: string[];

  /** Article/chapter title */
  title?: string;

  /** Journal/book name */
  publication?: string;
}

/**
 * Raw editorial metadata as stored in JSON files
 * Uses ID-based references for reviewers/authors
 */
export interface RawEditorialMetadata {
  /** Author ID (e.g., "sarah-mitchell") */
  authorId?: string;

  /** Medical reviewer IDs (e.g., ["john-lee-md"]) */
  medicalReviewerIds?: string[];

  /** Review board status (e.g., "official") */
  reviewBoard?: 'official' | 'pending' | 'none';

  /** Last reviewed date (ISO 8601) */
  lastReviewed?: string;

  /** Last updated date (ISO 8601) */
  lastUpdated?: string;
}

/**
 * Complete editorial metadata for an entity
 * Contains resolved full objects (not IDs)
 */
export interface EditorialMetadata {
  /** Content author (resolved from authorId) */
  author?: AuthorInfo;

  /** Medical reviewer (resolved from medicalReviewerIds) */
  medicalReviewer?: MedicalReviewerInfo;

  /** Editorial dates */
  dates?: EditorialDates;

  /** Review history (chronological) */
  reviewHistory?: ReviewHistoryEntry[];

  /** Citations/references */
  citations?: Citation[];

  /** Medical disclaimer override (if custom disclaimer needed) */
  customDisclaimer?: string;

  /** Evidence level (A/B/C or 1/2/3 rating) */
  evidenceLevel?: string;

  /** Content quality rating (internal) */
  qualityRating?: number;

  /** Editorial notes (internal, not displayed) */
  internalNotes?: string;

  // Preserved raw fields for backwards compatibility
  /** Raw reviewer IDs from JSON */
  medicalReviewerIds?: string[];
  
  /** Raw author ID from JSON */
  authorId?: string;
  
  /** Review board status */
  reviewBoard?: 'official' | 'pending' | 'none';
  
  /** Last reviewed date (ISO 8601) */
  lastReviewed?: string;
  
  /** Last updated date (ISO 8601) */
  lastUpdated?: string;
}

/**
 * Type guard to check if entity has editorial metadata
 */
export function hasEditorialMetadata(entity: any): entity is { editorial: EditorialMetadata } {
  return entity && typeof entity === 'object' && 'editorial' in entity;
}

/**
 * Type guard to check if entity has author
 */
export function hasAuthor(entity: any): boolean {
  return hasEditorialMetadata(entity) && !!entity.editorial?.author;
}

/**
 * Type guard to check if entity has medical reviewer
 */
export function hasMedicalReviewer(entity: any): boolean {
  return hasEditorialMetadata(entity) && !!entity.editorial?.medicalReviewer;
}

/**
 * Type guard to check if entity has editorial dates
 */
export function hasEditorialDates(entity: any): boolean {
  return hasEditorialMetadata(entity) && !!entity.editorial?.dates;
}

/**
 * Get formatted date string
 */
export function formatEditorialDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
}

/**
 * Check if content needs review (based on last review date)
 */
export function needsReview(dates: EditorialDates, maxAgeDays: number = 365): boolean {
  try {
    const lastReview = new Date(dates.lastMedicallyReviewed);
    const now = new Date();
    const daysSinceReview = (now.getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceReview > maxAgeDays;
  } catch {
    return true; // If dates invalid, assume needs review
  }
}
