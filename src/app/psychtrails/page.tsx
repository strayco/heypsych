"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Clock } from "lucide-react";
import { getPackRegistry } from "@/lib/psychTrail/pack-registry";
import {
  getProgressState,
  getScenarioProgress,
  isReturningUser,
} from "@/lib/psychTrail/storage-v2";
import { trackScenarioStart, trackSecondScenarioStart, trackReturnVisit, trackFeaturedShown, trackFeaturedClick } from "@/lib/analytics/product-events";
import { FEATURED_SCENARIO_ID } from "@/lib/psychTrail/constants";
import type { ScenarioV2 } from "@/lib/psychTrail/types-v2";

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export default function PsychTrailsPage() {
  const router = useRouter();
  const registry = getPackRegistry();
  const [isReturning, setIsReturning] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);
  const [practiceCount, setPracticeCount] = useState(0);
  const [scenariosCompleted, setScenariosCompleted] = useState(0);
  const [scenarioHasBeenPlayed, setScenarioHasBeenPlayed] = useState<Record<string, boolean>>({});
  const [featuredTracked, setFeaturedTracked] = useState(false);

  const allScenarios = registry.getAllScenarios() as ScenarioV2[];

  useEffect(() => {
    const progress = getProgressState();
    const hasAnyProgress = progress.global.totalRuns > 0;
    setHasProgress(hasAnyProgress);
    setIsReturning(isReturningUser());
    setPracticeCount(progress.global.totalRuns);
    setScenariosCompleted(progress.global.totalScenariosCompleted);

    // Track return visits for analytics
    if (hasAnyProgress && progress.global.lastPlayAt) {
      const daysSinceLast = Math.floor((Date.now() - progress.global.lastPlayAt) / (1000 * 60 * 60 * 24));
      if (daysSinceLast >= 1) {
        trackReturnVisit(daysSinceLast, progress.global.totalScenariosCompleted);
      }
    }

    // Track featured scenario exposure for new users
    if (!hasAnyProgress && !featuredTracked) {
      trackFeaturedShown(FEATURED_SCENARIO_ID);
      setFeaturedTracked(true);
    }

    // Build played status map
    const playedMap: Record<string, boolean> = {};
    for (const scenario of allScenarios) {
      const sp = getScenarioProgress(scenario.id);
      playedMap[scenario.id] = sp ? sp.completions > 0 : false;
    }
    setScenarioHasBeenPlayed(playedMap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartScenario = (scenarioId: string) => {
    const scenario = allScenarios.find(s => s.id === scenarioId);
    const progress = getProgressState();

    if (scenario) {
      const isFeatured = scenarioId === FEATURED_SCENARIO_ID;
      trackScenarioStart(scenarioId, scenario.packIds[0] || "none", scenario.difficulty);

      if (isFeatured) {
        trackFeaturedClick(scenarioId);
      }

      if (progress.global.totalScenariosCompleted >= 1) {
        trackSecondScenarioStart(scenarioId, scenario.packIds[0] || "none", progress.global.totalScenariosCompleted);
      }
    }

    // Go to scenario detail screen
    router.push(`/psychtrails/play/${scenarioId}`);
  };

  return (
    <div className="min-h-screen bg-canvas text-label-primary">
      <div className="mx-auto max-w-xl px-4 py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-label-primary tracking-tight">
            PsychTrails
          </h1>
          <p className="mt-2 text-label-tertiary">
            {isReturning
              ? "Welcome back. Ready to practice?"
              : "Practice navigating challenging moments."}
          </p>
        </div>

        {/* Progress Summary - returning users only */}
        {hasProgress && (
          <div className="mb-8 flex justify-center gap-8 text-center">
            <div>
              <div className="text-xl font-medium text-label-primary">{practiceCount}</div>
              <div className="text-xs text-label-primary0 mt-0.5">Practice Sessions</div>
            </div>
            <div>
              <div className="text-xl font-medium text-label-primary">{scenariosCompleted}</div>
              <div className="text-xs text-label-primary0 mt-0.5">Scenarios Completed</div>
            </div>
          </div>
        )}

        {/* Scenarios List */}
        <div className="space-y-3">
          {allScenarios.map((scenario) => {
            const hasPlayed = scenarioHasBeenPlayed[scenario.id];
            return (
              <button
                key={scenario.id}
                onClick={() => handleStartScenario(scenario.id)}
                className="w-full text-left rounded-xl border border-separator bg-surface-grouped p-4 transition-all hover:border-separator hover:bg-fill-secondary shadow-card-1 hover:shadow-card-2"
              >
                <div className="flex items-start gap-4">
                  {/* Play icon */}
                  <div className="flex-shrink-0 mt-1">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-500/15 border border-accent-500/20">
                      <Play className="h-4 w-4 text-accent" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-label-primary">
                        {scenario.title}
                      </h3>
                      {hasPlayed && (
                        <span className="text-xs text-label-primary0">Practiced</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-label-tertiary line-clamp-2">
                      {scenario.summary}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-label-primary0">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {scenario.estimatedMinutes} min
                      </span>
                      <span>{DIFFICULTY_LABELS[scenario.difficulty] || scenario.difficulty}</span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Trust Note - new users only */}
        {!isReturning && (
          <p className="mt-8 text-center text-sm text-label-primary0">
            Evidence-based scenarios. No account needed.
          </p>
        )}

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-separator">
          <p className="text-center text-xs text-label-quaternary">
            Educational practice scenarios. Not medical advice or treatment.
          </p>
        </div>
      </div>
    </div>
  );
}
