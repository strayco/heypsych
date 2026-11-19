"use client";

/**
 * Your Path — the map
 *
 * Everything the visitor kept, laid out as the decision it is building:
 *   Noticed → Exploring → Considering → Next step
 * Select anything and what it connects to lights up (lines on wide screens),
 * everything else steps back, and the inspector opens with just what that
 * item needs: the facts from its reviewed guide, the questions it adds to the
 * brief, warnings first, and edits in place.
 *
 * Connections come only from reviewed content (src/domains/path/graph.ts)
 * and are never scored or ranked.
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  buildGraph,
  conditionQuestions,
  destinationsFor,
  nodeId,
  removeItem,
  setNextStep,
  treatmentQuestions,
  boxedWarningCell,
  controlledCell,
  NOTICED_DURATION_LABELS,
  type NodeKind,
  type NoticedDuration,
  type PathDocument,
  type PathGraph,
  type PathNode,
  type PathSnapshot,
  type SymptomRef,
} from "@/domains/path";
import { clearTried, writeApps, writeNoticed } from "./store";
import { markFirstInteraction, trackPathEvent } from "./analytics";

const DURATIONS: NoticedDuration[] = ["days", "weeks", "months", "years"];

const LANES: { id: string; title: string; kinds: NodeKind[]; empty: { label: string; href: string } }[] = [
  { id: "noticed", title: "Noticed", kinds: ["symptom"], empty: { label: "Note a symptom", href: "/symptoms" } },
  { id: "exploring", title: "Exploring", kinds: ["condition"], empty: { label: "Read about a condition", href: "/conditions" } },
  { id: "considering", title: "Considering", kinds: ["treatment"], empty: { label: "Look into a treatment", href: "/treatments" } },
  { id: "next", title: "Next step", kinds: ["next-step", "app"], empty: { label: "Find your next step", href: "/find-support?need=support" } },
];

const KIND_LABEL: Record<NodeKind, string> = {
  symptom: "Noticed",
  condition: "Exploring",
  treatment: "Considering",
  app: "Saved app",
  "next-step": "Your next step",
};

function Glyph({ kind }: { kind: NodeKind }) {
  const common = { viewBox: "0 0 16 16", className: "h-4 w-4", fill: "none", stroke: "currentColor", strokeWidth: 1.6, "aria-hidden": true } as const;
  switch (kind) {
    case "symptom":
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="2.5" />
          <circle cx="8" cy="8" r="6" opacity="0.45" />
        </svg>
      );
    case "condition":
      return (
        <svg {...common}>
          <path d="M3 3.5h4.5v9H3zM8.5 3.5H13v9H8.5z" strokeLinejoin="round" />
        </svg>
      );
    case "treatment":
      return (
        <svg {...common}>
          <rect x="2.5" y="6" width="11" height="4" rx="2" />
          <path d="M8 6v4" />
        </svg>
      );
    case "app":
      return (
        <svg {...common}>
          <rect x="4.5" y="2" width="7" height="12" rx="1.6" />
          <path d="M7 12h2" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M3 8h9M9 4.5 12.5 8 9 11.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
}

/** One line under a node's name: the most decision-relevant fact. */
function nodeMeta(node: PathNode, path: PathSnapshot): { text: string | null; warn: boolean } {
  if (node.kind === "symptom") {
    const n = path.noticed.find((x) => x.slug === node.slug);
    return n?.duration ? { text: NOTICED_DURATION_LABELS[n.duration], warn: false } : { text: "How long?", warn: true };
  }
  if (node.kind === "treatment") {
    const t = path.treatments.find((x) => x.slug === node.slug);
    if (t?.facts.boxedWarning) return { text: "Boxed warning", warn: true };
    return { text: t?.facts.drugClass ?? (t ? t.facts.kind.charAt(0).toUpperCase() + t.facts.kind.slice(1) : null), warn: false };
  }
  if (node.kind === "condition") {
    const c = path.conditions.find((x) => x.slug === node.slug);
    const n = c ? conditionQuestions(c.name, c.facts).length : 0;
    return { text: n ? `${n} questions for your brief` : null, warn: false };
  }
  if (node.kind === "app") return { text: "Saved app", warn: false };
  return { text: null, warn: false };
}

