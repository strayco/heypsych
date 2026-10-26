"use client";

/**
 * The hub's search: type a name or a word ("sleep", "insurance", "Talkspace")
 * and matching apps appear right under the box, replacing nothing else on the
 * page. Matches name, summary, what it's good for and what you get.
 */

import { useMemo, useState } from "react";
import type { FinderApp } from "@/domains/patient-tools/finder/model";
import { shelfOrder, whatYouGet } from "@/domains/patient-tools/shelves/model";
import { AppCard } from "./AppCard";

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9 ]+/g, " ");

// Words that carry no meaning on their own in a search like "takes my insurance".
const STOP = new Set(["a", "an", "the", "for", "my", "me", "i", "to", "with", "and", "or", "of", "app", "apps", "online", "takes", "take", "uses", "use", "accepts", "help", "that", "who", "can"]);

const WORDS: Record<string, (a: FinderApp) => boolean> = {
  insurance: (a) => a.pay.includes("insurance"),
  free: (a) => a.pay.includes("free"),
  therapist: (a) => a.help.includes("therapist"),
  therapy: (a) => a.help.includes("therapist"),
  medication: (a) => a.help.includes("prescriber"),
  psychiatrist: (a) => a.help.includes("prescriber"),
  coach: (a) => a.help.includes("peer"),
};

export function AppSearch({ apps, placeholder }: { apps: FinderApp[]; placeholder: string }) {
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(12);

  const results = useMemo(() => {
    const words = norm(q).split(/\s+/).filter((w) => w && !STOP.has(w));
    if (!words.length) return [];
    const hay = (a: FinderApp) => norm(`${a.name} ${a.summary ?? ""} ${a.goodFor ?? ""} ${whatYouGet(a)} ${a.needs.join(" ")}`);
    const scored = apps
      .filter((a) =>
        words.every((w) => {
          const special = Object.entries(WORDS).find(([k]) => k.startsWith(w) && w.length >= 4)?.[1];
          return hay(a).includes(w) || (special ? special(a) : false);
        })
      )
      .map((a) => ({ a, title: norm(a.name).includes(words.join(" ")) ? 0 : 1 }));
    return scored.sort((x, y) => x.title - y.title || shelfOrder(x.a, y.a)).map((x) => x.a);
  }, [apps, q]);

  return (
    <div>
      <label htmlFor="app-search" className="sr-only">
        Search apps and online care
      </label>
      <div className="relative">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="text-label-tertiary pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2">
          <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M16 16l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          id="app-search"
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setShown(12);
          }}
          placeholder={placeholder}
          autoComplete="off"
          className="border-separator bg-surface text-label-primary placeholder:text-label-tertiary focus:border-accent focus:ring-accent/20 shadow-card-1 w-full rounded-full border py-4 pr-5 pl-12 text-[16px] focus:ring-4 focus:outline-none sm:text-[17px]"
        />
      </div>
      {q.trim() && (
        <div className="mt-5" aria-live="polite">
          <p className="text-label-tertiary text-[14px]">
            {results.length === 0
              ? "Nothing by that name. Try a word like sleep, free, or therapist."
              : `${results.length} ${results.length === 1 ? "match" : "matches"}`}
          </p>
          {results.length > 0 && (
            <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.slice(0, shown).map((a) => (
                <li key={a.slug}>
                  <AppCard app={a} wide />
                </li>
              ))}
            </ul>
          )}
          {results.length > shown && (
            <button
              type="button"
              onClick={() => setShown((n) => n + 24)}
              className="text-accent mt-4 text-[15px] font-medium"
            >
              Show more
            </button>
          )}
        </div>
      )}
    </div>
  );
}
