"use client";

/**
 * Interactive pieces of a clinician tool profile: who it suits (in the
 * reviewer's own words) and what it costs, with a clearly labelled estimate
 * only where the record states a per-provider price.
 */

import { useState } from "react";
import type { ClinicianToolExperience, FitSegment, PriceOption } from "@/domains/tools/clinician-experience/model";
import { formatCents } from "@/domains/tools/clinician-experience/model";

const pill = (selected: boolean) =>
  `focus-visible:ring-accent rounded-full border px-4 py-2 text-[14px] font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none ${
    selected ? "border-label-primary bg-label-primary text-canvas" : "border-separator bg-surface text-label-primary hover:border-label-tertiary"
  }`;

// ---------------------------------------------------------------------------
// Who it's for
// ---------------------------------------------------------------------------

export function FitExplorer({
  fit,
  bestFor,
  notFor,
  toolName,
}: {
  fit: FitSegment[];
  bestFor: string[];
  notFor: string[];
  toolName: string;
}) {
  const [selected, setSelected] = useState(fit[0]?.id);
  const current = fit.find((f) => f.id === selected) ?? fit[0];

  return (
    <div className="space-y-8">
      {current && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
          <div role="group" aria-label="Kinds of practice" className="flex flex-wrap content-start gap-2">
            {fit.map((f) => (
              <button key={f.id} type="button" onClick={() => setSelected(f.id)} aria-pressed={f.id === current.id} className={pill(f.id === current.id)}>
                {f.label.replace(/^Best for /, "")}
              </button>
            ))}
          </div>
          <div aria-live="polite" className="border-separator bg-surface rounded-2xl border p-6 shadow-card-1">
            <p className="text-label-tertiary text-[13px]">Our reviewers on {toolName}</p>
            <h3 className="font-display text-label-primary mt-1 text-[24px] leading-tight">{current.label}</h3>
            <p className="text-label-secondary mt-3 text-[16px] leading-relaxed">{current.note}</p>
          </div>
        </div>
      )}

      {(bestFor.length > 0 || notFor.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {bestFor.length > 0 && (
            <div className="bg-positive/10 rounded-2xl p-6">
              <p className="text-label-primary text-[15px] font-semibold">A good fit for</p>
              <ul className="mt-3 space-y-2">
                {bestFor.map((item) => (
                  <li key={item} className="text-label-primary flex gap-2.5 text-[15px] leading-snug">
                    <span aria-hidden="true" className="text-positive-600">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {notFor.length > 0 && (
            <div className="bg-caution-50 rounded-2xl p-6">
              <p className="text-label-primary text-[15px] font-semibold">Probably not for</p>
              <ul className="mt-3 space-y-2">
                {notFor.map((item) => (
                  <li key={item} className="text-label-primary flex gap-2.5 text-[15px] leading-snug">
                    <span aria-hidden="true" className="text-caution-600">–</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// What it costs
// ---------------------------------------------------------------------------

export function PricingExplorer({ pricing }: { pricing: ClinicianToolExperience["pricing"] }) {
  const priced = pricing.options.filter((o) => o.perProviderCents || o.flatCents);
  const [selectedId, setSelectedId] = useState<string | null>(pricing.options[0]?.id ?? null);
  const [providers, setProviders] = useState(1);
  const current: PriceOption | undefined = pricing.options.find((o) => o.id === selectedId) ?? pricing.options[0];

  const monthly =
    current?.perProviderCents != null ? current.perProviderCents * providers : current?.flatCents ?? null;

  return (
    <div className="space-y-8">
      {pricing.options.length > 0 && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-10">
          <ul className="grid gap-3 sm:grid-cols-2">
            {pricing.options.map((o) => {
              const isSelected = o.id === current?.id;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(o.id)}
                    aria-pressed={isSelected}
                    className={`focus-visible:ring-accent h-full w-full rounded-2xl border p-5 text-left transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none ${
                      isSelected ? "border-accent bg-accent-tint" : "border-separator bg-surface hover:border-label-tertiary"
                    }`}
                  >
                    <span className="text-label-primary block text-[16px] font-semibold">{o.name}</span>
                    {o.price && <span className="font-display text-label-primary mt-1 block text-[24px] leading-tight">{o.price}</span>}
                    {o.description && <span className="text-label-secondary mt-2 block text-[14px] leading-snug">{o.description}</span>}
                  </button>
                </li>
              );
            })}
          </ul>

          <div aria-live="polite" className="border-separator bg-surface self-start rounded-2xl border p-6 shadow-card-1 lg:sticky lg:top-32">
            {current && monthly !== null && priced.length > 0 ? (
              <>
                <p className="text-label-tertiary text-[13px]">Estimate · {current.name}</p>
                {current.perProviderCents != null && (
                  <div className="mt-3">
                    <label htmlFor="providers" className="text-label-secondary flex items-baseline justify-between text-[14px]">
                      <span>Providers</span>
                      <span className="text-label-primary font-semibold tabular-nums">{providers}</span>
                    </label>
                    <input
                      id="providers"
                      type="range"
                      min={1}
                      max={25}
                      value={providers}
                      onChange={(e) => setProviders(Number(e.target.value))}
                      className="mt-2 w-full accent-[var(--color-accent)]"
                    />
                  </div>
                )}
                <p className="font-display text-label-primary mt-4 text-[40px] leading-none tabular-nums">
                  {formatCents(monthly)}
                  <span className="text-label-tertiary ml-1 text-[16px] font-sans">/month</span>
                </p>
                <p className="text-label-tertiary mt-3 text-[13px] leading-relaxed">
                  An estimate from the listed price{current.perProviderCents != null ? " × providers" : ""}. It leaves out add-ons, per-claim or card fees,
                  taxes and group discounts. Confirm on the vendor&apos;s pricing page.
                </p>
              </>
            ) : (
              <>
                <p className="text-label-tertiary text-[13px]">How it&apos;s priced</p>
                <p className="font-display text-label-primary mt-1 text-[26px] leading-tight">{pricing.display ?? (pricing.quoteRequired ? "By quote" : "Not listed")}</p>
                {pricing.model && <p className="text-label-secondary mt-2 text-[15px]">{pricing.model}</p>}
              </>
            )}
            <div className="border-separator mt-5 flex flex-wrap gap-x-4 gap-y-1 border-t pt-4 text-[13px]">
              {pricing.trialDays > 0 && <span className="text-label-secondary">{pricing.trialDays}-day free trial</span>}
              {pricing.freeTier && <span className="text-label-secondary">Free plan</span>}
              {pricing.lastVerified && <span className="text-label-tertiary">Prices checked {pricing.lastVerified}</span>}
              {pricing.url && (
                <a href={pricing.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                  Vendor pricing ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {pricing.options.length === 0 && (
        <div className="border-separator bg-surface rounded-2xl border p-6 shadow-card-1">
          <p className="font-display text-label-primary text-[26px] leading-tight">{pricing.display ?? (pricing.quoteRequired ? "By quote" : "Not listed")}</p>
          {pricing.model && <p className="text-label-secondary mt-2 text-[15px]">{pricing.model}</p>}
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[13px]">
            {pricing.trialDays > 0 && <span className="text-label-secondary">{pricing.trialDays}-day free trial</span>}
            {pricing.lastVerified && <span className="text-label-tertiary">Prices checked {pricing.lastVerified}</span>}
            {pricing.url && (
              <a href={pricing.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                Vendor pricing ↗
              </a>
            )}
          </div>
        </div>
      )}

      {(pricing.addOns.length > 0 || pricing.fees.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {pricing.addOns.length > 0 && (
            <div className="bg-fill-quaternary rounded-2xl p-5">
              <p className="text-label-primary text-[15px] font-semibold">Add-ons</p>
              <ul className="mt-3 space-y-3">
                {pricing.addOns.map((a) => (
                  <li key={a.id} className="text-[14px] leading-snug">
                    <span className="text-label-primary font-medium">{a.label}</span>
                    {a.price && <span className="text-label-secondary"> · {a.price}</span>}
                    {a.description && <span className="text-label-tertiary mt-0.5 block">{a.description}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {pricing.fees.length > 0 && (
            <div className="bg-fill-quaternary rounded-2xl p-5">
              <p className="text-label-primary text-[15px] font-semibold">Fees</p>
              <ul className="mt-3 space-y-2">
                {pricing.fees.map((f) => (
                  <li key={f.label} className="flex justify-between gap-4 text-[14px]">
                    <span className="text-label-secondary">{f.label}</span>
                    <span className="text-label-primary text-right">{f.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {pricing.notes && <p className="text-label-secondary max-w-3xl text-[14px] leading-relaxed">{pricing.notes}</p>}
    </div>
  );
}
