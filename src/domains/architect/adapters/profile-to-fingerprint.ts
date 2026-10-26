/**
 * Practice Profile -> Practice Fingerprint
 *
 * Normalizes the clinician-facing profile into the canonical
 * `PracticeFingerprint` the engines consume.
 *
 * This adapter is the only place profile answers become engine input. The v2
 * workspace collected a profile and never used it; routing every profile change
 * through here is what makes the questions actually matter.
 *
 * Normalization rules:
 * - Practice type is derived from the combination of roles and services, never
 *   from a single job title.
 * - Prescribing level comes from the explicit prescribing question, never from
 *   a role label, because authority varies by credential and jurisdiction.
 * - Unknown answers stay undefined so the engines can treat them as unknown
 *   rather than as a negative assertion.
 */

import type {
  ClinicalRole,
  PayerType,
  PracticeFingerprint,
  PracticeType,
  PrescribingLevel,
  Priority,
} from "../schemas/fingerprint";
import { createEmptyFingerprint } from "../schemas/fingerprint";
import type { CapabilityId } from "../schemas/lifecycle";
import type {
  PracticeProfile,
  PracticeService,
  PrescribingScope,
} from "../schemas/practice-project";

/** Roles that indicate prescribing is plausible, pending explicit confirmation. */
const PRESCRIBING_ROLES: readonly ClinicalRole[] = [
  "psychiatrist",
  "psychiatric-np",
];

/** Roles that indicate therapy delivery. */
const THERAPY_ROLES: readonly ClinicalRole[] = [
  "therapist",
  "counselor",
  "social-worker",
  "psychologist",
];

export function hasPrescribingRole(roles: readonly ClinicalRole[]): boolean {
  return roles.some((r) => PRESCRIBING_ROLES.includes(r));
}

/**
 * Derive the canonical practice type.
 *
 * Order matters: the more specific a practice's profile, the more specific the
 * type. Testing-only and SUD practices are recognized before the generic
 * therapy/psychiatry split because they change which capabilities are relevant.
 */
export function derivePracticeType(
  profile: PracticeProfile
): PracticeType | undefined {
  const { roles, services, size, delivery } = profile;

  if (roles.length === 0) return undefined;

  const doesTherapy =
    services.includes("psychotherapy") ||
    services.includes("couples-family-therapy") ||
    services.includes("group-therapy");
  const doesMeds = services.includes("medication-management");
  const doesTesting = services.includes("psychological-testing");
  const doesSud = services.includes("substance-use-treatment");

  // Substance use is a distinct operational model regardless of discipline.
  if (doesSud) return "sud-addiction";

  // Testing without therapy or medication is a testing practice.
  if (doesTesting && !doesTherapy && !doesMeds) return "psychological-testing";

  // Telehealth-only is a distinct operational model for solo practices.
  if (delivery === "telehealth" && size === "solo") return "telehealth-first";

  if (doesTherapy && doesMeds) return "therapy-plus-psychiatry";
  if (doesMeds) return "psychiatry";

  if (doesTherapy) {
    return size === "solo" ? "solo-clinician" : "therapy-group";
  }

  // Services not yet answered. Fall back to role composition.
  const hasPrescriber = hasPrescribingRole(roles);
  const hasTherapist = roles.some((r) => THERAPY_ROLES.includes(r));

  if (hasPrescriber && hasTherapist) return "therapy-plus-psychiatry";
  if (hasPrescriber) return "psychiatry";
  if (hasTherapist) return size === "solo" ? "solo-clinician" : "therapy-group";

  return undefined;
}

/** Map the three-option payment question to the canonical payer type. */
export function derivePayerType(
  profile: PracticeProfile
): PayerType | undefined {
  switch (profile.payment) {
    case "cash":
      return "cash";
    case "insurance":
      return "commercial-insurance";
    case "both":
      return "mixed";
    default:
      return undefined;
  }
}

