/**
 * Telling apps apart
 *
 * Inside any one kind of help (sixty self-guided apps, eighty therapy
 * services) the question is "which one is right for me?". Two things answer
 * it without a questionnaire:
 *
 * 1. Approach — what you actually do with it (learn a program, meditate,
 *    track, chat it through…; for services, general therapy vs specialist vs
 *    teens and families…). Read from the record's own types, uses, "best for"
 *    and one-liner. An app can have more than one.
 * 2. Roles — within whatever is in view, which option is best-studied, best
 *    free, most private, most used, or takes insurance, each with the fact
 *    that earned it (the Wirecutter "our pick / budget pick" idea, but every
 *    role is a single record fact, never a blended score).
 *
 * Plus one fact row every card shares across all categories: research,
 * privacy, price level, and who you work with. Pure.
 */

import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
import type { FinderApp } from "../finder/model";
import type { StepId } from "../ladder/model";

// ============================================================================
// APPROACHES
// ============================================================================

export type ApproachId =
  // On your own
  | "program"
  | "calm"
  | "track"
  | "relief"
  | "chat"
  | "habits"
  // With people
  | "general"
  | "specialist"
  | "youth"
  | "couples"
  | "messaging"
  | "medication"
  | "adhd"
  | "addiction"
  | "community"
  | "coaching"
  | "identity"
  | "directory"
  | "primarycare"
  | "vr";

export interface Approach {
  id: ApproachId;
  label: string;
  line: string;
  /** Lucide icon name; mapped to a component in the UI. */
  icon: string;
  steps: StepId[];
  test: RegExp;
}

/**
 * Order matters only for display. Each test runs on the record's types,
 * primary uses, best-for, name and one-liner, lowercased.
 */
export const APPROACHES: Approach[] = [
  {
    id: "program",
    label: "Learn a program",
    line: "Step-by-step lessons, like CBT or CBT-I",
    icon: "BookOpen",
    steps: ["self-guided"],
    test: /\b(program|programme|course|lessons?|cbt|dbt|\bact\b|acceptance and commitment|digital therapeutic|insomnia treatment|psychoeducation|skills? (training|building)|structured)\b/,
  },
  {
    id: "calm",
    label: "Meditate and unwind",
    line: "Meditation, breathing, sleep sounds",
    icon: "Wind",
    steps: ["self-guided"],
    test: /\b(meditat\w*|mindful\w*|breath\w*|relax\w*|wind-down|sleep (sounds|stories|music)|calm|soundscape)\b/,
  },
  {
    id: "track",
    label: "Track and reflect",
    line: "Mood, sleep and symptom tracking, journaling",
    icon: "PenLine",
    steps: ["self-guided"],
    test: /\b(mood-tracker|journal\w*|sleep-tracker|diary|track(ing|er)?|log(ging)?|self-assessment|check-ins?)\b/,
  },
  {
    id: "relief",
    label: "In-the-moment relief",
    line: "Grounding and coping when it hits",
    icon: "LifeBuoy",
    steps: ["self-guided"],
    test: /\b(panic|grounding|coping|sos|in the moment|anxiety episode|safety plan|urges?)\b/,
  },
  {
    id: "chat",
    label: "Chat it through",
    line: "An AI companion you can talk to",
    icon: "MessageCircle",
    steps: ["self-guided", "peer"],
    test: /\b(ai-therapist|chatbot|ai companion|ai chat|conversational ai|chat with (an )?ai)\b/,
  },
  {
    id: "habits",
    label: "Habits, focus and recovery",
    line: "Routines, focus, sobriety and quitting",
    icon: "Repeat",
    steps: ["self-guided"],
    test: /\b(sobriety|recovery|habit\w*|routines?|focus|planner|adhd|quit\w*|smoking|drinking|alcohol|sober|executive function)\b/,
  },
  {
    id: "general",
    label: "General therapy",
    line: "Anxiety, depression, stress, life changes",
    icon: "Users",
    steps: ["therapist"],
    test: /\b(individual therapy|talk therapy|general therapy|online therapy|telehealth therapy|therapist matching|licensed therapists?|counsel\w*)\b/,
  },
  {
    id: "specialist",
    label: "Specialist care",
    line: "OCD, trauma, eating disorders and more",
    icon: "Target",
    steps: ["therapist", "prescriber"],
    test: /\b(ocd|erp|exposure|eating disorders?|anorexia|bulimia|trauma|ptsd|emdr|perinatal|postpartum|maternal|bipolar|psychosis|schizophrenia|autism)\b/,
  },
  {
    id: "youth",
    label: "Teens, kids and families",
    line: "Care built for young people and parents",
    icon: "Baby",
    steps: ["therapist", "prescriber"],
    test: /\b(teens?|adolescents?|child(ren)?|pediatric|paediatric|kids|youth|young people|parents?|family-based|family therapy|students?)\b/,
  },
  {
    id: "couples",
    label: "Couples",
    line: "Relationship and couples counseling",
    icon: "HeartHandshake",
    steps: ["therapist"],
    test: /\b(couples?|relationship counsel\w*|marriage)\b/,
  },
  {
    id: "messaging",
    label: "Messaging-first",
    line: "Text your therapist between or instead of calls",
    icon: "MessagesSquare",
    steps: ["therapist"],
    test: /\b(messag\w*|text-based|texting|chat-based|async\w*)\b/,
  },
  {
    id: "medication",
    label: "Medication for mood and anxiety",
    line: "Evaluation and ongoing prescriptions",
    icon: "Pill",
    steps: ["prescriber"],
    test: /\b(medication management|psychiatry|psychiatrists?|prescri\w*|anxiety medication|antidepressants?)\b/,
  },
  {
    id: "adhd",
    label: "ADHD",
    line: "Assessment and ADHD treatment",
    icon: "Sparkles",
    steps: ["prescriber", "therapist"],
    test: /\badhd\b/,
  },
  {
    id: "addiction",
    label: "Addiction treatment",
    line: "Alcohol and opioid care, including MAT",
    icon: "Footprints",
    steps: ["prescriber", "therapist", "peer"],
    test: /\b(addiction|substance|opioid|suboxone|buprenorphine|naltrexone|mat|moud|alcohol use|harm reduction|recovery)\b/,
  },
  {
    id: "vr",
    label: "Virtual reality",
    line: "Guided VR programs and exposure",
    icon: "Sparkles",
    steps: ["self-guided"],
    test: /\b(vr|virtual reality|immersive)\b/,
  },
  {
    id: "identity",
    label: "Someone who shares your background",
    line: "Black, Latinx, Asian, LGBTQ+ and faith-aware therapists",
    icon: "HeartHandshake",
    steps: ["therapist"],
    test: /\b(black|latinx|latin[oa]|hispanic|asian|lgbtq\+?|queer|trans(gender)?|inclusive|culturally|bipoc|muslim|christian|faith|people of color|south asian)\b/,
  },
  {
    id: "directory",
    label: "Browse a directory",
    line: "Search therapists and book directly",
    icon: "BookOpen",
    steps: ["therapist"],
    test: /\b(directory|therapist finder|find a therapist|listings?|search for therapists|marketplace)\b/,
  },
  {
    id: "primarycare",
    label: "With your primary care",
    line: "Online doctors who also treat mental health",
    icon: "Stethoscope",
    steps: ["therapist", "prescriber"],
    test: /\b(primary care|urgent care|family medicine|virtual (doctor|clinic)|doctor visits?|general practitioners?)\b/,
  },
  {
    id: "community",
    label: "Community",
    line: "Peer groups and moderated communities",
    icon: "Users",
    steps: ["peer", "self-guided"],
    test: /\b(peer-support|peer support|community|groups?|forum|lived experience)\b/,
  },
  {
    id: "coaching",
    label: "Coaching",
    line: "One-to-one with a trained coach",
    icon: "Target",
    steps: ["peer"],
    test: /\b(coach\w*)\b/,
  },
];

