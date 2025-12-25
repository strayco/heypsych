"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Entity } from "@/lib/types/database";
import { CONDITION_CATEGORIES } from "@/lib/config/condition-categories";
import { ConditionsSearchBar } from "@/components/conditions/ConditionsSearchBar";
import { PopularConditionsChips } from "@/components/conditions/PopularConditionsChips";
import { AlphabeticalDirectory } from "@/components/conditions/AlphabeticalDirectory";

// Use categories from config (all 13 SEO-optimized categories)
const conditionCategories = CONDITION_CATEGORIES;

interface ConditionsOverviewClientProps {
  conditions: Entity[];
}

export function ConditionsOverviewClient({ conditions }: ConditionsOverviewClientProps) {
  const renderConditionTile = (category: any, index: number) => {
    const IconComponent = category.icon;

    return (
      <Link key={category.href} href={category.href} className="group block">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`relative h-full overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-lg transition-all duration-500 group-hover:-translate-y-1 hover:shadow-xl ${
            category.isSecondary ? "opacity-90 hover:opacity-100" : ""
          }`}
        >
          <div
            className={`absolute inset-0 bg-gradient-to-br ${category.gradient} ${category.hoverGradient} opacity-5 transition-opacity duration-500 group-hover:opacity-10`}
          />

          <div className="relative p-4">
            <div className="mb-3 text-center">
              <div className="mb-2 flex items-center justify-center gap-2">
                <div
                  className={`inline-flex rounded-xl p-2 ${category.bgColor} transition-transform duration-300 group-hover:scale-110`}
                >
                  <IconComponent className={`h-5 w-5 ${category.iconColor}`} />
                </div>
                <div className="text-xl">{category.emoji}</div>
              </div>
              <h3 className="mb-2 text-base font-bold text-neutral-900 transition-colors group-hover:text-neutral-900">
                {category.displayTitle}
              </h3>
            </div>

            <p className="mb-3 min-h-10 text-center text-xs leading-relaxed text-neutral-900">
              {category.subtitle}
            </p>

            <div className="flex items-center justify-center gap-1 text-xs font-semibold">
              <span className={`bg-linear-to-r ${category.gradient} bg-clip-text text-transparent`}>
                Explore {category.displayTitle.split(' (')[0]}
              </span>
              <ArrowRight className="h-3 w-3 text-neutral-500 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>

          <div className="absolute inset-0 rounded-2xl ring-2 ring-transparent transition-all duration-300 group-hover:ring-neutral-200" />
        </motion.div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <section className="relative px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="group">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Home
              </Button>
            </Link>

            <h1 className="text-2xl font-bold text-neutral-900 sm:text-3xl">
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                Mental Health Conditions
              </span>
            </h1>

            <div className="w-[140px]"></div>
          </div>

          <div className="mb-8 text-center">
            <p className="mx-auto mb-4 max-w-2xl text-sm text-neutral-900">
              Browse comprehensive information about mental health conditions, symptoms, diagnosis, and
              evidence-based treatment options.
            </p>

            <div className="flex items-center justify-center gap-4 text-xs text-neutral-900">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                {conditions.length}+ Conditions
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                Evidence-Based
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-500"></div>
                Medically Reviewed
              </div>
            </div>
          </div>

          {/* Search Bar (with typeahead) */}
          <div className="mb-6">
            <ConditionsSearchBar conditions={conditions} />
          </div>

          {/* Popular Conditions Chips */}
          <div className="mb-8">
            <PopularConditionsChips />
          </div>

          {/* Category Cards Grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-12">
            {conditionCategories.map(renderConditionTile)}
          </div>
        </div>
      </section>

      {/* A–Z Directory (footer - critical for SEO crawlability) */}
      <AlphabeticalDirectory conditions={conditions} />
    </div>
  );
}