/**
 * Map the prescribing question to the canonical prescribing level.
 *
 * Returns undefined when unanswered so downstream checks treat it as unknown.
 * A practice with no prescribing role is "none" without being asked.
 */
export function derivePrescribingLevel(
  profile: PracticeProfile
): PrescribingLevel | undefined {
  if (profile.prescribing === undefined) {
    return hasPrescribingRole(profile.roles) ? undefined : "none";
  }

  const map: Record<PrescribingScope, PrescribingLevel> = {
    none: "none",
    "non-controlled": "prescribing",
    controlled: "controlled-substances-epcs",
  };
  return map[profile.prescribing];
}

/**
 * Derive ranked priorities from the profile.
 *
 * The engines use priorities to break ties and weight fit dimensions. Rather
 * than asking a separate ranking question, these are inferred from facts the
 * user already gave us, which keeps onboarding short.
 */
export function derivePriorities(profile: PracticeProfile): Priority[] {
  const priorities: Priority[] = [];

  if (profile.payment === "insurance" || profile.payment === "both") {
    priorities.push("billing-collections");
  }

  if (profile.size === "solo") {
    priorities.push("ease-of-use", "implementation-simplicity");
  } else {
    priorities.push("scalability", "integrations");
  }

  priorities.push("clinical-workflow");

  if (profile.monthlyBudget !== undefined) {
    priorities.unshift("low-cost");
  }

  if (profile.delivery === "telehealth" || profile.delivery === "hybrid") {
    priorities.push("patient-experience");
  }

  // The fingerprint expects an ordered, de-duplicated list.
  return [...new Set(priorities)];
}

/**
 * Convert a practice profile into the canonical engine fingerprint.
 */
export function profileToFingerprint(
  profile: PracticeProfile
): PracticeFingerprint {
  const fingerprint = createEmptyFingerprint();

  fingerprint.practiceType = derivePracticeType(profile);
  fingerprint.sizeBucket = profile.size;
  fingerprint.exactProviderCount = profile.providerCount;
  fingerprint.clinicalRoles = [...profile.roles];
  fingerprint.statesServed = [...profile.states];
  fingerprint.isMultiState = profile.states.length > 1;
  fingerprint.primaryPayerType = derivePayerType(profile);
  fingerprint.prescribingLevel = derivePrescribingLevel(profile);
  fingerprint.deliveryModel = profile.delivery;
  fingerprint.priorities = derivePriorities(profile);
  fingerprint.monthlyBudget = profile.monthlyBudget;

  return fingerprint;
}

// ============================================================================
// SERVICE-DRIVEN CAPABILITY APPLICABILITY
// ============================================================================

/**
 * Capabilities that only apply when a specific service is delivered.
 *
 * This is what keeps a cash-pay therapist from seeing a prescribing station.
 * Anything not listed here is governed by the relevance engine.
 *
 * Known gap: the capability registry has no dedicated psychological-testing or
 * laboratory capability, so testing practices currently gate on `assessments-mbc`,
 * which also covers routine outcome measurement. Distinguishing a full testing
 * workflow from measurement-based care needs a registry addition.
 */
const SERVICE_GATED_CAPABILITIES: Partial<Record<CapabilityId, PracticeService[]>> = {
  "prescribing-erx": ["medication-management"],
  epcs: ["medication-management"],
  "assessments-mbc": ["psychological-testing", "outcome-measurement"],
};

/**
 * Whether a capability applies to this practice at all.
 *
 * Returns true for any capability without a service gate; the relevance engine
 * decides how important it is.
 */
export function isCapabilityApplicable(
  capabilityId: CapabilityId,
  profile: PracticeProfile
): boolean {
  const requiredServices = SERVICE_GATED_CAPABILITIES[capabilityId];
  if (!requiredServices) return true;

  // Services unanswered: do not hide the capability, since hiding it would be
  // an assertion we cannot support.
  if (profile.services.length === 0) return true;

  return requiredServices.some((s) => profile.services.includes(s));
}
