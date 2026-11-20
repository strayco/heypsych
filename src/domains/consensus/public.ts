/**
 * HeyPsych Consensus Score — the public projection.
 *
 * The only shape public pages receive. Built from the approval snapshot
 * frozen when an editor approved the record, never from observations, so no
 * source name, URL, per-source rating, review count, weight or theme can
 * reach a page, the data cache, the browser or an API response.
 */

import { ApprovalZ, EditorialZ, isPilotSlug, type ApprovedResult } from "./schema";

export interface PublicConsensus {
  slug: string;
  score: number;
  confidence: ApprovedResult["confidence"];
  /** YYYY-MM-DD the evidence was assessed. */
  updatedAt: string;
  strengths: string[];
  concerns: string[];
  explanation: string;
}

export const CONFIDENCE_TEXT: Record<ApprovedResult["confidence"], string> = {
  High: "High confidence: the available evidence is strong, recent and consistent.",
  Moderate: "Moderate confidence: the evidence is reasonably consistent but less extensive or less recent.",
  Limited: "Limited confidence: the available evidence is thinner or less consistent, so treat this score as a rough guide.",
};

/**
 * The one public explanation. Deliberately names no source, count, rating,
 * weight or formula (those stay in Admin) and claims no hands-on testing.
 */
export const CONSENSUS_EXPLANATION =
  "HeyPsych Consensus Score is an independently developed, evidence-informed assessment that synthesizes multiple evaluation signals into a single score. Each assessment undergoes structured review and is accompanied by a confidence rating reflecting the strength and consistency of available evidence. Vendor payments do not influence scores.";

/** Published value -> public shape, or null if anything is missing or invalid. */
export function toPublicConsensus(slug: string, value: unknown): PublicConsensus | null {
  if (!isPilotSlug(slug) || !value || typeof value !== "object") return null;
  const v = value as { approval?: unknown; editorial?: unknown };
  const approval = ApprovalZ.safeParse(v.approval);
  const editorial = EditorialZ.safeParse(v.editorial);
  if (!approval.success || !editorial.success) return null;
  const { result } = approval.data;
  if (editorial.data.strengths.length === 0 && editorial.data.concerns.length === 0) return null;
  return {
    slug,
    score: result.score,
    confidence: result.confidence,
    updatedAt: result.asOf,
    strengths: editorial.data.strengths,
    concerns: editorial.data.concerns,
    explanation: CONSENSUS_EXPLANATION,
  };
}
