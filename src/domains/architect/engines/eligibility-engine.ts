/**
 * Eligibility Engine
 *
 * Single source of truth for the hard exclusion policies defined in
 * `docs/active/contracts/HARD_ELIGIBILITY_POLICIES.md`.
 *
 * Hard exclusions remove a product from consideration entirely. They are not
 * soft preferences that shift ranking. Both the stack recommendation engine and
 * the capability-scoped recommendation service evaluate eligibility here so a
 * product can never be eligible on one surface and excluded on another.
 *
 * Invariant: never silently treat unknown evidence as meeting a hard
 * requirement. Unknown evidence produces an `uncertainty`, not an exclusion.
 */

import {
  type PracticeFingerprint,
  type ProductArchitectureMetadata,
  isInsuranceHeavy,
} from "../schemas";

// ============================================================================
// TYPES
// ============================================================================

/**
 * The seven hard eligibility policies. The identifier is stable and safe to
 * persist in saved projects and analytics.
 */
export type HardExclusionPolicy =
  | "practice-type"
  | "state"
  | "clinical-role"
  | "size-bucket"
  | "delivery-model"
  | "epcs"
  | "baa-hipaa";

export const HARD_EXCLUSION_POLICIES: readonly HardExclusionPolicy[] = [
  "practice-type",
  "state",
  "clinical-role",
  "size-bucket",
  "delivery-model",
  "epcs",
  "baa-hipaa",
] as const;

export interface EligibilityFinding {
  policy: HardExclusionPolicy;
  /** User-facing explanation. Plain language, no vendor blame. */
  reason: string;
  /**
   * Short title for prominent display, where the finding deserves more than a
   * clause inside a sentence. Set for findings whose wording is prescribed, so
   * the interface renders it verbatim instead of reformatting `reason`.
   */
  headline?: string;
  /** The full explanation shown beneath `headline`. */
  detail?: string;
}

/**
 * Wording for an unverified EPCS claim.
 *
 * Kept here, next to the rule that produces it, so every surface shows the
 * same sentence. It states what the vendor asserts and precisely what has not
 * been checked, without implying either that the capability is absent or that
 * the clinician is authorised to prescribe.
 */
export const EPCS_UNVERIFIED_HEADLINE = "EPCS support requires verification";
export const EPCS_UNVERIFIED_DETAIL =
  "The vendor advertises this capability, but HeyPsych has not confirmed the " +
  "applicable product edition, prescribing conditions, and supporting evidence.";

export interface EligibilityResult {
  /** False when at least one hard exclusion applies. */
  eligible: boolean;
  /** Policies that excluded this product, in evaluation order. */
  exclusions: EligibilityFinding[];
  /**
   * Policies that could not be decided because evidence is missing. The product
   * stays eligible, but callers must surface this as "needs verification".
   */
  uncertainties: EligibilityFinding[];
}

// ============================================================================
// POLICY EVALUATION
// ============================================================================

/**
 * Evaluate every hard eligibility policy against a product.
 *
 * Evaluation order matches the policy document so the first exclusion reported
 * is stable across runs.
 */
