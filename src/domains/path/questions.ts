/**
 * Your Path — questions to ask
 *
 * Deterministic question templates. Each question is shown with the fact from
 * HeyPsych's reviewed guide that prompted it, so the visitor can see why it is
 * there and the clinician can see what the visitor read.
 *
 * These are questions, never answers or advice: nothing here tells anyone to
 * start, stop or change a treatment. Wording requires clinical review before
 * any change (see docs/active/contracts/PATIENT_PILOT_CONTRACT.md).
 */

import type { ConditionFacts, TreatmentFacts } from "./types";

export interface BriefQuestion {
  /** The question, in the visitor's voice. */
  text: string;
  /** What in the guide prompted it, or null for a question every visit should cover. */
  basis: string | null;
}

/** Version of the templates below. Bump when wording or rules change. */
export const QUESTIONS_VERSION = "1.0.0";

const MAX_PER_ITEM = 4;

function list(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/**
 * Lower-case a list item for use mid-sentence without breaking acronyms or
 * names: "Dry Mouth" → "dry mouth", "GI upset" stays, "PHQ-9" stays.
 */
export function lower(text: string): string {
  return text
    .split(/(\s+|\/)/)
    .map((word) => (/^[A-Z][a-z'’-]+$/.test(word) ? word.toLowerCase() : word))
    .join("");
}

export function conditionQuestions(name: string, f: ConditionFacts): BriefQuestion[] {
  const out: BriefQuestion[] = [];

  if (f.evaluation || f.measures.length > 0) {
    const parts = [
      f.evaluation,
      f.measures.length > 0 ? `Questionnaires sometimes used: ${list(f.measures)}.` : null,
    ].filter(Boolean);
    out.push({ text: "What would an evaluation involve for me?", basis: parts.join(" ") });
  }

  if (f.alsoConsidered.length > 0) {
    out.push({
      text: `Could something other than ${lower(name)} explain what I'm going through?`,
      basis: `It can be confused with ${list(f.alsoConsidered.map(lower))}.`,
    });
  } else {
    out.push({ text: `Could something other than ${lower(name)} explain what I'm going through?`, basis: null });
  }

  if (f.approaches.length > 0) {
    out.push({
      text: "Which treatment options would you suggest for me, and why that one first?",
      basis: `Usual approaches: ${list(f.approaches.map(lower))}.`,
    });
  }

  return out.slice(0, MAX_PER_ITEM);
}

export function treatmentQuestions(name: string, f: TreatmentFacts): BriefQuestion[] {
  const out: BriefQuestion[] = [];
  const short = name.replace(/\s*\(.*\)$/, "");

  if (f.boxedWarning) {
    out.push({
      text: `${short} has a boxed warning on its label. What does that mean for me?`,
      basis: f.boxedWarning,
    });
  }

  if (f.kind === "medication") {
    out.push({
      text: "When would I expect to notice a difference, and what should I do if I don't?",
      basis: f.onset,
    });
    if (f.controlled) {
      out.push({
        text: "How do refills work for a controlled medicine, and is there a risk of dependence?",
        basis: `${f.controlled === "Controlled" ? "It is a controlled substance" : `It is a ${f.controlled} controlled substance`}.`,
      });
    }
    if (f.sideEffects.length > 0) {
      out.push({
        text: "Which side effects are most likely, and which ones should I call you about?",
        basis: `Most often reported: ${list(f.sideEffects.map(lower))}.`,
      });
    }
    if (f.monitoring.length > 0) {
      out.push({
        text: "What will we keep an eye on, and how often will we check in?",
        basis: `Things prescribers monitor: ${list(f.monitoring.map(lower))}.`,
      });
    }
    if (f.hasInteractions) {
      out.push({
        text: `I'll list everything I take, including supplements. Does anything clash with ${short}?`,
        basis: "Our guide lists interactions to check.",
      });
    }
    out.push({ text: "How long would I usually stay on it, and how would we stop safely?", basis: null });
  } else if (f.kind === "therapy") {
    out.push({
      text: "How many sessions would we plan for, and how will we know it's working?",
      basis: f.course ? `Typical course: ${lower(f.course)}.` : null,
    });
    if (f.formats.length > 0 || f.session) {
      const bits = [f.formats.length > 0 ? `Formats: ${list(f.formats)}.` : null, f.session ? `Sessions: ${f.session}.` : null];
      out.push({ text: "Can we meet online, and what does a session look like?", basis: bits.filter(Boolean).join(" ") });
    }
    out.push({ text: `What training or experience do you have with ${short}?`, basis: null });
  } else if (f.kind === "supplement") {
    out.push({
      text: `Is ${short} safe alongside my other medicines?`,
      basis: f.hasInteractions ? "Our guide lists interactions to check." : null,
    });
    if (f.sideEffects.length > 0) {
      out.push({
        text: "What side effects should I look out for?",
        basis: `Most often reported: ${list(f.sideEffects.map(lower))}.`,
      });
    }
    out.push({ text: `Is the evidence for ${short} good enough for what I'm dealing with?`, basis: null });
  } else {
    out.push({
      text: "What does a course involve, and how many sessions or treatments is typical?",
      basis: [f.course ? `Typical course: ${lower(f.course)}.` : null, f.session ? `Sessions: ${f.session}.` : null].filter(Boolean).join(" ") || null,
    });
    if (f.sideEffects.length > 0) {
      out.push({
        text: "Which side effects are most likely, and how are they handled?",
        basis: `Most often reported: ${list(f.sideEffects.map(lower))}.`,
      });
    }
    out.push({ text: "Would I need to try other treatments first, and does insurance usually cover it?", basis: null });
  }

  if (f.hasPregnancyGuidance && f.kind !== "therapy") {
    out.push({ text: "If I'm pregnant, planning to be, or breastfeeding, what changes?", basis: "Our guide has specific guidance for pregnancy." });
  }

  // Boxed warning, then the kind-specific core, capped.
  return out.slice(0, MAX_PER_ITEM);
}
