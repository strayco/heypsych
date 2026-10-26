/**
 * Treatment experience model
 *
 * Turns a TreatmentV3 record into what the interactive treatment page shows.
 * Pure: no React, no I/O. Everything here comes from the record; nothing is
 * inferred or invented, and anything the record does not say is left out
 * rather than filled with a placeholder.
 */

import type { TreatmentV3 } from "@/lib/schemas/treatment-v3";
import { CONDITION_SLUGS } from "@/lib/entities/entity-slugs.generated";

export type TreatmentObject = "medication" | "supplement" | "therapy" | "procedure";

export interface GlanceTile {
  id: "uses" | "onset" | "know";
  label: string;
  value: string;
  /** Section the tile jumps to. */
  href: string;
  tone: "neutral" | "caution";
}

export interface ConditionUse {
  slug: string;
  name: string;
  context: string | null;
  fdaApproved: boolean;
  offLabel: boolean;
  /** Whether /conditions/<slug> exists, so a link never leads to a 404. */
  hasPage: boolean;
}

export interface SideEffect {
  effect: string;
  /** Whole people out of 100, when the record gives a percentage. */
  per100: number | null;
  /** The record's own wording, e.g. "26%" or "Common (rates vary)". */
  incidence: string | null;
  notes: string | null;
}

export interface Situation {
  id: string;
  label: string;
  text: string;
}

export interface Warning {
  /** "Serotonin syndrome" */
  headline: string;
  /** "agitation, confusion, hyperreflexia, … MEDICAL EMERGENCY." */
  detail: string | null;
}

export interface FeelStage {
  id: string;
  /** "Week 1", "Weeks 2–4"; null for a topic rather than a time. */
  when: string | null;
  /** "Side effects before benefits" */
  title: string;
  quotes: string[];
  note: string | null;
}

export interface FeelJourney {
  intro: string | null;
  /** Time-ordered stages: the timeline. */
  stages: FeelStage[];
  /** Everything else people describe: "Sexual side effects (real talk)". */
  topics: FeelStage[];
}

export interface TreatmentExperience {
  name: string;
  object: TreatmentObject;
  /** "SSRI · Antidepressant", from the record's classes. */
  kind: string | null;
  facts: string[];
  lede: string | null;
  glance: GlanceTile[];
  uses: ConditionUse[];
  sideEffects: SideEffect[];
  situations: Situation[];
  warnings: Warning[];
  boxedWarning: string | null;
  feel: FeelJourney | null;
}

// ---------------------------------------------------------------------------

const SITUATION_LABELS: Record<string, string> = {
  pregnancy: "Pregnant or planning",
  lactation: "Breastfeeding",
  pediatric: "Under 18",
  geriatric: "Over 65",
  renal_impairment: "Kidney problems",
  hepatic_impairment: "Liver problems",
};

function objectFor(modality: string | undefined): TreatmentObject {
  switch (modality) {
    case "medication":
      return "medication";
    case "supplement":
    case "alternative":
      return "supplement";
    case "therapy":
      return "therapy";
    default:
      return "procedure";
  }
}

/** First sentence, for tiles and summaries. */
export function firstSentence(text: string | undefined | null, max = 180): string | null {
  if (!text) return null;
  const clean = text.replace(/\s+/g, " ").trim();
  const match = clean.match(/^.+?[.!?](\s|$)/);
  const sentence = (match ? match[0] : clean).trim();
  return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence;
}

/** "26%" → 26, "~10-20%" → 15, "11% (adults)" → 11, "Common" → null. */
export function per100(incidence: string | undefined): number | null {
  if (!incidence) return null;
  const range = incidence.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*%/);
  if (range) return Math.round((Number(range[1]) + Number(range[2])) / 2);
  const single = incidence.match(/(\d+(?:\.\d+)?)\s*%/);
  if (!single) return null;
  const value = Number(single[1]);
  return value > 0 && value <= 100 ? Math.max(1, Math.round(value)) : null;
}

