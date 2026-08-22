/**
 * CENTRAL INDEXATION FIREWALL
 *
 * Single source of truth for all crawling, indexing, and promotion decisions.
 *
 * RULE: Every URL in the system passes through this firewall. No exceptions.
 * This service is consumed by:
 * - Metadata generation (robots meta tags)
 * - Sitemaps (inclusion/exclusion)
 * - Internal promotion (related links, hubs)
 * - Alternate formats (AMP, JSON-LD feeds)
 * - Inventory reporting (dashboards, audits)
 * - CI tests (validation gates)
 *
 * COHORT LIFECYCLE:
 * candidate → public_noindex → indexable_pilot → validated → answer_king
 *                                                      ↓
 *                                               demoted → retired
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
 */

import type { Entity, EntityType } from '@/lib/types/database';
import {
  getSourceByDOI,
  registerSource,
  type ClinicalSource,
} from '@/lib/trust/clinical-source-registry';
import {
  registerClaim,
  getClaimsForEntity,
  getClaimsNeedingAttention,
  type ClinicalClaim,
} from '@/lib/trust/medical-claim-ledger';
import {
  registerContributor,
  assessContributorIntegrity,
  passesEEATRequirements,
  linkContributorToEntity,
  type ContributorIntegrityFlags,
} from '@/lib/trust/contributor-registry';
import { initializeAnswerKings } from './answer-kings';

// ============ ANSWER KING REGISTRY (PRODUCTION IMPLEMENTATION) ============
// This is the CANONICAL answer king registry used in production.
// The advanced answer-king-registry.ts is NOT used (test-only).

/**
 * Idempotence guard - prevents duplicate initialization
 */
let _answerKingsInitialized = false;

/**
 * Answer King mapping - which page is canonical for which topic cluster
 */
interface AnswerKingEntry {
  canonicalPath: string;
  topicCluster: string;
  variants: string[];
  registeredAt: string;
}

/**
 * In-memory answer king registry
 * In production, this would be backed by a database or config file
 */
const answerKingRegistry: Map<string, AnswerKingEntry> = new Map();

/**
 * Quarantined paths - blocked from answer king registration and indexation
 * These paths contain unverified claims and must not be promoted
 */
const quarantinedPaths: Set<string> = new Set([
  '/evidence-matrix',
  '/resources/evidence-matrix',
]);

/**
 * Quarantined topic clusters - registration attempts for these are blocked
 */
const quarantinedClusters: Set<string> = new Set([
  'treatment-evidence-comparison',
]);

/**
 * Check if a path is quarantined
 */
export function isQuarantined(path: string): boolean {
  const normalized = path.toLowerCase().replace(/\/+$/, '');
  return quarantinedPaths.has(normalized);
}

/**
 * Check if a topic cluster is quarantined
 */
export function isClusterQuarantined(cluster: string): boolean {
  return quarantinedClusters.has(cluster);
}

/**
 * Register a page as the answer king for a topic cluster
 * ENFORCES QUARANTINE: Registration is silently rejected for quarantined paths/clusters
 */
export function registerAnswerKing(
  canonicalPath: string,
  topicCluster: string,
  variants: string[] = []
): boolean {
  // QUARANTINE ENFORCEMENT: Block registration of quarantined paths
  if (isQuarantined(canonicalPath)) {
    console.warn(`⚠️ Answer king registration blocked: ${canonicalPath} is quarantined`);
    return false;
  }

  // QUARANTINE ENFORCEMENT: Block registration of quarantined clusters
  if (isClusterQuarantined(topicCluster)) {
    console.warn(`⚠️ Answer king registration blocked: cluster "${topicCluster}" is quarantined`);
    return false;
  }

  answerKingRegistry.set(topicCluster, {
    canonicalPath,
    topicCluster,
    variants,
    registeredAt: new Date().toISOString(),
  });
  return true;
}

/**
 * Check if a path is an answer king
 */
export function isAnswerKing(path: string): boolean {
  for (const entry of answerKingRegistry.values()) {
    if (entry.canonicalPath === path) return true;
  }
  return false;
}

/**
 * Get the answer king for a path (if it defers to one)
 */
export function getAnswerKingFor(path: string): string | undefined {
  for (const entry of answerKingRegistry.values()) {
    if (entry.variants.includes(path)) {
      return entry.canonicalPath;
    }
  }
  return undefined;
}

// Initialize answer king registry at module load time (IDEMPOTENT)
if (!_answerKingsInitialized) {
  initializeAnswerKings();
  _answerKingsInitialized = true;
}

// ============ TYPES ============

/**
 * Route families recognized by the indexation firewall
 */
export type RouteFamily =
  | 'conditions'      // /conditions/[slug]
  | 'treatments'      // /treatments/[slug]
  | 'resources'       // /resources/[slug]
  | 'guide'           // /guide/[slug] - programmatic SEO pages
  | 'tools'           // /tools/[slug] - tools directory
  | 'hubs'            // Category landing pages
  | 'static'          // /, /about, /privacy, etc.
  | 'psychiatrists'   // /psychiatrists/[slug]
  | 'compare'         // /treatments/compare/*
  | 'search'          // /search
  | 'api'             // /api/* (always noindex)
  | 'unknown';

/**
 * Cohort classification for progressive indexation
 *
 * candidate: New page, not yet evaluated
 * public_noindex: Publicly accessible but noindex (thin, duplicate, low-quality)
 * indexable_pilot: Passed quality gates, in pilot indexation
 * validated: Production indexation, verified by GSC data
 * answer_king: Canonical authority for topic cluster
 * demoted: Previously indexed, now quality-gated out
 * retired: Deprecated, should 301 or 410
 */
