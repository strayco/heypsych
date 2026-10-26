"use client";

/**
 * The support ladder — the patient side's guide.
 *
 * An isometric staircase in the Worlds style: four steps of care, each with
 * its object (phone, doorway, armchair, prescription box), crisis help on the
 * ground floor, and a game-piece "you" that walks to the step you choose.
 * Choosing a step opens what it is, what it looks like, what it usually costs,
 * when people step up, and three real options. Two lenses — what's on your
 * mind, how you'd pay — re-tune every step at once. Nothing is asked in
 * sequence and nothing is scored; the lenses stay on this device.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { at, iso, polygon } from "@/domains/architect/world/scene";
import { IsoBox, IsoPlane, ContactShadow, IsoCylinder } from "@/app/architect/_components/world/primitives";
import { DISCOVERY_OBJECTS, type DiscoveryObjectId } from "@/components/home/worlds/DiscoveryObjects";
import { NEEDS, type FinderApp, type NeedId } from "@/domains/patient-tools/finder/model";
import {
  STEPS,
  onStep,
  nearestWithOptions,
  stepCounts,
  viewStep,
  type Lens,
  type StepId,
  type Wallet,
} from "@/domains/patient-tools/ladder/model";
import { shelfOrder } from "@/domains/patient-tools/shelves/model";
import { FitPicker } from "@/components/patient-tools/fit/FitPicker";
import type { SponsoredPlacement } from "@/lib/commercial/placements";
import { SponsoredCard } from "@/components/commercial/SponsoredCard";

const STORAGE_KEY = "hp:ladder";

// ---------------------------------------------------------------------------
// Scene geometry (iso units)

const W = 24; // step run along gx
const D = 30; // step depth along gy
const R = 15; // riser height

/** Each step a little warmer than the one below. */
const STEP_MATERIAL = ["limestone", "textile", "oak", "walnut"] as const;

const OBJECT: Record<StepId, DiscoveryObjectId> = {
  "self-guided": "tools",
  peer: "doorway",
  therapist: "armchair",
  prescriber: "treatments",
};

/** Step i (0 = lowest) sits nearest the viewer; higher steps recede up-left. */
function stepGeometry(i: number) {
  const gx = (STEPS.length - 1 - i) * W;
  const h = (i + 1) * R;
  const origin = iso(gx, 0, 0);
  const topCenter = at(origin, iso(W / 2, D / 2, h));
  return { origin, h, topCenter };
}

