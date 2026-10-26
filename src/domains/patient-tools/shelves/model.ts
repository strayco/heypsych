/**
 * Patient app shelves
 *
 * People arrive looking for something ("a therapist I can see online",
 * "something free for sleep"), not to fill in a form. This model turns the
 * finder's record-derived fields into what they are looking for: intents
 * (each with its own page), shelves of real options, honest at-a-glance
 * numbers for a set, and what a listed price works out to over a year.
 *
 * Pure. Everything comes from the record; prices are only restated (weekly or
 * monthly → per year) and labelled as based on the listed price. Order within
 * a shelf is the finder's order (open sign-up, research, privacy, name),
 * never commercial.
 */

import { type FinderApp, type HelpId, type PayId } from "../finder/model";

// ============================================================================
// INTENTS — what someone is looking for
// ============================================================================

export type IntentId =
  | "online-therapy"
  | "online-psychiatry"
  | "self-guided"
  | "free-apps"
  | "takes-insurance"
  | "peer-support";

export interface IntentDefinition {
  id: IntentId;
  /** Tile label, in the person's words. */
  label: string;
  /** Short line under the tile. */
  line: string;
  /** Page title. */
  title: string;
  /** Page intro. */
  description: string;
  href: string;
  help?: HelpId;
  pay?: PayId;
  /** What to check before choosing, specific to this kind of help. */
  checklist: string[];
}

export const INTENTS: IntentDefinition[] = [
  {
    id: "online-therapy",
    label: "Talk to a therapist",
    line: "Licensed therapists by video, phone or chat",
    title: "Online therapy, compared",
    description:
      "Services that connect you with a licensed therapist online, with what each costs, whether it takes insurance, and how private it is.",
    href: "/tools/online-therapy",
    help: "therapist",
    checklist: [
      "Do they take your insurance, and what is the copay?",
      "Can you choose or switch your therapist?",
      "Live sessions, messaging, or both, and how often?",
      "Is the therapist licensed in your state?",
    ],
  },
  {
    id: "online-psychiatry",
    label: "Get medication",
    line: "Psychiatrists and NPs who can prescribe",
    title: "Online psychiatry and medication, compared",
    description:
      "Services where a psychiatrist or nurse practitioner can evaluate you and prescribe online, with cost, insurance and what they treat.",
    href: "/tools/online-psychiatry",
    help: "prescriber",
    checklist: [
      "Do they treat what you need, and prescribe what you might need?",
      "Some medicines (like most ADHD stimulants) have extra rules online; ask before you book.",
      "What do follow-up visits cost, not just the first one?",
      "Can they work with your pharmacy and your other doctors?",
    ],
  },
  {
    id: "self-guided",
    label: "Something to try tonight",
    line: "Apps you use on your own",
    title: "Self-guided mental health apps, compared",
    description:
      "Apps you can start today without an appointment: CBT skills, meditation, sleep programs and mood tracking, with what each costs and how private it is.",
    href: "/tools/self-guided",
    help: "self-guided",
    checklist: [
      "Is it built on a method with research behind it, like CBT?",
      "What does the free version include before it asks you to pay?",
      "What happens to what you type and track?",
      "An app helps alongside care; it is not a replacement for it.",
    ],
  },
  {
    id: "free-apps",
    label: "Free",
    line: "Free, or free to start",
    title: "Free mental health apps and services",
    description:
      "Apps and services you can use for free, or start for free, with what the free version actually includes.",
    href: "/tools/free-apps",
    pay: "free",
    checklist: [
      "Is it free, or a free trial that turns into a subscription?",
      "Which features sit behind the paywall?",
      "Free apps still need to protect your data; check the privacy grade.",
    ],
  },
  {
    id: "takes-insurance",
    label: "Uses my insurance",
    line: "Accepts health insurance",
    title: "Mental health care online that takes insurance",
    description:
      "Online therapy and psychiatry that bill health insurance, so you may pay a copay instead of the full price.",
    href: "/tools/takes-insurance",
    pay: "insurance",
    checklist: [
      "Check your specific plan is in network, not just the insurer.",
      "Ask what your copay or deductible will be per visit.",
      "Medicaid and Medicare coverage varies by state and service.",
    ],
  },
  {
    id: "peer-support",
    label: "Someone who gets it",
    line: "Peer support and coaching",
    title: "Peer support and coaching apps",
    description:
      "People with lived experience, trained peers and coaches you can talk to, with what each costs and how it works.",
    href: "/tools/peer-support",
    help: "peer",
    checklist: [
      "Peers and coaches are not therapists; know who you are talking to.",
      "Is it one-to-one, groups, or a community feed?",
      "Is there moderation, and a clear path to crisis help?",
    ],
  },
];

