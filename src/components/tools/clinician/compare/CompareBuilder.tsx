"use client";

/**
 * Compare any two or three clinician products. Pick from the catalog (grouped
 * by job), and the facts from each record line up: price, trial, who it
 * suits, what it does, compliance. The selection lives in the URL (?tools=)
 * so it can be shared.
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Outbound } from "@/lib/commercial/outbound";
import { ToolMark } from "@/components/tools/ToolMark";
import { GetItLinks } from "@/components/commercial/GetItLinks";

export interface BuilderProduct {
  slug: string;
  name: string;
  job: string;
  jobKind: string;
  href: string | null;
  price: string;
  trial: string;
  suits: string[];
  groups: Record<string, string[]>;
  compliance: Record<string, string>;
  epcs: string | null;
  reviewed: string | null;
  visit: Outbound | null;
}

const MAX = 3;

export function CompareBuilder({ products, groupOrder }: { products: BuilderProduct[]; groupOrder: string[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const bySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("tools") ?? "";
    const initial = raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => bySlug.has(s))
      .slice(0, MAX);
    if (initial.length) setSelected(initial);
  }, [bySlug]);

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : prev.length >= MAX ? prev : [...prev, slug];
      try {
        const url = new URL(window.location.href);
        if (next.length) url.searchParams.set("tools", next.join(","));
        else url.searchParams.delete("tools");
        window.history.replaceState(null, "", url);
      } catch {
        // Non-essential.
      }
      return next;
    });
  }

  const chosen = selected.map((s) => bySlug.get(s)!).filter(Boolean);
  const jobs = [...new Map(products.map((p) => [p.job, p.jobKind])).entries()];
  const groupRows = groupOrder.filter((g) => chosen.some((p) => p.groups[g]?.length));
  const complianceRows = chosen.length ? Object.keys(chosen[0].compliance) : [];
  const cols = chosen.length === 3 ? "sm:grid-cols-[170px_1fr_1fr_1fr]" : "sm:grid-cols-[200px_1fr_1fr]";

  const row = (label: string, values: React.ReactNode[], key = label) => (
    <div key={key} className={`grid gap-2 py-4 sm:gap-6 ${cols}`}>
      <dt className="text-label-secondary text-[14px] font-medium">{label}</dt>
      {values.map((v, i) => (
        <dd key={i} className="text-label-primary text-[15px] leading-snug">
          <span className="text-label-tertiary text-[12px] sm:hidden">{chosen[i].name}: </span>
          {v}
        </dd>
      ))}
    </div>
  );

  return (
    <div>
      <div className="space-y-6">
        {jobs.map(([job, kind]) => (
          <div key={job}>
            <h3 className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">{kind}</h3>
            <div role="group" aria-label={kind} className="mt-2 flex flex-wrap gap-2">
              {products
                .filter((p) => p.job === job)
                .map((p) => {
                  const on = selected.includes(p.slug);
                  const full = !on && selected.length >= MAX;
                  return (
                    <button
                      key={p.slug}
                      type="button"
                      aria-pressed={on}
                      disabled={full}
                      onClick={() => toggle(p.slug)}
                      className={`focus-visible:ring-accent inline-flex items-center gap-2 rounded-full border py-1.5 pr-4 pl-1.5 text-[14px] font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none ${
                        on
                          ? "border-label-primary bg-label-primary text-canvas"
                          : full
                            ? "border-separator text-label-quaternary cursor-not-allowed"
                            : "border-separator bg-surface text-label-primary hover:border-label-tertiary"
                      }`}
                    >
                      <ToolMark name={p.name} slug={p.slug} size="sm" className="!h-7 !w-7 !rounded-full !text-[11px]" />
                      {p.name}
                    </button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <div aria-live="polite" className="mt-12">
        {chosen.length < 2 ? (
          <p className="border-separator text-label-secondary rounded-2xl border border-dashed px-6 py-10 text-center text-[16px]">
            {chosen.length === 0 ? "Pick two or three products to line them up." : `Now pick one or two to compare with ${chosen[0].name}.`}
          </p>
        ) : (
          <section aria-label="Comparison">
            <div className="border-separator border-y">
              <div className={`hidden gap-6 py-4 sm:grid ${cols}`}>
                <span />
                {chosen.map((p) => (
                  <div key={p.slug} className="flex items-center gap-2">
                    <ToolMark name={p.name} slug={p.slug} size="sm" />
                    <span className="text-label-primary text-[16px] font-semibold">{p.name}</span>
                  </div>
                ))}
              </div>
              <dl className="divide-y divide-[var(--color-separator)]">
                {row("Kind", chosen.map((p) => p.jobKind))}
                {row("Starting price", chosen.map((p) => p.price))}
                {row("Trial or free plan", chosen.map((p) => p.trial))}
                {row(
                  "Our reviewers suggest it for",
                  chosen.map((p) => (p.suits.length ? p.suits.join(", ") : "—"))
                )}
                {groupRows.map((g) =>
                  row(g, chosen.map((p) => (p.groups[g]?.length ? p.groups[g].join(", ") : "Not listed")), `g-${g}`)
                )}
                {complianceRows.map((c) => row(c, chosen.map((p) => p.compliance[c] ?? "Not stated"), `c-${c}`))}
                {chosen.some((p) => p.epcs) && row("Controlled-substance prescribing", chosen.map((p) => p.epcs ?? "—"))}
                {row("Last reviewed", chosen.map((p) => p.reviewed ?? "—"))}
                {row(
                  "",
                  chosen.map((p) => (
                    <div key={p.slug} className="space-y-2">
                      <GetItLinks slug={p.slug} name={p.name} primary={p.visit} source="compare-builder" />
                      {p.href && (
                        <Link href={p.href} className="text-label-secondary hover:text-label-primary block text-[14px]">
                          Full profile →
                        </Link>
                      )}
                    </div>
                  )),
                  "actions"
                )}
              </dl>
            </div>
            <p className="text-label-tertiary mt-3 text-[13px]">
              From each product&rsquo;s record: vendor-stated features and compliance, our reviewers&rsquo; notes. Confirm
              prices and BAA terms with the vendor.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
