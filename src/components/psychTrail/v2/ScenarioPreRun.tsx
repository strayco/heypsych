"use client";

import { useEffect } from "react";
import { Play, RotateCcw, Clock, ChevronLeft } from "lucide-react";

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: "text-positive-600",
  intermediate: "text-caution",
  advanced: "text-negative",
};

export interface ScenarioPreRunProps {
  scenario: {
    id: string;
    title: string;
    summary: string;
    difficulty: string;
    estimatedMinutes: number;
    stuckMoment?: string;
    practiceAreas?: string[];
  };
  hasBeenPlayed?: boolean;
  completionCount?: number;
  onStartRun: () => void;
  onBack: () => void;
}

export function ScenarioPreRun({
  scenario,
  hasBeenPlayed = false,
  completionCount = 0,
  onStartRun,
  onBack,
}: ScenarioPreRunProps) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-xl px-4 py-8">
        {/* Back Link */}
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-label-primary0 hover:text-label-secondary transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to scenarios
        </button>

        {/* Scenario Title */}
        <h1 className="text-2xl font-semibold text-label-primary tracking-tight sm:text-3xl">
          {scenario.title}
        </h1>

        {/* Summary */}
        <p className="mt-4 text-label-secondary leading-relaxed">
          {scenario.summary}
        </p>

        {/* Practice explanation */}
        {scenario.stuckMoment && (
          <p className="mt-4 text-sm text-label-primary0 leading-relaxed">
            Practice{" "}
            <span className="text-label-tertiary">{scenario.stuckMoment.toLowerCase()}</span>.
          </p>
        )}

        {/* Metadata */}
        <div className="mt-6 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1.5 text-label-tertiary">
            <Clock className="h-4 w-4 text-label-primary0" />
            ~{scenario.estimatedMinutes} min
          </span>
          <span className={DIFFICULTY_COLORS[scenario.difficulty] || "text-label-tertiary"}>
            {DIFFICULTY_LABELS[scenario.difficulty] || scenario.difficulty}
          </span>
        </div>

        {/* What to Practice */}
        {scenario.practiceAreas && scenario.practiceAreas.length > 0 && (
          <div className="mt-8 rounded-xl bg-surface border border-separator/30 p-5">
            <h2 className="text-sm font-medium text-label-tertiary mb-3">
              What you'll practice
            </h2>
            <ul className="space-y-2.5">
              {scenario.practiceAreas.slice(0, 3).map((area, index) => (
                <li key={index} className="flex items-start gap-3 text-sm text-label-secondary">
                  <span className="mt-1.5 h-1 w-1 rounded-full bg-accent-500 shrink-0" />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* CTA Buttons */}
        <div className="mt-10 space-y-3">
          {hasBeenPlayed ? (
            <>
              <button
                onClick={() => onStartRun()}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-canvas-elevated text-label-primary font-semibold transition-all hover:bg-white shadow-medium hover:shadow-large"
              >
                <Play className="h-4 w-4" />
                Continue Practicing
              </button>
              <button
                onClick={() => onStartRun()}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-surface-grouped border border-separator text-label-secondary font-medium transition-all hover:bg-fill-secondary hover:border-separator"
              >
                <RotateCcw className="h-4 w-4" />
                Start Fresh
              </button>
              {completionCount > 0 && (
                <p className="text-center text-xs text-label-quaternary mt-2">
                  Practiced {completionCount} time{completionCount !== 1 ? "s" : ""}
                </p>
              )}
            </>
          ) : (
            <button
              onClick={() => onStartRun()}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl bg-canvas-elevated text-label-primary font-semibold transition-all hover:bg-white shadow-medium hover:shadow-large"
            >
              <Play className="h-4 w-4" />
              Start Practice
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