/** "Serotonin syndrome: agitation, …" → { headline: "Serotonin syndrome", detail: "agitation, …" }. */
function splitRisk(risk: string): Warning {
  const at = risk.search(/[:—]/);
  if (at > 0 && at <= 90) {
    const detail = risk.slice(at + 1).trim();
    return { headline: risk.slice(0, at).trim(), detail: detail ? detail.charAt(0).toUpperCase() + detail.slice(1) : null };
  }
  const headline = firstSentence(risk, 90) ?? risk;
  const rest = risk.slice(headline.length).trim();
  return { headline, detail: rest || null };
}

/** The onset display's first clause: "Depression: initial effects may appear within 1–2 weeks". */
function onsetSummary(display: string | undefined): string | null {
  if (!display) return null;
  const clause = display.split(/;|\. /)[0].trim();
  return clause.length > 0 ? clause : null;
}

function boxed(warning: string | string[] | undefined): string | null {
  if (!warning) return null;
  return Array.isArray(warning) ? warning.join(" ") : warning;
}

const TIME_WORDS = /^(?:day|days|week|weeks|month|months|first|after|year|years|session|sessions|hour|hours|minute|minutes|long[- ]term)\b/i;

/**
 * The "What People Feel" section, as a journey: `Week 1: “Side effects before
 * benefits”` becomes { when: "Week 1", title: "Side effects before benefits" }.
 */
