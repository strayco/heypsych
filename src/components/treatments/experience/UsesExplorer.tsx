"use client";

/**
 * What it's for: one chip per condition. Choosing a chip shows how this
 * treatment is used for that condition, in the record's own words, with a
 * way into the condition page.
 */

import { useState } from "react";
import Link from "next/link";
import type { ConditionUse } from "@/domains/treatments/experience/model";

export function UsesExplorer({ uses, treatmentName }: { uses: ConditionUse[]; treatmentName: string }) {
  const [selected, setSelected] = useState(uses[0]?.slug ?? null);
  const current = uses.find((u) => u.slug === selected) ?? uses[0];
  const approved = uses.filter((u) => !u.offLabel);
  const offLabel = uses.filter((u) => u.offLabel);

  if (!current) return null;

  const chip = (use: ConditionUse) => {
    const isSelected = use.slug === current.slug;
    return (
      <button
        key={use.slug}
        type="button"
        onClick={() => setSelected(use.slug)}
        aria-pressed={isSelected}
        className={`focus-visible:ring-accent rounded-full border px-3.5 py-1.5 text-[14px] transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none ${
          isSelected
            ? "border-label-primary bg-label-primary text-canvas"
            : "border-separator bg-surface text-label-primary hover:border-label-tertiary"
        }`}
      >
        {use.name}
      </button>
    );
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
      <div className="space-y-5">
        {approved.length > 0 && (
          <div>
            <p className="text-label-tertiary mb-2.5 text-[12px] font-semibold tracking-[0.06em] uppercase">
              {approved.some((u) => u.fdaApproved) ? "FDA-approved for" : "Used for"}
            </p>
            <div className="flex flex-wrap gap-2">{approved.map(chip)}</div>
          </div>
        )}
        {offLabel.length > 0 && (
          <div>
            <p className="text-label-tertiary mb-2.5 text-[12px] font-semibold tracking-[0.06em] uppercase">
              Also prescribed for (off-label)
            </p>
            <div className="flex flex-wrap gap-2">{offLabel.map(chip)}</div>
          </div>
        )}
      </div>

      <div
        aria-live="polite"
        className="border-separator bg-surface rounded-2xl border p-6 shadow-card-1"
      >
        <p className="text-label-tertiary text-[13px]">
          {current.offLabel ? "Off-label use" : current.fdaApproved ? "FDA-approved use" : "Common use"}
        </p>
        <h3 className="font-display text-label-primary mt-1 text-[24px] leading-tight">
          {treatmentName} for {current.name}
        </h3>
        <p className="text-label-secondary mt-3 text-[16px] leading-relaxed">
          {current.context ?? `${treatmentName} is used for ${current.name}. The full guide below has the details.`}
        </p>
        {current.hasPage && (
        <Link
          href={`/conditions/${current.slug}`}
          className="text-accent hover:text-accent-hover mt-4 inline-flex items-center gap-1 text-[15px] font-medium"
        >
          About {current.name} <span aria-hidden="true">→</span>
        </Link>
        )}
      </div>
    </div>
  );
}
