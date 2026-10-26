/**
 * The support ladder
 *
 * Stepped care, the way clinicians think about it: start with the least
 * intensive help that fits, and step up when it is not enough. Four steps —
 * on your own, a coach or peer, a therapist, a prescriber — with crisis help
 * on the ground floor, available from every step.
 *
 * The person is not screened or scored. They choose a step, and can look
 * through two lenses (what's on their mind, how they'd pay); each step then
 * shows what it is, what it looks like, what it usually costs (from listed
 * prices), when people step up, and a few real options. Pure.
 */

import type { FinderApp, HelpId, NeedId } from "../finder/model";
import { monthlyFigure, shelfOrder } from "../shelves/model";

export type StepId = "self-guided" | "peer" | "therapist" | "prescriber";

export interface LadderStep {
  id: StepId;
  help: HelpId;
  /** Short name on the step. */
  label: string;
  /** One-line promise. */
  title: string;
  goodFor: string[];
  looksLike: string;
  stepUp: string;
  /** Intent page with everything on this step. */
  href: string;
}

export const STEPS: LadderStep[] = [
  {
    id: "self-guided",
    help: "self-guided",
    label: "On your own",
    title: "Learn skills on your own time",
    goodFor: ["Everyday stress and worry", "Building sleep habits", "Learning CBT and mindfulness skills", "Practice between therapy sessions"],
    looksLike: "An app on your phone, 5 to 15 minutes a day, whenever suits you. No appointment.",
    stepUp: "If a few weeks of regular use hasn't helped, or it's getting in the way of work, school or relationships.",
    href: "/tools/self-guided",
  },
  {
    id: "peer",
    help: "peer",
    label: "Coach or peer",
    title: "Talk to someone who gets it",
    goodFor: ["Feeling less alone", "Accountability and motivation", "Support in recovery", "Someone to talk to who's been there"],
    looksLike: "Chats or calls with a trained peer or coach, one-to-one or in groups. Not therapy, and not a diagnosis.",
    stepUp: "If you want treatment for what you're going through, or symptoms are getting harder to manage.",
    href: "/tools/peer-support",
  },
  {
    id: "therapist",
    help: "therapist",
    label: "Therapist",
    title: "Work with a licensed therapist",
    goodFor: ["Anxiety, depression and trauma", "Relationships and life changes", "Changing patterns that keep coming back", "Evidence-based therapy like CBT"],
    looksLike: "Usually a weekly session by video or phone, sometimes messaging in between. Many people go for a few months.",
    stepUp: "If symptoms are severe or not easing with therapy, or you'd like to know whether medication could help.",
    href: "/tools/online-therapy",
  },
  {
    id: "prescriber",
    help: "prescriber",
    label: "Prescriber",
    title: "See someone who can prescribe",
    goodFor: ["When medication might help", "ADHD evaluation and treatment", "Managing an existing prescription", "Often alongside therapy"],
    looksLike: "An evaluation with a psychiatrist or nurse practitioner, then shorter follow-ups every few weeks to months.",
    stepUp: "If you need more than an online visit can give, ask about in-person or more intensive care.",
    href: "/tools/online-psychiatry",
  },
];

export type Wallet = "any" | "free" | "insurance";

export interface Lens {
  need: NeedId | null;
  wallet: Wallet;
}

export function onStep(app: FinderApp, step: LadderStep, lens: Lens): boolean {
  if (!app.open) return false;
  if (!app.help.includes(step.help)) return false;
  if (lens.need && !app.needs.includes(lens.need)) return false;
  if (lens.wallet !== "any" && !app.pay.includes(lens.wallet)) return false;
  return true;
}

export interface StepView {
  step: LadderStep;
  count: number;
  picks: FinderApp[];
  /** Median listed monthly price on this step (with the lens), when 3+ list one. */
  typicalMonthly: number | null;
  freeCount: number;
  insuranceCount: number;
}

export function viewStep(
  apps: FinderApp[],
  step: LadderStep,
  lens: Lens,
  priceOf: (slug: string) => string | null,
  pickCount = 3
): StepView {
  const all = apps.filter((a) => onStep(a, step, lens)).sort(shelfOrder);
  const monthly = all
    .filter((a) => a.pay.some((p) => p !== "free"))
    .map((a) => monthlyFigure(priceOf(a.slug)))
    .filter((n): n is number => n !== null && n > 0)
    .sort((a, b) => a - b);
  return {
    step,
    count: all.length,
    picks: all.slice(0, pickCount),
    typicalMonthly: monthly.length >= 3 ? Math.round(monthly[Math.floor((monthly.length - 1) / 2)]) : null,
    freeCount: all.filter((a) => a.pay.includes("free")).length,
    insuranceCount: all.filter((a) => a.pay.includes("insurance")).length,
  };
}

export function stepCounts(apps: FinderApp[], lens: Lens): Record<StepId, number> {
  return Object.fromEntries(STEPS.map((s) => [s.id, apps.filter((a) => onStep(a, s, lens)).length])) as Record<StepId, number>;
}

/** Where to start when a lens leaves the chosen step empty: the nearest step that has options. */
export function nearestWithOptions(counts: Record<StepId, number>, from: StepId): StepId | null {
  const i = STEPS.findIndex((s) => s.id === from);
  for (let d = 1; d < STEPS.length; d++) {
    for (const j of [i - d, i + d]) {
      const s = STEPS[j];
      if (s && counts[s.id] > 0) return s.id;
    }
  }
  return null;
}
