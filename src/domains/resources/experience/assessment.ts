/**
 * Assessment shell model (/resources/<slug>, assessments-screeners).
 *
 * Pure. Only the framing around the questionnaire: what it is, what it
 * measures, how long it takes, who it is for and its limits. The
 * questionnaire and its scoring are untouched (AssessmentRenderer).
 */

type Rec = Record<string, unknown>;

export interface AssessmentShellView {
  name: string;
  fullName: string | null;
  summary: string | null;
  duration: string | null;
  questions: number;
  ageRange: string | null;
  selfReport: boolean;
  validated: boolean;
  free: boolean;
  forWhom: string[];
  limitations: string[];
}

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);
const strs = (v: unknown): string[] =>
  Array.isArray(v) ? v.map((x) => str(x)).filter((x): x is string => Boolean(x)) : [];

export function buildAssessmentShell(entity: Rec): AssessmentShellView | null {
  const r: Rec = { ...((entity.data as Rec) ?? {}), ...entity };
  const name = str(r.name);
  const items = Array.isArray(r.questions) ? r.questions : Array.isArray(r.items) ? r.items : [];
  // Without questions there is no questionnaire to frame.
  if (!name || items.length === 0) return null;
  const fullName = str(r.full_name);
  return {
    name,
    fullName: fullName && fullName !== name ? fullName : null,
    summary: str(r.description) ?? str(r.summary),
    duration: str(r.duration),
    questions: items.length,
    ageRange: str(r.age_range),
    selfReport: str(r.administration)?.toLowerCase() === "self-report",
    validated: r.validated === true,
    free: r.free === true,
    forWhom: strs(r.target_populations).map((p) => p.charAt(0).toUpperCase() + p.slice(1)),
    limitations: strs(r.limitations),
  };
}
