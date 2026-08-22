"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Star, Lock } from "lucide-react";
import { getPackRegistry } from "@/lib/psychTrail/pack-registry";
import { getProgressState, getScenarioProgress, getDiscoveredRoutes } from "@/lib/psychTrail/storage-v2";
import type { ScenarioCardProps } from "@/components/psychTrail/v2/contracts";

const TIER_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  none: { bg: "bg-surface-grouped", text: "text-label-tertiary", border: "border-separator" },
  bronze: { bg: "bg-amber-900/30", text: "text-amber-400", border: "border-amber-700/30" },
  silver: { bg: "bg-fill-secondary", text: "text-label-secondary", border: "border-separator" },
  gold: { bg: "bg-amber-800/30", text: "text-amber-300", border: "border-amber-600/30" },
  platinum: { bg: "bg-cyan-900/30", text: "text-cyan-300", border: "border-cyan-600/30" },
};

const GRADE_COLORS: Record<string, string> = {
  S: "text-amber-300",
  A: "text-positive-600",
  B: "text-accent",
  C: "text-caution",
  D: "text-orange-400",
  F: "text-negative",
};

export default function PackDetailPage() {
  const params = useParams();
  const router = useRouter();
  const packId = params.packId as string;

  const registry = getPackRegistry();
  const pack = registry.getPack(packId);
  const progress = getProgressState();

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

  if (!pack) {
    return (
      <div className="min-h-screen bg-canvas text-label-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Pack Not Found</h1>
          <button onClick={() => router.push("/psychtrails")} className="text-accent hover:text-accent-700 transition-colors">
            Back to Packs
          </button>
        </div>
      </div>
    );
  }

  const scenarios = registry.getScenariosForPack(packId);
  const packProgress = registry.getPackProgress(packId, progress);

  const scenarioCards: ScenarioCardProps[] = scenarios.map((s) => {
    const sp = getScenarioProgress(s.id);
    return {
      id: s.id,
      title: s.title,
      summary: s.summary,
      difficulty: s.difficulty,
      estimatedMinutes: s.estimatedMinutes,
      bestStars: sp?.bestStars ?? 0,
      bestGrade: sp?.bestGrade ?? null,
      masteryTier: sp?.masteryTier ?? "none",
      unlocked: registry.isScenarioUnlocked(s.id, progress),
    };
  });

  return (
    <div className="min-h-screen bg-canvas text-label-primary">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <button
          onClick={() => router.push("/psychtrails")}
          className="mb-6 text-sm text-label-tertiary hover:text-label-secondary flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Packs
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-label-primary">{pack.title}</h1>
          <p className="mt-2 text-label-tertiary">{pack.description}</p>
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-label-primary0 capitalize">{pack.difficulty}</span>
            <span className="text-sm text-label-primary0">~{pack.estimatedTotalMinutes} min total</span>
            {packProgress.masteryTier !== "none" && (
              <span className={`text-xs px-2 py-1 rounded-md capitalize border ${TIER_BADGES[packProgress.masteryTier].bg} ${TIER_BADGES[packProgress.masteryTier].text} ${TIER_BADGES[packProgress.masteryTier].border}`}>
                {packProgress.masteryTier}
              </span>
            )}
          </div>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="text-sm text-label-tertiary">
            {packProgress.scenariosCompleted}/{scenarios.length} completed
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: scenarios.length * 3 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < packProgress.totalStars ? "text-amber-400 fill-amber-400" : "text-label-tertiary"}`}
              />
            ))}
          </div>
        </div>

        <h2 className="mb-4 text-xl font-semibold text-label-primary">Scenarios</h2>
        <div className="space-y-3">
          {scenarioCards.map((scenario) => {
            const badge = TIER_BADGES[scenario.masteryTier];
            return (
              <button
                key={scenario.id}
                onClick={() => router.push(`/psychtrails/play/${scenario.id}`)}
                disabled={!scenario.unlocked}
                className={`w-full text-left rounded-xl border transition-all ${
                  scenario.unlocked
                    ? "border-separator bg-surface-grouped hover:border-separator hover:bg-fill-secondary shadow-card-1 hover:shadow-card-2"
                    : "border-separator bg-surface/50 opacity-60 cursor-not-allowed"
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-label-primary">{scenario.title}</h3>
                    <div className="flex items-center gap-2">
                      {scenario.bestGrade && (
                        <span className={`text-lg font-bold ${GRADE_COLORS[scenario.bestGrade]}`}>
                          {scenario.bestGrade}
                        </span>
                      )}
                      {!scenario.unlocked && <Lock className="h-4 w-4 text-label-primary0" />}
                    </div>
                  </div>
                  <p className="text-sm text-label-tertiary line-clamp-2">{scenario.summary}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-label-primary0 capitalize">{scenario.difficulty}</span>
                      <span className="text-xs text-label-primary0">~{scenario.estimatedMinutes} min</span>
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map((i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${i <= scenario.bestStars ? "text-amber-400 fill-amber-400" : "text-label-tertiary"}`}
                          />
                        ))}
                      </div>
                    </div>
                    {scenario.masteryTier !== "none" && (
                      <span className={`text-xs px-2 py-1 rounded-md capitalize border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {scenario.masteryTier}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {pack.packChallenges.length > 0 && (
          <>
            <h2 className="mt-8 mb-4 text-xl font-semibold text-label-primary">Pack Challenges</h2>
            <div className="space-y-3">
              {pack.packChallenges.map((c) => (
                <div key={c.id} className="rounded-xl border border-separator bg-surface-grouped p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-label-primary">{c.title}</span>
                    <span className="text-xs text-cyan-400">+{c.reward.xpBonus} XP</span>
                  </div>
                  <p className="text-sm text-label-tertiary mt-1">{c.description}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
