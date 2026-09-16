/**
 * SupportTriage Component
 *
 * Simple, human-centered navigation for patients.
 * Direct links - no intermediate screens.
 * Crisis resources always visible.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Phone, MessageSquare, Heart, Sparkles, Pill, Search } from "lucide-react";

export function SupportTriage() {
  const [showCrisis, setShowCrisis] = useState(false);

  // Expanded crisis view
  if (showCrisis) {
    return (
      <section className="border-b border-red-200 bg-red-50 px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-red-800">
            You&apos;re not alone. Help is here.
          </h2>
          <p className="mt-2 text-red-700">
            Free, confidential, available 24/7.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <a
              href="tel:988"
              className="flex flex-col items-center gap-3 rounded-xl border-2 border-red-300 bg-white p-6 transition-all hover:border-red-400 hover:shadow-lg"
            >
              <Phone className="h-8 w-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-800">Call 988</div>
                <div className="mt-1 text-sm text-red-600">Suicide & Crisis Lifeline</div>
              </div>
            </a>
            <a
              href="sms:741741&body=HOME"
              className="flex flex-col items-center gap-3 rounded-xl border-2 border-red-300 bg-white p-6 transition-all hover:border-red-400 hover:shadow-lg"
            >
              <MessageSquare className="h-8 w-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-800">Text HOME to 741741</div>
                <div className="mt-1 text-sm text-red-600">Crisis Text Line</div>
              </div>
            </a>
          </div>

          <button
            onClick={() => setShowCrisis(false)}
            className="mt-6 text-sm text-red-600 hover:underline"
          >
            Go back
          </button>
        </div>
      </section>
    );
  }

  // Main view - direct links, no multi-step
  return (
    <section className="border-b border-separator bg-surface px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Crisis banner - always visible */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm">
          <span className="text-red-700">Need help now?</span>
          <button
            onClick={() => setShowCrisis(true)}
            className="font-semibold text-red-800 hover:underline"
          >
            Call 988 or Text 741741
          </button>
        </div>

        {/* Question */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-label-primary">
            What kind of support are you looking for?
          </h2>
        </div>

        {/* Direct links */}
        <div className="space-y-3">
          <Link
            href="/tools/find-support/therapy-platforms/"
            className="group flex items-center gap-4 rounded-xl border border-separator bg-canvas p-5 transition-all hover:border-treatment/30 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-treatment/10">
              <Heart className="h-6 w-6 text-treatment" />
            </div>
            <div className="flex-1">
              <span className="font-semibold text-label-primary">Talk to someone</span>
              <p className="mt-0.5 text-sm text-label-secondary">
                Therapists and counselors online
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-label-quaternary group-hover:text-treatment transition-colors" />
          </Link>

          <Link
            href="/tools/find-support/psychiatry-platforms/"
            className="group flex items-center gap-4 rounded-xl border border-separator bg-canvas p-5 transition-all hover:border-violet-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100">
              <Pill className="h-6 w-6 text-violet-600" />
            </div>
            <div className="flex-1">
              <span className="font-semibold text-label-primary">Explore medication</span>
              <p className="mt-0.5 text-sm text-label-secondary">
                Online psychiatrists who can prescribe
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-label-quaternary group-hover:text-violet-600 transition-colors" />
          </Link>

          <Link
            href="#browse"
            className="group flex items-center gap-4 rounded-xl border border-separator bg-canvas p-5 transition-all hover:border-emerald-300 hover:shadow-md"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
              <Sparkles className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <span className="font-semibold text-label-primary">Help myself</span>
              <p className="mt-0.5 text-sm text-label-secondary">
                Apps for anxiety, sleep, focus, and more
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-label-quaternary group-hover:text-emerald-600 transition-colors" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default SupportTriage;