export type IndexCohort =
  | 'candidate'
  | 'public_noindex'
  | 'indexable_pilot'
  | 'validated'
  | 'answer_king'
  | 'demoted'
  | 'retired';

/**
 * The complete indexation decision for a URL
 */
export interface IndexDecision {
  /** Route family classification */
  routeFamily: RouteFamily;

  /** Canonical URL path (without domain) */
  canonicalPath: string;

  /** Page is publicly accessible (200 response) */
  public: boolean;

  /** Crawlers may access this page (not blocked by robots.txt) */
  crawlable: boolean;

  /** Search engines should index this page (no noindex directive) */
  indexable: boolean;

  /** Page should be included in XML sitemaps */
  sitemapEligible: boolean;

  /** Page can be promoted via internal links */
  internallyPromotable: boolean;

  /** Page can appear in alternate formats (AMP, RSS, JSON feeds) */
  alternateFormatEligible: boolean;

  /** Cohort classification */
  cohort: IndexCohort;

  /** Human-readable reasons for the decision */
  reasons: string[];

  /** Detailed evidence supporting the decision */
  evidence: IndexEvidence;
}

/**
 * Evidence supporting an indexation decision
 */
export interface IndexEvidence {
  /** Content quality signals */
  quality: {
    wordCount?: number;
    hasStructuredContent?: boolean;
    hasReferences?: boolean;
    hasMedicalReview?: boolean;
    clinicalCompletenessScore?: number;
    uniquenessScore?: number;
    safetyScore?: number;
  };

  /** Demand signals */
  demand: {
    estimatedSearchVolume?: number;
    gscImpressions?: number;
    gscClicks?: number;
    gscPosition?: number;
    internalLinkCount?: number;
  };

  /** Authority signals */
  authority: {
    isAnswerKing?: boolean;
    canonicalFor?: string[];
    defersToCanonicale?: string;
    backlinks?: number;
  };

  /** Freshness signals */
  freshness: {
    createdAt?: string;
    updatedAt?: string;
    lastReviewedAt?: string;
    contentAge?: number; // days since last meaningful update
  };

  /** YMYL compliance */
  ymyl: {
    isMedicalContent?: boolean;
    hasDisclaimer?: boolean;
    hasAuthorCredentials?: boolean;
    hasMedicalReviewer?: boolean;
    disclaimerLevel?: 'standard' | 'elevated' | 'critical';
  };

  /** Medical claim tracking (from medical-claim-ledger) */
  claimTracking?: {
    hasUnsupportedClaims?: boolean;
    hasWeakEvidenceClaims?: boolean;
    claimCount?: number;
    unsupportedClaimTypes?: string[];
  };

  /** Contributor integrity (from contributor-registry) */
  contributorIntegrity?: {
    hasReviewer?: boolean;
    reviewerPassesEEAT?: boolean;
    flags?: ContributorIntegrityFlags;
  };
}

// ============ CONFIGURATION ============

/**
 * Thresholds for quality gates
 */
export interface QualityThresholds {
  minWordCount: number;
  minUniquenessScore: number;
  minSafetyScore: number;
  minClinicalCompleteness: number;
  requireMedicalReview: boolean;
  requireReferences: boolean;
}

const DEFAULT_QUALITY_THRESHOLDS: QualityThresholds = {
  minWordCount: 500,
  minUniquenessScore: 0.7,
  minSafetyScore: 0.8,
  minClinicalCompleteness: 0.6,
  requireMedicalReview: false, // For now, don't require this
  requireReferences: false,    // For now, don't require this
};

/**
 * Family-specific quality requirements
 */
const FAMILY_THRESHOLDS: Partial<Record<RouteFamily, Partial<QualityThresholds>>> = {
  conditions: {
    minWordCount: 800,
    minClinicalCompleteness: 0.7,
  },
  treatments: {
    minWordCount: 600,
    minSafetyScore: 0.85,
    minClinicalCompleteness: 0.7,
  },
  guide: {
    minWordCount: 400, // Programmatic pages can be leaner
    minUniquenessScore: 0.6,
  },
  resources: {
    minWordCount: 300,
    minClinicalCompleteness: 0.5,
  },
};

// ============ ROUTE CLASSIFICATION ============

/**
 * Classify a URL path into a route family
 */
export function classifyRouteFamily(path: string): RouteFamily {
  // Normalize path but preserve root '/'
  let normalizedPath = path.toLowerCase().replace(/\/+$/, '');
  if (normalizedPath === '') normalizedPath = '/';

  // API routes - always noindex
  if (normalizedPath.startsWith('/api/')) return 'api';

  // Programmatic guide pages
  if (normalizedPath.startsWith('/guide/')) return 'guide';

  // Tools directory
  if (normalizedPath.startsWith('/tools/')) return 'tools';

  // Search
  if (normalizedPath === '/search') return 'search';

  // Compare pages
  if (normalizedPath.includes('/compare/')) return 'compare';

  // Psychiatrists
  if (normalizedPath.startsWith('/psychiatrists')) {
    if (normalizedPath === '/psychiatrists') return 'hubs';
    return 'psychiatrists';
  }

  // Conditions
  if (normalizedPath.startsWith('/conditions')) {
    if (normalizedPath === '/conditions') return 'hubs';
    return 'conditions';
  }

  // Treatments
  if (normalizedPath.startsWith('/treatments')) {
    // Hub pages
    if ([
      '/treatments',
      '/treatments/medications',
      '/treatments/therapy',
      '/treatments/interventional',
      '/treatments/alternative',
      '/treatments/supplements',
      '/treatments/investigational',
    ].includes(normalizedPath)) {
      return 'hubs';
    }
    return 'treatments';
  }

  // Resources
  if (normalizedPath.startsWith('/resources')) {
    // Hub pages
    if ([
      '/resources',
      '/resources/assessments-screeners',
      '/resources/articles-guides',
      '/resources/knowledge-hub',
      '/resources/support-community',
      '/resources/digital-tools',
    ].includes(normalizedPath)) {
      return 'hubs';
    }
    return 'resources';
  }

  // Static pages
  if (['/', '/about', '/privacy', '/terms', '/contact'].includes(normalizedPath)) {
    return 'static';
  }

  return 'unknown';
}

