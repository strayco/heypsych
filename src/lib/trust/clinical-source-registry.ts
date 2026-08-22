/**
 * CLINICAL SOURCE REGISTRY
 *
 * Central registry for all clinical sources referenced in the codebase.
 * Every claim, statistic, or clinical assertion should trace back to
 * a registered and validated source.
 *
 * SOURCE TYPES:
 * - peer_reviewed: Published in peer-reviewed journal
 * - guideline: Official clinical practice guideline (APA, NICE, etc.)
 * - government: Government health agency (FDA, CDC, NIH)
 * - textbook: Standard medical/psychiatric textbook
 * - meta_analysis: Systematic review or meta-analysis
 * - clinical_trial: Registered clinical trial (clinicaltrials.gov)
 *
 * EVIDENCE LEVELS:
 * - A: High quality (RCT, meta-analysis of RCTs)
 * - B: Moderate quality (cohort studies, non-randomized trials)
 * - C: Low quality (case reports, expert opinion)
 * - D: Unrated/Unknown
 *
 * @see Phase C of Wave 3 directive
 */

// ============ TYPES ============

/**
 * Source type classification
 */
export type SourceType =
  | 'peer_reviewed'
  | 'guideline'
  | 'government'
  | 'textbook'
  | 'meta_analysis'
  | 'clinical_trial'
  | 'preprint'
  | 'database'
  | 'other';

/**
 * Evidence level classification
 */
export type EvidenceLevel = 'A' | 'B' | 'C' | 'D';

/**
 * Clinical source interface
 */
export interface ClinicalSource {
  /** Unique identifier for the source */
  id: string;

  /** Digital Object Identifier (if available) */
  doi?: string;

  /** PubMed ID (if available) */
  pmid?: string;

  /** Direct URL to source */
  url?: string;

  /** Source title */
  title: string;

  /** Publication year */
  year?: number;

  /** Authors (first 3 + et al if more) */
  authors?: string[];

  /** Journal/publication name */
  publication?: string;

  /** Volume/issue/pages */
  citation?: string;

  /** Source type classification */
  sourceType: SourceType;

  /** Evidence level */
  evidenceLevel: EvidenceLevel;

  /** When this source was last verified as accessible */
  verifiedAt?: string;

  /** Verification status */
  verificationStatus: 'verified' | 'pending' | 'failed' | 'expired';

  /** Error message if verification failed */
  verificationError?: string;

  /** Internal notes */
  notes?: string;

  /** Topics this source is relevant to */
  topics?: string[];

  /** Which entities reference this source */
  referencedBy?: string[];
}

/**
 * Source validation result
 */
export interface SourceValidationResult {
  valid: boolean;
  source: ClinicalSource;
  errors: string[];
  warnings: string[];
  metadata?: {
    fetchedTitle?: string;
    fetchedAuthors?: string[];
    fetchedYear?: number;
    doiResolved?: boolean;
    pmidResolved?: boolean;
    urlAccessible?: boolean;
  };
}

/**
 * Registry statistics
 */
export interface SourceRegistryStats {
  totalSources: number;
  byType: Record<SourceType, number>;
  byEvidenceLevel: Record<EvidenceLevel, number>;
  byVerificationStatus: Record<string, number>;
  sourcesNeedingVerification: number;
  averageEvidenceLevel: number;
}

// ============ REGISTRY STORAGE ============

/**
 * In-memory source registry
 * In production, this would be backed by a database
 */
const sourceRegistry: Map<string, ClinicalSource> = new Map();

/**
 * Index: DOI → source ID
 */
const doiIndex: Map<string, string> = new Map();

/**
 * Index: PMID → source ID
 */
const pmidIndex: Map<string, string> = new Map();

/**
 * Index: topic → source IDs
 */
const topicIndex: Map<string, Set<string>> = new Map();

// ============ SOURCE REGISTRATION ============

/**
 * Generate a unique source ID
 */
function generateSourceId(source: Partial<ClinicalSource>): string {
  // Use DOI if available (most stable identifier)
  if (source.doi) {
    return `doi:${source.doi.replace(/^https?:\/\/doi\.org\//, '')}`;
  }

  // Use PMID if available
  if (source.pmid) {
    return `pmid:${source.pmid}`;
  }

  // Fall back to URL-based ID
  if (source.url) {
    const urlHash = source.url
      .replace(/^https?:\/\//, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .slice(0, 50);
    return `url:${urlHash}`;
  }

  // Last resort: title-based ID
  const titleSlug = (source.title || 'unknown')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 50);
  return `title:${titleSlug}-${Date.now()}`;
}

