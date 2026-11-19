/**
 * Live updates — public reads, cached.
 *
 * Cost model (zero extra recurring cost):
 *  - Published rows are read through Next's data cache with no time-based
 *    expiry. The database is queried only after a publish invalidates the tag
 *    (or once on a cold cache). No polling, no cron, no client fetches.
 *  - Two tags, so a price change only invalidates tool pages and Practice
 *    Architect, and a flag or copy change only the pages that use config:
 *      hp-live-tools   tool overlays and tools created in Admin
 *      hp-live-config  flags, approved copy, experiments
 *  - Admin preview uses Next's draft mode: only a signed-in admin's browser
 *    renders drafts, uncached; everyone else gets the cached published state.
 *
 * Resilience: if the database is unreachable, the committed snapshot in
 * data/live/published.json is used (not cached, so recovery is automatic),
 * and further attempts pause for a minute so an outage can't slow pages.
 */

import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { LiveKind } from "./registry";
import { liveVersion, type LiveRow } from "./apply-tools";
import { resolveConfig, type LiveConfig } from "./config";

export const TAG_TOOLS = "hp-live-tools";
export const TAG_CONFIG = "hp-live-config";

const TOOL_KINDS: LiveKind[] = ["tool", "tool-new"];
const CONFIG_KINDS: LiveKind[] = ["flag", "copy", "experiment"];
const QUERY_TIMEOUT_MS = 3000;
const BREAKER_MS = 60_000;

export interface LiveRows {
  rows: LiveRow[];
  version: string;
  source: "database" | "snapshot" | "preview";
}

let breakerUntil = 0;

function dbConfigured(): boolean {
  if (!(process.env.SUPABASE_DB_URL || process.env.DATABASE_URL)) return false;
  if (process.env.NEXT_PHASE === "phase-production-build" && process.env.SKIP_DB_DURING_BUILD === "true") return false;
  return true;
}

function snapshot(kinds: LiveKind[]): LiveRows {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("fs") as typeof import("fs");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require("path") as typeof import("path");
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/live/published.json"), "utf8")) as { rows?: LiveRow[] };
    const rows = (raw.rows ?? []).filter((r) => kinds.includes(r.kind as LiveKind));
    return { rows, version: `s${liveVersion(rows)}`, source: "snapshot" };
  } catch {
    return { rows: [], version: "s0", source: "snapshot" };
  }
}

async function query(kinds: LiveKind[], includeDrafts = false): Promise<LiveRow[]> {
  const { readPublished } = await import("./store");
  return Promise.race([
    readPublished(kinds, { includeDrafts }),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error("live store timeout")), QUERY_TIMEOUT_MS)),
  ]);
}

const cachedTools = unstable_cache(async (): Promise<LiveRow[]> => query(TOOL_KINDS), ["hp-live", "tools", "v1"], { tags: [TAG_TOOLS], revalidate: false });
const cachedConfig = unstable_cache(async (): Promise<LiveRow[]> => query(CONFIG_KINDS), ["hp-live", "config", "v1"], { tags: [TAG_CONFIG], revalidate: false });

/** True only inside a request from a browser in draft mode (an admin previewing). */
async function previewing(): Promise<boolean> {
  try {
    const { draftMode } = await import("next/headers");
    return (await draftMode()).isEnabled;
  } catch {
    return false; // build time, scripts, tests: no request scope
  }
}

async function read(kinds: LiveKind[], cached: () => Promise<LiveRow[]>): Promise<LiveRows> {
  if (!dbConfigured()) return snapshot(kinds);
  if (await previewing()) {
    try {
      const rows = await query(kinds, true);
      return { rows, version: `p${Date.now()}`, source: "preview" };
    } catch {
      return snapshot(kinds);
    }
  }
  if (Date.now() < breakerUntil) return snapshot(kinds);
  try {
    const rows = await cached();
    return { rows, version: liveVersion(rows), source: "database" };
  } catch (error) {
    breakerUntil = Date.now() + BREAKER_MS;
    console.error("[live] store unavailable, using snapshot:", error instanceof Error ? error.message : error);
    return snapshot(kinds);
  }
}

/** Published tool overlays and Admin-created tools. Deduped per request. */
export const getLiveTools = cache(async (): Promise<LiveRows> => read(TOOL_KINDS, cachedTools));

/** Resolved flags, copy and experiments, with code defaults for anything unpublished. */
export const getLiveConfig = cache(async (): Promise<LiveConfig> => {
  const { rows, version } = await read(CONFIG_KINDS, cachedConfig);
  return resolveConfig(rows, version);
});
