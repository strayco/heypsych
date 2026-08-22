"use client";

import type { Metadata } from "next";
import Link from "next/link";
import { Play, ArrowRight, Compass } from "lucide-react";
import { trackHowItWorksPlayClick } from "@/lib/analytics/product-events";

const steps = [
  {
    number: "1",
    title: "Choose a scenario",
    description: "Social anxiety at a dining hall. Speaking up in class. Asking for help.",
  },
  {
    number: "2",
    title: "Make choices",
    description: "Navigate branching decisions. Each path teaches different coping strategies.",
  },
  {
    number: "3",
    title: "Build skills",
    description: "See what worked. Get a concrete next step to try in real life.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero */}
      <section className="bg-gradient-to-br from-canvas via-surface to-canvas px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-1.5">
            <Compass className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent-700">PsychTrails</span>
          </div>

          <h1 className="mb-4 text-3xl font-bold text-label-primary sm:text-4xl">
            How it works
          </h1>
          <p className="text-lg text-label-secondary">
            Practice makes progress. Build real skills through doing, not reading.
          </p>
        </div>
      </section>

      {/* Steps - Visual, concise */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="space-y-8">
            {steps.map((step, index) => (
              <div key={step.number} className="relative flex gap-6">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-5 top-12 h-full w-px bg-fill-tertiary" />
                )}
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-accent-600 text-lg font-bold text-white shadow-soft">
                  {step.number}
                </div>
                <div>
                  <h2 className="mb-1 text-xl font-semibold text-label-primary">
                    {step.title}
                  </h2>
                  <p className="text-label-tertiary">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Primary CTA - Early and prominent */}
      <section className="bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-label-primary">
            Ready to practice?
          </h2>
          <p className="mb-6 text-label-tertiary">
            Start with a free scenario. No account required.
          </p>
          <Link
            href="/psychtrails"
            onClick={trackHowItWorksPlayClick}
            className="inline-flex items-center gap-2 rounded-xl bg-canvas-elevated px-8 py-3 font-semibold text-label-primary transition-all hover:bg-white shadow-medium hover:shadow-large"
          >
            <Play className="h-4 w-4" />
            Play Now
          </Link>
        </div>
      </section>

      {/* Trust signal - One line, not a whole section */}
      <section className="border-t border-separator px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-center text-sm text-label-primary0">
          Based on exposure therapy and behavioral activation principles.
          Designed with clinical psychologists.
        </p>
      </section>

      {/* For campuses teaser */}
      <section className="bg-surface px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2 text-sm font-medium text-label-primary0">
            For universities
          </p>
          <h2 className="mb-4 text-lg font-semibold text-label-primary">
            Deploy PsychTrails on your campus
          </h2>
          <Link
            href="/for-campuses"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors hover:text-accent-700"
          >
            Learn more
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
