// src/app/architect/_components/FingerprintWizard.tsx
// Step-by-step practice profile wizard

"use client";

import { useState, useCallback } from "react";
import { ArrowLeft, ArrowRight, Check, X, Building2 } from "lucide-react";
import {
  type PracticeFingerprint,
  type ArchitectMode,
  type PracticeType,
  type PracticeSizeBucket,
  type ClinicalRole,
  type Population,
  type PayerType,
  type PrescribingLevel,
  type DeliveryModel,
  type Priority,
  createEmptyFingerprint,
  PRACTICE_TYPE_LABELS,
  PRACTICE_SIZE_LABELS,
  CLINICAL_ROLE_LABELS,
  POPULATION_LABELS,
  PAYER_TYPE_LABELS,
  PRESCRIBING_LEVEL_LABELS,
  DELIVERY_MODEL_LABELS,
  PRIORITY_LABELS,
  hasBuildForMeRequirements,
} from "@/domains/architect/schemas";
import {
  trackFingerprintStart,
  trackFingerprintStepComplete,
  trackFingerprintComplete,
} from "@/domains/architect/analytics";

interface FingerprintWizardProps {
  initialFingerprint: PracticeFingerprint;
  mode: ArchitectMode;
  onComplete: (fingerprint: PracticeFingerprint) => void;
  onSkip: () => void;
}

type WizardStep =
  | "practice-type"
  | "size"
  | "roles"
  | "populations"
  | "payers"
  | "prescribing"
  | "delivery"
  | "priorities"
  | "budget";

const STEP_ORDER: WizardStep[] = [
  "practice-type",
  "size",
  "roles",
  "populations",
  "payers",
  "prescribing",
  "delivery",
  "priorities",
];

const STEP_TITLES: Record<WizardStep, string> = {
  "practice-type": "Practice Type",
  size: "Practice Size",
  roles: "Clinical Roles",
  populations: "Patient Populations",
  payers: "Primary Payer",
  prescribing: "Prescribing Level",
  delivery: "Delivery Model",
  priorities: "Your Priorities",
  budget: "Monthly Budget",
};

const STEP_DESCRIPTIONS: Record<WizardStep, string> = {
  "practice-type": "What type of mental health practice are you?",
  size: "How many providers are in your practice?",
  roles: "What clinical roles do you have? (Select all that apply)",
  populations: "Who do you primarily serve? (Select all that apply)",
  payers: "What is your primary payment model?",
  prescribing: "How much prescribing does your practice do?",
  delivery: "How do you deliver care?",
  priorities: "What matters most to you? (Select up to 3)",
  budget: "What's your monthly budget for practice software?",
};

