"use client";

/**
 * A quiet pill at the bottom of the screen once something is saved:
 * "3 saved". Opens to the list, with side-by-side for any two.
 * Hidden until there is something in it.
 */

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSavedApps } from "./saved";

export function SavedTray() {
  const { saved, ready, remove, clear } = useSavedApps();
  const [open, setOpen] = useState(false);
  const [pair, setPair] = useState<string[]>([]);

  useEffect(() => {
    setPair((p) => p.filter((s) => saved.some((a) => a.slug === s)));
    if (saved.length === 0) setOpen(false);
  }, [saved]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!ready || saved.length === 0) return null;

  const chosen = pair.length === 2 ? pair : saved.slice(0, 2).map((a) => a.slug);
  const compareHref = saved.length >= 2 ? `/tools/for-patients/compare/${chosen[0]}-vs-${chosen[1]}` : null;
  const nameOf = (slug: string) => saved.find((a) => a.slug === slug)?.name ?? slug;

  const togglePair = (slug: string) =>
    setPair((p) => (p.includes(slug) ? p.filter((s) => s !== slug) : [...p, slug].slice(-2)));

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 print:hidden">
      <div className="pointer-events-auto w-full max-w-md">
        {open && (
          <div
            id="saved-panel"
            role="dialog"
            aria-label="Your saved apps"
            className="bg-canvas border-separator mb-2 max-h-[60vh] overflow-y-auto rounded-3xl border p-5 shadow-[0_24px_64px_rgba(37,41,37,0.18)]"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-label-primary text-[17px] font-semibold">Saved</h2>
              <button type="button" onClick={clear} className="text-label-tertiary hover:text-label-primary text-[13px]">
                Clear all
              </button>
            </div>
            <p className="text-label-tertiary mt-1 text-[13px]">
              Kept on this device only.{saved.length > 2 ? " Tick two to compare them." : ""}
            </p>
            <ul className="divide-separator mt-3 divide-y">
              {saved.map((a) => (
                <li key={a.slug} className="flex items-center gap-3 py-2.5">
                  {saved.length > 2 && (
                    <input
                      type="checkbox"
                      checked={chosen.includes(a.slug)}
                      onChange={() => togglePair(a.slug)}
                      aria-label={`Compare ${a.name}`}
                      className="accent-[var(--color-accent)] h-4 w-4"
                    />
                  )}
                  <Link href={`/tools/${a.slug}`} className="text-label-primary hover:text-accent min-w-0 flex-1 truncate text-[15px]">
                    {a.name}
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(a.slug)}
                    aria-label={`Remove ${a.name}`}
                    className="text-label-tertiary hover:text-label-primary rounded-full px-2 text-[18px] leading-none"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            {compareHref && (
              <Link
                href={compareHref}
                className="bg-label-primary hover:bg-accent mt-4 flex w-full items-center justify-center rounded-full px-5 py-3 text-[15px] font-medium text-white transition-colors"
              >
                Compare {nameOf(chosen[0])} and {nameOf(chosen[1])} →
              </Link>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="saved-panel"
          className="bg-label-primary hover:bg-accent focus-visible:ring-accent mx-auto flex items-center gap-2 rounded-full px-5 py-3 text-[15px] font-medium text-white shadow-[0_12px_32px_rgba(37,41,37,0.25)] transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
            <path d="M12 20.5s-7.5-4.6-9.3-9.4C1.5 7.9 3.6 4.5 7 4.5c2 0 3.3 1.1 5 3 1.7-1.9 3-3 5-3 3.4 0 5.5 3.4 4.3 6.6-1.8 4.8-9.3 9.4-9.3 9.4z" fill="currentColor" />
          </svg>
          {saved.length} saved
          {saved.length >= 2 && !open && <span className="text-white/70">· Compare</span>}
        </button>
      </div>
    </div>
  );
}
