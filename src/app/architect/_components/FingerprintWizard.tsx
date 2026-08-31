// src/app/architect/_components/FingerprintWizard.tsx
// Simplified wizard - just asks clinician type then goes to workspace

"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2 } from "lucide-react";
import {
  type PracticeFingerprint,
  type ArchitectMode,
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

interface FingerprintWizardProps {
  initialFingerprint: PracticeFingerprint;
  mode: ArchitectMode;
  onComplete: (fingerprint: PracticeFingerprint) => void;
  onSkip: () => void;
}

export function FingerprintWizard({
  initialFingerprint,
  mode,
  onComplete,
  onSkip,
}: FingerprintWizardProps) {
  const [selectedType, setSelectedType] = useState<ClinicianType | null>(null);

  const handleSelect = useCallback((type: ClinicianType) => {
    setSelectedType(type);

    // Auto-advance after brief visual feedback
    setTimeout(() => {
      const fingerprint = initialFingerprint || createEmptyFingerprint();
      const updatedFingerprint: PracticeFingerprint = {
        ...fingerprint,
        clinicalRoles: mapToRoles(type),
        prescribingLevel: type === "therapy" ? "none" : "prescribing",
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
    <div className="min-h-screen bg-canvas flex flex-col">
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

        <button
          onClick={onSkip}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm text-label-secondary hover:text-label-primary transition-colors"
        >
          Skip
          <ArrowRight className="h-4 w-4" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-label-primary">
              What do you do?
            </h2>
            <p className="mt-2 text-label-secondary">
              This helps us show the right tools
            </p>
          </div>

          <div className="mt-8 grid gap-4">
            {CLINICIAN_OPTIONS.map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => handleSelect(value)}
                className={`flex flex-col rounded-xl border p-5 text-left transition-all ${
                  selectedType === value
                    ? "border-accent bg-accent/5"
                    : "border-separator hover:border-accent/50"
                }`}
              >
                <span className="text-lg font-semibold text-label-primary">{label}</span>
                <span className="mt-1 text-sm text-label-secondary">{description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
