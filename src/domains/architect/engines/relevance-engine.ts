/**
 * Relevance Engine
 *
 * Determines the relevance level of each capability based on the practice fingerprint.
 * All rules are deterministic and unit-testable.
 */

import {
  type PracticeFingerprint,
  type CapabilityId,
  type RelevanceLevel,
  hasPrescribers,
  needsEPCS,
  isInsuranceHeavy,
  isCashPayPrimary,
  CAPABILITY_REGISTRY,
  getAllCapabilitiesOrdered,
} from "../schemas";

// ============================================================================
// RELEVANCE RULES
// ============================================================================

/**
 * A relevance rule maps fingerprint conditions to capability relevance.
 * Rules are evaluated in order; first match wins.
 */
type RelevanceRule = {
  capabilityId: CapabilityId;
  condition: (fp: PracticeFingerprint) => boolean;
  level: RelevanceLevel;
  reason: string;
};

/**
 * All relevance rules, organized by capability.
 * Multiple rules per capability are allowed - first matching rule wins.
 */
const RELEVANCE_RULES: RelevanceRule[] = [
  // ============================================================================
  // GROW STAGE
  // ============================================================================
  {
    capabilityId: "patient-acquisition",
    condition: (fp) => fp.practiceType === "solo-clinician" || fp.sizeBucket === "solo",
    level: "useful",
    reason: "Solo practices benefit from patient acquisition tools",
  },
  {
    capabilityId: "patient-acquisition",
    condition: () => true,
    level: "optional",
    reason: "Patient acquisition is useful but not essential for most practices",
  },
  {
    capabilityId: "referral-management",
    condition: (fp) =>
      fp.practiceType === "community-behavioral-health" ||
      fp.practiceType === "therapy-plus-psychiatry",
    level: "strongly-recommended",
    reason: "Multi-specialty and community practices rely heavily on referrals",
  },
  {
    capabilityId: "referral-management",
    condition: () => true,
    level: "useful",
    reason: "Referral management helps track incoming patients",
  },
  {
    capabilityId: "crm-lead-management",
    condition: (fp) => {
      const size = fp.sizeBucket;
      return size === "26-50" || size === "51-100" || size === "101-250" || size === "250+";
    },
    level: "useful",
    reason: "Larger practices benefit from systematic lead management",
  },
  {
    capabilityId: "crm-lead-management",
    condition: () => true,
    level: "optional",
    reason: "CRM is optional for smaller practices",
  },
  {
    capabilityId: "reputation-reviews",
    condition: (fp) => fp.practiceType === "solo-clinician" && isCashPayPrimary(fp),
    level: "strongly-recommended",
    reason: "Cash-pay solo practices depend heavily on online reputation",
  },
  {
    capabilityId: "reputation-reviews",
    condition: () => true,
    level: "optional",
    reason: "Reputation management is nice to have",
  },

  // ============================================================================
  // ACCESS STAGE
  // ============================================================================
  {
    capabilityId: "intake",
    condition: () => true,
    level: "required",
    reason: "Every practice needs patient intake",
  },
  {
    capabilityId: "screening-triage",
    condition: (fp) =>
      fp.practiceType === "community-behavioral-health" ||
      fp.practiceType === "iop-php" ||
      fp.practiceType === "sud-addiction",
    level: "required",
    reason: "Screening and triage is essential for higher-acuity settings",
  },
  {
    capabilityId: "screening-triage",
    condition: (fp) => fp.practiceType === "therapy-plus-psychiatry",
    level: "strongly-recommended",
    reason: "Mixed practices benefit from systematic triage",
  },
  {
    capabilityId: "screening-triage",
    condition: () => true,
    level: "useful",
    reason: "Screening helps match patients to appropriate care",
  },
  {
    capabilityId: "eligibility-verification",
    condition: (fp) => isInsuranceHeavy(fp),
    level: "required",
    reason: "Insurance-heavy practices need real-time eligibility verification",
  },
  {
    capabilityId: "eligibility-verification",
    condition: (fp) => isCashPayPrimary(fp),
    level: "optional",
    reason: "Cash-pay practices have limited need for eligibility verification",
  },
  {
    capabilityId: "eligibility-verification",
    condition: () => true,
    level: "useful",
    reason: "Eligibility verification reduces claim denials",
  },
  {
    capabilityId: "provider-matching",
    condition: (fp) => {
      const size = fp.sizeBucket;
      return size === "11-25" || size === "26-50" || size === "51-100" || size === "101-250" || size === "250+";
    },
    level: "useful",
    reason: "Larger practices benefit from systematic provider matching",
  },
  {
    capabilityId: "provider-matching",
    condition: () => true,
    level: "optional",
    reason: "Provider matching is optional for smaller practices",
  },
  {
    capabilityId: "scheduling",
    condition: () => true,
    level: "required",
    reason: "Every practice needs appointment scheduling",
  },
  {
    capabilityId: "waitlist-management",
    condition: (fp) =>
      fp.practiceType === "community-behavioral-health" ||
      fp.practiceType === "iop-php",
    level: "strongly-recommended",
    reason: "High-demand settings need waitlist management",
  },
  {
    capabilityId: "waitlist-management",
    condition: () => true,
    level: "optional",
    reason: "Waitlist management is optional for most practices",
  },

  // ============================================================================
  // ENGAGE STAGE
  // ============================================================================
  {
    capabilityId: "patient-portal",
    condition: () => true,
    level: "strongly-recommended",
    reason: "Patient portals improve engagement and reduce administrative burden",
  },
  {
    capabilityId: "secure-messaging",
    condition: () => true,
    level: "strongly-recommended",
    reason: "Secure messaging is expected by patients",
  },
  {
    capabilityId: "phone-contact-center",
    condition: (fp) => {
      const size = fp.sizeBucket;
      return size === "26-50" || size === "51-100" || size === "101-250" || size === "250+";
    },
    level: "useful",
    reason: "Larger practices may need dedicated phone systems",
  },
  {
    capabilityId: "phone-contact-center",
    condition: () => true,
    level: "optional",
    reason: "Phone systems are optional for smaller practices",
  },
  {
    capabilityId: "appointment-reminders",
    condition: () => true,
    level: "strongly-recommended",
    reason: "Automated reminders reduce no-shows",
  },
  {
    capabilityId: "forms-e-signature",
    condition: () => true,
    level: "strongly-recommended",
    reason: "Digital forms and e-signature streamline paperwork",
  },

  // ============================================================================
  // CARE STAGE
  // ============================================================================
  {
    capabilityId: "ehr-clinical-record",
    condition: () => true,
    level: "required",
    reason: "Every practice needs an electronic health record",
  },
  {
    capabilityId: "clinical-documentation",
    condition: () => true,
    level: "required",
    reason: "Clinical documentation is essential for patient care",
  },
  {
    capabilityId: "ai-documentation-scribe",
    condition: (fp) => fp.priorities.includes("ai"),
    level: "strongly-recommended",
    reason: "AI documentation aligns with your AI priority",
  },
  {
    capabilityId: "ai-documentation-scribe",
    condition: (fp) =>
      fp.priorities.includes("automation") || fp.priorities.includes("clinical-workflow"),
    level: "useful",
    reason: "AI scribes can save significant documentation time",
  },
  {
    capabilityId: "ai-documentation-scribe",
    condition: () => true,
    level: "optional",
    reason: "AI documentation is a growing but optional capability",
  },
  {
    capabilityId: "treatment-planning",
    condition: () => true,
    level: "strongly-recommended",
    reason: "Structured treatment planning improves care quality",
  },
  {
    capabilityId: "telehealth",
    condition: (fp) => fp.deliveryModel === "telehealth",
    level: "required",
    reason: "Telehealth-only practices require video visit capability",
  },
  {
    capabilityId: "telehealth",
    condition: (fp) => fp.deliveryModel === "hybrid",
    level: "required",
    reason: "Hybrid practices need telehealth capability",
  },
  {
    capabilityId: "telehealth",
    condition: () => true,
    level: "strongly-recommended",
    reason: "Telehealth capability is increasingly expected",
  },
  {
    capabilityId: "prescribing-erx",
    condition: (fp) => hasPrescribers(fp),
    level: "required",
    reason: "Prescribers need electronic prescribing capability",
  },
  {
    capabilityId: "prescribing-erx",
    condition: () => true,
    level: "irrelevant",
    reason: "Non-prescribing practices don't need e-prescribing",
  },
  {
    capabilityId: "epcs",
    condition: (fp) => needsEPCS(fp),
    level: "required",
    reason: "Controlled substance prescribing requires EPCS",
  },
  {
    capabilityId: "epcs",
    condition: (fp) => hasPrescribers(fp),
    level: "useful",
    reason: "EPCS may be needed even if not prescribing controlled substances currently",
  },
  {
    capabilityId: "epcs",
    condition: () => true,
    level: "irrelevant",
    reason: "Non-prescribing practices don't need EPCS",
  },
  {
    capabilityId: "assessments-mbc",
    condition: (fp) => fp.priorities.includes("clinical-workflow"),
    level: "strongly-recommended",
    reason: "Measurement-based care aligns with clinical workflow priority",
  },
  {
    capabilityId: "assessments-mbc",
    condition: () => true,
    level: "useful",
    reason: "Standardized assessments support evidence-based care",
  },
  {
    capabilityId: "care-coordination",
    condition: (fp) =>
      fp.practiceType === "therapy-plus-psychiatry" ||
      fp.practiceType === "community-behavioral-health" ||
      fp.practiceType === "iop-php",
    level: "strongly-recommended",
    reason: "Multi-disciplinary settings require care coordination",
  },
  {
    capabilityId: "care-coordination",
    condition: () => true,
    level: "useful",
    reason: "Care coordination improves patient outcomes",
  },
  {
    capabilityId: "referrals-transitions",
    condition: (fp) =>
      fp.practiceType === "community-behavioral-health" ||
      fp.practiceType === "iop-php" ||
      fp.practiceType === "sud-addiction",
    level: "strongly-recommended",
    reason: "Higher-acuity settings need formal transition management",
  },
  {
    capabilityId: "referrals-transitions",
    condition: () => true,
    level: "useful",
    reason: "Referral management supports care continuity",
  },

  // ============================================================================
  // REVENUE STAGE
  // ============================================================================
  {
    capabilityId: "coding",
    condition: (fp) => isInsuranceHeavy(fp),
    level: "strongly-recommended",
    reason: "Insurance billing requires accurate coding",
  },
  {
    capabilityId: "coding",
    condition: () => true,
    level: "useful",
    reason: "Coding assistance helps with accurate billing",
  },
  {
    capabilityId: "claims-submission",
    condition: (fp) => isInsuranceHeavy(fp),
    level: "required",
    reason: "Insurance practices must submit claims electronically",
  },
  {
    capabilityId: "claims-submission",
    condition: (fp) => isCashPayPrimary(fp),
    level: "optional",
    reason: "Cash-pay practices rarely need claims submission",
  },
  {
    capabilityId: "claims-submission",
    condition: () => true,
    level: "useful",
    reason: "Electronic claims submission speeds up reimbursement",
  },
  {
    capabilityId: "clearinghouse",
    condition: (fp) => isInsuranceHeavy(fp),
    level: "required",
    reason: "Insurance practices need clearinghouse connectivity",
  },
  {
    capabilityId: "clearinghouse",
    condition: (fp) => isCashPayPrimary(fp),
    level: "irrelevant",
    reason: "Cash-pay practices don't need a clearinghouse",
  },
  {
    capabilityId: "clearinghouse",
    condition: () => true,
    level: "useful",
    reason: "Clearinghouse access simplifies claims processing",
  },
  {
    capabilityId: "billing-rcm",
    condition: (fp) => isInsuranceHeavy(fp),
    level: "required",
    reason: "Insurance-heavy practices need comprehensive billing/RCM",
  },
  {
    capabilityId: "billing-rcm",
    condition: (fp) => isCashPayPrimary(fp),
    level: "useful",
    reason: "Even cash-pay practices need basic billing capabilities",
  },
  {
    capabilityId: "billing-rcm",
    condition: () => true,
    level: "strongly-recommended",
    reason: "Billing and revenue cycle management is important for most practices",
  },
  {
    capabilityId: "denial-management",
    condition: (fp) => isInsuranceHeavy(fp),
    level: "required",
    reason: "Insurance practices need systematic denial management",
  },
  {
    capabilityId: "denial-management",
    condition: (fp) => isCashPayPrimary(fp),
    level: "irrelevant",
    reason: "Cash-pay practices don't deal with claim denials",
  },
  {
    capabilityId: "denial-management",
    condition: () => true,
    level: "useful",
    reason: "Denial management helps recover revenue",
  },
  {
    capabilityId: "patient-payments",
    condition: () => true,
    level: "strongly-recommended",
    reason: "Collecting patient payments is essential for all practices",
  },
  {
    capabilityId: "patient-financing",
    condition: (fp) => isCashPayPrimary(fp),
    level: "useful",
    reason: "Cash-pay practices may benefit from patient financing options",
  },
  {
    capabilityId: "patient-financing",
    condition: () => true,
    level: "optional",
    reason: "Patient financing is a nice-to-have for most practices",
  },
  {
    capabilityId: "credentialing-payer-enrollment",
    condition: (fp) => isInsuranceHeavy(fp),
    level: "required",
    reason: "Insurance practices must maintain credentialing",
  },
  {
    capabilityId: "credentialing-payer-enrollment",
    condition: (fp) => isCashPayPrimary(fp),
    level: "irrelevant",
    reason: "Cash-pay practices don't need payer credentialing",
  },
  {
    capabilityId: "credentialing-payer-enrollment",
    condition: () => true,
    level: "useful",
    reason: "Credentialing management reduces administrative burden",
  },

  // ============================================================================
  // OPERATE STAGE
  // ============================================================================
  {
    capabilityId: "analytics-bi",
    condition: (fp) => fp.priorities.includes("reporting"),
    level: "strongly-recommended",
    reason: "Analytics aligns with your reporting priority",
  },
  {
    capabilityId: "analytics-bi",
    condition: (fp) => {
      const size = fp.sizeBucket;
      return size === "26-50" || size === "51-100" || size === "101-250" || size === "250+";
    },
    level: "strongly-recommended",
    reason: "Larger practices need business intelligence",
  },
  {
    capabilityId: "analytics-bi",
    condition: () => true,
    level: "useful",
    reason: "Analytics help understand practice performance",
  },
  {
    capabilityId: "workforce-management",
    condition: (fp) => {
      const size = fp.sizeBucket;
      return size === "26-50" || size === "51-100" || size === "101-250" || size === "250+";
    },
    level: "useful",
    reason: "Larger practices benefit from workforce management",
  },
  {
    capabilityId: "workforce-management",
    condition: () => true,
    level: "optional",
    reason: "Workforce management is optional for smaller practices",
  },
  {
    capabilityId: "payroll-compensation",
    condition: (fp) => fp.sizeBucket !== "solo",
    level: "useful",
    reason: "Multi-provider practices need payroll management",
  },
  {
    capabilityId: "payroll-compensation",
    condition: () => true,
    level: "optional",
    reason: "Solo practices may use personal accounting for payroll",
  },
  {
    capabilityId: "accounting",
    condition: () => true,
    level: "useful",
    reason: "Financial accounting is important for all practices",
  },
  {
    capabilityId: "compliance-security",
    condition: () => true,
    level: "strongly-recommended",
    reason: "HIPAA compliance and security are essential",
  },
  {
    capabilityId: "clinical-supervision",
    condition: (fp) =>
      fp.clinicalRoles.includes("therapist") ||
      fp.clinicalRoles.includes("counselor") ||
      fp.clinicalRoles.includes("social-worker"),
    level: "useful",
    reason: "Practices with non-licensed clinicians need supervision tools",
  },
  {
    capabilityId: "clinical-supervision",
    condition: () => true,
    level: "optional",
    reason: "Clinical supervision tools are optional for most practices",
  },
  {
    capabilityId: "quality-assurance",
    condition: (fp) =>
      fp.practiceType === "community-behavioral-health" ||
      fp.practiceType === "iop-php",
    level: "strongly-recommended",
    reason: "Regulated settings need quality assurance",
  },
  {
    capabilityId: "quality-assurance",
    condition: (fp) => {
      const size = fp.sizeBucket;
      return size === "51-100" || size === "101-250" || size === "250+";
    },
    level: "useful",
    reason: "Larger practices benefit from QA processes",
  },
  {
    capabilityId: "quality-assurance",
    condition: () => true,
    level: "optional",
    reason: "Quality assurance is optional for smaller practices",
  },
];

