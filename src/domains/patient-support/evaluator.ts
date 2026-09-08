/**
 * Support Path Evaluator
 *
 * Deterministic evaluator for patient support journey.
 * Maps user input to appropriate support paths.
 *
 * INVARIANTS:
 * - Crisis input ALWAYS returns crisis path immediately
 * - Safety keywords ALWAYS include crisis resources
 * - Unknown/skipped inputs result in broader recommendations, never narrower
 * - Medication interest MUST include psychiatric-eval path
 * - Never diagnose, prescribe, or guarantee outcomes
 */

import type {
  PatientJourneyInput,
  SupportPathResult,
  SupportPath,
  SupportPathId,
  ConfidenceLevel,
  NextAction,
} from "./types";
import {
  CRISIS_RESOURCES,
  SUPPORT_PATHS,
  SUPPORT_PATH_DISCLAIMER,
  getSupportPath,
  PATHS_VERSION,
} from "./paths";

/**
 * Evaluator version - increment when logic changes
 */
const EVALUATOR_VERSION = "1.0.0";

/**
 * Evaluate patient input and return support path recommendation
 *
 * This is the main entry point for the patient support journey.
 */
export function evaluateSupportPath(input: PatientJourneyInput): SupportPathResult {
  // INVARIANT: Crisis input returns crisis path immediately
  if (input.urgencyCheck === "immediate-crisis") {
    return createCrisisResult(input, "selection");
  }

  // INVARIANT: Safety keywords always include crisis resources
  // Note: immediate-crisis already returned early above, so only check safetyKeywordsDetected
  const hasSafetySignal = input.safetyKeywordsDetected === true;

  // Determine primary path based on goals and context
  const { primaryPathId, alternativeIds, confidence, whyReasons } = selectPaths(input);

  // Build the primary path with reasons
  const primaryPath = getSupportPath(primaryPathId, whyReasons);

  // Build alternative paths
  const alternatives = alternativeIds.map((id) => getSupportPath(id, []));

  // Determine what information would help refine recommendations
  const missingInfo = determineMissingInfo(input);

  // Build next actions
  const nextActions = buildNextActions(primaryPathId, input);

  return {
    primaryPath,
    alternatives,
    urgentResources: hasSafetySignal ? CRISIS_RESOURCES : undefined,
    confidence,
    missingInfo,
    nextActions,
    disclaimer: SUPPORT_PATH_DISCLAIMER,
    versions: {
      definition: PATHS_VERSION,
      evaluator: EVALUATOR_VERSION,
    },
  };
}

/**
 * Create a crisis-only result
 */
function createCrisisResult(
  input: PatientJourneyInput,
  trigger: "selection" | "keyword"
): SupportPathResult {
  const crisisPath = getSupportPath("crisis-support", [
    "You indicated you're in crisis or having thoughts of hurting yourself",
    "Connecting with a trained crisis counselor is the most important next step",
  ]);

  return {
    primaryPath: crisisPath,
    alternatives: [],
    urgentResources: CRISIS_RESOURCES,
    confidence: "clear-path",
    missingInfo: [],
    nextActions: [
      {
        label: "Call 988 (Suicide & Crisis Lifeline)",
        href: "tel:988",
        type: "in-page",
      },
      {
        label: "Text HOME to 741741",
        href: "sms:741741&body=HOME",
        type: "in-page",
      },
      {
        label: "When ready, explore ongoing support",
        href: "/find-support?return=true",
        type: "navigation",
      },
    ],
    disclaimer: SUPPORT_PATH_DISCLAIMER,
    versions: {
      definition: PATHS_VERSION,
      evaluator: EVALUATOR_VERSION,
    },
  };
}

interface PathSelection {
  primaryPathId: SupportPathId;
  alternativeIds: SupportPathId[];
  confidence: ConfidenceLevel;
  whyReasons: string[];
}

/**
 * Select appropriate paths based on user input
 */
