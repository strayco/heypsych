"use client";

/**
 * Your situation: choose what applies and see only that guidance, instead of
 * reading every special-population paragraph to find the one that matters.
 */

import { useState } from "react";
import type { Situation } from "@/domains/treatments/experience/model";

export function SituationPicker({ situations }: { situations: Situation[] }) {
  const [selected, setSelected] = useState(situations[0]?.id ?? null);
  const current = situations.find((s) => s.id === selected) ?? situations[0];
  if (!current) return null;

  const lines = current.text.split("\n").filter(Boolean);

  return (
    <div>
      <div role="group" aria-label="Choose your situation" className="flex flex-wrap gap-2">
        {situations.map((situation) => {
          const isSelected = situation.id === current.id;
          return (
            <button
              key={situation.id}
              type="button"
              onClick={() => setSelected(situation.id)}
              aria-pressed={isSelected}
              className={`focus-visible:ring-accent rounded-full border px-4 py-2 text-[14px] font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none ${
                isSelected
                  ? "border-accent bg-accent text-white"
                  : "border-separator bg-surface text-label-primary hover:border-label-tertiary"
              }`}
            >
              {situation.label}
            </button>
          );
        })}
      </div>

      <div aria-live="polite" className="border-separator bg-surface mt-5 rounded-2xl border p-6 shadow-card-1">
        {lines.length > 1 ? (
          <ul className="space-y-3">
            {lines.map((line) => {
              const [head, ...rest] = line.split(": ");
              return (
                <li key={line} className="text-[15px] leading-relaxed">
                  <span className="text-label-primary font-medium">{head}</span>
                  {rest.length > 0 && <span className="text-label-secondary">: {rest.join(": ")}</span>}
                </li>
              );
            })}
          </ul>
        ) : (
          <Paragraph text={lines[0]} />
        )}
        <p className="text-label-tertiary mt-4 text-[13px]">
          General information, not advice for your case. Talk it through with your prescriber or pharmacist.
        </p>
      </div>
    </div>
  );
}

/** The first two sentences, then the rest on request. */
function Paragraph({ text }: { text: string }) {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const lead = sentences.slice(0, 2).join(" ");
  const more = sentences.slice(2).join(" ");
  return (
    <>
      <p className="text-label-primary text-[17px] leading-relaxed">{lead}</p>
      {more && (
        <details key={text} className="group mt-3">
          <summary className="text-accent hover:text-accent-hover cursor-pointer list-none text-[14px] font-medium [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">More detail</span>
            <span className="hidden group-open:inline">Less</span>
          </summary>
          <p className="text-label-secondary mt-2 text-[15px] leading-relaxed">{more}</p>
        </details>
      )}
    </>
  );
}
