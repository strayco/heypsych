/**
 * Your Path — how the things a visitor kept connect
 *
 * Edges come only from reviewed content:
 *   symptom ↔ condition   the symptom guide lists the condition (registry)
 *   condition ↔ treatment the treatment record lists it as a use
 *   next step ↔ treatment the kind of help matches the kind of treatment
 *   next step ↔ app       self-guided or peer help, and saved apps
 *
 * Connections are shown, never scored: nothing here counts how many symptoms
 * a condition "matches" or orders conditions by overlap, which would read as
 * a diagnosis. Pure and deterministic.
 */

import type { SupportPathId } from "@/domains/patient-support/types";
import type { PathSnapshot, SymptomRef, TreatmentKind } from "./types";

export type NodeKind = "symptom" | "condition" | "treatment" | "app" | "next-step";

export interface PathNode {
  id: string;
  kind: NodeKind;
  slug: string;
  name: string;
  href: string;
}

export interface PathEdge {
  from: string;
  to: string;
  /** Why they connect, in a few words, for the inspector and screen readers. */
  why: string;
}

export interface PathGraph {
  nodes: PathNode[];
  edges: PathEdge[];
  /** Node id → ids it connects to. */
  neighbours: Map<string, Set<string>>;
}

export const nodeId = (kind: NodeKind, slug: string) => `${kind}:${slug}`;

const STEP_TREATMENT_KINDS: Partial<Record<SupportPathId, TreatmentKind[]>> = {
  "psychiatric-eval": ["medication"],
  "integrated-care": ["medication", "therapy"],
  "therapy-counseling": ["therapy"],
  "primary-care": ["medication"],
};

const STEP_APPS: SupportPathId[] = ["digital-tools", "peer-support"];

export function buildGraph(path: PathSnapshot, refs: SymptomRef[]): PathGraph {
  const refBySlug = new Map(refs.map((r) => [r.slug, r]));
  const nodes: PathNode[] = [
    ...path.noticed.map((n) => ({ id: nodeId("symptom", n.slug), kind: "symptom" as const, slug: n.slug, name: refBySlug.get(n.slug)?.name ?? n.name, href: `/symptoms/${n.slug}` })),
    ...path.conditions.map((c) => ({ id: nodeId("condition", c.slug), kind: "condition" as const, slug: c.slug, name: c.name, href: `/conditions/${c.slug}` })),
    ...path.treatments.map((t) => ({ id: nodeId("treatment", t.slug), kind: "treatment" as const, slug: t.slug, name: t.name, href: `/treatments/${t.slug}` })),
    ...path.apps.map((a) => ({ id: nodeId("app", a.slug), kind: "app" as const, slug: a.slug, name: a.name, href: `/tools/${a.slug}` })),
    ...(path.nextStep
      ? [{ id: nodeId("next-step", path.nextStep.pathId), kind: "next-step" as const, slug: path.nextStep.pathId, name: path.nextStep.pathName, href: "/find-support?need=support" }]
      : []),
  ];

  const edges: PathEdge[] = [];
  for (const n of path.noticed) {
    const related = new Set(refBySlug.get(n.slug)?.conditions ?? []);
    for (const c of path.conditions) {
      if (related.has(c.slug)) edges.push({ from: nodeId("symptom", n.slug), to: nodeId("condition", c.slug), why: "described in this condition's guide" });
    }
  }
  for (const t of path.treatments) {
    const uses = new Set(t.facts.usedForSlugs ?? []);
    const names = new Set(t.facts.usedFor.map((u) => u.toLowerCase()));
    for (const c of path.conditions) {
      if (uses.has(c.slug) || names.has(c.name.toLowerCase())) edges.push({ from: nodeId("condition", c.slug), to: nodeId("treatment", t.slug), why: "a treatment used for it" });
    }
  }
  if (path.nextStep) {
    const step = nodeId("next-step", path.nextStep.pathId);
    const kinds = STEP_TREATMENT_KINDS[path.nextStep.pathId] ?? [];
    for (const t of path.treatments) {
      if (kinds.includes(t.facts.kind)) edges.push({ from: nodeId("treatment", t.slug), to: step, why: t.facts.kind === "medication" ? "discussed with a prescriber" : "delivered by a therapist" });
    }
    if (STEP_APPS.includes(path.nextStep.pathId)) {
      for (const a of path.apps) edges.push({ from: nodeId("app", a.slug), to: step, why: "a way to start this step" });
    }
  }

  const neighbours = new Map<string, Set<string>>(nodes.map((n) => [n.id, new Set<string>()]));
  for (const e of edges) {
    neighbours.get(e.from)?.add(e.to);
    neighbours.get(e.to)?.add(e.from);
  }
  return { nodes, edges, neighbours };
}
