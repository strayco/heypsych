/**
 * /tools and the need pages (/tools/anxiety-stress, …): the patient side of
 * Apps & Tools, laid out like an app store for mental health care.
 *
 * People come looking for something, not to fill in a form, so the page
 * leads with the support ladder (stepped care as an interactive scene: pick a
 * level of support, look through what's on your mind and how you'd pay, see
 * what it looks like, what it costs and good places to start), with search for
 * people who already know what they want and direct routes below. Crisis line and an A–Z of every app are always in the
 * server HTML.
 */

import Link from "next/link";
import { PageIntro } from "@/components/brand/PageIntro";
import { WorldDefs } from "@/components/home/worlds/WorldDefs";
import { NEEDS, type NeedDefinition } from "@/domains/patient-tools/finder/model";
import { INTENTS, glance, matchesIntent } from "@/domains/patient-tools/shelves/model";
import type { PatientFinderData } from "@/lib/tools/patient-finder-data";
import { formatReviewDate } from "@/domains/tools/clinician-hub/model";
import { GlanceStrip, IntentTiles } from "@/components/patient-tools/shelves/Shelves";
import { AppSearch } from "@/components/patient-tools/shelves/AppSearch";
import { SavedTray } from "@/components/patient-tools/shelves/SavedTray";
import { SupportLadder } from "@/components/patient-tools/ladder/SupportLadder";

export function CrisisLine({ crisis }: { crisis: PatientFinderData["crisis"] }) {
  const textLine = crisis.find((c) => c.slug === "crisis-text-line");
  return (
    <aside
      aria-label="Crisis support"
      className="border-negative/30 bg-negative/5 text-label-primary flex flex-col gap-1 rounded-2xl border px-5 py-4 text-[15px] sm:flex-row sm:items-center sm:justify-between"
    >
      <p>
        <span className="font-semibold">In crisis, or thinking about suicide?</span> In the US, call or text{" "}
        <a href="tel:988" className="font-semibold underline underline-offset-2">
          988
        </a>
        , any time.
      </p>
      {textLine && (
        <Link href={textLine.href} className="text-label-secondary hover:text-label-primary text-[14px]">
          Other crisis lines →
        </Link>
      )}
    </aside>
  );
}

export function HowThisWorks() {
  return (
    <p className="text-label-tertiary mt-10 max-w-3xl text-[13px] leading-relaxed">
      How this works: every shelf, count and filter comes from facts on each app&rsquo;s record (what it&rsquo;s for, the
      kind of help, how you pay, the listed price). We don&rsquo;t diagnose or score you, and what you save stays on
      this device. If a link ever earns us something, or a spot is sponsored, it&rsquo;s labelled, and it never changes
      which apps appear or their order.
    </p>
  );
}

