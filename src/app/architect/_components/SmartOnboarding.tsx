/**
 * SmartOnboarding Component
 *
 * Multi-step onboarding that asks the key questions affecting recommendations.
 * Phase 1 remediation: Removed silent defaults - now explicitly asks:
 * 1. Clinician type (therapy/prescribing/both)
 * 2. Practice size (solo/small/medium/large)
 * 3. Primary payer model (cash/insurance/mixed)
 * 4. Delivery model (in-person/telehealth/hybrid)
 */

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, ChevronLeft } from "lucide-react";
import {
  type PracticeFingerprint,
  type ClinicalRole,
  type PracticeSizeBucket,
  type PayerType,
  type DeliveryModel,
  type Priority,
  createEmptyFingerprint,
} from "@/domains/architect/schemas";
import {
  trackFingerprintStart,
  trackFingerprintComplete,
} from "@/domains/architect/analytics";

// ============================================================================
// STEP 1: Clinician Type
// ============================================================================

type ClinicianType = "therapy" | "meds" | "both";

const CLINICIAN_OPTIONS: { value: ClinicianType; label: string; description: string }[] = [
  { value: "therapy", label: "Therapy", description: "Therapist, counselor, social worker" },
  { value: "meds", label: "Prescribing", description: "Psychiatrist, NP, PA" },
  { value: "both", label: "Both", description: "Therapy + prescribing" },
];

function mapToRoles(type: ClinicianType): ClinicalRole[] {
  switch (type) {
    case "therapy":
      return ["therapist"];
    case "meds":
      return ["psychiatrist"];
    case "both":
      return ["therapist", "psychiatrist"];
  }
}

// ============================================================================
// STEP 2: Practice Size
// ============================================================================

type SimplifiedSize = "solo" | "small" | "medium" | "large";

const SIZE_OPTIONS: { value: SimplifiedSize; label: string; description: string }[] = [
  { value: "solo", label: "Solo", description: "Just me" },
  { value: "small", label: "Small", description: "2-10 providers" },
  { value: "medium", label: "Medium", description: "11-50 providers" },
  { value: "large", label: "Large", description: "50+ providers" },
];

function mapToSizeBucket(size: SimplifiedSize): PracticeSizeBucket {
  switch (size) {
    case "solo":
      return "solo";
    case "small":
      return "2-5";
    case "medium":
      return "11-25";
    case "large":
      return "51-100";
  }
}

// ============================================================================
// STEP 3: Payer Model
// ============================================================================

type SimplifiedPayer = "cash" | "insurance" | "mixed";

const PAYER_OPTIONS: { value: SimplifiedPayer; label: string; description: string }[] = [
  { value: "cash", label: "Private pay", description: "Mostly out-of-pocket" },
  { value: "insurance", label: "Insurance", description: "Mostly insurance billing" },
  { value: "mixed", label: "Mixed", description: "Both private pay and insurance" },
];

function mapToPayerType(payer: SimplifiedPayer): PayerType {
  switch (payer) {
    case "cash":
      return "cash";
    case "insurance":
      return "commercial-insurance";
    case "mixed":
      return "mixed";
  }
}

// ============================================================================
// STEP 4: Delivery Model
// ============================================================================

const DELIVERY_OPTIONS: { value: DeliveryModel; label: string; description: string }[] = [
  { value: "in-person", label: "In-person", description: "Office-based only" },
  { value: "telehealth", label: "Telehealth", description: "Virtual only" },
  { value: "hybrid", label: "Hybrid", description: "Both in-person and virtual" },
];

// ============================================================================
// STEP DEFINITIONS
// ============================================================================

type OnboardingStep = "clinician" | "size" | "payer" | "delivery";

const STEPS: OnboardingStep[] = ["clinician", "size", "payer", "delivery"];

const STEP_META: Record<OnboardingStep, { title: string; subtitle: string }> = {
  clinician: { title: "What do you do?", subtitle: "This helps us show the right tools" },
  size: { title: "How big is your practice?", subtitle: "Affects pricing and feature needs" },
  payer: { title: "How do clients pay?", subtitle: "Affects billing and admin features" },
  delivery: { title: "How do you deliver care?", subtitle: "Affects telehealth and scheduling needs" },
};

// ============================================================================
// COMPONENT
// ============================================================================

interface SmartOnboardingProps {
  initialFingerprint?: PracticeFingerprint;
  onComplete: (fingerprint: PracticeFingerprint) => void;
  onSkip?: () => void;
}

