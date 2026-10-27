/**
 * Clinician hub model
 *
 * The clinician side of Apps & Tools is organised by the job a practice
 * needs done (run the practice, write notes, get paid, …), the same functions
 * the Practice Architect office is built from. Each job is one taxonomy
 * category, so `/tools/for-clinicians/<category>` is that job's page.
 *
 * Pure and limited to the records: who a product suits comes from its
 * editorial `positioning` (never from audience tags vendors set themselves),
 * prices from `pricing`, BAA from `compliance`, dates from `governance`.
 * Nothing is scored or ranked beyond the order the reviewers' segments imply.
 */

import type { ClinicianToolV4, PositioningSegment } from "@/lib/schemas/clinician-tool-v4";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";
import type { WorldObjectId } from "@/domains/architect/world/object-registry";

// ============================================================================
// JOBS
// ============================================================================

export interface JobSubgroup {
  /** `positioning.job` value. */
  id: string;
  label: string;
}

export interface JobDefinition {
  /** Taxonomy category slug; also the URL segment. */
  slug: string;
  /** The job, as a practice owner would say it. */
  name: string;
  /** What the software is usually called. */
  kind: string;
  /** One plain sentence about what tools in this job do. */
  line: string;
  /** The Practice Architect office object for this function. */
  object: WorldObjectId;
  /** Optional split by `positioning.job` (billing covers several jobs). */
  subgroups?: JobSubgroup[];
}

/** In the order a new practice tends to need them. */
export const CLINICIAN_JOBS: JobDefinition[] = [
  {
    slug: "ehr-practice-management",
    name: "Run the practice",
    kind: "EHR and practice management",
    line: "Scheduling, notes, a client portal and billing in one system. Most practices start here.",
    object: "clinical_computer",
  },
  {
    slug: "malpractice-insurance",
    name: "Get covered",
    kind: "Malpractice insurance",
    line: "Professional liability cover, bought from a carrier or a program that places it. Needed before you see your first client.",
    object: "insurance_frame",
  },
  {
    slug: "ai-scribe-documentation",
    name: "Write notes faster",
    kind: "AI note-taking",
    line: "Drafts progress notes from a session recording or a dictated summary, for you to edit and sign.",
    object: "ai_scribe",
  },
  {
    slug: "billing-rcm",
    name: "Get paid",
    kind: "Billing, payments and bookkeeping",
    line: "Insurance claims, card payments, out-of-network reimbursement for clients, and the books.",
    object: "billing_ledger",
    subgroups: [
      { id: "claims", label: "Insurance claims" },
      { id: "payments", label: "Card payments" },
      { id: "out-of-network", label: "Out-of-network reimbursement" },
      { id: "bookkeeping", label: "Bookkeeping and taxes" },
    ],
  },
  {
    slug: "provider-networks",
    name: "Take insurance without the paperwork",
    kind: "Insurance networks",
    line: "Networks that credential you with insurers and handle the claims, so you can accept insurance without billing it yourself.",
    // insurance_frame is the malpractice-cover object; networks are a team you join.
    object: "team_workspace",
  },
  {
    slug: "marketing-patient-acquisition",
    name: "Get found by clients",
    kind: "Therapist directories",
    line: "Directory listings where people search for a therapist by location, issue and insurance.",
    object: "practice_sign",
  },
  {
    slug: "telehealth-communication",
    name: "See clients by video",
    kind: "Telehealth",
    line: "Video sessions on their own, for practices whose records system has none or that prefer a separate tool.",
    object: "telehealth_display",
  },
  {
    slug: "measurement-outcomes",
    name: "Measure progress",
    kind: "Outcome measurement",
    line: "Send validated questionnaires between sessions and follow scores over time.",
    object: "assessment_kit",
  },
  {
    slug: "credentialing-workforce",
    name: "Keep your license current",
    kind: "Continuing education",
    line: "Courses, live webinars and seminars that count toward license renewal. Check each course's approval with your board.",
    object: "clinical_cabinet",
  },
];

const JOB_BY_SLUG = new Map(CLINICIAN_JOBS.map((j) => [j.slug, j]));

export function getJob(slug: string): JobDefinition | null {
  return JOB_BY_SLUG.get(slug) ?? null;
}

// ============================================================================
// PRACTICES (positioning segments, in plain words)
// ============================================================================

