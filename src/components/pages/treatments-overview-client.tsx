"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { Entity } from "@/lib/types/database";

const treatmentCategories = [
  {
    title: "Medications",
    description:
      "FDA-approved prescription medications for depression, anxiety, and other mental health conditions",
    href: "/treatments/medications",
    badge: "medication",
  },
  {
    title: "Interventional",
    description: "Brain stimulation treatments like TMS, ECT, and deep brain stimulation",
    href: "/treatments/interventional",
    badge: "interventional",
  },
  {
    title: "Investigational",
    description:
      "Clinical trial treatments including psilocybin, MDMA, and other breakthrough therapies",
    href: "/treatments/investigational",
    badge: "investigational",
  },
  {
    title: "Alternative",
    description:
      "Evidence-based alternative treatments like bright light therapy, acupuncture, and mindfulness",
    href: "/treatments/alternative",
    badge: "alternative",
  },
  {
    title: "Therapy",
    description:
      "Psychotherapy approaches including CBT, DBT, EMDR, and other evidence-based modalities",
    href: "/treatments/therapy",
    badge: "therapy",
  },
  {
    title: "Supplements",
    description: "Evidence-based nutritional supplements that may support mental health",
    href: "/treatments/supplements",
    badge: "supplement",
  },
];

interface TreatmentsOverviewClientProps {
  allTreatments: Entity[];
}

export function TreatmentsOverviewClient({ allTreatments }: TreatmentsOverviewClientProps) {
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allTreatments.forEach((treatment) => {
      const schema = treatment.schema?.schema_name || "treatment";
      counts[schema] = (counts[schema] || 0) + 1;
    });
    return counts;
  }, [allTreatments]);

  const getCategoryCount = (category: string) => categoryCounts[category] || 0;

  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero Section */}
      <section className="border-b border-separator bg-surface px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Back Link */}
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-label-secondary hover:text-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>

          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
              Evidence-Based Options
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-label-primary sm:text-4xl">
              Mental Health Treatments
            </h1>
            <p className="mt-3 text-lg text-label-secondary">
              Explore evidence-based treatments from FDA-approved medications to breakthrough
              investigational therapies.
            </p>

            {/* Stats */}
            <div className="mt-4 text-sm text-label-tertiary">
              {allTreatments.length}+ treatments available
            </div>
          </div>
        </div>
      </section>

      {/* Compare Treatments Banner */}
      <section className="border-b border-separator bg-canvas px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link href="/treatments/compare" className="group block">
            <div className="flex items-center justify-between rounded-xl border border-separator bg-surface p-5 transition-all hover:border-neutral-300 hover:shadow-soft">
              <div>
                <h2 className="font-medium text-label-primary group-hover:text-accent transition-colors">
                  Compare Treatments
                </h2>
                <p className="mt-1 text-sm text-label-secondary">
                  Side-by-side comparisons like Lexapro vs Zoloft, CBT vs DBT
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-label-quaternary transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
            </div>
          </Link>
        </div>
      </section>

      {/* Treatment Category Tiles */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
            Browse
          </p>
          <h2 className="mt-1 text-xl font-semibold text-label-primary">
            Treatment Categories
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {treatmentCategories.map((category) => {
              const count = getCategoryCount(category.badge);

              return (
                <Link key={category.href} href={category.href} className="group block">
                  <div className="h-full rounded-xl border border-separator bg-surface p-5 transition-all hover:border-neutral-300 hover:shadow-soft">
                    <h3 className="font-medium text-label-primary group-hover:text-accent transition-colors">
                      {category.title}
                    </h3>
                    <p className="mt-2 text-sm text-label-secondary line-clamp-2">
                      {category.description}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-label-tertiary">
                        {count > 0 ? `${count} available` : "Coming soon"}
                      </span>
                      <ArrowRight className="h-4 w-4 text-label-quaternary transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
