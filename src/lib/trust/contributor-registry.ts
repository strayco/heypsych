/**
 * Contributor Registry
 *
 * Central registry for all author, reviewer, and expert contributors.
 * Supports E-E-A-T validation via NPI, ORCID, and credential verification.
 *
 * @see Phase E of Wave 3 directive
 */

// ============ TYPES ============

/**
 * Types of contributors in the system
 */
export type ContributorRole =
  | 'author'
  | 'medical_reviewer'
  | 'clinical_advisor'
  | 'editor'
  | 'fact_checker';

/**
 * Verification status for a contributor
 */
export type VerificationStatus =
  | 'verified'      // All credentials confirmed
  | 'partial'       // Some credentials verified
  | 'pending'       // Awaiting verification
  | 'unverified'    // No verification attempted
  | 'failed';       // Verification attempted but failed

/**
 * Credential types that can be verified
 */
export type CredentialType =
  | 'npi'           // National Provider Identifier (US)
  | 'orcid'         // ORCID researcher ID
  | 'board_cert'    // Board certification
  | 'medical_license'
  | 'phd'
  | 'md'
  | 'do'
  | 'psyd'
  | 'lcsw'
  | 'lmft'
  | 'rn'
  | 'np';

/**
 * A verifiable credential for a contributor
 */
export interface VerifiableCredential {
  type: CredentialType;
  value?: string;           // e.g., NPI number, ORCID ID
  issuer?: string;          // e.g., "American Board of Psychiatry and Neurology"
  verifiedAt?: string;      // ISO timestamp
  expiresAt?: string;       // ISO timestamp (for licenses/certifications)
  verificationSource?: string; // How verified (manual, API, document)
  status: VerificationStatus;
}

/**
 * A registered contributor in the system
 */
export interface Contributor {
  id: string;
  slug: string;
  name: string;
  roles: ContributorRole[];

  /** Professional credentials */
  credentials: VerifiableCredential[];

  /** Display string for credentials (e.g., "MD, Board-Certified Psychiatrist") */
  credentialString?: string;

  /** Primary specialty */
  specialty?: string;

  /** Professional affiliations */
  affiliations?: string[];

  /** Profile page URL */
  profileUrl?: string;

  /** External verification URLs */
  externalUrls?: {
    npiUrl?: string;        // NPPES lookup URL
    orcidUrl?: string;      // ORCID profile URL
    linkedinUrl?: string;   // LinkedIn profile
    institutionUrl?: string; // Institution profile
  };

  /** Bio text */
  bio?: string;

  /** Overall verification status */
  verificationStatus: VerificationStatus;

  /** Entities this contributor is linked to */
  linkedEntities: string[];

  /** Metadata */
  registeredAt: string;
  lastVerifiedAt?: string;
}

/**
 * Contributor integrity flags
 */
export interface ContributorIntegrityFlags {
  missingVerifiableCredentials: boolean;
  expiredCredentials: boolean;
  noLinkedEntities: boolean;
  genericName: boolean;
  missingSpecialty: boolean;
  noExternalVerification: boolean;
}

/**
 * Registry statistics
 */
export interface ContributorRegistryStats {
  totalContributors: number;
  byRole: Record<ContributorRole, number>;
  byVerificationStatus: Record<VerificationStatus, number>;
  withNPI: number;
  withORCID: number;
  needingAttention: number;
}

// ============ REGISTRY STATE ============

/** In-memory contributor registry */
const contributorRegistry = new Map<string, Contributor>();

/** Index by slug for quick lookup */
const slugIndex = new Map<string, string>();

/** Index by NPI for deduplication */
const npiIndex = new Map<string, string>();

/** Index by ORCID for deduplication */
const orcidIndex = new Map<string, string>();

// ============ REGISTRATION FUNCTIONS ============

/**
 * Generate a contributor ID
 */
