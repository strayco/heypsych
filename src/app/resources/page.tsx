"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardCheck,
  Users,
  FileText,
  AlertTriangle,
  Smartphone,
  BookOpen,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

// Four simplified resource categories -> 2×2 grid
const resourceCategories = [
  {
    title: "Assessments & Screeners",
    description: "PHQ‑9, GAD‑7, PCL‑5, ASRS and more with scoring guides and PDFs.",
    icon: ClipboardCheck,
    gradient: "from-sky-500 to-indigo-600",
    hoverGradient: "group-hover:from-sky-600 group-hover:to-indigo-700",
    bgColor: "bg-sky-50",
    iconColor: "text-sky-600",
    href: "/resources/assessments-screeners",
    emoji: "📝",
  },
  {
    title: "Support & Community",
    description: "NAMI, DBSA, crisis helplines, caregiver & youth support, identity‑based communities.",
    icon: Users,
    gradient: "from-emerald-500 to-teal-600",
    hoverGradient: "group-hover:from-emerald-600 group-hover:to-teal-700",
    bgColor: "bg-emerald-50",
    iconColor: "text-emerald-600",
    href: "/resources/support-community",
    emoji: "🤝",
  },
  {
    title: "Digital Tools",
    description: "Apps & web tools for mood, sleep, mindfulness — includes sponsored.",
    icon: Smartphone,
    gradient: "from-blue-500 to-cyan-600",
    hoverGradient: "group-hover:from-blue-600 group-hover:to-cyan-700",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600",
    href: "/resources/digital-tools",
    emoji: "📱",
  },
  {
    title: "Knowledge Hub",
    description: "4-pillar content hub: self-help & wellness, research & science, how-to guides, and community stories.",
    icon: BookOpen,
    gradient: "from-purple-500 to-fuchsia-600",
    hoverGradient: "group-hover:from-purple-600 group-hover:to-fuchsia-700",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600",
    href: "/resources/knowledge-hub",
    emoji: "🧠",
  },
];

function ResourceTile({ category, index }: { category: any; index: number }) {
  const Icon = category.icon;
  return (
    <Link href={category.href} className="group block">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.06 }}
        className="relative h-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg transition-all duration-500 group-hover:-translate-y-1 hover:shadow-xl"
      >
        {/* Gradient wash */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${category.gradient} ${category.hoverGradient} opacity-5 transition-opacity duration-500 group-hover:opacity-10`}
        />

        <div className="relative p-6">
          {/* Icon + Title */}
          <div className="mb-4 text-center">
            <div className="mb-3 flex items-center justify-center gap-3">
              <div
                className={`inline-flex rounded-xl p-3 ${category.bgColor} transition-transform duration-300 group-hover:scale-110`}
              >
                <Icon className={`h-6 w-6 ${category.iconColor}`} />
              </div>
              <div className="text-2xl">{category.emoji}</div>
            </div>
            <h3 className="text-lg font-bold text-neutral-900 transition-colors group-hover:text-neutral-800">
              {category.title}
            </h3>
          </div>

          <p className="mb-4 min-h-[3rem] text-center text-sm leading-relaxed text-neutral-800">
            {category.description}
          </p>

          <div className="flex items-center justify-center gap-2 text-sm font-semibold">
            <span className={`bg-gradient-to-r ${category.gradient} bg-clip-text text-transparent`}>
              Explore
            </span>
            <ArrowRight className="h-4 w-4 text-neutral-600 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>

        <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent transition-all duration-300 group-hover:ring-slate-200" />
      </motion.div>
    </Link>
  );
}

export default function ResourcesPage() {
  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero */}
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

            <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Resources
              </span>
            </h1>

            <div className="w-[140px]"></div>
          </div>

          <div className="text-center">
          <p className="mx-auto mb-3 max-w-2xl text-sm text-neutral-800">
            A clean hub for assessments, community support, digital tools, and practical guides.
          </p>
          </div>
        </div>
      </section>

      {/* 2×2 Tile Grid */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
            {resourceCategories.map((cat, i) => (
              <ResourceTile key={cat.href} category={cat} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Optional CTA */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Card className="rounded-3xl border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader className="pb-0 text-center">
              <CardTitle className="text-xl font-bold text-neutral-900">
                Looking for something specific?
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <div className="mb-4 text-center text-neutral-800">
                Tell us what resource would help most and we’ll prioritize it.
              </div>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button variant="outline">Request a Resource</Button>
                <Link href="/resources/assessments-screeners">
                  <Button>Browse Assessments</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

    </div>
  );
}