export function getIntent(id: string): IntentDefinition | null {
  return INTENTS.find((i) => i.id === id) ?? null;
}

export function matchesIntent(app: FinderApp, intent: Pick<IntentDefinition, "help" | "pay">): boolean {
  if (intent.help && !app.help.includes(intent.help)) return false;
  if (intent.pay && !app.pay.includes(intent.pay)) return false;
  return true;
}

// ============================================================================
// WHAT YOU GET — one plain label per app
// ============================================================================

/** The kind of help, in plain words; the strongest kind first. */
export function whatYouGet(app: Pick<FinderApp, "help">): string {
  if (app.help.includes("prescriber") && app.help.includes("therapist")) return "Therapy and medication";
  if (app.help.includes("prescriber")) return "A prescriber";
  if (app.help.includes("therapist")) return "A licensed therapist";
  if (app.help.includes("peer")) return "A coach or peer";
  if (app.help.includes("self-guided")) return "On your own";
  return "Support";
}

// ============================================================================
// SHELVES
// ============================================================================

export interface Shelf {
  id: string;
  title: string;
  line: string;
  href: string | null;
  items: FinderApp[];
  total: number;
}

const EVIDENCE_RANK: Record<string, number> = {
  "Strong research support": 0,
  "Some research support": 1,
  "Limited research": 2,
  "Early research": 2,
};
const PRIVACY_RANK: Record<string, number> = { "A+": 0, A: 1, "B+": 2, B: 3, C: 4, D: 5, F: 6 };

/**
 * Shelf order. Anyone can sign up first; intensive programs (IOP, PHP,
 * residential) and prescription-only products after regular care, since few
 * people start there; then
 * research, then reach: published store review counts (sourced) and how
 * many of the needs we cover it serves, so a general service leads a
 * general shelf ahead of a niche one. Then privacy, then name. Never by
 * commercial relationship.
 */
export function shelfOrder(a: FinderApp, b: FinderApp): number {
  const ev = (x: FinderApp) => (x.evidence ? EVIDENCE_RANK[x.evidence] ?? 3 : 3);
  const reviews = (x: FinderApp) => x.storeRating?.count ?? 0;
  const priv = (x: FinderApp) => (x.privacy ? PRIVACY_RANK[x.privacy] ?? 6 : 7);
  return (
    Number(!a.open) - Number(!b.open) ||
    Number(a.notFirstStop) - Number(b.notFirstStop) ||
    ev(a) - ev(b) ||
    Math.sign(reviews(b) - reviews(a)) ||
    b.needs.length - a.needs.length ||
    priv(a) - priv(b) ||
    a.name.localeCompare(b.name)
  );
}

export function shelf(
  apps: FinderApp[],
  def: { id: string; title: string; line: string; href: string | null },
  predicate: (a: FinderApp) => boolean,
  limit = 12
): Shelf | null {
  const all = apps.filter(predicate).sort(shelfOrder);
  if (all.length < 2) return null;
  return { ...def, items: all.slice(0, limit), total: all.length };
}

// ============================================================================
// PRICES — what a listed price works out to
// ============================================================================

type Range = [number, number];

export interface CostMath {
  perWeek: Range | null;
  perMonth: Range | null;
  perYear: Range | null;
  perSession: Range | null;
}

const NUM = String.raw`\$\s?(\d[\d,]*(?:\.\d+)?)(?:\s*(?:-|–|to)\s*\$?\s?(\d[\d,]*(?:\.\d+)?))?`;

function find(text: string, unit: string): Range | null {
  const re = new RegExp(`${NUM}\\s*(?:\\/|per\\s+|a\\s+|an\\s+|each\\s+)\\s*(?:${unit})\\b`, "i");
  const m = text.match(re);
  if (!m) return null;
  const lo = Number(m[1].replace(/,/g, ""));
  const hi = m[2] ? Number(m[2].replace(/,/g, "")) : lo;
  if (!Number.isFinite(lo) || !Number.isFinite(hi) || lo <= 0) return null;
  return [Math.min(lo, hi), Math.max(lo, hi)];
}

