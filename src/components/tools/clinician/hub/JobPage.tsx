/**
 * /tools/for-clinicians/<job>: one job, in the hub's system. The office object
 * for that function, what the software does in one line, the shortlist for
 * the visitor's kind of practice, products that also do this job inside a
 * larger system, head-to-heads, and the way back to the whole practice.
 */

import Link from "next/link";
import { WorldDefs } from "@/components/home/worlds/WorldDefs";
import type { HubComparison, JobDefinition, JobView } from "@/domains/tools/clinician-hub/model";
import { formatReviewDate } from "@/domains/tools/clinician-hub/model";
import { ClinicianShortlist } from "./ClinicianShortlist";
import { ArchitectInvite } from "./ArchitectInvite";
import { JobObject } from "./JobObject";
import type { SponsoredPlacement } from "@/lib/commercial/placements";

export function JobPage({
  job,
  otherJobs,
  comparisons,
  placement,
}: {
  placement: SponsoredPlacement | null;
  job: JobView;
  otherJobs: Pick<JobDefinition, "slug" | "name">[];
  comparisons: HubComparison[];
}) {
  const reviewed = formatReviewDate(job.lastReviewed);

  return (
    <div className="bg-canvas min-h-screen">
      <WorldDefs />
      <section className="border-separator border-b px-4 pt-8 pb-10 sm:px-6 sm:pt-12 sm:pb-12 lg:px-8 lg:pt-14">
        <div className="mx-auto grid max-w-6xl items-center gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-12">
          <div className="min-w-0">
            <Link
              href="/tools/for-clinicians"
              className="text-label-secondary hover:text-label-primary focus-visible:ring-accent mb-5 inline-flex items-center gap-1.5 text-[14px] font-medium focus-visible:rounded focus-visible:ring-2 focus-visible:outline-none"
            >
              <span aria-hidden="true">←</span> Practice software
            </Link>
            <JobObject object={job.object} className="mb-4 block h-16 w-24 lg:hidden" />
            <p className="text-label-tertiary text-[15px] font-medium">{job.kind}</p>
            <h1 className="font-display text-label-primary mt-1 text-[34px] leading-[1.06] font-normal tracking-[-0.02em] sm:text-[44px] lg:text-[52px]">
              {job.name}
            </h1>
            <p className="text-label-secondary mt-3 max-w-2xl text-[16px] leading-relaxed sm:mt-4 sm:text-[18px]">{job.line}</p>
            <p className="text-label-tertiary mt-4 text-[13px] leading-relaxed">
              {job.products.length} {job.products.length === 1 ? "product" : "products"}.
              {reviewed ? ` Most recent review ${reviewed}.` : ""}
            </p>
          </div>
          <div className="hidden h-[200px] lg:block">
            <JobObject object={job.object} className="h-full w-full" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <ClinicianShortlist jobs={[job]} initialJob={job.slug} showJobs={false} placement={placement} />

        {job.alsoIn.length > 0 && (
          <section aria-labelledby="also-title" className="mt-16">
            <h2 id="also-title" className="text-label-primary text-[17px] font-semibold">
              Also built into
            </h2>
            <p className="text-label-secondary mt-1 text-[15px]">
              These are filed under another job, but their records say they do this one too.
            </p>
            <ul className="mt-4 flex flex-wrap gap-2">
              {job.alsoIn.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={p.href}
                    className="border-separator bg-surface text-label-primary hover:border-label-tertiary rounded-full border px-3.5 py-1.5 text-[14px]"
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {comparisons.length > 0 && (
          <section id="compare" aria-labelledby="compare-title" className="mt-16 scroll-mt-28">
            <h2 id="compare-title" className="font-display text-label-primary text-[28px] leading-tight sm:text-[32px]">
              Head-to-heads
            </h2>
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

        <div className="mt-16">
          <ArchitectInvite compact />
        </div>

        <nav aria-label="Other jobs" className="mt-16">
          <h2 className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">Other jobs</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {otherJobs.map((j) => (
              <li key={j.slug}>
                <Link
                  href={`/tools/for-clinicians/${j.slug}`}
                  className="border-separator text-label-secondary hover:text-label-primary hover:bg-fill-quaternary rounded-full border px-3 py-1.5 text-[14px]"
                >
                  {j.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}
