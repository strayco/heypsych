/**
 * Live updates — applying published tool changes to the catalog.
 *
 * Pure. The reviewed JSON records in data/tools-v4 are the baseline; a
 * published overlay replaces only allow-listed fields (registry.ts), and the
 * result must pass the same strict schema the files pass. If it does not, the
 * file version is kept and the error is reported: a bad edit can never take
 * a tool off the site or put invalid data on it.
 */

import { ClinicianToolV4Z, type ClinicianToolV4 } from "@/lib/schemas/clinician-tool-v4";
import { TOOL_EDITABLE_FIELDS } from "./registry";

export interface LiveRow {
  kind: string;
  key: string;
  value: unknown;
  id?: number;
  published_at?: string | null;
}

export interface AppliedTools {
  tools: ClinicianToolV4[];
  /** Slugs of tools created in Admin (not in data/). */
  createdSlugs: Set<string>;
  /** Slugs whose overlay was applied. */
  overriddenSlugs: Set<string>;
  errors: { key: string; error: string }[];
}

const EDITABLE = new Set<string>(TOOL_EDITABLE_FIELDS);

function isObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

/** Only allow-listed fields survive. */
export function pickEditable(value: unknown): Record<string, unknown> {
  if (!isObject(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([k]) => EDITABLE.has(k)));
}

function summarise(issues: { path: PropertyKey[]; message: string }[]): string {
  return issues
    .slice(0, 3)
    .map((i) => `${i.path.map(String).join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}

/** Validate one overlay against its base record. */
export function validateToolOverlay(base: ClinicianToolV4, overlay: unknown): { ok: true; tool: ClinicianToolV4 } | { ok: false; error: string } {
  const picked = pickEditable(overlay);
  if (Object.keys(picked).length === 0) return { ok: false, error: "No editable fields in this change" };
  const result = ClinicianToolV4Z.safeParse({ ...base, ...picked });
  if (!result.success) return { ok: false, error: summarise(result.error.issues) };
  return { ok: true, tool: result.data };
}

/** Validate a tool created in Admin. */
export function validateNewTool(key: string, value: unknown, existing: ReadonlySet<string>): { ok: true; tool: ClinicianToolV4 } | { ok: false; error: string } {
  const result = ClinicianToolV4Z.safeParse(value);
  if (!result.success) return { ok: false, error: summarise(result.error.issues) };
  if (result.data.slug !== key) return { ok: false, error: `Slug must be "${key}"` };
  if (existing.has(key)) return { ok: false, error: `A tool with slug "${key}" already exists in the reviewed catalog` };
  return { ok: true, tool: result.data };
}

export function applyToolOverlays(base: ClinicianToolV4[], rows: LiveRow[]): AppliedTools {
  const bySlug = new Map(base.map((t) => [t.slug, t]));
  const baseSlugs = new Set(bySlug.keys());
  const overriddenSlugs = new Set<string>();
  const createdSlugs = new Set<string>();
  const errors: AppliedTools["errors"] = [];

  for (const row of rows) {
    if (row.kind !== "tool" || row.value === null || row.value === undefined) continue;
    const tool = bySlug.get(row.key);
    if (!tool) {
      errors.push({ key: row.key, error: "No reviewed record with this slug" });
      continue;
    }
    const result = validateToolOverlay(tool, row.value);
    if (result.ok) {
      bySlug.set(row.key, result.tool);
      overriddenSlugs.add(row.key);
    } else errors.push({ key: row.key, error: result.error });
  }

  const created: ClinicianToolV4[] = [];
  for (const row of rows) {
    if (row.kind !== "tool-new" || row.value === null || row.value === undefined) continue;
    const result = validateNewTool(row.key, row.value, baseSlugs);
    if (result.ok) {
      created.push(result.tool);
      createdSlugs.add(row.key);
    } else errors.push({ key: row.key, error: result.error });
  }

  const tools = [...base.map((t) => bySlug.get(t.slug)!), ...created];
  return { tools, createdSlugs, overriddenSlugs, errors };
}

/** A stable version string for a set of published rows: changes whenever anything is published. */
export function liveVersion(rows: LiveRow[]): string {
  if (rows.length === 0) return "0";
  return rows
    .map((r) => r.id ?? 0)
    .sort((a, b) => a - b)
    .join(".")
    .slice(-64);
}
