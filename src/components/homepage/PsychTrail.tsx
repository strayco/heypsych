"use client";

import { Compass } from "lucide-react";

/**
 * Psych Trail Section - Coming Soon
 *
 * Purpose: Introduce the upcoming interactive treatment simulator
 * without creating urgency or requiring action
 *
 * Design:
 * - Simple, calm informational section
 * - Clearly marked as "Coming Soon"
 * - Educational / fictional framing
 * - No CTA buttons or "Start" actions yet
 */
export function PsychTrail() {
  return (
    <section className="border-t border-neutral-200 bg-white px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-blue-100">
            <Compass className="h-8 w-8 text-purple-600" />
          </div>

          {/* Heading */}
          <h2 className="mb-2 text-2xl font-bold text-neutral-900">
            Psych Trail
            <span className="ml-2 text-sm font-normal text-neutral-500">(Coming Soon)</span>
          </h2>
        </div>
      </div>
    </section>
  );
}
