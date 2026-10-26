"use client";

/**
 * The interactive pieces of a condition page. Each is small, keyboard
 * accessible, and works without animation; nothing here scores or diagnoses.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Group } from "@/domains/conditions/experience/model";
import type { TreatmentForCondition } from "@/domains/treatments/experience/treatments-for-condition";

const chip = (selected: boolean) =>
  `focus-visible:ring-accent rounded-full border px-4 py-2 text-[14px] font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none ${
    selected
      ? "border-label-primary bg-label-primary text-canvas"
      : "border-separator bg-surface text-label-primary hover:border-label-tertiary"
  }`;

// ---------------------------------------------------------------------------
// What it can look like
// ---------------------------------------------------------------------------

export function SymptomExplorer({ groups }: { groups: Group[] }) {
  const [selected, setSelected] = useState(groups[0]?.id);
  const current = groups.find((g) => g.id === selected) ?? groups[0];
  if (!current) return null;

  return (
    <div>
      {groups.length > 1 && (
        <div role="group" aria-label="Symptom groups" className="flex flex-wrap gap-2">
          {groups.map((g) => (
            <button key={g.id} type="button" aria-pressed={g.id === current.id} onClick={() => setSelected(g.id)} className={chip(g.id === current.id)}>
              {g.label}
              <span className="ml-1.5 opacity-60 tabular-nums">{g.items.length}</span>
            </button>
          ))}
        </div>
      )}
      <ul aria-live="polite" className="mt-5 grid gap-3 sm:grid-cols-2">
        {current.items.map((item) => (
          <li key={item} className="border-separator bg-surface text-label-primary rounded-2xl border px-5 py-4 text-[15px] leading-snug shadow-card-1">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// In their words
// ---------------------------------------------------------------------------

export function QuoteCarousel({ quotes }: { quotes: string[] }) {
  const [index, setIndex] = useState(0);
  if (quotes.length === 0) return null;
  const go = (delta: number) => setIndex((i) => (i + delta + quotes.length) % quotes.length);

  return (
    <figure className="border-separator bg-surface rounded-3xl border p-7 shadow-card-1 sm:p-10">
      <blockquote aria-live="polite" className="font-display text-label-primary text-[22px] leading-snug sm:text-[26px]">
        “{quotes[index]}”
      </blockquote>
      <figcaption className="mt-6 flex items-center justify-between gap-4">
        <span className="text-label-tertiary text-[13px]">
          Shared experience {index + 1} of {quotes.length}
        </span>
        {quotes.length > 1 && (
          <span className="flex gap-2">
            <button type="button" onClick={() => go(-1)} aria-label="Previous" className="border-separator hover:bg-fill-quaternary focus-visible:ring-accent h-10 w-10 rounded-full border focus-visible:ring-2 focus-visible:outline-none">
              ←
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next" className="border-separator hover:bg-fill-quaternary focus-visible:ring-accent h-10 w-10 rounded-full border focus-visible:ring-2 focus-visible:outline-none">
              →
            </button>
          </span>
        )}
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Treatment paths
// ---------------------------------------------------------------------------

export function ApproachExplorer({
  approaches,
  treatments,
  conditionName,
}: {
  approaches: Group[];
  treatments: TreatmentForCondition[];
  conditionName: string;
}) {
  const [selected, setSelected] = useState(approaches[0]?.id);
  const current = approaches.find((a) => a.id === selected) ?? approaches[0];
  const approved = treatments.filter((t) => t.use !== "off_label");
  const offLabel = treatments.filter((t) => t.use === "off_label");

  return (
    <div className="space-y-10">
      {current && (
        <div>
          <div role="group" aria-label="Kinds of treatment" className="flex flex-wrap gap-2">
            {approaches.map((a) => (
              <button key={a.id} type="button" aria-pressed={a.id === current.id} onClick={() => setSelected(a.id)} className={chip(a.id === current.id)}>
                {a.label}
              </button>
            ))}
          </div>
          <ol aria-live="polite" className="mt-5 space-y-2">
            {current.items.map((item, i) => (
              <li key={item} className="border-separator bg-surface flex gap-4 rounded-2xl border px-5 py-4 shadow-card-1">
                <span className="text-label-tertiary font-display w-5 shrink-0 text-[18px] tabular-nums">{i + 1}</span>
                <span className="text-label-primary text-[15px] leading-snug">{item}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {treatments.length > 0 && (
        <div>
          <h3 className="font-display text-label-primary text-[22px]">Treatments on HeyPsych for {conditionName}</h3>
          <TreatmentChips title="Commonly used" list={approved} />
          <TreatmentChips title="Sometimes used (off-label)" list={offLabel} />
        </div>
      )}
    </div>
  );
}

function TreatmentChips({ title, list }: { title: string; list: TreatmentForCondition[] }) {
  if (list.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="text-label-tertiary mb-2 text-[12px] font-semibold tracking-[0.06em] uppercase">{title}</p>
      <ul className="flex flex-wrap gap-2">
        {list.slice(0, 18).map((t) => (
          <li key={t.slug}>
            <Link
              href={`/treatments/${t.slug}`}
              title={t.context ?? undefined}
              className="border-separator bg-surface text-label-primary hover:border-treatment hover:text-treatment focus-visible:ring-accent inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[14px] transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              {t.name}
              {t.fdaApproved && <span className="text-label-tertiary text-[11px]">FDA</span>}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Things that help day to day
// ---------------------------------------------------------------------------

/**
 * A short list to try, ticked off on this device only (never sent anywhere).
 * Storage can be unavailable in private windows; the list still works.
 */
export function HelpChecklist({ items, storageKey }: { items: string[]; storageKey: string }) {
  const [done, setDone] = useState<Set<number>>(new Set());

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
      if (Array.isArray(saved)) setDone(new Set(saved.filter((n) => typeof n === "number")));
    } catch {
      // Private window or blocked storage: start empty.
    }
  }, [storageKey]);

  const toggle = (i: number) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify([...next]));
      } catch {
        // Ignore; the ticks just will not persist.
      }
      return next;
    });
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="bg-fill-tertiary h-1.5 flex-1 overflow-hidden rounded-full" aria-hidden="true">
          <div className="bg-positive h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${(done.size / items.length) * 100}%` }} />
        </div>
        <span className="text-label-tertiary text-[13px] tabular-nums">
          {done.size} of {items.length} tried
        </span>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((item, i) => {
          const checked = done.has(i);
          return (
            <li key={item}>
              <label className={`flex cursor-pointer gap-3 rounded-2xl border px-4 py-3.5 transition-colors duration-200 motion-reduce:transition-none ${checked ? "border-positive/40 bg-positive/10" : "border-separator bg-surface hover:bg-fill-quaternary"}`}>
                <input type="checkbox" checked={checked} onChange={() => toggle(i)} className="accent-[var(--color-positive)] mt-0.5 h-4 w-4 shrink-0" />
                <span className={`text-[15px] leading-snug ${checked ? "text-label-secondary" : "text-label-primary"}`}>{item}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <p className="text-label-tertiary mt-3 text-[13px]">Your ticks stay on this device. They are not sent to HeyPsych.</p>
    </div>
  );
}
