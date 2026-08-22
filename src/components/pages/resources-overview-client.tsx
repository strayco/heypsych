"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ClipboardCheck,
  Users,
  Smartphone,
  BookOpen,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { ResourceSearch } from "@/components/resources/ResourceSearch";
import { PopularResourceChips } from "@/components/resources/PopularResourceChips";
import type { Entity } from "@/lib/types/database";

const resourceCategories = [
  {
    title: "Assessments & Screeners",
    description: "PHQ‑9, GAD‑7, PCL‑5, ASRS and more with scoring guides and PDFs.",
    icon: ClipboardCheck,
    href: "/resources/assessments-screeners",
    emoji: "📝",
  },
  {
    title: "Support & Community",
    description: "NAMI, DBSA, crisis helplines, caregiver & youth support, identity‑based communities.",
    icon: Users,
    href: "/resources/support-community",
    emoji: "🤝",
  },
  {
    title: "Digital Tools",
    description: "Apps & web tools for mood, sleep, mindfulness — includes sponsored.",
    icon: Smartphone,
    href: "/resources/digital-tools",
    emoji: "📱",
  },
  {
    title: "Knowledge Hub",
    description: "4-pillar content hub: self-help & wellness, research & science, how-to guides, and community stories.",
    icon: BookOpen,
    href: "/resources/knowledge-hub",
    emoji: "🧠",
  },
];

function ResourceTile({ category, index }: { category: typeof resourceCategories[0]; index: number }) {
  const Icon = category.icon;
  return (
    <Link href={category.href} className="group block">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        className="relative h-full overflow-hidden rounded-xl border border-separator bg-surface-grouped shadow-card-1 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-separator group-hover:shadow-card-2"
      >
        <div className="relative p-6">
          <div className="mb-4 text-center">
            <div className="mb-3 flex items-center justify-center gap-3">
              <div className="inline-flex rounded-lg p-3 bg-fill-secondary transition-transform duration-300 group-hover:scale-105">
                <Icon className="h-6 w-6 text-label-secondary" />
              </div>
              <div className="text-xl opacity-80">{category.emoji}</div>
            </div>
            <h3 className="text-lg font-semibold text-label-primary transition-colors">
              {category.title}
            </h3>
          </div>

          <p className="mb-4 min-h-12 text-center text-sm leading-relaxed text-label-secondary">
            {category.description}
          </p>

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
}

interface ResourcesOverviewClientProps {
  resources: Entity[];
}

export function ResourcesOverviewClient({ resources }: ResourcesOverviewClientProps) {
  return (
    <div className="bg-canvas">
      {/* Hero */}
      <section className="relative px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="group text-label-secondary hover:text-label-primary">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Home
              </Button>
            </Link>

            <h1 className="text-2xl font-bold text-label-primary sm:text-3xl">
              Resources
            </h1>

            <div className="w-[140px]"></div>
          </div>

          <div className="text-center">
            <p className="mx-auto mb-3 max-w-2xl text-sm text-label-secondary">
              A clean hub for assessments, community support, digital tools, and practical guides.
            </p>
          </div>
        </div>
      </section>

      {/* Search Bar */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <ResourceSearch resources={resources} />
        </div>
      </section>

      {/* Popular Resources */}
      <section className="px-4 py-4 sm:px-6 lg:px-8">
        <PopularResourceChips />
      </section>

      {/* 2×2 Tile Grid */}
      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2">
            {resourceCategories.map((cat, i) => (
              <ResourceTile key={cat.href} category={cat} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Optional CTA */}
      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-xl border border-separator bg-surface-grouped/50 p-6">
            <h2 className="text-center text-lg font-semibold text-label-primary mb-2">
              Looking for something specific?
            </h2>
            <p className="mb-4 text-center text-sm text-label-tertiary">
              Tell us what resource would help most and we'll prioritize it.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Button variant="secondary" size="sm">Request a Resource</Button>
              <Link href="/resources/assessments-screeners">
                <Button variant="primary" size="sm">Browse Assessments</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}




