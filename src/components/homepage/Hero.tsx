"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import {
  trackHomepagePsychTrailsClick,
  trackHomepageHowItWorksClick,
} from "@/lib/analytics/product-events";

/**
 * Hero Section - Premium Product-First Design
 *
 * Design principles:
 * - Dark, premium feel that matches the product
 * - Flagship product positioning
 * - High-contrast typography
 * - Restrained accent usage
 * - Clear visual hierarchy
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden bg-canvas px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(139,92,246,0.12),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_80%_80%,rgba(139,92,246,0.06),transparent)]" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '64px 64px'
        }}
      />

      <div className="relative mx-auto max-w-4xl text-center">
        {/* Product badge - subtle, premium */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent-600/30 bg-accent-tint px-4 py-1.5 backdrop-blur-sm">
          <div className="h-1.5 w-1.5 rounded-full bg-accent-400 animate-pulse-subtle" />
          <span className="text-sm font-medium text-accent-700">PsychTrails</span>
        </div>

        {/* H1 - Strong hierarchy, premium typography */}
        <h1 className="mb-6 text-4xl font-semibold tracking-tight text-label-primary sm:text-5xl lg:text-6xl">
          Practice hard moments
          <span className="block mt-2 text-gradient">
            before they happen.
          </span>
        </h1>

        {/* Subhead - Clear, readable secondary text */}
        <p className="mx-auto mb-10 max-w-2xl text-lg text-label-secondary sm:text-xl">
          Scenario-based training for anxiety, social situations, and real-life challenges.
          Build the patterns that matter.
        </p>

        {/* CTAs - Premium button styling */}
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/psychtrails"
            onClick={trackHomepagePsychTrailsClick}
            className="group inline-flex h-12 items-center justify-center gap-2.5 rounded-xl bg-canvas-elevated px-7 text-base font-semibold text-label-primary shadow-medium transition-all hover:bg-white hover:shadow-large"
          >
            <Play className="h-4 w-4" />
            <span>Start Playing</span>
          </Link>
          <Link
            href="/how-it-works"
            onClick={trackHomepageHowItWorksClick}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-separator bg-surface-grouped/50 px-7 text-base font-medium text-label-secondary transition-all hover:border-separator-opaque hover:bg-surface-grouped hover:text-label-primary"
          >
            <span>How It Works</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Trust indicator - Subtle, professional */}
        <p className="mt-12 text-sm text-label-primary0">
          Evidence-based scenarios designed with clinical psychologists
        </p>
      </div>
    </section>
  );
}
