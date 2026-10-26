"use client";

/**
 * "Which one is right for you?" — telling apart the options on one step.
 *
 * Approach tiles (what you do with it) split the set so every app sits in
 * exactly one; under them, picks by role (best-studied, best free or uses
 * insurance, most private, most used), each with the fact that earned it and
 * the shared fact row. Tapping a tile re-picks instantly. One tap compares the
 * top two side by side.
 */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  Footprints,
  HeartHandshake,
  LifeBuoy,
  MessageCircle,
  MessagesSquare,
  Baby,
  PenLine,
  Pill,
  Repeat,
  Sparkles,
  Stethoscope,
  Target,
  Users,
  Wind,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import type { FinderApp } from "@/domains/patient-tools/finder/model";
import type { StepId } from "@/domains/patient-tools/ladder/model";
import { approachesFor, inApproach, mainApproach, rolePicks, type ApproachId } from "@/domains/patient-tools/fit/model";
import { AppCard } from "@/components/patient-tools/shelves/AppCard";

const ICONS: Record<string, LucideIcon> = {
  BookOpen,
  Footprints,
  HeartHandshake,
  LifeBuoy,
  MessageCircle,
  MessagesSquare,
  Baby,
  PenLine,
  Pill,
  Repeat,
  Sparkles,
  Stethoscope,
  Target,
  Users,
  Wind,
};

export function FitPicker({
  apps,
  step,
  allHref,
  title = "Which one is right for you?",
  noun = "options",
}: {
  apps: FinderApp[];
  /** Null for a mixed set (e.g. everything free): approaches across all steps. */
  step: StepId | null;
  allHref?: string;
  title?: string;
  noun?: string;
}) {
  const [approach, setApproach] = useState<ApproachId | null>(null);
  // Up to eight tiles: the largest approaches.
  const tiles = useMemo(() => approachesFor(apps, step).slice(0, 8), [apps, step]);

  // A lens or step change can remove the chosen approach.
  useEffect(() => {
    if (approach && !tiles.some((t) => t.approach.id === approach)) setApproach(null);
  }, [tiles, approach]);

  const inView = useMemo(() => apps.filter((a) => inApproach(a, step, approach)), [apps, step, approach]);
  const picks = useMemo(() => rolePicks(inView, { people: step !== null && step !== "self-guided" }), [inView, step]);
  const current = tiles.find((t) => t.approach.id === approach)?.approach;

  if (apps.length === 0) return null;

  return (
    <div>
      <h3 className="font-display text-label-primary text-[26px] leading-tight sm:text-[30px]">{title}</h3>
      <p className="text-label-secondary mt-1.5 text-[15.5px]">
        {tiles.length > 1 ? "Pick what you want it to do. We'll show what each option is best at." : "What each option is best at, from its record."}
      </p>

      {tiles.length > 1 && (
        <div
          role="group"
          aria-label="What you want it to do"
          className="-mx-5 mt-5 flex snap-x gap-2 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden"
        >
          <TileButton on={approach === null} onClick={() => setApproach(null)} Icon={LayoutGrid} label="Show me everything" line={`All ${apps.length} ${noun}`} />
          {tiles.map(({ approach: a, count }) => (
            <TileButton
              key={a.id}
              on={approach === a.id}
              onClick={() => setApproach(approach === a.id ? null : a.id)}
              Icon={ICONS[a.icon] ?? Target}
              label={a.label}
              line={`${a.line} · ${count}`}
            />
          ))}
        </div>
      )}

      <div className="mt-6" aria-live="polite">
        <p className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">
          {current ? `${current.label}: what each is best at` : "What each is best at"}
        </p>
        <ul className={`mt-3 grid gap-3 sm:grid-cols-2 ${picks.length >= 4 ? "xl:grid-cols-4" : picks.length === 3 ? "xl:grid-cols-3" : ""}`}>
          {picks.map((p) => (
            <li key={p.app.slug} className="flex">
              <AppCard app={p.app} wide role={p.label} because={p.because} approachId={mainApproach(p.app, step)} />
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-[15px]">
          {picks.length >= 2 && (
            <Link href={`/tools/for-patients/compare/${picks[0].app.slug}-vs-${picks[1].app.slug}`} className="text-accent hover:text-accent-hover font-medium">
              Compare {picks[0].app.name} and {picks[1].app.name} →
            </Link>
          )}
          {allHref && inView.length > picks.length && (
            <Link href={allHref} className="text-label-secondary hover:text-label-primary">
              See all {apps.length} {noun}
            </Link>
          )}
        </div>
        <p className="text-label-tertiary mt-3 text-[12.5px]">
          Each pick wins on one fact from its record (research, price, privacy grade, published store ratings). Not a score, and never paid placement.
        </p>
      </div>
    </div>
  );
}

function TileButton({
  on,
  onClick,
  Icon,
  label,
  line,
}: {
  on: boolean;
  onClick: () => void;
  Icon: LucideIcon;
  label: string;
  line: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`focus-visible:ring-accent group flex w-[13.5rem] shrink-0 snap-start items-start gap-3 rounded-2xl border p-3.5 text-left transition-[background-color,border-color,transform] duration-200 focus-visible:ring-2 focus-visible:outline-none sm:w-auto ${
        on ? "border-label-primary bg-label-primary text-white" : "border-separator bg-surface hover:border-label-tertiary hover:-translate-y-0.5"
      }`}
    >
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${on ? "bg-white/15 text-white" : "bg-accent/10 text-accent"}`}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
      </span>
      <span className="min-w-0">
        <span className={`block text-[14.5px] leading-tight font-semibold ${on ? "text-white" : "text-label-primary"}`}>{label}</span>
        <span className={`mt-0.5 block text-[12.5px] leading-snug ${on ? "text-white/70" : "text-label-tertiary"}`}>{line}</span>
      </span>
    </button>
  );
}