export function approachText(tool: Pick<DigitalToolV3, "name" | "one_liner" | "tool_types" | "ai_attributes" | "best_for" | "clinical_metadata">): string {
  return [
    tool.name,
    tool.one_liner,
    ...(tool.tool_types ?? []),
    ...(tool.ai_attributes ?? []),
    ...(tool.best_for ?? []),
    ...(tool.clinical_metadata?.primary_uses ?? []),
  ]
    .join(" · ")
    .toLowerCase();
}

/**
 * Every approach a record shows, strongest first: the one its wording
 * mentions most often leads, ties in display order. The first approach that
 * applies to a step is the app's main approach on that step.
 */
export function approachesOf(tool: Parameters<typeof approachText>[0]): ApproachId[] {
  const text = approachText(tool);
  const ranked = APPROACHES.map((a, i) => ({ id: a.id, i, n: (text.match(new RegExp(a.test.source, "g")) ?? []).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n || a.i - b.i)
    .map((x) => x.id);
  // The record's own type outranks wording: an AI companion is a chat app
  // even when its description talks mostly about CBT.
  const isChat = (tool.tool_types ?? []).includes("ai-therapist") || (tool.ai_attributes ?? []).includes("chatbot");
  return isChat ? ["chat", ...ranked.filter((id) => id !== "chat")] : ranked;
}

/** The app's main approach among those a step offers. */
export function mainApproach(app: Pick<FinderApp, "approaches">, step: StepId | null): ApproachId | null {
  if (step === null) return app.approaches[0] ?? null;
  return app.approaches.find((id) => APPROACHES.find((a) => a.id === id)?.steps.includes(step)) ?? null;
}

export interface ApproachCount {
  approach: Approach;
  count: number;
}

/**
 * The approaches worth offering on a step for this set, by main approach so
 * every app sits in exactly one tile: two or more apps each, largest first.
 * Apps whose wording names no approach fall into "Other".
 */
export function approachesFor(apps: FinderApp[], step: StepId | null): ApproachCount[] {
  return APPROACHES.filter((a) => step === null || a.steps.includes(step))
    .map((approach) => ({ approach, count: apps.filter((x) => mainApproach(x, step) === approach.id).length }))
    .filter((c) => c.count >= 2)
    .sort((a, b) => b.count - a.count);
}

export function inApproach(app: FinderApp, step: StepId | null, id: ApproachId | null): boolean {
  return id === null || mainApproach(app, step) === id;
}

// ============================================================================
// COST LEVEL — one comparable glyph
// ============================================================================

export type CostTier = "free" | "free-start" | "$" | "$$" | "$$$" | "insurance" | null;

export function costTier(pricing: DigitalToolV3["pricing"], monthly: number | null): CostTier {
  if (pricing.model === "free") return "free";
  if (pricing.model === "insurance-covered") return "insurance";
  if (pricing.free_tier) return "free-start";
  if (monthly === null) return null;
  if (monthly < 15) return "$";
  if (monthly <= 100) return "$$";
  return "$$$";
}

export const COST_LABEL: Record<Exclude<CostTier, null>, string> = {
  free: "Free",
  "free-start": "Free to start",
  $: "Under $15 a month",
  $$: "$15–100 a month",
  $$$: "Over $100 a month",
  insurance: "Insurance",
};

// ============================================================================
// ROLES — what each pick is best at
// ============================================================================

export type RoleId = "studied" | "free" | "private" | "used" | "insurance" | "start";

export interface RolePick {
  role: RoleId;
  label: string;
  /** The single fact that earned it. */
  because: string;
  app: FinderApp;
}

const EVIDENCE_RANK: Record<string, number> = {
  "Strong research support": 0,
  "Some research support": 1,
  "Limited research": 2,
  "Early research": 3,
};
const PRIVACY_RANK: Record<string, number> = { "A+": 0, A: 1, "B+": 2, B: 3, C: 4, D: 5, F: 6 };

const ev = (a: FinderApp) => (a.evidence ? EVIDENCE_RANK[a.evidence] ?? 4 : 5);
const priv = (a: FinderApp) => (a.privacy ? PRIVACY_RANK[a.privacy] ?? 7 : 8);
const reach = (a: FinderApp) => a.storeRating?.count ?? 0;
const tie = (a: FinderApp, b: FinderApp) =>
  Number(a.notFirstStop) - Number(b.notFirstStop) || ev(a) - ev(b) || reach(b) - reach(a) || b.needs.length - a.needs.length || priv(a) - priv(b) || a.name.localeCompare(b.name);

function compactCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

/**
 * Up to four roles for the set in view, each won by a different app where
 * possible. A role is offered only when its fact actually separates the
 * winner (e.g. "Most private" needs a graded app; "Most used" needs a
 * published review count).
 */
export function rolePicks(apps: FinderApp[], opts: { people?: boolean } = {}): RolePick[] {
  const pool = apps.filter((a) => a.open);
  if (pool.length === 0) return [];
  const taken = new Set<string>();
  const out: RolePick[] = [];
  const pick = (role: RoleId, label: string, candidates: FinderApp[], cmp: (a: FinderApp, b: FinderApp) => number, because: (a: FinderApp) => string) => {
    const sorted = [...candidates].sort(cmp);
    const winner = sorted.find((a) => !taken.has(a.slug)) ?? null;
    if (!winner) return;
    taken.add(winner.slug);
    out.push({ role, label, because: because(winner), app: winner });
  };

  pick("studied", "Best-studied", pool.filter((a) => a.evidence && ev(a) <= 2), tie, (a) => a.evidence ?? "");
  // Care from people is rarely free: "free" there usually means free to
  // search. Those steps get an insurance role instead.
  if (!opts.people) {
    pick(
      "free",
      "Best free",
      pool.filter((a) => a.pay.includes("free")),
      tie,
      (a) => [a.cost === "Free" ? "Free" : "Free to start", a.evidence].filter(Boolean).join(" · ")
    );
  }
  if (opts.people) {
    pick("insurance", "Uses insurance", pool.filter((a) => a.pay.includes("insurance")), tie, (a) =>
      ["Takes insurance", a.evidence].filter(Boolean).join(" · ")
    );
  }
  pick(
    "private",
    "Most private",
    pool.filter((a) => a.privacy && priv(a) <= 2),
    (a, b) => priv(a) - priv(b) || tie(a, b),
    (a) => `Privacy grade ${a.privacy}`
  );
  pick(
    "used",
    "Most used",
    pool.filter((a) => (a.storeRating?.count ?? 0) >= 1000),
    (a, b) => reach(b) - reach(a) || tie(a, b),
    (a) => `${compactCount(a.storeRating!.count!)} ratings on the ${a.storeRating!.store}`
  );
  // When the facts don't separate anything (no research, no grades), still
  // offer a couple of starting points, in the usual order.
  if (out.length < 2) {
    for (const a of [...pool].sort(tie)) {
      if (out.length >= 3) break;
      if (taken.has(a.slug)) continue;
      taken.add(a.slug);
      out.push({ role: "start", label: "A good place to start", because: [a.evidence, a.cost].filter(Boolean).join(" · "), app: a });
    }
  }
  return out.slice(0, 4);
}