/**
 * Register a clinical source
 */
export function registerSource(
  source: Omit<ClinicalSource, 'id' | 'verificationStatus'>
): ClinicalSource {
  // Check if source already exists via DOI or PMID
  if (source.doi) {
    const existingId = doiIndex.get(source.doi);
    if (existingId) {
      const existing = sourceRegistry.get(existingId);
      if (existing) return existing;
    }
  }

  if (source.pmid) {
    const existingId = pmidIndex.get(source.pmid);
    if (existingId) {
      const existing = sourceRegistry.get(existingId);
      if (existing) return existing;
    }
  }

  // Create new source
  const id = generateSourceId(source);
  const fullSource: ClinicalSource = {
    ...source,
    id,
    verificationStatus: 'pending',
  };

  // Store in registry
  sourceRegistry.set(id, fullSource);

  // Update indexes
  if (source.doi) {
    doiIndex.set(source.doi, id);
  }
  if (source.pmid) {
    pmidIndex.set(source.pmid, id);
  }
  if (source.topics) {
    for (const topic of source.topics) {
      if (!topicIndex.has(topic)) {
        topicIndex.set(topic, new Set());
      }
      topicIndex.get(topic)!.add(id);
    }
  }

  return fullSource;
}

/**
 * Batch register sources
 */
export function registerSources(
  sources: Array<Omit<ClinicalSource, 'id' | 'verificationStatus'>>
): ClinicalSource[] {
  return sources.map(registerSource);
}

// ============ SOURCE RETRIEVAL ============

/**
 * Get source by ID
 */
export function getSource(id: string): ClinicalSource | undefined {
  return sourceRegistry.get(id);
}

/**
 * Get source by DOI
 */
export function getSourceByDOI(doi: string): ClinicalSource | undefined {
  const id = doiIndex.get(doi);
  return id ? sourceRegistry.get(id) : undefined;
}

/**
 * Get source by PMID
 */
export function getSourceByPMID(pmid: string): ClinicalSource | undefined {
  const id = pmidIndex.get(pmid);
  return id ? sourceRegistry.get(id) : undefined;
}

/**
 * Get sources for a topic
 */
export function getSourcesForTopic(topic: string): ClinicalSource[] {
  const ids = topicIndex.get(topic);
  if (!ids) return [];
  return Array.from(ids)
    .map(id => sourceRegistry.get(id))
    .filter((s): s is ClinicalSource => !!s);
}

/**
 * Get all sources
 */
export function getAllSources(): ClinicalSource[] {
  return Array.from(sourceRegistry.values());
}

// ============ SOURCE VALIDATION ============

/**
 * Validate a clinical source
 *
 * Checks:
 * 1. Required fields present
 * 2. DOI format valid (if present)
 * 3. PMID format valid (if present)
 * 4. URL accessible (if present, optionally)
 * 5. Evidence level appropriate for source type
 */
