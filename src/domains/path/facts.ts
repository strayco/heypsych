/**
 * Your Path — facts from reviewed records
 *
 * Pure functions that reduce a condition or treatment record to the few facts
 * the appointment brief uses. Called on the server when a page renders; the
 * result is handed to the "Save to your path" button and kept with the item.
 *
 * Every fact comes from the record. Anything the record does not say is left
 * empty rather than filled in, and nothing here infers a diagnosis.
 */

import type { TreatmentV3 } from "@/lib/schemas/treatment-v3";
import {
  buildTreatmentExperience,
  firstSentence,
  onsetSummary,
} from "@/domains/treatments/experience/model";
import type { ConditionFacts, TreatmentFacts } from "./types";

// ---------------------------------------------------------------------------
// Small readers. Condition records vary in shape, so each reader accepts what
// it finds and ignores anything else.
// ---------------------------------------------------------------------------

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.replace(/\s+/g, " ").trim() : null;
}

function obj(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

/** A list of names from strings or objects with a name-like field. */
function names(value: unknown, keys: string[]): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item;
      const o = obj(item);
      if (!o) return null;
      for (const key of keys) {
        const v = str(o[key]);
        if (v) return v;
      }
      return null;
    })
    .filter((v): v is string => Boolean(v && v.trim()))
    .map((v) => v.trim());
}

/**
 * "Generalized Anxiety Disorder-7 (GAD-7), to check for other anxiety" →
 * "Generalized Anxiety Disorder-7 (GAD-7)". Keeps the name, drops the gloss.
 */
export function measureName(text: string): string {
  const cut = text.split(/,\s|;\s|\s[-–—]\s|:\s/)[0] ?? text;
  return cut.trim().replace(/\.$/, "");
}

/** Unique, case-insensitive, in order. */
function unique(list: string[]): string[] {
  const seen = new Set<string>();
  return list.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const APPROACH_LABELS: Record<string, string> = {
  psychotherapy: "Therapy",
  psychological: "Therapy",
  psychosocial: "Therapy",
  therapy: "Therapy",
  medications: "Medications",
  medication: "Medications",
  pharmacotherapy: "Medications",
  pharmacological: "Medications",
  lifestyle_interventions: "Lifestyle changes",
  lifestyle: "Lifestyle changes",
  neuromodulation: "Brain stimulation",
  interventional: "Procedures",
  support: "Support services",
  family: "Family support",
  educational: "Education and skills",
};

function iso(value: unknown): string | null {
  const s = str(value);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : s.slice(0, 10);
}

// ---------------------------------------------------------------------------
// Conditions
// ---------------------------------------------------------------------------

/**
 * Facts for a condition record. `content` is the record's `content` object and
 * `editorial` its `editorial` block, both as stored.
 */
export function conditionFacts(content: Record<string, unknown>, editorial?: unknown): ConditionFacts {
  const aeo = obj(content.aeo);
  const description = content.description;
  const whatItIs =
    firstSentence(str(aeo?.what_is), 220) ??
    firstSentence(typeof description === "string" ? description : str(obj(description)?.overview), 220);

  const evaluation = obj(content.evaluation);
  let evaluationText: string | null = null;
  let measures: string[] = [];
  if (evaluation) {
    const preferred = ["medical_assessment", "medical_workup", "physical_exam", "clinical_interview", "history_psychosocial", "history"];
    for (const key of preferred) {
      const text = str(evaluation[key]);
      if (text) {
        evaluationText = firstSentence(text, 220);
        break;
      }
    }
    for (const key of ["rating_scales", "standardized_measures", "standardized_tools"]) {
      const list = names(evaluation[key], ["name", "measure", "tool", "scale"]);
      if (list.length > 0) {
        measures = unique(list.map(measureName)).slice(0, 3);
        break;
      }
    }
  }

  const misdiagnosis = obj(content.misdiagnosis_explained);
  const alsoConsidered = unique(names(misdiagnosis?.commonly_confused_with, ["condition", "name"])).slice(0, 3);

  const approachesBlock = obj(content.treatment_approaches);
  const approaches = approachesBlock
    ? unique(
        Object.entries(approachesBlock)
          .filter(([, v]) => (Array.isArray(v) ? v.length > 0 : Boolean(str(v))))
          .map(([key]) => APPROACH_LABELS[key] ?? key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()))
      ).slice(0, 4)
    : [];

  return {
    whatItIs,
    evaluation: evaluationText,
    measures,
    alsoConsidered,
    approaches,
    whenToSeekHelp: firstSentence(str(content.when_to_seek_help), 260),
    reviewed: iso(obj(editorial)?.lastReviewed),
  };
}

