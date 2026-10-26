/**
 * Find Support — the patient and family entry
 *
 * Reached from "Find my way" on the homepage.
 *
 * Step one asks "What brings you here?" and offers plain-language starting
 * points that lead to existing HeyPsych experiences (see SupportEntry). The
 * "treatment or support" starting point continues here, at ?need=support, to
 * the existing care-type choice (SupportJourney).
 *
 * This is navigation, not triage. Nothing is scored or stored; crisis
 * information is shown on every view, independently of any choice, and
 * without JavaScript.
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

export const metadata: Metadata = {
  title: "Find Your Way",
  description:
    "Choose a starting point: understand what you're experiencing, explore treatment and support, help someone you care about, or find a professional. Not a diagnosis.",
  robots: {
    index: false, // Session pages should not be indexed
    follow: false,
  },
};

interface FindSupportPageProps {
  searchParams: Promise<{ need?: string | string[] }>;
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
        <div className="mx-auto max-w-3xl">
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
              <h1 className="sr-only">Find treatment or support</h1>
              <SupportJourney />
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
