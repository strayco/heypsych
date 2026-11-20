/**
 * HeyPsych Consensus Score — the public projection.
 *
 * The only shape public pages receive. Built from the approval snapshot
 * frozen when an editor approved the record, never from observations, so no
 * source URL, per-source rating, review count, weight or theme can reach a
 * page, the data cache or the browser.
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
  sourceNames: string[];
  explanation: string;
}

export const CONFIDENCE_TEXT: Record<ApprovedResult["confidence"], string> = {
  High: "High confidence: several independent sources with many recent reviews that broadly agree.",
  Moderate: "Moderate confidence: more than one independent source, with fewer reviews or less recent evidence.",
  Limited: "Limited confidence: the evidence is thin or the sources disagree, so treat this score as a rough guide.",
};

export function explanationFor(sourceNames: string[]): string {
  const list = sourceNames.length > 1 ? `${sourceNames.slice(0, -1).join(", ")} and ${sourceNames.at(-1)}` : sourceNames[0];
  return `Combines overall ratings from ${sourceNames.length} independent review source${sourceNames.length === 1 ? "" : "s"} (${list}), weighted for review volume, recency and source quality. It reflects what reviewers report, not HeyPsych testing, and does not cover every review online. Vendors cannot pay to change it.`;
}

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
    sourceNames: result.sourceNames,
    explanation: explanationFor(result.sourceNames),
  };
}