function selectPaths(input: PatientJourneyInput): PathSelection {
  const whyReasons: string[] = [];

  // INVARIANT: Medication interest must include psychiatric-eval
  const wantsMedication = input.goals.includes("explore-medication");

  // Check for professional evaluation goal
  const wantsEvaluation = input.goals.includes("professional-evaluation");

  // Check for therapy-oriented goals
  const wantsTherapy =
    input.goals.includes("talk-to-someone-regularly") ||
    input.goals.includes("learn-coping-strategies");

  // Check for understanding/coping goals
  const wantsUnderstanding = input.goals.includes("understand-experience");

  // Check for crisis support goal
  const wantsCrisisSupport = input.goals.includes("crisis-support");

  // Check for prior experience
  const hasTriedApps = input.priorSupport === "tried-apps";
  const hasTriedTherapy = input.priorSupport === "tried-therapy";
  const currentlyInCare = input.priorSupport === "currently-in-care";

  // Check symptom duration
  const longDuration =
    input.duration === "more-than-3-months" || input.duration === "on-and-off";

  // Struggling-now vs planning-ahead affects urgency framing
  const isStruggling = input.urgencyCheck === "struggling-now";

  // MINIMAL INPUT: If we don't have enough to make a recommendation
  if (input.goals.length === 0 && input.primaryConcerns.length === 0) {
    return {
      primaryPathId: "therapy-counseling",
      alternativeIds: ["psychiatric-eval", "digital-tools", "primary-care"],
      confidence: "needs-exploration",
      whyReasons: [
        "Talk therapy is a common starting point for exploring mental health support",
      ],
    };
  }

  // PATH SELECTION LOGIC

  // Crisis support takes priority if explicitly selected
  if (wantsCrisisSupport) {
    whyReasons.push("You indicated you're looking for crisis or safety support");
    return {
      primaryPathId: "crisis-support",
      alternativeIds: ["therapy-counseling", "integrated-care"],
      confidence: "clear-path",
      whyReasons,
    };
  }

  // Medication interest -> psychiatric evaluation
  if (wantsMedication) {
    whyReasons.push("You mentioned interest in exploring medication options");

    if (hasTriedTherapy) {
      whyReasons.push("You've already tried therapy");
      return {
        primaryPathId: "psychiatric-eval",
        alternativeIds: ["integrated-care", "primary-care"],
        confidence: "clear-path",
        whyReasons,
      };
    }

    // Recommend integrated if they also want therapy
    if (wantsTherapy) {
      whyReasons.push("You also mentioned wanting to talk to someone regularly");
      return {
        primaryPathId: "integrated-care",
        alternativeIds: ["psychiatric-eval", "therapy-counseling"],
        confidence: "clear-path",
        whyReasons,
      };
    }

    return {
      primaryPathId: "psychiatric-eval",
      alternativeIds: ["integrated-care", "therapy-counseling"],
      confidence: "clear-path",
      whyReasons,
    };
  }

  // Professional evaluation -> psychiatric or therapy depending on context
  if (wantsEvaluation) {
    whyReasons.push("You mentioned wanting a professional diagnosis or evaluation");

    // If they have prescriber-relevant symptoms or concerns
    if (concernsMatchPrescribing(input.primaryConcerns)) {
      return {
        primaryPathId: "psychiatric-eval",
        alternativeIds: ["integrated-care", "therapy-counseling"],
        confidence: "clear-path",
        whyReasons,
      };
    }

    return {
      primaryPathId: "therapy-counseling",
      alternativeIds: ["psychiatric-eval", "primary-care"],
      confidence: "reasonable-options",
      whyReasons,
    };
  }

  // Therapy-oriented goals
  if (wantsTherapy) {
    whyReasons.push("You mentioned wanting to talk to someone regularly or learn coping strategies");

    if (longDuration) {
      whyReasons.push("These concerns have been affecting you for a while");
    }

    if (isStruggling) {
      whyReasons.push("You mentioned you're struggling now and need help soon");
    }

    if (hasTriedApps && !hasTriedTherapy) {
      whyReasons.push("You've tried apps but haven't worked with a therapist yet");
      return {
        primaryPathId: "therapy-counseling",
        alternativeIds: ["integrated-care", "peer-support"],
        confidence: "clear-path",
        whyReasons,
      };
    }

    if (currentlyInCare) {
      whyReasons.push("You're currently in care and looking for something different");
      return {
        primaryPathId: "therapy-counseling",
        alternativeIds: ["psychiatric-eval", "integrated-care"],
        confidence: "reasonable-options",
        whyReasons,
      };
    }

    return {
      primaryPathId: "therapy-counseling",
      alternativeIds: ["integrated-care", "digital-tools"],
      confidence: "clear-path",
      whyReasons,
    };
  }

  // Understanding/coping without therapy commitment
  if (wantsUnderstanding) {
    whyReasons.push("You mentioned wanting to understand what you're experiencing");

    if (input.priorSupport === "none") {
      whyReasons.push("This is new for you");

      // Short duration, no prior support, just understanding -> digital tools or primary care
      if (input.duration === "less-than-2-weeks") {
        return {
          primaryPathId: "digital-tools",
          alternativeIds: ["primary-care", "therapy-counseling"],
          confidence: "reasonable-options",
          whyReasons,
        };
      }
    }

    return {
      primaryPathId: "therapy-counseling",
      alternativeIds: ["digital-tools", "primary-care"],
      confidence: "reasonable-options",
      whyReasons,
    };
  }

  // Default: Recommend therapy as the most common starting point
  whyReasons.push("Based on what you've shared, talk therapy is often a helpful starting point");

  return {
    primaryPathId: "therapy-counseling",
    alternativeIds: ["psychiatric-eval", "digital-tools", "primary-care"],
    confidence: "reasonable-options",
    whyReasons,
  };
}