export const PRACTICE_LABELS: Record<PositioningSegment, string> = {
  "solo-therapist": "Solo therapist",
  "group-practice": "Group practice",
  prescriber: "Prescriber",
  "insurance-billing": "Bills insurance",
  "private-pay": "Private pay",
  budget: "Tight budget",
  "low-volume": "Part-time",
  "measurement-based-care": "Measurement-based care",
  multidisciplinary: "Mixed clinic",
  canada: "In Canada",
  organization: "Larger organization",
  "interventional-psychiatry": "Ketamine or TMS clinic",
};

/** Chip order: the broad practice shapes first, then money, then specialties. */
const PRACTICE_ORDER: PositioningSegment[] = [
  "solo-therapist",
  "group-practice",
  "prescriber",
  "insurance-billing",
  "private-pay",
  "budget",
  "low-volume",
  "measurement-based-care",
  "multidisciplinary",
  "canada",
  "organization",
  "interventional-psychiatry",
];

export interface PracticeOption {
  id: PositioningSegment;
  label: string;
  /** How many products in scope a reviewer positioned for it. */
  count: number;
}

// ============================================================================
// PRODUCTS
// ============================================================================

export type BaaState = "yes" | "no" | "unknown" | "na";

export interface HubProductFit {
  id: PositioningSegment;
  label: string;
  note: string;
}

export interface HubProduct {
  slug: string;
  name: string;
  company: string | null;
  href: string;
  alternativesHref: string;
  /** The first positioning note, else the record's one-liner. */
  summary: string | null;
  price: string | null;
  freeOption: boolean;
  baa: BaaState;
  fit: HubProductFit[];
  /** True for products only suggested to their own niche (Osmind). */
  niche: boolean;
  /** `positioning.job`, used to split billing. */
  subgroup: string | null;
  lastReviewed: string | null;
}

function baaState(value: string | undefined | null): BaaState {
  if (value === "yes" || value === "no") return value;
  if (value === "not_applicable") return "na";
  return "unknown";
}

function firstSentence(text: string | null | undefined): string | null {
  if (!text) return null;
  const trimmed = text.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^.+?[.!?](?=\s|$)/);
  return (match ? match[0] : trimmed).trim();
}

/** Taxonomy slug a record's primary category is published under. */
export function jobSlugFor(tool: Pick<ClinicianToolV4, "primary_category">): string {
  const key = tool.primary_category as keyof typeof SCHEMA_TO_TAXONOMY_CATEGORY;
  return SCHEMA_TO_TAXONOMY_CATEGORY[key] ?? tool.primary_category;
}

export function toHubProduct(tool: ClinicianToolV4): HubProduct {
  const segments = tool.positioning?.segments ?? [];
  const notes = (tool.positioning?.notes ?? {}) as Partial<Record<PositioningSegment, string>>;
  const fit = segments
    .map((id) => ({ id, label: PRACTICE_LABELS[id] ?? id, note: notes[id] ?? "" }))
    .filter((f) => f.note.length > 0);
  const p = tool.pricing;
  const price = p?.quote_required && !p.starting_price_display ? "Price on request" : p?.starting_price_display ?? null;

  return {
    slug: tool.slug,
    name: tool.name,
    company: tool.company_name ?? null,
    href: `/tools/for-clinicians/${jobSlugFor(tool)}/${tool.slug}`,
    alternativesHref: `/tools/alternatives/${tool.slug}`,
    summary: fit[0]?.note ?? firstSentence(tool.one_liner) ?? firstSentence(tool.short_description),
    price,
    freeOption: Boolean(p?.free_tier),
    baa: baaState(tool.compliance?.baa_available),
    fit,
    niche: Boolean(tool.positioning?.niche),
    subgroup: tool.positioning?.job ?? null,
    lastReviewed: tool.governance?.last_reviewed ?? null,
  };
}

// ============================================================================
// JOB VIEWS
// ============================================================================

export interface JobView extends JobDefinition {
  products: HubProduct[];
  /** Products filed elsewhere whose records list this job as secondary. */
  alsoIn: { slug: string; name: string; href: string }[];
  practices: PracticeOption[];
  /** Newest `governance.last_reviewed` among the job's products. */
  lastReviewed: string | null;
}

