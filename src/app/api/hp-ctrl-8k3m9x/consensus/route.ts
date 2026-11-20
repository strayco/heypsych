/**
 * HeyPsych Admin — Consensus Score API (pilot products only).
 *
 * GET  ?slug=<pilot slug>   one product: draft, published, live calculation, history
 * GET  (no slug)            pilot overview
 * POST { action, slug, record?, note?, revisionId? }
 *      save-draft | approve | publish | unpublish | rollback | discard
 *
 * Rules:
 *  - Saving evidence or summaries always clears approval.
 *  - Approve scores the draft now and freezes the result. A withheld score or
 *    missing strengths/concerns cannot be approved.
 *  - Publish requires an approval that matches the draft exactly and was made
 *    with the current algorithm.
 *  - Unpublish publishes "nothing" (the score disappears); rollback restores an
 *    earlier published revision. All keep append-only history.
 *  - After each, the affected public pages are re-rendered before responding,
 *    so the first visitor afterwards does not see the previous state.
 *
 * Same session, CSRF and size guard as the other live-update routes. Responses
 * contain private evidence and are never cached. Public pages never call this.
 */

import { NextRequest } from "next/server";
import { revalidateTag } from "next/cache";
import { dbConfigured, guard, json } from "@/lib/live/admin-guard";
import { TAG_CONSENSUS } from "@/lib/live/state";
import { LiveError, discardDraft, history, publishDraft, publishValue, rollbackTo, saveDraft, type Revision } from "@/lib/live/store";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import { clinicianToolPath } from "@/lib/tools/category-hub-slug";
import { getAllPublishableCurated } from "@/lib/tools/curated-comparisons";
import { warmPaths } from "@/lib/live/warm";
import { CONSENSUS_PILOT, ConsensusRecordZ, isPilotSlug, type ConsensusRecord } from "@/domains/consensus/schema";
import { ALGORITHM, approvalIsCurrent, contentHash, parseRecord, projectConsensusRows, scoreRecord } from "@/domains/consensus/server";

export const dynamic = "force-dynamic";

const KIND = "consensus" as const;

/**
 * Invalidate, then render every public page that shows this product's score
 * so no visitor receives the stale version (see warm.ts).
 */
async function revalidate(request: NextRequest, slug: string) {
  revalidateTag(TAG_CONSENSUS, "max");
  const tool = await ClinicianToolService.getBaseTool(slug);
  const profile = tool ? clinicianToolPath(tool) : null;
  const comparisons = (await getAllPublishableCurated()).filter((c) => c.tools.includes(slug)).map((c) => `/tools/compare/${c.slug}`);
  const paths = [...(profile ? [profile] : []), ...comparisons, "/architect"];
  return warmPaths(request.nextUrl.origin, paths);
}

async function revisions(slug: string): Promise<Revision[]> {
  return history(KIND, slug, 100);
}

function describe(rev: Revision | undefined) {
  if (!rev) return null;
  const record = parseRecord(rev.value);
  return {
    revision: { id: rev.id, status: rev.status, note: rev.note, created_at: rev.created_at, published_at: rev.published_at, restores: rev.restores },
    empty: rev.value === null,
    record,
    approvalCurrent: approvalIsCurrent(record),
    hash: contentHash(record),
  };
}

function issues(error: { issues: { path: PropertyKey[]; message: string }[] }): string {
  return error.issues
    .slice(0, 4)
    .map((i) => `${i.path.map(String).join(".") || "record"}: ${i.message}`)
    .join("; ");
}

function migrationHint(error: unknown): never {
  if ((error as { code?: string }).code === "23514") throw new LiveError("The database needs migration 048 (consensus) before records can be saved", 503);
  throw error;
}

export async function GET(request: NextRequest) {
  const denied = await guard(request, false);
  if (denied) return denied;
  if (!dbConfigured()) return json({ error: "Database not configured" }, 503);
  try {
    const slug = request.nextUrl.searchParams.get("slug");
    if (!slug) {
      const products = await Promise.all(
        CONSENSUS_PILOT.map(async (s) => {
          const [tool, revs] = await Promise.all([ClinicianToolService.getBaseTool(s), revisions(s)]);
          const draft = revs.find((r) => r.status === "draft");
          const published = revs.find((r) => r.status === "published");
          const pub = published && published.value !== null ? projectConsensusRows([{ key: s, value: published.value }])[0] ?? null : null;
          const draftRecord = draft ? parseRecord(draft.value) : null;
          return {
            slug: s,
            name: tool?.name ?? s,
            category: tool?.primary_category ?? null,
            observations: draftRecord?.observations.length ?? (published ? parseRecord(published.value).observations.length : 0),
            draft: Boolean(draft),
            draftApproved: draftRecord ? approvalIsCurrent(draftRecord) : false,
            published: pub ? { score: pub.score, confidence: pub.confidence, updatedAt: pub.updatedAt } : null,
          };
        })
      );
      return json({ products, algorithm: ALGORITHM });
    }
    if (!isPilotSlug(slug)) return json({ error: "Not a pilot product" }, 404);
    const [tool, revs] = await Promise.all([ClinicianToolService.getBaseTool(slug), revisions(slug)]);
    const draft = describe(revs.find((r) => r.status === "draft"));
    const published = describe(revs.find((r) => r.status === "published"));
    const working = draft?.record ?? published?.record ?? parseRecord(null);
    return json({
      slug,
      name: tool?.name ?? slug,
      algorithm: ALGORITHM,
      draft,
      published,
      publicView: published && !published.empty ? projectConsensusRows([{ key: slug, value: published.record }])[0] ?? null : null,
      calculation: scoreRecord(working),
      history: revs
        .filter((r) => r.status !== "draft")
        .map((r) => {
          const rec = parseRecord(r.value);
          return {
            id: r.id,
            status: r.status,
            note: r.note,
            created_at: r.created_at,
            published_at: r.published_at,
            restores: r.restores,
            empty: r.value === null,
            score: rec.approval?.result.score ?? null,
            confidence: rec.approval?.result.confidence ?? null,
            observations: rec.observations.length,
          };
        }),
    });
  } catch (error) {
    if (error instanceof LiveError) return json({ error: error.message }, error.status);
    console.error("[admin/consensus] GET failed", error);
    return json({ error: "Could not load consensus records" }, 500);
  }
}

