/**
 * /my-path — Your Path
 *
 * The visitor's private workspace: everything they kept across HeyPsych,
 * their next step, and an appointment brief built from it. All of it lives in
 * the visitor's browser (decision D-012); this route only serves the shell and
 * the public symptom reference data the brief uses.
 *
 * Not indexed: a stateful personal page (brief §4). Disallowed in robots.ts.
 * Rollback: NEXT_PUBLIC_PATH_WORKSPACE=false redirects here to /find-support.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { featureFlags } from "@/lib/config/feature-flags";
import { displayFont } from "@/components/brand/fonts";
import { SYMPTOM_REGISTRY } from "@/domains/symptoms/registry";
import type { SymptomRef } from "@/domains/path";
import { PathWorkspace } from "@/components/path/PathWorkspace";

export const metadata: Metadata = {
  title: "Your Path",
  description: "Everything you've kept on HeyPsych, your next step, and a brief to bring to your appointment. Stored on your device only.",
  robots: { index: false, follow: false },
  alternates: { canonical: "/my-path" },
};

function symptomRefs(): SymptomRef[] {
  return SYMPTOM_REGISTRY.map((s) => ({
    slug: s.slug,
    name: s.name,
    category: s.category,
    alsoCausedBy: s.nonPsychiatricConsiderations ?? [],
    seekHelpWhen: s.whenToSeekHelp ?? [],
    conditions: s.conditionRelationships.map((r) => r.conditionSlug),
  }));
}

export default function MyPathPage() {
  if (!featureFlags.pathWorkspace) redirect("/find-support");

  return (
    <div className={`${displayFont.variable} bg-canvas min-h-screen`}>
      <div className="mx-auto max-w-7xl px-4 pt-6 pb-20 sm:px-6 sm:pt-8 lg:px-8">
        <header className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1" data-no-print>
          <h1 className="font-display text-label-primary text-[36px] leading-[1.04] font-normal tracking-[-0.025em] sm:text-[44px]">Your path</h1>
          <p className="text-label-secondary text-[15px]">Everything you&apos;ve kept, connected. Stays on this device.</p>
        </header>

        <PathWorkspace refs={symptomRefs()} />

        <aside
          aria-label="Crisis support"
          className="border-separator text-label-secondary mt-12 rounded-2xl border bg-white px-5 py-4 text-[14px] leading-relaxed"
          data-no-print
        >
          <span className="text-label-primary font-semibold">In crisis, or thinking about harming yourself?</span> Call or text{" "}
          <a href="tel:988" className="text-label-primary font-medium underline underline-offset-4">
            988
          </a>{" "}
          (US), or text HOME to{" "}
          <a href="sms:741741" className="text-label-primary font-medium underline underline-offset-4">
            741741
          </a>
          . In immediate danger, call 911.{" "}
          <Link href="/resources/support-community/immediate-crisis" className="text-label-primary font-medium underline underline-offset-4">
            More crisis resources
          </Link>
        </aside>
      </div>
    </div>
  );
}