export function FingerprintWizard({
  initialFingerprint,
  mode,
  onComplete,
  onSkip,
}: FingerprintWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("practice-type");
  const [fingerprint, setFingerprint] = useState<PracticeFingerprint>(
    initialFingerprint || createEmptyFingerprint()
  );
  const [hasStarted, setHasStarted] = useState(false);

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === STEP_ORDER.length - 1;

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case "practice-type":
        return !!fingerprint.practiceType;
      case "size":
        return !!fingerprint.sizeBucket;
      case "roles":
        return fingerprint.clinicalRoles.length > 0;
      case "populations":
        return fingerprint.populations.length > 0;
      case "payers":
        return !!fingerprint.primaryPayerType;
      case "prescribing":
        return !!fingerprint.prescribingLevel;
      case "delivery":
        return !!fingerprint.deliveryModel;
      case "priorities":
        return fingerprint.priorities.length > 0;
      default:
        return true;
    }
  }, [currentStep, fingerprint]);

  const handleNext = useCallback(() => {
    if (!hasStarted) {
      setHasStarted(true);
      trackFingerprintStart();
    }

    trackFingerprintStepComplete(currentStep, currentStepIndex + 1, STEP_ORDER.length);

    if (isLastStep) {
      trackFingerprintComplete(
        fingerprint.practiceType || "unknown",
        fingerprint.sizeBucket || "unknown",
        fingerprint.deliveryModel || "unknown"
      );
      onComplete(fingerprint);
    } else {
      setCurrentStep(STEP_ORDER[currentStepIndex + 1]);
    }
  }, [currentStep, currentStepIndex, fingerprint, hasStarted, isLastStep, onComplete]);

  const handleBack = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep(STEP_ORDER[currentStepIndex - 1]);
    }
  }, [currentStepIndex, isFirstStep]);

  const updateFingerprint = useCallback(
    <K extends keyof PracticeFingerprint>(key: K, value: PracticeFingerprint[K]) => {
      setFingerprint((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const toggleArrayItem = useCallback(
    <T,>(key: keyof PracticeFingerprint, item: T) => {
      setFingerprint((prev) => {
        const current = (prev[key] as T[]) || [];
        const exists = current.includes(item);
        const updated = exists
          ? current.filter((i) => i !== item)
          : [...current, item];
        return { ...prev, [key]: updated };
      });
    },
    []
  );

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Header */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-separator bg-surface px-4">
        <div className="flex items-center gap-3">
          <Building2 className="h-5 w-5 text-accent" />
          <span className="font-medium text-label-primary">Practice Profile</span>
        </div>

        {mode !== "build-for-me" && (
          <button
            onClick={onSkip}
            className="flex items-center gap-1.5 text-sm text-label-secondary hover:text-label-primary"
          >
            Skip for now
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </header>

      {/* Progress */}
      <div className="border-b border-separator bg-surface px-4 py-3">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center justify-between text-xs text-label-tertiary">
            <span>
              Step {currentStepIndex + 1} of {STEP_ORDER.length}
            </span>
            <span>{Math.round(((currentStepIndex + 1) / STEP_ORDER.length) * 100)}%</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-separator">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{
                width: `${((currentStepIndex + 1) / STEP_ORDER.length) * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 py-8">
        <div className="mx-auto max-w-xl">
          <h2 className="text-2xl font-semibold text-label-primary">
            {STEP_TITLES[currentStep]}
          </h2>
          <p className="mt-2 text-label-secondary">
            {STEP_DESCRIPTIONS[currentStep]}
          </p>

          <div className="mt-8">
            {/* Practice Type */}
            {currentStep === "practice-type" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.entries(PRACTICE_TYPE_LABELS) as [PracticeType, string][]).map(
                  ([value, label]) => (
                    <button
                      key={value}
                      onClick={() => updateFingerprint("practiceType", value)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        fingerprint.practiceType === value
                          ? "border-accent bg-accent/5"
                          : "border-separator hover:border-accent/50"
                      }`}
                    >
                      <span className="font-medium text-label-primary">{label}</span>
                    </button>
                  )
                )}
              </div>
            )}

            {/* Size */}
            {currentStep === "size" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.entries(PRACTICE_SIZE_LABELS) as [PracticeSizeBucket, string][]).map(
                  ([value, label]) => (
                    <button
                      key={value}
                      onClick={() => updateFingerprint("sizeBucket", value)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        fingerprint.sizeBucket === value
                          ? "border-accent bg-accent/5"
                          : "border-separator hover:border-accent/50"
                      }`}
                    >
                      <span className="font-medium text-label-primary">{label}</span>
                    </button>
                  )
                )}
              </div>
            )}

            {/* Clinical Roles */}
            {currentStep === "roles" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.entries(CLINICAL_ROLE_LABELS) as [ClinicalRole, string][]).map(
                  ([value, label]) => (
                    <button
                      key={value}
                      onClick={() => toggleArrayItem("clinicalRoles", value)}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                        fingerprint.clinicalRoles.includes(value)
                          ? "border-accent bg-accent/5"
                          : "border-separator hover:border-accent/50"
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded ${
                          fingerprint.clinicalRoles.includes(value)
                            ? "bg-accent text-white"
                            : "border border-separator"
                        }`}
                      >
                        {fingerprint.clinicalRoles.includes(value) && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      <span className="font-medium text-label-primary">{label}</span>
                    </button>
                  )
                )}
              </div>
            )}

            {/* Populations */}
            {currentStep === "populations" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.entries(POPULATION_LABELS) as [Population, string][]).map(
                  ([value, label]) => (
                    <button
                      key={value}
                      onClick={() => toggleArrayItem("populations", value)}
                      className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                        fingerprint.populations.includes(value)
                          ? "border-accent bg-accent/5"
                          : "border-separator hover:border-accent/50"
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 items-center justify-center rounded ${
                          fingerprint.populations.includes(value)
                            ? "bg-accent text-white"
                            : "border border-separator"
                        }`}
                      >
                        {fingerprint.populations.includes(value) && (
                          <Check className="h-3 w-3" />
                        )}
                      </div>
                      <span className="font-medium text-label-primary">{label}</span>
                    </button>
                  )
                )}
              </div>
            )}

            {/* Payers */}
            {currentStep === "payers" && (
              <div className="grid gap-3 sm:grid-cols-2">
                {(Object.entries(PAYER_TYPE_LABELS) as [PayerType, string][]).map(
                  ([value, label]) => (
                    <button
                      key={value}
                      onClick={() => updateFingerprint("primaryPayerType", value)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        fingerprint.primaryPayerType === value
                          ? "border-accent bg-accent/5"
                          : "border-separator hover:border-accent/50"
                      }`}
                    >
                      <span className="font-medium text-label-primary">{label}</span>
                    </button>
                  )
                )}
              </div>
            )}

            {/* Prescribing */}
            {currentStep === "prescribing" && (
              <div className="grid gap-3">
                {(
                  Object.entries(PRESCRIBING_LEVEL_LABELS) as [PrescribingLevel, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => updateFingerprint("prescribingLevel", value)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      fingerprint.prescribingLevel === value
                        ? "border-accent bg-accent/5"
                        : "border-separator hover:border-accent/50"
                    }`}
                  >
                    <span className="font-medium text-label-primary">{label}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Delivery Model */}
            {currentStep === "delivery" && (
              <div className="grid gap-3">
                {(Object.entries(DELIVERY_MODEL_LABELS) as [DeliveryModel, string][]).map(
                  ([value, label]) => (
                    <button
                      key={value}
                      onClick={() => updateFingerprint("deliveryModel", value)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        fingerprint.deliveryModel === value
                          ? "border-accent bg-accent/5"
                          : "border-separator hover:border-accent/50"
                      }`}
                    >
                      <span className="font-medium text-label-primary">{label}</span>
                    </button>
                  )
                )}
              </div>
            )}

            {/* Priorities */}
            {currentStep === "priorities" && (
              <>
                <p className="mb-4 text-sm text-label-tertiary">
                  {fingerprint.priorities.length}/3 selected
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(Object.entries(PRIORITY_LABELS) as [Priority, string][]).map(
                    ([value, label]) => {
                      const isSelected = fingerprint.priorities.includes(value);
                      const isDisabled =
                        fingerprint.priorities.length >= 3 && !isSelected;

                      return (
                        <button
                          key={value}
                          onClick={() => {
                            if (isSelected) {
                              toggleArrayItem("priorities", value);
                            } else if (fingerprint.priorities.length < 3) {
                              toggleArrayItem("priorities", value);
                            }
                          }}
                          disabled={isDisabled}
                          className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                            isSelected
                              ? "border-accent bg-accent/5"
                              : isDisabled
                              ? "cursor-not-allowed border-separator opacity-50"
                              : "border-separator hover:border-accent/50"
                          }`}
                        >
                          <div
                            className={`flex h-5 w-5 items-center justify-center rounded ${
                              isSelected
                                ? "bg-accent text-white"
                                : "border border-separator"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <span className="font-medium text-label-primary">{label}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-separator bg-surface px-4 py-4">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <button
            onClick={handleBack}
            disabled={isFirstStep}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              isFirstStep
                ? "cursor-not-allowed text-label-tertiary"
                : "text-label-secondary hover:text-label-primary"
            }`}
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`flex items-center gap-2 rounded-lg px-6 py-2 text-sm font-medium transition-all ${
              canProceed()
                ? "bg-accent text-white hover:bg-accent-hover"
                : "cursor-not-allowed bg-separator text-label-tertiary"
            }`}
          >
            {isLastStep ? "Get Recommendations" : "Continue"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </footer>
    </div>
  );
}