export function AllAppsIndex({ apps, label }: { apps: { slug: string; name: string; href: string }[]; label: string }) {
  const index = [...apps].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <section aria-labelledby="index-title" className="mt-16">
      <details className="group border-separator border-t pt-6">
        <summary className="cursor-pointer list-none">
          <h2 id="index-title" className="text-label-primary inline text-[17px] font-semibold">
            {label}, A–Z ({index.length})
          </h2>
          <span aria-hidden="true" className="text-label-tertiary ml-2 inline-block transition-transform group-open:rotate-90">
            ›
          </span>
        </summary>
        <ul className="mt-5 columns-1 gap-8 sm:columns-2 lg:columns-3">
          {index.map((app) => (
            <li key={app.slug} className="break-inside-avoid py-1">
              <Link href={app.href} className="text-label-secondary hover:text-label-primary text-[15px]">
                {app.name}
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function SectionTitle({ id, title, line }: { id: string; title: string; line?: string }) {
  return (
    <div>
      <h2 id={id} className="font-display text-label-primary text-[28px] leading-tight sm:text-[32px]">
        {title}
      </h2>
      {line && <p className="text-label-secondary mt-2 text-[16px]">{line}</p>}
    </div>
  );
}

export function PatientHub({ data, need }: { data: PatientFinderData; need: NeedDefinition | null }) {
  const reviewed = formatReviewDate(data.lastReviewed);
  const inScope = need ? data.apps.filter((a) => a.needs.includes(need.id)) : data.apps;
  const comparisons = need ? data.comparisons.filter((c) => c.needs.includes(need.id)) : data.comparisons;
  const intentCounts = Object.fromEntries(INTENTS.map((i) => [i.id, data.apps.filter((a) => matchesIntent(a, i)).length]));
  const needCounts = Object.fromEntries(NEEDS.map((n) => [n.id, data.apps.filter((a) => a.needs.includes(n.id)).length]));
  const priceOf = (slug: string) => data.prices[slug] ?? null;

  return (
    <div className="bg-canvas min-h-screen">
      <WorldDefs />
      <PageIntro
        title={need ? need.title : "Find the right kind of help"}
        object="tools"
        parent={need ? { label: "Apps and online care", href: "/tools" } : undefined}
        description={
          need
            ? need.line
            : "From an app you use on your own to a psychiatrist online. See what each level of support looks like, what it costs, and good places to start."
        }
        footnote={`${inScope.length} apps and services.${reviewed ? ` Most recent review ${reviewed}.` : ""} Information, not medical advice.`}
      >
        <AppSearch
          apps={inScope}
          placeholder={need ? `Know what you want? Search ${inScope.length} options` : "Know what you want? Try “sleep”, “insurance” or “Talkspace”"}
        />
        {!need && (
          <Link
            href="/tools/for-clinicians"
            className="text-label-tertiary hover:text-label-primary mt-4 inline-block text-[14px]"
          >
            Running a practice? Practice software →
          </Link>
        )}
      </PageIntro>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <CrisisLine crisis={data.crisis} />

        <section aria-labelledby="ladder-title" className="mt-12">
          <SectionTitle
            id="ladder-title"
            title={need ? `Support for ${need.label.toLowerCase()}, step by step` : "How much support do you want?"}
            line={need ? undefined : "Every level of care, from on your own to a prescriber. Look through it your way."}
          />
          <div className="mt-6">
            <SupportLadder apps={inScope} prices={data.prices} fixedNeed={need?.id ?? null} placement={data.placement} />
          </div>
        </section>

        {need && (
          <section aria-label="At a glance" className="mt-12">
            <GlanceStrip glance={glance(inScope, priceOf)} />
          </section>
        )}

        {!need && (
          <section aria-labelledby="straight-title" className="mt-20">
            <SectionTitle id="straight-title" title="Or go straight to it" />
            <div className="mt-6">
              <IntentTiles intents={INTENTS} counts={intentCounts} />
            </div>
            <nav aria-label="By what's going on" className="mt-6">
              <ul className="flex flex-wrap gap-2">
                {NEEDS.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      className="border-separator text-label-primary hover:bg-fill-quaternary hover:border-label-tertiary rounded-full border px-4 py-2 text-[15px]"
                    >
                      {n.label} <span className="text-label-tertiary text-[13px] tabular-nums">{needCounts[n.id]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </section>
        )}

        {comparisons.length > 0 && (
          <section id="compare" aria-labelledby="compare-title" className="mt-20 scroll-mt-28">
            <SectionTitle id="compare-title" title="Head-to-heads" line="Two popular options, side by side. Or save any two and compare them." />
            <ul className="mt-5 grid gap-x-10 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
              {comparisons.map((c) => (
                <li key={c.slug}>
                  <Link href={c.href} className="text-label-primary hover:text-accent text-[15px]">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {need && (
          <nav aria-label="Other needs" className="mt-20">
            <h2 className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">Something else?</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {NEEDS.filter((n) => n.id !== need.id).map((n) => (
                <li key={n.id}>
                  <Link
                    href={n.href}
                    className="border-separator text-label-secondary hover:text-label-primary hover:bg-fill-quaternary rounded-full border px-3 py-1.5 text-[14px]"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <AllAppsIndex apps={inScope} label={need ? "Every option for this" : "Every app and service we cover"} />
        <HowThisWorks />
      </div>
      <SavedTray />
    </div>
  );
}