// ---------------------------------------------------------------------------
// Connectors (wide screens)
// ---------------------------------------------------------------------------

function Connectors({
  graph,
  selected,
  container,
  nodeEls,
  version,
}: {
  graph: PathGraph;
  selected: string | null;
  container: React.RefObject<HTMLDivElement | null>;
  nodeEls: React.RefObject<Map<string, HTMLElement>>;
  version: number;
}) {
  const [paths, setPaths] = useState<{ d: string; active: boolean; key: string }[]>([]);
  const [size, setSize] = useState({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const root = container.current;
    if (!root) return;
    const measure = () => {
      const box = root.getBoundingClientRect();
      setSize({ w: box.width, h: box.height });
      const out: { d: string; active: boolean; key: string }[] = [];
      for (const e of graph.edges) {
        const a = nodeEls.current.get(e.from);
        const b = nodeEls.current.get(e.to);
        if (!a || !b) continue;
        const ra = a.getBoundingClientRect();
        const rb = b.getBoundingClientRect();
        const [left, right] = ra.left <= rb.left ? [ra, rb] : [rb, ra];
        const active = selected ? e.from === selected || e.to === selected : false;
        let d: string;
        if (Math.abs(left.left - right.left) < 20) {
          // Same lane: a bracket on the left edge.
          const x = left.left - box.left;
          const y1 = left.top + left.height / 2 - box.top;
          const y2 = right.top + right.height / 2 - box.top;
          d = `M ${x} ${y1} C ${x - 18} ${y1}, ${x - 18} ${y2}, ${x} ${y2}`;
        } else {
          const x1 = left.right - box.left;
          const y1 = left.top + left.height / 2 - box.top;
          const x2 = right.left - box.left;
          const y2 = right.top + right.height / 2 - box.top;
          const mid = (x1 + x2) / 2;
          d = `M ${x1} ${y1} C ${mid} ${y1}, ${mid} ${y2}, ${x2} ${y2}`;
        }
        out.push({ d, active, key: `${e.from}>${e.to}` });
      }
      setPaths(out);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [graph, selected, container, nodeEls, version]);

  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block" width={size.w} height={size.h} viewBox={`0 0 ${size.w || 1} ${size.h || 1}`}>
      {paths.map((p) => (
        <path
          key={p.key}
          d={p.d}
          fill="none"
          className={`transition-[stroke,opacity] duration-300 motion-reduce:transition-none ${p.active ? "stroke-accent" : "stroke-separator-opaque"}`}
          strokeWidth={p.active ? 2 : 1.25}
          strokeDasharray={p.active ? undefined : "3 4"}
          opacity={selected && !p.active ? 0.25 : 1}
        />
      ))}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Inspector
// ---------------------------------------------------------------------------

function Questions({ items }: { items: { text: string; basis: string | null }[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">Adds to your brief</p>
      <ol className="mt-2 space-y-2">
        {items.map((q) => (
          <li key={q.text} className="text-label-primary text-[14px] leading-snug">
            <span aria-hidden="true" className="text-label-tertiary mr-1.5">☐</span>
            {q.text}
            {q.basis && <span className="text-label-secondary mt-0.5 block pl-5 text-[13px]">{q.basis}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Fold({ title, children, open = false }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-separator border-t pt-3">
      <summary className="text-label-primary flex min-h-10 cursor-pointer list-none items-center justify-between text-[14px] font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <span aria-hidden="true" className="text-label-tertiary transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="text-label-secondary pb-1 text-[14px] leading-relaxed">{children}</div>
    </details>
  );
}

function Inspector({
  node,
  path,
  graph,
  refs,
  update,
  onSelect,
  onClose,
}: {
  node: PathNode;
  path: PathSnapshot;
  graph: PathGraph;
  refs: Map<string, SymptomRef>;
  update: (change: (doc: PathDocument) => PathDocument) => boolean;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.focus();
  }, [node.id]);

  const connected = [...(graph.neighbours.get(node.id) ?? [])].map((id) => graph.nodes.find((n) => n.id === id)).filter((n): n is PathNode => !!n);
  const why = (other: PathNode) => graph.edges.find((e) => (e.from === node.id && e.to === other.id) || (e.to === node.id && e.from === other.id))?.why ?? "";

  let body: React.ReactNode = null;
  let remove: (() => void) | null = null;

  if (node.kind === "symptom") {
    const n = path.noticed.find((x) => x.slug === node.slug);
    const ref = refs.get(node.slug);
    remove = () => writeNoticed(path.noticed.filter((x) => x.slug !== node.slug));
    body = (
      <>
        <div>
          <p className="text-label-primary text-[14px] font-semibold">How long has it lasted?</p>
          <div role="group" aria-label="How long" className="mt-2 flex flex-wrap gap-1.5">
            {DURATIONS.map((d) => (
              <button
                key={d}
                type="button"
                aria-pressed={n?.duration === d}
                onClick={() => writeNoticed(path.noticed.map((x) => (x.slug === node.slug ? { ...x, duration: x.duration === d ? null : d } : x)))}
                className={`focus-visible:ring-accent min-h-10 rounded-full px-3.5 text-[14px] capitalize focus-visible:ring-2 focus-visible:outline-none ${
                  n?.duration === d ? "bg-label-primary text-canvas" : "bg-fill-quaternary text-label-secondary hover:text-label-primary"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-label-tertiary mt-2 text-[13px]">How long something has lasted is one of the first things a clinician asks.</p>
        </div>
        {ref && ref.alsoCausedBy.length > 0 && (
          <Fold title="Other things that can cause it" open>
            <ul className="space-y-1">
              {ref.alsoCausedBy.slice(0, 4).map((c) => (
                <li key={c}>· {c}</li>
              ))}
            </ul>
          </Fold>
        )}
        {ref && ref.seekHelpWhen.length > 0 && (
          <Fold title="When to get help sooner">
            <ul className="space-y-1">
              {ref.seekHelpWhen.map((c) => (
                <li key={c}>· {c}</li>
              ))}
            </ul>
          </Fold>
        )}
      </>
    );
  } else if (node.kind === "condition") {
    const c = path.conditions.find((x) => x.slug === node.slug)!;
    remove = () => update((d) => removeItem(d, "condition", node.slug));
    const tried = path.tried.find((t) => t.conditionSlug === node.slug);
    body = (
      <>
        {c.facts.whatItIs && <p className="text-label-primary text-[15px] leading-relaxed">{c.facts.whatItIs}</p>}
        <Questions items={conditionQuestions(c.name, c.facts)} />
        {c.facts.approaches.length > 0 && (
          <Fold title="How it's usually treated">
            <p>{c.facts.approaches.join(" · ")}</p>
            <Link href={`/conditions/${c.slug}#treatment`} className="text-label-primary mt-1 inline-block font-medium underline underline-offset-2">
              See treatments for it
            </Link>
          </Fold>
        )}
        <Fold title="What you've tried">
          {tried ? (
            <ul className="space-y-1">
              {tried.items.map((i) => (
                <li key={i}>✓ {i}</li>
              ))}
            </ul>
          ) : (
            <p>Nothing ticked yet.</p>
          )}
          <span className="mt-1 flex gap-3">
            <Link href={`/conditions/${c.slug}#day-to-day`} className="text-label-primary font-medium underline underline-offset-2">
              {tried ? "Update" : "Tick what you've tried"}
            </Link>
            {tried && (
              <button type="button" onClick={() => clearTried(c.slug)} className="text-label-tertiary underline underline-offset-2">
                Clear
              </button>
            )}
          </span>
        </Fold>
      </>
    );
  } else if (node.kind === "treatment") {
    const t = path.treatments.find((x) => x.slug === node.slug)!;
    remove = () => update((d) => removeItem(d, "treatment", node.slug));
    const others = path.treatments.filter((x) => x.slug !== t.slug);
    body = (
      <>
        {t.facts.boxedWarning && (
          <p className="border-caution-200 bg-caution-50 text-label-primary rounded-xl border px-3.5 py-2.5 text-[14px] leading-snug">
            <span className="font-semibold">Boxed warning.</span> {t.facts.boxedWarning}
          </p>
        )}
        <dl className="grid gap-2 text-[14px]">
          {(t.facts.onset || t.facts.course) && (
            <div>
              <dt className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">{t.facts.onset ? "Starts working" : "Typical course"}</dt>
              <dd className="text-label-primary">{t.facts.onset ?? t.facts.course}</dd>
            </div>
          )}
          {t.facts.sideEffects.length > 0 && (
            <div>
              <dt className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">Most common side effects</dt>
              <dd className="text-label-primary">{t.facts.sideEffects.join(", ")}</dd>
            </div>
          )}
        </dl>
        <Questions items={treatmentQuestions(t.name, t.facts)} />
        {others.length > 0 && (
          <Link
            href={`/treatments/compare?items=${[t.slug, ...others.map((o) => o.slug)].slice(0, 4).join(",")}`}
            className="border-separator text-label-primary hover:border-label-primary flex min-h-11 items-center justify-between rounded-xl border px-4 text-[14px] font-medium"
          >
            <span className="text-label-primary">Compare with {others[0].name.replace(/\s*\(.*\)$/, "")}{others.length > 1 ? ` and ${others.length - 1} more` : ""}</span>
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </>
    );
  } else if (node.kind === "app") {
    remove = () => writeApps(path.apps.filter((a) => a.slug !== node.slug));
    const second = path.apps.find((a) => a.slug !== node.slug);
    body = (
      <div className="space-y-2">
        <Link href={node.href} className="border-separator hover:border-label-primary flex min-h-11 items-center justify-between rounded-xl border px-4 text-[14px] font-medium">
          <span className="text-label-primary">Privacy, cost and evidence</span>
          <span aria-hidden="true">→</span>
        </Link>
        {second && (
          <Link href={`/tools/for-patients/compare/${node.slug}-vs-${second.slug}`} className="border-separator hover:border-label-primary flex min-h-11 items-center justify-between rounded-xl border px-4 text-[14px] font-medium">
            <span className="text-label-primary">Compare with {second.name}</span>
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    );
  } else if (node.kind === "next-step" && path.nextStep) {
    const n = path.nextStep;
    remove = () => update((d) => setNextStep(d, null));
    body = (
      <>
        <p className="text-label-primary text-[15px] leading-relaxed">{n.typicalFirst}</p>
        {n.whyThisFits.length > 0 && (
          <ul className="text-label-secondary space-y-1 text-[14px]">
            {n.whyThisFits.map((w) => (
              <li key={w}>✓ {w}</li>
            ))}
          </ul>
        )}
        <ul className="space-y-2">
          {destinationsFor(n.pathId, n.answers.insurancePreference)
            .filter((a) => !a.href.startsWith("/my-path"))
            .map((a) => (
              <li key={a.href}>
                <Link
                  href={a.href}
                  onClick={() => trackPathEvent("path_qualified_action", { surface: "workspace", kind: "next-step" })}
                  className="bg-label-primary flex min-h-11 items-center justify-between rounded-xl px-4 text-[14px] font-medium"
                >
                  <span className="text-canvas">{a.label}</span>
                  <span aria-hidden="true" className="text-canvas">→</span>
                </Link>
              </li>
            ))}
        </ul>
        {n.alternatives.length > 0 && <p className="text-label-secondary text-[13px]">Also worth a look: {n.alternatives.map((a) => a.name).join(", ")}.</p>}
        {n.history && n.history.length > 0 && (
          <Fold title="How this step changed">
            <ol className="space-y-1.5">
              {n.history.map((h) => (
                <li key={h.at}>
                  <span className="text-label-primary">{h.from} → {h.to}</span>
                  <span className="block text-[13px]">
                    {new Date(h.at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}, because {h.because}.
                  </span>
                </li>
              ))}
            </ol>
          </Fold>
        )}
        <Link href="/find-support?need=support" className="text-label-primary text-[14px] font-medium underline underline-offset-2">
          Change my answers
        </Link>
      </>
    );
  }

  return (
    <div ref={panel} tabIndex={-1} className="flex h-full flex-col focus:outline-none" role="region" aria-labelledby="inspector-title">
      <div className="border-separator flex items-start justify-between gap-3 border-b px-5 py-4">
        <div className="min-w-0">
          <p className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">{KIND_LABEL[node.kind]}</p>
          <h3 id="inspector-title" className="font-display text-label-primary mt-0.5 text-[24px] leading-tight">
            {node.name}
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-label-tertiary hover:bg-fill-quaternary hover:text-label-primary focus-visible:ring-accent flex h-10 w-10 shrink-0 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:outline-none"
        >
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="m4 4 8 8M12 4l-8 8" />
          </svg>
        </button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {body}

        <div className="border-separator border-t pt-3">
          <p className="text-label-tertiary text-[12px] font-semibold tracking-[0.06em] uppercase">Connected in your path</p>
          {connected.length === 0 ? (
            <p className="text-label-secondary mt-1 text-[14px]">Nothing else you kept links to this yet.</p>
          ) : (
            <ul className="mt-2 space-y-1.5">
              {connected.map((o) => (
                <li key={o.id}>
                  <button type="button" onClick={() => onSelect(o.id)} className="hover:bg-fill-quaternary flex w-full items-start gap-2.5 rounded-lg px-2 py-1.5 text-left text-[14px]">
                    <span className="text-accent mt-0.5">
                      <Glyph kind={o.kind} />
                    </span>
                    <span className="min-w-0">
                      <span className="text-label-primary block font-medium">{o.name}</span>
                      <span className="text-label-tertiary block text-[13px]">{why(o)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="border-separator flex items-center justify-between gap-3 border-t px-5 py-3">
        {node.kind !== "next-step" ? (
          <Link href={node.href} className="text-label-primary text-[14px] font-medium underline underline-offset-2">
            Open the full guide
          </Link>
        ) : (
          <span />
        )}
        {remove && (
          <button
            type="button"
            onClick={() => {
              remove?.();
              trackPathEvent("path_item_removed", { kind: node.kind === "symptom" ? "symptom" : node.kind === "app" ? "app" : node.kind === "next-step" ? "next-step" : node.kind });
              onClose();
            }}
            className="text-label-tertiary hover:text-negative text-[13px] font-medium"
          >
            Remove from path
          </button>
        )}
      </div>
    </div>
  );
}


// ---------------------------------------------------------------------------
// Compare what you're considering (in place)
// ---------------------------------------------------------------------------

function CompareConsidering({ path, onClose }: { path: PathSnapshot; onClose: () => void }) {
  const items = path.treatments.slice(0, 4);
  useEffect(() => {
    trackPathEvent("path_comparison_viewed", { kind: "treatment", surface: "workspace", items: items.length <= 2 ? "1-2" : "3-5" });
  }, [items.length]);
  const rows: { label: string; value: (t: PathSnapshot["treatments"][number]) => React.ReactNode }[] = [
    { label: "Kind", value: (t) => t.facts.drugClass ?? t.facts.kind.charAt(0).toUpperCase() + t.facts.kind.slice(1) },
    { label: "Boxed warning", value: (t) => (t.facts.boxedWarning ? <span className="text-caution-600">{t.facts.boxedWarning}</span> : <span className="text-label-secondary">{boxedWarningCell(t.facts)}</span>) },
    { label: "Starts working / course", value: (t) => t.facts.onset ?? t.facts.course ?? "Not stated in our guide" },
    { label: "Most common side effects", value: (t) => (t.facts.sideEffects.length ? t.facts.sideEffects.join(", ") : "Not listed") },
    { label: "What gets monitored", value: (t) => (t.facts.monitoring.length ? t.facts.monitoring.join(", ") : "—") },
    { label: "Controlled substance", value: (t) => controlledCell(t.facts) },
    { label: "Questions for your brief", value: (t) => String(treatmentQuestions(t.name, t.facts).length) },
  ];
  return (
    <section aria-labelledby="compare-title" className="border-separator bg-surface shadow-card-1 mt-6 overflow-hidden rounded-3xl border">
      <div className="border-separator flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <h3 id="compare-title" className="text-label-primary text-[17px] font-semibold">
          Comparing what you&apos;re considering
        </h3>
        <div className="flex items-center gap-3">
          <Link href={`/treatments/compare?items=${items.map((t) => t.slug).join(",")}`} className="text-label-primary text-[14px] font-medium underline underline-offset-2">
            Full comparison
          </Link>
          <button type="button" onClick={onClose} className="text-label-secondary hover:text-label-primary text-[14px] font-medium">
            Close
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[14px]">
          <thead>
            <tr>
              <th scope="col" className="text-label-tertiary w-44 px-5 py-3 text-[12px] font-semibold tracking-[0.06em] uppercase">
                <span className="sr-only">Fact</span>
              </th>
              {items.map((t) => (
                <th key={t.slug} scope="col" className="text-label-primary px-4 py-3 text-[15px] font-semibold">
                  {t.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-separator border-t align-top">
                <th scope="row" className="text-label-secondary px-5 py-3 text-[13px] font-medium">
                  {r.label}
                </th>
                {items.map((t) => (
                  <td key={t.slug} className="text-label-primary px-4 py-3 leading-snug">
                    {r.value(t)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-label-secondary border-separator border-t px-5 py-3 text-[13px]">
        From HeyPsych&apos;s reviewed guides. Differences between treatments are for discussing with a clinician, not for choosing one on your own.
      </p>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Map
// ---------------------------------------------------------------------------

export function PathMap({
  path,
  refs,
  update,
  selected,
  onSelect,
}: {
  path: PathSnapshot;
  refs: SymptomRef[];
  update: (change: (doc: PathDocument) => PathDocument) => boolean;
  selected: string | null;
  onSelect: (id: string | null) => void;
}) {
  const reduce = useReducedMotion();
  const graph = useMemo(() => buildGraph(path, refs), [path, refs]);
  const refMap = useMemo(() => new Map(refs.map((r) => [r.slug, r])), [refs]);
  const container = useRef<HTMLDivElement>(null);
  const nodeEls = useRef(new Map<string, HTMLElement>());
  const lastFocus = useRef<string | null>(null);
  const [version, setVersion] = useState(0);
  const [comparing, setComparing] = useState(false);

  // A removed item can't stay selected.
  const selectedNode = selected ? graph.nodes.find((n) => n.id === selected) ?? null : null;
  useEffect(() => {
    if (selected && !selectedNode) onSelect(null);
  }, [selected, selectedNode, onSelect]);
  useEffect(() => setVersion((v) => v + 1), [graph]);

  const close = useCallback(() => {
    onSelect(null);
    const back = lastFocus.current && nodeEls.current.get(lastFocus.current);
    if (back) back.focus();
  }, [onSelect]);

  useEffect(() => {
    if (!selectedNode) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selectedNode, close]);

  const related = selected ? graph.neighbours.get(selected) ?? new Set<string>() : null;
  const register = (id: string) => (el: HTMLElement | null) => {
    if (el) nodeEls.current.set(id, el);
    else nodeEls.current.delete(id);
  };

  const pick = (id: string) => {
    lastFocus.current = id;
    markFirstInteraction("workspace");
    onSelect(selected === id ? null : id);
  };

  return (
    <div className="relative">
      <div ref={container} className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-12">
        <Connectors graph={graph} selected={selected} container={container} nodeEls={nodeEls} version={version} />
        {LANES.map((lane) => {
          const nodes = graph.nodes.filter((n) => lane.kinds.includes(n.kind));
          const hasStep = nodes.some((n) => n.kind === "next-step");
          return (
            <section key={lane.id} aria-labelledby={`lane-${lane.id}`} className="relative min-w-0">
              <div className="mb-3 flex items-baseline justify-between gap-2">
                <h3 id={`lane-${lane.id}`} className="text-label-tertiary text-[12px] font-semibold tracking-[0.08em] uppercase">
                  {lane.title}
                  {nodes.length > 0 && <span className="ml-1.5 tabular-nums">{nodes.length}</span>}
                </h3>
                <span className="flex items-center gap-3">
                  {lane.id === "considering" && nodes.length >= 2 && (
                    <button type="button" onClick={() => setComparing((c) => !c)} aria-expanded={comparing} className="text-label-primary text-[12px] font-semibold underline underline-offset-2">
                      {comparing ? "Hide comparison" : "Compare"}
                    </button>
                  )}
                  {nodes.length > 0 && lane.id !== "next" && (
                    <Link href={lane.empty.href} className="text-label-tertiary hover:text-label-primary text-[12px] font-medium">
                      + Add
                    </Link>
                  )}
                </span>
              </div>
              <ul className="space-y-2.5">
                <AnimatePresence initial={false}>
                  {nodes.map((n) => {
                    const meta = nodeMeta(n, path);
                    const isSel = selected === n.id;
                    const isRel = related?.has(n.id) ?? false;
                    const dim = selected !== null && !isSel && !isRel;
                    const isStep = n.kind === "next-step";
                    return (
                      <motion.li
                        key={n.id}
                        layout={!reduce}
                        initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                        transition={{ duration: 0.2 }}
                      >
                        <button
                          ref={register(n.id)}
                          type="button"
                          onClick={() => pick(n.id)}
                          aria-pressed={isSel}
                          aria-describedby={isRel ? `rel-${n.id}` : undefined}
                          className={`focus-visible:ring-accent group flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition-[border-color,box-shadow,background-color] duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none motion-reduce:transition-none ${
                            isStep
                              ? "border-label-primary bg-label-primary"
                              : isSel
                                ? "border-label-primary bg-surface shadow-card-2"
                                : isRel
                                  ? "border-accent bg-surface shadow-card-1"
                                  : dim
                                    ? "border-separator/60 bg-transparent hover:border-label-tertiary"
                                    : "border-separator bg-surface hover:border-label-tertiary"
                          }`}
                        >
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${isStep ? "bg-canvas/15 text-canvas" : isRel ? "bg-accent-tint text-accent" : "bg-fill-quaternary text-label-secondary"}`}>
                            <Glyph kind={n.kind} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`line-clamp-2 block text-[15px] leading-snug font-semibold ${isStep ? "text-canvas" : dim ? "text-label-secondary" : "text-label-primary"}`}>{n.name}</span>
                            {meta.text && (
                              <span className={`block truncate text-[13px] ${isStep ? "text-canvas/70" : meta.warn ? "text-caution-600" : "text-label-tertiary"}`}>{meta.text}</span>
                            )}
                            {isStep && <span className="text-canvas/70 block text-[13px]">Your next step</span>}
                          </span>
                          {isRel && (
                            <span id={`rel-${n.id}`} className="sr-only">
                              Connected to the selected item
                            </span>
                          )}
                          {(graph.neighbours.get(n.id)?.size ?? 0) > 0 && !isStep && (
                            <span aria-hidden="true" className="bg-accent h-1.5 w-1.5 shrink-0 rounded-full" title="Connected" />
                          )}
                        </button>
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
                {(nodes.length === 0 || (lane.id === "next" && !hasStep)) && (
                  <li>
                    <Link
                      href={lane.empty.href}
                      className={`flex min-h-16 items-center justify-center rounded-2xl border border-dashed px-4 text-center text-[14px] font-medium transition-colors ${
                        lane.id === "next" ? "border-label-primary bg-label-primary" : "border-separator-opaque text-label-secondary hover:border-label-primary hover:text-label-primary"
                      }`}
                    >
                      <span className={lane.id === "next" ? "text-canvas" : ""}>+ {lane.empty.label}</span>
                    </Link>
                  </li>
                )}
              </ul>
            </section>
          );
        })}
      </div>

      {graph.edges.length > 0 && (
        <p className="text-label-tertiary mt-5 flex items-center gap-2 text-[13px]">
          <span aria-hidden="true" className="bg-accent inline-block h-1.5 w-1.5 rounded-full" />
          Connections come from HeyPsych&apos;s reviewed guides. They show where to read next, not what you have.
        </p>
      )}
      {comparing && path.treatments.length >= 2 && <CompareConsidering path={path} onClose={() => setComparing(false)} />}

      {/* Inspector: a side panel on wide screens, a sheet on phones. */}
      {selectedNode && <button type="button" aria-label="Close details" tabIndex={-1} onClick={close} className="fixed inset-0 z-40 bg-black/25 sm:hidden" />}
      <AnimatePresence>
        {selectedNode && (
          <motion.aside
            key="inspector"
            aria-label={`${selectedNode.name} details`}
            initial={reduce ? false : { opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, x: 24 }}
            transition={{ duration: 0.2 }}
            className="border-separator bg-surface shadow-floating fixed inset-x-0 bottom-0 z-50 max-h-[78vh] overflow-hidden rounded-t-3xl border sm:inset-x-auto sm:top-24 sm:right-4 sm:bottom-4 sm:max-h-none sm:w-[400px] sm:rounded-3xl"
          >
            <Inspector node={selectedNode} path={path} graph={graph} refs={refMap} update={update} onSelect={(id) => onSelect(id)} onClose={close} />
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}

export { nodeId };
