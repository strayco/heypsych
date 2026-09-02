// src/app/architect/page.tsx
// Practice Architect - Gateway Experience
// Three clear entry paths with equal prominence

import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  ClipboardCheck,
  Compass,
  Building2,
  Check,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";

const canonicalUrl = `${siteConfig.url}/architect`;

export const metadata: Metadata = {
  title: "Practice Architect™ | Build Your Mental Health Practice Stack",
  description:
    "Build your ideal mental health practice technology stack with Practice Architect™. Visual practice builder with transparent fit scores and real pricing.",
  keywords: [
    "mental health EHR",
    "therapy practice software",
    "practice management",
    "EHR comparison",
    "mental health billing",
    "telehealth platform",
    "practice technology stack",
    "Practice Architect",
  ],
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: "Practice Architect™ | Build Your Mental Health Practice Stack",
    description:
      "Build your ideal mental health practice technology stack with Practice Architect™ — transparent fit scores, real pricing.",
    url: canonicalUrl,
    type: "website",
  },
};

// Entry mode configurations
const ENTRY_MODES = [
  {
    id: "build-for-me",
    title: "Build for Me",
    description: "Tell us about your practice and get personalized stack recommendations",
    icon: Sparkles,
    color: "accent",
    href: "/architect/my-practice",
    steps: [
      "Answer 7 practice questions",
      "Get instant stack recommendations",
      "See fit scores for each product",
      "Customize your final stack",
    ],
    bestFor: "New practices or those wanting fresh recommendations",
    isPrimary: false,
    comingSoon: true,
  },
  {
    id: "build-myself",
    title: "Build Myself",
    description: "Explore all options and craft your stack capability by capability",
    icon: Compass,
    color: "blue",
    href: "/architect/my-practice?skip=1",
    steps: [
      "Browse 6 lifecycle stages",
      "Explore 40+ capabilities",
      "Compare products side-by-side",
      "Build at your own pace",
    ],
    bestFor: "Those who know what they need or want to explore",
    isPrimary: true,
    comingSoon: false,
  },
  {
    id: "audit-stack",
    title: "Audit My Stack",
    description: "Enter your current tools to find gaps, overlaps, and better alternatives",
    icon: ClipboardCheck,
    color: "emerald",
    href: "/architect/audit",
    steps: [
      "Add your current products",
      "See coverage gaps",
      "Identify redundancies",
      "Preview replacements",
    ],
    bestFor: "Established practices looking to optimize",
    isPrimary: false,
    comingSoon: true,
  },
];

export default function ArchitectEntryPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-separator bg-gradient-to-b from-surface to-canvas">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
              <Building2 className="h-4 w-4" />
              Practice Stack Builder
            </div>

            {/* Headline */}
            <h1 className="mt-6 text-4xl font-bold tracking-tight text-label-primary sm:text-5xl">
              Practice Architect™
            </h1>

            {/* Subheadline */}
            <p className="mx-auto mt-4 max-w-2xl text-lg text-label-secondary">
              Build your ideal mental health practice technology stack with transparent fit scores and real pricing.
            </p>
          </div>
        </div>
      </section>

      {/* Entry Mode Selection */}
      <section className="bg-canvas px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-label-primary sm:text-3xl">
              How would you like to start?
            </h2>
            <p className="mt-3 text-label-secondary">
              Choose your approach. You can always switch modes later.
            </p>
          </div>

          {/* Three Cards */}
          <div className="grid gap-6 md:grid-cols-3">
            {ENTRY_MODES.map((mode) => {
              const Icon = mode.icon;
              const colorMap = {
                accent: {
                  bg: "bg-accent/5",
                  border: "border-accent/20 hover:border-accent/40",
                  icon: "bg-accent text-white",
                  button: "bg-accent text-white hover:bg-accent-hover",
                  badge: "bg-accent/10 text-accent",
                },
                blue: {
                  bg: "bg-blue-50",
                  border: "border-blue-200 hover:border-blue-300",
                  icon: "bg-blue-600 text-white",
                  button: "bg-blue-600 text-white hover:bg-blue-700",
                  badge: "bg-blue-100 text-blue-700",
                },
                emerald: {
                  bg: "bg-emerald-50",
                  border: "border-emerald-200 hover:border-emerald-300",
                  icon: "bg-emerald-600 text-white",
                  button: "bg-emerald-600 text-white hover:bg-emerald-700",
                  badge: "bg-emerald-100 text-emerald-700",
                },
              };
              const colorClasses = colorMap[mode.color as keyof typeof colorMap];

              return (
                <div
                  key={mode.id}
                  className={`
                    relative flex flex-col rounded-2xl border-2 p-6 transition-all
                    ${mode.comingSoon ? "bg-neutral-50 border-neutral-200" : `${colorClasses.bg} ${colorClasses.border}`}
                    ${mode.isPrimary && !mode.comingSoon ? "ring-2 ring-accent/20 ring-offset-2" : ""}
                  `}
                >
                  {/* Primary badge */}
                  {mode.isPrimary && !mode.comingSoon && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
                        Recommended
                      </span>
                    </div>
                  )}

                  {/* Coming Soon badge */}
                  {mode.comingSoon && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-neutral-500 px-3 py-1 text-xs font-semibold text-white">
                        Coming Soon
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${mode.comingSoon ? "bg-neutral-300 text-white" : colorClasses.icon}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className={`text-lg font-semibold ${mode.comingSoon ? "text-label-secondary" : "text-label-primary"}`}>{mode.title}</h3>
                      <p className={`mt-1 text-sm ${mode.comingSoon ? "text-label-tertiary" : "text-label-secondary"}`}>{mode.description}</p>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="mt-6 flex-1">
                    <ol className="space-y-2">
                      {mode.steps.map((step, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-sm">
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${mode.comingSoon ? "bg-neutral-200 text-neutral-500" : colorClasses.badge}`}>
                            {idx + 1}
                          </span>
                          <span className={mode.comingSoon ? "text-label-tertiary" : "text-label-secondary"}>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* Best for */}
                  <p className="mt-6 text-xs text-label-tertiary">
                    <strong className="font-medium">Best for:</strong> {mode.bestFor}
                  </p>

                  {/* CTA Button */}
                  {mode.comingSoon ? (
                    <div
                      className="mt-6 flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-neutral-200 px-4 py-3 text-sm font-semibold text-neutral-500"
                    >
                      Coming Soon
                    </div>
                  ) : (
                    <Link
                      href={mode.href}
                      className={`
                        mt-6 flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors
                        ${colorClasses.button}
                      `}
                    >
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </div>
              );
            })}
          </div>

          {/* Demo link */}
          <div className="mt-8 text-center">
            <Link
              href="/architect/demo"
              className="text-sm text-label-secondary hover:text-label-primary transition-colors"
            >
              Just want to explore? <span className="underline">Try the interactive demo</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Summary */}
      <section className="border-y border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "40+ Products", sublabel: "Curated for mental health" },
              { label: "Transparent Pricing", sublabel: "Real costs, no surprises" },
              { label: "Fit Scores", sublabel: "Transparent criteria for every product" },
              { label: "No Account", sublabel: "Start building immediately" },
            ].map((feature) => (
              <div key={feature.label} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                  <Check className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-label-primary">{feature.label}</p>
                  <p className="text-xs text-label-tertiary">{feature.sublabel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer note */}
      <section className="bg-canvas px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm text-label-tertiary">
            Practice Architect™ uses transparent, deterministic scoring —{" "}
            <Link href="/about/review-methodology" className="text-accent hover:underline">
              see how we evaluate products
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}