export async function validateSource(
  source: ClinicalSource,
  options: { checkUrl?: boolean; checkDoi?: boolean } = {}
): Promise<SourceValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const metadata: SourceValidationResult['metadata'] = {};

  // Required field validation
  if (!source.title) {
    errors.push('Title is required');
  }

  if (!source.sourceType) {
    errors.push('Source type is required');
  }

  if (!source.evidenceLevel) {
    errors.push('Evidence level is required');
  }

  // At least one identifier required
  if (!source.doi && !source.pmid && !source.url) {
    errors.push('At least one identifier (DOI, PMID, or URL) is required');
  }

  // DOI format validation
  if (source.doi) {
    const doiPattern = /^10\.\d{4,}\/[^\s]+$/;
    if (!doiPattern.test(source.doi)) {
      errors.push(`Invalid DOI format: ${source.doi}`);
    }
  }

  // PMID format validation
  if (source.pmid) {
    const pmidPattern = /^\d+$/;
    if (!pmidPattern.test(source.pmid)) {
      errors.push(`Invalid PMID format: ${source.pmid}`);
    }
  }

  // Evidence level consistency check
  const evidenceLevelWarnings = checkEvidenceLevelConsistency(source);
  warnings.push(...evidenceLevelWarnings);

  // Year validation
  if (source.year) {
    const currentYear = new Date().getFullYear();
    if (source.year < 1900 || source.year > currentYear + 1) {
      warnings.push(`Unusual publication year: ${source.year}`);
    }
    if (source.year < currentYear - 10) {
      warnings.push(`Source is over 10 years old - may need updating`);
    }
  }

  // Optional URL check (disabled by default - expensive)
  if (options.checkUrl && source.url) {
    try {
      // In production, use fetch with timeout
      // For now, just mark as not checked
      metadata.urlAccessible = undefined;
    } catch {
      metadata.urlAccessible = false;
      warnings.push(`Could not verify URL accessibility`);
    }
  }

  // Update verification status
  const valid = errors.length === 0;
  const updatedSource: ClinicalSource = {
    ...source,
    verificationStatus: valid ? 'verified' : 'failed',
    verifiedAt: new Date().toISOString(),
    verificationError: errors.length > 0 ? errors.join('; ') : undefined,
  };

  // Update registry
  sourceRegistry.set(source.id, updatedSource);

  return {
    valid,
    source: updatedSource,
    errors,
    warnings,
    metadata,
  };
}

/**
 * Check evidence level consistency with source type
 */
function checkEvidenceLevelConsistency(source: ClinicalSource): string[] {
  const warnings: string[] = [];

  // Meta-analyses should typically be evidence level A
  if (source.sourceType === 'meta_analysis' && source.evidenceLevel !== 'A') {
    warnings.push('Meta-analyses typically warrant evidence level A');
  }

  // Guidelines should typically be A or B
  if (source.sourceType === 'guideline' && !['A', 'B'].includes(source.evidenceLevel)) {
    warnings.push('Clinical guidelines typically warrant evidence level A or B');
  }

  // Preprints should typically be C or D
  if (source.sourceType === 'preprint' && ['A', 'B'].includes(source.evidenceLevel)) {
    warnings.push('Preprints should not be rated as evidence level A or B');
  }

  return warnings;
}

/**
 * Batch validate sources
 */
export async function validateAllSources(
  options: { checkUrl?: boolean } = {}
): Promise<SourceValidationResult[]> {
  const results: SourceValidationResult[] = [];

  for (const source of sourceRegistry.values()) {
    const result = await validateSource(source, options);
    results.push(result);
  }

  return results;
}

// ============ SOURCE LINKING ============

/**
 * Link a source to an entity
 */
export function linkSourceToEntity(sourceId: string, entityId: string): boolean {
  const source = sourceRegistry.get(sourceId);
  if (!source) return false;

  if (!source.referencedBy) {
    source.referencedBy = [];
  }

  if (!source.referencedBy.includes(entityId)) {
    source.referencedBy.push(entityId);
  }

  return true;
}

/**
 * Get sources for an entity
 */
export function getSourcesForEntity(entityId: string): ClinicalSource[] {
  return Array.from(sourceRegistry.values()).filter(
    source => source.referencedBy?.includes(entityId)
  );
}

// ============ STATISTICS ============

/**
 * Get registry statistics
 */
export function getRegistryStats(): SourceRegistryStats {
  const byType: Record<SourceType, number> = {
    peer_reviewed: 0,
    guideline: 0,
    government: 0,
    textbook: 0,
    meta_analysis: 0,
    clinical_trial: 0,
    preprint: 0,
    database: 0,
    other: 0,
  };

  const byEvidenceLevel: Record<EvidenceLevel, number> = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
  };

  const byVerificationStatus: Record<string, number> = {
    verified: 0,
    pending: 0,
    failed: 0,
    expired: 0,
  };

  let evidenceLevelSum = 0;
  let sourcesNeedingVerification = 0;

  const evidenceLevelValues: Record<EvidenceLevel, number> = {
    A: 4,
    B: 3,
    C: 2,
    D: 1,
  };

  for (const source of sourceRegistry.values()) {
    byType[source.sourceType]++;
    byEvidenceLevel[source.evidenceLevel]++;
    byVerificationStatus[source.verificationStatus]++;

    evidenceLevelSum += evidenceLevelValues[source.evidenceLevel];

    if (source.verificationStatus === 'pending' || source.verificationStatus === 'expired') {
      sourcesNeedingVerification++;
    }
  }

  const totalSources = sourceRegistry.size;

  return {
    totalSources,
    byType,
    byEvidenceLevel,
    byVerificationStatus,
    sourcesNeedingVerification,
    averageEvidenceLevel: totalSources > 0 ? evidenceLevelSum / totalSources : 0,
  };
}