export async function POST(request: NextRequest) {
  const denied = await guard(request, true);
  if (denied) return denied;
  if (!dbConfigured()) return json({ error: "Database not configured" }, 503);

  let body: { action?: string; slug?: string; record?: unknown; note?: string; revisionId?: number };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const { action, slug } = body;
  if (typeof slug !== "string" || !isPilotSlug(slug)) return json({ error: "Not a pilot product" }, 404);
  const note = typeof body.note === "string" ? body.note.slice(0, 500) : null;

  try {
    const revs = await revisions(slug);
    const draftRev = revs.find((r) => r.status === "draft");

    switch (action) {
      case "save-draft": {
        const parsed = ConsensusRecordZ.safeParse(body.record);
        if (!parsed.success) return json({ error: issues(parsed.error) }, 422);
        const ids = parsed.data.observations.map((o) => o.id);
        if (new Set(ids).size !== ids.length) return json({ error: "Each observation needs a unique id" }, 422);
        // Any edit clears approval: an editor must approve exactly what will publish.
        const record: ConsensusRecord = { observations: parsed.data.observations, editorial: parsed.data.editorial };
        const revision = await saveDraft(KIND, slug, record, note ?? "Draft saved", "admin").catch(migrationHint);
        return json({ revision: describe(revision) });
      }
      case "approve": {
        if (!draftRev) return json({ error: "Save a draft first" }, 409);
        const record = parseRecord(draftRev.value);
        const result = scoreRecord(record);
        if (result.status !== "scored" || result.score === null || result.confidence === null) {
          return json({ error: `Score is withheld: ${result.rationale.join(" ")}` }, 409);
        }
        if (record.editorial.strengths.length === 0 || record.editorial.concerns.length === 0) {
          return json({ error: "Add at least one strength and one concern before approving" }, 409);
        }
        const approved: ConsensusRecord = {
          observations: record.observations,
          editorial: record.editorial,
          approval: {
            hash: contentHash(record),
            approvedAt: new Date().toISOString(),
            author: "admin",
            algorithm: ALGORITHM,
            result: { score: result.score, confidence: result.confidence, sourceNames: result.sourceNames, asOf: result.asOf },
          },
        };
        const revision = await saveDraft(KIND, slug, approved, note ?? `Approved: ${result.score}/100, ${result.confidence}`, "admin");
        return json({ revision: describe(revision) });
      }
      case "publish": {
        if (!draftRev) return json({ error: "There is no draft to publish" }, 409);
        const record = parseRecord(draftRev.value);
        if (!approvalIsCurrent(record)) return json({ error: "Approve this draft before publishing" }, 409);
        if (record.approval!.algorithm !== ALGORITHM) return json({ error: "Approved with an older algorithm; approve again" }, 409);
        const revision = await publishDraft(KIND, slug);
        const warmed = await revalidate(request, slug);
        return json({ revision: describe(revision), warmed });
      }
      case "unpublish": {
        if (!revs.some((r) => r.status === "published" && r.value !== null)) return json({ error: "Nothing is published" }, 409);
        const revision = await publishValue(KIND, slug, null, note ?? "Unpublished", "admin");
        const warmed = await revalidate(request, slug);
        return json({ revision: describe(revision), warmed });
      }
      case "rollback": {
        if (typeof body.revisionId !== "number") return json({ error: "revisionId required" }, 400);
        const target = revs.find((r) => r.id === body.revisionId);
        if (!target) return json({ error: "Not a revision of this product" }, 404);
        if (target.value !== null && !approvalIsCurrent(parseRecord(target.value))) return json({ error: "That revision was never approved" }, 409);
        const revision = await rollbackTo(target.id, "admin");
        const warmed = await revalidate(request, slug);
        return json({ revision: describe(revision), warmed });
      }
      case "discard":
        return json({ discarded: await discardDraft(KIND, slug) });
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (error) {
    if (error instanceof LiveError) return json({ error: error.message }, error.status);
    console.error("[admin/consensus] POST failed", error);
    return json({ error: "Could not save the change" }, 500);
  }
}
