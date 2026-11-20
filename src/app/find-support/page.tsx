/**
 * Find Support — the patient and family entry
 *
 * Reached from "Find my way" on the homepage.
 *
 * Step one asks "What brings you here?" and offers plain-language starting
 * points that lead to existing HeyPsych experiences (see SupportEntry). The
 * "treatment or support" starting point continues here, at ?need=support, to
 * the next-step journey (NextStepJourney): the clinician-reviewed
 * patient-support evaluator, pre-filled from the visitor's own notes. With
 * NEXT_PUBLIC_PATH_WORKSPACE=false it falls back to the previous care-type
 * links (SupportJourney).
 *
 * Crisis information is shown on every view, independently of any choice,
 * and without JavaScript. Journey answers stay in the visitor's browser.
 *
 * See: docs/active/contracts/PATIENT_PILOT_CONTRACT.md
 *
 * Feature flag: PATIENT_SUPPORT_JOURNEY
 * When disabled, redirects to /tools/find-support (existing hub).
 */

import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { featureFlags } from "@/lib/config/feature-flags";
import { displayFont } from "@/components/brand/fonts";
import { SupportJourney } from "./_components/SupportJourney";
import { SupportEntry } from "./_components/SupportEntry";
import { NextStepJourney } from "@/components/path/NextStepJourney";
import { SYMPTOM_CATEGORIES, SYMPTOM_REGISTRY } from "@/domains/symptoms/registry";
import type { SymptomRef } from "@/domains/path";
import { findSupportMetadata } from "./_lib/seo";

export async function generateMetadata({ searchParams }: FindSupportPageProps): Promise<Metadata> {
  return findSupportMetadata(await searchParams);
}

/** Public symptom reference data, so the journey can pre-fill from the visitor's own notes. */
function symptomRefs(): SymptomRef[] {
  return SYMPTOM_REGISTRY.map((s) => ({ slug: s.slug, name: s.name, category: s.category, alsoCausedBy: [], seekHelpWhen: [] }));
}

interface FindSupportPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function FindSupportPage({ searchParams }: FindSupportPageProps) {
  // Feature flag check - redirect to existing hub if disabled
  if (!featureFlags.patientSupportJourney) {
    redirect("/tools/find-support");
  }

  const { need } = await searchParams;
  const showSupportTypes = need === "support";

  const linkClass =
    "font-medium text-label-primary underline decoration-separator-opaque underline-offset-4 hover:decoration-label-primary focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

  return (
    <div className={`${displayFont.variable} bg-canvas min-h-screen`}>
      <div className="px-4 pt-8 pb-16 sm:px-6 sm:pt-12 lg:px-8">
        <div className={`mx-auto ${showSupportTypes && featureFlags.pathWorkspace ? "max-w-6xl" : "max-w-3xl"}`}>
          {/* Crisis information: always present, before any choice. */}
          <aside
            aria-label="Crisis support"
            className="border-separator text-label-secondary mb-10 rounded-2xl border bg-white px-5 py-4 text-[14px] leading-relaxed"
          >
            <p>
              <span className="text-label-primary font-semibold">
                If you&apos;re in crisis or thinking about harming yourself,
              </span>{" "}
              call or text{" "}
              <a href="tel:988" className={linkClass}>
                988
              </a>{" "}
              (Suicide &amp; Crisis Lifeline, US) or text HOME to{" "}
              <a href="sms:741741" className={linkClass}>
                741741
              </a>
              . Both are free and available 24/7. If you&apos;re in immediate danger, call 911.{" "}
              <Link href="/resources/support-community/immediate-crisis" className={linkClass}>
                More crisis resources
              </Link>
            </p>
          </aside>

          {showSupportTypes ? (
            <>
              <Link
                href="/find-support"
                className="text-label-secondary hover:text-label-primary focus-visible:ring-accent mb-6 inline-flex items-center gap-1.5 text-[14px] font-medium focus-visible:rounded focus-visible:ring-2 focus-visible:outline-none"
              >
                <span aria-hidden="true">←</span> What brings you here?
              </Link>
              <h1 className="sr-only">Find your next step</h1>
              {featureFlags.pathWorkspace ? (
                <NextStepJourney categories={SYMPTOM_CATEGORIES} refs={symptomRefs()} />
              ) : (
                <SupportJourney />
              )}
            </>
          ) : (
            <>
              <header className="mb-8">
                <h1 className="font-display text-label-primary text-[34px] leading-tight font-normal tracking-[-0.015em] sm:text-[44px]">
                  What brings you here?
                </h1>
                <p className="text-label-secondary mt-3 max-w-xl text-[16px] leading-relaxed sm:text-[17px]">
                  Pick whatever fits best. You can change direction at any point, and none of this
                  is a diagnosis.
                </p>
              </header>

              <SupportEntry />

              <p className="text-label-secondary mt-8 text-[14px]">
                Prefer to look around?{" "}
                <Link href="/browse" className={linkClass}>
                  Browse everything
                </Link>{" "}
                or{" "}
                <Link href="/search" className={linkClass}>
                  search
                </Link>
                .
              </p>
            </>
          )}

          <p className="border-separator text-label-tertiary mt-12 border-t pt-6 text-[12px] leading-relaxed">
            HeyPsych offers information and decision support. It is not a substitute for
            professional medical advice, diagnosis, or treatment.
          </p>
        </div>
      </div>
    </div>
  );
}