// ---------------------------------------------------------------------------
// Treatments
// ---------------------------------------------------------------------------

/** "Worsening mood and suicidal thoughts: especially …" → "Worsening mood and suicidal thoughts". */
export function monitoringLabel(parameter: string): string {
  const head = parameter.split(/[:—(]/)[0] ?? parameter;
  const trimmed = head.replace(/\s+/g, " ").trim().replace(/[.,;]$/, "");
  return trimmed.length > 80 ? `${trimmed.slice(0, 79).trimEnd()}…` : trimmed;
}

/** First clause of a display string such as "Typically 20 sessions …; Often 40 …". */
function firstClause(text: string | null | undefined, max = 140): string | null {
  const s = str(text);
  if (!s) return null;
  const clause = (s.split(/;\s/)[0] ?? s).trim().replace(/\.$/, "");
  return clause.length > max ? `${clause.slice(0, max - 1).trimEnd()}…` : clause;
}

export function treatmentFacts(treatment: TreatmentV3): TreatmentFacts {
  const x = buildTreatmentExperience(treatment);
  const profile = treatment.clinical_profile ?? {};
  const safety = profile.safety ?? {};
  const access = profile.access ?? {};
  const delivery = profile.delivery ?? {};
  const experience = (profile as { experience?: Record<string, unknown> }).experience ?? {};
  const onsetBlock = obj(experience.onset);
  const durationBlock = obj(experience.duration);

  const onset =
    onsetSummary(str(obj(onsetBlock?.therapeutic_response)?.display) ?? undefined) ??
    onsetSummary(str(obj(onsetBlock?.initial_effects)?.display) ?? undefined);

  const course = x.object === "medication" ? null : firstClause(str(obj(durationBlock?.typical_course)?.display));
  const session = x.object === "medication" ? null : firstClause(str(obj(delivery.session_duration)?.display), 60);

  const controlled = access.controlled_substance?.is_controlled
    ? access.controlled_substance.schedule ?? "Controlled"
    : null;

  const special = safety.special_populations ?? {};

  return {
    kind: x.object,
    drugClass: x.kind,
    whatItIs: firstSentence(x.lede, 220),
    onset,
    course,
    session,
    formats: x.object === "medication" ? [] : unique((delivery.format ?? []).map((f) => f.replace(/\s*\(.*\)$/, "").trim())).slice(0, 3),
    boxedWarning: x.boxedWarningPlain,
    sideEffects: unique(x.sideEffects.map((s) => s.effect.replace(/\s*\(.*\)$/, "").trim())).slice(0, 3),
    monitoring: unique((safety.monitoring_requirements ?? []).map((m) => monitoringLabel(m.parameter))).filter(Boolean).slice(0, 3),
    hasInteractions: (safety.interactions ?? []).length > 0,
    controlled,
    notControlled: access.controlled_substance?.is_controlled === false && !controlled,
    prescription: typeof access.prescription_required === "boolean" ? access.prescription_required : null,
    hasPregnancyGuidance: Boolean(str(special.pregnancy) || str(special.lactation)),
    usedFor: unique(x.uses.filter((u) => !u.offLabel).map((u) => u.name)).slice(0, 3),
    usedForSlugs: unique(x.uses.filter((u) => u.hasPage).map((u) => u.slug)).slice(0, 8),
    reviewed: iso(treatment.editorial?.lastReviewed),
  };
}
