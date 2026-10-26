"use client";

/**
 * "Things you've noticed" on the Symptoms hub: the list a visitor builds with
 * "I've noticed this" on symptom pages (localStorage key `hp:noticed`, written
 * by SymptomIslands). Shown only when the list has something in it; nothing
 * is rendered on the server, so no visitor's list ever leaves their browser.
 */

import { useEffect, useState } from "react";
import Link from "next/link";

interface Noted {
  slug: string;
  name: string;
  duration?: string | null;
}

export function NoticedSummary() {
  const [notes, setNotes] = useState<Noted[]>([]);

  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem("hp:noticed") ?? "[]");
      if (Array.isArray(parsed)) {
        setNotes(parsed.filter((n) => n && typeof n.slug === "string" && typeof n.name === "string"));
      }
    } catch {
      // Storage unavailable: show nothing.
    }
  }, []);

  if (notes.length === 0) return null;

  return (
    <section aria-labelledby="noticed-title" className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 lg:px-8">
      <div className="border-accent/25 bg-accent-tint rounded-2xl border p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="noticed-title" className="font-display text-label-primary text-[24px] leading-tight">
            Things you&apos;ve noticed
          </h2>
          <span className="text-label-tertiary text-[13px]">Saved in this browser only</span>
        </div>
        <ul className="mt-4 flex flex-wrap gap-2">
          {notes.map((n) => (
            <li key={n.slug}>
              <Link
                href={`/symptoms/${n.slug}`}
                className="border-separator bg-surface text-label-primary hover:border-accent hover:text-accent inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[14px] transition-colors"
              >
                {n.name}
                {n.duration && <span className="text-label-tertiary text-[12px]">for {n.duration}</span>}
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-label-secondary mt-4 text-[14px]">
          Open any of them to change how long it&apos;s lasted, or print your list to bring to an appointment.
        </p>
      </div>
    </section>
  );
}
