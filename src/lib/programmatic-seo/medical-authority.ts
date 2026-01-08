/**
 * MEDICAL AUTHORITY - REAL, VISIBLE, DEFENSIBLE
 * 
 * Claimed authority without proof = ranking penalty + legal risk.
 * 
 * This module implements PROVABLE medical authority:
 * - Named reviewers (MD/DO/PhD/NP)
 * - Reviewer profile pages
 * - Clear review scope
 * - Honest freshness signals (no "Updated today" without actual changes)
 */

// ============ REVIEWER PROFILES ============

export interface MedicalReviewer {
  id: string;
  name: string;
  credentials: string[];        // MD, DO, PhD, NP, etc.
  title: string;
  specialty: string;
  institution?: string;
  profileUrl: string;           // Must have a real profile page
  photoUrl?: string;
  bio: string;
  verificationDate: string;     // When credentials were verified
}

/**
 * Official HeyPsych Medical Review Board
 * 
 * NOTE: In production, replace with actual verified reviewers.
 * Each reviewer needs:
 * - Verifiable credentials
 * - A profile page on HeyPsych
 * - Clear scope of expertise
 */
export const MEDICAL_REVIEW_BOARD: MedicalReviewer[] = [
  {
    id: 'medical-review-board',
    name: 'HeyPsych Medical Review Board',
    credentials: ['MD', 'PhD', 'NP'],
    title: 'Medical Advisory Committee',
    specialty: 'Psychiatry & Mental Health',
    profileUrl: '/about/medical-review-board',
    bio: 'Our Medical Review Board consists of board-certified psychiatrists, psychiatric nurse practitioners, and clinical psychologists who review all clinical content for accuracy.',
    verificationDate: '2025-01-01',
  },
];

// ============ REVIEW SCOPE ============

export interface ReviewScope {
  type: 'clinical-accuracy' | 'general-information' | 'educational';
  statement: string;
  limitations: string[];
}

/**
 * Clear, honest review scope statement
 */
export function getReviewScope(pageType: string): ReviewScope {
  if (pageType.includes('treatment') || pageType.includes('medication')) {
    return {
      type: 'clinical-accuracy',
      statement: 'Reviewed for clinical accuracy against FDA labeling and current practice guidelines.',
      limitations: [
        'This is not medical advice.',
        'Individual circumstances may vary.',
        'Always consult your healthcare provider before making treatment decisions.',
        'Information may not reflect the most recent updates or research.',
      ],
    };
  }

  if (pageType.includes('condition') || pageType.includes('symptoms')) {
    return {
      type: 'general-information',
      statement: 'Reviewed for general accuracy based on DSM-5 criteria and clinical guidelines.',
      limitations: [
        'This information is for educational purposes only.',
        'It cannot be used for self-diagnosis.',
        'A qualified mental health professional should conduct formal diagnosis.',
      ],
    };
  }

  return {
    type: 'educational',
    statement: 'Reviewed for general accuracy and clarity.',
    limitations: [
      'This information is for educational purposes only.',
      'It does not constitute medical advice.',
    ],
  };
}

// ============ FRESHNESS - HONEST SIGNALS ============

export interface FreshnessSignals {
  contentCreated: string;        // When first published
  contentModified: string | null; // When content actually changed (null if never)
  lastMedicalReview: string;     // When a reviewer last checked it
  nextScheduledReview: string;   // When it will be reviewed again
  changeLog?: ContentChange[];   // What changed and when
}

export interface ContentChange {
  date: string;
  type: 'major' | 'minor' | 'correction';
  description: string;
}

/**
 * Generate HONEST freshness signals
 * 
 * NO "Updated today" unless content actually changed.
 * We show real dates that build trust.
 */
export function generateHonestFreshness(
  contentCreatedDate: string,
  lastActualChange?: string,
  lastReviewDate?: string
): FreshnessSignals {
  const now = new Date();
  
  // Next review is 3 months from last review (or creation if never reviewed)
  const lastReview = new Date(lastReviewDate || contentCreatedDate);
  const nextReview = new Date(lastReview);
  nextReview.setMonth(nextReview.getMonth() + 3);
  
  return {
    contentCreated: contentCreatedDate,
    contentModified: lastActualChange || null,
    lastMedicalReview: lastReviewDate || contentCreatedDate,
    nextScheduledReview: nextReview.toISOString().split('T')[0],
  };
}

