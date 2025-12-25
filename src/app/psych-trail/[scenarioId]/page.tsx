import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Clock, TrendingUp, ChevronRight } from "lucide-react";
import { notFound } from "next/navigation";
import { GameContainer } from "@/components/psychTrail";
import { scenarios } from "@/lib/psychTrail";
import { generatePsychTrailScenarioMetadata } from "@/lib/seo/psychtrail-metadata";
import { generatePsychTrailScenarioSchemas } from "@/lib/seo/psychtrail-schema";

type Props = {
  params: Promise<{ scenarioId: string }>;
};

/**
 * Generate static params for all scenarios at build time
 * This enables static generation (SSG) for all scenario pages
 */
export async function generateStaticParams() {
  const scenarioList = Object.values(scenarios);

  return scenarioList.map((scenario) => ({
    scenarioId: scenario.id,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { scenarioId } = await params;
  const scenario = Object.values(scenarios).find((s) => s.id === scenarioId);

  if (!scenario) {
    return {
      title: "Scenario Not Found | Psych Trail",
    };
  }

  return generatePsychTrailScenarioMetadata(scenario);
}

export default async function ScenarioPage({ params }: Props) {
  // Find the scenario by ID
  const { scenarioId } = await params;
  const scenario = Object.values(scenarios).find((s) => s.id === scenarioId);

  if (!scenario) {
    notFound();
  }

  // Generate schema.org structured data
  const schemas = generatePsychTrailScenarioSchemas(scenario);

  return (
    <>
      {/* Schema.org JSON-LD */}
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav className="mb-6 flex items-center text-sm text-neutral-700" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-900">
              Home
            </Link>
            <ChevronRight className="mx-2 h-4 w-4" />
            <Link href="/psych-trail" className="hover:text-neutral-900">
              Psych Trail
            </Link>
            <ChevronRight className="mx-2 h-4 w-4" />
            <span className="text-neutral-900 font-medium">{scenario.title}</span>
          </nav>

          {/* Back Link */}
          <Link
            href="/psych-trail"
            className="mb-6 inline-flex items-center text-sm text-neutral-700 transition-colors hover:text-neutral-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Scenarios
          </Link>

          {/* Scenario Introduction (Static Content for SEO) */}
          <div className="mx-auto max-w-4xl mb-8">
            <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm">
              {/* Title */}
              <h1 className="text-3xl font-bold text-neutral-900 mb-3 scenario-title">
                {scenario.title}: An Interactive Mental Health Simulation
              </h1>

              {/* Summary */}
              <p className="text-lg text-neutral-700 mb-4 scenario-summary">
                {scenario.summary}
              </p>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                {scenario.estimatedMinutes && (
                  <div className="flex items-center gap-1 text-neutral-700">
                    <Clock className="h-4 w-4" />
                    <span>~{scenario.estimatedMinutes} minutes</span>
                  </div>
                )}
                {scenario.difficulty && (
                  <div className="flex items-center gap-1 text-neutral-700">
                    <TrendingUp className="h-4 w-4" />
                    <span className="capitalize">{scenario.difficulty}</span>
                  </div>
                )}
                <div className="flex gap-1">
                  {scenario.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Clinical Review Badge */}
              {scenario.medicalReviewer && (
                <div className="inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm text-green-800 border border-green-200 mb-4">
                  <Shield className="h-4 w-4" />
                  <span>
                    Clinically Reviewed by {scenario.medicalReviewer}
                  </span>
                </div>
              )}

              {/* Learning Objectives */}
              {scenario.learningObjectives && scenario.learningObjectives.length > 0 && (
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-neutral-900 mb-2">What You'll Learn</h2>
                  <ul className="space-y-2">
                    {scenario.learningObjectives.map((objective, index) => (
                      <li key={index} className="flex items-start text-neutral-700">
                        <span className="text-purple-600 mr-2">•</span>
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-1">Educational Simulation</p>
                <p className="text-sm text-blue-800">
                  This is a fictional educational simulation. Real appointments vary greatly based on
                  individual needs and circumstances. This content is for educational purposes only
                  and does not constitute medical advice.
                </p>
              </div>
            </div>
          </div>

          {/* Interactive Simulation */}
          <div className="mx-auto max-w-6xl">
            <div className="bg-white rounded-lg border border-neutral-200 p-6 shadow-sm mb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-neutral-900">Start Simulation</h2>
                <span className="text-sm text-neutral-700">Interactive Experience Below</span>
              </div>
              <GameContainer scenario={scenario} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
