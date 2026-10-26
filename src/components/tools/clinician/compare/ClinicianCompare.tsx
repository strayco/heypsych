/**
 * A curated head-to-head between two or three clinician products
 * (data/tools-v4/comparisons). Reads top to bottom like a review: the short
 * version, each product with who it suits and a way to visit, the facts side
 * by side, the longer write-up, and questions. No tabs.
 */

import Link from "next/link";
import type { CuratedComparison } from "@/lib/tools/curated-comparisons";
import type { Outbound } from "@/lib/commercial/outbound";
import { ToolMark } from "@/components/tools/ToolMark";
import { GetItLinks } from "@/components/commercial/GetItLinks";
import { formatReviewDate } from "@/domains/tools/clinician-hub/model";

export interface CompareProduct {
  slug: string;
  name: string;
  profileHref: string | null;
  price: string | null;
  baa: "yes" | "no" | "unknown" | "na";
  suits: { label: string; note: string } | null;
  visit: Outbound | null;
}

const BAA = { yes: "Signs a BAA", no: "No BAA", unknown: "BAA not stated", na: null } as const;

function humanize(key: string): string {
  const s = key.replace(/_/g, " ").replace(/^e prescribing/i, "e-prescribing").replace(/\bai\b/gi, "AI").replace(/\behr\b/gi, "EHR");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function cellText(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  return String(v);
}

export function ClinicianCompare({
  comparison,
  products,
  back,
  related,
}: {
  comparison: CuratedComparison;
  products: CompareProduct[];
  back: { label: string; href: string };
  related: { slug: string; label: string }[];
}) {
  const reviewed = formatReviewDate(comparison.editorial?.lastReviewed ?? comparison.metadata.last_updated ?? null);
  const table = comparison.comparison_table as
    | { headers?: string[]; rows?: Record<string, unknown>[] }
    | undefined;
  const keys = ["entity_a", "entity_b", "entity_c", "entity_d"].slice(0, products.length);
  const rows = (table?.rows ?? []).map((r) => {
    const values = keys.map((k) => cellText(r[k]));
    return { feature: cellText(r.feature), values, same: values.every((v) => v === values[0]) };
  });
  const diffs = Object.entries(comparison.summary?.key_differences ?? {});
  const cols = products.length === 3 ? "lg:grid-cols-3" : "sm:grid-cols-2";
  const gridCols = products.length === 3 ? "sm:grid-cols-[170px_1fr_1fr_1fr]" : "sm:grid-cols-[200px_1fr_1fr]";
  const title = products.map((p) => p.name).join(" vs ");

  return (
    <div className="bg-canvas min-h-screen">
      <header className="border-separator border-b px-4 pt-8 pb-10 sm:px-6 sm:pt-12 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Link href={back.href} className="text-label-secondary hover:text-label-primary text-[14px] font-medium">
            <span aria-hidden="true">←</span> {back.label}
          </Link>
          <div className="mt-6 flex items-center gap-3" aria-hidden="true">
            {products.map((p, i) => (
              <span key={p.slug} className="flex items-center gap-3">
                {i > 0 && <span className="text-label-quaternary text-[15px]">vs</span>}
                <ToolMark name={p.name} slug={p.slug} size="lg" />
              </span>
            ))}
          </div>
          <h1 className="font-display text-label-primary mt-5 text-[36px] leading-[1.05] tracking-[-0.025em] sm:text-[50px]">{title}</h1>
          {comparison.summary?.bottom_line && (
            <p className="text-label-primary mt-4 max-w-3xl text-[18px] leading-relaxed sm:text-[20px]">{comparison.summary.bottom_line}</p>
          )}
          {reviewed && <p className="text-label-tertiary mt-4 text-[13px]">Reviewed {reviewed}.</p>}
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        {diffs.length > 0 && (
          <section aria-labelledby="short-title">
            <h2 id="short-title" className="font-display text-label-primary text-[28px] leading-tight sm:text-[32px]">
              The short version
            </h2>
            <p className="text-label-tertiary mt-2 text-[13px]">Which one comes out ahead on each, in our review.</p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {diffs.map(([k, v]) => (
                <li key={k} className="border-separator bg-surface flex items-baseline justify-between gap-4 rounded-2xl border px-5 py-4">
                  <span className="text-label-secondary text-[15px]">{humanize(k)}</span>
                  <span className="text-label-primary text-right text-[15px] font-semibold">{v}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className={`mt-12 grid gap-4 ${cols}`}>
          {products.map((p) => (
            <section key={p.slug} aria-labelledby={`p-${p.slug}`} className="border-separator bg-surface flex flex-col rounded-2xl border p-6 shadow-card-1">
              <div className="flex items-center gap-3">
                <ToolMark name={p.name} slug={p.slug} />
                <div>
                  <h2 id={`p-${p.slug}`} className="text-label-primary text-[19px] leading-tight font-semibold">
                    {p.name}
                  </h2>
                  {p.price && <p className="text-label-tertiary text-[13px]">{p.price}</p>}
                </div>
              </div>
              {p.suits && (
                <p className="text-label-secondary mt-3 text-[15px] leading-relaxed">
                  <span className="text-label-primary font-medium">{p.suits.label}. </span>
                  {p.suits.note}
                </p>
              )}
              {BAA[p.baa] && <p className="text-label-tertiary mt-3 text-[13px]">{BAA[p.baa]}</p>}
              <div className="mt-auto pt-5">
                <GetItLinks slug={p.slug} name={p.name} primary={p.visit} source="clinician-compare" />
                <div className="mt-3 flex gap-4 text-[14px]">
                  {p.profileHref && (
                    <Link href={p.profileHref} className="text-label-secondary hover:text-label-primary">
                      Full profile →
                    </Link>
                  )}
                  <Link href={`/tools/alternatives/${p.slug}`} className="text-label-tertiary hover:text-label-primary">
                    Alternatives
                  </Link>
                </div>
              </div>
            </section>
          ))}
        </div>

        {rows.length > 0 && (
          <section aria-labelledby="facts-title" className="mt-16">
            <h2 id="facts-title" className="font-display text-label-primary text-[28px] leading-tight sm:text-[32px]">
              Side by side
            </h2>
            <p className="text-label-tertiary mt-2 text-[13px]">Rows where they match are shown lighter. Confirm prices with each vendor.</p>
            <div className="border-separator mt-6 border-y">
              <div className={`text-label-tertiary hidden gap-6 py-3 text-[12px] font-semibold tracking-[0.04em] uppercase sm:grid ${gridCols}`}>
                <span />
                {products.map((p) => (
                  <span key={p.slug}>{p.name}</span>
                ))}
              </div>
              <dl className="divide-y divide-[var(--color-separator)]">
                {rows.map((r) => (
                  <div key={r.feature} className={`grid gap-2 py-4 sm:gap-6 ${gridCols} ${r.same ? "opacity-60" : ""}`}>
                    <dt className="text-label-secondary text-[14px] font-medium">{r.feature}</dt>
                    {r.values.map((v, i) => (
                      <dd key={i} className="text-label-primary text-[15px] leading-snug">
                        <span className="text-label-tertiary text-[12px] sm:hidden">{products[i].name}: </span>
                        {v}
                      </dd>
                    ))}
                  </div>
                ))}
              </dl>
            </div>
          </section>
        )}

        {(comparison.sections?.length ?? 0) > 0 && (
          <section aria-labelledby="detail-title" className="mt-16">
            <h2 id="detail-title" className="font-display text-label-primary text-[28px] leading-tight sm:text-[32px]">
              In more detail
            </h2>
            <div className="mt-6 max-w-[68ch] space-y-8">
              {comparison.sections!.map((s) => (
                <div key={s.heading}>
                  <h3 className="text-label-primary text-[18px] font-semibold">{s.heading.replace(new RegExp(`^${title}:\\s*`), "")}</h3>
                  <p className="text-label-secondary mt-2 text-[16px] leading-relaxed">{s.content}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {(comparison.faqs?.length ?? 0) > 0 && (
          <section aria-labelledby="faq-title" className="mt-16">
            <h2 id="faq-title" className="font-display text-label-primary text-[28px] leading-tight sm:text-[32px]">
              Questions
            </h2>
            <div className="border-separator mt-6 divide-y divide-[var(--color-separator)] border-y">
              {comparison.faqs!.map((f) => (
                <details key={f.q} className="group py-4">
                  <summary className="text-label-primary flex cursor-pointer list-none items-start justify-between gap-4 text-[16px] font-medium">
                    {f.q}
                    <span aria-hidden="true" className="text-label-tertiary transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="text-label-secondary mt-2 max-w-[68ch] text-[15px] leading-relaxed">{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <nav aria-label="More comparisons" className="mt-16">
          <h2 className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">More comparisons</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/tools/compare/${r.slug}`}
                  className="border-separator text-label-secondary hover:text-label-primary hover:bg-fill-quaternary rounded-full border px-3 py-1.5 text-[14px]"
                >
                  {r.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href={`/tools/compare?tools=${products.map((p) => p.slug).join(",")}`}
                className="text-label-secondary hover:text-label-primary px-3 py-1.5 text-[14px]"
              >
                Compare different products →
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
}
