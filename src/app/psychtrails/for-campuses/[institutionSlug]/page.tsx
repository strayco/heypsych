"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Play, Clock } from "lucide-react";
import { getPackRegistry } from "@/lib/psychTrail/pack-registry";
import { setCampusContext } from "@/lib/psychTrail/campus-storage";
import {
  getProgressState,
  getScenarioProgress,
  isReturningUser,
} from "@/lib/psychTrail/storage-v2";
import type { CampusContext } from "@/lib/psychTrail/institutional-types";
import type { ScenarioV2 } from "@/lib/psychTrail/types-v2";

// Demo institutions for development
const DEMO_INSTITUTIONS: Record<string, { id: string; name: string }> = {
  "state-u": { id: "inst_state_u", name: "State University" },
  "demo-college": { id: "inst_demo", name: "Greenfield College" },
  "cmh": { id: "inst_cmh", name: "College of Mental Health" },
};

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export default function CampusLandingPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const institutionSlug = params.institutionSlug as string;

  const [institution, setInstitution] = useState<{ id: string; name: string } | null>(null);
  const [isReturning, setIsReturning] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);
  const [practiceCount, setPracticeCount] = useState(0);
  const [scenariosCompleted, setScenariosCompleted] = useState(0);
  const [scenarioHasBeenPlayed, setScenarioHasBeenPlayed] = useState<Record<string, boolean>>({});

  const registry = getPackRegistry();
  const allScenarios = registry.getAllScenarios() as ScenarioV2[];

  const isStaffReferred = searchParams.get("ref") !== null;

  useEffect(() => {
    const inst = DEMO_INSTITUTIONS[institutionSlug];
    if (!inst) return;
    setInstitution(inst);

    // Set campus context
    const cohortId = searchParams.get("cohort");
    const staffRef = searchParams.get("ref");

    const context: CampusContext = {
      institutionId: inst.id,
      institutionSlug,
      institutionName: inst.name,
      cohortId: cohortId || null,
      playlistId: null,
      staffReferralId: staffRef || null,
      enteredAt: Date.now(),
    };
    setCampusContext(context);

    // Load progress
    const progress = getProgressState();
    const hasAnyProgress = progress.global.totalRuns > 0;
    setHasProgress(hasAnyProgress);
    setIsReturning(isReturningUser());
    setPracticeCount(progress.global.totalRuns);
    setScenariosCompleted(progress.global.totalScenariosCompleted);

    // Build played status map
    const playedMap: Record<string, boolean> = {};
    for (const scenario of allScenarios) {
      const sp = getScenarioProgress(scenario.id);
      playedMap[scenario.id] = sp ? sp.completions > 0 : false;
    }
    setScenarioHasBeenPlayed(playedMap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [institutionSlug, searchParams]);

  const handleStartScenario = (scenarioId: string) => {
    router.push(`/psychtrails/play/${scenarioId}?campus=${institutionSlug}`);
  };

  if (!institution) {
    return (
      <div className="min-h-screen bg-canvas text-label-primary flex items-center justify-center">
        <div className="text-center">
          <p className="text-label-tertiary">Institution not found</p>
          <button
            onClick={() => router.push("/psychtrails")}
            className="mt-4 text-accent hover:text-accent-700 transition-colors"
          >
            Go to PsychTrails →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-label-primary">
      <div className="mx-auto max-w-xl px-4 py-12">
        {/* Institution Branding */}
        <div className="mb-6 rounded-xl border border-accent-700/30 bg-accent-tint p-3 text-center">
          <p className="text-sm text-accent-700">
            <span className="font-semibold">{institution.name}</span>
          </p>
          {isStaffReferred && (
            <p className="text-xs text-accent/80 mt-1">
              Shared by your counselor or advisor
            </p>
          )}
        </div>

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
            Private practice. Your choices stay on your device.
          </p>
        )}

        {/* Footer */}
        <div className="mt-8 pt-8 border-t border-separator">
          <div className="flex items-center justify-between">
            <p className="text-xs text-label-quaternary">
              Educational practice scenarios. Not medical advice.
            </p>
            <button
              onClick={() => router.push(`/psychtrails/for-campuses/${institutionSlug}/dashboard`)}
              className="text-xs text-label-primary0 hover:text-label-secondary transition-colors"
            >
              Staff →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
