import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Compass, Clock } from "lucide-react";
import { scenarios } from "@/lib/psychTrail";

export const metadata: Metadata = {
  title: "Psych Trail - Mental Health Treatment Simulator | HeyPsych",
  description:
    "An educational, fictional simulation that models how treatment decisions unfold over time—choices, tradeoffs, and unexpected events.",
};

/**
 * Psych Trail - Scenario Selection Page
 *
 * Lists all available scenarios for users to choose from.
 */
export default function PsychTrailPage() {
  // Get all scenarios as an array
  const scenarioList = Object.values(scenarios);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-sm text-neutral-600 transition-colors hover:text-neutral-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>

        {/* Page Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg">
            <Compass className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-neutral-900">Psych Trail</h1>
          <p className="mx-auto max-w-2xl text-lg text-neutral-600">
            Choose a scenario to explore how treatment decisions unfold over time
          </p>
          <p className="mt-2 text-sm text-neutral-500 italic">
            Educational simulations only. Fictional scenarios. Not medical advice.
          </p>
        </div>

        {/* Scenario Grid */}
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 md:grid-cols-2">
            {scenarioList.map((scenario) => (
              <Link
                key={scenario.id}
                href={`/psych-trail/${scenario.id}`}
                className="group block"
              >
                <div className="h-full rounded-xl border-2 border-neutral-200 bg-white p-6 shadow-sm transition-all duration-300 hover:border-purple-400 hover:shadow-lg">
                  {/* Scenario Header */}
                  <div className="mb-4">
                    <h2 className="mb-2 text-xl font-bold text-neutral-900 transition-colors group-hover:text-purple-700">
                      {scenario.title}
                    </h2>
                    <p className="text-sm text-neutral-600">{scenario.summary}</p>
                  </div>

                  {/* Scenario Meta */}
                  <div className="flex items-center gap-4 text-xs text-neutral-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>~{scenario.estimatedMinutes} minutes</span>
                    </div>
                    {scenario.tags && scenario.tags.length > 0 && (
                      <div className="flex gap-1">
                        {scenario.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="rounded bg-neutral-100 px-2 py-1">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hover Indicator */}
                  <div className="mt-4 flex items-center text-sm font-medium text-purple-600 opacity-0 transition-opacity group-hover:opacity-100">
                    Start Scenario →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Educational Disclaimer */}
        <div className="mx-auto mt-12 max-w-3xl rounded-lg border border-blue-200 bg-blue-50 p-6">
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