// ============ PERSISTENCE ============

/**
 * Export registry to JSON
 */
export function exportRegistry(): string {
  const sources = Array.from(sourceRegistry.values());
  return JSON.stringify(sources, null, 2);
}

/**
 * Import registry from JSON
 */
export function importRegistry(json: string): void {
  try {
    const sources: ClinicalSource[] = JSON.parse(json);

    // Clear existing
    sourceRegistry.clear();
    doiIndex.clear();
    pmidIndex.clear();
    topicIndex.clear();

    // Re-register all sources
    for (const source of sources) {
      sourceRegistry.set(source.id, source);

      if (source.doi) {
        doiIndex.set(source.doi, source.id);
      }
      if (source.pmid) {
        pmidIndex.set(source.pmid, source.id);
      }
      if (source.topics) {
        for (const topic of source.topics) {
          if (!topicIndex.has(topic)) {
            topicIndex.set(topic, new Set());
          }
          topicIndex.get(topic)!.add(source.id);
        }
      }
    }
  } catch (e) {
    console.error('Failed to import source registry:', e);
    throw new Error('Invalid registry JSON');
  }
}

/**
 * Clear registry (for testing)
 */
export function clearRegistry(): void {
  sourceRegistry.clear();
  doiIndex.clear();
  pmidIndex.clear();
  topicIndex.clear();
}

// ============ COMMON SOURCES ============

/**
 * Pre-register commonly cited sources
 * These are canonical references that appear across multiple pages
 */
export function registerCommonSources(): void {
  // Major meta-analyses
  registerSource({
    doi: '10.1016/S0140-6736(17)32802-7',
    pmid: '29477251',
    title: 'Comparative efficacy and acceptability of 21 antidepressant drugs for the acute treatment of adults with major depressive disorder',
    year: 2018,
    authors: ['Cipriani, A', 'Furukawa, TA', 'Salanti, G', 'et al'],
    publication: 'The Lancet',
    sourceType: 'meta_analysis',
    evidenceLevel: 'A',
    topics: ['depression', 'antidepressants', 'ssri', 'snri'],
  });

  // DSM-5
  registerSource({
    title: 'Diagnostic and Statistical Manual of Mental Disorders, Fifth Edition (DSM-5)',
    year: 2013,
    authors: ['American Psychiatric Association'],
    publication: 'American Psychiatric Publishing',
    url: 'https://www.psychiatry.org/psychiatrists/practice/dsm',
    sourceType: 'textbook',
    evidenceLevel: 'A',
    topics: ['diagnosis', 'criteria', 'classification'],
  });

  // FDA labels (template - individual medications would reference specific labels)
  registerSource({
    title: 'FDA Prescribing Information Database',
    url: 'https://labels.fda.gov/',
    sourceType: 'government',
    evidenceLevel: 'A',
    topics: ['medications', 'dosing', 'side effects', 'fda'],
  });

  // NICE guidelines
  registerSource({
    url: 'https://www.nice.org.uk/guidance/cg90',
    title: 'Depression in adults: treatment and management',
    year: 2022,
    authors: ['National Institute for Health and Care Excellence'],
    sourceType: 'guideline',
    evidenceLevel: 'A',
    topics: ['depression', 'treatment', 'guideline'],
  });

  // APA Practice Guidelines
  registerSource({
    doi: '10.1176/appi.books.9780890426760',
    title: 'Practice Guideline for the Treatment of Patients With Major Depressive Disorder',
    year: 2010,
    authors: ['American Psychiatric Association'],
    publication: 'American Journal of Psychiatry',
    sourceType: 'guideline',
    evidenceLevel: 'A',
    topics: ['depression', 'treatment', 'guideline'],
  });
}

// Types are exported at declaration above
