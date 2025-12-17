import type { Metadata } from "next";
import Link from "next/link";
import { Compass, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Psych Trail - Coming Soon | HeyPsych",
  description:
    "An interactive treatment simulator to help you explore different mental health treatment paths in a safe, educational environment.",
};

/**
 * Psych Trail - Placeholder Page
 *
 * Purpose: Simple preview/placeholder page for the upcoming Psych Trail feature
 * Design: Calm, informational, no CTAs yet
 */
export default function PsychTrailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Back Link */}
          <Link
            href="/"
            className="mb-8 inline-flex items-center text-sm text-neutral-600 transition-colors hover:text-neutral-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>

          {/* Icon */}
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-blue-100">
            <Compass className="h-10 w-10 text-purple-600" />
          </div>

          {/* Heading */}
          <h1 className="mb-4 text-4xl font-bold text-neutral-900">
            Psych Trail
            <span className="ml-3 text-lg font-normal text-neutral-500">(Coming Soon)</span>
          </h1>

          {/* Description */}
          <div className="space-y-4 text-neutral-700">
            <p className="text-lg leading-relaxed">
              An interactive treatment simulator designed to help you explore different mental
              health treatment paths in a safe, educational environment.
            </p>

            <p>
              Follow fictional patient journeys and learn how various treatments work in practice.
              Understand the decision-making process behind treatment selection, potential outcomes,
              and how different approaches compare.
            </p>

            <p className="text-sm text-neutral-600">
              This feature is currently in development. We're working to create an educational
              experience that helps demystify mental health treatment options.
            </p>
          </div>

          {/* What to Expect Section */}
          <div className="mt-12 rounded-xl border border-neutral-200 bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold text-neutral-900">What to Expect</h2>
            <ul className="space-y-3 text-sm text-neutral-700">
              <li className="flex items-start">
                <span className="mr-3 mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-600">
                  1
                </span>
                <span>
                  <strong>Interactive Scenarios:</strong> Follow realistic patient journeys through
                  different treatment paths
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-600">
                  2
                </span>
                <span>
                  <strong>Educational Focus:</strong> Learn how treatments work in practice, not
                  just theory
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-purple-600">
                  3
                </span>
                <span>
                  <strong>Safe Exploration:</strong> All scenarios are fictional and designed for
                  learning purposes
                </span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="mt-8">
            <Link href="/">
              <Button variant="outline" size="lg">
                Explore HeyPsych
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
