"use client";

/**
 * Side effects, most common first. Each bar is how many people in 100 report
 * it in clinical studies. Choosing one shows that number as a field of 100
 * dots, which reads truer than a percentage, and what tends to help.
 */

import { useState } from "react";
import type { SideEffect } from "@/domains/treatments/experience/model";

function DotField({ filled }: { filled: number }) {
  return (
    <div
      role="img"
      aria-label={`${filled} out of 100 people`}
      className="grid grid-cols-10 gap-[5px]"
      style={{ maxWidth: 220 }}
    >
      {Array.from({ length: 100 }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`aspect-square rounded-full transition-colors duration-300 motion-reduce:transition-none ${
            i < filled ? "bg-treatment" : "bg-fill-tertiary"
          }`}
        />
      ))}
    </div>
  );
}

export function SideEffectExplorer({ effects }: { effects: SideEffect[] }) {
  const [selected, setSelected] = useState(0);
  const current = effects[selected] ?? effects[0];
  if (!current) return null;

  // Bars share one scale so their lengths compare honestly.
  const scaleMax = Math.max(10, Math.ceil(Math.max(...effects.map((e) => e.per100 ?? 0)) / 10) * 10);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10">
      <ul className="space-y-1.5">
        {effects.map((effect, index) => {
          const isSelected = index === selected;
          return (
            <li key={effect.effect}>
              <button
                type="button"
                onClick={() => setSelected(index)}
                aria-pressed={isSelected}
                className={`focus-visible:ring-accent w-full rounded-xl px-3 py-2.5 text-left transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none motion-reduce:transition-none ${
                  isSelected ? "bg-surface shadow-card-1" : "hover:bg-fill-quaternary"
                }`}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-label-primary text-[15px] font-medium">{effect.effect}</span>
                  <span className="text-label-tertiary shrink-0 text-[13px] tabular-nums">
                    {effect.per100 !== null ? `${effect.per100} in 100` : "Rate varies"}
                  </span>
                </span>
                <span className="bg-fill-tertiary mt-2 block h-1.5 overflow-hidden rounded-full">
                  {effect.per100 !== null && (
                    <span
                      className={`block h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${
                        isSelected ? "bg-treatment" : "bg-label-quaternary"
                      }`}
                      style={{ width: `${(effect.per100 / scaleMax) * 100}%` }}
                    />
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div aria-live="polite" className="border-separator bg-surface self-start rounded-2xl border p-6 shadow-card-1 lg:sticky lg:top-32">
        <h3 className="font-display text-label-primary text-[24px] leading-tight">{current.effect}</h3>
        {current.per100 !== null ? (
          <>
            <p className="text-label-secondary mt-1 text-[15px]">
              About <strong className="text-label-primary">{current.per100} in 100</strong> people in studies
            </p>
            <div className="mt-4">
              <DotField filled={current.per100} />
            </div>
          </>
        ) : (
          current.incidence && <p className="text-label-secondary mt-1 text-[15px]">{current.incidence}</p>
        )}
        {current.notes && (
          <div className="border-separator mt-5 border-t pt-4">
            <p className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">What helps</p>
            <p className="text-label-secondary mt-1.5 text-[15px] leading-relaxed">{current.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