function practiceOptions(products: HubProduct[]): PracticeOption[] {
  const counts = new Map<PositioningSegment, number>();
  for (const product of products) {
    for (const f of product.fit) counts.set(f.id, (counts.get(f.id) ?? 0) + 1);
  }
  return PRACTICE_ORDER.filter((id) => counts.has(id)).map((id) => ({
    id,
    label: PRACTICE_LABELS[id],
    count: counts.get(id) ?? 0,
  }));
}

function newest(dates: (string | null)[]): string | null {
  return dates.filter((d): d is string => Boolean(d)).sort().at(-1) ?? null;
}

/**
 * Order inside a job: products whose reviewers positioned them broadly come
 * first (more segments with notes), niche products last, then by name. This is
 * a reading order, not a ranking, and the page never presents it as one.
 */
function readingOrder(a: HubProduct, b: HubProduct): number {
  if (a.niche !== b.niche) return a.niche ? 1 : -1;
  if (a.fit.length !== b.fit.length) return b.fit.length - a.fit.length;
  return a.name.localeCompare(b.name);
}

export function buildJobView(job: JobDefinition, tools: ClinicianToolV4[]): JobView {
  const products = tools
    .filter((t) => jobSlugFor(t) === job.slug)
    .map(toHubProduct)
    .sort(readingOrder);

  const inJob = new Set(products.map((p) => p.slug));
  const alsoIn = tools
    .filter((t) => !inJob.has(t.slug))
    .filter((t) =>
      (t.secondary_categories ?? []).some(
        (c) => SCHEMA_TO_TAXONOMY_CATEGORY[c as keyof typeof SCHEMA_TO_TAXONOMY_CATEGORY] === job.slug
      )
    )
    .map((t) => ({ slug: t.slug, name: t.name, href: toHubProduct(t).href }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    ...job,
    products,
    alsoIn,
    practices: practiceOptions(products),
    lastReviewed: newest(products.map((p) => p.lastReviewed)),
  };
}

export interface ClinicianHub {
  jobs: JobView[];
  practices: PracticeOption[];
  productCount: number;
  lastReviewed: string | null;
}

/** Every job with at least one product, in CLINICIAN_JOBS order. */
export function buildClinicianHub(tools: ClinicianToolV4[]): ClinicianHub {
  const jobs = CLINICIAN_JOBS.map((job) => buildJobView(job, tools)).filter((j) => j.products.length > 0);
  const all = jobs.flatMap((j) => j.products);
  return {
    jobs,
    practices: practiceOptions(all),
    productCount: all.length,
    lastReviewed: newest(all.map((p) => p.lastReviewed)),
  };
}

/**
 * The products in a job that a reviewer positioned for this practice, with
 * the note that says why, in reading order. Empty when none were.
 */
export function suitedFor(view: Pick<JobView, "products">, practice: PositioningSegment): HubProduct[] {
  return view.products.filter((p) => p.fit.some((f) => f.id === practice));
}

/** "22 August 2026" from an ISO date, or null. */
export function formatReviewDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

// ============================================================================
// COMPARISONS
// ============================================================================

export interface HubComparison {
  slug: string;
  href: string;
  label: string;
  /** Job slug when every product compared is filed under the same job. */
  job: string | null;
}

/**
 * Comparisons whose products all share one job. Cross-job pairs (a
 * bookkeeping service against an out-of-network app) stay reachable from
 * their own URLs but are not offered as head-to-heads here.
 */
export function sameJobComparisons(
  comparisons: { slug: string; tools: string[] }[],
  tools: ClinicianToolV4[]
): HubComparison[] {
  const bySlug = new Map(tools.map((t) => [t.slug, t]));
  const out: HubComparison[] = [];
  const seen = new Set<string>();
  for (const c of comparisons) {
    // "a-vs-b" and "b-vs-a" both exist for some pairs; offer one.
    const key = [...c.tools].sort().join("|");
    if (seen.has(key)) continue;
    const members = c.tools.map((s) => bySlug.get(s));
    if (members.some((m) => !m)) continue;
    const list = members as ClinicianToolV4[];
    const jobs = new Set(list.map(jobSlugFor));
    if (jobs.size !== 1) continue;
    const roles = new Set(list.map((t) => t.positioning?.job ?? null));
    if (roles.size !== 1) continue;
    seen.add(key);
    out.push({
      slug: c.slug,
      href: `/tools/compare/${c.slug}`,
      label: list.map((t) => t.name).join(" vs "),
      job: [...jobs][0],
    });
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
}
