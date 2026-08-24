/**
 * Practice Fingerprint Schema
 *
 * Captures the essential characteristics of a mental health practice
 * that affect product fit, relevance, and recommendations.
 */

import { z } from "zod";

// ============================================================================
// PRACTICE TYPE
// ============================================================================

export const PracticeTypeZ = z.enum([
  "solo-clinician",
  "therapy-group",
  "psychiatry",
  "therapy-plus-psychiatry",
  "psychological-testing",
  "community-behavioral-health",
  "sud-addiction",
  "iop-php",
  "telehealth-first",
  "other",
]);

export type PracticeType = z.infer<typeof PracticeTypeZ>;

export const PRACTICE_TYPE_LABELS: Record<PracticeType, string> = {
  "solo-clinician": "Solo clinician",
  "therapy-group": "Therapy group practice",
  "psychiatry": "Psychiatry practice",
  "therapy-plus-psychiatry": "Therapy + psychiatry",
  "psychological-testing": "Psychological testing",
  "community-behavioral-health": "Community behavioral health",
  "sud-addiction": "SUD / addiction",
  "iop-php": "IOP / PHP",
  "telehealth-first": "Telehealth-first",
  "other": "Other",
};

// ============================================================================
// PRACTICE SIZE
// ============================================================================

export const PracticeSizeBucketZ = z.enum([
  "solo",
  "2-5",
  "6-10",
  "11-25",
  "26-50",
  "51-100",
  "101-250",
  "250+",
]);

export type PracticeSizeBucket = z.infer<typeof PracticeSizeBucketZ>;

export const PRACTICE_SIZE_LABELS: Record<PracticeSizeBucket, string> = {
  "solo": "Solo (1 provider)",
  "2-5": "2-5 providers",
  "6-10": "6-10 providers",
  "11-25": "11-25 providers",
  "26-50": "26-50 providers",
  "51-100": "51-100 providers",
  "101-250": "101-250 providers",
  "250+": "250+ providers",
};

/**
 * Get the midpoint of a size bucket for estimation purposes.
 * Returns undefined for 250+ as it requires explicit count.
 */
export function getSizeBucketMidpoint(bucket: PracticeSizeBucket): number | undefined {
  const midpoints: Record<PracticeSizeBucket, number | undefined> = {
    "solo": 1,
    "2-5": 3,
    "6-10": 8,
    "11-25": 18,
    "26-50": 38,
    "51-100": 75,
    "101-250": 175,
    "250+": undefined,
  };
  return midpoints[bucket];
}

// ============================================================================
// CLINICAL ROLES
// ============================================================================

export const ClinicalRoleZ = z.enum([
  "therapist",
  "psychologist",
  "psychiatrist",
  "psychiatric-np",
  "social-worker",
  "counselor",
  "care-coordinator",
  "administrator",
  "biller",
]);

export type ClinicalRole = z.infer<typeof ClinicalRoleZ>;

export const CLINICAL_ROLE_LABELS: Record<ClinicalRole, string> = {
  "therapist": "Therapists",
  "psychologist": "Psychologists",
  "psychiatrist": "Psychiatrists",
  "psychiatric-np": "Psychiatric NPs",
  "social-worker": "Social workers",
  "counselor": "Counselors",
  "care-coordinator": "Care coordinators",
  "administrator": "Administrators",
  "biller": "Billers",
};

// ============================================================================
// POPULATION
// ============================================================================

export const PopulationZ = z.enum([
  "adults",
  "children",
  "adolescents",
  "families",
  "couples",
  "mixed",
]);

export type Population = z.infer<typeof PopulationZ>;

export const POPULATION_LABELS: Record<Population, string> = {
  "adults": "Adults",
  "children": "Children",
  "adolescents": "Adolescents",
  "families": "Families",
  "couples": "Couples",
  "mixed": "Mixed populations",
};

// ============================================================================
// PAYER MODEL
// ============================================================================

export const PayerTypeZ = z.enum([
  "cash",
  "commercial-insurance",
  "medicare",
  "medicaid",
  "eap",
  "mixed",
]);

