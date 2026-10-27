/**
 * Patient app finder
 *
 * Three plain questions — what's going on, what kind of help, how you'd pay —
 * narrow ~300 apps and services to a short list. Every answer maps to fields
 * already on the record (`primary_hubs`, `tool_types`, `support_level`,
 * `pricing.model`); nothing is inferred, scored or diagnosed. Order: ones
 * anyone can sign up for first, then the strength of research on the record,
 * then how clearly its privacy is rated, then name — never by commercial
 * relationship.
 */

import type { DigitalToolV3, HubSlug } from "@/lib/schemas/digital-tool-v3";
import { approachesOf, costTier, type ApproachId, type CostTier } from "../fit/model";
import { monthlyFigure } from "../shelves/model";

// ============================================================================
// QUESTIONS
// ============================================================================

export type NeedId = HubSlug;
export type HelpId = "therapist" | "prescriber" | "self-guided" | "peer";
export type PayId = "insurance" | "free" | "self-pay" | "employer";

export interface NeedDefinition {
  id: NeedId;
  label: string;
  /** Page title for the need's own page. */
  title: string;
  line: string;
  href: string;
}

export const NEEDS: NeedDefinition[] = [
  {
    id: "anxiety-stress",
    label: "Anxiety or stress",
    title: "Apps and online care for anxiety and stress",
    line: "Therapy you can start online, and apps that teach the skills therapists use for worry, panic and stress.",
    href: "/tools/anxiety-stress",
  },
  {
    id: "mood-depression",
    label: "Low mood",
    title: "Apps and online care for depression and low mood",
    line: "Online therapy and psychiatry for depression, and self-guided apps for the days in between.",
    href: "/tools/mood-depression",
  },
  {
    id: "sleep",
    label: "Sleep",
    title: "Apps and programs for sleep",
    line: "Programs based on CBT for insomnia, and tools for winding down.",
    href: "/tools/sleep",
  },
  {
    id: "focus-adhd",
    label: "Focus or ADHD",
    title: "Apps and online care for ADHD and focus",
    line: "ADHD assessment and treatment online, and tools for planning and attention.",
    href: "/tools/focus-adhd",
  },
  {
    id: "trauma-ptsd",
    label: "Trauma",
    title: "Apps and online care for trauma and PTSD",
    line: "Trauma-focused therapy online, and self-help tools built with PTSD clinicians.",
    href: "/tools/trauma-ptsd",
  },
  {
    id: "substance-use",
    label: "Alcohol or drugs",
    title: "Apps and online care for alcohol and drug use",
    line: "Recovery programs, medication-assisted treatment online, and peer support.",
    href: "/tools/substance-use",
  },
  {
    id: "serious-mental-illness",
    label: "Psychosis or bipolar",
    title: "Apps and services for serious mental illness",
    line: "Services and tools for psychosis, bipolar disorder and other serious mental illness, often alongside a care team.",
    href: "/tools/serious-mental-illness",
  },
  {
    id: "find-support",
    label: "Someone to talk to",
    title: "Online therapy and psychiatry",
    line: "Therapists and prescribers you can see online, by insurance, price and how they work.",
    href: "/tools/find-support",
  },
];

export const HELP: { id: HelpId; label: string; line: string }[] = [
  { id: "therapist", label: "A therapist", line: "Talk therapy by video, phone or messaging" },
  { id: "prescriber", label: "Medication", line: "A psychiatrist or nurse practitioner who can prescribe" },
  { id: "self-guided", label: "An app I use on my own", line: "Exercises, tracking, meditation" },
  { id: "peer", label: "Peer support or coaching", line: "People with lived experience, or a coach" },
];

export const PAY: { id: PayId; label: string; line: string }[] = [
  { id: "insurance", label: "Insurance", line: "Takes health insurance" },
  { id: "free", label: "Free", line: "Free, or a free version" },
  { id: "self-pay", label: "I'll pay myself", line: "Subscription or one-off price" },
  { id: "employer", label: "Through work or school", line: "Offered by employers, schools or health plans" },
];

const NEED_IDS = new Set(NEEDS.map((n) => n.id));

export function getNeed(id: string): NeedDefinition | null {
  return NEEDS.find((n) => n.id === id) ?? null;
}

