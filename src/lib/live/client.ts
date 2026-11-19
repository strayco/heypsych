"use client";

/**
 * Live updates — client side: stable per-browser rollouts and experiments.
 *
 * Flags and experiment states arrive as props from the server render (no
 * client fetch, no polling). A random id kept in this browser
 * (`hp:bid`, localStorage) makes a partial rollout or an experiment variant
 * stable across visits. The id is never sent anywhere; only the variant id
 * is reported, with the experiment key.
 */

import { useEffect, useState } from "react";
import { track } from "@vercel/analytics";
import { flagOn, variantOf, type ExperimentState, type FlagState } from "./config";

const KEY = "hp:bid";

function readId(): string | null {
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id || !/^[a-z0-9]{12,40}$/.test(id)) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(12)), (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 20);
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return null; // storage blocked: full rollouts and controls only
  }
}

/** Null on the server and the first client render, so hydration matches. */
export function useBrowserId(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => setId(readId()), []);
  return id;
}

/**
 * A flag's value for this browser. Fully-on and fully-off flags resolve on
 * the server render already; partial rollouts resolve after mount.
 */
export function useFlag(state: FlagState, key: string): boolean {
  const id = useBrowserId();
  if (!state.enabled) return false;
  if (state.rollout >= 100) return true;
  return flagOn(state, id, key);
}

const exposed = new Set<string>();

/** The experiment variant for this browser; reports one exposure per page load. */
export function useVariant(state: ExperimentState, key: string): { id: string; value: string } {
  const id = useBrowserId();
  const variant = variantOf(state, id, key);
  useEffect(() => {
    if (!state.active || !id || exposed.has(key)) return;
    exposed.add(key);
    try {
      track("experiment_exposed", { experiment: key, variant: variant.id });
    } catch {
      // analytics unavailable
    }
  }, [state.active, id, key, variant.id]);
  return variant;
}
