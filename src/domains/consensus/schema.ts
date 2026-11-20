/**
 * HeyPsych Consensus Score — record shapes.
 *
 * A consensus record is what Admin edits for one pilot product: private
 * source observations, original editorial summaries, and (once approved) a
 * frozen snapshot of the computed result. It is stored as a live revision
 * (kind "consensus", key = product slug) so it shares draft, publish,
 * unpublish, rollback and history with every other live update.
 *
 * Private: observations, URLs, per-source numbers and the calculation.
 * Public: only the projection in public.ts.
 */

import { z } from "zod";

/** The pilot. Adding a product is a reviewed code change. */
export const CONSENSUS_PILOT = ["simplepractice", "therapynotes", "mentalyc", "jane-app", "doxy-me"] as const;
export type ConsensusSlug = (typeof CONSENSUS_PILOT)[number];
export function isPilotSlug(slug: string): slug is ConsensusSlug {
  return (CONSENSUS_PILOT as readonly string[]).includes(slug);
}

export const SOURCE_TYPES = ["capterra", "g2", "trustradius", "software-advice", "getapp", "apple-app-store", "google-play", "other"] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

/** Public attribution names. */
export const SOURCE_LABELS: Record<SourceType, string> = {
  capterra: "Capterra",
  g2: "G2",
  trustradius: "TrustRadius",
  "software-advice": "Software Advice",
  getapp: "GetApp",
  "apple-app-store": "Apple App Store",
  "google-play": "Google Play",
  other: "Other independent source",
};

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const theme = z.string().trim().min(2).max(80);
const summary = z
  .string()
  .trim()
  .min(10, "At least 10 characters")
  .max(160, "At most 160 characters")
  .refine((s) => !/[<>]/.test(s), "No < or >");

export const ObservationZ = z
  .object({
    id: z.string().regex(/^[a-z0-9][a-z0-9-]{0,39}$/, "Lowercase letters, numbers and dashes"),
    source: z.enum(SOURCE_TYPES),
    /** Only for source "other": the publication's name, for attribution. */
    sourceName: z.string().trim().max(60).optional(),
    url: z
      .string()
      .url()
      .max(500)
      .refine((u) => u.startsWith("https://"), "https only"),
    /** The product name exactly as the source lists it. */
    listingName: z.string().trim().min(1).max(120),
    /** How certain the listing is this product (not a namesake or sibling). */
    match: z.enum(["exact", "probable", "mismatch"]),
    /** What the listing's reviews are about. */
    scope: z.enum(["full-product", "companion-app", "different-product"]),
    rating: z.number().min(0).max(10),
    ratingScale: z.union([z.literal(5), z.literal(10)]),
    reviewCount: z.number().int().min(0).max(10_000_000),
    observedAt: isoDate,
    acquisition: z.enum(["manual-public-page", "licensed-feed", "provided-by-source"]),
    permission: z.enum(["public-display-permitted", "licensed", "unclear", "prohibited"]),
    /** Reviewer-reported themes (user experience, not verified fact). Short labels in our own words. */
    themes: z.object({ positive: z.array(theme).max(8).default([]), negative: z.array(theme).max(8).default([]) }).default({ positive: [], negative: [] }),
    note: z.string().trim().max(500).optional(),
    excluded: z.boolean().default(false),
  })
  .refine((o) => o.rating <= o.ratingScale, { message: "Rating is above the scale", path: ["rating"] })
  .refine((o) => o.source !== "other" || Boolean(o.sourceName), { message: "Name the source", path: ["sourceName"] });

export type Observation = z.infer<typeof ObservationZ>;

export const EditorialZ = z.object({
  /** Original HeyPsych wording; at most three each. */
  strengths: z.array(summary).max(3).default([]),
  concerns: z.array(summary).max(3).default([]),
});
export type Editorial = z.infer<typeof EditorialZ>;

/** Frozen at approval; the only computed values the public ever sees. */
export const ApprovedResultZ = z.object({
  score: z.number().int().min(0).max(100),
  confidence: z.enum(["High", "Moderate", "Limited"]),
  sourceNames: z.array(z.string()).min(1).max(8),
  asOf: isoDate,
});
export type ApprovedResult = z.infer<typeof ApprovedResultZ>;

export const ApprovalZ = z.object({
  hash: z.string().regex(/^[a-f0-9]{64}$/),
  approvedAt: z.string(),
  author: z.string().max(60),
  algorithm: z.string(),
  result: ApprovedResultZ,
});
export type Approval = z.infer<typeof ApprovalZ>;

export const ConsensusRecordZ = z.object({
  observations: z.array(ObservationZ).max(30).default([]),
  editorial: EditorialZ.default({ strengths: [], concerns: [] }),
  approval: ApprovalZ.optional(),
});
export type ConsensusRecord = z.infer<typeof ConsensusRecordZ>;

export function emptyRecord(): ConsensusRecord {
  return { observations: [], editorial: { strengths: [], concerns: [] } };
}
