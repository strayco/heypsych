"use client";

/**
 * Interactive pieces of a symptom page. None of them diagnose. The notes a
 * visitor keeps ("I've noticed this") stay in this browser only; they are
 * never sent anywhere, and can be printed to bring to an appointment.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { SymptomSource } from "@/domains/symptoms/experience/model";

// ---------------------------------------------------------------------------
// I've noticed this
// ---------------------------------------------------------------------------

type Duration = "days" | "weeks" | "months" | "years";

interface Noted {
  slug: string;
  name: string;
  duration: Duration | null;
  addedAt: number;
}

const STORAGE_KEY = "hp:noticed";
const DURATIONS: { id: Duration; label: string }[] = [
  { id: "days", label: "Days" },
  { id: "weeks", label: "Weeks" },
  { id: "months", label: "Months" },
  { id: "years", label: "Years" },
];

function readNotes(): Noted[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((n) => n && typeof n.slug === "string") : [];
  } catch {
    return [];
  }
}

function writeNotes(notes: Noted[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    // Private window or blocked storage: notes last for this visit only.
  }
}

export function NoticedButton({ slug, name }: { slug: string; name: string }) {
  const [notes, setNotes] = useState<Noted[]>([]);
  const [showList, setShowList] = useState(false);
  useEffect(() => setNotes(readNotes()), []);

  const mine = notes.find((n) => n.slug === slug);
  const update = useCallback((next: Noted[]) => {
    setNotes(next);
    writeNotes(next);
  }, []);

  // Print just the list: globals.css hides everything else while
  // body[data-print-notes] is set.
  const printList = () => {
    document.body.dataset.printNotes = "1";
    const done = () => {
      delete document.body.dataset.printNotes;
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  };

  const toggle = () =>
    update(mine ? notes.filter((n) => n.slug !== slug) : [...notes, { slug, name, duration: null, addedAt: Date.now() }]);
  const setDuration = (duration: Duration) =>
    update(notes.map((n) => (n.slug === slug ? { ...n, duration } : n)));

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={Boolean(mine)}
        className={`focus-visible:ring-accent inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[15px] font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none ${
          mine ? "border-accent bg-accent text-white" : "border-separator bg-surface text-label-primary hover:border-label-tertiary"
        }`}
      >
        <span aria-hidden="true">{mine ? "✓" : "+"}</span>
        {mine ? "Noted in your list" : "I've noticed this"}
      </button>

      {mine && (
        <div className="mt-4">
          <p className="text-label-secondary text-[14px]">For how long?</p>
          <div role="group" aria-label="For how long" className="mt-2 flex flex-wrap gap-2">
            {DURATIONS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDuration(d.id)}
                aria-pressed={mine.duration === d.id}
                className={`focus-visible:ring-accent rounded-full border px-3.5 py-1.5 text-[14px] focus-visible:ring-2 focus-visible:outline-none ${
                  mine.duration === d.id ? "border-label-primary bg-label-primary text-canvas" : "border-separator bg-surface text-label-primary hover:border-label-tertiary"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {notes.length > 0 && (
        <div className="mt-4">
          <button type="button" onClick={() => setShowList((v) => !v)} aria-expanded={showList} className="text-accent hover:text-accent-hover text-[14px] font-medium">
            {showList ? "Hide" : "See"} your list ({notes.length})
          </button>
          {showList && (
            <div data-notes-print className="border-separator bg-surface mt-3 max-w-md rounded-2xl border p-5 shadow-card-1">
              <p className="text-label-primary text-[15px] font-semibold">Things you've noticed</p>
              <ul className="mt-3 space-y-2">
                {notes.map((n) => (
                  <li key={n.slug} className="flex items-baseline justify-between gap-3 text-[15px]">
                    <Link href={`/symptoms/${n.slug}`} className="text-label-primary hover:text-accent">
                      {n.name}
                    </Link>
                    <span className="text-label-tertiary text-[13px]">{n.duration ? `for ${n.duration}` : "how long?"}</span>
                  </li>
                ))}
              </ul>
              <div className="border-separator mt-4 flex items-center justify-between gap-3 border-t pt-4">
                <button type="button" onClick={printList} className="text-accent hover:text-accent-hover text-[14px] font-medium">
                  Print for an appointment
                </button>
                <button type="button" onClick={() => update([])} className="text-label-tertiary hover:text-label-secondary text-[13px]">
                  Clear list
                </button>
              </div>
              <p className="text-label-tertiary mt-3 text-[12px]">Saved in this browser only. Never sent to HeyPsych.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// What it can look like
// ---------------------------------------------------------------------------

export function ExampleStepper({ examples }: { examples: string[] }) {
  const [index, setIndex] = useState(0);
  if (examples.length === 0) return null;
  const go = (delta: number) => setIndex((i) => (i + delta + examples.length) % examples.length);

  return (
    <figure className="border-separator bg-surface rounded-3xl border p-7 shadow-card-1 sm:p-10">
      <blockquote aria-live="polite" className="font-display text-label-primary text-[22px] leading-snug sm:text-[26px]">
        {examples[index]}
      </blockquote>
      <figcaption className="mt-6 flex items-center justify-between gap-4">
        <span className="flex gap-1.5" aria-label={`Example ${index + 1} of ${examples.length}`}>
          {examples.map((_, i) => (
            <span key={i} aria-hidden="true" className={`h-1.5 rounded-full transition-all duration-300 motion-reduce:transition-none ${i === index ? "bg-accent w-6" : "bg-fill-tertiary w-1.5"}`} />
          ))}
        </span>
        {examples.length > 1 && (
          <span className="flex gap-2">
            <button type="button" onClick={() => go(-1)} aria-label="Previous example" className="border-separator hover:bg-fill-quaternary focus-visible:ring-accent h-10 w-10 rounded-full border focus-visible:ring-2 focus-visible:outline-none">
              ←
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next example" className="border-separator hover:bg-fill-quaternary focus-visible:ring-accent h-10 w-10 rounded-full border focus-visible:ring-2 focus-visible:outline-none">
              →
            </button>
          </span>
        )}
      </figcaption>
    </figure>
  );
}

// ---------------------------------------------------------------------------
// Where it can come from
// ---------------------------------------------------------------------------

export function SourceExplorer({
  conditions,
  otherCauses,
  symptomName,
}: {
  conditions: SymptomSource[];
  otherCauses: string[];
  symptomName: string;
}) {
  const [view, setView] = useState<"mental" | "other">(conditions.length > 0 ? "mental" : "other");
  const [selected, setSelected] = useState(conditions[0]?.slug);
  const current = conditions.find((c) => c.slug === selected) ?? conditions[0];

  const tab = (id: "mental" | "other", label: string, count: number) => (
    <button
      type="button"
      onClick={() => setView(id)}
      aria-pressed={view === id}
      className={`focus-visible:ring-accent rounded-[10px] px-4 py-2 text-[14px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none ${
        view === id ? "bg-surface text-label-primary shadow-sm" : "text-label-secondary hover:text-label-primary"
      }`}
    >
      {label} <span className="opacity-60 tabular-nums">{count}</span>
    </button>
  );

  return (
    <div>
      <div role="group" aria-label="Kinds of cause" className="bg-fill-quaternary inline-flex rounded-xl p-1">
        {conditions.length > 0 && tab("mental", "Mental health conditions", conditions.length)}
        {otherCauses.length > 0 && tab("other", "Other causes", otherCauses.length)}
      </div>

      {view === "mental" && current && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
          <ul className="space-y-1.5">
            {conditions.map((c) => (
              <li key={c.slug}>
                <button
                  type="button"
                  onClick={() => setSelected(c.slug)}
                  aria-pressed={c.slug === current.slug}
                  className={`focus-visible:ring-accent w-full rounded-xl px-4 py-3 text-left text-[15px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none ${
                    c.slug === current.slug ? "bg-surface text-label-primary shadow-card-1" : "text-label-secondary hover:bg-fill-quaternary"
                  }`}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
          <div aria-live="polite" className="border-separator bg-surface rounded-2xl border p-6 shadow-card-1">
            <h3 className="font-display text-label-primary text-[24px] leading-tight">
              {symptomName} in {current.name}
            </h3>
            <p className="text-label-secondary mt-3 text-[16px] leading-relaxed">{current.context}</p>
            {current.described.length > 0 && (
              <div className="border-separator mt-5 border-t pt-4">
                <p className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">How clinicians describe it</p>
                <ul className="mt-2 space-y-1">
                  {current.described.map((d) => (
                    <li key={d} className="text-label-primary text-[15px]">“{d}”</li>
                  ))}
                </ul>
              </div>
            )}
            {current.hasPage && (
              <Link href={`/conditions/${current.slug}`} className="text-accent hover:text-accent-hover mt-5 inline-flex items-center gap-1 text-[15px] font-medium">
                About {current.name} <span aria-hidden="true">→</span>
              </Link>
            )}
          </div>
        </div>
      )}

      {view === "other" && (
        <div className="mt-6">
          <p className="text-label-secondary max-w-2xl text-[15px]">
            {symptomName} is not always about mental health. A clinician will usually rule these out first.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {otherCauses.map((cause) => (
              <li key={cause} className="bg-fill-quaternary text-label-primary rounded-2xl px-5 py-4 text-[15px] leading-snug">
                {cause}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