// ============================================================================
// ENGINE
// ============================================================================

export type RelevanceResult = {
  capabilityId: CapabilityId;
  level: RelevanceLevel;
  reason: string;
  isDefault: boolean;
};

/**
 * Get the relevance level for a single capability based on fingerprint
 */
export function getCapabilityRelevance(
  capabilityId: CapabilityId,
  fingerprint: PracticeFingerprint
): RelevanceResult {
  // Find matching rule
  const rules = RELEVANCE_RULES.filter((r) => r.capabilityId === capabilityId);

  for (const rule of rules) {
    if (rule.condition(fingerprint)) {
      return {
        capabilityId,
        level: rule.level,
        reason: rule.reason,
        isDefault: false,
      };
    }
  }

  // Default if no rule matches
  return {
    capabilityId,
    level: "useful",
    reason: "Default relevance",
    isDefault: true,
  };
}

/**
 * Get relevance levels for all capabilities
 */
export function getAllCapabilityRelevance(
  fingerprint: PracticeFingerprint
): Map<CapabilityId, RelevanceResult> {
  const result = new Map<CapabilityId, RelevanceResult>();
  const capabilities = getAllCapabilitiesOrdered();

  for (const cap of capabilities) {
    result.set(cap.id, getCapabilityRelevance(cap.id, fingerprint));
  }

  return result;
}

