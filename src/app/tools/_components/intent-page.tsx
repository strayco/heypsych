/**
 * Intent pages: /tools/online-therapy, /online-psychiatry, /self-guided,
 * /free-apps, /takes-insurance, /peer-support. What someone is looking for,
 * with honest numbers for the set, what to check before choosing, three good
 * places to start, and every option as a compact list you narrow in place. Each route file is a wrapper.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig } from "@/lib/config/site";
import { INTENTS, getIntent, glance, matchesIntent, shelfOrder, type IntentId } from "@/domains/patient-tools/shelves/model";
import { loadPatientFinder } from "@/lib/tools/patient-finder-data";
import { PageIntro } from "@/components/brand/PageIntro";
import { WorldDefs } from "@/components/home/worlds/WorldDefs";
import { GlanceStrip, IntentTiles } from "@/components/patient-tools/shelves/Shelves";
import { OptionList } from "@/components/patient-tools/shelves/OptionList";
import { FitPicker } from "@/components/patient-tools/fit/FitPicker";
import type { StepId } from "@/domains/patient-tools/ladder/model";
import { AppSearch } from "@/components/patient-tools/shelves/AppSearch";
import { SavedTray } from "@/components/patient-tools/shelves/SavedTray";
import { AllAppsIndex, CrisisLine, HowThisWorks } from "@/components/patient-tools/finder/PatientHub";
import { formatReviewDate } from "@/domains/tools/clinician-hub/model";

export async function intentMetadata(id: IntentId): Promise<Metadata> {
  const intent = getIntent(id);
  if (!intent) return {};
  const { apps } = await loadPatientFinder(null);
  const count = apps.filter((a) => matchesIntent(a, intent)).length;
  const url = `${siteConfig.url}${intent.href}`;
  const description = `${intent.description} ${count} options.`;
  return {
    title: intent.title,
    description,
    alternates: { canonical: url },
    openGraph: { images: ["/images/og/heypsych.png"], title: intent.title, description, url, type: "website" },
  };
}

/** Which ladder step an intent is, for its approaches; null when it spans steps. */
const STEP_OF: Record<IntentId, StepId | null> = {
  "online-therapy": "therapist",
  "online-psychiatry": "prescriber",
  "self-guided": "self-guided",
  "peer-support": "peer",
  "free-apps": null,
  "takes-insurance": null,
};

export async function IntentPage({ id }: { id: IntentId }) {
  const intent = getIntent(id);
  if (!intent) notFound();
  const data = await loadPatientFinder(null);
  const inScope = data.apps.filter((a) => matchesIntent(a, intent)).sort(shelfOrder);
  const g = glance(inScope, (slug) => data.prices[slug] ?? null);
  const reviewed = formatReviewDate(data.lastReviewed);

  const otherCounts = Object.fromEntries(INTENTS.map((i) => [i.id, data.apps.filter((a) => matchesIntent(a, i)).length]));

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: intent.title,
    url: `${siteConfig.url}${intent.href}`,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
        { "@type": "ListItem", position: 2, name: "Apps and online care", item: `${siteConfig.url}/tools` },
        { "@type": "ListItem", position: 3, name: intent.label, item: `${siteConfig.url}${intent.href}` },
      ],
    },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: inScope.length,
      itemListElement: inScope.slice(0, 30).map((a, i) => ({ "@type": "ListItem", position: i + 1, name: a.name, url: `${siteConfig.url}${a.href}` })),
    },
  };

  return (
    <div className="bg-canvas min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <WorldDefs />
      <PageIntro
        title={intent.title}
        object="tools"
        parent={{ label: "Apps and online care", href: "/tools" }}
        description={intent.description}
        footnote={`${inScope.length} options.${reviewed ? ` Most recent review ${reviewed}.` : ""} Information, not medical advice.`}
      >
        <AppSearch apps={inScope} placeholder={`Search ${inScope.length} options by name or word`} />
      </PageIntro>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <CrisisLine crisis={data.crisis} />

        <div className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
          <section aria-label="At a glance">
            <GlanceStrip glance={g} />
          </section>
          <aside aria-labelledby="checklist-title" className="border-separator bg-surface rounded-2xl border p-5">
            <h2 id="checklist-title" className="text-label-primary text-[16px] font-semibold">
              Before you choose
            </h2>
            <ul className="mt-3 space-y-2">
              {intent.checklist.map((item) => (
                <li key={item} className="text-label-secondary flex gap-2.5 text-[14.5px] leading-snug">
                  <span aria-hidden="true" className="bg-accent mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full" />
                  {item}
                </li>
              ))}
            </ul>
          </aside>
        </div>

        <section aria-label="Which one is right for you" className="border-separator bg-surface shadow-card-1 mt-14 rounded-[28px] border px-5 py-8 sm:px-8 sm:py-10">
          <FitPicker apps={inScope} step={STEP_OF[intent.id]} noun="options" />
        </section>

        <section aria-labelledby="all-title" className="mt-16">
          <h2 id="all-title" className="font-display text-label-primary text-[24px] leading-tight sm:text-[28px]">
            Every option, narrowed your way
          </h2>
          <div className="mt-5">
            <OptionList apps={inScope} hidePay={intent.pay} />
          </div>
        </section>

        <section aria-labelledby="else-title" className="mt-20">
          <h2 id="else-title" className="font-display text-label-primary text-[24px] leading-tight sm:text-[28px]">
            Looking for something else?
          </h2>
          <div className="mt-6">
            <IntentTiles intents={INTENTS} counts={otherCounts} current={intent.id} />
          </div>
          <p className="mt-6 text-[15px]">
            <Link href="/tools" className="text-accent hover:underline">
              Browse everything
            </Link>
          </p>
        </section>

        <AllAppsIndex apps={inScope} label="Every option here" />
        <HowThisWorks />
      </div>
      <SavedTray />
    </div>
  );
}
