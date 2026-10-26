/**
 * /tools/for-clinicians: practice software organised by the job it does.
 *
 * Opening, the shortlist "sim" (job → kind of practice → reviewers' picks),
 * head-to-head comparisons, and every product in the server HTML as an index
 * so nothing depends on the island to be found.
 */

import Link from "next/link";
import { PageIntro } from "@/components/brand/PageIntro";
import { WorldDefs } from "@/components/home/worlds/WorldDefs";
import type { ClinicianHub as HubModel, HubComparison } from "@/domains/tools/clinician-hub/model";
import { formatReviewDate } from "@/domains/tools/clinician-hub/model";
import { ClinicianShortlist } from "./ClinicianShortlist";
import { ArchitectInvite } from "./ArchitectInvite";
import type { SponsoredPlacement } from "@/lib/commercial/placements";

export function ClinicianHub({
  hub,
  comparisons,
  placement,
}: {
  hub: HubModel;
  comparisons: HubComparison[];
  placement: SponsoredPlacement | null;
}) {
  const reviewed = formatReviewDate(hub.lastReviewed);

  return (
    <div className="bg-canvas min-h-screen">
      <WorldDefs />
      <PageIntro
        title="Practice software, by the job it does"
        object="clinician"
        description="Pick what you need done and the kind of practice you run. You'll see what our reviewers would point you to, and why, with prices and BAA status from each vendor."
        footnote={`${hub.productCount} products across ${hub.jobs.length} jobs.${reviewed ? ` Most recent review ${reviewed}.` : ""}`}
      >
        <div className="flex flex-wrap gap-2">
          <Link
            href="/architect"
            className="border-separator text-label-primary hover:bg-fill-quaternary rounded-full border px-4 py-2 text-[14px] font-medium"
          >
            Plan a whole practice in Practice Architect
          </Link>
        </div>
      </PageIntro>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <ClinicianShortlist jobs={hub.jobs} initialJob={hub.jobs[0]?.slug ?? ""} showJobs placement={placement} />

        {comparisons.length > 0 && (
          <section id="compare" aria-labelledby="compare-title" className="mt-20 scroll-mt-28">
            <h2 id="compare-title" className="font-display text-label-primary text-[28px] leading-tight sm:text-[32px]">
              Head-to-heads
            </h2>
            <p className="text-label-secondary mt-2 max-w-2xl text-[16px]">
              Side-by-side comparisons of products that do the same job.
            </p>
            <div className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
              {hub.jobs
                .map((job) => ({ job, items: comparisons.filter((c) => c.job === job.slug) }))
                .filter((g) => g.items.length > 0)
                .map(({ job, items }) => (
                  <div key={job.slug}>
                    <h3 className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">{job.kind}</h3>
                    <ul className="mt-3 space-y-2">
                      {items.map((c) => (
                        <li key={c.slug}>
                          <Link href={c.href} className="text-label-primary hover:text-accent text-[15px]">
                            {c.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
            </div>
          </section>
        )}

        <div className="mt-20">
          <ArchitectInvite />
        </div>

        <section aria-labelledby="index-title" className="mt-20">
          <h2 id="index-title" className="font-display text-label-primary text-[28px] leading-tight sm:text-[32px]">
            Everything we cover
          </h2>
          <div className="mt-6 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {hub.jobs.map((job) => (
              <div key={job.slug}>
                <h3 className="text-[15px] font-semibold">
                  <Link href={`/tools/for-clinicians/${job.slug}`} className="text-label-primary hover:text-accent">
                    {job.kind}
                  </Link>
                </h3>
                <ul className="mt-2 space-y-1.5">
                  {[...job.products]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((p) => (
                      <li key={p.slug}>
                        <Link href={p.href} className="text-label-secondary hover:text-label-primary text-[15px]">
                          {p.name}
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="text-label-tertiary mt-12 max-w-3xl text-[13px] leading-relaxed">
            How this works: who each product suits comes from our reviewers&rsquo; notes on its record; prices and compliance
            are what the vendor states, with the date we last checked on each profile. Commercial relationships don&rsquo;t
            affect what is listed or in what order.
          </p>
        </section>
      </div>
    </div>
  );
}
