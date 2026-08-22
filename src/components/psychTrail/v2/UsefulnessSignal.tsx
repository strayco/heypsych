"use client";

import { useState } from "react";
import { trackUsefulnessSignal } from "@/lib/analytics/product-events";

type UsefulnessRating = "yes" | "somewhat" | "not_really";

interface UsefulnessSignalProps {
  scenarioId: string;
  isFirstCompletion: boolean;
  onComplete: () => void;
}

const RATING_OPTIONS: { value: UsefulnessRating; label: string }[] = [
  { value: "yes", label: "Yes" },
  { value: "somewhat", label: "Somewhat" },
  { value: "not_really", label: "Not really" },
];

/**
 * Tiny, in-flow usefulness signal.
 * Appears once per scenario after first completion.
 * Separates "interesting" from "genuinely useful".
 */
export function UsefulnessSignal({
  scenarioId,
  isFirstCompletion,
  onComplete,
}: UsefulnessSignalProps) {
  const [selected, setSelected] = useState<UsefulnessRating | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (rating: UsefulnessRating) => {
    setSelected(rating);
    trackUsefulnessSignal(scenarioId, rating, isFirstCompletion);
    setSubmitted(true);
    setTimeout(onComplete, 800);
  };

  if (submitted) {
    return (
      <div className="rounded-xl bg-surface/50 border border-separator/30 p-4 text-center">
        <p className="text-sm text-label-tertiary">Thanks for the feedback</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface-grouped border border-separator p-5">
      <p className="text-sm text-label-secondary mb-4 text-center">
        Did this feel useful for something real?
      </p>
      <div className="flex gap-2 justify-center">
        {RATING_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              selected === option.value
                ? "bg-accent-600 text-white"
                : "bg-fill-secondary text-label-secondary border border-separator hover:bg-fill-tertiary hover:text-label-primary"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
