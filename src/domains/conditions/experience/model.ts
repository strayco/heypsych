/**
 * Condition experience model
 *
 * Turns a condition's content (entity.data) into what the interactive
 * condition page shows. Pure. Everything comes from the record; nothing is
 * scored, inferred, or invented. In particular there is no symptom score:
 * a page should help someone recognise what to ask about, not diagnose them.
 */

export interface Frequency {
  /** "children", "adults" */
  group: string;
  percent: number;
  /** Natural frequency: "1 in 20" for small rates, "26 in 100" otherwise. */
  display: string;
  /** Dots to draw and how many are filled. */
  dots: { total: number; filled: number } | null;
}

export interface Group {
  id: string;
  label: string;
  items: string[];
}

export interface ConditionExperience {
  name: string;
  /** The short name people use, when the record has one: "ADHD". */
  shortName: string | null;
  lede: string | null;
  facts: string[];
  glance: { id: string; label: string; value: string; href: string }[];
  frequencies: Frequency[];
  prevalenceText: string | null;
  symptoms: Group[];
  quotes: string[];
  impact: { id: string; label: string; text: string }[];
  approaches: Group[];
  selfHelp: string[];
  warningSigns: string[];
  whenToSeekHelp: string | null;
}

// ---------------------------------------------------------------------------

/** Readable names for the keys records use most. */
const LABELS: Record<string, string> = {
  hyperactivity_impulsivity: "Hyperactivity & impulsivity",
  associated_features: "Also common",
  associated: "Also common",
  core: "Core signs",
  core_features: "Core signs",
  emotional_cognitive: "Emotional & thinking",
  cognitive: "Thinking",
  school_work: "School & work",
  work_school: "School & work",
  quality_of_life: "Quality of life",
  self_esteem: "Self-esteem",
  "self-esteem": "Self-esteem",
  lifestyle_interventions: "Lifestyle",
  lifestyle_strategies: "Lifestyle",
  care_coordination: "Care & support",
  pharmacotherapy: "Medications",
  pharmacological: "Medications",
  medical_management: "Medical care",
  medical_interventions: "Medical care",
  neuromodulation: "Brain stimulation",
  education_and_family: "Education & family",
  use_disorder: "Signs of a use disorder",
};

/** "school_work" → "School & work"; unknown keys read as plain words. */
export function labelFor(key: string): string {
  if (LABELS[key]) return LABELS[key];
  const words = key.replace(/[_-]+/g, " ").replace(/\band\b/g, "&").trim().toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function text(value: unknown): string | null {
  if (typeof value === "string") return value.trim() || null;
  if (value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    for (const key of ["overview", "summary", "text", "description"]) {
      if (typeof v[key] === "string") return (v[key] as string).trim();
    }
  }
  return null;
}

function strings(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item : text(item)))
    .filter((s): s is string => Boolean(s && s.trim()));
}

function groups(value: unknown): Group[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>)
    .map(([id, items]) => ({ id, label: labelFor(id), items: strings(items) }))
    .filter((g) => g.items.length > 0);
}

export function firstSentence(value: string | null | undefined, max = 200): string | null {
  if (!value) return null;
  const clean = value.replace(/\s+/g, " ").trim();
  const match = clean.match(/^.+?[.!?](\s|$)/);
  const sentence = (match ? match[0] : clean).trim();
  return sentence.length > max ? `${sentence.slice(0, max - 1).trimEnd()}…` : sentence;
}

/**
 * "Approximately 5% of children and 2.5% of adults worldwide" →
 * [{ children, 5, "1 in 20" }, { adults, 2.5, "1 in 40" }].
 */
