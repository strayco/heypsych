"use client";

import { useEffect } from "react";
import { ChevronLeft, Check, Circle, HelpCircle, Star, Trophy, Target, Sparkles } from "lucide-react";
import type { MasteryDashboardProps } from "./contracts";

const TIER_COLORS: Record<string, { text: string; bg: string; border: string }> = {
  none: { text: "text-label-tertiary", bg: "bg-surface-grouped", border: "border-separator" },
  bronze: { text: "text-amber-400", bg: "bg-amber-900/20", border: "border-amber-700/30" },
  silver: { text: "text-label-secondary", bg: "bg-fill-tertiary/30", border: "border-separator" },
  gold: { text: "text-amber-300", bg: "bg-amber-800/20", border: "border-amber-600/30" },
  platinum: { text: "text-cyan-300", bg: "bg-cyan-900/20", border: "border-cyan-600/30" },
};

const GRADE_COLORS: Record<string, string> = {
  S: "text-amber-300",
  A: "text-positive-600",
  B: "text-accent",
  C: "text-caution",
  D: "text-orange-400",
  F: "text-negative",
};

export function MasteryDashboard(props: MasteryDashboardProps) {
  const { scenarioTitle, tier, bestRun, routes, objectives, challenges, nextTierRequirements, onPlayAgain, onBack } = props;
  const tierStyle = TIER_COLORS[tier];

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-label-primary px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-label-tertiary hover:text-label-secondary transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-label-primary">{scenarioTitle}</h1>
          <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${tierStyle.bg} ${tierStyle.border}`}>
            <Trophy className={`h-4 w-4 ${tierStyle.text}`} />
            <span className={`text-sm font-medium capitalize ${tierStyle.text}`}>{tier} Mastery</span>
          </div>
        </div>

        {/* Best Run */}
        {bestRun && (
          <div className="rounded-xl bg-surface-grouped border border-separator p-5">
            <h3 className="text-xs font-medium text-label-primary0 uppercase tracking-wider mb-4">Best Run</h3>
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className={`text-4xl font-bold ${GRADE_COLORS[bestRun.grade]}`}>{bestRun.grade}</div>
                <p className="text-xs text-label-primary0 mt-1">Grade</p>
              </div>
              <div className="text-center">
                <div className="flex gap-1 justify-center">
                  {[1, 2, 3].map((i) => (
                    <Star
                      key={i}
                      className={`h-6 w-6 ${
                        i <= bestRun.stars
                          ? "text-amber-400 fill-amber-400"
                          : "text-label-tertiary"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-label-primary0 mt-1">Stars</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-semibold text-label-primary">{bestRun.score}</div>
                <p className="text-xs text-label-primary0 mt-1">Score</p>
              </div>
            </div>
          </div>
        )}

        {/* Routes */}
        <div className="rounded-xl bg-surface-grouped border border-separator p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-label-secondary">Routes Discovered</h3>
            <span className="text-sm text-label-tertiary">{routes.percentage}%</span>
          </div>
          <div className="h-1.5 bg-fill-tertiary rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-accent-500 rounded-full transition-all duration-500"
              style={{ width: `${routes.percentage}%` }}
            />
          </div>
          <div className="space-y-3">
            {routes.discovered.map((r) => (
              <div key={r.id} className="flex items-start gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-positive-600/20 shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-positive-600" />
                </div>
                <div>
                  <div className="text-sm font-medium text-label-primary">{r.name}</div>
                  <div className="text-xs text-label-primary0">{r.description}</div>
                </div>
              </div>
            ))}
            {routes.hidden.map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-accent-600/20 shrink-0 mt-0.5">
                  <HelpCircle className="h-3 w-3 text-accent" />
                </div>
                <div>
                  <div className="text-sm font-medium text-accent-700">Hidden Route</div>
                  {r.hint && <div className="text-xs text-label-primary0 italic">{r.hint}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Objectives */}
        <div className="rounded-xl bg-surface-grouped border border-separator p-5">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-4 w-4 text-label-tertiary" />
            <h3 className="text-sm font-medium text-label-secondary">Objectives</h3>
          </div>
          <div className="space-y-2.5">
            {objectives.completed.map((o) => (
              <div key={o.id} className="flex items-center gap-3 text-sm">
                <Check className="h-4 w-4 text-positive-600 shrink-0" />
                <span className="text-label-secondary">{o.title}</span>
              </div>
            ))}
            {objectives.remaining.map((o) => (
              <div key={o.id} className="flex items-center gap-3 text-sm">
                <Circle className="h-4 w-4 text-label-quaternary shrink-0" />
                <span className="text-label-primary0">{o.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Challenges */}
        <div className="rounded-xl bg-surface-grouped border border-separator p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-label-tertiary" />
            <h3 className="text-sm font-medium text-label-secondary">Challenges</h3>
          </div>
          <div className="space-y-2.5">
            {challenges.completed.map((c) => (
              <div key={c.id} className="flex items-center gap-3 text-sm">
                <Check className="h-4 w-4 text-cyan-400 shrink-0" />
                <span className="text-label-secondary">{c.title}</span>
              </div>
            ))}
            {challenges.remaining.map((c) => (
              <div key={c.id} className="flex items-center gap-3 text-sm">
                <Circle className="h-4 w-4 text-label-quaternary shrink-0" />
                <span className="text-label-primary0">{c.title}</span>
              </div>
            ))}
            {challenges.completed.length === 0 && challenges.remaining.length === 0 && (
              <p className="text-sm text-label-primary0">No challenges available</p>
            )}
          </div>
        </div>

        {/* Next Tier */}
        {nextTierRequirements.length > 0 && tier !== "platinum" && (
          <div className="rounded-xl bg-surface border border-separator/30 p-5">
            <h3 className="text-sm font-medium text-label-secondary mb-4">To reach next tier</h3>
            <div className="space-y-2.5">
              {nextTierRequirements.map((r, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  {r.met ? (
                    <Check className="h-4 w-4 text-positive-600 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-label-quaternary shrink-0" />
                  )}
                  <span className={r.met ? "text-label-secondary" : "text-label-primary0"}>{r.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="pt-4">
          <button
            onClick={onPlayAgain}
            className="w-full py-3.5 rounded-xl bg-canvas-elevated text-label-primary font-semibold transition-all hover:bg-white shadow-medium hover:shadow-large"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}
