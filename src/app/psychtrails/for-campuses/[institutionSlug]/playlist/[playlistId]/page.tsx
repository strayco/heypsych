"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Compass, ChevronRight, Check, Play, ArrowLeft, Lock } from "lucide-react";
import { getPlaylistRegistry } from "@/lib/psychTrail/playlist-registry";
import {
  setCampusContext,
  getPlaylistProgress,
  startPlaylist,
} from "@/lib/psychTrail/campus-storage";
import { getProgressState } from "@/lib/psychTrail/storage-v2";
import { loadScenario } from "@/lib/psychTrail/scenario-registry";
import type { CampusContext, Playlist } from "@/lib/psychTrail/institutional-types";

// Demo institutions for development
const DEMO_INSTITUTIONS: Record<string, { id: string; name: string }> = {
  "state-u": { id: "inst_state_u", name: "State University" },
  "demo-college": { id: "inst_demo", name: "Greenfield College" },
  "cmh": { id: "inst_cmh", name: "College of Mental Health" },
};

interface ScenarioInfo {
  id: string;
  title: string;
  summary: string;
  estimatedMinutes: number;
  difficulty: string;
  completed: boolean;
  available: boolean;
}

function ScenarioCard({
  scenario,
  index,
  onSelect,
}: {
  scenario: ScenarioInfo;
  index: number;
  onSelect: () => void;
}) {
  const isLocked = !scenario.available;

  return (
    <button
      onClick={onSelect}
      disabled={isLocked}
      className={`w-full text-left rounded-xl border transition-all ${
        isLocked
          ? "border-gray-800 bg-gray-900/50 opacity-60 cursor-not-allowed"
          : scenario.completed
            ? "border-green-900/50 bg-gray-900 hover:border-green-800/50"
            : "border-gray-700 bg-gray-900 hover:border-gray-600"
      }`}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              scenario.completed
                ? "bg-green-900/50 text-green-400"
                : isLocked
                  ? "bg-gray-800 text-gray-600"
                  : "bg-purple-900/50 text-purple-400"
            }`}
          >
            {scenario.completed ? <Check className="w-4 h-4" /> : index + 1}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-medium text-white truncate">{scenario.title}</h3>
              {!isLocked && (
                scenario.completed ? (
                  <span className="text-xs text-green-400 flex-shrink-0 ml-2">Done</span>
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500 flex-shrink-0" />
                )
              )}
            </div>
            <p className="text-sm text-gray-400 line-clamp-2">{scenario.summary}</p>
            <p className="text-xs text-gray-500 mt-1">~{scenario.estimatedMinutes} min</p>
          </div>
        </div>
      </div>
    </button>
  );
}

export default function CampusPlaylistPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const institutionSlug = params.institutionSlug as string;
  const playlistId = params.playlistId as string;

  const [institution, setInstitution] = useState<{ id: string; name: string } | null>(null);
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [progressInfo, setProgressInfo] = useState({ completed: 0, total: 0 });
  const isStaffReferred = searchParams.get("ref") !== null;

  useEffect(() => {
    async function loadData() {
      const inst = DEMO_INSTITUTIONS[institutionSlug];
      if (!inst) {
        setLoading(false);
        return;
      }
      setInstitution(inst);

      const registry = getPlaylistRegistry();
      const pl = registry.getPlaylist(playlistId);
      if (!pl) {
        setLoading(false);
        return;
      }
      setPlaylist(pl);

      const cohortId = searchParams.get("cohort");
      const staffRef = searchParams.get("ref");

      const context: CampusContext = {
        institutionId: inst.id,
        institutionSlug,
        institutionName: inst.name,
        cohortId: cohortId || null,
        playlistId: playlistId,
        staffReferralId: staffRef || null,
        enteredAt: Date.now(),
      };
      setCampusContext(context);

      startPlaylist(playlistId);

      const gameProgress = getProgressState();
      const playlistProgress = getPlaylistProgress(playlistId);
      const completedScenarios = playlistProgress?.scenariosCompleted || [];

      const scenarioInfos: ScenarioInfo[] = [];
      for (let i = 0; i < pl.scenarioIds.length; i++) {
        const scenarioId = pl.scenarioIds[i];

        const isAvailable = i === 0 || completedScenarios.includes(pl.scenarioIds[i - 1]) ||
          (gameProgress.scenarios[scenarioId]?.completions ?? 0) > 0;

        try {
          const scenario = await loadScenario(scenarioId);
          scenarioInfos.push({
            id: scenarioId,
            title: scenario.title,
            summary: scenario.summary,
            estimatedMinutes: scenario.estimatedMinutes,
            difficulty: scenario.difficulty,
            completed: completedScenarios.includes(scenarioId) ||
              (gameProgress.scenarios[scenarioId]?.completions ?? 0) > 0,
            available: isAvailable,
          });
        } catch {
          scenarioInfos.push({
            id: scenarioId,
            title: scenarioId.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            summary: "Coming soon",
            estimatedMinutes: 10,
            difficulty: "beginner",
            completed: false,
            available: false,
          });
        }
      }

      setScenarios(scenarioInfos);
      setProgressInfo({
        completed: scenarioInfos.filter((s) => s.completed).length,
        total: scenarioInfos.length,
      });
      setLoading(false);
    }

    loadData();
  }, [institutionSlug, playlistId, searchParams]);

  const handleSelectScenario = (scenarioId: string) => {
    router.push(
      `/psychtrails/play/${scenarioId}?campus=${institutionSlug}&playlist=${playlistId}`
    );
  };

  const handleBack = () => {
    router.push(`/psychtrails/for-campuses/${institutionSlug}`);
  };

  const handleStartNext = () => {
    const nextScenario = scenarios.find((s) => !s.completed && s.available);
    if (nextScenario) {
      handleSelectScenario(nextScenario.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!institution || !playlist) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Playlist not found</p>
          <button
            onClick={() => router.push("/psychtrails")}
            className="mt-4 text-purple-400 hover:text-purple-300"
          >
            Go to PsychTrails →
          </button>
        </div>
      </div>
    );
  }

  const isComplete = progressInfo.completed >= progressInfo.total;
  const nextScenario = scenarios.find((s) => !s.completed && s.available);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="container mx-auto px-4 py-8 max-w-lg">
        {/* Back button */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Playlist header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500">
              <Compass className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{playlist.title}</h1>
              <p className="text-sm text-gray-400">
                {progressInfo.completed} of {progressInfo.total} complete
              </p>
            </div>
          </div>

          {/* Staff referral note */}
          {isStaffReferred && (
            <div className="mb-4 p-3 rounded-lg border border-purple-900/50 bg-purple-950/30">
              <p className="text-xs text-purple-300">
                Your counselor or advisor shared this playlist with you
              </p>
            </div>
          )}

          <p className="text-gray-300 mb-2">{playlist.description}</p>
          <p className="text-sm text-purple-400/80">{playlist.supportContext}</p>

          <p className="mt-3 text-xs text-gray-500">
            ~{playlist.estimatedMinutes} min total
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
              style={{ width: `${(progressInfo.completed / progressInfo.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Start/Continue button */}
        {!isComplete && nextScenario && (
          <button
            onClick={handleStartNext}
            className="w-full mb-6 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 font-medium flex items-center justify-center gap-2"
          >
            <Play className="h-5 w-5" />
            {progressInfo.completed === 0 ? "Start" : "Continue"}
          </button>
        )}

        {/* Completion state */}
        {isComplete && (
          <div className="mb-6 p-4 rounded-xl border border-green-900/50 bg-green-950/30">
            <div className="flex items-center gap-2 text-green-400 mb-2">
              <Check className="h-5 w-5" />
              <span className="font-medium">Playlist complete</span>
            </div>
            <p className="text-sm text-green-300/70">
              Replay any scenario to practice more or try different choices.
            </p>
          </div>
        )}

        {/* Scenario list */}
        <div className="space-y-3 mb-8">
          <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
            In this playlist
          </h2>
          {scenarios.map((scenario, index) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              index={index}
              onSelect={() => handleSelectScenario(scenario.id)}
            />
          ))}
        </div>

        {/* Privacy notice */}
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-200">Private by default</p>
              <p className="text-xs text-gray-400 mt-1">
                Your choices stay on your device. After each scenario, you can
                optionally ask for follow-up support—only then does staff see
                what you practiced.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
