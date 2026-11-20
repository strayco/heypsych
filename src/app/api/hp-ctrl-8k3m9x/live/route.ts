/**
 * HeyPsych Admin — live updates API.
 *
 * GET  ?view=overview | tool&slug= | history&kind=&key=
 * POST { action, kind, key, value?, note?, revisionId? }
 *
 * Security: the existing admin session (signed HttpOnly cookie, fails closed
 * without ADMIN_PASSWORD); same-origin check on every write (CSRF); 256 KB
 * body cap; every value validated against the registry and the V4 schema
 * before it is stored. Never cached.
 *
 * Publishing invalidates only the affected cache tag. Pages refresh on their
 * next request (no rebuild, no deployment, no background jobs).
 */

import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { draftMode } from "next/headers";
import { dbConfigured, guard, json } from "@/lib/live/admin-guard";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import { applyToolOverlays, validateNewTool, validateToolOverlay, pickEditable } from "@/lib/live/apply-tools";
import { validateCopyValue, validateExperimentValue, validateFlagValue } from "@/lib/live/config";
import { COPY, EXPERIMENTS, FLAGS, TOOL_EDITABLE_FIELDS, TOOL_LOCKED_FIELDS, copyDef, experimentDef, flagDef, type LiveKind } from "@/lib/live/registry";
import { TAG_CONFIG, TAG_CONSENSUS, TAG_TOOLS } from "@/lib/live/state";
import {
  LiveError,
  discardDraft,
  history,
  listDrafts,
  listPublished,
  publishDraft,
  publishValue,
  readPublished,
  rollbackTo,
  saveDraft,
} from "@/lib/live/store";

export const dynamic = "force-dynamic";

// Consensus records are edited only through /api/hp-ctrl-8k3m9x/consensus (approval rules).
const KINDS: LiveKind[] = ["tool", "tool-new", "flag", "copy", "experiment"];

/** Validate a value for storage. Returns the value to store (null = revert to file / default). */
async function validate(kind: LiveKind, key: string, value: unknown): Promise<unknown> {
  if (value === null) return null;
  switch (kind) {
    case "tool": {
      const base = await ClinicianToolService.getBaseTool(key);
      if (!base) throw new LiveError(`No reviewed tool "${key}"`, 404);
      const picked = pickEditable(value);
      const result = validateToolOverlay(base, picked);
      if (!result.ok) throw new LiveError(result.error, 422);
      // Store only fields that differ from the reviewed record.
      const changed = Object.fromEntries(
        Object.entries(picked).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify((base as Record<string, unknown>)[k]))
      );
      if (Object.keys(changed).length === 0) throw new LiveError("Nothing differs from the reviewed record", 422);
      return changed;
    }
    case "tool-new": {
      const base = await ClinicianToolService.getBaseTools();
      const result = validateNewTool(key, value, new Set(base.map((t) => t.slug)));
      if (!result.ok) throw new LiveError(result.error, 422);
      return result.tool;
    }
    case "flag": {
      if (!flagDef(key)) throw new LiveError("Unknown flag", 404);
      const v = validateFlagValue(value);
      if (!v) throw new LiveError("A flag needs enabled (true/false) and rollout 0-100", 422);
      return v;
    }
    case "copy": {
      if (!copyDef(key)) throw new LiveError("Unknown copy key", 404);
      const text = validateCopyValue(key, value);
      if (!text) throw new LiveError(`Copy must be 1-${copyDef(key)!.maxLength} characters, without < or >`, 422);
      return { text };
    }
    case "experiment": {
      if (!experimentDef(key)) throw new LiveError("Unknown experiment", 404);
      const v = validateExperimentValue(value);
      if (!v) throw new LiveError("An experiment needs active (true/false)", 422);
      return v;
    }
    default:
      throw new LiveError("Not editable here", 400);
  }
}

/**
 * The catalog as published right now, read from the database without the data
 * cache. Public pages read through a stale-while-revalidate cache that lags one
 * request after a publish; the editor must not, or an admin could start from
 * the previous values and silently revert a published change on the next save.
 * Admin-only, so the uncached read costs nothing measurable.
 */
async function freshCatalog() {
  const [base, rows] = await Promise.all([ClinicianToolService.getBaseTools(), readPublished(["tool", "tool-new"])]);
  return { base, ...applyToolOverlays(base, rows) };
}

function revalidate(kind: LiveKind) {
  if (kind === "tool" || kind === "tool-new") {
    // Stale-while-revalidate, not hard expiry. Tool data feeds routes built with
    // dynamicParams = false (e.g. /tools/compare/[slug]); a hard-expired entry on
    // such a route is treated as "not prerendered" and answers 404. With "max" the
    // first request after publishing may still see the previous page while it
    // regenerates in the background; every later request sees the new price.
    revalidateTag(TAG_TOOLS, "max");
  } else if (kind === "consensus") {
    // Consensus Scores appear on tool profiles and compare pages (dynamicParams
    // = false), so stale-while-revalidate for the same reason as tools.
    revalidateTag(TAG_CONSENSUS, "max");
  } else {
    // Flags and copy are read only by "/" and "/architect" (neither uses
    // dynamicParams = false), so they can expire immediately.
    revalidateTag(TAG_CONFIG, { expire: 0 });
  }
}

