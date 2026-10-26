// src/components/home/TaxonomyHero.tsx
// V1 Taxonomy-first homepage hero (rollback option)
//
// Used when navigationInversion is disabled. Shows content-type cards
// instead of audience-based gateway.

import Link from "next/link";
import { ArrowRight, Brain, Pill, Smartphone, MapPin } from "lucide-react";

export function TaxonomyHero() {
  return (
    <section className="px-4 pt-16 pb-16 sm:px-6 md:pt-24 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Primary H1 */}
        <h1 className="text-label-primary text-center text-xl font-semibold tracking-tight sm:text-2xl md:text-3xl lg:text-4xl">
          Evidence-based mental health information
        </h1>
        <p className="text-label-secondary mt-4 text-center text-lg">
          Conditions, treatments, and resources reviewed by mental health professionals.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Conditions */}
          <Link
            href="/conditions"
            className="group border-separator bg-surface hover:border-accent/50 hover:shadow-soft rounded-2xl border p-6 transition-all"
          >
            <div className="bg-accent-tint flex h-12 w-12 items-center justify-center rounded-xl">
              <Brain className="text-accent h-6 w-6" />
            </div>
            <h2 className="text-label-primary mt-4 text-lg font-semibold">Conditions</h2>
            <p className="text-label-secondary mt-1 text-sm">
              Symptoms, diagnosis, and treatment pathways
            </p>
            <div className="text-accent mt-4 flex items-center text-sm font-medium">
              Explore
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          {/* Treatments */}
          <Link
            href="/treatments"
            className="group border-separator bg-surface hover:shadow-soft rounded-2xl border p-6 transition-all hover:border-blue-300"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <Pill className="h-6 w-6 text-blue-600" />
            </div>
            <h2 className="text-label-primary mt-4 text-lg font-semibold">Treatments</h2>
            <p className="text-label-secondary mt-1 text-sm">
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
            className="group border-separator bg-surface hover:border-treatment/50 hover:shadow-soft rounded-2xl border p-6 transition-all"
          >
            <div className="bg-treatment/10 flex h-12 w-12 items-center justify-center rounded-xl">
              <Smartphone className="text-treatment h-6 w-6" />
            </div>
            <h2 className="text-label-primary mt-4 text-lg font-semibold">Tools</h2>
            <p className="text-label-secondary mt-1 text-sm">
              Apps, assessments, and practice software
            </p>
            <div className="text-treatment mt-4 flex items-center text-sm font-medium">
              Explore
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>

          {/* Find Care */}
          <Link
            href="/psychiatrists"
            className="group border-separator bg-surface hover:border-positive/50 hover:shadow-soft rounded-2xl border p-6 transition-all"
          >
            <div className="bg-positive-tint flex h-12 w-12 items-center justify-center rounded-xl">
              <MapPin className="text-positive-600 h-6 w-6" />
            </div>
            <h2 className="text-label-primary mt-4 text-lg font-semibold">Find Care</h2>
            <p className="text-label-secondary mt-1 text-sm">
              Psychiatrists and providers near you
            </p>
            <div className="text-positive-600 mt-4 flex items-center text-sm font-medium">
              Search
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
