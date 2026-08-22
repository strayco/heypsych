"use client";

import { useEffect, useState } from "react";
import { RotateCcw, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { InterpretationDisplay } from "./InterpretationDisplay";
import { UsefulnessSignal } from "./UsefulnessSignal";
import { trackRelatedClick } from "@/lib/analytics/product-events";
import type { InterpretationResult } from "@/lib/psychTrail/types-v2";

export interface EndOfRunSummaryProps {
  endingTitle: string;
  endingText: string;
  interpretation?: InterpretationResult | null;
  observations?: string[];
  relatedScenario?: {
    id: string;
    title: string;
    estimatedMinutes: number;
  } | null;
  scenarioId?: string;
  isFirstScenarioCompletion?: boolean;
  showUsefulnessSignal?: boolean;
  onReplay: () => void;
  onBackToScenarios: () => void;
  onPlayRelated?: () => void;
  onProceedToTransfer?: () => void;
  showTransferButton?: boolean;
  onCommitToRep?: (rep: string) => void;
}

export function EndOfRunSummary(props: EndOfRunSummaryProps) {
  const {
    endingTitle,
    endingText,
    interpretation,
    observations = [],
    relatedScenario,
    onReplay,
    onBackToScenarios,
    onPlayRelated,
    onProceedToTransfer,
    showTransferButton,
    onCommitToRep,
    scenarioId,
    isFirstScenarioCompletion,
    showUsefulnessSignal,
  } = props;

  const [usefulnessDismissed, setUsefulnessDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-xl px-4 py-10 sm:py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-sm font-medium text-label-primary0 mb-3">Practice Complete</p>
          <h1 className="text-2xl font-semibold text-label-primary sm:text-3xl">{endingTitle}</h1>
        </div>

        {/* Ending Narrative */}
        <div className="rounded-2xl bg-surface-grouped border border-separator p-6 mb-8 shadow-card-2">
          <p className="text-label-secondary leading-relaxed">{endingText}</p>
        </div>

        {/* Observations - What You Practiced */}
        {observations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-label-tertiary mb-4">
              What you practiced
            </h2>
            <div className="space-y-2.5">
              {observations.map((observation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 rounded-xl bg-surface border border-separator/30 px-4 py-3.5"
                >
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-positive-600/20 shrink-0 mt-0.5">
                    <Check className="h-3 w-3 text-positive-600" />
                  </div>
                  <p className="text-sm text-label-secondary">{observation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interpretation - Therapeutic Reflection */}
        {interpretation && (
          <div className="mb-8">
            <InterpretationDisplay
              interpretation={interpretation}
              onTryNextRep={onCommitToRep}
            />
          </div>
        )}

        {/* PMF Signal */}
        {showUsefulnessSignal && scenarioId && !usefulnessDismissed && (
          <div className="mb-8">
            <UsefulnessSignal
              scenarioId={scenarioId}
              isFirstCompletion={isFirstScenarioCompletion ?? true}
              onComplete={() => setUsefulnessDismissed(true)}
            />
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-3 pt-4">
          {showTransferButton && onProceedToTransfer ? (
            <>
              {/* Campus Mode: Transfer first */}
              <button
                onClick={onProceedToTransfer}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-canvas-elevated text-label-primary font-semibold transition-all hover:bg-white shadow-medium hover:shadow-large"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={onReplay}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-surface-grouped border border-separator text-label-secondary font-medium transition-all hover:bg-fill-secondary hover:border-separator"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Practice Again</span>
              </button>
            </>
          ) : (
            <>
              {/* Primary: Practice Again */}
              <button
                onClick={onReplay}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-canvas-elevated text-label-primary font-semibold transition-all hover:bg-white shadow-medium hover:shadow-large"
              >
                <RotateCcw className="h-4 w-4" />
                <span>Practice Again</span>
              </button>

              {/* Secondary: Try Another Scenario */}
              {relatedScenario && onPlayRelated && (
                <button
                  onClick={() => {
                    if (scenarioId) {
                      trackRelatedClick(scenarioId, relatedScenario.id);
                    }
                    onPlayRelated();
                  }}
                  className="w-full flex items-center justify-between py-3.5 px-5 rounded-xl bg-surface-grouped border border-separator text-label-secondary transition-all hover:bg-fill-secondary hover:border-separator group"
                >
                  <div className="flex flex-col items-start">
                    <span className="text-xs text-label-primary0 mb-0.5">Try another scenario</span>
                    <span className="font-medium text-label-primary group-hover:text-label-primary">{relatedScenario.title}</span>
                  </div>
                  <span className="text-sm text-label-primary0">{relatedScenario.estimatedMinutes} min</span>
                </button>
              )}

              {/* Back Link */}
              <button
                onClick={onBackToScenarios}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-label-primary0 hover:text-label-secondary transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Scenarios</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