// ============ QUALITY GATES ============

/**
 * Calculate clinical completeness score for an entity
 *
 * This checks for presence of key medical content elements:
 * - Symptoms/manifestations
 * - Causes/etiology
 * - Diagnosis information
 * - Treatment approaches
 * - Prognosis
 * - Medical codes (ICD-10, DSM-5)
 * - References
 */
function calculateClinicalCompleteness(entity: Entity, routeFamily: RouteFamily): number {
  let score = 0;
  let maxScore = 0;

  const data = entity.data || {};
  const metadata = entity.metadata || {};
  const content = data.content || {};

  if (routeFamily === 'conditions') {
    // Conditions have specific requirements
    maxScore = 10;

    if (content.symptoms?.core?.length > 0) score += 2;
    if (content.causes?.length > 0) score += 1.5;
    if (content.diagnosis) score += 1;
    if (content.treatment_approaches) score += 2;
    if (content.prognosis) score += 1;
    if (metadata.dsm5_code || metadata.icd10_code) score += 1;
    if ((metadata.references?.length ?? 0) > 0) score += 1.5;
  } else if (routeFamily === 'treatments') {
    // Treatments have different requirements
    maxScore = 10;

    const clinicalMeta = data.clinical_metadata || {};
    const sections = data.sections || [];

    if (clinicalMeta.mechanism_of_action) score += 1.5;
    if (clinicalMeta.primary_indications?.length > 0) score += 1.5;
    if (clinicalMeta.contraindications?.length > 0) score += 1;
    if (sections.some((s: any) => s.type === 'side_effects' || s.type === 'side-effects')) score += 2;
    if (sections.some((s: any) => s.type === 'dosage')) score += 1.5;
    if (sections.some((s: any) => s.type === 'interactions')) score += 1;
    if ((metadata.references?.length ?? 0) > 0) score += 1.5;
  } else if (routeFamily === 'resources') {
    // Resources have simpler requirements
    maxScore = 6;

    if (data.summary || entity.description) score += 1;
    if (data.sections?.length > 0) score += 2;
    if (data.key_takeaways?.length > 0) score += 1.5;
    if ((metadata.references?.length ?? 0) > 0) score += 1.5;
  } else {
    // Default scoring for other types
    maxScore = 4;
    if (entity.description) score += 1;
    if (data.content || data.sections) score += 2;
    if ((metadata.references?.length ?? 0) > 0) score += 1;
  }

  return maxScore > 0 ? score / maxScore : 0;
}

/**
 * Estimate word count for an entity
 */
function estimateWordCount(entity: Entity): number {
  const textParts: string[] = [];

  // Add description
  if (entity.description) textParts.push(entity.description);

  // Add data content
  const data = entity.data || {};

  // Handle sections array
  if (Array.isArray(data.sections)) {
    for (const section of data.sections) {
      if (section.content) textParts.push(section.content);
      if (Array.isArray(section.items)) {
        textParts.push(section.items.join(' '));
      }
    }
  }

  // Handle nested content object
  if (data.content) {
    const flattenContent = (obj: any): void => {
      if (typeof obj === 'string') {
        textParts.push(obj);
      } else if (Array.isArray(obj)) {
        obj.forEach(flattenContent);
      } else if (obj && typeof obj === 'object') {
        Object.values(obj).forEach(flattenContent);
      }
    };
    flattenContent(data.content);
  }

  // Handle summary
  if (data.summary) textParts.push(data.summary);

  const fullText = textParts.join(' ');
  return fullText.split(/\s+/).filter(Boolean).length;
}

/**
 * Check YMYL compliance for an entity
 */
function checkYMYLCompliance(entity: Entity, routeFamily: RouteFamily): IndexEvidence['ymyl'] {
  const isMedicalContent = ['conditions', 'treatments', 'resources'].includes(routeFamily);

  if (!isMedicalContent) {
    return { isMedicalContent: false };
  }

  const editorial = entity.editorial || entity.metadata?.editorial;
  const data = entity.data || {};

  return {
    isMedicalContent: true,
    hasDisclaimer: !!(
      data.disclaimer ||
      data.medical_disclaimer ||
      data.sections?.some((s: any) => s.type === 'disclaimer')
    ),
    hasAuthorCredentials: !!(
      editorial?.author?.credentials ||
      entity.metadata?.author?.credentials
    ),
    hasMedicalReviewer: !!(
      (editorial?.reviewBoard?.length ?? 0) > 0 ||
      entity.metadata?.medical_review?.reviewer_name
    ),
    disclaimerLevel: determineDisclaimerLevel(entity, routeFamily),
  };
}

/**
 * Determine appropriate disclaimer level
 */
