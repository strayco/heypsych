import type { Metadata } from "next";
import { MapView } from "@/components/psychTrail/map/MapView";

export const metadata: Metadata = {
  title: "Your Journey Map | PsychTrails - HeyPsych",
  description: "Navigate your mental health journey through interactive scenario tiles. Build confidence in real-life situations.",
};

/**
 * PsychTrails - Map/Hub View
 *
 * Shows all tiles for user's life stage
 * Displays progress and unlocked/locked status
 */
export default function PsychTrailsMapPage() {
  return <MapView />;
}
