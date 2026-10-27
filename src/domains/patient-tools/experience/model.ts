/**
 * Patient tool experience model
 *
 * Turns a DigitalToolV3 record (data/resources/tools) into what the
 * interactive app/tool page shows. Pure, and limited to the record: no
 * scores are invented, and a field the record does not have is left out
 * rather than filled with a placeholder. Uncertainty and trade-off rules
 * mirror src/components/tools/DecisionContext.tsx so the two never disagree.
 */

import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";
import { CONDITION_SLUGS } from "@/lib/entities/entity-slugs.generated";
import { helpOf, payOf } from "@/domains/patient-tools/finder/model";
import { whatYouGet, yearCost, type YearCost } from "@/domains/patient-tools/shelves/model";
import { basisLines } from "@/domains/patient-tools/privacy";

type Compliance = boolean | "yes" | "no" | "unknown" | "not_applicable" | undefined;

export interface ToolFact {
  label: string;
  tone?: "positive" | "neutral";
}

export interface ToolGlance {
  id: string;
  label: string;
  value: string;
  href: string;
  tone: "neutral" | "caution";
  /** Optional second line, e.g. what the price comes to over a year. */
  sub?: string | null;
}

export interface ToolAvailability {
  state: "limited" | "discontinued";
  note: string | null;
  checked: string;
  sources: string[];
}

export interface ToolExperience {
  slug: string;
  name: string;
  /** Present only when the vendor-checked state is not plain "available". */
  availability: ToolAvailability | null;
  kind: string | null;
  lede: string;
  summary: string | null;
  facts: ToolFact[];
  glance: ToolGlance[];
  fit: { good: string[]; poor: string[] };
  uses: string[];
  conditions: { slug: string; name: string }[];
  cost: {
    model: string;
    headline: string;
    freeTier: boolean;
    notes: string | null;
    insurance: boolean;
    /** What the listed price comes to over a year, when it states one. */
    year: YearCost | null;
  };
  /** The kind of help, in plain words ("A licensed therapist", "On your own"). */
  get: string;
  /** How someone actually starts. */
  start: string;
  privacy: {
    grade: string | null;
    rows: { label: string; value: string; good: boolean | null }[];
    notes: string | null;
    /** The policy the grade was read from, when researched. */
    source: { url: string; checked: string } | null;
  };
  evidence: {
    level: "high" | "moderate" | "low" | "emerging" | null;
    label: string;
    step: number;
    /** Verified studies of this product, with links. */
    studies: { label: string; url: string | null; design: string | null }[];
  };
  uncertainties: string[];
  tradeoffs: string[];
  /** The record says this is not for people in crisis. */
  crisisCaveat: boolean;
}

// ---------------------------------------------------------------------------

const TYPE_LABELS: Record<string, string> = {
  app: "App",
  "therapy-platform": "Therapy platform",
  "psychiatry-platform": "Psychiatry platform",
  "ai-therapist": "AI companion",
  "mood-tracker": "Mood tracker",
  meditation: "Meditation",
  "sleep-tracker": "Sleep",
  journal: "Journal",
  "peer-support": "Peer support",
  "crisis-tool": "Crisis support",
  assessment: "Assessment",
  coaching: "Coaching",
};

const SUPPORT_LABELS: Record<string, string> = {
  "self-help": "Self-guided",
  coached: "With a coach",
  clinical: "With licensed clinicians",
  crisis: "Crisis support",
};

const MODEL_LABELS: Record<string, string> = {
  free: "Free",
  freemium: "Free with paid upgrades",
  subscription: "Subscription",
  "one-time": "One-time purchase",
  enterprise: "Through an employer or plan",
  "insurance-covered": "Covered by insurance",
};

const EVIDENCE: Record<string, { label: string; step: number }> = {
  high: { label: "Strong research support", step: 4 },
  moderate: { label: "Some research support", step: 3 },
  low: { label: "Limited research", step: 2 },
  emerging: { label: "Early research", step: 1 },
};