function generateContributorId(name: string, role: ContributorRole): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${role}:${slug}`;
}

/**
 * Register a new contributor
 */
export function registerContributor(data: {
  name: string;
  slug?: string;
  roles: ContributorRole[];
  credentialString?: string;
  credentials?: Partial<VerifiableCredential>[];
  specialty?: string;
  affiliations?: string[];
  profileUrl?: string;
  externalUrls?: Contributor['externalUrls'];
  bio?: string;
}): Contributor {
  const primaryRole = data.roles[0] || 'author';
  const id = generateContributorId(data.name, primaryRole);
  const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  // Check for existing by slug
  if (slugIndex.has(slug)) {
    const existingId = slugIndex.get(slug)!;
    return contributorRegistry.get(existingId)!;
  }

  // Parse credentials from string if not explicitly provided
  let credentials: VerifiableCredential[];
  if (data.credentials && data.credentials.length > 0) {
    const mapped: VerifiableCredential[] = [];
    for (const c of data.credentials) {
      const type = c.type || inferCredentialType(c.value || '');
      if (type) {
        mapped.push({
          type,
          value: c.value,
          issuer: c.issuer,
          status: c.status || 'unverified' as VerificationStatus,
        });
      }
    }
    credentials = mapped;
  } else {
    credentials = parseCredentialString(data.credentialString);
  }

  // Check for NPI or ORCID duplicates
  const npi = credentials.find(c => c.type === 'npi')?.value;
  const orcid = credentials.find(c => c.type === 'orcid')?.value;

  if (npi && npiIndex.has(npi)) {
    const existingId = npiIndex.get(npi)!;
    return contributorRegistry.get(existingId)!;
  }

  if (orcid && orcidIndex.has(orcid)) {
    const existingId = orcidIndex.get(orcid)!;
    return contributorRegistry.get(existingId)!;
  }

  // Create new contributor
  const contributor: Contributor = {
    id,
    slug,
    name: data.name,
    roles: data.roles,
    credentials,
    credentialString: data.credentialString,
    specialty: data.specialty,
    affiliations: data.affiliations,
    profileUrl: data.profileUrl,
    externalUrls: data.externalUrls,
    bio: data.bio,
    verificationStatus: determineOverallStatus(credentials),
    linkedEntities: [],
    registeredAt: new Date().toISOString(),
  };

  // Register
  contributorRegistry.set(id, contributor);
  slugIndex.set(slug, id);

  // Index by NPI/ORCID
  if (npi) npiIndex.set(npi, id);
  if (orcid) orcidIndex.set(orcid, id);

  return contributor;
}

/**
 * Parse a credential string like "MD, Board-Certified Psychiatrist"
 */
function parseCredentialString(credentialString?: string): VerifiableCredential[] {
  if (!credentialString) return [];

  const credentials: VerifiableCredential[] = [];
  const parts = credentialString.split(/[,;]\s*/);

  for (const part of parts) {
    const trimmed = part.trim();
    const type = inferCredentialType(trimmed);
    if (type) {
      credentials.push({
        type,
        status: 'unverified',
      });
    }
  }

  return credentials;
}

/**
 * Infer credential type from string
 */
function inferCredentialType(text: string): CredentialType | undefined {
  const normalized = text.toLowerCase();

  if (/\bmd\b/.test(normalized)) return 'md';
  if (/\bdo\b/.test(normalized)) return 'do';
  if (/\bphd\b/.test(normalized)) return 'phd';
  if (/\bpsyd\b/.test(normalized)) return 'psyd';
  if (/\blcsw\b/.test(normalized)) return 'lcsw';
  if (/\blmft\b/.test(normalized)) return 'lmft';
  if (/\brn\b/.test(normalized)) return 'rn';
  if (/\bnp\b/.test(normalized)) return 'np';
  if (/board.cert|abpn|abp\b/.test(normalized)) return 'board_cert';
  if (/npi\s*[:=]?\s*\d/.test(normalized)) return 'npi';
  if (/orcid/i.test(normalized)) return 'orcid';

  return undefined;
}

/**
 * Determine overall verification status from credentials
 */
function determineOverallStatus(credentials: VerifiableCredential[]): VerificationStatus {
  if (credentials.length === 0) return 'unverified';

  const statuses = credentials.map(c => c.status);

  if (statuses.every(s => s === 'verified')) return 'verified';
  if (statuses.some(s => s === 'failed')) return 'failed';
  if (statuses.some(s => s === 'verified')) return 'partial';
  if (statuses.some(s => s === 'pending')) return 'pending';

  return 'unverified';
}

// ============ RETRIEVAL FUNCTIONS ============

/**
 * Get a contributor by ID
 */
export function getContributor(id: string): Contributor | undefined {
  return contributorRegistry.get(id);
}

/**
 * Get a contributor by slug
 */
export function getContributorBySlug(slug: string): Contributor | undefined {
  const id = slugIndex.get(slug);
  return id ? contributorRegistry.get(id) : undefined;
}

/**
 * Get a contributor by NPI
 */
export function getContributorByNPI(npi: string): Contributor | undefined {
  const id = npiIndex.get(npi);
  return id ? contributorRegistry.get(id) : undefined;
}

/**
 * Get a contributor by ORCID
 */
export function getContributorByORCID(orcid: string): Contributor | undefined {
  const id = orcidIndex.get(orcid);
  return id ? contributorRegistry.get(id) : undefined;
}

/**
 * Get all contributors with a specific role
 */
export function getContributorsByRole(role: ContributorRole): Contributor[] {
  return Array.from(contributorRegistry.values()).filter(c =>
    c.roles.includes(role)
  );
}

/**
 * Get contributors needing attention (verification issues)
 */
export function getContributorsNeedingAttention(): Contributor[] {
  return Array.from(contributorRegistry.values()).filter(c => {
    const flags = assessContributorIntegrity(c);
    return (
      flags.missingVerifiableCredentials ||
      flags.expiredCredentials ||
      flags.genericName ||
      flags.noExternalVerification
    );
  });
}

// ============ INTEGRITY ASSESSMENT ============

/**
 * Assess a contributor's integrity for E-E-A-T compliance
 */
export function assessContributorIntegrity(contributor: Contributor): ContributorIntegrityFlags {
  const verifiableTypes: CredentialType[] = ['npi', 'orcid', 'board_cert', 'medical_license'];
  const hasVerifiableCredential = contributor.credentials.some(c =>
    verifiableTypes.includes(c.type) && c.status === 'verified'
  );

  const now = new Date();
  const hasExpired = contributor.credentials.some(c => {
    if (!c.expiresAt) return false;
    return new Date(c.expiresAt) < now;
  });

  const genericNames = [
    'medical team',
    'editorial team',
    'content team',
    'healthcare team',
    'clinical team',
    'review board',
  ];
  const isGenericName = genericNames.some(gn =>
    contributor.name.toLowerCase().includes(gn)
  );

  const hasExternalVerification = !!(
    contributor.externalUrls?.npiUrl ||
    contributor.externalUrls?.orcidUrl ||
    contributor.externalUrls?.institutionUrl
  );

  return {
    missingVerifiableCredentials: !hasVerifiableCredential,
    expiredCredentials: hasExpired,
    noLinkedEntities: contributor.linkedEntities.length === 0,
    genericName: isGenericName,
    missingSpecialty: !contributor.specialty,
    noExternalVerification: !hasExternalVerification,
  };
}

/**
 * Check if a contributor passes E-E-A-T requirements for medical content
 */
export function passesEEATRequirements(contributor: Contributor): boolean {
  const flags = assessContributorIntegrity(contributor);

  // Must have verifiable credentials and no generic name
  return (
    !flags.missingVerifiableCredentials &&
    !flags.expiredCredentials &&
    !flags.genericName
  );
}

// ============ ENTITY LINKING ============

/**
 * Link a contributor to an entity
 */
export function linkContributorToEntity(contributorId: string, entityId: string): boolean {
  const contributor = contributorRegistry.get(contributorId);
  if (!contributor) return false;

  if (!contributor.linkedEntities.includes(entityId)) {
    contributor.linkedEntities.push(entityId);
  }

  return true;
}

/**
 * Get contributors linked to an entity
 */
export function getContributorsForEntity(entityId: string): Contributor[] {
  return Array.from(contributorRegistry.values()).filter(c =>
    c.linkedEntities.includes(entityId)
  );
}

// ============ VERIFICATION FUNCTIONS ============

/**
 * Mark a credential as verified
 */
export function verifyCredential(
  contributorId: string,
  credentialType: CredentialType,
  verificationSource: string
): boolean {
  const contributor = contributorRegistry.get(contributorId);
  if (!contributor) return false;

  const credential = contributor.credentials.find(c => c.type === credentialType);
  if (!credential) return false;

  credential.status = 'verified';
  credential.verifiedAt = new Date().toISOString();
  credential.verificationSource = verificationSource;

  // Update overall status
  contributor.verificationStatus = determineOverallStatus(contributor.credentials);
  contributor.lastVerifiedAt = new Date().toISOString();

  return true;
}

/**
 * Add an NPI to a contributor (for verification)
 */
export function addNPIToContributor(contributorId: string, npi: string): boolean {
  const contributor = contributorRegistry.get(contributorId);
  if (!contributor) return false;

  // Check for duplicate NPI
  if (npiIndex.has(npi)) return false;

  contributor.credentials.push({
    type: 'npi',
    value: npi,
    status: 'pending',
  });

  npiIndex.set(npi, contributorId);

  return true;
}

/**
 * Add an ORCID to a contributor (for verification)
 */
export function addORCIDToContributor(contributorId: string, orcid: string): boolean {
  const contributor = contributorRegistry.get(contributorId);
  if (!contributor) return false;

  // Check for duplicate ORCID
  if (orcidIndex.has(orcid)) return false;

  contributor.credentials.push({
    type: 'orcid',
    value: orcid,
    status: 'pending',
  });

  orcidIndex.set(orcid, contributorId);

  return true;
}

// ============ STATISTICS ============

/**
 * Get registry statistics
 */
export function getRegistryStats(): ContributorRegistryStats {
  const contributors = Array.from(contributorRegistry.values());

  const byRole: Record<ContributorRole, number> = {
    author: 0,
    medical_reviewer: 0,
    clinical_advisor: 0,
    editor: 0,
    fact_checker: 0,
  };

  const byVerificationStatus: Record<VerificationStatus, number> = {
    verified: 0,
    partial: 0,
    pending: 0,
    unverified: 0,
    failed: 0,
  };

  let withNPI = 0;
  let withORCID = 0;
  let needingAttention = 0;

  for (const c of contributors) {
    // Count by role
    for (const role of c.roles) {
      byRole[role]++;
    }

    // Count by status
    byVerificationStatus[c.verificationStatus]++;

    // Count NPI/ORCID
    if (c.credentials.some(cred => cred.type === 'npi')) withNPI++;
    if (c.credentials.some(cred => cred.type === 'orcid')) withORCID++;

    // Count needing attention
    const flags = assessContributorIntegrity(c);
    if (flags.missingVerifiableCredentials || flags.genericName) {
      needingAttention++;
    }
  }

  return {
    totalContributors: contributors.length,
    byRole,
    byVerificationStatus,
    withNPI,
    withORCID,
    needingAttention,
  };
}

// ============ UTILITY ============

/**
 * Clear the registry (for testing)
 */
export function clearContributorRegistry(): void {
  contributorRegistry.clear();
  slugIndex.clear();
  npiIndex.clear();
  orcidIndex.clear();
}

// Types are exported inline above