function determineDisclaimerLevel(
  entity: Entity,
  routeFamily: RouteFamily
): 'standard' | 'elevated' | 'critical' {
  if (routeFamily === 'treatments') {
    const data = entity.data || {};
    const clinicalMeta = data.clinical_metadata || {};

    // Critical for controlled substances
    const controlledIndicators = [
      'schedule ii', 'schedule iii', 'schedule iv',
      'controlled substance', 'benzodiazepine', 'opioid',
      'stimulant', 'barbiturate',
    ];

    const nameAndDesc = `${entity.name} ${entity.description || ''}`.toLowerCase();
    if (controlledIndicators.some(ind => nameAndDesc.includes(ind))) {
      return 'critical';
    }

    // Elevated for all medications
    if (clinicalMeta.drug_classes || data.sections?.some((s: any) =>
      s.type === 'dosage' || s.type === 'side_effects'
    )) {
      return 'elevated';
    }
  }

  if (routeFamily === 'conditions') {
    // Elevated for conditions involving self-harm, suicide, or severe symptoms
    const sensitiveTerms = [
      'suicide', 'self-harm', 'eating disorder', 'psychosis',
      'schizophrenia', 'bipolar', 'addiction', 'substance use',
    ];

    const nameAndDesc = `${entity.name} ${entity.description || ''}`.toLowerCase();
    if (sensitiveTerms.some(term => nameAndDesc.includes(term))) {
      return 'elevated';
    }
  }

  return 'standard';
}

// ============ CLAIM TRACKING FOR HIGH-RISK CONTENT ============

/**
 * Track medical claims for high-risk content
 *
 * This function:
 * - Extracts claims from high-risk medication content (dosage, interactions, contraindications)
 * - Registers them in the medical-claim-ledger for tracking
 * - Returns flags about unsupported or weak claims
 *
 * This is the operational integration point for the medical-claim-ledger
 * module, making it part of the production indexation decisions.
 */
interface ClaimTrackingResult {
  hasUnsupportedClaims: boolean;
  hasWeakEvidenceClaims: boolean;
  claimCount: number;
  unsupportedClaimTypes: string[];
}

function trackHighRiskClaims(entity: Entity, routeFamily: RouteFamily): ClaimTrackingResult {
  const result: ClaimTrackingResult = {
    hasUnsupportedClaims: false,
    hasWeakEvidenceClaims: false,
    claimCount: 0,
    unsupportedClaimTypes: [],
  };

  // Only track claims for treatments (medications)
  if (routeFamily !== 'treatments') {
    return result;
  }

  const data = entity.data || {};
  const metadata = entity.metadata || {};
  const references = metadata.references || [];
  const sourceIds = references
    .filter((r: any) => r.doi)
    .map((r: any) => `doi:${r.doi.replace(/^https?:\/\/doi\.org\//, '')}`);

  // Extract and register high-risk claims
  const claimSections = [
    { type: 'dosage' as const, sectionTypes: ['dosage', 'dosing', 'dose'] },
    { type: 'interaction' as const, sectionTypes: ['interactions', 'drug_interactions'] },
    { type: 'contraindication' as const, sectionTypes: ['contraindications', 'warnings'] },
    { type: 'side_effect' as const, sectionTypes: ['side_effects', 'adverse_effects'] },
  ];

  const sections = data.sections || [];
  for (const { type, sectionTypes } of claimSections) {
    const matchingSection = sections.find((s: any) =>
      sectionTypes.some(st => s.type?.toLowerCase().includes(st))
    );

    if (matchingSection?.content) {
      // Register this claim
      const claim = registerClaim({
        claimType: type,
        renderedForm: matchingSection.content.substring(0, 500), // First 500 chars as claim
        entityIds: [entity.slug],
        sourceIds,
        locations: [{ entitySlug: entity.slug, sectionType: type }],
      });

      result.claimCount++;

      // Check for unsupported or weak claims
      if (claim.confidence === 'unsupported') {
        result.hasUnsupportedClaims = true;
        result.unsupportedClaimTypes.push(type);
      } else if (claim.confidence === 'low') {
        result.hasWeakEvidenceClaims = true;
      }
    }
  }

  return result;
}

// ============ CONTRIBUTOR INTEGRITY ASSESSMENT ============

/**
 * Assess contributor integrity for an entity
 *
 * This function:
 * - Extracts reviewer information from entity editorial data
 * - Registers the contributor in the contributor registry
 * - Assesses E-E-A-T compliance
 * - Returns flags about contributor integrity issues
 *
 * This is the operational integration point for the contributor-registry
 * module, making it part of the production indexation decisions.
 */
interface ContributorAssessmentResult {
  hasReviewer: boolean;
  reviewerPassesEEAT: boolean;
  flags?: ContributorIntegrityFlags;
}

function assessContributorForEntity(entity: Entity): ContributorAssessmentResult {
  const result: ContributorAssessmentResult = {
    hasReviewer: false,
    reviewerPassesEEAT: false,
  };

  const medicalReviewer = entity.editorial?.medicalReviewer;
  if (!medicalReviewer?.name) {
    return result;
  }

  result.hasReviewer = true;

  // Register the contributor
  const contributor = registerContributor({
    name: medicalReviewer.name,
    slug: medicalReviewer.slug,
    roles: ['medical_reviewer'],
    credentialString: medicalReviewer.credentials,
    specialty: medicalReviewer.specialty,
    bio: medicalReviewer.bio,
    profileUrl: medicalReviewer.profileUrl,
  });

  // Link to entity
  linkContributorToEntity(contributor.id, entity.slug);

  // Assess integrity
  const flags = assessContributorIntegrity(contributor);
  result.flags = flags;

  // Check E-E-A-T compliance
  result.reviewerPassesEEAT = passesEEATRequirements(contributor);

  return result;
}