/**
 * Format freshness for display
 */
export function formatFreshnessDisplay(signals: FreshnessSignals): {
  primary: string;    // Main date to show
  secondary: string;  // Additional context
} {
  // Show medical review date as primary (more trustworthy than "updated")
  const reviewDate = new Date(signals.lastMedicalReview);
  const formattedReview = reviewDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  
  const primary = `Last medically reviewed: ${formattedReview}`;
  
  // Show next review as secondary
  const nextDate = new Date(signals.nextScheduledReview);
  const formattedNext = nextDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  
  const secondary = `Next review scheduled: ${formattedNext}`;
  
  return { primary, secondary };
}

// ============ SCHEMA FOR MEDICAL AUTHORITY ============

/**
 * Generate proper medical authority schema
 */
export function generateMedicalAuthoritySchema(
  pageUrl: string,
  reviewer: MedicalReviewer,
  scope: ReviewScope,
  freshness: FreshnessSignals
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    url: pageUrl,
    lastReviewed: freshness.lastMedicalReview,
    reviewedBy: {
      '@type': 'Organization',
      '@id': 'https://heypsych.com/#organization',
      name: reviewer.name,
      url: `https://heypsych.com${reviewer.profileUrl}`,
    },
    medicalAudience: {
      '@type': 'MedicalAudience',
      audienceType: 'Patient',
    },
    // Explicitly NOT claiming to be medical advice
    disclaimer: scope.limitations.join(' '),
  };
}

// ============ CITATION PATTERNS ============

/**
 * AI Citation Strategy - BORROW AUTHORITY
 * 
 * Always cite primary sources first, then summarize.
 * LLMs trust relayers, not self-declared authorities.
 */
export interface CitationPattern {
  primary: string;     // The authoritative source
  statement: string;   // What the source says
  heypychRole: string; // How HeyPsych adds value
}

export const CITATION_TEMPLATES = {
  fda: (drug: string, claim: string): CitationPattern => ({
    primary: 'FDA prescribing information',
    statement: `According to FDA-approved labeling for ${drug}, ${claim}`,
    heypychRole: 'HeyPsych summarizes this information in plain language.',
  }),
  
  apa: (guideline: string, claim: string): CitationPattern => ({
    primary: 'American Psychiatric Association guidelines',
    statement: `APA practice guidelines state that ${claim}`,
    heypychRole: 'HeyPsych presents this guidance in accessible terms.',
  }),
  
  study: (citation: string, claim: string): CitationPattern => ({
    primary: citation,
    statement: `Research has found that ${claim}`,
    heypychRole: 'HeyPsych summarizes current evidence for patients.',
  }),
  
  consensus: (claim: string): CitationPattern => ({
    primary: 'Clinical consensus',
    statement: `Medical experts generally agree that ${claim}`,
    heypychRole: 'HeyPsych presents this consensus for patient understanding.',
  }),
};

/**
 * Format a proper citation for content
 */
export function formatCitation(pattern: CitationPattern): string {
  return `${pattern.statement} ${pattern.heypychRole}`;
}

// ============ DISCLAIMER LEVELS ============

export type DisclaimerLevel = 'standard' | 'elevated' | 'critical';

export interface Disclaimer {
  level: DisclaimerLevel;
  text: string;
  additionalWarnings?: string[];
}

export function getDisclaimer(
  pageType: string,
  isControlledSubstance: boolean = false
): Disclaimer {
  if (isControlledSubstance) {
    return {
      level: 'critical',
      text: 'This medication is a controlled substance with potential for dependence. This information is for educational purposes only and does not constitute medical advice. Never change your medication regimen without consulting your prescribing physician.',
      additionalWarnings: [
        'Do not share this medication with others.',
        'Store securely away from children.',
        'Report any signs of misuse to your doctor.',
      ],
    };
  }

  if (pageType.includes('treatment') || pageType.includes('medication') || pageType.includes('dosage')) {
    return {
      level: 'elevated',
      text: 'This information is for educational purposes only and does not constitute medical advice. Always consult your healthcare provider before starting, stopping, or changing any medication.',
    };
  }

  return {
    level: 'standard',
    text: 'This information is for educational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment.',
  };
}


