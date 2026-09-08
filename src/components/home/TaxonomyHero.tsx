// src/components/home/TaxonomyHero.tsx
// V1 Taxonomy-first homepage hero (rollback option)
//
// Used when navigationInversion is disabled. Shows content-type cards
// instead of audience-based gateway.

import Link from "next/link";
import { ArrowRight, Brain, Pill, Smartphone, MapPin } from "lucide-react";

export function TaxonomyHero() {
  return (
    <section className="px-4 pb-16 pt-16 sm:px-6 md:pt-24 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Primary H1 */}
        <h1 className="text-center text-xl font-semibold tracking-tight text-label-primary sm:text-2xl md:text-3xl lg:text-4xl">
          Evidence-based mental health information
        </h1>
        <p className="mt-4 text-center text-lg text-label-secondary">
          Conditions, treatments, and resources reviewed by mental health professionals.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Conditions */}
          <Link
            href="/conditions"
            className="group rounded-2xl border border-separator bg-surface p-6 transition-all hover:border-accent/50 hover:shadow-soft"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent-tint">
              <Brain className="h-6 w-6 text-accent" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-label-primary">Conditions</h2>
            <p className="mt-1 text-sm text-label-secondary">
              Symptoms, diagnosis, and treatment pathways
            </p>
            <div className="mt-4 flex items-center text-sm font-medium text-accent">
              Explore
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          {/* Treatments */}
          <Link
            href="/treatments"
            className="group rounded-2xl border border-separator bg-surface p-6 transition-all hover:border-blue-300 hover:shadow-soft"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <Pill className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-label-primary">Treatments</h2>
            <p className="mt-1 text-sm text-label-secondary">
              Medications, therapy, and alternatives
            </p>
            <div className="mt-4 flex items-center text-sm font-medium text-blue-600">
              Explore
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          {/* Tools */}
          <Link
            href="/tools"
            className="group rounded-2xl border border-separator bg-surface p-6 transition-all hover:border-treatment/50 hover:shadow-soft"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-treatment/10">
              <Smartphone className="h-6 w-6 text-treatment" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-label-primary">Tools</h2>
            <p className="mt-1 text-sm text-label-secondary">
              Apps, assessments, and practice software
            </p>
            <div className="mt-4 flex items-center text-sm font-medium text-treatment">
              Explore
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          {/* Find Care */}
          <Link
            href="/psychiatrists"
            className="group rounded-2xl border border-separator bg-surface p-6 transition-all hover:border-positive/50 hover:shadow-soft"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-positive-tint">
              <MapPin className="h-6 w-6 text-positive-600" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-label-primary">Find Care</h2>
            <p className="mt-1 text-sm text-label-secondary">
              Psychiatrists and providers near you
            </p>
            <div className="mt-4 flex items-center text-sm font-medium text-positive-600">
              Search
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