// ============ QUALITY CREDIT CALCULATION ============

/**
 * Calculate quality credit that can offset word count requirements
 *
 * High-value content signals indicate information density that makes
 * word count less important as a quality gate:
 * - Comparison tables (structured data, not prose filler)
 * - Medical review (expert validation)
 * - Clinical references (evidence-backed claims)
 * - Structured key facts (scannable value)
 * - Unique data (NNT, efficacy percentages, clinical trials)
 *
 * Returns 0.0 to 0.5 (max 50% reduction in word count requirement)
 */
function calculateQualityCredit(entity: Entity, evidence: IndexEvidence): number {
  let credit = 0;
  const data = entity.data || {};
  const metadata = entity.metadata || {};

  // +15% for comparison tables (structured high-value content)
  if (data.comparisonTable || data.comparison_table || data.comparisons) {
    credit += 0.15;
  }

  // +15% for medical review by credentialed reviewer
  const medicalReviewer = entity.editorial?.medicalReviewer;
  const hasCredentialedReviewer = !!(
    medicalReviewer?.credentials && medicalReviewer.credentials.length > 0
  );
  if (hasCredentialedReviewer) {
    credit += 0.15;
  }

  // +10% for clinical references (evidence-backed)
  // Now validates references against clinical source registry for quality
  const references = metadata.references || [];
  const validatedRefs = validateReferencesAgainstRegistry(references);

  if (validatedRefs.uniqueCount >= 2) {
    credit += 0.10;
  } else if (validatedRefs.uniqueCount === 1) {
    credit += 0.05;
  }

  // +5% for DOI-linked references with high evidence level
  // Registry-validated DOIs with evidence level A or B get the bonus
  if (validatedRefs.hasHighEvidenceDOI) {
    credit += 0.05;
  }

  // +5% for structured clinical data (NNT, percentages, clinical trials)
  const hasQuantitativeData = detectQuantitativeData(entity);
  if (hasQuantitativeData) {
    credit += 0.05;
  }

  // Cap at 50% reduction
  return Math.min(credit, 0.5);
}

/**
 * Validate references against the clinical source registry
 *
 * This function:
 * - Deduplicates references by DOI (same DOI = same reference)
 * - Checks if DOIs are registered in the clinical source registry
 * - Returns evidence level from registered sources
 *
 * This is the operational integration point for the clinical-source-registry
 * module, making it part of the production indexation decisions.
 */
interface ValidatedReferencesResult {
  uniqueCount: number;
  hasHighEvidenceDOI: boolean;
  registeredSources: ClinicalSource[];
}

