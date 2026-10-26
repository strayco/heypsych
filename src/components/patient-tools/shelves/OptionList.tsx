"use client";

/**
 * Every option on an intent page as a calm, compact list, not a wall of cards.
 * Two lenses on top (what's on your mind, how you'd pay) narrow it in place;
 * fifteen rows show, then "Show more". Each row: mark, name, what you get,
 * cost, privacy, save. The full list is also in the server HTML A–Z.
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { ToolMark } from "@/components/tools/ToolMark";
import { NEEDS, type FinderApp, type NeedId, type PayId } from "@/domains/patient-tools/finder/model";
import { whatYouGet } from "@/domains/patient-tools/shelves/model";
import { APPROACHES } from "@/domains/patient-tools/fit/model";
import { SaveButton } from "./SaveButton";

const PAGE = 15;

export function OptionList({ apps, hidePay }: { apps: FinderApp[]; hidePay?: PayId }) {
  const [need, setNeed] = useState<NeedId | null>(null);
  const [pay, setPay] = useState<PayId | null>(null);
  const [shown, setShown] = useState(PAGE);

  const needs = NEEDS.filter((n) => n.id !== "find-support")
    .map((n) => ({ ...n, count: apps.filter((a) => a.needs.includes(n.id)).length }))
    .filter((n) => n.count > 0 && n.count < apps.length);
  const pays = (
    [
      ["free", "Free to start"],
      ["insurance", "Takes insurance"],
    ] as [PayId, string][]
  ).filter(([id]) => id !== hidePay && apps.some((a) => a.pay.includes(id)));

  const list = useMemo(
    () => apps.filter((a) => (!need || a.needs.includes(need)) && (!pay || a.pay.includes(pay))),
    [apps, need, pay]
  );

  const chip = (on: boolean) =>
    `rounded-full border px-3 py-1.5 text-[14px] transition-colors ${
      on ? "border-label-primary bg-label-primary text-white" : "border-separator text-label-primary hover:bg-fill-quaternary"
    }`;

  return (
    <div>
      {(needs.length > 0 || pays.length > 0) && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Narrow the list">
          {needs.map((n) => (
            <button
              key={n.id}
              type="button"
              aria-pressed={need === n.id}
              onClick={() => {
                setNeed(need === n.id ? null : n.id);
                setShown(PAGE);
              }}
              className={chip(need === n.id)}
            >
              {n.label} <span className="text-[12px] tabular-nums opacity-60">{n.count}</span>
            </button>
          ))}
          {pays.map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={pay === id}
              onClick={() => {
                setPay(pay === id ? null : id);
                setShown(PAGE);
              }}
              className={chip(pay === id)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      <p className="text-label-tertiary mt-4 text-[13px]" aria-live="polite">
        {list.length} {list.length === 1 ? "option" : "options"}
      </p>

      <ul className="border-separator divide-separator bg-surface mt-2 divide-y overflow-hidden rounded-2xl border">
        {list.slice(0, shown).map((a) => (
          <li key={a.slug} className="hover:bg-fill-quaternary relative flex items-center gap-3 px-4 py-3 transition-colors">
            <ToolMark name={a.name} slug={a.slug} size="sm" />
            <div className="min-w-0 flex-1">
              <Link href={a.href} className="text-label-primary after:absolute after:inset-0 block truncate text-[15.5px] font-medium">
                {a.name}
              </Link>
              <p className="text-label-tertiary truncate text-[13px]">
                {APPROACHES.find((x) => x.id === a.approaches[0])?.label ?? whatYouGet(a)} · {a.cost}
              </p>
            </div>
            <div className="hidden shrink-0 gap-1.5 text-[12px] sm:flex">
              {a.pay.includes("insurance") && <span className="bg-positive/10 text-positive-600 rounded-full px-2 py-0.5">Insurance</span>}
              <span className="bg-fill-quaternary text-label-secondary rounded-full px-2 py-0.5">{a.privacy ? `Privacy ${a.privacy}` : "Not graded"}</span>
            </div>
            <SaveButton slug={a.slug} name={a.name} />
          </li>
        ))}
      </ul>

      {list.length > shown && (
        <button type="button" onClick={() => setShown((n) => n + PAGE * 2)} className="text-accent mt-4 text-[15px] font-medium">
          Show {Math.min(PAGE * 2, list.length - shown)} more
        </button>
      )}
    </div>
  );
}
