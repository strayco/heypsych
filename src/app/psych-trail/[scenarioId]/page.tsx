import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { GameContainer } from "@/components/psychTrail";
import { scenarios } from "@/lib/psychTrail";

type Props = {
  params: Promise<{ scenarioId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { scenarioId } = await params;
  const scenario = Object.values(scenarios).find((s) => s.id === scenarioId);

  if (!scenario) {
    return {
      title: "Scenario Not Found | Psych Trail",
    };
  }

  return {
    title: `${scenario.title} - Psych Trail | HeyPsych`,
    description: scenario.summary,
  };
}

export default async function ScenarioPage({ params }: Props) {
  // Find the scenario by ID
  const { scenarioId } = await params;
  const scenario = Object.values(scenarios).find((s) => s.id === scenarioId);

  if (!scenario) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/psych-trail"
          className="mb-6 inline-flex items-center text-sm text-neutral-600 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Scenarios
        </Link>

        {/* Live Game */}
        <div className="mx-auto max-w-6xl">
          <GameContainer scenario={scenario} />
        </div>
      </div>
    </div>
  );
}
