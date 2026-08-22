"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
          transition={{ delay: index * 0.05 }}
          className={`relative h-full overflow-hidden rounded-xl border border-separator bg-surface-grouped shadow-card-1 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-separator group-hover:shadow-card-2 ${
            category.isSecondary ? "opacity-90 hover:opacity-100" : ""
          }`}
        >
          {/* Subtle gradient overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-[0.03] transition-opacity duration-300 group-hover:opacity-[0.06]`}
          />

          <div className="relative p-4">
            <div className="mb-3 text-center">
              <div className="mb-2 flex items-center justify-center gap-2">
                <div
                  className="inline-flex rounded-lg p-2 bg-fill-secondary transition-transform duration-300 group-hover:scale-105"
                >
                  <IconComponent className="h-5 w-5 text-label-secondary" />
                </div>
                <div className="text-lg opacity-80">{category.emoji}</div>
              </div>
              <h3 className="mb-2 text-base font-semibold text-label-primary transition-colors">
                {category.displayTitle}
              </h3>
            </div>

            <p className="mb-3 min-h-10 text-center text-xs leading-relaxed text-label-secondary">
              {category.subtitle}
            </p>

            <div className="flex items-center justify-center gap-1 text-xs font-medium">
              <span className="text-label-tertiary group-hover:text-label-secondary transition-colors">
                Explore {category.displayTitle.split(' (')[0]}
              </span>
              <ArrowRight className="h-3 w-3 text-label-primary0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-label-tertiary" />
            </div>
          </div>
        </motion.div>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-canvas">
      <section className="relative px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/">
              <Button variant="ghost" className="group text-label-secondary hover:text-label-primary">
                <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Home
              </Button>
            </Link>

            <h1 className="text-2xl font-bold text-label-primary sm:text-3xl">
              Mental Health Conditions
            </h1>

            <div className="w-[140px]"></div>
          </div>

          <div className="mb-8 text-center">
            <p className="mx-auto mb-4 max-w-2xl text-sm text-label-secondary">
              Browse comprehensive information about mental health conditions, symptoms, diagnosis, and
              evidence-based treatment options.
            </p>

            <div className="flex items-center justify-center gap-4 text-xs text-label-tertiary">
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-accent-500"></div>
                {conditions.length}+ Conditions
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-positive-500"></div>
                Evidence-Based
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-treatment"></div>
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
