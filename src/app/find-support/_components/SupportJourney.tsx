/**
 * SupportJourney Component
 *
 * Multi-step patient journey for finding mental health support.
 * Follows the Patient Pilot Contract specifications.
 *
 * INVARIANTS:
 * - Crisis urgency immediately shows crisis resources (no more questions)
 * - Safety keywords trigger crisis banner (journey can continue)
 * - Crisis resources are always accessible regardless of JavaScript state
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, ArrowRight, Phone, MessageSquare, AlertTriangle, X } from "lucide-react";
import { checkForSafetyKeywords, SYMPTOM_CATEGORIES } from "@/domains/symptoms";
import {
  evaluateSupportPath,
  CRISIS_RESOURCES,
  trackSupportJourneyStarted,
  trackSupportJourneyAbandoned,
  trackSupportJourneyCompleted,
  trackUrgencyCompleted,
  trackStepCompleted,
  trackSupportPathShown,
  trackCrisisShown,
  type PatientJourneyInput,
  type UrgencyLevel,
  type SymptomDuration,
  type SupportGoal,
  type PriorSupportLevel,
  type InsurancePreference,
  type ModalityPreference,
  type JourneyStep,
  type SupportPathResult,
} from "@/domains/patient-support";
// Phase 6: Shared decision session context for cross-domain funnel analysis
import {
  createDecisionSession,
  trackDecisionStarted,
  trackDecisionResultShown,
  trackDecisionActionClicked,
  trackDecisionCompleted,
  trackDecisionAbandoned,
  type DecisionSessionContext,
} from "@/domains/decision";
import type { SymptomCategory } from "@/domains/symptoms/types";

// ============================================================================
// CRISIS BANNER (Always visible when triggered)
// ============================================================================

interface CrisisBannerProps {
  onDismiss?: () => void;
  showDismiss?: boolean;
}

function CrisisBanner({ onDismiss, showDismiss = true }: CrisisBannerProps) {
  return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6" role="alert">
      <div className="flex items-start">
        <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">
            If you&apos;re in crisis, help is available now
          </h3>
          <div className="mt-2 text-sm text-red-700 space-y-2">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a href="tel:988" className="font-medium underline hover:no-underline">
                Call 988
              </a>
              <span className="text-red-600">Suicide & Crisis Lifeline (24/7)</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <a href="sms:741741&body=HOME" className="font-medium underline hover:no-underline">
                Text HOME to 741741
              </a>
              <span className="text-red-600">Crisis Text Line (24/7)</span>
            </div>
          </div>
        </div>
        {showDismiss && onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-4 text-red-400 hover:text-red-600"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// STEP 1: Urgency Check
// ============================================================================

const URGENCY_OPTIONS: { value: UrgencyLevel; label: string; description: string; isAlert?: boolean }[] = [
  {
    value: "immediate-crisis",
    label: "I'm in crisis or having thoughts of hurting myself",
    description: "Get immediate support",
    isAlert: true,
  },
  {
    value: "struggling-now",
    label: "I'm struggling and need help soon",
    description: "Things are difficult and I want to find support",
  },
  {
    value: "planning-ahead",
    label: "I'm planning ahead / exploring options",
    description: "Researching support for myself or someone I care about",
  },
];

// ============================================================================
// STEP 2: Primary Concerns (Symptom Categories)
// ============================================================================

const CONCERN_OPTIONS = SYMPTOM_CATEGORIES.map((cat) => ({
  value: cat.id,
  label: cat.name,
  description: cat.description,
}));

// ============================================================================
// STEP 3: Duration
// ============================================================================

const DURATION_OPTIONS: { value: SymptomDuration; label: string }[] = [
  { value: "less-than-2-weeks", label: "Less than 2 weeks" },
  { value: "2-weeks-to-3-months", label: "2 weeks to 3 months" },
  { value: "more-than-3-months", label: "More than 3 months" },
  { value: "on-and-off", label: "On and off for a long time" },
];

// ============================================================================
// STEP 4: Support Goals
// ============================================================================

const GOAL_OPTIONS: { value: SupportGoal; label: string }[] = [
  { value: "understand-experience", label: "Understand what I'm experiencing" },
  { value: "learn-coping-strategies", label: "Learn coping strategies" },
  { value: "talk-to-someone-regularly", label: "Talk to someone regularly" },
  { value: "professional-evaluation", label: "Get a professional diagnosis/evaluation" },
  { value: "explore-medication", label: "Explore medication options" },
  { value: "crisis-support", label: "Crisis or safety support" },
];

// ============================================================================
// STEP 5: Prior Support
// ============================================================================

const PRIOR_SUPPORT_OPTIONS: { value: PriorSupportLevel; label: string }[] = [
  { value: "none", label: "No, this is new for me" },
  { value: "tried-apps", label: "I've used apps or self-help" },
  { value: "tried-therapy", label: "I've seen a therapist or counselor" },
  { value: "currently-in-care", label: "I'm currently in care and need something different" },
];

// ============================================================================
// STEP 6: Insurance (Optional)
// ============================================================================

const INSURANCE_OPTIONS: { value: InsurancePreference; label: string }[] = [
  { value: "use-insurance", label: "Yes, I want to use insurance" },
  { value: "out-of-pocket", label: "No, I'll pay out of pocket" },
  { value: "not-sure", label: "I'm not sure / prefer not to say" },
];

// ============================================================================
// STEP 7: Modality (Optional)
// ============================================================================

const MODALITY_OPTIONS: { value: ModalityPreference; label: string }[] = [
  { value: "in-person", label: "In person" },
  { value: "telehealth", label: "Video / telehealth" },
  { value: "either", label: "Either works" },
];

// ============================================================================
// STEP DEFINITIONS
// ============================================================================

const STEPS: JourneyStep[] = [
  "urgency",
  "concerns",
  "duration",
  "goals",
  "prior-support",
  "insurance",
  "modality",
];

const STEP_META: Record<JourneyStep, { title: string; subtitle: string; optional?: boolean }> = {
  urgency: {
    title: "How are you feeling right now?",
    subtitle: "This helps us make sure you get the right support",
  },
  concerns: {
    title: "What's been affecting you most?",
    subtitle: "Select up to 3 areas (or skip if you're not sure)",
  },
  duration: {
    title: "How long has this been affecting your daily life?",
    subtitle: "This helps us understand what kind of support might help",
  },
  goals: {
    title: "What are you hoping to get from support?",
    subtitle: "Select all that apply",
  },
  "prior-support": {
    title: "Have you tried mental health support before?",
    subtitle: "This helps us tailor recommendations",
  },
  insurance: {
    title: "Do you have health insurance you'd like to use?",
    subtitle: "You can skip this if you prefer",
    optional: true,
  },
  modality: {
    title: "How would you prefer to connect?",
    subtitle: "You can skip this if you're flexible",
    optional: true,
  },
  result: {
    title: "Your Support Options",
    subtitle: "Based on what you've shared",
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

interface SupportJourneyProps {
  onComplete?: (result: SupportPathResult) => void;
}

export function SupportJourney({ onComplete }: SupportJourneyProps) {
  const [step, setStep] = useState<JourneyStep>("urgency");
  const [urgencyLevel, setUrgencyLevel] = useState<UrgencyLevel | null>(null);
  const [concerns, setConcerns] = useState<SymptomCategory[]>([]);
  const [duration, setDuration] = useState<SymptomDuration | null>(null);
  const [goals, setGoals] = useState<SupportGoal[]>([]);
  const [priorSupport, setPriorSupport] = useState<PriorSupportLevel | null>(null);
  const [insurance, setInsurance] = useState<InsurancePreference | null>(null);
  const [modality, setModality] = useState<ModalityPreference | null>(null);

  const [safetyKeywordsDetected, setSafetyKeywordsDetected] = useState(false);
  const [showCrisisBanner, setShowCrisisBanner] = useState(false);
  const [result, setResult] = useState<SupportPathResult | null>(null);

  // Phase 6: Decision session context for funnel attribution
  const [decisionSession] = useState<DecisionSessionContext>(() =>
    createDecisionSession("patient-support", "direct")
  );

  const stepIndex = STEPS.indexOf(step);
  const isFirstStep = stepIndex === 0;
  const isLastQuestionStep = step === "modality";
  const isResultStep = step === "result";

  // Check for crisis state
  const isCrisisState = urgencyLevel === "immediate-crisis";

  // Track journey start on mount
  useEffect(() => {
    trackSupportJourneyStarted("direct");
    // Phase 6: Also track via shared decision session for funnel analysis
    trackDecisionStarted(decisionSession);
  }, [decisionSession]);

  // Track journey abandonment on unmount (if not completed)
  useEffect(() => {
    return () => {
      if (step !== "result") {
        trackSupportJourneyAbandoned(step);
        // Phase 6: Also track via shared decision session
        trackDecisionAbandoned(decisionSession, step);
      }
    };
  }, [step, decisionSession]);

  // Show crisis banner when needed
  useEffect(() => {
    if (isCrisisState || safetyKeywordsDetected) {
      setShowCrisisBanner(true);
      trackCrisisShown(isCrisisState ? "selection" : "keyword");
      // Phase 6: Mark session as having safety signal for funnel analysis
      decisionSession.hadSafetySignal = true;
    }
  }, [isCrisisState, safetyKeywordsDetected, decisionSession]);

  // Handle urgency selection
  const handleUrgencySelect = useCallback((value: UrgencyLevel) => {
    setUrgencyLevel(value);

    // Track urgency completion (privacy-safe: only branch, not specific answer)
    const branch = value === "immediate-crisis" ? "crisis" : value === "struggling-now" ? "struggling" : "planning";
    trackUrgencyCompleted(branch);

    if (value === "immediate-crisis") {
      // INVARIANT: Crisis immediately shows result with crisis resources only
      const input: PatientJourneyInput = {
        urgencyCheck: value,
        primaryConcerns: [],
        goals: [],
      };
      const evaluatedResult = evaluateSupportPath(input);
      setResult(evaluatedResult);
      setStep("result");

      // Track result shown
      trackSupportPathShown(
        evaluatedResult.primaryPath.id,
        evaluatedResult.alternatives.length,
        evaluatedResult.confidence,
        true // crisis signal
      );
      trackSupportJourneyCompleted(1, evaluatedResult.primaryPath.id);

      // Phase 6: Track via shared decision session for funnel analysis
      decisionSession.primaryResultId = evaluatedResult.primaryPath.id;
      decisionSession.hadSafetySignal = true;
      trackDecisionResultShown(
        decisionSession,
        evaluatedResult.primaryPath.id,
        evaluatedResult.alternatives.length,
        "high" // Crisis always high confidence
      );
      trackDecisionCompleted(decisionSession, 1);
    } else {
      // Continue to next step
      setStep("concerns");
    }
  }, [decisionSession]);

  // Handle concern selection (multi-select, max 3)
  const handleConcernToggle = useCallback((category: SymptomCategory) => {
    setConcerns((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      }
      if (prev.length >= 3) {
        return prev;
      }
      return [...prev, category];
    });
  }, []);

  // Handle goal selection (multi-select)
  // INVARIANT: "crisis-support" goal activates safety signal
  const handleGoalToggle = useCallback((goal: SupportGoal) => {
    setGoals((prev) => {
      const newGoals = prev.includes(goal)
        ? prev.filter((g) => g !== goal)
        : [...prev, goal];

      // Safety signal when crisis-support goal is selected
      if (goal === "crisis-support" && !prev.includes(goal)) {
        setSafetyKeywordsDetected(true);
      }

      return newGoals;
    });
  }, []);

  // Navigation
  const goNext = useCallback(() => {
    const currentIndex = STEPS.indexOf(step);

    // Track step completion (privacy-safe: only counts, no content)
    if (step === "concerns") {
      trackStepCompleted(step, { count: concerns.length, usedNotSure: concerns.length === 0 });
    } else {
      trackStepCompleted(step);
    }

    if (currentIndex < STEPS.length - 1) {
      setStep(STEPS[currentIndex + 1]);
    } else {
      // Evaluate and show results
      const input: PatientJourneyInput = {
        urgencyCheck: urgencyLevel!,
        primaryConcerns: concerns,
        duration: duration ?? undefined,
        goals,
        priorSupport: priorSupport ?? undefined,
        insurancePreference: insurance ?? undefined,
        modalityPreference: modality ?? undefined,
        safetyKeywordsDetected,
      };
      const evaluatedResult = evaluateSupportPath(input);
      setResult(evaluatedResult);
      setStep("result");

      // Track result shown
      trackSupportPathShown(
        evaluatedResult.primaryPath.id,
        evaluatedResult.alternatives.length,
        evaluatedResult.confidence,
        safetyKeywordsDetected
      );
      trackSupportJourneyCompleted(STEPS.length, evaluatedResult.primaryPath.id);

      // Phase 6: Track via shared decision session for funnel analysis
      decisionSession.primaryResultId = evaluatedResult.primaryPath.id;
      const confidenceBucket =
        evaluatedResult.confidence === "clear-path" ? "high" :
        evaluatedResult.confidence === "reasonable-options" ? "moderate" : "low";
      trackDecisionResultShown(
        decisionSession,
        evaluatedResult.primaryPath.id,
        evaluatedResult.alternatives.length,
        confidenceBucket
      );
      trackDecisionCompleted(decisionSession, STEPS.length);

      onComplete?.(evaluatedResult);
    }
  }, [step, urgencyLevel, concerns, duration, goals, priorSupport, insurance, modality, safetyKeywordsDetected, onComplete, decisionSession]);

  const goBack = useCallback(() => {
    const currentIndex = STEPS.indexOf(step);
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1]);
    }
  }, [step]);

  // Skip optional steps
  const handleSkip = useCallback(() => {
    goNext();
  }, [goNext]);

  // Can proceed check
  const canProceed = useCallback(() => {
    switch (step) {
      case "urgency":
        return urgencyLevel !== null;
      case "concerns":
        return true; // Can skip
      case "duration":
        return true; // Can skip
      case "goals":
        return goals.length > 0;
      case "prior-support":
        return true; // Can skip
      case "insurance":
        return true; // Optional
      case "modality":
        return true; // Optional
      default:
        return false;
    }
  }, [step, urgencyLevel, goals]);

  // Render step content
  const renderStepContent = () => {
    const meta = STEP_META[step];

    switch (step) {
      case "urgency":
        return (
          <div className="space-y-3">
            {URGENCY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleUrgencySelect(option.value)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  option.isAlert
                    ? "border-red-200 bg-red-50 hover:border-red-300"
                    : urgencyLevel === option.value
                    ? "border-accent bg-accent/5"
                    : "border-separator bg-surface hover:border-neutral-300"
                }`}
              >
                <div className="font-medium text-label-primary">{option.label}</div>
                <div className="text-sm text-label-secondary mt-1">{option.description}</div>
              </button>
            ))}
          </div>
        );

      case "concerns":
        return (
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-2">
              {CONCERN_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleConcernToggle(option.value)}
                  disabled={!concerns.includes(option.value) && concerns.length >= 3}
                  className={`text-left p-3 rounded-lg border transition-all ${
                    concerns.includes(option.value)
                      ? "border-accent bg-accent/5"
                      : "border-separator bg-surface hover:border-neutral-300 disabled:opacity-50"
                  }`}
                >
                  <div className="font-medium text-sm text-label-primary">{option.label}</div>
                </button>
              ))}
            </div>
            {concerns.length > 0 && (
              <p className="text-sm text-label-secondary">
                {concerns.length}/3 selected
              </p>
            )}
          </div>
        );

      case "duration":
        return (
          <div className="space-y-2">
            {DURATION_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setDuration(option.value)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  duration === option.value
                    ? "border-accent bg-accent/5"
                    : "border-separator bg-surface hover:border-neutral-300"
                }`}
              >
                <div className="font-medium text-label-primary">{option.label}</div>
              </button>
            ))}
          </div>
        );

      case "goals":
        return (
          <div className="space-y-2">
            {GOAL_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleGoalToggle(option.value)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  goals.includes(option.value)
                    ? "border-accent bg-accent/5"
                    : "border-separator bg-surface hover:border-neutral-300"
                }`}
              >
                <div className="font-medium text-label-primary">{option.label}</div>
              </button>
            ))}
          </div>
        );

      case "prior-support":
        return (
          <div className="space-y-2">
            {PRIOR_SUPPORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setPriorSupport(option.value)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  priorSupport === option.value
                    ? "border-accent bg-accent/5"
                    : "border-separator bg-surface hover:border-neutral-300"
                }`}
              >
                <div className="font-medium text-label-primary">{option.label}</div>
              </button>
            ))}
          </div>
        );

      case "insurance":
        return (
          <div className="space-y-2">
            {INSURANCE_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setInsurance(option.value)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  insurance === option.value
                    ? "border-accent bg-accent/5"
                    : "border-separator bg-surface hover:border-neutral-300"
                }`}
              >
                <div className="font-medium text-label-primary">{option.label}</div>
              </button>
            ))}
          </div>
        );

      case "modality":
        return (
          <div className="space-y-2">
            {MODALITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => setModality(option.value)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  modality === option.value
                    ? "border-accent bg-accent/5"
                    : "border-separator bg-surface hover:border-neutral-300"
                }`}
              >
                <div className="font-medium text-label-primary">{option.label}</div>
              </button>
            ))}
          </div>
        );

      case "result":
        return result ? (
          <SupportPathResultView result={result} decisionSession={decisionSession} />
        ) : null;

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Crisis Banner */}
      {showCrisisBanner && (
        <CrisisBanner
          onDismiss={isCrisisState ? undefined : () => setShowCrisisBanner(false)}
          showDismiss={!isCrisisState}
        />
      )}

      {/* Progress indicator */}
      {!isResultStep && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-label-secondary mb-2">
            <span>Step {stepIndex + 1} of {STEPS.length}</span>
            {STEP_META[step].optional && <span className="text-label-tertiary">Optional</span>}
          </div>
          <div className="h-1 bg-neutral-200 rounded-full">
            <div
              className="h-1 bg-accent rounded-full transition-all"
              style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Step header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-label-primary">
          {STEP_META[step].title}
        </h2>
        <p className="text-label-secondary mt-1">
          {STEP_META[step].subtitle}
        </p>
      </div>

      {/* Step content */}
      {renderStepContent()}

      {/* Navigation */}
      {!isResultStep && step !== "urgency" && (
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-separator">
          <button
            onClick={goBack}
            disabled={isFirstStep}
            className="flex items-center gap-2 text-label-secondary hover:text-label-primary disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex items-center gap-3">
            {STEP_META[step].optional && (
              <button
                onClick={handleSkip}
                className="text-label-secondary hover:text-label-primary"
              >
                Skip
              </button>
            )}
            <button
              onClick={goNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLastQuestionStep ? "See Results" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// RESULT VIEW
// ============================================================================

interface SupportPathResultViewProps {
  result: SupportPathResult;
  decisionSession: DecisionSessionContext;
}

function SupportPathResultView({ result, decisionSession }: SupportPathResultViewProps) {
  const { primaryPath, alternatives, urgentResources, confidence, missingInfo, nextActions, disclaimer } = result;

  // Phase 6: Track action clicks via shared decision session
  const handleActionClick = (action: (typeof nextActions)[0], isPrimary: boolean) => {
    trackDecisionActionClicked(decisionSession, action.type, isPrimary, {
      targetSlug: action.href,
      isCommercial: false, // Patient support actions are not commercial
    });
  };

  return (
    <div className="space-y-6">
      {/* Urgent resources if present */}
      {urgentResources && urgentResources.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="font-medium text-red-800 mb-3">Immediate Support Available</h3>
          <div className="space-y-2">
            {urgentResources.map((resource) => (
              <div key={resource.name} className="flex items-center gap-3 text-sm">
                {resource.phone && (
                  <>
                    <Phone className="h-4 w-4 text-red-600" />
                    <a href={`tel:${resource.phone}`} className="font-medium text-red-700 underline">
                      {resource.phone}
                    </a>
                  </>
                )}
                {resource.text && (
                  <>
                    <MessageSquare className="h-4 w-4 text-red-600" />
                    <span className="text-red-700">{resource.text}</span>
                  </>
                )}
                <span className="text-red-600">{resource.name} ({resource.available})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence indicator */}
      <div className="text-sm text-label-secondary">
        {confidence === "clear-path" && "Based on what you've shared, this seems like a good fit:"}
        {confidence === "reasonable-options" && "Here are some reasonable options to consider:"}
        {confidence === "needs-exploration" && "Let's explore what might work for you:"}
      </div>

      {/* Primary path */}
      <div className="border border-accent/30 bg-accent/5 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-label-primary mb-2">
          {primaryPath.name}
        </h3>
        <p className="text-label-secondary mb-4">
          {primaryPath.description}
        </p>

        {primaryPath.whyThisFits.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-label-primary mb-2">Why this might fit:</h4>
            <ul className="list-disc list-inside text-sm text-label-secondary space-y-1">
              {primaryPath.whyThisFits.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {primaryPath.considerations.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-label-primary mb-2">Things to consider:</h4>
            <ul className="list-disc list-inside text-sm text-label-secondary space-y-1">
              {primaryPath.considerations.map((consideration, i) => (
                <li key={i}>{consideration}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-sm text-label-tertiary">
          <strong>When an alternative might be better:</strong> {primaryPath.whenBetterFit}
        </div>
      </div>

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-label-primary mb-3">Other Options</h3>
          <div className="space-y-3">
            {alternatives.map((alt) => (
              <div key={alt.id} className="border border-separator rounded-lg p-4">
                <h4 className="font-medium text-label-primary">{alt.name}</h4>
                <p className="text-sm text-label-secondary mt-1">{alt.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing info */}
      {missingInfo.length > 0 && (
        <div className="bg-neutral-50 rounded-lg p-4 text-sm text-label-secondary">
          <p>To give you more specific guidance, it would help to know about: {missingInfo.join(", ")}.</p>
        </div>
      )}

      {/* Next actions */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-label-primary">Next Steps</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {nextActions
            .filter((action) => action.type !== "reset")
            .map((action, i) => (
              <a
                key={i}
                href={action.href}
                onClick={() => handleActionClick(action, i === 0)}
                className="block p-4 border border-separator rounded-lg hover:border-accent hover:bg-accent/5 transition-all"
              >
                <span className="font-medium text-label-primary">{action.label}</span>
              </a>
            ))}
        </div>
        <a
          href="/find-support"
          className="inline-block text-sm text-label-secondary hover:text-label-primary underline"
        >
          Start over
        </a>
      </div>

      {/* Disclaimer */}
      <div className="text-xs text-label-tertiary border-t border-separator pt-4">
        {disclaimer}
      </div>
    </div>
  );
}
