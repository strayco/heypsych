"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { TriggeredInsightBeat, MicroIntervention } from "@/lib/psychTrail/types-v2";

interface InsightBeatCardProps {
  triggeredBeat: TriggeredInsightBeat;
  onContinue: () => void;
  onSelectIntervention?: (intervention: MicroIntervention) => void;
}

const VALENCE_STYLES = {
  positive: {
    border: "border-positive-600/20",
    bg: "bg-positive-tint",
    accent: "text-positive-600",
    accentBg: "bg-positive-500",
  },
  negative: {
    border: "border-caution-600/20",
    bg: "bg-caution-tint",
    accent: "text-caution",
    accentBg: "bg-caution-500",
  },
  mixed: {
    border: "border-accent-600/20",
    bg: "bg-accent-tint",
    accent: "text-accent",
    accentBg: "bg-accent-500",
  },
};

/**
 * InsightBeatCard - Elegant side-rail insight display
 *
 * Design principles:
 * - Lives in aside rail on desktop, below choices on mobile
 * - Secondary to main scenario - positioned, not intrusive
 * - Non-blocking - user can dismiss or continue via choices
 * - Sharp, memorable text
 * - Premium, minimal styling
 */
export function InsightBeatCard({
  triggeredBeat,
  onContinue,
  onSelectIntervention,
}: InsightBeatCardProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedIntervention, setSelectedIntervention] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const { beat, shouldShowInterventions, availableInterventions } = triggeredBeat;
  const style = VALENCE_STYLES[beat.valence];

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      setDismissed(true);
      onContinue();
    }, 150);
  };

  const handleSelectIntervention = (intervention: MicroIntervention) => {
    setSelectedIntervention(intervention.id);
    onSelectIntervention?.(intervention);
  };

  const hasInterventions = shouldShowInterventions && availableInterventions.length > 0;

  if (dismissed) return null;

  return (
    <div
      className={`
        relative rounded-xl border overflow-hidden
        ${style.border} ${style.bg}
        transform transition-all duration-200 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
      `}
    >
      {/* Left accent line */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${style.accentBg}`} />

      {/* Header */}
      <div className="pl-4 pr-3 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Label */}
            <span className={`text-xs font-medium uppercase tracking-wider ${style.accent}`}>
              {beat.userFacingLabel}
            </span>

            {/* Main insight text */}
            <p className="mt-2 text-sm text-label-primary leading-relaxed">
              {beat.insightText}
            </p>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg hover:bg-fill-secondary transition-colors shrink-0"
            aria-label="Dismiss"
          >
            <X className="h-3.5 w-3.5 text-label-primary0" />
          </button>
        </div>
      </div>

      {/* Support content */}
      {(hasInterventions || beat.whyItMatters) && (
        <div className="px-4 pb-4 pt-0 space-y-3">
          {/* Why it matters */}
          {beat.whyItMatters && (
            <p className="text-xs text-label-tertiary leading-relaxed">
              {beat.whyItMatters}
            </p>
          )}

          {/* Micro-interventions */}
          {hasInterventions && (
            <div className="pt-2 border-t border-separator/30">
              <p className="text-[10px] text-label-quaternary uppercase tracking-wider mb-2">
                If it helps
              </p>
              <div className="space-y-1.5">
                {availableInterventions.map((intervention) => (
                  <button
                    key={intervention.id}
                    onClick={() => handleSelectIntervention(intervention)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-xs
                      transition-all duration-150
                      ${selectedIntervention === intervention.id
                        ? "bg-fill-secondary text-label-primary ring-1 ring-separator"
                        : "bg-surface-grouped/30 text-label-tertiary hover:bg-surface-grouped/50 hover:text-label-secondary"
                      }
                    `}
                  >
                    {intervention.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default InsightBeatCard;
