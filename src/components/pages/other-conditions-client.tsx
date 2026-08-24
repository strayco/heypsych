"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface CategoryTile {
  title: string;
  description: string;
  href: string;
}

const otherCategories: CategoryTile[] = [
  {
    title: "Sleep Disorders",
    description: "Insomnia, sleep apnea, narcolepsy, and other sleep-wake disorders",
    href: "/conditions/other/sleep-disorders",
  },
  {
    title: "Sexual Health",
    description: "Sexual dysfunctions and sexual health-related conditions",
    href: "/conditions/other/sexual-disorders",
  },
  {
    title: "Gender Identity",
    description: "Gender dysphoria and gender identity-related conditions",
    href: "/conditions/other/gender-disorders",
  },
  {
    title: "Dissociative Disorders",
    description: "Dissociative identity disorder, amnesia, and related conditions",
    href: "/conditions/other/dissociative-disorders",
  },
  {
    title: "Somatic Disorders",
    description: "Somatic symptom disorders and illness-related conditions",
    href: "/conditions/other/somatic-disorders",
  },
  {
    title: "Elimination Disorders",
    description: "Enuresis, encopresis, and elimination-related conditions",
    href: "/conditions/other/elimination-disorders",
  },
  {
    title: "Paraphilic Disorders",
    description: "Paraphilic disorders and related conditions",
    href: "/conditions/other/paraphilic-disorders",
  },
];

export function OtherConditionsClient() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <section className="border-b border-separator bg-surface px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Back Link */}
          <Link
            href="/conditions"
            className="mb-6 inline-flex items-center gap-2 text-sm text-label-secondary hover:text-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            All Conditions
          </Link>

          {/* Title Section */}
          <div className="mt-6">
            <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
              Condition Category
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-label-primary sm:text-4xl">
              Other Conditions
            </h1>
            <p className="mt-3 text-lg text-label-secondary">
              Sleep disorders, sexual health, dissociative disorders, and other specialized mental
              health conditions.
            </p>

            {/* Stats */}
            <div className="mt-4 text-sm text-label-tertiary">
              {otherCategories.length} categories
            </div>
          </div>
        </div>
      </section>

      {/* Category Tiles */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
            Browse
          </p>
          <h2 className="mt-1 text-xl font-semibold text-label-primary">
            Subcategories
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {otherCategories.map((category) => (
              <Link key={category.href} href={category.href} className="group block">
                <div className="flex items-center justify-between rounded-xl border border-separator bg-surface p-5 transition-all hover:border-neutral-300 hover:shadow-soft">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-label-primary group-hover:text-accent transition-colors">
                      {category.title}
                    </h3>
                    <p className="mt-1 text-sm text-label-secondary line-clamp-2">
                      {category.description}
                    </p>
                  </div>
                  <ArrowRight className="ml-4 h-4 w-4 shrink-0 text-label-quaternary transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Back to Conditions */}
      <section className="border-t border-separator px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/conditions"
            className="inline-flex items-center gap-2 text-sm font-medium text-label-secondary hover:text-accent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All Conditions
          </Link>
        </div>
      </section>
    </div>
  );
}
