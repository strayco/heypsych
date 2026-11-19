/**
 * Your Path — readiness for an appointment
 *
 * How prepared the visitor's notes are for a first appointment, as a short
 * list of steps and the single most useful next one. It measures the notes,
 * never the person: nothing here says anything about how unwell someone is.
 * Pure and deterministic.
 */

import type { PathSnapshot } from "./types";

export type ReadinessStepId = "next-step" | "noticed" | "durations" | "questions" | "tried" | "appointment";

export interface ReadinessStep {
  id: ReadinessStepId;
  label: string;
  /** Shown when not done: what to do, in a few words. */
  todo: string;
  done: boolean;
  /** Optional steps never block "ready". */
  optional: boolean;
}

export interface Nudge {
  id: "list-medicines" | "compare-treatments" | "compare-apps" | "evaluation-questions";
  text: string;
  /** A question the visitor can add with one tap, when the nudge is one. */
  question?: string;
  href?: string;
}

export interface Readiness {
  steps: ReadinessStep[];
  done: number;
  total: number;
  /** Required steps all done. */
  ready: boolean;
  /** The first unfinished step, required before optional. */
  next: ReadinessStep | null;
  /** Durations still missing, for the inline fix. */
  missingDurations: string[];
  nudges: Nudge[];
  /** Days until the appointment (0 = today), null if none or past. */
  daysToAppointment: number | null;
}

export const LIST_MEDICINES_QUESTION = "Here is everything I take, including supplements. Does any of it matter for what we're discussing?";

/** Whole days between two YYYY-MM-DD dates, by calendar date. */
export function daysUntil(dateIso: string, todayIso: string): number {
  const toUtc = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  return Math.round((toUtc(dateIso) - toUtc(todayIso)) / 86_400_000);
}

export function readiness(path: PathSnapshot, todayIso: string): Readiness {
  const missingDurations = path.noticed.filter((n) => !n.duration).map((n) => n.slug);
  const questionSources = path.conditions.length + path.treatments.length + path.questions.length;

  const steps: ReadinessStep[] = [
    { id: "next-step", label: "Know what kind of help to look for", todo: "Find your next step", done: Boolean(path.nextStep), optional: false },
    { id: "noticed", label: "Note what you've noticed", todo: "Add a symptom", done: path.noticed.length > 0, optional: false },
    {
      id: "durations",
      label: "Say how long each has lasted",
      todo: missingDurations.length === 1 ? "1 still needs a duration" : `${missingDurations.length} still need a duration`,
      done: path.noticed.length > 0 && missingDurations.length === 0,
      optional: false,
    },
    { id: "questions", label: "Have questions to ask", todo: "Save a condition or treatment", done: questionSources > 0, optional: false },
    { id: "tried", label: "Note what you've tried", todo: "Tick what you've tried on a condition page", done: path.tried.length > 0, optional: true },
    { id: "appointment", label: "Set your appointment date", todo: "Add the date", done: Boolean(path.appointment), optional: true },
  ];

  const nudges: Nudge[] = [];
  const takesMedicines = path.treatments.some((t) => t.facts.hasInteractions && (t.facts.kind === "medication" || t.facts.kind === "supplement"));
  if (takesMedicines && !path.questions.includes(LIST_MEDICINES_QUESTION)) {
    nudges.push({ id: "list-medicines", text: "Prescribers will ask what else you take. Add it to your questions?", question: LIST_MEDICINES_QUESTION });
  }
  if (path.treatments.length >= 2) {
    nudges.push({
      id: "compare-treatments",
      text: `See ${path.treatments[0].name.replace(/\s*\(.*\)$/, "")} and ${path.treatments[1].name.replace(/\s*\(.*\)$/, "")} side by side`,
      href: `/treatments/compare?items=${path.treatments.slice(0, 4).map((t) => t.slug).join(",")}`,
    });
  }
  if (path.apps.length >= 2) {
    nudges.push({ id: "compare-apps", text: `Compare ${path.apps[0].name} and ${path.apps[1].name}`, href: `/tools/for-patients/compare/${path.apps[0].slug}-vs-${path.apps[1].slug}` });
  }

  const required = steps.filter((s) => !s.optional);
  const next = required.find((s) => !s.done) ?? steps.find((s) => !s.done) ?? null;
  const days = path.appointment ? daysUntil(path.appointment, todayIso) : null;

  return {
    steps,
    done: steps.filter((s) => s.done).length,
    total: steps.length,
    ready: required.every((s) => s.done),
    next,
    missingDurations,
    nudges,
    daysToAppointment: days !== null && days >= 0 ? days : null,
  };
}
