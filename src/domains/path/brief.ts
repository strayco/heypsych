/**
 * Your Path — the appointment brief
 *
 * Turns a visitor's path into a one-page brief to bring to a first
 * appointment: what they have noticed and for how long, what they have tried,
 * what they are reading about and considering, the kind of help they are
 * looking for, and the questions worth asking — each question with the fact
 * from the reviewed guide that prompted it.
 *
 * Pure and deterministic: the same path always produces the same brief. It
 * never ranks conditions, never suggests a diagnosis, and never recommends a
 * treatment; it organises what the visitor chose to keep.
 */

import { CRISIS_RESOURCES } from "@/domains/patient-support/paths";
import { conditionQuestions, treatmentQuestions, QUESTIONS_VERSION, type BriefQuestion } from "./questions";
import { DURATION_LABELS, GOAL_LABELS, NOTICED_DURATION_LABELS, PAY_LABELS, PRIOR_LABELS } from "./journey";
import { PATH_LIMITS, type PathSnapshot, type SymptomRef, type TreatmentKind } from "./types";

export const BRIEF_VERSION = `brief-1.0.0+q${QUESTIONS_VERSION}`;

export interface BriefSection<T> {
  id: string;
  title: string;
  items: T[];
}

export interface BriefNoticed {
  name: string;
  duration: string | null;
}

export interface BriefTopic {
  name: string;
  kind: "condition" | TreatmentKind;
  /** e.g. "SSRI" or "Medication". */
  label: string;
  questions: BriefQuestion[];
  /** "Reviewed November 24, 2025" or null. */
  provenance: string | null;
}

export interface Brief {
  version: string;
  isEmpty: boolean;
  lookingFor: {
    path: string;
    firstStep: string;
    details: string[];
  } | null;
  noticed: BriefNoticed[];
  /** Other things the symptom guides say can cause what was noticed. */
  alsoCheck: string[];
  /** When the symptom guides say to get help sooner. */
  sooner: string[];
  tried: string[];
  reading: BriefTopic[];
  considering: BriefTopic[];
  apps: string[];
  ownQuestions: string[];
  crisis: string;
  disclaimer: string;
}

const KIND_LABEL: Record<TreatmentKind, string> = {
  medication: "Medication",
  therapy: "Therapy",
  supplement: "Supplement",
  procedure: "Procedure",
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
}

function uniqueCaseless(list: string[], max: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of list) {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item.trim());
    if (out.length >= max) break;
  }
  return out;
}

/** Statements in the symptom guides about crisis are covered by the crisis line on every brief. */
const CRISIS_LINE = /self-harm|suicid|harming yourself|hurting yourself/i;

