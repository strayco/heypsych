// src/app/architect/page.tsx
// Practice Stack Architect - Entry Experience
// Apple-inspired, mode-first architecture workspace

import { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Settings,
  ClipboardCheck,
  Building2,
  Shield,
  BarChart3,
  Layers,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";

const canonicalUrl = `${siteConfig.url}/architect`;

export const metadata: Metadata = {
  title: "Practice Architect™ | Build Your Mental Health Practice Stack",
  description:
    "Build your ideal mental health practice technology stack with Practice Architect™. Compare EHRs, billing software, telehealth platforms, and more with transparent fit scores and pricing.",
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

// Mode card configuration
const ARCHITECT_MODES = [
  {
    id: "build-for-me",
    title: "Build for Me",
    description: "Tell us about your practice and get personalized stack recommendations",
    icon: Sparkles,
    href: "/architect/build?mode=build-for-me",
    features: [
      "Answer 7 practice questions",
      "Get instant stack recommendations",
      "See fit scores for each product",
      "Customize your final stack",
    ],
    bestFor: "New practices or those wanting fresh recommendations",
  },
  {
    id: "build-myself",
    title: "Build Myself",
    description: "Explore all options and craft your stack capability by capability",
    icon: Settings,
    href: "/architect/build?mode=build-myself",
    features: [
      "Browse 6 lifecycle stages",
      "Explore 40+ capabilities",
      "Compare products side-by-side",
      "Build at your own pace",
    ],
    bestFor: "Those who know what they need or want to explore",
  },
  {
    id: "audit",
    title: "Audit My Stack",
    description: "Enter your current tools to find gaps, overlaps, and better alternatives",
    icon: ClipboardCheck,
    href: "/architect/audit",
    features: [
      "Add your current products",
      "See coverage gaps",
      "Identify redundancies",
      "Preview replacements",
    ],
    bestFor: "Established practices looking to optimize",
  },
] as const;

// Value props
const VALUE_PROPS = [
  {
    icon: Shield,
    title: "Transparent Scores",
    description: "Deterministic fit scores you can trace. No hidden rankings or pay-to-play.",
  },
  {
    icon: BarChart3,
    title: "Full Cost Visibility",
    description: "See estimated monthly costs before you commit. Unknown stays unknown.",
  },
  {
    icon: Layers,
    title: "Complete Coverage",
    description: "Map your entire practice lifecycle from marketing to operations.",
  },
];

export default function ArchitectEntryPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero Section */}
      <section className="border-b border-separator bg-surface">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-2 text-sm text-label-tertiary">
            <Link href="/tools/for-clinicians/" className="hover:text-label-secondary">
              Clinician Tools
            </Link>
            <span>/</span>
            <span className="text-label-secondary">Practice Architect™</span>
          </nav>

          <div className="flex items-center gap-3">
            <Building2 className="h-7 w-7 text-label-tertiary" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
                Practice Stack Builder
              </p>
              <h1 className="text-2xl font-semibold tracking-tight text-label-primary sm:text-3xl">
                Practice Architect<sup className="text-sm">™</sup>
              </h1>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-label-secondary">
            Build your ideal mental health practice technology stack.
            Transparent fit scores. Real cost estimates. Zero guesswork.
          </p>
        </div>
      </section>

      {/* Mode Selection */}
      <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-xl font-semibold text-label-primary sm:text-2xl">
            How would you like to start?
          </h2>
          <p className="mt-2 text-center text-label-secondary">
            Choose your approach. You can always switch modes later.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {ARCHITECT_MODES.map((mode) => {
              const Icon = mode.icon;
              return (
                <div
                  key={mode.id}
                  className="group relative flex flex-col rounded-2xl border border-separator bg-surface p-6 transition-all hover:border-neutral-300 hover:shadow-soft"
                >
                  {/* Icon */}
                  <Icon className="mb-4 h-6 w-6 text-label-tertiary" />

                  {/* Title & Description */}
                  <h3 className="text-lg font-semibold text-label-primary">
                    {mode.title}
                  </h3>
                  <p className="mt-2 text-sm text-label-secondary">
                    {mode.description}
                  </p>

                  {/* Features */}
                  <ul className="mt-4 flex-1 space-y-2">
                    {mode.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-label-tertiary">
                        <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-separator text-[10px] font-medium">
                          {idx + 1}
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* Best for */}
                  <p className="mt-4 text-xs text-label-tertiary italic">
                    Best for: {mode.bestFor}
                  </p>

                  {/* CTA */}
                  <Link
                    href={mode.href}
                    className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-treatment px-4 py-3 text-sm font-medium text-white transition-all hover:bg-treatment-600"
                  >
                    <span className="text-white">Get Started</span>
                    <ArrowRight className="h-4 w-4 text-white transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Demo Option */}
          <div className="mt-8 text-center">
            <p className="text-sm text-label-tertiary">
              Just exploring?{" "}
              <Link
                href="/architect/demo"
                className="font-medium text-accent hover:text-accent-hover"
              >
                Try the demo with fictional products
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-xl font-semibold text-label-primary">
            Why use Practice Architect™?
          </h2>

          <div className="mt-10 grid gap-8 sm:grid-cols-3">
            {VALUE_PROPS.map((prop, idx) => {
              const Icon = prop.icon;
              return (
                <div key={idx} className="text-center">
                  <Icon className="mx-auto h-6 w-6 text-label-tertiary" />
                  <h3 className="mt-4 font-semibold text-label-primary">
                    {prop.title}
                  </h3>
                  <p className="mt-2 text-sm text-label-secondary">
                    {prop.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Lifecycle Preview */}
      <section className="bg-canvas px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-xl font-semibold text-label-primary">
            Cover your entire practice lifecycle
          </h2>
          <p className="mt-2 text-center text-label-secondary">
            40+ capabilities across 6 stages of running a mental health practice
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { id: "grow", name: "Grow", description: "Attract new clients", count: 5 },
              { id: "access", name: "Access", description: "Intake & onboarding", count: 7 },
              { id: "engage", name: "Engage", description: "Client communication", count: 6 },
              { id: "care", name: "Care", description: "Clinical delivery", count: 10 },
              { id: "revenue", name: "Revenue", description: "Billing & collections", count: 7 },
              { id: "operate", name: "Operate", description: "Practice management", count: 5 },
            ].map((stage) => (
              <div
                key={stage.id}
                className="rounded-xl border border-separator bg-surface p-4 transition-all hover:border-accent/30"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-label-primary">{stage.name}</h3>
                  <span className="text-xs text-label-tertiary">
                    {stage.count} capabilities
                  </span>
                </div>
                <p className="mt-1 text-sm text-label-secondary">
                  {stage.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-xl font-semibold text-label-primary">
            Ready to build your stack?
          </h2>
          <p className="mt-2 text-label-secondary">
            Start with personalized recommendations in under 2 minutes.
          </p>
          <Link
            href="/architect/build?mode=build-for-me"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-treatment px-6 py-3 font-medium text-white transition-all hover:bg-treatment-600"
          >
            <Sparkles className="h-5 w-5 text-white" />
            <span className="text-white">Build for Me</span>
            <ArrowRight className="h-4 w-4 text-white" />
          </Link>
        </div>
      </section>
    </div>
  );
}
