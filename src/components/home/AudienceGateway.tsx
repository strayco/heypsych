// src/components/home/AudienceGateway.tsx
// Dual-audience gateway for homepage positioning
//
// Provides equal prominence to patients and clinicians above the fold.
// Mission 1: Fix homepage positioning to serve both audiences.

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function AudienceGateway() {
  return (
    <section className="px-4 pb-16 pt-16 sm:px-6 md:pt-24 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Primary H1 */}
        <h1 className="text-center text-xl font-semibold tracking-tight text-label-primary sm:text-2xl md:text-3xl lg:text-4xl">
          Better mental health starts with better decisions.
        </h1>
        <p className="mt-4 text-center text-lg text-label-secondary">
          Find the right care. Build the right practice.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {/* Patient Path */}
          <div className="group relative rounded-2xl border border-separator bg-surface p-6 transition-all hover:border-neutral-300 hover:shadow-soft sm:p-8">
            <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
              For Patients & Families
            </p>
            <h2 className="mt-3 text-xl font-semibold text-label-primary sm:text-2xl">
              Find the right support
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-label-secondary">
              Explore therapy platforms, mental health apps, conditions, and treatment options.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/tools/find-support"
                className="group/link inline-flex items-center justify-between rounded-lg bg-treatment px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-treatment-600"
              >
                <span className="text-white">Find Therapy & Support</span>
                <ArrowRight className="h-4 w-4 text-white transition-transform group-hover/link:translate-x-0.5" />
              </Link>
              <div className="flex gap-2">
                <Link
                  href="/conditions"
                  className="flex-1 rounded-lg border border-separator bg-canvas px-3 py-2.5 text-center text-sm font-medium text-label-primary transition-colors hover:border-neutral-300"
                >
                  Conditions
                </Link>
                <Link
                  href="/tools/for-patients"
                  className="flex-1 rounded-lg border border-separator bg-canvas px-3 py-2.5 text-center text-sm font-medium text-label-primary transition-colors hover:border-neutral-300"
                >
                  Apps & Tools
                </Link>
              </div>
            </div>
          </div>

          {/* Clinician Path */}
          <div className="group relative rounded-2xl border border-separator bg-surface p-6 transition-all hover:border-neutral-300 hover:shadow-soft sm:p-8">
            <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
              For Mental Health Clinicians
            </p>
            <h2 className="mt-3 text-xl font-semibold text-label-primary sm:text-2xl">
              Build your practice stack
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-label-secondary">
              Compare EHRs, AI scribes, and billing tools with transparent fit scores.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <Link
                href="/architect?source=homepage"
                className="group/link inline-flex items-center justify-between rounded-lg border border-treatment bg-treatment px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-treatment-600"
              >
                <span className="text-white">Practice Architect™</span>
                <ArrowRight className="h-4 w-4 text-white transition-transform group-hover/link:translate-x-0.5" />
              </Link>
              <Link
                href="/tools/for-clinicians?source=homepage"
                className="rounded-lg border border-separator bg-canvas px-3 py-2.5 text-center text-sm font-medium text-label-primary transition-colors hover:border-neutral-300 hover:bg-neutral-50"
              >
                Browse All Clinician Tools
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