// ============================================================================
// RECORD → FINDER FIELDS
// ============================================================================

const SELF_GUIDED_TYPES = new Set(["app", "meditation", "mood-tracker", "sleep-tracker", "journal", "ai-therapist", "assessment"]);

export function helpOf(tool: Pick<DigitalToolV3, "tool_types" | "sub_hubs" | "support_level">): HelpId[] {
  const types = new Set(tool.tool_types);
  const subs = new Set(tool.sub_hubs ?? []);
  const out = new Set<HelpId>();
  if (types.has("therapy-platform") || subs.has("therapy-platforms")) out.add("therapist");
  if (types.has("psychiatry-platform") || subs.has("psychiatry-platforms")) out.add("prescriber");
  if (types.has("peer-support") || types.has("coaching") || tool.support_level === "coached") out.add("peer");
  if (tool.support_level === "self-help" && [...types].some((t) => SELF_GUIDED_TYPES.has(t))) out.add("self-guided");
  if (types.has("ai-therapist") || subs.has("ai-therapists")) out.add("self-guided");
  // An app you use on your own that fits no other kind (e.g. a prescribed
  // digital therapeutic) is still self-guided.
  if (out.size === 0 && types.has("app")) out.add("self-guided");
  return [...out];
}

export function payOf(pricing: DigitalToolV3["pricing"]): PayId[] {
  const out = new Set<PayId>();
  if (pricing.model === "insurance-covered") out.add("insurance");
  if (pricing.model === "free" || pricing.free_tier) out.add("free");
  if (pricing.model === "subscription" || pricing.model === "one-time" || pricing.model === "freemium") out.add("self-pay");
  if (pricing.model === "enterprise") out.add("employer");
  return [...out];
}

/** Same wording as the app profile's evidence meter. */
export type EvidenceLabel = "Strong research support" | "Some research support" | "Limited research" | "Early research";

export function evidenceOf(level: string | undefined | null): { rank: number; label: EvidenceLabel | null } {
  switch (level) {
    case "high":
      return { rank: 0, label: "Strong research support" };
    case "moderate":
      return { rank: 1, label: "Some research support" };
    case "low":
      return { rank: 2, label: "Limited research" };
    case "emerging":
      return { rank: 2, label: "Early research" };
    default:
      return { rank: 3, label: null };
  }
}

const PRIVACY_RANK: Record<string, number> = { "A+": 0, A: 1, "B+": 2, B: 3, C: 4, D: 5, F: 6 };

