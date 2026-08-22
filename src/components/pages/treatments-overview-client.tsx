"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowLeft, Pill, Zap, Beaker, Leaf, Brain, Sun, Scale } from "lucide-react";
import { Entity } from "@/lib/types/database";

const treatmentCategories = [
  {
    title: "Medications",
    description:
      "FDA-approved prescription medications for depression, anxiety, and other mental health conditions",
    icon: Pill,
    href: "/treatments/medications",
    badge: "medication",
  },
  {
    title: "Interventional",
    description: "Brain stimulation treatments like TMS, ECT, and deep brain stimulation",
    icon: Zap,
    href: "/treatments/interventional",
    badge: "interventional",
  },
  {
    title: "Investigational",
    description:
      "Clinical trial treatments including psilocybin, MDMA, and other breakthrough therapies",
    icon: Beaker,
    href: "/treatments/investigational",
    badge: "investigational",
  },
  {
    title: "Alternative",
    description:
      "Evidence-based alternative treatments like bright light therapy, acupuncture, and mindfulness",
    icon: Sun,
    href: "/treatments/alternative",
    badge: "alternative",
  },
  {
    title: "Therapy",
    description:
      "Psychotherapy approaches including CBT, DBT, EMDR, and other evidence-based modalities",
    icon: Brain,
    href: "/treatments/therapy",
    badge: "therapy",
  },
  {
    title: "Supplements",
    description: "Evidence-based nutritional supplements that may support mental health",
    icon: Leaf,
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
      <section className="relative px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Back Button + Title Row */}
          <div className="mb-4 flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="group text-label-secondary hover:text-label-primary">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Home
              </Button>
            </Link>

            <h1 className="text-2xl font-bold text-label-primary sm:text-3xl">
              Mental Health Treatments
            </h1>

            <div className="w-[140px]"></div>
          </div>

          <div className="text-center">
            <p className="mx-auto mb-3 max-w-2xl text-sm text-label-secondary">
              Explore evidence-based treatments from FDA-approved medications to breakthrough
              investigational therapies.
            </p>

            {/* Stats */}
            <div className="mb-4 flex items-center justify-center gap-4 text-xs text-label-tertiary">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-accent-500"></div>
                {allTreatments.length}+ Total Treatments
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-positive-500"></div>
                Evidence-Based
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-treatment"></div>
                Regularly Updated
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compare Treatments Banner */}
      <section className="px-4 pb-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/treatments/compare" className="group block">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-xl border border-separator bg-surface-grouped p-4 shadow-card-1 transition-all duration-300 group-hover:border-separator group-hover:shadow-card-2 group-hover:-translate-y-0.5"
            >
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-fill-secondary transition-transform duration-300 group-hover:scale-105">
                    <Scale className="h-6 w-6 text-label-secondary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-label-primary transition-colors">
                      Compare Treatments
                    </h2>
                    <p className="text-sm text-label-tertiary">
                      Can&apos;t decide? See side-by-side comparisons like Lexapro vs Zoloft, CBT vs DBT
                    </p>
                  </div>
                </div>
                <div className="hidden items-center gap-2 text-sm font-medium sm:flex">
                  <span className="text-label-tertiary group-hover:text-label-secondary transition-colors">
                    View comparisons
                  </span>
                  <ArrowRight className="h-4 w-4 text-label-primary0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-label-tertiary" />
                </div>
              </div>
            </motion.div>
          </Link>
        </div>
      </section>

      {/* Treatment Category Tiles */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {treatmentCategories.map((category, index) => {
              const IconComponent = category.icon;
              const count = getCategoryCount(category.badge);

              return (
                <Link key={category.href} href={category.href} className="group block">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative h-full overflow-hidden rounded-xl border border-separator bg-surface-grouped shadow-card-1 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-separator group-hover:shadow-card-2"
                  >
                    {/* Content */}
                    <div className="relative p-6">
                      {/* Icon and title */}
                      <div className="mb-4 text-center">
                        <div className="inline-flex rounded-lg p-3 bg-fill-secondary mb-3 transition-transform duration-300 group-hover:scale-105">
                          <IconComponent className="h-6 w-6 text-label-secondary" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold text-label-primary transition-colors">
                          {category.title}
                        </h3>
                        <Badge variant={category.badge as any} size="sm">
                          {count > 0 ? `${count} available` : "Coming soon"}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="mb-4 min-h-12 text-center text-sm leading-relaxed text-label-secondary">
                        {category.description}
                      </p>

                      {/* Call to action */}
                      <div className="flex items-center justify-center gap-2 text-sm font-medium">
                        <span className="text-label-tertiary group-hover:text-label-secondary transition-colors">
                          Explore
                        </span>
                        <ArrowRight className="h-4 w-4 text-label-primary0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-label-tertiary" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
