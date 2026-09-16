/**
 * Practice Studio Page
 *
 * The new configurator experience - design your practice like
 * customizing a car or furnishing a room.
 *
 * Query params:
 * - ?onboarding=1 - Show onboarding first
 */

import { Metadata } from "next";
import { PracticeStudio } from "../../_components/studio";

export const metadata: Metadata = {
  title: "Practice Studio | Practice Architect™",
  description:
    "Design your mental health practice technology stack. Browse tools, place them in your build, and see your practice take shape.",
};

interface PageProps {
  searchParams: Promise<{ onboarding?: string }>;
}

export default async function StudioPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const showOnboarding = params.onboarding === "1";

  return <PracticeStudio showOnboarding={showOnboarding} />;
}
