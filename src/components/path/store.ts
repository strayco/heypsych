"use client";

/**
 * Your Path — the browser store
 *
 * One view over everything a visitor keeps on HeyPsych, all of it in this
 * browser only (decision D-012). Nothing here makes a network request.
 *
 *   hp:path            conditions, treatments, the kept next step, own questions
 *   hp:noticed         "I've noticed this" on symptom pages (existing key)
 *   hp:saved-apps      saved apps (existing key)
 *   hp:selfhelp:<slug> self-help ticked on a condition page (existing keys)
 *
 * Existing keys keep their owners and formats, so the islands that write them
 * keep working unchanged; this store reads them and, where the workspace
 * edits them, writes the same format back.
 */

import { useCallback, useEffect, useState } from "react";
import {
  EMPTY_PATH,
  parseApps,
  parseNoticed,
  parsePath,
  parseTried,
  pathCount,
  type PathDocument,
  type PathNoticed,
  type PathSnapshot,
  type PathTried,
} from "@/domains/path";

export const PATH_KEY = "hp:path";
export const NOTICED_KEY = "hp:noticed";
export const APPS_KEY = "hp:saved-apps";
export const SELFHELP_PREFIX = "hp:selfhelp:";
/** Fired on window after any write to a store the path reads. */
export const PATH_EVENT = "hp:path-change";
const APPS_EVENT = "hp:saved-apps-change";

const EMPTY_SNAPSHOT: PathSnapshot = { ...EMPTY_PATH, noticed: [], apps: [], tried: [] };

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

function get(key: string): string | null {
  try {
    return storage()?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function set(key: string, value: string | null): boolean {
  const s = storage();
  if (!s) return false;
  try {
    if (value === null) s.removeItem(key);
    else s.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function triedKeys(): string[] {
  const s = storage();
  if (!s) return [];
  const keys: string[] = [];
  try {
    for (let i = 0; i < s.length; i += 1) {
      const key = s.key(i);
      if (key?.startsWith(SELFHELP_PREFIX)) keys.push(key);
    }
  } catch {
    return [];
  }
  return keys.sort();
}

export function readSnapshot(): PathSnapshot {
  const doc = parsePath(get(PATH_KEY));
  const tried = triedKeys()
    .map((key) => parseTried(key.slice(SELFHELP_PREFIX.length), get(key)))
    .filter((t): t is PathTried => Boolean(t));
  return { ...doc, noticed: parseNoticed(get(NOTICED_KEY)), apps: parseApps(get(APPS_KEY)), tried };
}

export function announce() {
  try {
    window.dispatchEvent(new CustomEvent(PATH_EVENT));
  } catch {
    // Non-browser environment.
  }
}

/** Write the path document. Returns false when the browser refuses storage. */
export function writePath(doc: PathDocument): boolean {
  const ok = set(PATH_KEY, JSON.stringify(doc));
  announce();
  return ok;
}

export function writeNoticed(list: PathNoticed[]): boolean {
  const ok = set(NOTICED_KEY, list.length ? JSON.stringify(list) : null);
  announce();
  return ok;
}

export function writeApps(list: { slug: string; name: string }[]): boolean {
  const ok = set(APPS_KEY, list.length ? JSON.stringify(list) : null);
  try {
    window.dispatchEvent(new CustomEvent(APPS_EVENT, { detail: list }));
  } catch {
    // ignore
  }
  announce();
  return ok;
}

export function clearTried(conditionSlug: string) {
  set(`${SELFHELP_PREFIX}${conditionSlug}`, null);
  announce();
}

/** Forget everything the path reads, in this browser. */
export function clearEverything() {
  set(PATH_KEY, null);
  set("hp:path-visit", null);
  set(NOTICED_KEY, null);
  set(APPS_KEY, null);
  for (const key of triedKeys()) set(key, null);
  try {
    window.dispatchEvent(new CustomEvent(APPS_EVENT, { detail: [] }));
  } catch {
    // ignore
  }
  announce();
}

/** True when storage is usable, so the UI can say so honestly when it is not. */
export function storageAvailable(): boolean {
  const probe = "__hp_path_probe__";
  if (!set(probe, "1")) return false;
  set(probe, null);
  return true;
}

/**
 * Live snapshot of the path. Renders an empty, not-ready snapshot on the
 * server and on the first client render (so hydration always matches), then
 * reads storage in an effect.
 */
export function usePath() {
  const [snapshot, setSnapshot] = useState<PathSnapshot>(EMPTY_SNAPSHOT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const refresh = () => setSnapshot(readSnapshot());
    refresh();
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === PATH_KEY || e.key === NOTICED_KEY || e.key === APPS_KEY || e.key.startsWith(SELFHELP_PREFIX)) refresh();
    };
    window.addEventListener(PATH_EVENT, refresh);
    window.addEventListener(APPS_EVENT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(PATH_EVENT, refresh);
      window.removeEventListener(APPS_EVENT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  /** Apply a change to the path document, reading the latest stored value first. */
  const update = useCallback((change: (doc: PathDocument) => PathDocument): boolean => {
    const current = parsePath(get(PATH_KEY));
    return writePath(change(current));
  }, []);

  return { snapshot, ready, count: pathCount(snapshot), update };
}

const VISIT_KEY = "hp:path-visit";

/** Local calendar date, YYYY-MM-DD. */
export function todayIso(now = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

/**
 * Record a visit to the workspace. Returns whole days since the previous
 * visit, or null on the first. Kept in this browser only.
 */
export function recordVisit(): number | null {
  const today = todayIso();
  const last = get(VISIT_KEY);
  set(VISIT_KEY, today);
  if (!last || !/^\d{4}-\d{2}-\d{2}$/.test(last) || last === today) return last === today ? 0 : null;
  const utc = (s: string) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
  return Math.max(0, Math.round((utc(today) - utc(last)) / 86_400_000));
}
