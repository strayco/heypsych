/**
 * Your Path — the bridge between what a visitor has collected and the
 * next-step journey (the clinician-reviewed patient-support evaluator).
 *
 * Suggestions only. Every pre-selected answer is shown to the visitor, labelled
 * as coming from their own notes, and can be changed before anything is
 * evaluated: no hidden defaults (see the Architect lesson recorded in
 * docs/active/DECISION_PLATFORM_IMPLEMENTATION.md, Phase 1).
 *
 * The urgency question is never pre-filled.
 */

import type {
  InsurancePreference,
  NextAction,
  PriorSupportLevel,
  SupportGoal,
  SupportPathId,
  SymptomDuration,
} from "@/domains/patient-support/types";
import type { SymptomCategory } from "@/domains/symptoms/types";
import type { NoticedDuration, PathNoticed, SymptomRef } from "./types";

export interface JourneyPrefill {
  primaryConcerns: SymptomCategory[];
  duration?: SymptomDuration;
  /** How many noticed symptoms informed the suggestions (0 = none). */
  fromNoticed: number;
}

const DURATION_ORDER: NoticedDuration[] = ["days", "weeks", "months", "years"];

/**
 * Map the longest duration the visitor noted to the journey's buckets.
 * days → under two weeks; weeks → two weeks to three months; months/years →
 * more than three months.
 */
export function durationFromNoticed(noticed: PathNoticed[]): SymptomDuration | undefined {
  const longest = noticed
    .map((n) => n.duration)
    .filter((d): d is NoticedDuration => Boolean(d))
    .sort((a, b) => DURATION_ORDER.indexOf(b) - DURATION_ORDER.indexOf(a))[0];
  if (!longest) return undefined;
  if (longest === "days") return "less-than-2-weeks";
  if (longest === "weeks") return "2-weeks-to-3-months";
  return "more-than-3-months";
}

/**
 * Suggested concern categories: the categories of the noticed symptoms, most
 * frequent first, ties in the order the visitor noted them. At most three,
 * matching the journey's limit.
 */
export function concernsFromNoticed(noticed: PathNoticed[], refs: SymptomRef[]): SymptomCategory[] {
  const bySlug = new Map(refs.map((r) => [r.slug, r]));
  const counts = new Map<SymptomCategory, { count: number; first: number }>();
  noticed.forEach((n, index) => {
    const category = bySlug.get(n.slug)?.category;
    if (!category) return;
    const entry = counts.get(category);
    if (entry) entry.count += 1;
    else counts.set(category, { count: 1, first: index });
  });
  return [...counts.entries()]
    .sort((a, b) => b[1].count - a[1].count || a[1].first - b[1].first)
    .slice(0, 3)
    .map(([category]) => category);
}

export function prefillFromNoticed(noticed: PathNoticed[], refs: SymptomRef[]): JourneyPrefill {
  const known = noticed.filter((n) => refs.some((r) => r.slug === n.slug));
  return {
    primaryConcerns: concernsFromNoticed(known, refs),
    duration: durationFromNoticed(known),
    fromNoticed: known.length,
  };
}

// ---------------------------------------------------------------------------
// Labels shared by the journey, the workspace and the brief
// ---------------------------------------------------------------------------

export const DURATION_LABELS: Record<SymptomDuration, string> = {
  "less-than-2-weeks": "Less than two weeks",
  "2-weeks-to-3-months": "Two weeks to three months",
  "more-than-3-months": "More than three months",
  "on-and-off": "On and off",
};

export const GOAL_LABELS: Record<Exclude<SupportGoal, "crisis-support">, string> = {
  "understand-experience": "Understand what I'm going through",
  "learn-coping-strategies": "Learn ways to cope",
  "talk-to-someone-regularly": "Talk to someone regularly",
  "professional-evaluation": "Get a professional opinion or diagnosis",
  "explore-medication": "Find out whether medication could help",
};

export const PRIOR_LABELS: Record<PriorSupportLevel, string> = {
  none: "This would be my first time",
  "tried-apps": "I've tried apps or self-help",
  "tried-therapy": "I've had therapy before",
  "currently-in-care": "I'm in care now and want something different",
};

export const PAY_LABELS: Record<InsurancePreference, string> = {
  "use-insurance": "With insurance",
  "out-of-pocket": "Paying myself",
  "not-sure": "Not sure yet",
};

export const NOTICED_DURATION_LABELS: Record<NoticedDuration, string> = {
  days: "for days",
  weeks: "for weeks",
  months: "for months",
  years: "for years",
};

// ---------------------------------------------------------------------------
// Where each path leads today
// ---------------------------------------------------------------------------

/**
 * Live destinations for each support path. The evaluator's own next actions
 * pointed at retired routes; these are the current pages that carry each kind
 * of help. Kept here (presentation) rather than in the evaluator so the
 * clinician-reviewed selection logic is untouched.
 */
export function destinationsFor(pathId: SupportPathId, pay?: InsurancePreference): NextAction[] {
  const insurance: NextAction = { label: "See options that take insurance", href: "/tools/takes-insurance", type: "navigation" };
  const brief: NextAction = { label: "Prepare your appointment brief", href: "/my-path#brief", type: "navigation" };
  const actions: NextAction[] = [];

  switch (pathId) {
    case "crisis-support":
      actions.push(
        { label: "Call or text 988", href: "tel:988", type: "in-page" },
        { label: "Text HOME to 741741", href: "sms:741741&body=HOME", type: "in-page" },
        { label: "More crisis resources", href: "/resources/support-community/immediate-crisis", type: "navigation" }
      );
      return actions;
    case "therapy-counseling":
      actions.push({ label: "Compare therapy options", href: "/tools/online-therapy", type: "navigation" });
      break;
    case "psychiatric-eval":
      actions.push(
        { label: "Compare online psychiatry", href: "/tools/online-psychiatry", type: "navigation" },
        { label: "Find a psychiatrist near you", href: "/psychiatrists", type: "navigation" }
      );
      break;
    case "integrated-care":
      actions.push(
        { label: "Compare online psychiatry", href: "/tools/online-psychiatry", type: "navigation" },
        { label: "Compare therapy options", href: "/tools/online-therapy", type: "navigation" }
      );
      break;
    case "peer-support":
      actions.push(
        { label: "Compare peer and coaching services", href: "/tools/peer-support", type: "navigation" },
        { label: "Find support groups", href: "/resources/support-community", type: "navigation" }
      );
      break;
    case "digital-tools":
      actions.push({
        label: pay === "out-of-pocket" ? "See free and low-cost apps" : "Compare self-guided apps",
        href: pay === "out-of-pocket" ? "/tools/free-apps" : "/tools/self-guided",
        type: "navigation",
      });
      break;
    case "primary-care":
      actions.push({ label: "Read about conditions", href: "/conditions", type: "navigation" });
      break;
  }

  if (pay === "use-insurance" && pathId !== "primary-care" && pathId !== "digital-tools") actions.push(insurance);
  actions.push(brief);
  return actions;
}

/** The support ladder step that matches a path, for "see this on the ladder". */
export function ladderStepFor(pathId: SupportPathId): "self-guided" | "peer" | "therapist" | "prescriber" | null {
  switch (pathId) {
    case "digital-tools":
      return "self-guided";
    case "peer-support":
      return "peer";
    case "therapy-counseling":
      return "therapist";
    case "psychiatric-eval":
    case "integrated-care":
      return "prescriber";
    default:
      return null;
  }
}
