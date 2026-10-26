"use client";

/**
 * The visitor's saved apps. Kept in this browser only (`localStorage`
 * "hp:saved-apps"), never sent anywhere. Every island that shows or changes
 * the list stays in sync through one window event.
 */

import { useCallback, useEffect, useState } from "react";

export interface SavedApp {
  slug: string;
  name: string;
}

const KEY = "hp:saved-apps";
const EVENT = "hp:saved-apps-change";
const MAX = 12;

function read(): SavedApp[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list)
      ? list.filter((x): x is SavedApp => !!x && typeof x.slug === "string" && typeof x.name === "string").slice(0, MAX)
      : [];
  } catch {
    return [];
  }
}

function write(list: SavedApp[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    // Private mode or storage disabled: the list lasts for this page view.
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: list }));
}

export function useSavedApps() {
  const [saved, setSaved] = useState<SavedApp[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSaved(read());
    setReady(true);
    const onChange = (e: Event) => setSaved((e as CustomEvent<SavedApp[]>).detail ?? read());
    const onStorage = (e: StorageEvent) => e.key === KEY && setSaved(read());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const toggle = useCallback((app: SavedApp) => {
    const list = read();
    const next = list.some((a) => a.slug === app.slug) ? list.filter((a) => a.slug !== app.slug) : [app, ...list];
    write(next);
  }, []);

  const remove = useCallback((slug: string) => write(read().filter((a) => a.slug !== slug)), []);
  const clear = useCallback(() => write([]), []);

  return { saved, ready, toggle, remove, clear, has: (slug: string) => saved.some((a) => a.slug === slug) };
}
