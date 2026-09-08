/**
 * Browse Hub Page
 *
 * Secondary navigation surface that aggregates taxonomy-based content.
 * Part of Phase 3 navigation inversion - demotes taxonomy to secondary.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { HeartPulse, Pill, Smartphone, MapPin, BookOpen, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Browse | HeyPsych",
  description:
    "Browse mental health conditions, treatments, tools, and resources. Find information about symptoms, therapy options, medications, and mental health apps.",
};

const BROWSE_CATEGORIES = [
  {
    name: "Conditions",
    href: "/conditions",
    description: "Symptoms, diagnoses, and mental health conditions",
    icon: HeartPulse,
    color: "text-condition",
  },
  {
    name: "Treatments",
    href: "/treatments",
    description: "Therapy approaches, medications, and treatment options",
    icon: Pill,
    color: "text-treatment",
  },
  {
    name: "Tools & Apps",
    href: "/tools",
    description: "Mental health apps, resources, and self-help tools",
    icon: Smartphone,
    color: "text-accent",
  },
  {
    name: "Find Care",
    href: "/psychiatrists",
    description: "Find psychiatrists and mental health providers near you",
    icon: MapPin,
    color: "text-label-secondary",
  },
  {
    name: "Resources",
    href: "/resources",
    description: "Guides, articles, and educational content",
    icon: BookOpen,
    color: "text-label-secondary",
  },
];

export default function BrowsePage() {
  return (
    <div className="min-h-screen bg-canvas">
      <main className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Header */}
          <header className="mb-10 text-center">
            <h1 className="text-2xl font-bold text-label-primary sm:text-3xl">
              Browse HeyPsych
            </h1>
            <p className="mt-3 text-label-secondary">
              Explore our mental health knowledge base by category.
            </p>
          </header>

          {/* Categories Grid */}
          <div className="space-y-3">
            {BROWSE_CATEGORIES.map((category) => {
              const IconComponent = category.icon;
              return (
                <Link
                  key={category.href}
                  href={category.href}
                  className="group flex items-center justify-between rounded-xl border border-separator bg-surface p-5 transition-all hover:border-neutral-300 hover:shadow-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-fill-quaternary">
                      <IconComponent className={`h-6 w-6 ${category.color}`} />
                    </div>
                    <div>
                      <h2 className="font-medium text-label-primary group-hover:text-accent">
                        {category.name}
                      </h2>
                      <p className="mt-0.5 text-sm text-label-tertiary">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-label-quaternary transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
                </Link>
              );
            })}
          </div>

          {/* Decision Journeys CTA */}
          <div className="mt-12 rounded-xl border border-separator bg-surface-grouped p-6 text-center">
            <p className="text-sm text-label-secondary">
              Not sure where to start?
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/find-support"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-treatment px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-treatment-600"
              >
                Find My Support Path
              </Link>
              <Link
                href="/architect"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-separator bg-surface px-5 py-2.5 text-sm font-medium text-label-primary transition-colors hover:bg-fill-quaternary"
              >
                Practice Architect
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
