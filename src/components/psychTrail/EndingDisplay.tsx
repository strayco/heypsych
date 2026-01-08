"use client";

/**
 * PsychTrails - Ending Display Component
 *
 * Shows scenario completion with rewards (XP, confidence gain, insight card).
 * Uses renderer for text, calls onComplete callback to save progress.
 */

import { useEffect, useState } from "react";
import type { Ending, RunState, Tile, ScenarioCompletionResult } from "@/lib/psychTrail/types";
import type { IRenderer } from "@/lib/psychTrail/renderer";
import { Trophy, Award, Star, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { calculateCompletionResult, getInsightCard } from "@/lib/psychTrail/rewards";
import { getTileProgress } from "@/lib/psychTrail/storage";

interface EndingDisplayProps {
  ending: Ending;
  stepNumber: number;
  stepLabel: string;
  renderer: IRenderer;
  state: RunState;
  tile: Tile;
  onRestart?: () => void;
  onComplete?: (result: ScenarioCompletionResult) => void;
  className?: string;
}

export function EndingDisplay({
  ending,
  stepNumber,
  stepLabel,
  renderer,
  state,
  tile,
  onRestart,
  onComplete,
  className = "",
}: EndingDisplayProps) {
  const [rewards, setRewards] = useState<ScenarioCompletionResult | null>(null);

  useEffect(() => {
    // Calculate rewards when component mounts
    const tileProgress = getTileProgress(tile.id);
    const result = calculateCompletionResult(
      state,
      tile.scenarioId,
      ending.isPositive ?? true,
      tileProgress.completions
    );
    setRewards(result);

    // Call onComplete callback if provided
    if (onComplete) {
      onComplete(result);
    }
  }, [state, ending, tile, onComplete]);

  const insightCard = rewards?.insightCardId ? getInsightCard(rewards.insightCardId) : null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full ${
            ending.isPositive
              ? "bg-gradient-to-br from-green-100 to-emerald-100"
              : "bg-gradient-to-br from-blue-100 to-purple-100"
          }`}
        >
          {ending.isPositive ? (
            <Trophy className="h-8 w-8 text-green-600" />
          ) : (
            <Award className="h-8 w-8 text-purple-600" />
          )}
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-700">
            Journey Complete • {stepLabel.charAt(0).toUpperCase() + stepLabel.slice(1)} {stepNumber}
          </div>
          <h2 className="text-2xl font-bold text-neutral-900">
            {renderer.renderEndingTitle(ending, state)}
          </h2>
        </div>
      </div>

      {/* Ending Text */}
      <div className="prose prose-neutral max-w-none rounded-lg border border-neutral-200 bg-neutral-50 p-6">
        {renderer.renderEndingText(ending, state).split("\n\n").map((paragraph, i) => (
          <p key={i} className="mb-3 last:mb-0 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Rewards Panel */}
      {rewards && (
        <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-6 shadow-md">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-bold text-purple-900">Rewards Earned</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* XP Earned */}
            <div className="rounded-lg bg-white p-4 text-center shadow-sm">
              <div className="mb-2 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-purple-600">+{rewards.xpEarned}</div>
              <div className="text-xs font-medium uppercase tracking-wide text-neutral-600">
                XP Earned
              </div>
            </div>

            {/* Confidence Gain */}
            <div className="rounded-lg bg-white p-4 text-center shadow-sm">
              <div className="mb-2 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">+{rewards.confidenceGain}</div>
              <div className="text-xs font-medium uppercase tracking-wide text-neutral-600">
                Confidence Here
              </div>
            </div>

            {/* Insight Card */}
            {insightCard && (
              <div className="rounded-lg bg-white p-4 text-center shadow-sm">
                <div className="mb-2 flex justify-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                    <Sparkles className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="text-sm font-bold text-blue-900">{insightCard.title}</div>
                <div className="mt-1 text-xs text-neutral-600 line-clamp-2">
                  {insightCard.text}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-center gap-4 pt-4">
        <Button onClick={onRestart} variant="outline" size="lg">
          Play Again
        </Button>
        <Button
          onClick={() => window.location.href = "/psychtrails/map"}
          size="lg"
          className="min-w-[200px]"
        >
          Return to Map
        </Button>
      </div>
    </div>
  );
}
