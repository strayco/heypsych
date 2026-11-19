/**
 * Your Path — the stored document
 *
 * Pure parsing and update functions for the `hp:path` value. Storage access
 * lives in the client store (src/components/path/store.ts); these functions
 * are separated so every rule about what is kept can be tested directly.
 *
 * Parsing is forgiving: one malformed item costs that item, never the whole
 * path (the same rule Architect persistence follows).
 */

import {
  PATH_LIMITS,
  PATH_VERSION,
  type PathCondition,
  type PathDocument,
  type PathNextStep,
  type PathNoticed,
  type PathTreatment,
  type PathApp,
  type PathTried,
  type NoticedDuration,
} from "./types";

export const EMPTY_PATH: PathDocument = { v: PATH_VERSION, conditions: [], treatments: [], nextStep: null, questions: [], appointment: null };

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const SLUG = /^[a-z0-9][a-z0-9-]{0,120}$/;

function isObj(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

function strings(v: unknown, max = 12): string[] {
  return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string").slice(0, max) : [];
}

function validItem(v: unknown): v is { slug: string; name: string; savedAt: number; facts: Record<string, unknown> } {
  return (
    isObj(v) &&
    typeof v.slug === "string" &&
    SLUG.test(v.slug) &&
    typeof v.name === "string" &&
    v.name.length > 0 &&
    typeof v.savedAt === "number" &&
    isObj(v.facts)
  );
}

function conditionFrom(v: unknown): PathCondition | null {
  if (!validItem(v)) return null;
  const f = v.facts;
  return {
    slug: v.slug,
    name: v.name,
    savedAt: v.savedAt,
    facts: {
      whatItIs: typeof f.whatItIs === "string" ? f.whatItIs : null,
      evaluation: typeof f.evaluation === "string" ? f.evaluation : null,
      measures: strings(f.measures, 3),
      alsoConsidered: strings(f.alsoConsidered, 3),
      approaches: strings(f.approaches, 4),
      whenToSeekHelp: typeof f.whenToSeekHelp === "string" ? f.whenToSeekHelp : null,
      reviewed: typeof f.reviewed === "string" ? f.reviewed : null,
    },
  };
}

const KINDS = new Set(["medication", "supplement", "therapy", "procedure"]);

function treatmentFrom(v: unknown): PathTreatment | null {
  if (!validItem(v)) return null;
  const f = v.facts;
  if (typeof f.kind !== "string" || !KINDS.has(f.kind)) return null;
  const s = (k: string) => (typeof f[k] === "string" ? (f[k] as string) : null);
  return {
    slug: v.slug,
    name: v.name,
    savedAt: v.savedAt,
    facts: {
      kind: f.kind as PathTreatment["facts"]["kind"],
      drugClass: s("drugClass"),
      whatItIs: s("whatItIs"),
      onset: s("onset"),
      course: s("course"),
      session: s("session"),
      formats: strings(f.formats, 3),
      boxedWarning: s("boxedWarning"),
      sideEffects: strings(f.sideEffects, 3),
      monitoring: strings(f.monitoring, 3),
      hasInteractions: f.hasInteractions === true,
      controlled: s("controlled"),
      notControlled: f.notControlled === true,
      prescription: typeof f.prescription === "boolean" ? f.prescription : null,
      hasPregnancyGuidance: f.hasPregnancyGuidance === true,
      usedFor: strings(f.usedFor, 3),
      usedForSlugs: strings(f.usedForSlugs, 8).filter((x) => SLUG.test(x)),
      reviewed: s("reviewed"),
    },
  };
}

function nextStepFrom(v: unknown): PathNextStep | null {
  if (!isObj(v) || typeof v.pathId !== "string" || typeof v.pathName !== "string" || !isObj(v.answers)) return null;
  const a = v.answers;
  return {
    savedAt: typeof v.savedAt === "number" ? v.savedAt : 0,
    pathId: v.pathId as PathNextStep["pathId"],
    pathName: v.pathName,
    typicalFirst: typeof v.typicalFirst === "string" ? v.typicalFirst : "",
    whyThisFits: strings(v.whyThisFits, 6),
    alternatives: Array.isArray(v.alternatives)
      ? v.alternatives
          .filter((x): x is { id: string; name: string } => isObj(x) && typeof x.id === "string" && typeof x.name === "string")
          .map((x) => ({ id: x.id as PathNextStep["pathId"], name: x.name }))
          .slice(0, 4)
      : [],
    confidence: (typeof v.confidence === "string" ? v.confidence : "needs-exploration") as PathNextStep["confidence"],
    missingInfo: strings(v.missingInfo, 6),
    answers: {
      primaryConcerns: strings(a.primaryConcerns, 3) as PathNextStep["answers"]["primaryConcerns"],
      goals: strings(a.goals, 6) as PathNextStep["answers"]["goals"],
      duration: typeof a.duration === "string" ? (a.duration as PathNextStep["answers"]["duration"]) : undefined,
      priorSupport: typeof a.priorSupport === "string" ? (a.priorSupport as PathNextStep["answers"]["priorSupport"]) : undefined,
      insurancePreference:
        typeof a.insurancePreference === "string" ? (a.insurancePreference as PathNextStep["answers"]["insurancePreference"]) : undefined,
    },
    versions: isObj(v.versions)
      ? { definition: String(v.versions.definition ?? ""), evaluator: String(v.versions.evaluator ?? "") }
      : { definition: "", evaluator: "" },
    history: Array.isArray(v.history)
      ? v.history
          .filter((h): h is { at: number; from: string; to: string; because: string } => isObj(h) && typeof h.at === "number" && typeof h.from === "string" && typeof h.to === "string" && typeof h.because === "string")
          .slice(0, 10)
      : [],
  };
}

/**
 * Keep a new next step, recording what it replaced and why. The reason is
 * the board's own "changed because" text, kept only in this browser.
 */
export function keepNextStep(doc: PathDocument, next: PathNextStep, because: string | null): PathDocument {
  const prev = doc.nextStep;
  const history = prev?.history ?? [];
  const entry = prev && prev.pathId !== next.pathId ? [{ at: next.savedAt, from: prev.pathName, to: next.pathName, because: because ?? "you changed your answers" }] : [];
  return { ...doc, nextStep: { ...next, history: [...entry, ...history].slice(0, 10) } };
}

function dedupe<T extends { slug: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((i) => (seen.has(i.slug) ? false : (seen.add(i.slug), true)));
}

/** Parse the stored value. Never throws. */
export function parsePath(raw: string | null): PathDocument {
  if (!raw) return { ...EMPTY_PATH };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ...EMPTY_PATH };
  }
  if (!isObj(data)) return { ...EMPTY_PATH };
  return {
    v: PATH_VERSION,
    conditions: dedupe((Array.isArray(data.conditions) ? data.conditions : []).map(conditionFrom).filter((c): c is PathCondition => !!c)).slice(0, PATH_LIMITS.conditions),
    treatments: dedupe((Array.isArray(data.treatments) ? data.treatments : []).map(treatmentFrom).filter((t): t is PathTreatment => !!t)).slice(0, PATH_LIMITS.treatments),
    nextStep: nextStepFrom(data.nextStep),
    questions: strings(data.questions, PATH_LIMITS.questions).map((q) => q.slice(0, PATH_LIMITS.questionLength)),
    appointment: typeof data.appointment === "string" && ISO_DATE.test(data.appointment) ? data.appointment : null,
  };
}

