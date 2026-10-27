/**
 * Treatment experience model
 *
 * Turns a TreatmentV3 record into what the interactive treatment page shows.
 * Pure: no React, no I/O. Everything here comes from the record; nothing is
 * inferred or invented, and anything the record does not say is left out
 * rather than filled with a placeholder.
 */

import { resolveConditionSlug } from "@/lib/conditions/condition-aliases";
import type { TreatmentV3 } from "@/lib/schemas/treatment-v3";

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
  /** The boxed warning in plain words (the official text stays in boxedWarning). */
  boxedWarningPlain: string | null;
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
/** Pharmacology, not what a person notices. */
const PK_CLAUSE = /steady[- ]state|half-life|plasma|\bpeaks?\b|pharmacokinetic|absorb|absorption|t\s?max|cmax|biologic|side effects?/i;
/** Placeholder text that should never reach a page. */
const EMPTY_CLAUSE = /not applicable|not established|provided notes|^unknown$|^varies$|^n\/a$/i;
/** Words that say when people feel a difference. */
const BENEFIT_CLAUSE = /benefit|improve|better|response|relief|symptom|mood|anxiety|feel|notice|calm|wake|drows|sedat|appetite|craving|effect/i;

/**
 * One clause for the "Starts working" tile: when people feel a difference.
 * Records often open with pharmacology ("Biologic steady state reached in
 * about 1 week; clinical benefits emerge over 2–6 weeks"), which would tell a
 * patient Lexapro works in a week. Prefer the clause about benefit, skip
 * pharmacokinetic ones, and capitalise what is left.
 */
export function onsetSummary(display: string | undefined): string | null {
  if (!display) return null;
  const clauses = display
    .split(/;|\. (?=[A-Z])/)
    .map((c) => c.replace(/\s*\(\[[^\]]*\]\[\d+\]\)/g, "").trim().replace(/\.$/, ""))
    .filter(Boolean);
  const plain = clauses.filter((c) => !PK_CLAUSE.test(c) && !EMPTY_CLAUSE.test(c));
  const pick = plain.find((c) => BENEFIT_CLAUSE.test(c)) ?? plain[0];
  if (!pick) return null;
  return pick.charAt(0).toUpperCase() + pick.slice(1);
}

/** Text records use to say there is no boxed warning. */
const NO_BOXED = /^\s*(not applicable|none\b|n\/a\b|no (formal |official )?(us |fda |u\.s\. )*(boxed|black[- ]box)|there is no (formal |official )?(us |fda )*(boxed|black[- ]box))|does not carry an official/i;

function boxed(warning: string | string[] | undefined): string | null {
  if (!warning) return null;
  const text = (Array.isArray(warning) ? warning.join(" ") : warning).trim();
  // ~40 records say "Not applicable for this medication." here, which the
  // page used to show as "Boxed warning: Not applicable…".
  if (!text || NO_BOXED.test(text)) return null;
  return text;
}

/**
 * A boxed warning in plain words for the "Know first" tile. FDA wording is
 * written for prescribers ("Closely monitor all antidepressant-treated
 * patients…"); these say what it means for the person taking it. Each rule
 * matches the standard class warning; anything else falls back to the
 * record's own first sentence.
 */
