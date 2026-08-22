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
 * Design: Graphite dark mode styling
 */

const POPULAR_CONDITIONS = [
  {
    slug: "major-depressive-disorder",
    label: "Depression",
  },
  {
    slug: "generalized-anxiety-disorder",
    label: "Anxiety",
  },
  {
    slug: "attention-deficit-hyperactivity-disorder",
    label: "ADHD",
  },
  {
    slug: "bipolar-i-disorder",
    label: "Bipolar",
  },
  {
    slug: "posttraumatic-stress-disorder",
    label: "PTSD",
  },
  {
    slug: "obsessive-compulsive-disorder",
    label: "OCD",
  },
  {
    slug: "autism-spectrum-disorder",
    label: "Autism",
  },
  {
    slug: "insomnia-disorder",
    label: "Sleep/Insomnia",
  },
];

export function PopularConditionsChips() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <span className="mr-2 text-sm font-medium text-label-tertiary">Popular:</span>
      {POPULAR_CONDITIONS.map((condition) => (
        <Link
          key={condition.slug}
          href={`/conditions/${condition.slug}`}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-all",
            "border border-separator bg-surface-grouped text-label-secondary",
            "hover:border-separator hover:bg-fill-secondary hover:text-label-primary",
            "focus:outline-none focus:ring-2 focus:ring-separator focus:ring-offset-2 focus:ring-offset-canvas"
          )}
        >
          {condition.label}
        </Link>
      ))}
    </div>
  );
}
