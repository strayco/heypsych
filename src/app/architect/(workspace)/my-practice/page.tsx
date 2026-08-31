/**
 * My Practice Page
 *
 * The primary "Build My Practice" experience.
 *
 * Query params:
 * - ?skip=1 - Skip onboarding and go straight to workspace (for "Build Myself" mode)
 */

import { Metadata } from "next";
import { MyPractice } from "../../_components/MyPractice";

export const metadata: Metadata = {
  title: "My Practice | Practice Architect™",
  description:
    "Build your mental health practice technology stack visually. Simple, intuitive, and personalized to your practice.",
};

interface PageProps {
  searchParams: Promise<{ skip?: string }>;
}

export default async function MyPracticePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const skipOnboarding = params.skip === "1";

  return <MyPractice showOnboarding={!skipOnboarding} />;
}
