/**
 * Profile Prompt
 *
 * Progressive profiling prompt shown after 1-2 decisions.
 * Collects: practice type, size, payment model.
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { X, ChevronRight } from "lucide-react";
import type {
  PracticeProfile,
  PracticeType,
  PracticeSize,
  PaymentModel,
} from "@/domains/architect/schemas/practice-v2";

interface ProfilePromptProps {
  onUpdateProfile: (profile: Partial<PracticeProfile>) => void;
  onDismiss: () => void;
}

type ProfileStep = "type" | "size" | "payment" | "done";

export function ProfilePrompt({
  onUpdateProfile,
  onDismiss,
}: ProfilePromptProps) {
  const [step, setStep] = useState<ProfileStep>("type");
  const [profile, setProfile] = useState<Partial<PracticeProfile>>({});

  const handleSelect = (
    field: keyof PracticeProfile,
    value: PracticeType | PracticeSize | PaymentModel
  ) => {
    const newProfile = { ...profile, [field]: value };
    setProfile(newProfile);
    onUpdateProfile({ [field]: value });

    // Move to next step
    if (field === "practiceType") {
      setStep("size");
    } else if (field === "size") {
      setStep("payment");
    } else {
      setStep("done");
      setTimeout(onDismiss, 1000);
    }
  };

  const handleSkip = () => {
    onDismiss();
  };

  return (
    <motion.div
      className="mt-8 rounded-2xl border border-accent/20 bg-accent/5 p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-label-primary">
            Make these recommendations better
          </h3>
          <p className="mt-1 text-sm text-label-secondary">
            Tell us about your practice for personalized suggestions.
          </p>
        </div>
        <button
          onClick={handleSkip}
          className="rounded-lg p-1.5 text-label-tertiary transition-colors hover:bg-fill-secondary hover:text-label-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Steps */}
      {step === "type" && (
        <ProfileQuestion
          question="What kind of practice are you building?"
          options={[
            { value: "therapist", label: "Therapist", description: "Counseling, therapy, social work" },
            { value: "psychiatrist", label: "Psychiatrist", description: "Medication management, psychiatry" },
            { value: "both", label: "Both", description: "Therapy and psychiatry combined" },
          ]}
          onSelect={(value) => handleSelect("practiceType", value as PracticeType)}
          onSkip={handleSkip}
        />
      )}

      {step === "size" && (
        <ProfileQuestion
          question="How many providers?"
          options={[
            { value: "solo", label: "Solo", description: "Just me" },
            { value: "2-5", label: "2–5", description: "Small group" },
            { value: "6-20", label: "6–20", description: "Growing practice" },
          ]}
          onSelect={(value) => handleSelect("size", value as PracticeSize)}
          onSkip={handleSkip}
        />
      )}

      {step === "payment" && (
        <ProfileQuestion
          question="How do patients pay?"
          options={[
            { value: "cash", label: "Cash", description: "Private pay only" },
            { value: "insurance", label: "Insurance", description: "Insurance billing" },
            { value: "both", label: "Both", description: "Mixed payment model" },
          ]}
          onSelect={(value) => handleSelect("paymentModel", value as PaymentModel)}
          onSkip={handleSkip}
        />
      )}

      {step === "done" && (
        <motion.div
          className="text-center py-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="text-sm font-medium text-positive">
            ✓ Recommendations updated
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}

function ProfileQuestion({
  question,
  options,
  onSelect,
  onSkip,
}: {
  question: string;
  options: Array<{ value: string; label: string; description: string }>;
  onSelect: (value: string) => void;
  onSkip: () => void;
}) {
  return (
    <div>
      <p className="mb-3 text-sm font-medium text-label-primary">{question}</p>
      <div className="grid gap-2 sm:grid-cols-3">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className="flex flex-col items-start rounded-xl border border-separator bg-surface p-3 text-left transition-all hover:border-accent hover:bg-accent/5"
          >
            <span className="text-sm font-semibold text-label-primary">
              {option.label}
            </span>
            <span className="mt-0.5 text-xs text-label-secondary">
              {option.description}
            </span>
          </button>
        ))}
      </div>
      <button
        onClick={onSkip}
        className="mt-3 flex items-center gap-1 text-xs text-label-tertiary transition-colors hover:text-label-secondary"
      >
        Skip for now
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}