export function evaluateEligibility(
  product: ProductArchitectureMetadata,
  fingerprint: PracticeFingerprint
): EligibilityResult {
  const exclusions: EligibilityFinding[] = [];
  const uncertainties: EligibilityFinding[] = [];

  const evidence = product.fitEvidence;

  // --- 1. Practice type -----------------------------------------------------
  if (
    evidence?.practiceTypesExcluded &&
    fingerprint.practiceType &&
    evidence.practiceTypesExcluded.includes(fingerprint.practiceType)
  ) {
    exclusions.push({
      policy: "practice-type",
      reason: `Not compatible with ${fingerprint.practiceType} practices`,
    });
  }

  // --- 2. State -------------------------------------------------------------
  if (
    evidence?.statesExcluded &&
    fingerprint.statesServed &&
    fingerprint.statesServed.some((s) => evidence.statesExcluded?.includes(s))
  ) {
    exclusions.push({
      policy: "state",
      reason: "Not available in one or more of your states",
    });
  }

  // --- 3. Clinical role -----------------------------------------------------
  if (
    evidence?.clinicalRolesExcluded &&
    evidence.clinicalRolesExcluded.length > 0 &&
    fingerprint.clinicalRoles &&
    fingerprint.clinicalRoles.length > 0
  ) {
    const excludedRoles = fingerprint.clinicalRoles.filter((role) =>
      evidence.clinicalRolesExcluded?.includes(role)
    );
    if (excludedRoles.length > 0) {
      exclusions.push({
        policy: "clinical-role",
        reason: `Not suitable for: ${excludedRoles.join(", ")}`,
      });
    }
  }

  // --- 4. Size bucket -------------------------------------------------------
  if (
    evidence?.sizeBucketsExcluded &&
    evidence.sizeBucketsExcluded.length > 0 &&
    fingerprint.sizeBucket &&
    evidence.sizeBucketsExcluded.includes(fingerprint.sizeBucket)
  ) {
    exclusions.push({
      policy: "size-bucket",
      reason: `Not suitable for ${fingerprint.sizeBucket} provider practices`,
    });
  }

  // --- 5. Delivery model ----------------------------------------------------
  if (fingerprint.deliveryModel) {
    if (evidence?.deliveryModelsExcluded?.includes(fingerprint.deliveryModel)) {
      exclusions.push({
        policy: "delivery-model",
        reason: `Does not support ${fingerprint.deliveryModel} delivery`,
      });
    } else if (
      fingerprint.deliveryModel === "telehealth" &&
      evidence?.deliveryModels &&
      evidence.deliveryModels.length > 0 &&
      !evidence.deliveryModels.includes("telehealth")
    ) {
      exclusions.push({
        policy: "delivery-model",
        reason: "Does not support telehealth delivery",
      });
    } else if (!evidence?.deliveryModels || evidence.deliveryModels.length === 0) {
      uncertainties.push({
        policy: "delivery-model",
        reason: "Supported delivery models have not been verified",
      });
    }
  }

  // --- 6. EPCS --------------------------------------------------------------
  // Only authoritative when the capability map has been fully reviewed.
  // Unreviewed metadata cannot prove absence of EPCS support.
  if (fingerprint.prescribingLevel === "controlled-substances-epcs") {
    const hasEpcs = product.capabilities.some(
      (c) =>
        c.capabilityId === "epcs" &&
        (c.strength === "core" || c.strength === "strong")
    );
    const isPrescribingProduct = product.capabilities.some(
      (c) => c.capabilityId === "prescribing-erx" || c.capabilityId === "epcs"
    );

    if (!hasEpcs && isPrescribingProduct) {
      if (product.capabilityMapStatus === "reviewed-complete") {
        exclusions.push({
          policy: "epcs",
          reason:
            "Reviewed capabilities do not include EPCS, required for controlled substances",
        });
      } else {
        uncertainties.push({
          policy: "epcs",
          reason:
            "EPCS support has not been verified, and you prescribe controlled substances",
        });
      }
    }

    /*
      The inverse case, which matters more.

      A missing EPCS claim sends a prescriber looking elsewhere, which is
      safe. An unverified claim that EPCS *is* supported sends them to buy a
      system believing they can lawfully e-prescribe controlled substances.
      EPCS is DEA-regulated, so an unreviewed vendor assertion is exactly the
      "unknown evidence treated as meeting a hard requirement" this engine
      exists to prevent. The product stays eligible, because the claim may
      well be true, but it is never presented as established fact.
    */
    if (hasEpcs) {
      const epcsClaim = product.capabilities.find(
        (c) => c.capabilityId === "epcs"
      );
      const claimIsVerified =
        epcsClaim?.provenance === "verified" ||
        product.capabilityMapStatus === "reviewed-complete";

      if (!claimIsVerified) {
        uncertainties.push({
          policy: "epcs",
          reason:
            "EPCS support is claimed by the vendor but has not been independently verified",
          headline: EPCS_UNVERIFIED_HEADLINE,
          detail: EPCS_UNVERIFIED_DETAIL,
        });
      }
    }
  }

  // --- 7. BAA / HIPAA -------------------------------------------------------
  if (isInsuranceHeavy(fingerprint)) {
    const baaAvailable = product.compliance?.baaAvailable;
    if (baaAvailable === false) {
      exclusions.push({
        policy: "baa-hipaa",
        reason: "No BAA available - required for insurance billing",
      });
    } else if (baaAvailable === undefined) {
      uncertainties.push({
        policy: "baa-hipaa",
        reason: "BAA availability has not been verified",
      });
    }
  }

  return {
    eligible: exclusions.length === 0,
    exclusions,
    uncertainties,
  };
}

/**
 * Convenience predicate for callers that only need a yes/no answer.
 */
export function isEligible(
  product: ProductArchitectureMetadata,
  fingerprint: PracticeFingerprint
): boolean {
  return evaluateEligibility(product, fingerprint).eligible;
}
