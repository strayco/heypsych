/**
 * SupportJourney Component
 *
 * One simple question: What kind of help are you looking for?
 * - Talk to someone → Therapy options
 * - Help myself → Apps by category
 * - Explore medication → Psychiatry options
 */

"use client";

import Link from "next/link";
import { ArrowRight, Heart, Sparkles, Pill } from "lucide-react";

const OPTIONS = [
  {
    id: "therapy",
    label: "Talk to someone",
    description: "Connect with a therapist or counselor",
    icon: Heart,
    href: "/tools/find-support/therapy-platforms/",
    color: "treatment",
  },
  {
    id: "apps",
    label: "Help myself",
    description: "Apps and tools I can use on my own",
    icon: Sparkles,
    href: "/tools/for-patients/",
    color: "emerald",
  },
  {
    id: "psychiatry",
    label: "Explore medication",
    description: "See a psychiatrist or prescriber",
    icon: Pill,
    href: "/tools/find-support/psychiatry-platforms/",
    color: "violet",
  },
] as const;

export function SupportJourney() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-label-primary">
          What kind of support are you looking for?
        </h2>
        <p className="mt-2 text-label-secondary">
          Pick one to get started - you can always explore more later
        </p>
      </div>

      <div className="space-y-4">
        {OPTIONS.map((option) => (
          <Link
            key={option.id}
            href={option.href}
            className="group flex items-center gap-5 p-6 rounded-2xl border border-separator bg-surface transition-all hover:border-treatment/40 hover:shadow-lg"
          >
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-treatment/10">
              <option.icon className="h-7 w-7 text-treatment" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-label-primary group-hover:text-treatment transition-colors">
                {option.label}
              </h3>
              <p className="mt-0.5 text-label-secondary">
                {option.description}
              </p>
            </div>
            <ArrowRight className="h-6 w-6 text-label-quaternary group-hover:text-treatment group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>

      <p className="text-center text-sm text-label-tertiary">
        Not sure?{" "}
        <Link href="/tools/for-patients/" className="text-treatment hover:underline">
          Browse everything
        </Link>
      </p>
    </div>
  );
}

export default SupportJourney;