export async function GET(request: NextRequest) {
  const denied = await guard(request, false);
  if (denied) return denied;
  if (!dbConfigured()) return json({ error: "Database not configured" }, 503);

  const view = request.nextUrl.searchParams.get("view") ?? "overview";
  try {
    if (view === "tool") {
      const slug = request.nextUrl.searchParams.get("slug") ?? "";
      const base = await ClinicianToolService.getBaseTool(slug);
      const catalog = await freshCatalog();
      const effective = catalog.tools.find((t) => t.slug === slug) ?? null;
      const kind: LiveKind = base ? "tool" : "tool-new";
      return json({ base, effective, kind, history: await history(kind, slug, 50), editable: TOOL_EDITABLE_FIELDS, locked: TOOL_LOCKED_FIELDS });
    }
    if (view === "history") {
      const kind = request.nextUrl.searchParams.get("kind") as LiveKind | null;
      const key = request.nextUrl.searchParams.get("key");
      return json({ history: await history(kind && KINDS.includes(kind) ? kind : undefined, key ?? undefined, 200) });
    }
    if (view === "snapshot") {
      const published = await listPublished();
      const body = {
        note: "Fallback copy of published live updates, used only if the database cannot be reached. Exported from HeyPsych Admin.",
        exportedAt: new Date().toISOString(),
        // Consensus records hold private evidence and are never exported.
        rows: published.filter((r) => r.kind !== "consensus").map((r) => ({ id: r.id, kind: r.kind, key: r.key, value: r.value })),
      };
      return new NextResponse(JSON.stringify(body, null, 2), {
        headers: { "Content-Type": "application/json", "Content-Disposition": 'attachment; filename="published.json"', "Cache-Control": "no-store" },
      });
    }

    const [catalog, drafts, published, recent] = await Promise.all([
      freshCatalog(),
      listDrafts(),
      listPublished(),
      history(undefined, undefined, 40),
    ]);
    const tools = catalog.tools;
    const baseSlugs = new Set(catalog.base.map((t) => t.slug));
    const live = { overridden: [...catalog.overriddenSlugs], errors: catalog.errors };
    const publishable = new Set((await ClinicianToolService.loadClinicianTools()).map((t) => t.slug));
    return json({
      tools: tools
        .map((t) => ({
          slug: t.slug,
          name: t.name,
          category: t.primary_category,
          price: t.pricing?.starting_price_display ?? null,
          priceVerified: t.pricing?.last_verified ?? null,
          status: t.status,
          public: publishable.has(t.slug),
          created: !baseSlugs.has(t.slug),
          overridden: live.overridden.includes(t.slug),
          draft: drafts.some((d) => (d.kind === "tool" || d.kind === "tool-new") && d.key === t.slug),
        }))
        .sort((a, b) => Number(b.public) - Number(a.public) || a.name.localeCompare(b.name)),
      liveErrors: live.errors,
      // Consensus records are managed on their own screen.
      drafts: drafts.filter((r) => r.kind !== "consensus"),
      published: published.filter((r) => r.kind !== "consensus"),
      recent: recent.filter((r) => r.kind !== "consensus"),
      registry: { flags: FLAGS, copy: COPY, experiments: EXPERIMENTS },
    });
  } catch (error) {
    if (error instanceof LiveError) return json({ error: error.message }, error.status);
    console.error("[admin/live] GET failed", error);
    return json({ error: "Could not load live updates" }, 500);
  }
}

export async function POST(request: NextRequest) {
  const denied = await guard(request, true);
  if (denied) return denied;

  let body: { action?: string; kind?: LiveKind; key?: string; value?: unknown; note?: string; revisionId?: number };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const { action, kind, key } = body;
  const note = typeof body.note === "string" ? body.note.slice(0, 500) : null;

  try {
    if (action === "preview-on" || action === "preview-off") {
      const dm = await draftMode();
      if (action === "preview-on") dm.enable();
      else dm.disable();
      return json({ preview: action === "preview-on" });
    }
    if (!dbConfigured()) return json({ error: "Database not configured" }, 503);

    if (action === "rollback") {
      if (typeof body.revisionId !== "number") return json({ error: "revisionId required" }, 400);
      const revision = await rollbackTo(body.revisionId, "admin");
      revalidate(revision.kind);
      return json({ revision });
    }

    if (!kind || !KINDS.includes(kind) || typeof key !== "string" || !/^[a-z0-9][a-z0-9.-]{0,119}$/.test(key)) {
      return json({ error: "kind and key required" }, 400);
    }

    switch (action) {
      case "save-draft": {
        const value = await validate(kind, key, body.value ?? null);
        return json({ revision: await saveDraft(kind, key, value, note, "admin") });
      }
      case "publish": {
        const revision = await publishDraft(kind, key);
        revalidate(kind);
        return json({ revision });
      }
      case "publish-value": {
        const value = await validate(kind, key, body.value ?? null);
        const revision = await publishValue(kind, key, value, note, "admin");
        revalidate(kind);
        return json({ revision });
      }
      case "discard": {
        return json({ discarded: await discardDraft(kind, key) });
      }
      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (error) {
    if (error instanceof LiveError) return json({ error: error.message }, error.status);
    console.error("[admin/live] POST failed", error);
    return json({ error: "Could not save the change" }, 500);
  }
}