export function feelJourney(sections: unknown): FeelJourney | null {
  if (!Array.isArray(sections)) return null;
  const section = sections.find(
    (s): s is { intro?: unknown; items?: unknown } =>
      Boolean(s) && typeof s === "object" && (s as { type?: unknown }).type === "patient_experience"
  );
  const items = Array.isArray(section?.items) ? section!.items : [];
  const parsed: FeelStage[] = items
    .map((item, i) => {
      const it = (item ?? {}) as { category?: unknown; quotes?: unknown; note?: unknown };
      const category = typeof it.category === "string" ? it.category.trim() : "";
      const quotes = Array.isArray(it.quotes) ? it.quotes.filter((q): q is string => typeof q === "string" && q.trim().length > 0) : [];
      if (!category || quotes.length === 0) return null;
      const [head, ...rest] = category.split(":");
      const tail = rest.join(":").trim().replace(/^[“"']|[”"']$/g, "");
      const timed = TIME_WORDS.test(head.trim());
      return {
        id: `feel-${i}`,
        when: timed ? head.trim() : null,
        title: timed ? tail || head.trim() : category.replace(/^[“"']|[”"']$/g, ""),
        quotes,
        note: typeof it.note === "string" && it.note.trim() ? it.note.trim() : null,
      };
    })
    .filter((s): s is FeelStage => s !== null);
  if (parsed.length === 0) return null;
  return {
    intro: typeof section?.intro === "string" ? section.intro : null,
    stages: parsed.filter((s) => s.when !== null),
    topics: parsed.filter((s) => s.when === null),
  };
}

// ---------------------------------------------------------------------------

export function buildTreatmentExperience(treatment: TreatmentV3): TreatmentExperience {
  const profile = treatment.clinical_profile ?? {};
  const safety = profile.safety ?? {};
  const indications = profile.indications ?? {};
  const access = profile.access ?? {};
  const modality = treatment.taxonomy?.modality;

  const uses: ConditionUse[] = [
    ...(indications.primary ?? []).map((c) => ({ ...c, offLabel: false })),
    ...(indications.secondary ?? []).map((c) => ({ ...c, offLabel: false })),
    ...(indications.off_label ?? []).map((c) => ({ ...c, offLabel: true })),
  ]
    .filter((c) => c.condition_slug && c.condition_name)
    .map((c) => ({
      slug: c.condition_slug,
      name: c.condition_name ?? c.condition_slug,
      context: c.context ?? null,
      fdaApproved: Boolean(c.fda_approved),
      offLabel: c.offLabel,
      hasPage: CONDITION_SLUGS.has(c.condition_slug),
    }));

  const sideEffects: SideEffect[] = (safety.common_adverse_effects ?? [])
    .map((s) => ({
      effect: s.effect,
      per100: per100(s.incidence),
      incidence: s.incidence ?? null,
      notes: s.notes ?? null,
    }))
    // Most common first; effects without a rate keep their order at the end.
    .sort((a, b) => (b.per100 ?? -1) - (a.per100 ?? -1));

  const situations: Situation[] = Object.entries(safety.special_populations ?? {})
    .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0)
    .map(([id, text]) => ({ id, label: SITUATION_LABELS[id] ?? id.replace(/_/g, " "), text }));

  const interactions = safety.interactions ?? [];
  if (interactions.length > 0) {
    situations.push({
      id: "interactions",
      label: "On other medicines",
      text: interactions
        .slice(0, 6)
        .map((i) => `${i.interactant}: ${firstSentence(i.mechanism ?? i.action ?? "", 160) ?? ""}`.trim())
        .join("\n"),
    });
  }

  const boxedWarning = boxed(safety.black_box_warning);
  const onset = onsetSummary(profile.experience?.onset?.therapeutic_response?.display)
    ?? onsetSummary(profile.experience?.onset?.initial_effects?.display);

  const glance: GlanceTile[] = [];
  const approved = uses.filter((u) => !u.offLabel);
  if (uses.length > 0) {
    glance.push({
      id: "uses",
      label: "Used for",
      value:
        approved.length > 0
          ? `${approved.slice(0, 2).map((u) => u.name).join(", ")}${uses.length > 2 ? ` and ${uses.length - 2} more` : ""}`
          : uses.slice(0, 2).map((u) => u.name).join(", "),
      href: "#uses",
      tone: "neutral",
    });
  }
  if (onset) {
    glance.push({ id: "onset", label: "Starts working", value: onset, href: "#full-guide", tone: "neutral" });
  }
  if (boxedWarning) {
    glance.push({
      id: "know",
      label: "Know first",
      value: `Boxed warning: ${firstSentence(boxedWarning, 120)}`,
      href: "#safety",
      tone: "caution",
    });
  } else if (sideEffects[0]) {
    glance.push({
      id: "know",
      label: "Most common side effect",
      value: sideEffects[0].per100 ? `${sideEffects[0].effect}, about ${sideEffects[0].per100} in 100` : sideEffects[0].effect,
      href: "#side-effects",
      tone: "neutral",
    });
  }

  const facts = [
    access.generic_available ? "Generic available" : null,
    access.prescription_required ? "Prescription" : access.prescription_required === false ? "Over the counter" : null,
    access.controlled_substance?.is_controlled
      ? access.controlled_substance.schedule
        ? `Controlled (${access.controlled_substance.schedule})`
        : "Controlled substance"
      : null,
    access.fda_approval_year ? `FDA approved ${access.fda_approval_year}` : null,
  ].filter((f): f is string => Boolean(f));

  return {
    name: treatment.identity?.name ?? treatment.identity?.slug ?? "",
    object: objectFor(modality),
    // "Selective Serotonin Reuptake Inhibitor (SSRI)" reads as "SSRI".
    kind:
      treatment.taxonomy?.drug_classes
        ?.slice(0, 2)
        .map((c) => c.match(/\(([^)]+)\)/)?.[1] ?? c.trim())
        .join(" · ") || null,
    facts,
    lede: treatment.patient_summary ?? treatment.summary ?? null,
    glance,
    uses,
    sideEffects,
    situations,
    warnings: (safety.serious_risks ?? []).map((r) => splitRisk(r.risk)).slice(0, 6),
    boxedWarning,
    feel: feelJourney((treatment as { sections?: unknown }).sections),
  };
}