export function frequencies(prevalence: string | null): Frequency[] {
  if (!prevalence) return [];
  const out: Frequency[] = [];
  const re = /(\d+(?:\.\d+)?)\s*%\s+of\s+([a-z][a-z -]*?)(?=\s+(?:and|worldwide|in|globally|will|have|are|experience)\b|[,.;)]|$)/gi;
  for (const match of prevalence.matchAll(re)) {
    const percent = Number(match[1]);
    if (!(percent > 0 && percent <= 100)) continue;
    const group = match[2].trim().replace(/^(the|all)\s+/i, "");
    if (group.split(" ").length > 4) continue;

    const oneIn = 100 / percent;
    const nice = Math.round(oneIn);
    let display: string;
    let dots: Frequency["dots"];
    if (percent < 10 && Math.abs(oneIn - nice) / oneIn < 0.06 && nice <= 200) {
      display = `1 in ${nice}`;
      dots = { total: nice, filled: 1 };
    } else if (Number.isInteger(percent)) {
      display = `${percent} in 100`;
      dots = { total: 100, filled: percent };
    } else {
      display = `${percent} in 100`;
      dots = null;
    }
    out.push({ group, percent, display, dots });
  }
  return out.slice(0, 3);
}

// ---------------------------------------------------------------------------

export function buildConditionExperience(
  name: string,
  content: Record<string, unknown>,
  metadata: Record<string, unknown> = {}
): ConditionExperience {
  const description = text(content.description);
  // Most records keep their one-line definition in aeo.what_is; ADHD is the
  // only one with shortDefinition. Same order the full guide uses.
  const aeo = content.aeo as Record<string, unknown> | undefined;
  const lede =
    text(content.shortDefinition) ??
    text(content.short_definition) ??
    text(aeo?.what_is) ??
    firstSentence(description);
  const prevalenceText = text(content.prevalence);
  const onset = text(content.age_of_onset);
  const seekHelp = text(content.when_to_seek_help);

  const lived = content.lived_experience as Record<string, unknown> | undefined;
  const quotes = strings(lived?.first_person_statements)
    .map((q) => q.replace(/^["“]|["”]$/g, "").trim())
    .filter((q) => q.length >= 20 && q.length <= 320)
    .slice(0, 6);

  const impactSource = content.impact_on_life;
  const impact =
    impactSource && typeof impactSource === "object" && !Array.isArray(impactSource)
      ? Object.entries(impactSource as Record<string, unknown>)
          .map(([id, value]) => ({ id, label: labelFor(id), text: text(value) ?? "" }))
          .filter((i) => i.text)
      : [];

  const glance = [
    prevalenceText && { id: "common", label: "How common", value: firstSentence(prevalenceText, 120)!, href: "#how-common" },
    onset && { id: "onset", label: "Usually starts", value: firstSentence(onset, 120)!, href: "#symptoms" },
    seekHelp && { id: "help", label: "Get checked if", value: firstSentence(seekHelp, 140)!, href: "#get-help" },
  ].filter((g): g is { id: string; label: string; value: string; href: string } => Boolean(g));

  const facts = [
    typeof metadata.dsm5_code === "string" && metadata.dsm5_code ? `DSM-5 ${metadata.dsm5_code}` : null,
    typeof metadata.icd10_code === "string" && metadata.icd10_code ? `ICD-10 ${metadata.icd10_code}` : null,
  ].filter((f): f is string => Boolean(f));

  const aliases = Array.isArray(metadata.aliases) ? (metadata.aliases as unknown[]) : [];
  const shortName =
    (aliases.find((a) => typeof a === "string" && /^[A-Z][A-Z0-9-]{1,5}$/.test(a)) as string | undefined) ?? null;

  return {
    name,
    shortName,
    lede,
    facts,
    glance,
    frequencies: frequencies(prevalenceText),
    prevalenceText,
    symptoms: groups(content.symptoms),
    quotes,
    impact,
    approaches: groups(content.treatment_approaches),
    selfHelp: strings(content.self_help_strategies).slice(0, 10),
    warningSigns: strings(content.warning_signs),
    whenToSeekHelp: seekHelp,
  };
}
