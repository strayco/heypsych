"use client";

import Link from "next/link";
import {
  Compass,
  Shield,
  Clock,
  Lock,
  ArrowRight,
  MessageSquare,
  BarChart,
  HeartHandshake,
} from "lucide-react";
import { trackCampusContactClick } from "@/lib/analytics/product-events";

const benefits = [
  {
    icon: Clock,
    title: "Reach students before crisis",
    description:
      "Most students practice skills after they're already struggling. PsychTrails lets them build capacity before the hard moment arrives.",
  },
  {
    icon: Shield,
    title: "Privacy-first architecture",
    description:
      "All data stays on the student's device. Staff see only anonymous aggregates—never names or choices.",
  },
  {
    icon: HeartHandshake,
    title: "Counselor-connected",
    description:
      "When students are ready for support, they can opt in. Only then does staff see what they practiced.",
  },
  {
    icon: BarChart,
    title: "Zero burden on staff",
    description:
      "No accounts to manage, no data to track. Students practice independently. Staff engage only when invited.",
  },
];

const howItWorksForCampus = [
  {
    title: "Share a link",
    description: "Custom URL for your campus. No app download, no account creation.",
  },
  {
    title: "Students practice",
    description: "Interactive scenarios for social anxiety, help-seeking, everyday challenges.",
  },
  {
    title: "Optional connection",
    description: "Students can request follow-up. Only then does the counseling center see who wants support.",
  },
];

export default function ForCampusesPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Hero */}
      <section className="bg-gradient-to-br from-canvas via-surface to-canvas px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent-500/30 bg-accent-500/10 px-4 py-1.5">
            <Compass className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent-700">For Campuses</span>
          </div>

          <h1 className="mb-4 text-3xl font-bold text-label-primary sm:text-4xl">
            Help students practice hard moments
            <span className="block text-accent">before they happen</span>
          </h1>
          <p className="mb-8 text-lg text-label-secondary">
            Privacy-first skill practice. Zero burden on staff.
          </p>

          <a
            href="mailto:hello@heypsych.com?subject=Campus%20Pilot%20Interest"
            onClick={trackCampusContactClick}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-canvas-elevated px-8 font-semibold text-label-primary transition-all hover:bg-white shadow-medium hover:shadow-large"
          >
            <MessageSquare className="h-4 w-4" />
            Start a Pilot
          </a>

          {/* See it in action - right in hero */}
          <div className="mt-12 pt-8 border-t border-separator">
            <p className="text-sm text-label-tertiary mb-4">See it in action</p>
            <div className="grid gap-3 sm:grid-cols-2 max-w-md mx-auto">
              <Link
                href="/psychtrails/for-campuses/cmh"
                className="flex items-center gap-3 rounded-xl border border-separator bg-surface-grouped/50 p-3 hover:bg-surface-grouped hover:border-separator transition-all text-left"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/20">
                  <Compass className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-label-primary">Student View</p>
                  <p className="text-xs text-label-primary0">What students see</p>
                </div>
              </Link>
              <Link
                href="/psychtrails/for-campuses/cmh/dashboard"
                className="flex items-center gap-3 rounded-xl border border-separator bg-surface-grouped/50 p-3 hover:bg-surface-grouped hover:border-separator transition-all text-left"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/20">
                  <BarChart className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-medium text-label-primary">Staff Dashboard</p>
                  <p className="text-xs text-label-primary0">Follow-ups & data</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits - Compact */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid gap-6 sm:grid-cols-2">
            {benefits.map((benefit) => {
              const IconComponent = benefit.icon;
              return (
                <div key={benefit.title} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-500/15 border border-accent-500/20">
                    <IconComponent className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-label-primary">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-label-tertiary">{benefit.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works - Simple */}
      <section className="bg-surface px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-xl font-bold text-label-primary">
            Simple deployment
          </h2>
          <div className="space-y-6">
            {howItWorksForCampus.map((step, index) => (
              <div key={step.title} className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-600 text-sm font-bold text-white shadow-soft">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-label-primary">{step.title}</h3>
                  <p className="text-sm text-label-tertiary">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy - Compact */}
      <section className="px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-positive-700/30 bg-positive-tint p-6">
            <div className="mb-3 flex items-center gap-2">
              <Lock className="h-5 w-5 text-positive-600" />
              <h2 className="font-bold text-label-primary">Privacy by design</h2>
            </div>
            <p className="text-sm text-label-secondary">
              All data stays on the student's device. Staff see only anonymous aggregates.
              No FERPA concerns. No student data on our servers.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-accent-600 px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Ready to pilot?
          </h2>
          <p className="mb-6 text-accent-100">
            We run small pilots with 3-5 campuses at a time.
          </p>
          <a
            href="mailto:hello@heypsych.com?subject=Campus%20Pilot%20Interest"
            onClick={trackCampusContactClick}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 font-semibold text-accent-700 transition-colors hover:bg-canvas-elevated"
          >
            <MessageSquare className="h-4 w-4" />
            Start a Conversation
          </a>
        </div>
      </section>

      {/* Footer link */}
      <section className="border-t border-separator px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Link
            href="/psychtrails"
            className="inline-flex items-center gap-2 text-sm font-medium text-label-tertiary transition-colors hover:text-label-secondary"
          >
            Or try the free consumer version
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