function isYes(v: Compliance): boolean {
  return v === true || v === "yes";
}
function isNo(v: Compliance): boolean {
  return v === false || v === "no";
}
function complianceText(v: Compliance): string {
  if (isYes(v)) return "Yes";
  if (isNo(v)) return "No";
  if (v === "not_applicable") return "Not applicable";
  return "Not verified";
}

/** "generalized-anxiety-disorder" → "Generalized anxiety disorder". */
export function nameFromSlug(slug: string): string {
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function platformsLine(p: DigitalToolV3["platforms"]): string | null {
  const parts = [p.ios && "iPhone", p.android && "Android", p.web && "Web", p.desktop && "Desktop", p.wearable && "Wearables"].filter(
    (x): x is string => Boolean(x)
  );
  return parts.length ? parts.join(" · ") : null;
}

export function costHeadline(pricing: DigitalToolV3["pricing"]): string {
  if (pricing.model === "free") return "Free";
  if (pricing.starting_price) return `${pricing.free_tier ? "Free, or from " : "From "}${pricing.starting_price}`;
  if (pricing.free_tier) return "Free to start";
  return MODEL_LABELS[pricing.model] ?? "Pricing varies";
}

// ---------------------------------------------------------------------------

export function buildToolExperience(tool: DigitalToolV3, conditionNames: Record<string, string> = {}): ToolExperience {
  const types = tool.tool_types.map((t) => TYPE_LABELS[t]).filter(Boolean);
  const support = SUPPORT_LABELS[tool.support_level];
  const kind = [types.slice(0, 2).join(" & "), support].filter(Boolean).join(" · ") || null;

  const conditionSlugs = [...new Set([...(tool.conditions ?? []), ...(tool.related_conditions ?? [])])];
  const conditions = conditionSlugs
    .filter((slug) => CONDITION_SLUGS.has(slug))
    .map((slug) => ({ slug, name: conditionNames[slug] ?? nameFromSlug(slug) }));

  const privacy = tool.privacy;
  const grade = privacy.grade && privacy.grade !== "unknown" ? privacy.grade : null;
  const level = tool.clinical_metadata?.evidence_level;
  const studies = (tool.clinical_metadata?.clinical_trials ?? [])
    .filter((t) => t.citation)
    .map((t) => {
      const c = t.citation!;
      const url = c.doi ? `https://doi.org/${c.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//, "")}` : c.url ?? null;
      return { label: `${c.authors} (${c.year}). ${c.title}. ${c.journal}.`, url, design: t.study_design ?? null };
    });
  const evidence =
    level && EVIDENCE[level]
      ? { level: level as ToolExperience["evidence"]["level"], ...EVIDENCE[level], studies }
      : { level: null, label: "Not independently studied", step: 0, studies };

  // Same rules as DecisionContext.
  const uncertainties: string[] = [];
  if (!grade) uncertainties.push(privacy.basis ? "Its privacy policy doesn't say whether it sells data or shares it for advertising" : "Privacy practices have not been independently verified");
  if (privacy.hipaa_compliant === "unknown" || privacy.hipaa_compliant === undefined)
    uncertainties.push("HIPAA compliance status is unverified");
  if (!tool.clinical_metadata?.evidence_based && !level) uncertainties.push("Clinical effectiveness has not been independently studied");
  if (level === "emerging" || level === "low") uncertainties.push("Clinical evidence is limited or still emerging");

  const tradeoffs: string[] = [];
  if (tool.pricing.model === "subscription" && !tool.pricing.free_tier) tradeoffs.push("Requires ongoing subscription with no free option");
  if (!tool.platforms.ios && !tool.platforms.android) tradeoffs.push("No mobile app available");
  if (!tool.platforms.web) tradeoffs.push("Requires app download - no web version");
  if (tool.support_level === "self-help") tradeoffs.push("Self-guided only - no direct professional support");

  const notes = tool.pricing.notes?.trim() || null;
  const insurance = tool.pricing.model === "insurance-covered" || /insurance|medicaid|medicare/i.test(notes ?? "");
  const cost = {
    model: MODEL_LABELS[tool.pricing.model] ?? tool.pricing.model,
    headline: costHeadline(tool.pricing),
    freeTier: tool.pricing.free_tier,
    notes,
    insurance,
    year: yearCost(tool.pricing.starting_price),
  };

  const help = helpOf(tool);
  const pay = payOf(tool.pricing);
  const get = whatYouGet({ help });
  const trial = /free trial|\btrial\b/i.test(`${tool.pricing.starting_price ?? ""} ${notes ?? ""}`);
  const start =
    pay.length === 1 && pay[0] === "employer"
      ? "Through an employer, school or health plan that offers it"
      : tool.pricing.model === "insurance-covered"
        ? "Check your insurance is accepted, then book"
        : tool.pricing.model === "free"
          ? "Free. Download or sign up and start"
          : tool.pricing.free_tier
            ? "Start free, pay only if you want more"
            : trial
              ? "Start with a free trial, then subscribe"
              : tool.pricing.model === "one-time"
                ? "Pay once and start"
                : "Sign up and choose a plan";

  const crisisCaveat = tool.not_for.some((n) => /crisis|988|emergenc|suicid/i.test(n));
  const platforms = platformsLine(tool.platforms);

  const factList: (ToolFact | null)[] = [
    { label: cost.headline },
    insurance ? { label: "Insurance accepted", tone: "positive" as const } : null,
    platforms ? { label: platforms } : null,
    isYes(privacy.hipaa_compliant) ? { label: "HIPAA compliant", tone: "positive" as const } : null,
    grade ? { label: `Privacy ${grade}` } : null,
    ...(tool.store_ratings ?? []).map((r) => ({ label: `${r.rating.toFixed(1)} on ${r.store}` })),
  ];
  const facts = factList.filter((f): f is ToolFact => f !== null);

  const glance: ToolGlance[] = [];
  glance.push({ id: "get", label: "What you get", value: get, href: "#uses", tone: "neutral", sub: tool.best_for[0] ? `Best for ${tool.best_for[0].charAt(0).toLowerCase()}${tool.best_for[0].slice(1)}` : null });
  glance.push({ id: "cost", label: "What it costs", value: cost.headline, href: "#cost", tone: "neutral", sub: cost.year ? cost.year.headline : null });
  glance.push({ id: "start", label: "How you start", value: start, href: "#cost", tone: "neutral", sub: platforms });
  if (crisisCaveat) {
    glance.push({ id: "crisis", label: "Know first", value: "Not for a crisis. Call or text 988 any time.", href: "#privacy", tone: "caution" });
  } else {
    glance.push({ id: "evidence", label: "Evidence", value: evidence.label, href: "#privacy", tone: "neutral", sub: grade ? `Privacy ${grade}` : null });
  }

  const av = tool.availability;
  const availability: ToolAvailability | null =
    av && av.state !== "available"
      ? { state: av.state, note: av.note ?? null, checked: av.checked, sources: av.sources ?? [] }
      : null;

  return {
    slug: tool.slug,
    name: tool.name,
    availability,
    kind,
    lede: tool.one_liner,
    summary: tool.patient_summary?.trim() || null,
    facts,
    glance,
    fit: { good: tool.best_for, poor: tool.not_for },
    get,
    start,
    uses: tool.clinical_metadata?.primary_uses ?? [],
    conditions,
    cost,
    privacy: {
      grade,
      source: privacy.basis ? { url: privacy.basis.policy_url, checked: privacy.basis.checked } : null,
      rows: privacy.basis ? basisLines(privacy.basis) : [
        { label: "HIPAA compliant", value: complianceText(privacy.hipaa_compliant), good: isYes(privacy.hipaa_compliant) ? true : isNo(privacy.hipaa_compliant) ? false : null },
        { label: "GDPR compliant", value: complianceText(privacy.gdpr_compliant), good: isYes(privacy.gdpr_compliant) ? true : isNo(privacy.gdpr_compliant) ? false : null },
        // Selling data is the bad direction, so "No" is the good answer.
        { label: "Sells your data", value: complianceText(privacy.data_sold), good: isNo(privacy.data_sold) ? true : isYes(privacy.data_sold) ? false : null },
      ],
      notes: privacy.notes?.trim() || null,
    },
    evidence,
    uncertainties,
    tradeoffs,
    crisisCaveat,
  };
}