export function plainBoxedWarning(text: string, name = ""): string {
  const t = text.toLowerCase();
  const drug = name.toLowerCase();
  if (/neutropenia|neutrophil/.test(t))
    return "Can drop white blood cells dangerously low, so regular blood tests are required.";
  if (/buprenorphine|methadone/.test(drug) && /opioid/.test(t))
    return "Carries opioid risks: misuse, overdose and dangerously slowed breathing, especially with alcohol, benzodiazepines or other sedatives.";
  if (/suicid/.test(t)) {
    // Antidepressants: under 25. ADHD non-stimulants: children and teens.
    const who = /atomoxetine|viloxazine/.test(drug) || /adhd/.test(t) ? "children and teens" : "people under 25";
    return `In ${who}, it can raise suicidal thoughts, mostly in the first months or after a dose change. Tell someone right away if that happens.`;
  }
  if (/dementia/.test(t) && /psychosis|behavior/.test(t))
    return "Raises the risk of death in older adults with dementia-related psychosis. It is not approved for that.";
  if (/complex sleep behavio|sleep-?walking|sleep-?driving/.test(t))
    return "Can cause sleep-walking, sleep-driving and other actions while not fully awake. Stop it and tell your prescriber if that happens.";
  if (/opioid/.test(t) && (/benzodiazep|phenobarbital|barbiturate/.test(t) || /azepam|zolam|clobazam|clorazepate|chlordiazepoxide/.test(drug)))
    return "Taking it with opioids, alcohol or other sedatives can slow breathing dangerously. Stop it gradually, with your prescriber, rather than all at once.";
  if (/abuse|misuse/.test(t) && /stimulant|amphetamine|methylphenidate/.test(t))
    return "Can be misused and lead to addiction. Take it only as prescribed and keep it somewhere secure.";
  if (/opioid/.test(t) && /addiction|abuse|misuse|overdose/.test(t))
    return "Carries opioid risks: misuse, overdose and dangerously slowed breathing, especially with alcohol or sedatives.";
  if (/stevens|epidermal necrolysis|serious rash/.test(t))
    return "Can cause a rare but serious skin reaction. Call your prescriber about any new rash, especially in the first two months.";
  if (/hepatotoxic|liver/.test(t))
    return /pregnan|fetal|birth defect|teratogen/.test(t)
      ? "Can cause serious liver damage and harm a developing baby. Regular blood tests are needed."
      : "Can cause serious liver damage. Regular blood tests are needed.";
  if (/qt|torsade/.test(t))
    return "Can cause a dangerous heart-rhythm problem. An ECG may be needed before and during treatment.";
  if (/respiratory depression|breathing/.test(t) && /oxybate|cns depressant|central nervous system depressant/.test(t))
    return "Can slow breathing dangerously, especially with alcohol or sedatives. It is only available through a restricted program.";
  if (/driv/.test(t) && /impair/.test(t))
    return "Impairs driving. Do not drive or do other risky activities for at least 12 hours after a dose.";
  if (/visual field|\bvision\b/.test(t))
    return "Can cause permanent loss of side vision, so regular eye exams are required.";
  if (/younger than 2|under 2 years/.test(t))
    return "Not for children under 2: it can slow their breathing dangerously.";
  if (/continuous monitoring|continuously monitor|hospital/.test(t) && /administ/.test(t))
    return "Given only in hospitals or clinics that can monitor breathing continuously.";
  if (/lactic acidosis/.test(t))
    return "Rarely causes lactic acidosis, a dangerous build-up of acid in the blood.";
  if (/sedation|loss of consciousness/.test(t) && /infusion|administration/.test(t))
    return "Can cause heavy sedation or passing out, so it is given only where you can be monitored.";
  return firstSentence(text.replace(/^\[?[^\]:]*boxed warning\]?:\s*/i, ""), 140) ?? text;
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
      // "insomnia" → insomnia-disorder, so the use links to its page.
      slug: resolveConditionSlug(c.condition_slug) ?? c.condition_slug,
      name: c.condition_name ?? c.condition_slug,
      context: c.context ?? null,
      fdaApproved: Boolean(c.fda_approved),
      offLabel: c.offLabel,
      hasPage: resolveConditionSlug(c.condition_slug) !== null,
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
      value: `Boxed warning: ${plainBoxedWarning(boxedWarning, treatment.identity?.name)}`,
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
    boxedWarningPlain: boxedWarning ? plainBoxedWarning(boxedWarning, treatment.identity?.name) : null,
    feel: feelJourney((treatment as { sections?: unknown }).sections),
  };
}
