/**
 * Alternatives: which tools to suggest to someone leaving another, and why.
 *
 * Recommendations come from each product's editorial `positioning`: the kinds
 * of practice a reviewer would genuinely send there, with one sentence saying
 * why. Audience tags are not used for this, because vendors tag themselves for
 * every audience; that is how a ketamine-clinic EHR ended up recommended to
 * IntakeQ users as "best for solo", "best for group" and "best for
 * prescribers" at once.
 *
 * Rules:
 *  - A tool fills at most one slot, so four recommendations are four tools.
 *  - A niche tool (Osmind) is only suggested to someone leaving a tool that
 *    shares one of its segments.
 *  - The reason shown is the product's own positioning note, never a
 *    template sentence.
 *  - "Budget" only names a tool that actually starts cheaper.
 */

import type { ClinicianToolV4, PositioningSegment } from "@/lib/schemas/clinician-tool-v4";

export interface SegmentLabel {
  label: string;
  description: string;
}

export const SEGMENT_LABELS: Record<PositioningSegment, SegmentLabel> = {
  "solo-therapist": { label: "Best for Solo Therapists", description: "One clinician, one system" },
  "group-practice": { label: "Best for Group Practices", description: "Several clinicians and shared admin" },
  prescriber: { label: "Best for Prescribers", description: "Psychiatrists and psychiatric NPs" },
  "interventional-psychiatry": {
    label: "Best for Interventional Psychiatry",
    description: "Ketamine, Spravato and TMS clinics",
  },
  budget: { label: "Best Budget Option", description: "Lower monthly cost" },
  "low-volume": { label: "Best for Part-Time Practices", description: "Pay little until your caseload grows" },
  "insurance-billing": { label: "Best for Insurance Billing", description: "Claims, eligibility and remittances" },
  "private-pay": { label: "Best for Private-Pay Practices", description: "Self-pay and out-of-network clients" },
  multidisciplinary: { label: "Best for Mixed Clinics", description: "Mental health alongside allied health" },
  canada: { label: "Best for Canadian Practices", description: "Canadian privacy law and billing" },
  "measurement-based-care": { label: "Best for Measurement-Based Care", description: "Outcome measures built in" },
  organization: { label: "Best for Larger Organizations", description: "Enterprise integrations and reporting" },
};

/** Order of slots when the original tool does not suggest one. */
const DEFAULT_SLOT_ORDER: PositioningSegment[] = [
  "budget",
  "solo-therapist",
  "group-practice",
  "prescriber",
  "insurance-billing",
  "low-volume",
  "private-pay",
  "measurement-based-care",
  "multidisciplinary",
  "canada",
  "organization",
  "interventional-psychiatry",
];

export interface SpecializedRecommendation {
  segment: PositioningSegment;
  label: string;
  description: string;
  tool: ClinicianToolV4;
  reason: string;
}

function segmentsOf(tool: ClinicianToolV4): PositioningSegment[] {
  return tool.positioning?.segments ?? [];
}

function sharedSegments(a: ClinicianToolV4, b: ClinicianToolV4): number {
  const bs = new Set(segmentsOf(b));
  return segmentsOf(a).filter((s) => bs.has(s)).length;
}

function startingPrice(tool: ClinicianToolV4): number | null {
  const cents = tool.pricing?.starting_price_cents;
  return typeof cents === "number" ? cents : null;
}

/**
 * Whether `candidate` is a sensible alternative to `original` at all. A niche
 * product is only offered to practices already in its niche.
 */
export function isSensibleAlternative(candidate: ClinicianToolV4, original: ClinicianToolV4): boolean {
  if (candidate.slug === original.slug) return false;
  // A clearinghouse is not an alternative to a card processor.
  const candidateJob = candidate.positioning?.job;
  const originalJob = original.positioning?.job;
  if (candidateJob && originalJob && candidateJob !== originalJob) return false;
  if (candidate.positioning?.niche) return sharedSegments(candidate, original) > 0;
  return true;
}

/**
 * Relevance of an alternative to the tool being replaced: same category,
 * shared positioning, then record quality. Niche mismatches sort last.
 */
export function scoreAlternative(candidate: ClinicianToolV4, original: ClinicianToolV4): number {
  if (!isSensibleAlternative(candidate, original)) return -100;
  let score = 0;
  if (candidate.primary_category === original.primary_category) score += 50;
  score += sharedSegments(candidate, original) * 20;
  score += (candidate.governance?.data_quality_score ?? 0) / 10;
  if (startingPrice(candidate) !== null) score += 5;
  return score;
}

export function rankAlternatives(original: ClinicianToolV4, pool: ClinicianToolV4[]): ClinicianToolV4[] {
  return pool
    .filter((t) => t.slug !== original.slug)
    .map((tool, index) => ({ tool, index, score: scoreAlternative(tool, original) }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .map((entry) => entry.tool);
}

/**
 * Up to `max` "best for" picks, one tool per slot. Slots matching what the
 * original tool is used for come first, since that is what a switcher needs.
 */
export function getSpecializedRecommendations(
  original: ClinicianToolV4,
  alternatives: ClinicianToolV4[],
  max = 4
): SpecializedRecommendation[] {
  const eligible = alternatives.filter((t) => isSensibleAlternative(t, original));
  const originalSegments = segmentsOf(original);
  const slotOrder = [
    ...originalSegments,
    ...DEFAULT_SLOT_ORDER.filter((s) => !originalSegments.includes(s)),
  ];
  const originalPrice = startingPrice(original);

  const used = new Set<string>();
  const picks: SpecializedRecommendation[] = [];

  for (const segment of slotOrder) {
    if (picks.length >= max) break;

    const candidates = eligible
      .map((tool, index) => ({ tool, index }))
      .filter(({ tool }) => {
        if (used.has(tool.slug)) return false;
        if (!segmentsOf(tool).includes(segment)) return false;
        if (!tool.positioning?.notes?.[segment]) return false;
        if (segment === "budget") {
          const price = startingPrice(tool);
          if (price === null) return false;
          if (originalPrice !== null && price >= originalPrice) return false;
        }
        return true;
      })
      .sort(
        (a, b) =>
          // A tool listing the segment first is strongest at it.
          segmentsOf(a.tool).indexOf(segment) - segmentsOf(b.tool).indexOf(segment) ||
          sharedSegments(b.tool, original) - sharedSegments(a.tool, original) ||
          a.index - b.index
      );

    const best = candidates[0]?.tool;
    if (!best) continue;

    used.add(best.slug);
    picks.push({
      segment,
      ...SEGMENT_LABELS[segment],
      tool: best,
      reason: best.positioning!.notes![segment]!,
    });
  }

  return picks;
}