export function buildBrief(path: PathSnapshot, refs: SymptomRef[]): Brief {
  const bySlug = new Map(refs.map((r) => [r.slug, r]));

  const noticed: BriefNoticed[] = path.noticed.map((n) => ({
    name: bySlug.get(n.slug)?.name ?? n.name,
    duration: n.duration ? NOTICED_DURATION_LABELS[n.duration] : null,
  }));

  const noticedRefs = path.noticed.map((n) => bySlug.get(n.slug)).filter((r): r is SymptomRef => Boolean(r));
  const alsoCheck = uniqueCaseless(noticedRefs.flatMap((r) => r.alsoCausedBy), 5);
  const sooner = uniqueCaseless(
    noticedRefs.flatMap((r) => r.seekHelpWhen).filter((s) => !CRISIS_LINE.test(s)),
    4
  );

  const tried = uniqueCaseless(path.tried.flatMap((t) => t.items), 8);

  const reading: BriefTopic[] = path.conditions.slice(0, PATH_LIMITS.conditions).map((c) => ({
    name: c.name,
    kind: "condition",
    label: "Reading about",
    questions: conditionQuestions(c.name, c.facts),
    provenance: formatDate(c.facts.reviewed) ? `HeyPsych guide, reviewed ${formatDate(c.facts.reviewed)}` : "HeyPsych guide",
  }));

  const considering: BriefTopic[] = path.treatments.slice(0, PATH_LIMITS.treatments).map((t) => ({
    name: t.name,
    kind: t.facts.kind,
    label: t.facts.drugClass ? `${KIND_LABEL[t.facts.kind]} · ${t.facts.drugClass}` : KIND_LABEL[t.facts.kind],
    questions: treatmentQuestions(t.name, t.facts),
    provenance: formatDate(t.facts.reviewed) ? `HeyPsych guide, reviewed ${formatDate(t.facts.reviewed)}` : "HeyPsych guide",
  }));

  let lookingFor: Brief["lookingFor"] = null;
  if (path.nextStep) {
    const a = path.nextStep.answers;
    const details = [
      a.goals.length > 0
        ? `Hoping to: ${a.goals
            .filter((g): g is keyof typeof GOAL_LABELS => g in GOAL_LABELS)
            .map((g) => GOAL_LABELS[g].charAt(0).toLowerCase() + GOAL_LABELS[g].slice(1))
            .join("; ")}`
        : null,
      a.duration ? `Affecting daily life: ${DURATION_LABELS[a.duration].toLowerCase()}` : null,
      a.priorSupport ? `Before: ${PRIOR_LABELS[a.priorSupport].charAt(0).toLowerCase() + PRIOR_LABELS[a.priorSupport].slice(1)}` : null,
      a.insurancePreference ? `Paying: ${PAY_LABELS[a.insurancePreference].toLowerCase()}` : null,
    ].filter((d): d is string => Boolean(d));
    lookingFor = { path: path.nextStep.pathName, firstStep: path.nextStep.typicalFirst, details };
  }

  const ownQuestions = path.questions
    .map((q) => q.trim().slice(0, PATH_LIMITS.questionLength))
    .filter(Boolean)
    .slice(0, PATH_LIMITS.questions);

  const crisis = CRISIS_RESOURCES.map((r) =>
    r.phone ? `${r.name}: call ${r.phone}${r.phone === "988" ? " (call or text)" : ""}` : `${r.name}: text ${r.text}`
  ).join(" · ");

  const isEmpty =
    noticed.length === 0 &&
    tried.length === 0 &&
    reading.length === 0 &&
    considering.length === 0 &&
    path.apps.length === 0 &&
    ownQuestions.length === 0 &&
    !lookingFor;

  return {
    version: BRIEF_VERSION,
    isEmpty,
    lookingFor,
    noticed,
    alsoCheck,
    sooner,
    tried,
    reading,
    considering,
    apps: path.apps.map((a) => a.name),
    ownQuestions,
    crisis: `If you're in crisis or thinking about harming yourself: ${crisis}. In an emergency, call 911.`,
    disclaimer:
      "Prepared by the visitor with HeyPsych to organise their own notes. It is not a diagnosis or a medical recommendation. Questions come from HeyPsych's reviewed guides; facts may have changed since the review date shown.",
  };
}

/** The brief as plain text, for copying into an email, a portal message or notes app. */
export function briefToText(brief: Brief): string {
  const lines: string[] = ["MY APPOINTMENT NOTES", ""];
  const section = (title: string) => {
    lines.push(title.toUpperCase());
  };

  if (brief.lookingFor) {
    section("What I'm looking for");
    lines.push(`- ${brief.lookingFor.path}`);
    brief.lookingFor.details.forEach((d) => lines.push(`- ${d}`));
    lines.push("");
  }
  if (brief.noticed.length > 0) {
    section("What I've noticed");
    brief.noticed.forEach((n) => lines.push(`- ${n.name}${n.duration ? `, ${n.duration}` : ""}`));
    lines.push("");
  }
  if (brief.tried.length > 0) {
    section("What I've tried");
    brief.tried.forEach((t) => lines.push(`- ${t}`));
    lines.push("");
  }
  if (brief.alsoCheck.length > 0) {
    section("Other things that can cause this");
    brief.alsoCheck.forEach((t) => lines.push(`- ${t}`));
    lines.push("");
  }
  const topics = [...brief.reading, ...brief.considering];
  if (topics.length > 0 || brief.ownQuestions.length > 0) {
    section("Questions I'd like to ask");
    brief.ownQuestions.forEach((q) => lines.push(`- ${q}`));
    topics.forEach((t) => {
      lines.push(`${t.name} (${t.label.toLowerCase()})`);
      t.questions.forEach((q) => lines.push(`- ${q.text}${q.basis ? `\n    (${q.basis})` : ""}`));
    });
    lines.push("");
  }
  if (brief.apps.length > 0) {
    section("Apps and services I'm looking at");
    brief.apps.forEach((a) => lines.push(`- ${a}`));
    lines.push("");
  }
  lines.push(brief.crisis, "", brief.disclaimer);
  return lines.join("\n");
}
