"use client";

/**
 * SupportEntry — "What brings you here?"
 *
 * The first step after a visitor chooses "Find my way" on the homepage.
 *
 * Plain-language starting points, each leading to an existing HeyPsych
 * experience. Choosing one is navigation, not assessment: nothing is scored,
 * stored, or inferred, and no option implies a diagnosis or a level of
 * urgency. Analytics records only which starting point was chosen (an id such
 * as "understand"), never anything a visitor writes or answers.
 *
 * Destinations are deliberately existing routes. "Treatment or support"
 * continues to the existing care-type choice on this page.
 */

import Link from "next/link";
import { trackIntentSelect } from "@/lib/analytics/product-events";

export interface SupportStartingPoint {
  id: string;
  label: string;
  leadsTo: string;
  href: string;
}

export const SUPPORT_STARTING_POINTS: SupportStartingPoint[] = [
  {
    id: "support",
    label: "I'm looking for treatment or support.",
    leadsTo: "One safety question, then a next step that updates as you answer. About a minute. Your answers stay on this device.",
    href: "/find-support?need=support",
  },
  {
    id: "understand",
    label: "I'm trying to understand what I'm experiencing.",
    leadsTo: "Look up what you're noticing, in plain language.",
    href: "/symptoms",
  },
  {
    id: "someone",
    label: "I'm helping someone I care about.",
    leadsTo: "Groups and programs for families, partners, and friends.",
    href: "/resources/support-community/organizations-communities",
  },
  {
    id: "professional",
    label: "I'm looking for a mental health professional.",
    leadsTo: "Therapy and psychiatry services you can compare.",
    href: "/tools/find-support",
  },
  {
    id: "tools",
    label: "I'm exploring tools that might help.",
    leadsTo: "Apps and digital tools for things like sleep, stress, and mood.",
    href: "/tools",
  },
  {
    id: "unsure",
    label: "I'm not sure where to start.",
    leadsTo: "Short, plain-language guides to begin with.",
    href: "/learn",
  },
];

export function SupportEntry() {
  return (
    <ul role="list" className="grid gap-3 sm:grid-cols-2">
      {SUPPORT_STARTING_POINTS.map((point, i) => (
        <li key={point.id} className={i === 0 ? "sm:col-span-2" : undefined}>
          <Link
            href={point.href}
            onClick={() => trackIntentSelect(`find_support:${point.id}`)}
            className={`group focus-visible:ring-accent focus-visible:ring-offset-canvas flex h-full items-start justify-between gap-4 rounded-2xl border px-5 py-4 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
              i === 0 ? "border-label-primary bg-label-primary sm:py-5" : "border-separator hover:border-separator-opaque hover:bg-canvas-elevated bg-white"
            }`}
          >
            <span>
              <span className={`block text-[16px] leading-snug font-medium ${i === 0 ? "text-canvas sm:text-[18px]" : "text-label-primary"}`}>
                {point.label}
              </span>
              <span className={`mt-1 block text-[14px] leading-relaxed ${i === 0 ? "text-canvas/80" : "text-label-secondary"}`}>
                {point.leadsTo}
              </span>
            </span>
            <span
              aria-hidden="true"
              className={`${i === 0 ? "text-canvas" : "text-label-tertiary group-hover:text-accent"} mt-0.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none`}
            >
              →
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
