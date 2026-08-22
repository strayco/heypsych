"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { GameContainerV2 } from "@/components/psychTrail/v2/GameContainerV2";
import { getPackRegistry } from "@/lib/psychTrail/pack-registry";
import { getCampusContext } from "@/lib/psychTrail/campus-storage";
import type { ScenarioV2, Pack } from "@/lib/psychTrail/types-v2";
import type { ResourceMapping } from "@/lib/psychTrail/institutional-types";

// Demo campus resources for pilot
const DEMO_CAMPUS_RESOURCES: ResourceMapping[] = [
  { type: "counseling", label: "Counseling Center", url: "https://example.edu/counseling" },
  { type: "wellness", label: "Wellness Center", url: "https://example.edu/wellness" },
  { type: "crisis", label: "Crisis Support (24/7)", url: "https://example.edu/crisis" },
];

export default function PlayScenarioPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const scenarioId = params.scenarioId as string;

  // Check for direct play mode (skip pre-run for first-time users)
  const directMode = searchParams.get("mode") === "direct";

  // Check for campus mode from URL or localStorage
  const campusSlug = searchParams.get("campus");
  const playlistId = searchParams.get("playlist");
  const campusContext = getCampusContext();

  // Use campus context if present (either from URL or localStorage)
  const isInCampusMode = campusSlug !== null || campusContext !== null;

  const registry = getPackRegistry();
  const scenario = registry.getScenario(scenarioId) as ScenarioV2 | null;

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

  if (!scenario) {
    return (
      <div className="min-h-screen bg-canvas text-label-primary flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Scenario Not Found</h1>
          <button onClick={() => router.push("/psychtrails")} className="text-accent hover:text-accent-700 transition-colors">
            Back to Packs
          </button>
        </div>
      </div>
    );
  }

  const allScenarios = registry.getAllScenarios() as ScenarioV2[];
  const allPacks = registry.getAllPacks() as Pack[];

  // All back navigation goes to the canonical main PsychTrails home
  // Partner/campus pages are a separate flow and should not appear as back destinations
  const handleBack = () => {
    router.push("/psychtrails");
  };

  const handleBackToHome = () => {
    router.push("/psychtrails");
  };

  return (
    <GameContainerV2
      scenario={scenario}
      allScenarios={allScenarios}
      allPacks={allPacks}
      directPlay={directMode}
      campusContext={isInCampusMode ? campusContext : null}
      campusResources={isInCampusMode ? DEMO_CAMPUS_RESOURCES : []}
      playlistId={playlistId}
      onBack={handleBack}
      onBackToPack={handleBackToHome}
    />
  );
}
