"use client";

/**
 * The clinician "sim": choose the job you need done and the kind of practice
 * you run, and see the products our reviewers positioned for it, each with
 * the note that says why. Everything else in the job stays listed below.
 *
 * Deterministic and record-only (see clinician-hub/model.ts). The chosen
 * practice is remembered in this browser (`localStorage`) for convenience and
 * is never sent anywhere. `?job=` and `?practice=` in the URL preselect, so
 * retired audience pages can redirect straight into a filtered view.
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { PositioningSegment } from "@/lib/schemas/clinician-tool-v4";
import type { HubProduct, JobView } from "@/domains/tools/clinician-hub/model";
import { PRACTICE_LABELS, suitedFor } from "@/domains/tools/clinician-hub/model";
import { ToolMark } from "@/components/tools/ToolMark";
import { JobObject } from "./JobObject";
import { SponsoredCard } from "@/components/commercial/SponsoredCard";
import type { SponsoredPlacement } from "@/lib/commercial/placements";

const STORAGE_KEY = "hp:clinician-practice";

const pill = (selected: boolean) =>
  `focus-visible:ring-accent rounded-full border px-4 py-2 text-[14px] font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none ${
    selected
      ? "border-label-primary bg-label-primary text-canvas"
      : "border-separator bg-surface text-label-primary hover:border-label-tertiary"
  }`;

function isPractice(value: string | null): value is PositioningSegment {
  return Boolean(value && value in PRACTICE_LABELS);
}

function readStored(): PositioningSegment | null {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return isPractice(v) ? v : null;
  } catch {
    return null;
  }
}

function writeStored(value: PositioningSegment | null) {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, value);
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage unavailable (private window, blocked): the choice just isn't kept.
  }
}

const BAA_TEXT = { yes: "Signs a BAA", no: "No BAA", unknown: "BAA not stated", na: null } as const;

function ProductCard({ product, practice }: { product: HubProduct; practice: PositioningSegment | null }) {
  const note = practice ? product.fit.find((f) => f.id === practice)?.note : null;
  const text = note ?? product.summary;
  const baa = BAA_TEXT[product.baa];

  return (
    <li className="border-separator bg-surface group relative flex flex-col rounded-2xl border p-5 shadow-card-1 transition-[transform,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.22,0.61,0.36,1)] focus-within:shadow-card-2 hover:-translate-y-0.5 hover:shadow-card-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="flex items-center gap-3">
        <ToolMark name={product.name} slug={product.slug} />
        <div className="min-w-0">
          <h4 className="text-label-primary text-[17px] leading-tight font-semibold">
            <Link
              href={product.href}
              className="focus-visible:ring-accent after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2"
            >
              {product.name}
            </Link>
          </h4>
          {product.company && product.company !== product.name && (
            <p className="text-label-tertiary truncate text-[13px]">{product.company}</p>
          )}
        </div>
      </div>
      {text && (
        <p className="text-label-secondary mt-3 text-[15px] leading-relaxed">
          {note && <span className="sr-only">Why it suits this practice: </span>}
          {text}
        </p>
      )}
      <div className="mt-auto pt-4">
        <ul className="flex flex-wrap gap-1.5 text-[12.5px]">
          {product.price && (
            <li className="bg-fill-quaternary text-label-primary rounded-full px-2.5 py-1">{product.price}</li>
          )}
          {product.freeOption && !/free/i.test(product.price ?? "") && (
            <li className="bg-fill-quaternary text-label-secondary rounded-full px-2.5 py-1">Free option</li>
          )}
          {baa && (
            <li
              className={`rounded-full px-2.5 py-1 ${
                product.baa === "yes" ? "bg-positive/10 text-label-primary" : "bg-fill-quaternary text-label-secondary"
              }`}
            >
              {baa}
            </li>
          )}
        </ul>
        <div className="mt-4 flex flex-wrap items-start gap-x-4 gap-y-2">
          <Link
            href={product.alternativesHref}
            className="text-label-tertiary hover:text-label-primary focus-visible:ring-accent relative z-10 inline-block rounded text-[13px] focus-visible:ring-2 focus-visible:outline-none"
          >
            Alternatives
          </Link>
        </div>
      </div>
    </li>
  );
}

function ProductGrid({
  products,
  practice,
  job,
}: {
  products: HubProduct[];
  practice: PositioningSegment | null;
  job: JobView;
}) {
  const groups = job.subgroups
    ? [
        ...job.subgroups.map((g) => ({ ...g, items: products.filter((p) => p.subgroup === g.id) })),
        { id: "other", label: "Other", items: products.filter((p) => !job.subgroups!.some((g) => g.id === p.subgroup)) },
      ].filter((g) => g.items.length > 0)
    : [{ id: "all", label: null as string | null, items: products }];

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.id}>
          {group.label && groups.length > 1 && (
            <h4 className="text-label-tertiary mb-3 text-[12px] font-semibold tracking-[0.06em] uppercase">{group.label}</h4>
          )}
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((product) => (
              <ProductCard key={product.slug} product={product} practice={practice} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function ClinicianShortlist({
  jobs,
  initialJob,
  showJobs,
  placement = null,
}: {
  jobs: JobView[];
  placement?: SponsoredPlacement | null;
  initialJob: string;
  /** Show the job picker (the hub). A job page shows only its own job. */
  showJobs: boolean;
}) {
  const [jobSlug, setJobSlug] = useState(initialJob);
  const [practice, setPractice] = useState<PositioningSegment | null>(null);

  // Preselect from the URL first, then from this browser's last choice.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("practice");
    const job = params.get("job");
    if (showJobs && job && jobs.some((j) => j.slug === job)) setJobSlug(job);
    if (isPractice(fromUrl)) setPractice(fromUrl);
    else setPractice(readStored());
  }, [jobs, showJobs]);

  const job = jobs.find((j) => j.slug === jobSlug) ?? jobs[0];
  const active = practice && job.practices.some((p) => p.id === practice) ? practice : null;

  const { suited, others } = useMemo(() => {
    if (!active) return { suited: [] as HubProduct[], others: job.products };
    const s = suitedFor(job, active);
    const ids = new Set(s.map((p) => p.slug));
    return { suited: s, others: job.products.filter((p) => !ids.has(p.slug)) };
  }, [job, active]);

  function choosePractice(next: PositioningSegment | null) {
    setPractice(next);
    writeStored(next);
  }

  function chooseJob(next: string) {
    setJobSlug(next);
    try {
      const url = new URL(window.location.href);
      url.searchParams.set("job", next);
      window.history.replaceState(null, "", url);
    } catch {
      // Non-essential.
    }
  }

  return (
    <div>
      {showJobs && (
        <div>
          <h2 className="font-display text-label-primary text-[28px] leading-tight tracking-[-0.01em] sm:text-[32px]">
            What do you need done?
          </h2>
          <div role="group" aria-label="Jobs" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {jobs.map((j) => {
              const selected = j.slug === job.slug;
              return (
                <button
                  key={j.slug}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => chooseJob(j.slug)}
                  className={`focus-visible:ring-accent flex flex-col items-start rounded-2xl border p-4 text-left transition-[transform,box-shadow,border-color] duration-300 [transition-timing-function:cubic-bezier(0.22,0.61,0.36,1)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none ${
                    selected
                      ? "border-label-primary bg-surface shadow-card-2"
                      : "border-separator bg-surface/60 hover:-translate-y-0.5 hover:shadow-card-1 motion-reduce:hover:translate-y-0"
                  }`}
                >
                  <JobObject object={j.object} className="h-16 w-20" />
                  <span className="text-label-primary mt-3 text-[16px] leading-snug font-semibold">{j.name}</span>
                  <span className="text-label-tertiary mt-0.5 text-[13px]">
                    {j.kind} · {j.products.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={showJobs ? "mt-12" : ""}>
        <h2
          className={
            showJobs
              ? "text-label-primary text-[20px] leading-tight font-semibold"
              : "font-display text-label-primary text-[28px] leading-tight tracking-[-0.01em] sm:text-[32px]"
          }
        >
          What kind of practice is it?
        </h2>
        {job.practices.length > 0 ? (
          <div role="group" aria-label="Kinds of practice" className="mt-4 flex flex-wrap gap-2">
            <button type="button" aria-pressed={!active} onClick={() => choosePractice(null)} className={pill(!active)}>
              Show all
            </button>
            {job.practices.map((p) => (
              <button
                key={p.id}
                type="button"
                aria-pressed={active === p.id}
                onClick={() => choosePractice(active === p.id ? null : p.id)}
                className={pill(active === p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-label-secondary mt-3 text-[15px]">Our reviewers haven&rsquo;t positioned these products by practice yet.</p>
        )}
        <p className="text-label-tertiary mt-3 text-[13px]">Remembered in this browser only. Nothing you choose is sent to us.</p>
      </div>

      {placement && (
        <div className="mt-8">
          <SponsoredCard placement={placement} source={`clinician-${job.slug}`} />
        </div>
      )}

      <div aria-live="polite" className="mt-8">
        {active ? (
          <>
            <h3 className="text-label-primary text-[17px] font-semibold">
              {suited.length > 0
                ? `${suited.length} ${suited.length === 1 ? "pick" : "picks"} for ${PRACTICE_LABELS[active].toLowerCase()} practices`
                : `Nothing here was positioned for ${PRACTICE_LABELS[active].toLowerCase()} practices`}
            </h3>
            <p className="text-label-tertiary mt-1 text-[13px]">Each note is our reviewers&rsquo; reason, from the product&rsquo;s record.</p>
            {suited.length > 0 && (
              <div className="mt-5">
                <ProductGrid products={suited} practice={active} job={job} />
              </div>
            )}
            {others.length > 0 && (
              <div className="mt-12">
                <h3 className="text-label-secondary text-[15px] font-semibold">Also in {job.kind}</h3>
                <div className="mt-4">
                  <ProductGrid products={others} practice={null} job={job} />
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <h3 className="sr-only">All {job.kind}</h3>
            <p className="text-label-tertiary text-[13px]">
              {job.products.length} {job.products.length === 1 ? "product" : "products"}. Listed by how many kinds of practice
              our reviewers positioned each for, then A–Z.
            </p>
            <div className="mt-5">
              <ProductGrid products={others} practice={null} job={job} />
            </div>
          </>
        )}
      </div>

      {showJobs && (
        <p className="mt-8 text-[15px]">
          <Link href={`/tools/for-clinicians/${job.slug}`} className="text-accent hover:underline">
            More on {job.kind} →
          </Link>
        </p>
      )}
    </div>
  );
}
