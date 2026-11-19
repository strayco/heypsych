/**
 * Live updates — resolving flags, copy and experiments.
 *
 * Pure: published rows in, a complete config out, with every key falling
 * back to its registry default. Unknown keys and out-of-range values are
 * ignored, so a stored value can never introduce a key the code doesn't know.
 */

import { COPY, EXPERIMENTS, FLAGS, type CopyKey, type ExperimentKey, type FlagKey } from "./registry";
import type { LiveRow } from "./apply-tools";

export interface FlagState {
  enabled: boolean;
  /** Percent of browsers that see it when enabled, 0-100. */
  rollout: number;
}

export interface ExperimentState {
  active: boolean;
  variants: { id: string; value: string }[];
}

export interface LiveConfig {
  version: string;
  flags: Record<FlagKey, FlagState>;
  copy: Record<CopyKey, string>;
  experiments: Record<ExperimentKey, ExperimentState>;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === "object" && !Array.isArray(v);
}

export function validateFlagValue(value: unknown): FlagState | null {
  if (!isObject(value) || typeof value.enabled !== "boolean") return null;
  const rollout = value.rollout === undefined ? 100 : value.rollout;
  if (typeof rollout !== "number" || !Number.isInteger(rollout) || rollout < 0 || rollout > 100) return null;
  return { enabled: value.enabled, rollout };
}

export function validateCopyValue(key: string, value: unknown): string | null {
  const def = COPY.find((c) => c.key === key);
  if (!def || !isObject(value) || typeof value.text !== "string") return null;
  const text = value.text.replace(/\s+/g, " ").trim();
  if (!text || text.length > def.maxLength || /[<>]/.test(text)) return null;
  return text;
}

export function validateExperimentValue(value: unknown): { active: boolean } | null {
  return isObject(value) && typeof value.active === "boolean" ? { active: value.active } : null;
}

export function resolveConfig(rows: LiveRow[], version: string): LiveConfig {
  const flags = Object.fromEntries(FLAGS.map((f) => [f.key, { enabled: f.default, rollout: 100 }])) as Record<FlagKey, FlagState>;
  const copy = Object.fromEntries(COPY.map((c) => [c.key, c.default])) as Record<CopyKey, string>;
  const experiments = Object.fromEntries(EXPERIMENTS.map((e) => [e.key, { active: false, variants: e.variants.map((v) => ({ ...v })) }])) as Record<ExperimentKey, ExperimentState>;

  for (const row of rows) {
    if (row.value === null || row.value === undefined) continue;
    if (row.kind === "flag" && row.key in flags) {
      const v = validateFlagValue(row.value);
      if (v) flags[row.key as FlagKey] = v;
    } else if (row.kind === "copy" && row.key in copy) {
      const v = validateCopyValue(row.key, row.value);
      if (v) copy[row.key as CopyKey] = v;
    } else if (row.kind === "experiment" && row.key in experiments) {
      const v = validateExperimentValue(row.value);
      if (v) experiments[row.key as ExperimentKey].active = v.active;
    }
  }
  return { version, flags, copy, experiments };
}

/** FNV-1a: small, fast, stable across browsers. */
export function hash32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** 0-99, stable for a browser id and a key. */
export function bucketOf(browserId: string, key: string): number {
  return hash32(`${browserId}:${key}`) % 100;
}

export function flagOn(state: FlagState, browserId: string | null, key: string): boolean {
  if (!state.enabled) return false;
  if (state.rollout >= 100) return true;
  if (state.rollout <= 0 || !browserId) return false;
  return bucketOf(browserId, key) < state.rollout;
}

/** Variant for a browser: stable, evenly split; control when inactive or unknown. */
export function variantOf(state: ExperimentState, browserId: string | null, key: string): { id: string; value: string } {
  if (!state.active || !browserId || state.variants.length === 0) return state.variants[0];
  return state.variants[hash32(`${browserId}:exp:${key}`) % state.variants.length];
}