/** Prices stated in a record's price text, by unit. */
export function parsePrice(text: string | null | undefined): CostMath {
  const t = text ?? "";
  return {
    perWeek: find(t, "week|wk"),
    perMonth: find(t, "month|mo"),
    perYear: find(t, "year|yr|annually"),
    perSession: find(t, "session|visit|appointment"),
  };
}

const money = (n: number) =>
  n >= 1000 ? `$${Math.round(n).toLocaleString("en-US")}` : `$${n % 1 === 0 ? n : n.toFixed(2)}`;
const round = (n: number) => Math.round(n);
const range = ([lo, hi]: Range, f = money) => (lo === hi ? f(lo) : `${f(lo)}–${f(hi)}`);

export interface YearCost {
  /** Headline, e.g. "About $156 a year". */
  headline: string;
  /** How it was worked out, e.g. "$12.99 a month × 12". */
  working: string;
  /** Optional comparison, e.g. "The annual plan ($69.99) saves about $86". */
  note: string | null;
}

/**
 * What the listed price comes to over a year, when the record states a
 * weekly, monthly, yearly or per-session price. Null when it states none.
 */
export function yearCost(text: string | null | undefined): YearCost | null {
  const p = parsePrice(text);
  if (p.perMonth) {
    const year: Range = [p.perMonth[0] * 12, p.perMonth[1] * 12];
    let note: string | null = null;
    if (p.perYear && p.perYear[0] < year[0]) {
      note = `The annual plan (${money(p.perYear[0])}) saves about ${money(round(year[0] - p.perYear[0]))} over paying monthly.`;
    }
    return {
      headline: `About ${range([round(year[0]), round(year[1])])} a year`,
      working: `${range(p.perMonth)} a month × 12`,
      note,
    };
  }
  if (p.perYear) {
    return { headline: `${range(p.perYear)} a year`, working: "Billed yearly", note: null };
  }
  if (p.perWeek) {
    const year: Range = [p.perWeek[0] * 52, p.perWeek[1] * 52];
    return {
      headline: `About ${range([round(year[0]), round(year[1])])} a year`,
      working: `${range(p.perWeek)} a week × 52`,
      note: "Many people use therapy for a few months rather than a full year.",
    };
  }
  if (p.perSession) {
    const year: Range = [p.perSession[0] * 52, p.perSession[1] * 52];
    return {
      headline: `${range(p.perSession)} a session`,
      working: `Weekly sessions would come to about ${range([round(year[0]), round(year[1])])} a year`,
      note: null,
    };
  }
  return null;
}

/** A listed price as a monthly figure, for comparing across a set. */
export function monthlyFigure(text: string | null | undefined): number | null {
  const p = parsePrice(text);
  if (p.perMonth) return p.perMonth[0];
  if (p.perWeek) return (p.perWeek[0] * 52) / 12;
  if (p.perYear) return p.perYear[0] / 12;
  return null;
}

// ============================================================================
// AT A GLANCE — honest numbers for a set
// ============================================================================

export interface Glance {
  total: number;
  insurance: number;
  freeToStart: number;
  withPeople: number;
  onYourOwn: number;
  /** Median listed starting price per month, among apps that state one. */
  typicalMonthly: number | null;
  priced: number;
}

export function glance(apps: FinderApp[], priceOf: (slug: string) => string | null): Glance {
  const monthly = apps
    .filter((a) => !a.pay.includes("free") || a.pay.length > 1)
    .map((a) => monthlyFigure(priceOf(a.slug)))
    .filter((n): n is number => n !== null && n > 0)
    .sort((a, b) => a - b);
  const median = monthly.length ? monthly[Math.floor((monthly.length - 1) / 2)] : null;
  return {
    total: apps.length,
    insurance: apps.filter((a) => a.pay.includes("insurance")).length,
    freeToStart: apps.filter((a) => a.pay.includes("free")).length,
    withPeople: apps.filter((a) => a.help.some((h) => h !== "self-guided")).length,
    onYourOwn: apps.filter((a) => a.help.includes("self-guided")).length,
    typicalMonthly: monthly.length >= 5 && median !== null ? Math.round(median) : null,
    priced: monthly.length,
  };
}