function validateReferencesAgainstRegistry(references: any[]): ValidatedReferencesResult {
  if (!references || references.length === 0) {
    return { uniqueCount: 0, hasHighEvidenceDOI: false, registeredSources: [] };
  }

  // Track unique DOIs to prevent duplicate counting
  const seenDOIs = new Set<string>();
  const registeredSources: ClinicalSource[] = [];
  let hasHighEvidenceDOI = false;

  for (const ref of references) {
    const doi = ref.doi as string | undefined;

    if (doi) {
      // Normalize DOI for deduplication
      const normalizedDOI = doi.toLowerCase().replace(/^https?:\/\/doi\.org\//, '');

      // Skip if we've already counted this DOI
      if (seenDOIs.has(normalizedDOI)) {
        continue;
      }
      seenDOIs.add(normalizedDOI);

      // Check if DOI is registered in the clinical source registry
      const registeredSource = getSourceByDOI(normalizedDOI);
      if (registeredSource) {
        registeredSources.push(registeredSource);

        // Check if this is high-evidence (level A or B)
        if (registeredSource.evidenceLevel === 'A' || registeredSource.evidenceLevel === 'B') {
          hasHighEvidenceDOI = true;
        }
      } else {
        // Auto-register new DOIs with pending verification
        // This builds the registry over time as content is indexed
        registerSource({
          doi: normalizedDOI,
          title: ref.title || 'Unknown',
          sourceType: 'peer_reviewed', // Default, can be updated
          evidenceLevel: 'D', // Unrated until verified
        });
      }
    }
  }

  // Count unique references (by DOI if available, otherwise by title)
  const titleOnlyRefs = references.filter(r => !r.doi);
  const uniqueTitles = new Set(titleOnlyRefs.map(r => (r.title || '').toLowerCase().trim()));
  const uniqueCount = seenDOIs.size + uniqueTitles.size;

  return {
    uniqueCount,
    hasHighEvidenceDOI,
    registeredSources,
  };
}

/**
 * Detect presence of quantitative clinical data
 */
function detectQuantitativeData(entity: Entity): boolean {
  const textToCheck = JSON.stringify(entity.data || {}) + (entity.description || '');

  // Look for NNT, percentages, RCT mentions
  const quantitativePatterns = [
    /NNT\s*(?:of|=|:)?\s*\d+/i,
    /\d+%\s*(?:vs|versus|compared to)/i,
    /RCT|randomized.*trial/i,
    /meta-analysis/i,
    /pooled analysis/i,
    /efficacy.*\d+%/i,
    /response rate.*\d+%/i,
  ];

  return quantitativePatterns.some(pattern => pattern.test(textToCheck));
}

// ============ MAIN DECISION ENGINE ============

/**
 * Make an indexation decision for an entity
 */
export function makeEntityIndexDecision(
  entity: Entity,
  pathOverride?: string
): IndexDecision {
  const path = pathOverride || `/${entity.type}s/${entity.slug}`;
  const routeFamily = classifyRouteFamily(path);

  // Get family-specific thresholds
  const thresholds: QualityThresholds = {
    ...DEFAULT_QUALITY_THRESHOLDS,
    ...FAMILY_THRESHOLDS[routeFamily],
  };

  // Calculate evidence
  const wordCount = estimateWordCount(entity);
  const clinicalCompleteness = calculateClinicalCompleteness(entity, routeFamily);
  const ymyl = checkYMYLCompliance(entity, routeFamily);

  // Track medical claims for high-risk content (operational integration with medical-claim-ledger)
  const claimTracking = trackHighRiskClaims(entity, routeFamily);

  // Assess contributor integrity (operational integration with contributor-registry)
  const contributorAssessment = assessContributorForEntity(entity);

  const evidence: IndexEvidence = {
    quality: {
      wordCount,
      hasStructuredContent: !!((entity.data?.sections?.length ?? 0) > 0 || entity.data?.content),
      hasReferences: !!((entity.metadata?.references?.length ?? 0) > 0),
      hasMedicalReview: !!((entity.editorial?.reviewBoard?.length ?? 0) > 0),
      clinicalCompletenessScore: clinicalCompleteness,
    },
    demand: {
      // These would be populated from GSC API in production
      estimatedSearchVolume: undefined,
      gscImpressions: undefined,
    },
    authority: {
      isAnswerKing: isAnswerKing(path),
      defersToCanonicale: getAnswerKingFor(path),
    },
    freshness: {
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
      lastReviewedAt: entity.editorial?.lastReviewed || entity.metadata?.last_updated,
    },
    ymyl,
    claimTracking: {
      hasUnsupportedClaims: claimTracking.hasUnsupportedClaims,
      hasWeakEvidenceClaims: claimTracking.hasWeakEvidenceClaims,
      claimCount: claimTracking.claimCount,
      unsupportedClaimTypes: claimTracking.unsupportedClaimTypes,
    },
    contributorIntegrity: {
      hasReviewer: contributorAssessment.hasReviewer,
      reviewerPassesEEAT: contributorAssessment.reviewerPassesEEAT,
      flags: contributorAssessment.flags,
    },
  };

  // Start with reasons array
  const reasons: string[] = [];

  // ===== GATE 0: QUARANTINE CHECK (highest priority) =====
  // Quarantined paths are blocked regardless of all other signals
  if (isQuarantined(path)) {
    reasons.push(`Path is quarantined: ${path} contains unverified claims pending row-level verification`);
    return createDecision(path, routeFamily, 'public_noindex', reasons, evidence, {
      crawlable: true,  // Allow crawl but not index
      indexable: false,
      sitemapEligible: false,
      internallyPromotable: false,
      alternateFormatEligible: false,
    });
  }

  // ===== GATE 1: Explicit noindex flag =====
  if (entity.seo?.noindex === true) {
    reasons.push('Explicit noindex flag set in entity.seo');
    return createDecision(path, routeFamily, 'public_noindex', reasons, evidence);
  }

  // ===== GATE 2: Status check =====
  if (entity.status !== 'active') {
    reasons.push(`Entity status is '${entity.status}', not 'active'`);
    return createDecision(path, routeFamily, 'retired', reasons, evidence);
  }

  // ===== GATE 3: Visibility check =====
  if (entity.visibility !== 'public') {
    reasons.push(`Entity visibility is '${entity.visibility}', not 'public'`);
    return createDecision(path, routeFamily, 'public_noindex', reasons, evidence, { public: false });
  }

  // ===== GATE 4: Word count minimum (with quality credit) =====
  // High-value content signals can offset word count requirements
  const qualityCredit = calculateQualityCredit(entity, evidence);
  const effectiveMinWordCount = Math.max(
    thresholds.minWordCount * (1 - qualityCredit),
    150 // Absolute floor - even the best content needs some substance
  );

  if (wordCount < effectiveMinWordCount) {
    reasons.push(
      `Word count ${wordCount} below effective minimum ${Math.round(effectiveMinWordCount)} for ${routeFamily}` +
      (qualityCredit > 0 ? ` (quality credit: ${(qualityCredit * 100).toFixed(0)}%)` : '')
    );
    return createDecision(path, routeFamily, 'public_noindex', reasons, evidence);
  }

  // ===== GATE 5: Clinical completeness =====
  if (clinicalCompleteness < thresholds.minClinicalCompleteness) {
    reasons.push(
      `Clinical completeness ${(clinicalCompleteness * 100).toFixed(0)}% below minimum ${(thresholds.minClinicalCompleteness * 100).toFixed(0)}%`
    );
    return createDecision(path, routeFamily, 'public_noindex', reasons, evidence);
  }

  // ===== GATE 6: YMYL compliance for medical content =====
  if (ymyl.isMedicalContent) {
    if (ymyl.disclaimerLevel === 'critical' && !ymyl.hasDisclaimer) {
      reasons.push('Critical YMYL content missing required disclaimer');
      return createDecision(path, routeFamily, 'public_noindex', reasons, evidence);
    }
  }

  // ===== GATE 6.5: Unsupported Medical Claims =====
  // Pages with unsupported effectiveness/cure claims are blocked
  // This is the operational integration of medical-claim-ledger
  // @see medical-claim-ledger.ts Phase D
  if (claimTracking.hasUnsupportedClaims) {
    const unsupportedTypes = claimTracking.unsupportedClaimTypes;
    // Block pages with high-risk unsupported claim types
    const highRiskClaimTypes = ['cure', 'effectiveness', 'side_effects', 'dosage', 'mechanism'];
    const hasHighRiskUnsupported = unsupportedTypes.some(t => highRiskClaimTypes.includes(t));

    if (hasHighRiskUnsupported) {
      reasons.push(
        `Unsupported medical claims detected: ${unsupportedTypes.join(', ')}. ` +
        `Add citations or evidence levels to ${claimTracking.claimCount} claim(s).`
      );
      return createDecision(path, routeFamily, 'public_noindex', reasons, evidence);
    }
  }

  // ===== GATE 7: Answer King deference =====
  if (evidence.authority?.defersToCanonicale) {
    reasons.push(`Defers to answer king: ${evidence.authority.defersToCanonicale}`);
    return createDecision(path, routeFamily, 'public_noindex', reasons, evidence);
  }

  // ===== All gates passed =====
  if (isAnswerKing(path)) {
    reasons.push('Designated answer king for topic cluster');
    return createDecision(path, routeFamily, 'answer_king', reasons, evidence);
  }

  // Check if we have GSC validation
  if (evidence.demand?.gscImpressions && evidence.demand.gscImpressions > 100) {
    reasons.push('Validated by Google Search Console data');
    return createDecision(path, routeFamily, 'validated', reasons, evidence);
  }

  // Default to indexable_pilot for pages that pass all gates
  reasons.push('All quality gates passed - indexable pilot');
  return createDecision(path, routeFamily, 'indexable_pilot', reasons, evidence);
}

/**
 * Make an indexation decision for a static/hub path (no entity)
 */
export function makePathIndexDecision(path: string): IndexDecision {
  const routeFamily = classifyRouteFamily(path);
  const reasons: string[] = [];

  const evidence: IndexEvidence = {
    quality: {},
    demand: {},
    authority: {
      isAnswerKing: isAnswerKing(path),
    },
    freshness: {},
    ymyl: {
      isMedicalContent: false,
    },
  };

  // API routes are never indexed
  if (routeFamily === 'api') {
    reasons.push('API routes are never indexed');
    return createDecision(path, routeFamily, 'public_noindex', reasons, evidence, {
      crawlable: false,
    });
  }

  // Unknown routes default to noindex
  if (routeFamily === 'unknown') {
    reasons.push('Unknown route family');
    return createDecision(path, routeFamily, 'public_noindex', reasons, evidence);
  }

  // Static and hub pages are always indexable
  if (routeFamily === 'static' || routeFamily === 'hubs') {
    reasons.push(`${routeFamily} pages are indexable by default`);
    return createDecision(path, routeFamily, 'validated', reasons, evidence);
  }

  // Search page - indexable but low priority
  if (routeFamily === 'search') {
    reasons.push('Search page is indexable');
    return createDecision(path, routeFamily, 'indexable_pilot', reasons, evidence);
  }

  // Default to indexable_pilot
  reasons.push('Default indexation policy');
  return createDecision(path, routeFamily, 'indexable_pilot', reasons, evidence);
}

/**
 * Make an indexation decision for a programmatic guide page
 */
export function makeGuideIndexDecision(
  slug: string,
  pageConfig: {
    pageType: string;
    wordCount?: number;
    uniquenessScore?: number;
    safetyScore?: number;
    hasDemographicContent?: boolean;
  }
): IndexDecision {
  const path = `/guide/${slug}`;
  const routeFamily: RouteFamily = 'guide';
  const reasons: string[] = [];

  const thresholds: QualityThresholds = {
    ...DEFAULT_QUALITY_THRESHOLDS,
    ...FAMILY_THRESHOLDS.guide,
  };

  const evidence: IndexEvidence = {
    quality: {
      wordCount: pageConfig.wordCount,
      uniquenessScore: pageConfig.uniquenessScore,
      safetyScore: pageConfig.safetyScore,
    },
    demand: {},
    authority: {
      isAnswerKing: isAnswerKing(path),
      defersToCanonicale: getAnswerKingFor(path),
    },
    freshness: {},
    ymyl: {
      isMedicalContent: true,
      disclaimerLevel: 'elevated',
    },
  };

  // ===== GATE 1: Word count =====
  if (pageConfig.wordCount && pageConfig.wordCount < thresholds.minWordCount) {
    reasons.push(`Word count ${pageConfig.wordCount} below minimum ${thresholds.minWordCount}`);
    return createDecision(path, routeFamily, 'public_noindex', reasons, evidence);
  }

  // ===== GATE 2: Uniqueness score =====
  if (pageConfig.uniquenessScore && pageConfig.uniquenessScore < thresholds.minUniquenessScore) {
    reasons.push(
      `Uniqueness score ${(pageConfig.uniquenessScore * 100).toFixed(0)}% below minimum ${(thresholds.minUniquenessScore * 100).toFixed(0)}%`
    );
    return createDecision(path, routeFamily, 'public_noindex', reasons, evidence);
  }

  // ===== GATE 3: Safety score =====
  if (pageConfig.safetyScore && pageConfig.safetyScore < thresholds.minSafetyScore) {
    reasons.push(
      `Safety score ${(pageConfig.safetyScore * 100).toFixed(0)}% below minimum ${(thresholds.minSafetyScore * 100).toFixed(0)}%`
    );
    return createDecision(path, routeFamily, 'public_noindex', reasons, evidence);
  }

  // ===== GATE 4: Answer king deference =====
  if (evidence.authority?.defersToCanonicale) {
    reasons.push(`Defers to canonical: ${evidence.authority.defersToCanonicale}`);
    return createDecision(path, routeFamily, 'public_noindex', reasons, evidence);
  }

  // ===== All gates passed =====
  if (isAnswerKing(path)) {
    reasons.push('Designated answer king');
    return createDecision(path, routeFamily, 'answer_king', reasons, evidence);
  }

  reasons.push('Programmatic page passed all quality gates');
  return createDecision(path, routeFamily, 'indexable_pilot', reasons, evidence);
}

// ============ HELPER FUNCTIONS ============

/**
 * Create a standardized IndexDecision object
 */
function createDecision(
  path: string,
  routeFamily: RouteFamily,
  cohort: IndexCohort,
  reasons: string[],
  evidence: IndexEvidence,
  overrides?: Partial<IndexDecision>
): IndexDecision {
  const isIndexable = ['indexable_pilot', 'validated', 'answer_king'].includes(cohort);
  const isPublic = cohort !== 'retired' && (overrides?.public !== false);

  return {
    routeFamily,
    canonicalPath: path,
    public: isPublic,
    crawlable: cohort !== 'retired',
    indexable: isIndexable,
    sitemapEligible: isIndexable && isPublic,
    internallyPromotable: isPublic && cohort !== 'demoted',
    alternateFormatEligible: isIndexable,
    cohort,
    reasons,
    evidence,
    ...overrides,
  };
}

// ============ BATCH OPERATIONS ============

/**
 * Filter entities for sitemap inclusion
 */
export function filterEntitiesForSitemap(
  entities: Entity[],
  routeFamily: RouteFamily
): Array<{ entity: Entity; decision: IndexDecision }> {
  return entities
    .map(entity => {
      const path = `/${routeFamily}/${entity.slug}`;
      const decision = makeEntityIndexDecision(entity, path);
      return { entity, decision };
    })
    .filter(({ decision }) => decision.sitemapEligible);
}

/**
 * Get robots meta tag value from decision
 */
export function getRobotsMetaTag(decision: IndexDecision): string {
  if (!decision.crawlable) {
    return 'noindex,nofollow';
  }

  if (!decision.indexable) {
    return 'noindex,follow';
  }

  return 'index,follow';
}

/**
 * Get canonical URL from decision
 */
export function getCanonicalUrl(decision: IndexDecision, baseUrl: string): string {
  // If this page defers to an answer king, that's the canonical
  if (decision.evidence.authority?.defersToCanonicale) {
    return `${baseUrl}${decision.evidence.authority.defersToCanonicale}`;
  }

  return `${baseUrl}${decision.canonicalPath}`;
}

// ============ STATISTICS & REPORTING ============

export interface IndexDecisionStats {
  total: number;
  byCohort: Record<IndexCohort, number>;
  byRouteFamily: Record<RouteFamily, number>;
  indexable: number;
  noindex: number;
  sitemapEligible: number;
  topReasons: Array<{ reason: string; count: number }>;
}

/**
 * Calculate statistics from a batch of decisions
 */
export function calculateDecisionStats(decisions: IndexDecision[]): IndexDecisionStats {
  const byCohort: Record<IndexCohort, number> = {
    candidate: 0,
    public_noindex: 0,
    indexable_pilot: 0,
    validated: 0,
    answer_king: 0,
    demoted: 0,
    retired: 0,
  };

  const byRouteFamily: Record<RouteFamily, number> = {
    conditions: 0,
    treatments: 0,
    resources: 0,
    guide: 0,
    tools: 0,
    hubs: 0,
    static: 0,
    psychiatrists: 0,
    compare: 0,
    search: 0,
    api: 0,
    unknown: 0,
  };

  const reasonCounts: Map<string, number> = new Map();

  let indexable = 0;
  let noindex = 0;
  let sitemapEligible = 0;

  for (const decision of decisions) {
    byCohort[decision.cohort]++;
    byRouteFamily[decision.routeFamily]++;

    if (decision.indexable) indexable++;
    else noindex++;

    if (decision.sitemapEligible) sitemapEligible++;

    for (const reason of decision.reasons) {
      reasonCounts.set(reason, (reasonCounts.get(reason) || 0) + 1);
    }
  }

  const topReasons = Array.from(reasonCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([reason, count]) => ({ reason, count }));

  return {
    total: decisions.length,
    byCohort,
    byRouteFamily,
    indexable,
    noindex,
    sitemapEligible,
    topReasons,
  };
}

// ============ SINGLETON SERVICE ============

class IndexDecisionService {
  private cache: Map<string, IndexDecision> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes

  /**
   * Get decision for an entity with caching
   */
  getEntityDecision(entity: Entity, pathOverride?: string): IndexDecision {
    const cacheKey = `entity:${entity.id}:${entity.updated_at}`;

    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const decision = makeEntityIndexDecision(entity, pathOverride);
    this.cache.set(cacheKey, decision);

    return decision;
  }

  /**
   * Get decision for a static path with caching
   */
  getPathDecision(path: string): IndexDecision {
    const cacheKey = `path:${path}`;

    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    const decision = makePathIndexDecision(path);
    this.cache.set(cacheKey, decision);

    return decision;
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const indexDecisionService = new IndexDecisionService();

// Export class for testing
export { IndexDecisionService };
