"use client";

import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

/**
 * Popular Conditions Chips
 *
 * 8 clickable chips for the most-searched mental health conditions.
 * These provide quick access to high-traffic condition pages.
 *
 * Chips: Depression, Anxiety, ADHD, Bipolar, PTSD, OCD, Autism, Sleep/Insomnia
 *
 * Design: Matches existing CrisisCategoryFilter chip styling (Apple-like aesthetic)
 */

const POPULAR_CONDITIONS = [
  {
    slug: "major-depressive-disorder",
    label: "Depression",
    color: "blue",
  },
  {
    slug: "generalized-anxiety-disorder",
    label: "Anxiety",
    color: "yellow",
  },
  {
    slug: "attention-deficit-hyperactivity-disorder",
    label: "ADHD",
    color: "purple",
  },
  {
    slug: "bipolar-i-disorder",
    label: "Bipolar",
    color: "cyan",
  },
  {
    slug: "posttraumatic-stress-disorder",
    label: "PTSD",
    color: "red",
  },
  {
    slug: "obsessive-compulsive-disorder",
    label: "OCD",
    color: "teal",
  },
  {
    slug: "autism-spectrum-disorder",
    label: "Autism",
    color: "emerald",
  },
  {
    slug: "insomnia-disorder",
    label: "Sleep/Insomnia",
    color: "indigo",
  },
];

const colorClasses = {
  blue: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  yellow: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
  purple: "bg-purple-100 text-purple-700 hover:bg-purple-200",
  cyan: "bg-cyan-100 text-cyan-700 hover:bg-cyan-200",
  red: "bg-red-100 text-red-700 hover:bg-red-200",
  teal: "bg-teal-100 text-teal-700 hover:bg-teal-200",
  emerald: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
  indigo: "bg-indigo-100 text-indigo-700 hover:bg-indigo-200",
};

export function PopularConditionsChips() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="mr-2 text-sm font-medium text-slate-700">Popular:</span>
      {POPULAR_CONDITIONS.map((condition) => (
        <Link
          key={condition.slug}
          href={`/conditions/${condition.slug}`}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-all",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            colorClasses[condition.color as keyof typeof colorClasses]
          )}
        >
          {condition.label}
        </Link>
      ))}
    </div>
  );
}