function Scene({
  selected,
  counts,
  onSelect,
}: {
  selected: number;
  counts: Record<StepId, number>;
  onSelect: (i: number) => void;
}) {
  const token = stepGeometry(selected).topCenter;
  const order = STEPS.map((_, i) => i).reverse(); // back (highest) first

  return (
    <svg viewBox="-92 -128 300 266" className="h-full w-full" role="group" aria-label="The support ladder">
      {/* Floor */}
      <IsoPlane origin={iso(-4, -4)} w={STEPS.length * W + 8} d={D + 22} fill="#EDEBE5" />
      <ContactShadow origin={iso(0, 0)} w={STEPS.length * W} d={D} opacity={0.12} />

      {order.map((i) => {
        const s = STEPS[i];
        const g = stepGeometry(i);
        const active = i === selected;
        const empty = counts[s.id] === 0;
        const Art = DISCOVERY_OBJECTS[OBJECT[s.id]];
        const label = at(g.topCenter, { x: -4, y: -46 });
        return (
          <g
            key={s.id}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            aria-label={`${s.label}: ${counts[s.id]} options`}
            onClick={() => onSelect(i)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(i);
              }
            }}
            className="cursor-pointer outline-none [&:focus-visible_.step-top]:stroke-[var(--color-accent)]"
            style={{ opacity: empty && !active ? 0.55 : 1, transition: "opacity 300ms" }}
          >
            <IsoBox origin={g.origin} w={W} d={D} h={g.h} material={active ? "sage" : STEP_MATERIAL[i]} topMaterial={active ? "ceramic" : "paper"} />
            {/* Focus ring on the top face */}
            <polygon
              className="step-top"
              points={polygon([at(g.origin, iso(0, 0, g.h)), at(g.origin, iso(W, 0, g.h)), at(g.origin, iso(W, D, g.h)), at(g.origin, iso(0, D, g.h))])}
              fill="transparent"
              stroke="transparent"
              strokeWidth={1.5}
            />
            {/* The step's object, standing on it */}
            <svg x={g.topCenter.x - 26} y={g.topCenter.y - 34} width={44} height={38} overflow="visible" aria-hidden="true">
              <Art />
            </svg>
            {/* Label, upright like a map pin */}
            <text
              x={label.x}
              y={label.y}
              textAnchor="middle"
              className={active ? "fill-[var(--color-label-primary)]" : "fill-[var(--color-label-secondary)]"}
              style={{ fontSize: 7.5, fontWeight: active ? 650 : 500, paintOrder: "stroke", stroke: "#FAF9F6", strokeWidth: 2.6, strokeLinejoin: "round" }}
            >
              {s.label}
            </text>
            <text x={label.x} y={label.y + 8} textAnchor="middle" className="fill-[var(--color-label-tertiary)]" style={{ fontSize: 6, paintOrder: "stroke", stroke: "#FAF9F6", strokeWidth: 2.4, strokeLinejoin: "round" }}>
              {counts[s.id]} {counts[s.id] === 1 ? "option" : "options"}
            </text>
          </g>
        );
      })}

      {/* Ground floor: crisis help, reachable from every step */}
      <g aria-hidden="true">
        <IsoBox origin={iso((STEPS.length - 1) * W + 2, D + 4, 0)} w={W - 4} d={12} h={3} material="ceramic" topMaterial="paper" />
        <text
          x={iso((STEPS.length - 1) * W + W / 2, D + 10, 3).x}
          y={iso((STEPS.length - 1) * W + W / 2, D + 10, 3).y + 2.5}
          textAnchor="middle"
          style={{ fontSize: 6.5, fontWeight: 650 }}
          className="fill-[var(--color-negative)]"
        >
          988 · any step
        </text>
      </g>

      {/* You */}
      <g
        aria-hidden="true"
        style={{ transform: `translate(${token.x + 13}px, ${token.y + 2}px)` }}
        className="transition-transform duration-500 [transition-timing-function:cubic-bezier(0.34,1.4,0.64,1)] motion-reduce:transition-none"
      >
        <ellipse cx={0} cy={0} rx={7} ry={3.5} fill="#4A4336" opacity={0.18} />
        <IsoCylinder origin={{ x: 0, y: 0 }} radius={3.4} h={12} material="slate" />
        <circle cx={0} cy={-16.5} r={4.8} fill="#688594" />
        <circle cx={-1.5} cy={-18} r={1.5} fill="#FFFFFF" opacity={0.5} />
      </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------

function Chip({ on, onClick, children, count }: { on: boolean; onClick: () => void; children: React.ReactNode; count?: number }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={`focus-visible:ring-accent rounded-full border px-3.5 py-1.5 text-[14px] transition-colors focus-visible:ring-2 focus-visible:outline-none ${
        on ? "border-label-primary bg-label-primary text-white" : "border-separator text-label-primary hover:bg-fill-quaternary"
      }`}
    >
      {children}
      {count !== undefined && <span className={`ml-1.5 text-[12px] tabular-nums ${on ? "text-white/70" : "text-label-tertiary"}`}>{count}</span>}
    </button>
  );
}