/**
 * Check if concerns suggest prescriber involvement might be helpful
 */
function concernsMatchPrescribing(concerns: PatientJourneyInput["primaryConcerns"]): boolean {
  const prescribingRelevantConcerns = [
    "mood-motivation",
    "attention-memory",
    "sleep",
    "thoughts-perceptions",
    "energy-physical",
  ];

  return concerns.some((c) => prescribingRelevantConcerns.includes(c));
}

/**
 * Determine what missing information would help refine recommendations
 */
function determineMissingInfo(input: PatientJourneyInput): string[] {
  const missing: string[] = [];

  if (input.primaryConcerns.length === 0) {
    missing.push("what you're experiencing");
  }

  if (!input.duration) {
    missing.push("how long this has been affecting you");
  }

  if (input.goals.length === 0) {
    missing.push("what you're hoping to get from support");
  }

  if (!input.priorSupport) {
    missing.push("your prior experience with mental health support");
  }

  return missing;
}

/**
 * Build next actions based on the recommended path
 */
function buildNextActions(pathId: SupportPathId, input: PatientJourneyInput): NextAction[] {
  const actions: NextAction[] = [];

  switch (pathId) {
    case "crisis-support":
      actions.push({
        label: "Call 988 (Suicide & Crisis Lifeline)",
        href: "tel:988",
        type: "in-page",
      });
      break;

    case "therapy-counseling":
      actions.push({
        label: "Explore therapy platforms",
        href: "/tools/find-support/therapy-platforms",
        type: "navigation",
      });
      break;

    case "psychiatric-eval":
      actions.push({
        label: "Find a psychiatrist",
        href: "/psychiatrists",
        type: "navigation",
      });
      actions.push({
        label: "Explore psychiatry platforms",
        href: "/tools/find-support/psychiatry-platforms",
        type: "navigation",
      });
      break;

    case "integrated-care":
      actions.push({
        label: "Find psychiatrists",
        href: "/psychiatrists",
        type: "navigation",
      });
      actions.push({
        label: "Explore therapy platforms",
        href: "/tools/find-support/therapy-platforms",
        type: "navigation",
      });
      break;

    case "peer-support":
      actions.push({
        label: "Find support communities",
        href: "/resources/support-community",
        type: "navigation",
      });
      break;

    case "digital-tools":
      actions.push({
        label: "Explore mental health apps",
        href: "/tools/find-support",
        type: "navigation",
      });
      break;

    case "primary-care":
      actions.push({
        label: "Learn about mental health conditions",
        href: "/conditions",
        type: "navigation",
      });
      break;
  }

  // Always add self-assessment option
  actions.push({
    label: "Take a self-assessment",
    href: "/resources/assessments-screeners",
    type: "navigation",
  });

  // Always add start over option
  actions.push({
    label: "Start over",
    href: "/find-support",
    type: "reset",
  });

  return actions;
}

/**
 * Check if input indicates crisis or safety concerns
 */
export function hasCrisisSignal(input: Partial<PatientJourneyInput>): boolean {
  return (
    input.urgencyCheck === "immediate-crisis" || input.safetyKeywordsDetected === true
  );
}
