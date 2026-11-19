"use client";

/**
 * "Save to your path" on condition and treatment pages.
 *
 * Keeps the item, with a snapshot of the reviewed facts the appointment brief
 * uses, in this browser only. When a saved item's page is opened again the
 * snapshot is refreshed, so the brief follows the current review.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ConditionFacts, TreatmentFacts } from "@/domains/path";
import { saveCondition, saveTreatment, removeItem, PATH_LIMITS } from "@/domains/path";
import { markFirstInteraction, trackPathEvent } from "./analytics";
import { usePath } from "./store";

type Props =
  | {
      kind: "condition";
      slug: string;
      name: string;
      facts: ConditionFacts;
      /** Symptom slugs this condition's guide describes (registry), for connections. */
      relatedSymptoms?: string[];
    }
  | { kind: "treatment"; slug: string; name: string; facts: TreatmentFacts };

export function SaveToPath(props: Props) {
  const { kind, slug, name } = props;
  const { snapshot, ready, update } = usePath();
  const [failed, setFailed] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const refreshed = useRef(false);

  const list = kind === "condition" ? snapshot.conditions : snapshot.treatments;
  const saved = list.some((i) => i.slug === slug);
  const full = !saved && list.length >= PATH_LIMITS[kind === "condition" ? "conditions" : "treatments"];

  const write = () =>
    update((doc) =>
      props.kind === "condition"
        ? saveCondition(doc, { slug, name, savedAt: Date.now(), facts: props.facts })
        : saveTreatment(doc, { slug, name, savedAt: Date.now(), facts: props.facts })
    );

  // Keep a saved item's facts current with the page the visitor is reading.
  useEffect(() => {
    if (!ready || !saved || refreshed.current) return;
    refreshed.current = true;
    const item = list.find((i) => i.slug === slug);
    if (item && JSON.stringify(item.facts) !== JSON.stringify(props.facts)) write();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, saved]);

  const toggle = () => {
    if (saved) {
      update((doc) => removeItem(doc, kind, slug));
      setJustSaved(false);
      trackPathEvent("path_item_removed", { kind });
      return;
    }
    const ok = write();
    setFailed(!ok);
    if (ok) {
      setJustSaved(true);
      trackPathEvent("path_item_saved", { kind });
      markFirstInteraction("page");
    }
  };

  const label = kind === "condition" ? "Save to your path" : "Add to your path";

  // What this page already connects to among the things the visitor kept.
  const connections: { name: string; role: string }[] = !ready
    ? []
    : props.kind === "condition"
      ? [
          ...snapshot.noticed
            .filter((n) => props.relatedSymptoms?.includes(n.slug))
            .map((n) => ({ name: n.name, role: "you noticed it" })),
          ...snapshot.treatments
            .filter((t) => t.facts.usedForSlugs?.includes(slug))
            .map((t) => ({ name: t.name, role: "used for it" })),
        ]
      : snapshot.conditions
          .filter((c) => props.facts.usedForSlugs.includes(c.slug))
          .map((c) => ({ name: c.name, role: "you're reading about it" }));

  return (
    <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2" data-path-save>
      <button
        type="button"
        onClick={toggle}
        disabled={!ready || full}
        aria-pressed={ready ? saved : undefined}
        className={`focus-visible:ring-accent inline-flex min-h-11 items-center gap-2 rounded-full border px-5 text-[15px] font-medium transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60 motion-reduce:transition-none ${
          saved ? "border-accent bg-accent text-white" : "border-separator bg-surface text-label-primary hover:border-label-tertiary"
        }`}
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6">
          <path d="M4 2.5h8a.5.5 0 0 1 .5.5v10.6a.3.3 0 0 1-.48.24L8 10.8l-4.02 3.04a.3.3 0 0 1-.48-.24V3a.5.5 0 0 1 .5-.5Z" strokeLinejoin="round" />
        </svg>
        {saved ? "In your path" : label}
      </button>

      {ready && saved && (
        <Link href="/my-path" className="text-accent hover:text-accent-hover text-[14px] font-medium">
          {justSaved ? "Saved. See your appointment brief" : "Open your path"} <span aria-hidden="true">→</span>
        </Link>
      )}
      {ready && !saved && !full && (
        <span className="text-label-tertiary text-[13px]">Builds questions to ask. Kept on this device only.</span>
      )}
      {full && <span className="text-label-tertiary text-[13px]">Your path is full. Remove something to add this.</span>}
      {connections.length > 0 && (
        <p className="text-label-secondary w-full text-[14px]">
          <span className="text-accent" aria-hidden="true">● </span>
          Connects to your path:{" "}
          {connections.map((c, i) => (
            <span key={c.name}>
              {i > 0 && ", "}
              <span className="text-label-primary font-medium">{c.name}</span> ({c.role})
            </span>
          ))}
        </p>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {failed ? "Couldn't save: this browser is blocking storage." : justSaved ? `${name} saved to your path.` : ""}
      </p>
      {failed && <p className="text-caution-600 w-full text-[13px]">This browser is blocking storage, so nothing can be kept here.</p>}
    </div>
  );
}
