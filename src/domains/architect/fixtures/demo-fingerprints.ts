/**
 * Demo Fingerprints Fixture
 *
 * Sample practice profiles for testing and demonstration.
 */

import { type PracticeFingerprint, createEmptyFingerprint } from "../schemas";

/**
 * Solo therapist practice - cash pay primary
 */
export const SOLO_THERAPIST_CASH: PracticeFingerprint = {
  ...createEmptyFingerprint(),
  practiceType: "solo-clinician",
  sizeBucket: "solo",
  exactProviderCount: 1,
  clinicalRoles: ["therapist"],
  populations: ["adults"],
  primaryPayerType: "cash",
  payerMix: {
    cash: 90,
    commercial: 10,
  },
  prescribingLevel: "none",
  deliveryModel: "hybrid",
  priorities: ["ease-of-use", "low-cost"],
  statesServed: [],
  monthlyBudget: 150,
};

/**
 * Solo psychiatrist - prescriber with controlled substances
 */
export const SOLO_PSYCHIATRIST: PracticeFingerprint = {
  ...createEmptyFingerprint(),
  practiceType: "psychiatry",
  sizeBucket: "solo",
  exactProviderCount: 1,
  clinicalRoles: ["psychiatrist"],
  populations: ["adults", "adolescents"],
  primaryPayerType: "commercial-insurance",
  payerMix: {
    commercial: 70,
    cash: 30,
  },
  prescribingLevel: "controlled-substances-epcs",
  deliveryModel: "hybrid",
  priorities: ["clinical-workflow", "integrations"],
  statesServed: ["CA"],
  isMultiState: false,
  monthlyBudget: 400,
};

/**
 * Small group practice - mixed clinicians
 */
export const SMALL_GROUP_PRACTICE: PracticeFingerprint = {
  ...createEmptyFingerprint(),
  practiceType: "therapy-plus-psychiatry",
  sizeBucket: "2-5",
  exactProviderCount: 4,
  clinicalRoles: ["social-worker", "psychologist", "psychiatric-np"],
  populations: ["adults", "couples", "adolescents"],
  primaryPayerType: "commercial-insurance",
  payerMix: {
    commercial: 80,
    cash: 20,
  },
  prescribingLevel: "prescribing",
  deliveryModel: "in-person",
  priorities: ["billing-collections", "integrations", "ease-of-use"],
  statesServed: ["NY"],
  isMultiState: false,
  monthlyBudget: 600,
  exactLocationCount: 1,
};

/**
 * Medium group practice - growth focused
 */
export const MEDIUM_GROUP_PRACTICE: PracticeFingerprint = {
  ...createEmptyFingerprint(),
  practiceType: "therapy-plus-psychiatry",
  sizeBucket: "6-10",
  exactProviderCount: 10,
  clinicalRoles: ["therapist", "social-worker", "psychologist", "psychiatrist"],
  populations: ["adults", "children", "adolescents", "families"],
  primaryPayerType: "commercial-insurance",
  payerMix: {
    commercial: 90,
    cash: 10,
  },
  prescribingLevel: "controlled-substances-epcs",
  deliveryModel: "hybrid",
  priorities: ["billing-collections", "scalability", "reporting"],
  statesServed: ["TX"],
  isMultiState: false,
  monthlyBudget: 1500,
  exactLocationCount: 2,
  monthlyEncounterVolume: 800,
};

/**
 * Telehealth-only practice
 */
export const TELEHEALTH_ONLY_PRACTICE: PracticeFingerprint = {
  ...createEmptyFingerprint(),
  practiceType: "telehealth-first",
  sizeBucket: "2-5",
  exactProviderCount: 3,
  clinicalRoles: ["therapist", "psychiatric-np"],
  populations: ["adults"],
  primaryPayerType: "cash",
  payerMix: {
    cash: 60,
    commercial: 40,
  },
  prescribingLevel: "prescribing",
  deliveryModel: "telehealth",
  priorities: ["ease-of-use", "patient-experience"],
  statesServed: ["CA", "NY", "TX", "FL"],
  isMultiState: true,
  monthlyBudget: 300,
};

/**
 * Large enterprise practice
 */
export const LARGE_ENTERPRISE_PRACTICE: PracticeFingerprint = {
  ...createEmptyFingerprint(),
  practiceType: "therapy-plus-psychiatry",
  sizeBucket: "51-100",
  exactProviderCount: 50,
  clinicalRoles: ["therapist", "social-worker", "psychologist", "psychiatrist", "psychiatric-np"],
  populations: ["adults", "children", "adolescents", "families", "mixed"],
  primaryPayerType: "mixed",
  payerMix: {
    commercial: 60,
    medicare: 20,
    medicaid: 15,
    cash: 5,
  },
  prescribingLevel: "controlled-substances-epcs",
  deliveryModel: "hybrid",
  priorities: ["scalability", "billing-collections", "reporting"],
  statesServed: ["CA", "AZ", "NV"],
  isMultiState: true,
  monthlyBudget: 8000,
  exactLocationCount: 8,
  monthlyEncounterVolume: 4000,
  monthlyCollections: 500000,
};

/**
 * All demo fingerprints for iteration
 */
export const ALL_DEMO_FINGERPRINTS: Record<string, PracticeFingerprint> = {
  "solo-therapist-cash": SOLO_THERAPIST_CASH,
  "solo-psychiatrist": SOLO_PSYCHIATRIST,
  "small-group-practice": SMALL_GROUP_PRACTICE,
  "medium-group-practice": MEDIUM_GROUP_PRACTICE,
  "telehealth-only-practice": TELEHEALTH_ONLY_PRACTICE,
  "large-enterprise-practice": LARGE_ENTERPRISE_PRACTICE,
};
