/**
 * Find Support Journey Page
 *
 * Patient decision journey: "What kind of support should I look for?"
 *
 * This is a non-diagnostic care-path decision journey.
 * See: docs/active/contracts/PATIENT_PILOT_CONTRACT.md
 *
 * Feature flag: PATIENT_SUPPORT_JOURNEY
 * When disabled, redirects to /tools/find-support (existing hub).
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { featureFlags } from "@/lib/config/feature-flags";
import { SupportJourney } from "./_components/SupportJourney";

export const metadata: Metadata = {
  title: "Find Your Support Path | HeyPsych",
  description:
    "Explore what kind of mental health support might be right for you. Not a diagnosis or prescription — just a starting point for your journey.",
  robots: {
    index: false, // Session pages should not be indexed
    follow: false,
  },
};

export default function FindSupportPage() {
  // Feature flag check - redirect to existing hub if disabled
  if (!featureFlags.patientSupportJourney) {
    redirect("/tools/find-support");
  }
  return (
    <div className="min-h-screen bg-canvas">
      {/* Static crisis resources - always available even if JavaScript fails */}
      <noscript>
        <div className="bg-red-50 border-b border-red-200 p-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-medium text-red-800">Need immediate support?</h2>
            <p className="text-sm text-red-700 mt-1">
              Call <a href="tel:988" className="underline font-medium">988</a> (Suicide & Crisis Lifeline) or
              text HOME to <a href="sms:741741" className="underline font-medium">741741</a> (Crisis Text Line).
              Both are available 24/7.
            </p>
          </div>
        </div>
      </noscript>

      <main className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <header className="mb-8 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-label-primary">
              Find Your Support Path
            </h1>
            <p className="text-label-secondary mt-2 max-w-lg mx-auto">
              Answer a few questions to explore what kind of mental health support might be right for you.
              This is a starting point, not a diagnosis.
            </p>
          </header>

          {/* Journey component */}
          <SupportJourney />

          {/* Footer disclaimer */}
          <footer className="mt-12 pt-6 border-t border-separator text-center">
            <p className="text-xs text-label-tertiary max-w-md mx-auto">
              This tool is for informational purposes only and is not a substitute for professional
              medical advice, diagnosis, or treatment. If you&apos;re in crisis, please contact
              the 988 Suicide & Crisis Lifeline by calling or texting 988.
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}
