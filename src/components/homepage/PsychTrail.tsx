"use client";

import { Compass, ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * PsychTrails Section
 *
 * Purpose: Introduce the interactive mental health simulation platform
 *
 * Design:
 * - Prominent clickable card
 * - Educational / fictional framing
 * - Clear disclaimer about educational nature
 */
export function PsychTrail() {
  return (
    <section className="border-t border-separator bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Link href="/psychtrails" className="block">
          <div className="group relative overflow-hidden rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-blue-50 to-white p-6 transition-all duration-300 hover:border-purple-400 hover:shadow-xl cursor-pointer">
            {/* New badge */}
            <div className="absolute top-3 left-4">
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-3 py-1 text-xs font-bold text-white shadow-lg ring-2 ring-white">
                NEW
              </span>
            </div>

            {/* Hover indicator */}
            <div className="absolute top-3 right-4 flex items-center gap-2 text-purple-600 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <span className="text-sm font-semibold">Click to explore</span>
              <ArrowRight className="h-5 w-5" />
            </div>

            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg transition-transform duration-300 group-hover:scale-110">
                <Compass className="h-7 w-7 text-white" />
              </div>

              {/* Heading */}
              <h2 className="mb-2 text-2xl font-bold text-label-primary transition-colors duration-300 group-hover:text-purple-700">
                PsychTrails™
              </h2>

              {/* Subtitle */}
              <p className="mb-2 text-base font-semibold text-purple-900">
                An interactive mental health simulation platform
              </p>

              {/* Description */}
              <p className="mb-2 text-sm text-label-secondary max-w-2xl mx-auto">
                Explore fictional, educational scenarios that show how treatment paths unfold over time.
              </p>

              {/* Disclaimer */}
              <p className="text-xs text-label-tertiary italic">
                Educational simulations only. Fictional scenarios. Not medical advice.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
}
