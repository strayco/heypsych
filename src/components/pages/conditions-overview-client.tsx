"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Entity } from "@/lib/types/database";
import { CONDITION_CATEGORIES } from "@/lib/config/condition-categories";
import { ConditionsSearchBar } from "@/components/conditions/ConditionsSearchBar";
import { PopularConditionsChips } from "@/components/conditions/PopularConditionsChips";
import { AlphabeticalDirectory } from "@/components/conditions/AlphabeticalDirectory";

const conditionCategories = CONDITION_CATEGORIES;

interface ConditionsOverviewClientProps {
  conditions: Entity[];
}

export function ConditionsOverviewClient({ conditions }: ConditionsOverviewClientProps) {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero */}
      <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
            Evidence-Based Information
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-label-primary sm:text-4xl">
            Mental Health Conditions
          </h1>
          <p className="mt-3 text-lg text-label-secondary">
            {conditions.length}+ conditions with symptoms, diagnosis, and treatment options.
          </p>

          {/* Search Bar */}
          <div className="mx-auto mt-8 max-w-lg">
            <ConditionsSearchBar conditions={conditions} />
          </div>

          {/* Popular Conditions Chips */}
          <div className="mt-6">
            <PopularConditionsChips />
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
            Categories
          </p>
          <h2 className="mt-1 text-xl font-semibold text-label-primary">
            Browse by Type
          </h2>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {conditionCategories.map((category) => (
              <Link
                key={category.href}
                href={category.href}
                className="group flex items-center justify-between rounded-xl border border-separator bg-surface p-4 transition-all hover:border-neutral-300 hover:shadow-soft"
              >
                <div>
                  <h3 className="font-medium text-label-primary group-hover:text-accent">
                    {category.displayTitle}
                  </h3>
                  <p className="mt-1 text-sm text-label-tertiary line-clamp-1">
                    {category.subtitle}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-label-quaternary transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* A–Z Directory */}
      <AlphabeticalDirectory conditions={conditions} />
    </div>
  );
}