/**
 * Get capabilities at a specific relevance level
 */
export function getCapabilitiesByRelevance(
  fingerprint: PracticeFingerprint,
  level: RelevanceLevel
): CapabilityId[] {
  const all = getAllCapabilityRelevance(fingerprint);
  const result: CapabilityId[] = [];

  for (const [capId, relevance] of all) {
    if (relevance.level === level) {
      result.push(capId);
    }
  }

  return result;
}

/**
 * Get important capabilities (required + strongly recommended)
 */
export function getImportantCapabilities(
  fingerprint: PracticeFingerprint
): CapabilityId[] {
  const all = getAllCapabilityRelevance(fingerprint);
  const result: CapabilityId[] = [];

  for (const [capId, relevance] of all) {
    if (relevance.level === "required" || relevance.level === "strongly-recommended") {
      result.push(capId);
    }
  }

  return result;
}

/**
 * Count capabilities by relevance level
 */
export function countByRelevance(
  fingerprint: PracticeFingerprint
): Record<RelevanceLevel, number> {
  const all = getAllCapabilityRelevance(fingerprint);
  const counts: Record<RelevanceLevel, number> = {
    required: 0,
    "strongly-recommended": 0,
    useful: 0,
    optional: 0,
    irrelevant: 0,
  };

  for (const [, relevance] of all) {
    counts[relevance.level]++;
  }

  return counts;
}