export function SupportLadder({
  apps,
  prices,
  fixedNeed = null,
  placement = null,
}: {
  apps: FinderApp[];
  prices: Record<string, string | null>;
  /** On a need's own page the lens is set and hidden. */
  fixedNeed?: NeedId | null;
  placement?: SponsoredPlacement | null;
}) {
  const [selected, setSelected] = useState(0);
  const [lens, setLens] = useState<Lens>({ need: fixedNeed, wallet: "any" });
  const restored = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const v = JSON.parse(raw) as { step?: number; need?: string | null; wallet?: Wallet };
        if (typeof v.step === "number" && v.step >= 0 && v.step < STEPS.length) setSelected(v.step);
        setLens((l) => ({
          need: fixedNeed ?? (NEEDS.some((n) => n.id === v.need) ? (v.need as NeedId) : l.need),
          wallet: v.wallet === "free" || v.wallet === "insurance" ? v.wallet : "any",
        }));
      }
    } catch {
      // Storage unavailable: start fresh.
    }
    restored.current = true;
  }, [fixedNeed]);

  useEffect(() => {
    if (!restored.current) return;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ step: selected, need: fixedNeed ? undefined : lens.need, wallet: lens.wallet })
      );
    } catch {
      // Ignore.
    }
  }, [selected, lens, fixedNeed]);

  const counts = useMemo(() => stepCounts(apps, lens), [apps, lens]);
  const step = STEPS[selected];
  const view = useMemo(() => viewStep(apps, step, lens, (s) => prices[s] ?? null), [apps, step, lens, prices]);
  const stepApps = useMemo(() => apps.filter((a) => onStep(a, step, lens)).sort(shelfOrder), [apps, step, lens]);
  const nearest = view.count === 0 ? nearestWithOptions(counts, step.id) : null;
  const needLabel = lens.need ? NEEDS.find((n) => n.id === lens.need)?.label.toLowerCase() : null;

  const choose = (i: number) => setSelected(Math.max(0, Math.min(STEPS.length - 1, i)));
  const needCount = (id: NeedId | null) => apps.filter((a) => a.open && (!id || a.needs.includes(id)) && (lens.wallet === "any" || a.pay.includes(lens.wallet))).length;

  return (
    <div className="border-separator bg-surface overflow-hidden rounded-[28px] border shadow-card-1">
      {/* Lenses */}
      <div className="border-separator space-y-4 border-b px-5 py-5 sm:px-8">
        {!fixedNeed && (
          <div>
            <p className="text-label-tertiary mb-2 text-[12px] font-semibold tracking-[0.06em] uppercase">What&rsquo;s on your mind</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="What's on your mind">
              <Chip on={!lens.need} onClick={() => setLens((l) => ({ ...l, need: null }))}>
                Anything
              </Chip>
              {NEEDS.filter((n) => n.id !== "find-support").map((n) => (
                <Chip key={n.id} on={lens.need === n.id} onClick={() => setLens((l) => ({ ...l, need: l.need === n.id ? null : n.id }))} count={needCount(n.id)}>
                  {n.label}
                </Chip>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="text-label-tertiary mb-2 text-[12px] font-semibold tracking-[0.06em] uppercase">How you&rsquo;d pay</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="How you'd pay">
            {(
              [
                ["any", "Any way"],
                ["free", "Free"],
                ["insurance", "Insurance"],
              ] as [Wallet, string][]
            ).map(([id, label]) => (
              <Chip key={id} on={lens.wallet === id} onClick={() => setLens((l) => ({ ...l, wallet: id }))}>
                {label}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        {/* Scene */}
        <div className="bg-canvas relative px-4 pt-6 pb-4 sm:px-8 lg:border-r lg:border-separator">
          <p className="text-label-secondary max-w-sm text-[15px] leading-snug">
            Most people start with the least support that fits, and step up if it isn&rsquo;t enough. Tap a step.
          </p>
          <div className="mx-auto mt-2 aspect-[300/266] w-full max-w-[520px]">
            <Scene selected={selected} counts={counts} onSelect={choose} />
          </div>
          <div className="flex items-center justify-between gap-3 pb-2">
            <button
              type="button"
              onClick={() => choose(selected - 1)}
              disabled={selected === 0}
              className="text-label-secondary hover:text-label-primary disabled:text-label-quaternary rounded-full px-3 py-2 text-[14px] font-medium"
            >
              ← Less support
            </button>
            <ol className="flex gap-1.5" aria-label="Steps">
              {STEPS.map((s, i) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => choose(i)}
                    aria-label={s.label}
                    aria-current={i === selected ? "step" : undefined}
                    className={`block h-2 rounded-full transition-all duration-300 ${i === selected ? "bg-accent w-6" : "bg-fill-tertiary hover:bg-label-tertiary w-2"}`}
                  />
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={() => choose(selected + 1)}
              disabled={selected === STEPS.length - 1}
              className="text-label-secondary hover:text-label-primary disabled:text-label-quaternary rounded-full px-3 py-2 text-[14px] font-medium"
            >
              More support →
            </button>
          </div>
        </div>

        {/* Panel */}
        <div className="px-5 py-6 sm:px-8 sm:py-8" aria-live="polite">
          <p className="text-accent text-[13px] font-semibold">
            Step {selected + 1} of {STEPS.length} · {step.label}
          </p>
          <h3 className="font-display text-label-primary mt-1 text-[28px] leading-tight sm:text-[32px]">{step.title}</h3>
          <p className="text-label-secondary mt-2 text-[15.5px] leading-relaxed">{step.looksLike}</p>

          <ul className="mt-4 flex flex-wrap gap-1.5">
            {step.goodFor.map((g) => (
              <li key={g} className="bg-fill-quaternary text-label-primary rounded-full px-3 py-1 text-[13px]">
                {g}
              </li>
            ))}
          </ul>

          <dl className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="bg-fill-quaternary rounded-2xl px-2 py-3">
              <dd className="font-display text-label-primary text-[22px] leading-none tabular-nums">{view.count}</dd>
              <dt className="text-label-tertiary mt-1 text-[11.5px] leading-tight">options{needLabel ? ` for ${needLabel}` : ""}</dt>
            </div>
            <div className="bg-fill-quaternary rounded-2xl px-2 py-3">
              <dd className="font-display text-label-primary text-[22px] leading-none tabular-nums">{view.typicalMonthly ? `$${view.typicalMonthly}` : view.freeCount}</dd>
              <dt className="text-label-tertiary mt-1 text-[11.5px] leading-tight">{view.typicalMonthly ? "typical a month" : "free to start"}</dt>
            </div>
            <div className="bg-fill-quaternary rounded-2xl px-2 py-3">
              <dd className="font-display text-label-primary text-[22px] leading-none tabular-nums">{view.insuranceCount}</dd>
              <dt className="text-label-tertiary mt-1 text-[11.5px] leading-tight">take insurance</dt>
            </div>
          </dl>

          {view.count > 0 ? (
            <a
              href="#which-fits"
              className="bg-label-primary hover:bg-accent mt-6 flex items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-[15px] font-medium text-white transition-colors"
            >
              <span>Which {step.label.toLowerCase()} option fits you?</span>
              <span aria-hidden="true">↓</span>
            </a>
          ) : (
            <div className="bg-fill-quaternary mt-6 rounded-2xl px-4 py-4">
              <p className="text-label-primary text-[15px]">Nothing on this step with those lenses yet.</p>
              {nearest && (
                <button
                  type="button"
                  onClick={() => choose(STEPS.findIndex((s) => s.id === nearest))}
                  className="text-accent mt-1 text-[15px] font-medium"
                >
                  Try {STEPS.find((s) => s.id === nearest)?.label.toLowerCase()} →
                </button>
              )}
            </div>
          )}

          <div className="border-separator mt-6 border-t pt-4">
            <p className="text-label-secondary text-[14.5px] leading-relaxed">
              <span className="text-label-primary font-medium">When people step up: </span>
              {step.stepUp}
            </p>
            {selected < STEPS.length - 1 && (
              <button type="button" onClick={() => choose(selected + 1)} className="text-accent mt-2 text-[14.5px] font-medium">
                Step up to {STEPS[selected + 1].label.toLowerCase()} →
              </button>
            )}
            <p className="text-label-tertiary mt-3 text-[13px]">
              In crisis at any step: call or text{" "}
              <a href="tel:988" className="text-negative font-semibold">
                988
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Which one fits — full width under the scene, for the chosen step */}
      {stepApps.length > 0 && (
        <div id="which-fits" className="border-separator scroll-mt-28 border-t px-5 py-8 sm:px-8 sm:py-10">
          <FitPicker
            key={step.id}
            apps={stepApps}
            step={step.id}
            allHref={step.href}
            title={`Which ${step.label.toLowerCase()} option is right for you?`}
            noun={needLabel ? `options for ${needLabel}` : "options"}
          />
          {placement && (
            <div className="mt-6 max-w-xl">
              <SponsoredCard placement={placement} source="support-ladder" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
