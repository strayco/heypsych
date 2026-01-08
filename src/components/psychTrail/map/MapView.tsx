"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Compass, Settings } from "lucide-react";
import type { UserProfile, Tile, TileProgress } from "@/lib/psychTrail/types";
import { getUserProfile, getCampaignProgress } from "@/lib/psychTrail/storage";
import { getTilesByLifeStage, isTileUnlocked, getUnlockReason } from "@/lib/psychTrail/tiles";
import { TileCard } from "./TileCard";
import { Button } from "@/components/ui/button";

export function MapView() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, TileProgress>>({});
  const [totalXP, setTotalXP] = useState(0);

  useEffect(() => {
    // Check if user has completed onboarding
    const userProfile = getUserProfile();
    if (!userProfile) {
      // No profile, redirect to onboarding
      router.push("/psychtrails");
      return;
    }

    setProfile(userProfile);

    // Load tiles for user's life stage
    const lifeStageTiles = getTilesByLifeStage(userProfile.lifeStage);
    setTiles(lifeStageTiles);

    // Load progress
    const campaignProgress = getCampaignProgress();
    if (campaignProgress) {
      setProgressMap(campaignProgress.tiles);
      setTotalXP(campaignProgress.totalXP);
    }
  }, [router]);

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-neutral-600">Loading your journey...</p>
        </div>
      </div>
    );
  }

  const lifeStageLabels = {
    teen: "Teen Journey",
    college: "College Journey",
    parent: "Parent Journey",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg">
                <Compass className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-neutral-900">
                  Your {lifeStageLabels[profile.lifeStage]}
                </h1>
                <p className="text-sm text-neutral-600">Total XP: {totalXP}</p>
              </div>
            </div>
            <p className="mt-2 text-neutral-700">
              Build confidence by practicing real-life mental health scenarios
            </p>
          </div>

          {/* Settings button (future) */}
          <Button variant="ghost" size="sm" className="gap-2" disabled>
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>

        {/* Tiles grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile) => {
            const progress = progressMap[tile.id] ?? {
              confidence: tile.initialConfidence,
              completions: 0,
            };
            const unlocked = isTileUnlocked(tile, progressMap);
            const unlockReason = getUnlockReason(tile);

            return (
              <TileCard
                key={tile.id}
                tile={tile}
                progress={progress}
                unlocked={unlocked}
                unlockReason={unlockReason}
              />
            );
          })}
        </div>

        {/* Empty state if no tiles */}
        {tiles.length === 0 && (
          <div className="rounded-lg border border-neutral-200 bg-white p-12 text-center">
            <Compass className="mx-auto mb-4 h-12 w-12 text-neutral-400" />
            <h3 className="mb-2 text-lg font-semibold text-neutral-900">
              No scenarios available yet
            </h3>
            <p className="text-neutral-600">
              We're working on scenarios for your life stage. Check back soon!
            </p>
          </div>
        )}

        {/* Footer disclaimer */}
        <div className="mt-12 rounded-lg border border-blue-200 bg-blue-50 p-6">
          <p className="text-sm font-semibold text-blue-900">Educational Disclaimer</p>
          <p className="mt-2 text-sm text-blue-800">
            These are fictional scenarios designed for learning purposes only. They do not
            constitute medical advice. Real treatment decisions should always be made with
            qualified mental health professionals.
          </p>
        </div>
      </div>
    </div>
  );
}