export function SmartOnboarding({
  initialFingerprint,
  onComplete,
  onSkip,
}: SmartOnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>("clinician");
  const [clinicianType, setClinicianType] = useState<ClinicianType | null>(null);
  const [practiceSize, setPracticeSize] = useState<SimplifiedSize | null>(null);
  const [payerModel, setPayerModel] = useState<SimplifiedPayer | null>(null);
  const [deliveryModel, setDeliveryModel] = useState<DeliveryModel | null>(null);

  const stepIndex = STEPS.indexOf(step);
  const isFirstStep = stepIndex === 0;
  const { title, subtitle } = STEP_META[step];

  // Go back to previous step
  const goBack = useCallback(() => {
    if (stepIndex > 0) {
      setStep(STEPS[stepIndex - 1]);
    }
  }, [stepIndex]);

  // Complete onboarding and build fingerprint from explicit answers
  const completeOnboarding = useCallback(() => {
    if (!clinicianType || !practiceSize || !payerModel || !deliveryModel) return;

    const fingerprint = initialFingerprint || createEmptyFingerprint();

    // Derive practice type from clinician type (transparent derivation, not hidden default)
    const practiceType = clinicianType === "therapy"
      ? "therapy-group" as const
      : clinicianType === "meds"
        ? "psychiatry" as const
        : "therapy-plus-psychiatry" as const;

    // Derive priorities from clinician type (transparent, role-based defaults)
    const priorities: Priority[] = clinicianType === "therapy"
      ? ["ease-of-use", "clinical-workflow", "low-cost"]
      : clinicianType === "meds"
        ? ["clinical-workflow", "billing-collections", "ease-of-use"]
        : ["clinical-workflow", "ease-of-use", "billing-collections"];

    const updatedFingerprint: PracticeFingerprint = {
      ...fingerprint,
      clinicalRoles: mapToRoles(clinicianType),
      prescribingLevel: clinicianType === "therapy" ? "none" : "prescribing",
      practiceType,
      sizeBucket: mapToSizeBucket(practiceSize),
      primaryPayerType: mapToPayerType(payerModel),
      deliveryModel,
      priorities: fingerprint.priorities.length >= 3 ? fingerprint.priorities : priorities,
    };

    trackFingerprintStart();
    trackFingerprintComplete(
      updatedFingerprint.practiceType || "unknown",
      updatedFingerprint.sizeBucket || "unknown",
      updatedFingerprint.deliveryModel || "unknown"
    );
    onComplete(updatedFingerprint);
  }, [clinicianType, practiceSize, payerModel, deliveryModel, initialFingerprint, onComplete]);

  // Handle selection and advance to next step
  const handleClinicianSelect = (type: ClinicianType) => {
    setClinicianType(type);
    setTimeout(() => setStep("size"), 150);
  };

  const handleSizeSelect = (size: SimplifiedSize) => {
    setPracticeSize(size);
    setTimeout(() => setStep("payer"), 150);
  };

  const handlePayerSelect = (payer: SimplifiedPayer) => {
    setPayerModel(payer);
    setTimeout(() => setStep("delivery"), 150);
  };

  const handleDeliverySelect = (delivery: DeliveryModel) => {
    setDeliveryModel(delivery);
    setTimeout(() => completeOnboarding(), 150);
  };

  // Render current step's options
  const renderOptions = () => {
    switch (step) {
      case "clinician":
        return CLINICIAN_OPTIONS.map(({ value, label, description }) => (
          <OptionButton
            key={value}
            label={label}
            description={description}
            selected={clinicianType === value}
            onClick={() => handleClinicianSelect(value)}
          />
        ));
      case "size":
        return SIZE_OPTIONS.map(({ value, label, description }) => (
          <OptionButton
            key={value}
            label={label}
            description={description}
            selected={practiceSize === value}
            onClick={() => handleSizeSelect(value)}
          />
        ));
      case "payer":
        return PAYER_OPTIONS.map(({ value, label, description }) => (
          <OptionButton
            key={value}
            label={label}
            description={description}
            selected={payerModel === value}
            onClick={() => handlePayerSelect(value)}
          />
        ));
      case "delivery":
        return DELIVERY_OPTIONS.map(({ value, label, description }) => (
          <OptionButton
            key={value}
            label={label}
            description={description}
            selected={deliveryModel === value}
            onClick={() => handleDeliverySelect(value)}
          />
        ));
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-separator bg-surface px-6">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm text-label-secondary hover:text-label-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <div className="h-4 w-px bg-separator" />
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-accent" />
            <span className="font-semibold text-label-primary">Practice Architect</span>
          </div>
        </div>

        {onSkip && (
          <button
            onClick={onSkip}
            className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-label-secondary hover:text-label-primary transition-colors"
          >
            Skip
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </header>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Progress indicator */}
          <div className="mb-8 flex justify-center gap-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 w-8 rounded-full transition-colors ${
                  i <= stepIndex ? "bg-accent" : "bg-separator"
                }`}
              />
            ))}
          </div>

          {/* Back button (not on first step) */}
          {!isFirstStep && (
            <button
              onClick={goBack}
              className="mb-4 flex items-center gap-1 text-sm text-label-secondary hover:text-label-primary transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </button>
          )}

          {/* Question header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-label-primary">
              {title}
            </h1>
            <p className="mt-2 text-lg text-label-secondary">
              {subtitle}
            </p>
          </div>

          {/* Options */}
          <div className="mt-10 grid gap-4">
            {renderOptions()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// OPTION BUTTON COMPONENT
// ============================================================================

interface OptionButtonProps {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

function OptionButton({ label, description, selected, onClick }: OptionButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col rounded-2xl border-2 p-6 text-left transition-all
        ${
          selected
            ? "border-accent bg-accent/5 shadow-sm"
            : "border-separator hover:border-accent/50 hover:shadow-sm"
        }
      `}
    >
      <span className="text-xl font-semibold text-label-primary">{label}</span>
      <span className="mt-1 text-sm text-label-secondary">{description}</span>
    </button>
  );
}
