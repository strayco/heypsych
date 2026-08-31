/**
 * SmartOnboarding Component
 *
 * Simplified onboarding - just asks clinician type then goes to workspace.
 */

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2 } from "lucide-react";
import {
  type PracticeFingerprint,
  type ClinicalRole,
  createEmptyFingerprint,
} from "@/domains/architect/schemas";
import {
  trackFingerprintStart,
  trackFingerprintComplete,
} from "@/domains/architect/analytics";

// Simple clinician type options
type ClinicianType = "therapy" | "meds" | "both";

const CLINICIAN_OPTIONS: { value: ClinicianType; label: string; description: string }[] = [
  { value: "therapy", label: "Therapy", description: "Therapist, counselor, social worker" },
  { value: "meds", label: "Prescribing", description: "Psychiatrist, NP, PA" },
  { value: "both", label: "Both", description: "Therapy + prescribing" },
];

// Map clinician type to actual clinical roles for the fingerprint
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
  const [selectedType, setSelectedType] = useState<ClinicianType | null>(null);

  const handleSelect = useCallback((type: ClinicianType) => {
    setSelectedType(type);

    // Auto-advance after brief visual feedback
    setTimeout(() => {
      const fingerprint = initialFingerprint || createEmptyFingerprint();

      // Set defaults based on clinician type to satisfy hasBuildForMeRequirements
      const practiceType = type === "therapy" ? "therapy-group" as const
        : type === "meds" ? "psychiatry" as const
        : "therapy-plus-psychiatry" as const;

      // Default priorities by clinician type
      const defaultPriorities = type === "therapy"
        ? ["ease-of-use" as const, "clinical-workflow" as const, "low-cost" as const]
        : type === "meds"
        ? ["clinical-workflow" as const, "billing-collections" as const, "ease-of-use" as const]
        : ["clinical-workflow" as const, "ease-of-use" as const, "billing-collections" as const];

      const updatedFingerprint: PracticeFingerprint = {
        ...fingerprint,
        clinicalRoles: mapToRoles(type),
        prescribingLevel: type === "therapy" ? "none" : "prescribing",
        // Set required fields for hasBuildForMeRequirements
        practiceType,
        sizeBucket: fingerprint.sizeBucket || "solo",
        primaryPayerType: fingerprint.primaryPayerType || "mixed",
        deliveryModel: fingerprint.deliveryModel || "hybrid",
        priorities: fingerprint.priorities.length >= 3 ? fingerprint.priorities : defaultPriorities,
      };

      trackFingerprintStart();
      trackFingerprintComplete(
        updatedFingerprint.practiceType || "unknown",
        updatedFingerprint.sizeBucket || "unknown",
        updatedFingerprint.deliveryModel || "unknown"
      );
      onComplete(updatedFingerprint);
    }, 200);
  }, [initialFingerprint, onComplete]);

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
          {/* Question header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-label-primary">
              What do you do?
            </h1>
            <p className="mt-2 text-lg text-label-secondary">
              This helps us show the right tools
            </p>
          </div>

          {/* Options */}
          <div className="mt-10 grid gap-4">
            {CLINICIAN_OPTIONS.map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => handleSelect(value)}
                className={`
                  flex flex-col rounded-2xl border-2 p-6 text-left transition-all
                  ${
                    selectedType === value
                      ? "border-accent bg-accent/5 shadow-sm"
                      : "border-separator hover:border-accent/50 hover:shadow-sm"
                  }
                `}
              >
                <span className="text-xl font-semibold text-label-primary">{label}</span>
                <span className="mt-1 text-sm text-label-secondary">{description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
