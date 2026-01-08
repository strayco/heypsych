"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import type { Tile, Scenario } from "@/lib/psychTrail/types";
import { getTileById } from "@/lib/psychTrail/tiles";
import { scenarios } from "@/lib/psychTrail";
import { HardcodedRenderer } from "@/lib/psychTrail/renderers/HardcodedRenderer";
import { GameContainer } from "@/components/psychTrail/GameContainer";
import { updateTileProgress, addXP, addInsightCard } from "@/lib/psychTrail/storage";
import { Button } from "@/components/ui/button";
import Link from "next/link";

/**
 * PsychTrails - Tile Scenario Player
 *
 * Loads tile and associated scenario, runs the game, saves progress on completion
 */
export default function PlayTilePage() {
  const params = useParams();
  const router = useRouter();
  const tileId = params.tileId as string;

  const [tile, setTile] = useState<Tile | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renderer] = useState(() => new HardcodedRenderer());

  useEffect(() => {
    // Load tile
    const loadedTile = getTileById(tileId);
    if (!loadedTile) {
      setError(`Tile not found: ${tileId}`);
      return;
    }

    // Check if tile is unlocked
    if (!loadedTile.unlocked) {
      setError("This tile is locked. Complete prerequisite tiles first.");
      return;
    }

    setTile(loadedTile);

    // Load scenario
    const loadedScenario = scenarios[loadedTile.scenarioId];
    if (!loadedScenario) {
      setError(`Scenario not found: ${loadedTile.scenarioId}`);
      return;
    }

    setScenario(loadedScenario);
  }, [tileId]);

  const handleComplete = (result: any) => {
    if (!tile) return;

    // Update tile progress
    updateTileProgress(tile.id, result.confidenceGain, result.endingId);

    // Add XP to total
    addXP(result.xpEarned);

    // Add insight card if earned
    if (result.insightCardId) {
      addInsightCard(result.insightCardId);
    }

    // Progress is saved, user can now return to map
  };

  // Loading state
  if (!tile || !scenario) {
    if (error) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
          <div className="container mx-auto px-4 py-8">
            <Link href="/psychtrails/map" className="mb-6 inline-flex items-center text-sm text-neutral-700 hover:text-neutral-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Map
            </Link>

            <div className="mx-auto max-w-2xl rounded-lg border border-red-200 bg-red-50 p-8 text-center">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
              <h2 className="mb-2 text-xl font-bold text-red-900">Error Loading Scenario</h2>
              <p className="mb-6 text-red-800">{error}</p>
              <Button onClick={() => router.push("/psychtrails/map")}>
                Return to Map
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-600"></div>
          <p className="text-neutral-600">Loading scenario...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href="/psychtrails/map"
          className="mb-6 inline-flex items-center text-sm text-neutral-700 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Map
        </Link>

        {/* Game container */}
        <GameContainer
          scenario={scenario}
          tile={tile}
          renderer={renderer}
          onComplete={handleComplete}
        />
      </div>
    </div>
  );
}
