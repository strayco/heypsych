"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
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
    gradient: "from-blue-500 to-cyan-500",
    hoverGradient: "group-hover:from-blue-600 group-hover:to-cyan-600",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    href: "/treatments/medications",
    badge: "medication",
  },
  {
    title: "Interventional",
    description: "Brain stimulation treatments like TMS, ECT, and deep brain stimulation",
    icon: Zap,
    gradient: "from-purple-500 to-pink-500",
    hoverGradient: "group-hover:from-purple-600 group-hover:to-pink-600",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
    href: "/treatments/interventional",
    badge: "interventional",
  },
  {
    title: "Investigational",
    description:
      "Clinical trial treatments including psilocybin, MDMA, and other breakthrough therapies",
    icon: Beaker,
    gradient: "from-amber-500 to-orange-500",
    hoverGradient: "group-hover:from-amber-600 group-hover:to-orange-600",
    bgColor: "bg-amber-50",
    iconColor: "text-amber-600",
    href: "/treatments/investigational",
    badge: "investigational",
  },
  {
    title: "Alternative",
    description:
      "Evidence-based alternative treatments like bright light therapy, acupuncture, and mindfulness",
    icon: Sun,
    gradient: "from-yellow-500 to-orange-500",
    hoverGradient: "group-hover:from-yellow-600 group-hover:to-orange-600",
    bgColor: "bg-yellow-50",
    iconColor: "text-yellow-600",
    href: "/treatments/alternative",
    badge: "alternative",
  },
  {
    title: "Therapy",
    description:
      "Psychotherapy approaches including CBT, DBT, EMDR, and other evidence-based modalities",
    icon: Brain,
    gradient: "from-green-500 to-emerald-500",
    hoverGradient: "group-hover:from-green-600 group-hover:to-emerald-600",
    bgColor: "bg-green-50",
    iconColor: "text-green-600",
    href: "/treatments/therapy",
    badge: "therapy",
  },
  {
    title: "Supplements",
    description: "Evidence-based nutritional supplements that may support mental health",
    icon: Leaf,
    gradient: "from-emerald-500 to-teal-500",
    hoverGradient: "group-hover:from-emerald-600 group-hover:to-teal-600",
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-600",
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="relative px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Back Button + Title Row */}
          <div className="mb-4 flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="group">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Home
              </Button>
            </Link>

            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Mental Health Treatments
              </span>
            </h1>

            <div className="w-[140px]"></div>
          </div>

          <div className="text-center">
            <p className="mx-auto mb-3 max-w-2xl text-sm text-slate-900">
              Explore evidence-based treatments from FDA-approved medications to breakthrough
              investigational therapies.
            </p>

            {/* Stats */}
            <div className="mb-4 flex items-center justify-center gap-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                {allTreatments.length}+ Total Treatments
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                Evidence-Based
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                Regularly Updated
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compare Treatments Banner */}
      <section className="px-4 pb-2 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Link href="/treatments/compare" className="group block">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-lg transition-all duration-300 hover:border-slate-300 hover:shadow-xl group-hover:-translate-y-0.5"
            >
              {/* Subtle gradient overlay matching other cards */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 opacity-5 transition-opacity duration-500 group-hover:opacity-10" />
              
              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 transition-transform duration-300 group-hover:scale-110">
                    <Scale className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 transition-colors group-hover:text-slate-700">
                      Compare Treatments
                    </h2>
                    <p className="text-sm text-slate-600">
                      Can&apos;t decide? See side-by-side comparisons like Lexapro vs Zoloft, CBT vs DBT
                    </p>
                  </div>
                </div>
                <div className="hidden items-center gap-2 text-sm font-semibold sm:flex">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    View comparisons
                  </span>
                  <ArrowRight className="h-4 w-4 text-slate-400 transition-transform duration-300 group-hover:translate-x-1" />
                </div>
              </div>
              
              {/* Hover ring effect matching other cards */}
              <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent transition-all duration-300 group-hover:ring-slate-200" />
            </motion.div>
          </Link>
        </div>
      </section>

      {/* Treatment Category Tiles */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {treatmentCategories.map((category, index) => {
              const IconComponent = category.icon;
              const count = getCategoryCount(category.badge);

              return (
                <Link key={category.href} href={category.href} className="group block">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative h-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-500 group-hover:-translate-y-1 hover:shadow-xl"
                  >
                    {/* Gradient background */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${category.gradient} ${category.hoverGradient} opacity-5 transition-opacity duration-500 group-hover:opacity-10`}
                    />

                    {/* Content */}
                    <div className="relative p-6">
                      {/* Icon and title */}
                      <div className="mb-4 text-center">
                        <div
                          className={`inline-flex rounded-xl p-3 ${category.bgColor} mb-3 transition-transform duration-300 group-hover:scale-110`}
                        >
                          <IconComponent className={`h-6 w-6 ${category.iconColor}`} />
                        </div>
                        <h3 className="mb-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-slate-700">
                          {category.title}
                        </h3>
                        <Badge variant={category.badge as any} size="sm">
                          {count > 0 ? `${count} available` : "Coming soon"}
                        </Badge>
                      </div>

                      {/* Description */}
                      <p className="mb-4 min-h-[3rem] text-center text-sm leading-relaxed text-slate-900">
                        {category.description}
                      </p>

                      {/* Call to action */}
                      <div className="flex items-center justify-center gap-2 text-sm font-semibold">
                        <span
                          className={`bg-gradient-to-r ${category.gradient} bg-clip-text text-transparent`}
                        >
                          Explore
                        </span>
                        <ArrowRight className="h-4 w-4 text-slate-400 transition-transform duration-300 group-hover:translate-x-1" />
                      </div>
                    </div>

                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent transition-all duration-300 group-hover:ring-slate-200" />
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