// ---------------------------------------------------------------------------
// Updates. Each returns a new document.
// ---------------------------------------------------------------------------

/** Add or refresh an item; newest first; capped. Refreshing keeps its place and saved date. */
function upsert<T extends { slug: string; savedAt: number }>(list: T[], item: T, max: number): T[] {
  const existing = list.find((i) => i.slug === item.slug);
  if (existing) return list.map((i) => (i.slug === item.slug ? { ...item, savedAt: existing.savedAt } : i));
  return [item, ...list].slice(0, max);
}

export function saveCondition(doc: PathDocument, item: PathCondition): PathDocument {
  return { ...doc, conditions: upsert(doc.conditions, item, PATH_LIMITS.conditions) };
}

export function saveTreatment(doc: PathDocument, item: PathTreatment): PathDocument {
  return { ...doc, treatments: upsert(doc.treatments, item, PATH_LIMITS.treatments) };
}

export function removeItem(doc: PathDocument, kind: "condition" | "treatment", slug: string): PathDocument {
  return kind === "condition"
    ? { ...doc, conditions: doc.conditions.filter((c) => c.slug !== slug) }
    : { ...doc, treatments: doc.treatments.filter((t) => t.slug !== slug) };
}

export function setNextStep(doc: PathDocument, nextStep: PathNextStep | null): PathDocument {
  return { ...doc, nextStep };
}

export function addQuestion(doc: PathDocument, text: string): PathDocument {
  const q = text.replace(/\s+/g, " ").trim().slice(0, PATH_LIMITS.questionLength);
  if (!q || doc.questions.includes(q) || doc.questions.length >= PATH_LIMITS.questions) return doc;
  return { ...doc, questions: [...doc.questions, q] };
}

export function setAppointment(doc: PathDocument, date: string | null): PathDocument {
  return { ...doc, appointment: date && ISO_DATE.test(date) ? date : null };
}

export function removeQuestion(doc: PathDocument, index: number): PathDocument {
  return { ...doc, questions: doc.questions.filter((_, i) => i !== index) };
}

// ---------------------------------------------------------------------------
// The other stores the path reads (written by existing islands)
// ---------------------------------------------------------------------------

const DURATIONS = new Set<NoticedDuration>(["days", "weeks", "months", "years"]);

export function parseNoticed(raw: string | null): PathNoticed[] {
  try {
    const list = JSON.parse(raw ?? "[]");
    if (!Array.isArray(list)) return [];
    return dedupe(
      list
        .filter((n): n is Record<string, unknown> => isObj(n) && typeof n.slug === "string" && typeof n.name === "string")
        .map((n) => ({
          slug: n.slug as string,
          name: n.name as string,
          duration: typeof n.duration === "string" && DURATIONS.has(n.duration as NoticedDuration) ? (n.duration as NoticedDuration) : null,
          addedAt: typeof n.addedAt === "number" ? n.addedAt : undefined,
        }))
    );
  } catch {
    return [];
  }
}

export function parseApps(raw: string | null): PathApp[] {
  try {
    const list = JSON.parse(raw ?? "[]");
    return Array.isArray(list)
      ? dedupe(list.filter((a): a is PathApp => isObj(a) && typeof a.slug === "string" && typeof a.name === "string")).slice(0, 12)
      : [];
  } catch {
    return [];
  }
}

export function parseTried(conditionSlug: string, raw: string | null): PathTried | null {
  try {
    const items = strings(JSON.parse(raw ?? "[]"), 20);
    return items.length > 0 ? { conditionSlug, items } : null;
  } catch {
    return null;
  }
}

/** Number of things in a path, for the header and the homepage. */
export function pathCount(p: { noticed: unknown[]; conditions: unknown[]; treatments: unknown[]; apps: unknown[]; nextStep: unknown }): number {
  return p.noticed.length + p.conditions.length + p.treatments.length + p.apps.length + (p.nextStep ? 1 : 0);
}
