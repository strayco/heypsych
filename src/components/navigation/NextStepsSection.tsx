"use client";

import { NextStepCard } from "./NextStepCard";
import type { NextStepsSectionProps, NextStep, Audience } from "@/domains/navigation/types";

/**
 * Filter and sort next steps for display
 */
function filterAndSortSteps(
  steps: NextStep[],
  audience?: Audience,
  maxSteps?: number
): NextStep[] {
  let filtered = steps;

  // Filter by audience if specified
  if (audience) {
    filtered = filtered.filter((step) => step.audience === audience);
  }

  // Sort by priority (lower = higher priority)
  filtered = [...filtered].sort((a, b) => (a.priority ?? 50) - (b.priority ?? 50));

  // Limit number of steps
  if (maxSteps && maxSteps > 0) {
    filtered = filtered.slice(0, maxSteps);
  }

  return filtered;
}

/**
 * NextStepsSection - Contextual recommendations section
 *
 * Displays a list of next steps with appropriate heading and filtering.
 * Used on condition and treatment detail pages to guide users to their next action.
 */
export function NextStepsSection({
  steps,
  heading = "What would you like to do next?",
  audience,
  maxSteps = 6,
}: NextStepsSectionProps) {
  const filteredSteps = filterAndSortSteps(steps, audience, maxSteps);

  if (filteredSteps.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 rounded-xl border border-separator bg-surface-grouped p-6">
      <h2 className="mb-4 text-lg font-semibold text-label-primary">{heading}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {filteredSteps.map((step) => (
          <NextStepCard key={step.id} step={step} />
        ))}
      </div>
    </section>
  );
}

export default NextStepsSection;