export type PayerType = z.infer<typeof PayerTypeZ>;

export const PAYER_TYPE_LABELS: Record<PayerType, string> = {
  "cash": "Cash / private pay",
  "commercial-insurance": "Commercial insurance",
  "medicare": "Medicare",
  "medicaid": "Medicaid",
  "eap": "EAP",
  "mixed": "Mixed payers",
};

export const PayerMixZ = z.object({
  cash: z.number().min(0).max(100).optional(),
  commercial: z.number().min(0).max(100).optional(),
  medicare: z.number().min(0).max(100).optional(),
  medicaid: z.number().min(0).max(100).optional(),
  eap: z.number().min(0).max(100).optional(),
});

export type PayerMix = z.infer<typeof PayerMixZ>;

// ============================================================================
// PRESCRIBING
// ============================================================================

export const PrescribingLevelZ = z.enum([
  "none",
  "prescribing",
  "controlled-substances-epcs",
]);

export type PrescribingLevel = z.infer<typeof PrescribingLevelZ>;

export const PRESCRIBING_LEVEL_LABELS: Record<PrescribingLevel, string> = {
  "none": "No prescribing",
  "prescribing": "Prescribing (non-controlled)",
  "controlled-substances-epcs": "Controlled substances / EPCS",
};

// ============================================================================
// DELIVERY MODEL
// ============================================================================

export const DeliveryModelZ = z.enum([
  "in-person",
  "hybrid",
  "telehealth",
]);

export type DeliveryModel = z.infer<typeof DeliveryModelZ>;

export const DELIVERY_MODEL_LABELS: Record<DeliveryModel, string> = {
  "in-person": "In-person only",
  "hybrid": "Hybrid (in-person + telehealth)",
  "telehealth": "Telehealth only",
};

// ============================================================================
// PRIORITIES
// ============================================================================

export const PriorityZ = z.enum([
  "low-cost",
  "ease-of-use",
  "clinical-workflow",
  "billing-collections",
  "integrations",
  "automation",
  "ai",
  "patient-experience",
  "reporting",
  "scalability",
  "implementation-simplicity",
]);

export type Priority = z.infer<typeof PriorityZ>;

export const PRIORITY_LABELS: Record<Priority, string> = {
  "low-cost": "Low cost",
  "ease-of-use": "Ease of use",
  "clinical-workflow": "Clinical workflow",
  "billing-collections": "Billing & collections",
  "integrations": "Integrations",
  "automation": "Automation",
  "ai": "AI capabilities",
  "patient-experience": "Patient experience",
  "reporting": "Reporting",
  "scalability": "Scalability",
  "implementation-simplicity": "Implementation simplicity",
};

// ============================================================================
// US STATES
// ============================================================================

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC",
] as const;

export const USStateZ = z.enum(US_STATES);
export type USState = z.infer<typeof USStateZ>;

// ============================================================================
// PRACTICE FINGERPRINT SCHEMA
// ============================================================================

export const PracticeFingerprintZ = z.object({
  // Required high-signal fields (for Build for me mode)
  practiceType: PracticeTypeZ.optional(),
  sizeBucket: PracticeSizeBucketZ.optional(),

  // Optional exact count (used for pricing when available)
  exactProviderCount: z.number().int().positive().optional(),
  exactPrescriberCount: z.number().int().nonnegative().optional(),
  exactLocationCount: z.number().int().positive().optional(),

  // Clinical profile
  clinicalRoles: z.array(ClinicalRoleZ).default([]),
  populations: z.array(PopulationZ).default([]),

  // Payer model
  primaryPayerType: PayerTypeZ.optional(),
  payerMix: PayerMixZ.optional(),

  // Geography
  statesServed: z.array(USStateZ).default([]),
  isMultiState: z.boolean().optional(),

  // Prescribing
  prescribingLevel: PrescribingLevelZ.optional(),

  // Delivery
  deliveryModel: DeliveryModelZ.optional(),

  // Priorities (ordered by importance)
  priorities: z.array(PriorityZ).default([]),

  // Budget (optional)
  monthlyBudget: z.number().positive().optional(),

  // Volume metrics (requested only when needed for pricing)
  monthlyEncounterVolume: z.number().int().nonnegative().optional(),
  monthlyTransactionVolume: z.number().int().nonnegative().optional(),
  monthlyCollections: z.number().nonnegative().optional(),
});

