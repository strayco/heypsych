/**
 * Your Path — what would change the next step
 *
 * Runs the clinician-reviewed evaluator on single-answer variations of what
 * the visitor told us and reports the ones that lead somewhere different.
 * It explains the existing rules; it never adds one. Pure and deterministic.
 *
 * The urgency answer is never varied (it is a safety gate, not a preference),
 * and no variation can produce the crisis path.
 */

import { evaluateSupportPath } from "@/domains/patient-support/evaluator";
import type {
  PriorSupportLevel,
  SupportGoal,
  SupportPathId,
  SymptomDuration,
  UrgencyLevel,
} from "@/domains/patient-support/types";
import { DURATION_LABELS, GOAL_LABELS, PRIOR_LABELS } from "./journey";
import type { NextStepAnswers } from "./types";

export interface WhatIf {
  /** "If you also wanted to find out whether medication could help". */
  label: string;
  /** The answers with this one change applied. */
  answers: NextStepAnswers;
  pathId: SupportPathId;
  pathName: string;
}

const lowerFirst = (s: string) => (s.charAt(0).toLowerCase() + s.slice(1)).replace(/\bI'm\b/g, "you're");

export function evaluate(urgency: Exclude<UrgencyLevel, "immediate-crisis">, answers: NextStepAnswers) {
  return evaluateSupportPath({ urgencyCheck: urgency, ...answers });
}

export function whatIfs(urgency: Exclude<UrgencyLevel, "immediate-crisis">, answers: NextStepAnswers, max = 3): WhatIf[] {
  const current = evaluate(urgency, answers).primaryPath.id;
  const candidates: { label: string; answers: NextStepAnswers }[] = [];

  for (const goal of Object.keys(GOAL_LABELS) as Exclude<SupportGoal, "crisis-support">[]) {
    const has = answers.goals.includes(goal);
    candidates.push({
      label: has ? `If you didn't need to ${lowerFirst(GOAL_LABELS[goal])}` : `If you also wanted to ${lowerFirst(GOAL_LABELS[goal])}`,
      answers: { ...answers, goals: has ? answers.goals.filter((g) => g !== goal) : [...answers.goals, goal] },
    });
  }
  for (const prior of Object.keys(PRIOR_LABELS) as PriorSupportLevel[]) {
    if (answers.priorSupport === prior) continue;
    candidates.push({ label: `If ${lowerFirst(PRIOR_LABELS[prior]).replace(/^i'm /, "you're ").replace(/^i've /, "you'd ").replace(/^this would be my/, "this were your")}`, answers: { ...answers, priorSupport: prior } });
  }
  for (const duration of Object.keys(DURATION_LABELS) as SymptomDuration[]) {
    if (answers.duration === duration) continue;
    candidates.push({ label: `If it had been ${lowerFirst(DURATION_LABELS[duration])}`, answers: { ...answers, duration } });
  }

  const seen = new Set<SupportPathId>([current]);
  const out: WhatIf[] = [];
  for (const c of candidates) {
    const result = evaluate(urgency, c.answers);
    const id = result.primaryPath.id;
    if (id === "crisis-support" || seen.has(id)) continue;
    seen.add(id);
    out.push({ label: c.label, answers: c.answers, pathId: id, pathName: result.primaryPath.name });
    if (out.length >= max) break;
  }
  return out;
}