function firstSentence(text: string | null | undefined, max = 170): string | null {
  if (!text) return null;
  const t = text.trim();
  const m = t.match(/^.+?[.!?](?=\s|$)/);
  const s = (m ? m[0] : t).trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

function costLine(pricing: DigitalToolV3["pricing"]): string {
  if (pricing.model === "free") return "Free";
  if (pricing.model === "insurance-covered") return pricing.starting_price ?? "Takes insurance";
  if (pricing.model === "enterprise") return "Through work, school or a health plan";
  if (pricing.starting_price) return `${pricing.free_tier ? "Free, or " : ""}${pricing.starting_price}`;
  return pricing.free_tier ? "Free to start" : "Paid";
}

function platformsLine(p: DigitalToolV3["platforms"]): string | null {
  const parts = [p.ios && "iPhone", p.android && "Android", p.web && "Web"].filter(Boolean) as string[];
  return parts.length ? parts.join(" · ") : null;
}

export interface FinderApp {
  slug: string;
  name: string;
  href: string;
  summary: string | null;
  goodFor: string | null;
  cost: string;
  needs: NeedId[];
  help: HelpId[];
  pay: PayId[];
  evidence: EvidenceLabel | null;
  privacy: string | null;
  platforms: string | null;
  /** True when anyone can sign up (not only through an employer or plan). */
  open: boolean;
  /** Vendor-checked caveat when the app is only partly available. */
  limited: string | null;
  /**
   * Not where most people start: an intensive program (IOP, partial
   * hospitalization, residential), a step above weekly care, or a product
   * that needs a prescription. Listed after regular options when suggesting
   * where to start. From the record's name and one-liner.
   */
  notFirstStop: boolean;
  /** What you do with it (see fit/model), from the record's own wording. */
  approaches: ApproachId[];
  /** One comparable price level. */
  costTier: CostTier;
  /** Rating as published by the store, with its source. Never our own. */
  storeRating: { store: string; rating: number; count: number | null } | null;
  /** Sort key; see the module comment. */
  rank: number;
}

/**
 * Records in the patient catalog that are really for clinicians or
 * organisations (measurement platforms, EHR add-ons, provider platforms,
 * hospital telehealth infrastructure). They keep their profile pages but are
 * not offered to someone looking for help. Matched on the record's own name
 * and one-liner.
 */
const CLINICIAN_FACING =
  /(helps therapists|for therapists|clinician (dashboard|portal)|dashboard for|provider platform|measurement-based care|\bMBC\b|outcome measure|ORS\/SRS|PCOMS|OQ-45|feedback.informed|client engagement platform|\bEHR\b|real-world data|\bB2B\b|for (hospitals|facilities|health systems)|hospitals and health systems|patient intake|telehealth hardware|tele-ICU|white-label|analytics platform|care coordination)/i;
const CLINICIAN_FACING_NAME = /\b(Measures|Outcome Measures|Assessments)$/;

export function isClinicianFacing(tool: Pick<DigitalToolV3, "name" | "one_liner" | "audience">): boolean {
  if (tool.audience) return tool.audience === "clinician";
  return CLINICIAN_FACING.test(`${tool.name} ${tool.one_liner}`) || CLINICIAN_FACING_NAME.test(tool.name);
}

/**
 * Products sold only to employers, schools, insurers or health systems: a
 * person cannot sign up for them on their own (e.g. Wysa for Employers,
 * Talkspace for Business, EAPs, managed behavioral health). They keep a
 * profile but are not offered on consumer pages. Matched on the record's own
 * name and one-liner, not on the price model, which is often "enterprise" for
 * services consumers can still join through insurance.
 */
const EMPLOYER_ONLY_NAME = /\b(for (Employers|Organizations|Business|Work|Teams|Schools)|Business)\s*$/i;
const EMPLOYER_ONLY_TEXT =
  /(\bB2B\b|employer-sponsored|\bEAP\b|employee assistance|through employer benefits|delivered through employer|white-label|managed behavioral health|manages behavioral health benefits|enterprise (telehealth|mental health) platform|for employers and health plans|only (available )?through (your )?(employer|health plan|school))/i;

/**
 * Sold only through an employer, school, insurer or health system, by how
 * each company sells it (checked October 2026). Many of these records share a
 * template one-liner, so the name/text rules above cannot catch them.
 */
const EMPLOYER_ONLY_SLUGS = new Set([
  // Employer and health-plan benefits
  "accolade-mental-health", "calm-health", "headspace-health", "modern-health", "evernorth-behavioral-health",
  "optum-behavioral-health", "magellan-behavioral-health", "lucet", "healthjoy-behavioral-health",
  "included-health-behavioral-health", "included-health-virtual-care", "personify-health-mental-wellbeing",
  "vida-health-mental-health", "omada-mental-health", "pelago", "curalinc-healthcare", "mindoula",
  "happify-twill", "rethink-first",
  // Sponsor-only peer communities (university, employer or health service)
  "togetherall",
  // Schools and colleges
  "timelycare", "mantra-health", "uwill", "daybreak-health", "hazel-health-mental-health", "cartwheel-care",
  // Health systems and clinics (prescribed or referred, not consumer sign-up)
  "concert-health", "koa-health", "koa-health-foundations", "koa-health-mindset", "koa-health-perspectives",
  "silvercloud-space-from-anxiety", "silvercloud-space-from-depression", "silvercloud-space-from-gad",
  "silvercloud-space-from-stress", "silvercloud", "silvercloud-health", "ieso-digital-cbt", "ieso-digital-health",
]);

export function isEmployerOnly(tool: Pick<DigitalToolV3, "slug" | "name" | "one_liner">): boolean {
  return EMPLOYER_ONLY_SLUGS.has(tool.slug) || EMPLOYER_ONLY_NAME.test(tool.name) || EMPLOYER_ONLY_TEXT.test(tool.one_liner);
}

export function isCrisisTool(tool: Pick<DigitalToolV3, "tool_types" | "support_level">): boolean {
  return tool.tool_types.includes("crisis-tool") || tool.support_level === "crisis";
}

/**
 * Whether a person can still get this app. Discontinued apps and duplicates
 * folded into another record keep a profile (with a banner) but are never
 * offered in the finder.
 */
export function isListable(tool: Pick<DigitalToolV3, "status" | "availability" | "merged_into">): boolean {
  return tool.status === "active" && !tool.merged_into && tool.availability?.state !== "discontinued";
}

const NOT_FIRST_STOP =
  /\b(IOP|PHP|intensive outpatient|partial hospitali[sz]ation|residential|inpatient|day treatment|requires a prescription|prescription[- ]only|pediatric ADHD)\b/i;

export function toFinderApp(tool: DigitalToolV3): FinderApp {
  const ev = evidenceOf(tool.clinical_metadata?.evidence_level);
  const grade = tool.privacy?.grade && tool.privacy.grade !== "unknown" ? tool.privacy.grade : null;
  const pay = payOf(tool.pricing);
  // Anyone can sign up unless it is sold only to employers, schools or plans.
  const open = !isEmployerOnly(tool);
  const privacyRank = grade ? PRIVACY_RANK[grade] ?? 6 : 7;
  return {
    slug: tool.slug,
    name: tool.name,
    href: `/tools/${tool.slug}`,
    summary: firstSentence(tool.patient_summary) ?? firstSentence(tool.one_liner),
    goodFor: tool.best_for?.[0] ?? null,
    cost: costLine(tool.pricing),
    needs: tool.primary_hubs.filter((h) => NEED_IDS.has(h)),
    help: helpOf(tool),
    pay,
    evidence: ev.label,
    privacy: grade,
    platforms: platformsLine(tool.platforms),
    open,
    limited: tool.availability?.state === "limited" ? tool.availability.note ?? "Limited availability" : null,
    notFirstStop: NOT_FIRST_STOP.test(`${tool.name} ${tool.one_liner}`),
    approaches: approachesOf(tool),
    costTier: costTier(tool.pricing, monthlyFigure(tool.pricing.starting_price)),
    storeRating: tool.store_ratings?.[0]
      ? { store: tool.store_ratings[0].store, rating: tool.store_ratings[0].rating, count: tool.store_ratings[0].count ?? null }
      : null,
    rank: (open ? 0 : 1000) + ev.rank * 100 + privacyRank * 10,
  };
}

export function byRank(a: FinderApp, b: FinderApp): number {
  return a.rank - b.rank || a.name.localeCompare(b.name);
}

// ============================================================================
// FILTERING
// ============================================================================

export interface FinderAnswers {
  need: NeedId | null;
  help: HelpId | null;
  pay: PayId | null;
}

export function matches(app: FinderApp, a: FinderAnswers): boolean {
  if (a.need && !app.needs.includes(a.need)) return false;
  if (a.help && !app.help.includes(a.help)) return false;
  if (a.pay && !app.pay.includes(a.pay)) return false;
  return true;
}

export function filterApps(apps: FinderApp[], a: FinderAnswers): FinderApp[] {
  return apps.filter((app) => matches(app, a)).sort(byRank);
}

/** How many apps each option would leave, given the other answers. */
export function optionCounts(apps: FinderApp[], a: FinderAnswers) {
  const count = (patch: Partial<FinderAnswers>) => apps.filter((app) => matches(app, { ...a, ...patch })).length;
  return {
    need: Object.fromEntries(NEEDS.map((n) => [n.id, count({ need: n.id })])) as Record<NeedId, number>,
    help: Object.fromEntries(HELP.map((h) => [h.id, count({ help: h.id })])) as Record<HelpId, number>,
    pay: Object.fromEntries(PAY.map((p) => [p.id, count({ pay: p.id })])) as Record<PayId, number>,
  };
}

export function isNeed(v: string | null | undefined): v is NeedId {
  return Boolean(v && NEED_IDS.has(v as NeedId));
}
export function isHelp(v: string | null | undefined): v is HelpId {
  return HELP.some((h) => h.id === v);
}
export function isPay(v: string | null | undefined): v is PayId {
  return PAY.some((p) => p.id === v);
}
