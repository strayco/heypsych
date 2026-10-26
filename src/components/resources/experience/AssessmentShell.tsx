/**
 * Assessment page shell (PHQ-9, GAD-7, ASRS, ASSIST)
 *
 * The notebook object, what the questionnaire measures, how long it takes,
 * a privacy note, then the questionnaire exactly as before.
 * Same family as the condition and symptom pages (art bible §13).
 */

import Link from "next/link";
import { DISCOVERY_OBJECTS } from "@/components/home/worlds/DiscoveryObjects";
import type { AssessmentShellView } from "@/domains/resources/experience/assessment";
import { AssessmentQuestionnaire } from "./AssessmentQuestionnaire";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AssessmentShell({ shell: x, entity }: { shell: AssessmentShellView; entity: any }) {
  const Notebook = DISCOVERY_OBJECTS.notebook;
  const glance = [
    x.duration ? { label: "Takes", value: x.duration } : null,
    { label: "Questions", value: `${x.questions}${x.selfReport ? ", answered by you" : ""}` },
    x.ageRange ? { label: "For", value: x.ageRange } : null,
  ].filter((g): g is { label: string; value: string } => Boolean(g));

  return (
    <div className="bg-canvas">
      <header className="px-4 pt-8 pb-8 sm:px-6 sm:pt-12 lg:px-8">
        <div className="mx-auto grid max-w-5xl items-end gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="min-w-0">
            <Link href="/resources" className="text-label-secondary hover:text-label-primary text-[14px] font-medium">
              <span aria-hidden="true">←</span> Support and resources
            </Link>
            <div aria-hidden="true" className="mt-6 h-20 w-28 lg:hidden">
              <Notebook />
            </div>
            <p className="text-accent mt-6 text-[13px] font-semibold tracking-[0.06em] uppercase">
              Self-check{x.validated ? " · Validated questionnaire" : ""}
              {x.free ? " · Free" : ""}
            </p>
            <h1 className="font-display text-label-primary mt-3 text-[40px] leading-[1.04] font-normal tracking-[-0.025em] sm:text-[56px]">{x.name}</h1>
            {x.fullName && <p className="text-label-secondary mt-2 text-[17px]">{x.fullName}</p>}
            {x.summary && <p className="text-label-primary mt-4 max-w-2xl text-[19px] leading-snug sm:text-[21px]">{x.summary}</p>}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a href="#questionnaire" className="bg-accent hover:bg-accent-hover rounded-full px-5 py-2.5 text-[15px] font-medium text-white">
                Start the questions
              </a>
              <p className="text-label-secondary text-[14px]">Your answers stay on this page. Nothing is saved or sent.</p>
            </div>
          </div>
          <div aria-hidden="true" className="hidden h-[190px] lg:block">
            <Notebook />
          </div>
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl grid-cols-3 gap-2 sm:mt-10 sm:gap-3">
          {glance.map((g) => (
            <div key={g.label} className="border-separator bg-surface rounded-2xl border p-3 shadow-card-1 sm:p-5">
              <p className="text-label-tertiary text-[11px] font-semibold tracking-[0.06em] uppercase sm:text-[12px]">{g.label}</p>
              <p className="text-label-primary mt-1.5 text-[14px] leading-snug sm:mt-2 sm:text-[16px]">{g.value}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {(x.forWhom.length > 0 || x.limitations.length > 0) && (
          <section aria-labelledby="measures-title" className="grid gap-4 pb-8 sm:grid-cols-2">
            <h2 id="measures-title" className="sr-only">
              What it measures
            </h2>
            {x.forWhom.length > 0 && (
              <div className="border-separator bg-surface rounded-2xl border p-5 sm:p-6">
                <h3 className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">Used with</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {x.forWhom.map((p) => (
                    <li key={p} className="bg-fill-quaternary text-label-primary rounded-full px-3.5 py-1.5 text-[14px]">
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {x.limitations.length > 0 && (
              <div className="border-separator bg-surface rounded-2xl border p-5 sm:p-6">
                <h3 className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">What it can't do</h3>
                <ul className="mt-3 space-y-2">
                  {x.limitations.map((l) => (
                    <li key={l} className="text-label-primary flex gap-2.5 text-[15px] leading-snug">
                      <span aria-hidden="true" className="bg-label-tertiary mt-2 h-1.5 w-1.5 shrink-0 rounded-full" />
                      {l}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <div className="border-separator bg-surface mb-8 flex gap-4 rounded-2xl border p-5 sm:p-6">
          <span aria-hidden="true" className="bg-positive-tint text-label-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-full">
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="4.5" y="9" width="11" height="8" rx="2" />
              <path d="M7 9V6.5a3 3 0 0 1 6 0V9" strokeLinecap="round" />
            </svg>
          </span>
          <div>
            <p className="text-label-primary text-[16px] font-medium">Private by design</p>
            <p className="text-label-secondary mt-1 text-[15px] leading-relaxed">
              Your answers and score are worked out in your browser and disappear when you leave the page. There is no account and nothing is stored. A score is a starting point for a conversation with a clinician, not a diagnosis.
            </p>
          </div>
        </div>

        <section id="questionnaire" aria-label={`${x.name} questionnaire`} className="scroll-mt-24 space-y-6 pb-16">
          <AssessmentQuestionnaire entity={entity} />
        </section>
      </div>
    </div>
  );
}
