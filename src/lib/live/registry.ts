/**
 * Live updates — what HeyPsych Admin may change without a deployment.
 *
 * Everything editable is declared here, in code, with its default. Admin can
 * only set values for keys listed here, and only within these limits. That is
 * the safety boundary:
 *
 *  - No clinical content. Condition, treatment, symptom and assessment
 *    records, crisis resources, the patient-support evaluator and its
 *    wording, and the appointment-brief question templates are not editable
 *    here. They change only through reviewed code.
 *  - No compliance claims. HIPAA, BAA, SOC 2 and similar tool fields need
 *    evidence review and are excluded from the tool editor.
 *  - No commercial influence. Commercial and affiliate fields are excluded,
 *    and no flag or copy key reaches any recommendation, ranking or
 *    evaluator.
 *
 * Adding a key here is a code change (reviewed and deployed); changing its
 * value is not.
 */

/**
 * "consensus": HeyPsych Consensus Score records (src/domains/consensus). Private
 * evidence; public pages see only the approved projection.
 */
export type LiveKind = "tool" | "tool-new" | "flag" | "copy" | "experiment" | "consensus";

// ---------------------------------------------------------------------------
// Feature flags (nonclinical presentation only)
// ---------------------------------------------------------------------------

export interface FlagDef {
  key: string;
  label: string;
  description: string;
  /** Value when nothing is published. */
  default: boolean;
  /** Where it takes effect, for the admin screen. */
  surface: string;
}

export const FLAGS = [
  {
    key: "architect.draft-stack",
    label: "“Draft my practice” in Practice Architect",
    description: "The one-tap first draft of a practice's stack. Off: clinicians choose each function by hand.",
    default: true,
    surface: "/architect",
  },
  {
    key: "home.resume-strip",
    label: "Homepage “Welcome back” strip",
    description: "Returning visitors with a saved path see a strip to pick up where they left off.",
    default: true,
    surface: "/",
  },
  {
    key: "architect.plan-ledger",
    label: "Plan ledger beside the office",
    description: "Live monthly cost, coverage and verification list next to the Practice Architect office.",
    default: true,
    surface: "/architect",
  },
] as const satisfies readonly FlagDef[];

export type FlagKey = (typeof FLAGS)[number]["key"];

// ---------------------------------------------------------------------------
// Approved interface copy (nonclinical)
// ---------------------------------------------------------------------------

export interface CopyDef {
  key: string;
  label: string;
  default: string;
  maxLength: number;
  surface: string;
}

export const COPY = [
  {
    key: "home.hero.subtitle",
    label: "Homepage subtitle",
    default: "Find the support you need. Or build the practice you imagine.",
    maxLength: 120,
    surface: "/",
  },
  {
    key: "architect.draft.title",
    label: "Practice Architect: draft banner title",
    default: "Start from a first draft",
    maxLength: 60,
    surface: "/architect",
  },
  {
    key: "architect.draft.body",
    label: "Practice Architect: draft banner text",
    default:
      "We pick the best-fitting eligible tool for each function your practice needs, favouring all-in-one tools so you pay for fewer. Every pick is a suggestion you can change. Or choose a numbered marker to go one by one.",
    maxLength: 320,
    surface: "/architect",
  },
] as const satisfies readonly CopyDef[];

export type CopyKey = (typeof COPY)[number]["key"];

// ---------------------------------------------------------------------------
// Experiments (nonclinical copy variants, stable per browser)
// ---------------------------------------------------------------------------

export interface ExperimentDef {
  key: string;
  label: string;
  /** Variant ids with display values; the first is the control. */
  variants: readonly { id: string; value: string }[];
  surface: string;
}

export const EXPERIMENTS = [
  {
    key: "architect-draft-cta",
    label: "Practice Architect: draft button label",
    variants: [
      { id: "control", value: "Draft my practice" },
      { id: "first-draft", value: "Build my first draft" },
    ],
    surface: "/architect",
  },
] as const satisfies readonly ExperimentDef[];

export type ExperimentKey = (typeof EXPERIMENTS)[number]["key"];

// ---------------------------------------------------------------------------
// Tool fields (clinician software, V4 records)
// ---------------------------------------------------------------------------

/**
 * Top-level V4 fields Admin may override. Anything not listed is ignored when
 * an overlay is applied, so a stored value can never reach compliance,
 * commercial, governance or SEO fields.
 */
export const TOOL_EDITABLE_FIELDS = [
  "name",
  "company_name",
  "one_liner",
  "short_description",
  "long_description",
  "website_url",
  "pricing_url",
  "demo_url",
  "support_url",
  "pricing",
  "integrations",
  "capabilities",
  "primary_category",
  "secondary_categories",
  "best_for",
  "not_for",
  "positioning",
  "related_tools",
  "competitor_tools",
  "status",
] as const;

export type ToolEditableField = (typeof TOOL_EDITABLE_FIELDS)[number];

/** Never editable, listed for the admin screen so the boundary is visible. */
export const TOOL_LOCKED_FIELDS = ["compliance", "commercial", "affiliate_url", "governance", "editorial", "seo", "id", "slug", "schema_version", "kind"] as const;

export function flagDef(key: string): FlagDef | undefined {
  return FLAGS.find((f) => f.key === key);
}
export function copyDef(key: string): CopyDef | undefined {
  return COPY.find((c) => c.key === key);
}
export function experimentDef(key: string): ExperimentDef | undefined {
  return EXPERIMENTS.find((e) => e.key === key);
}
