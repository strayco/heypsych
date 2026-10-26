"use client";

/**
 * Is it right for you? Both sides of the record, side by side. Tap the lines
 * that describe you; the answer is a plain summary of what you chose, not a
 * score. Nothing leaves the page.
 */

import { useState } from "react";

export function FitCheck({
  good,
  poor,
  toolName,
  alternativesHref,
}: {
  good: string[];
  poor: string[];
  toolName: string;
  alternativesHref: string | null;
}) {
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const toggle = (key: string) =>
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const goodPicked = good.filter((g) => picked.has(`g:${g}`));
  const poorPicked = poor.filter((p) => picked.has(`p:${p}`));

  const column = (items: string[], side: "g" | "p", title: string) => (
    <div>
      <h3 data-heading="sans" className={`text-[12px] font-semibold tracking-[0.06em] uppercase ${side === "g" ? "text-positive-600" : "text-caution-600"}`}>
        {title}
      </h3>
      <ul className="mt-3 space-y-2">
        {items.map((item) => {
          const key = `${side}:${item}`;
          const on = picked.has(key);
          return (
            <li key={key}>
              <button
                type="button"
                onClick={() => toggle(key)}
                aria-pressed={on}
                className={`focus-visible:ring-accent flex w-full items-start gap-3 rounded-2xl border px-4 py-3.5 text-left text-[15px] leading-snug transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none ${
                  on
                    ? side === "g"
                      ? "border-positive/40 bg-positive/10 text-label-primary"
                      : "border-caution-200 bg-caution-50 text-label-primary"
                    : "border-separator bg-surface text-label-primary hover:border-label-tertiary"
                }`}
              >
                <span
                  aria-hidden="true"
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                    on ? (side === "g" ? "border-positive bg-positive text-white" : "border-caution bg-caution text-white") : "border-separator-opaque"
                  }`}
                >
                  {on ? "✓" : ""}
                </span>
                {item}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2 md:gap-8">
        {good.length > 0 && column(good, "g", "A good fit if")}
        {poor.length > 0 && column(poor, "p", "Look elsewhere if")}
      </div>

      <div aria-live="polite" className="mt-6 min-h-[1.5rem]">
        {picked.size === 0 ? (
          <p className="text-label-tertiary text-[14px]">Tap anything that describes you.</p>
        ) : poorPicked.length > 0 ? (
          <div className="border-caution-200 bg-caution-50 rounded-2xl border px-5 py-4">
            <p className="text-label-primary text-[15px]">
              You picked {poorPicked.length === 1 ? "a reason" : `${poorPicked.length} reasons`} to look elsewhere
              {goodPicked.length > 0 ? `, and ${goodPicked.length} in its favour` : ""}. {toolName} may not be the right fit.
            </p>
            {alternativesHref && (
              <a href={alternativesHref} className="text-accent hover:text-accent-hover mt-2 inline-block text-[15px] font-medium">
                See alternatives →
              </a>
            )}
          </div>
        ) : (
          <div className="border-positive/30 bg-positive/10 rounded-2xl border px-5 py-4">
            <p className="text-label-primary text-[15px]">
              {goodPicked.length === 1 ? "One reason" : `${goodPicked.length} reasons`} {toolName} could suit you, and none against.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