export type PracticeFingerprint = z.infer<typeof PracticeFingerprintZ>;

// ============================================================================
// FINGERPRINT HELPERS
// ============================================================================

/**
 * Check if fingerprint has minimum required fields for Build for me mode
 */
export function hasBuildForMeRequirements(fp: PracticeFingerprint): boolean {
  return !!(
    fp.practiceType &&
    fp.sizeBucket &&
    fp.primaryPayerType &&
    fp.prescribingLevel &&
    fp.deliveryModel &&
    fp.priorities.length >= 3
  );
}

/**
 * Check if fingerprint has minimum required fields for Audit mode
 */
export function hasAuditRequirements(fp: PracticeFingerprint): boolean {
  return !!(
    fp.practiceType &&
    fp.sizeBucket &&
    fp.primaryPayerType &&
    fp.prescribingLevel
  );
}

/**
 * Check if practice has prescribers
 */
export function hasPrescribers(fp: PracticeFingerprint): boolean {
  return (
    fp.prescribingLevel === "prescribing" ||
    fp.prescribingLevel === "controlled-substances-epcs" ||
    fp.clinicalRoles.includes("psychiatrist") ||
    fp.clinicalRoles.includes("psychiatric-np")
  );
}

/**
 * Check if practice needs EPCS
 */
export function needsEPCS(fp: PracticeFingerprint): boolean {
  return fp.prescribingLevel === "controlled-substances-epcs";
}

/**
 * Check if practice is insurance-heavy
 */
export function isInsuranceHeavy(fp: PracticeFingerprint): boolean {
  if (fp.payerMix) {
    const insuranceTotal =
      (fp.payerMix.commercial ?? 0) +
      (fp.payerMix.medicare ?? 0) +
      (fp.payerMix.medicaid ?? 0);
    return insuranceTotal >= 50;
  }
  return (
    fp.primaryPayerType === "commercial-insurance" ||
    fp.primaryPayerType === "medicare" ||
    fp.primaryPayerType === "medicaid" ||
    fp.primaryPayerType === "mixed"
  );
}

/**
 * Check if practice is primarily cash-pay
 */
export function isCashPayPrimary(fp: PracticeFingerprint): boolean {
  if (fp.payerMix) {
    return (fp.payerMix.cash ?? 0) >= 50;
  }
  return fp.primaryPayerType === "cash";
}

/**
 * Get effective provider count for calculations
 * Uses exact count if available, otherwise bucket midpoint
 */
export function getEffectiveProviderCount(fp: PracticeFingerprint): number | undefined {
  if (fp.exactProviderCount !== undefined) {
    return fp.exactProviderCount;
  }
  if (fp.sizeBucket) {
    return getSizeBucketMidpoint(fp.sizeBucket);
  }
  return undefined;
}

/**
 * Generate a human-readable practice summary
 */
export function getPracticeSummary(fp: PracticeFingerprint): string {
  const parts: string[] = [];

  if (fp.sizeBucket) {
    parts.push(PRACTICE_SIZE_LABELS[fp.sizeBucket]);
  }

  if (fp.practiceType) {
    parts.push(PRACTICE_TYPE_LABELS[fp.practiceType].toLowerCase());
  }

  if (fp.statesServed.length === 1) {
    parts.push(`in ${fp.statesServed[0]}`);
  } else if (fp.statesServed.length > 1) {
    parts.push(`across ${fp.statesServed.length} states`);
  }

  if (fp.primaryPayerType) {
    parts.push(`(${PAYER_TYPE_LABELS[fp.primaryPayerType].toLowerCase()})`);
  }

  return parts.join(" ");
}

/**
 * Create an empty fingerprint
 */
export function createEmptyFingerprint(): PracticeFingerprint {
  return {
    clinicalRoles: [],
    populations: [],
    statesServed: [],
    priorities: [],
  };
}
