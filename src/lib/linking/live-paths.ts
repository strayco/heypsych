/**
 * Does an internal link have a page behind it?
 *
 * Content records link to each other by slug ({link:condition:tic-disorders:…},
 * medication lists, indications). Records drift: a condition gets merged, a
 * treatment is renamed, a slug was never right. A full-site crawl on
 * 2026-10-23 found dozens of these 404ing. Renderers ask this first and show
 * plain text when the target does not exist, so a stale reference degrades to
 * words instead of a dead end.
 *
 * Built from the same generated manifests the proxy uses, so it is exactly as
 * current as the last build.
 */

import { CONDITION_SLUGS, RESOURCE_SLUGS } from "@/lib/entities/entity-slugs.generated";
import { resolveTreatmentAlias } from "@/lib/treatments/treatment-aliases.generated";
import treatmentSlugs from "@/lib/generated/treatment-slugs.json";

const TREATMENTS: ReadonlySet<string> = new Set((treatmentSlugs as { slugs: string[] }).slugs);

export type LinkKind = "condition" | "treatment" | "resource" | "assessment" | "provider" | string;

export function isLivePath(kind: LinkKind, slug: string): boolean {
  if (!slug) return false;
  switch (kind) {
    case "condition":
      // An empty manifest means generation failed; do not hide every link.
      return CONDITION_SLUGS.size === 0 || CONDITION_SLUGS.has(slug);
    case "treatment":
      return TREATMENTS.size === 0 || TREATMENTS.has(slug) || resolveTreatmentAlias(slug) !== null;
    case "resource":
    case "assessment":
      return RESOURCE_SLUGS.size === 0 || RESOURCE_SLUGS.has(slug);
    default:
      // Providers and anything else are not in a manifest; leave them linked.
      return true;
  }
}

const TOKEN = /{link:([^:}]+):([^:}]+)(?::([^}]+))?}/g;
const ROUTE_KIND: Record<string, LinkKind> = {
  condition: "condition",
  disorder: "condition",
  treatment: "treatment",
  medication: "treatment",
  therapy: "treatment",
  interventional: "treatment",
  alternative: "treatment",
  supplement: "treatment",
  investigational: "treatment",
  resource: "resource",
  assessment: "assessment",
  screener: "assessment",
};

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Replace `{link:type:slug:text}` tokens whose page does not exist with their text. */
export function pruneDeadLinkTokens(text: string): string {
  if (!text.includes("{link:")) return text;
  return text.replace(TOKEN, (whole, type: string, slug: string, display?: string) => {
    const kind = ROUTE_KIND[type];
    if (!kind || isLivePath(kind, slug)) return whole;
    return display ?? titleFromSlug(slug);
  });
}

const MED_CONTEXTS = new Set(["first-line", "second-line", "off-label"]);

/**
 * Walk a record (server-side, before it reaches a client component) and
 * unlink references to pages that do not exist: link tokens in any string,
 * and linked-medication entries, whose slug is cleared so the list shows the
 * name without a link. Runs on the server so the slug manifests never ship in
 * client bundles.
 */
export function pruneDeadLinks<T>(value: T, depth = 0): T {
  if (depth > 40) return value;
  if (typeof value === "string") return pruneDeadLinkTokens(value) as T;
  if (Array.isArray(value)) return value.map((v) => pruneDeadLinks(v, depth + 1)) as T;
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) out[k] = pruneDeadLinks(v, depth + 1);
    if (
      typeof out.slug === "string" &&
      typeof out.name === "string" &&
      typeof out.context === "string" &&
      MED_CONTEXTS.has(out.context) &&
      !isLivePath("treatment", out.slug)
    ) {
      out.slug = "";
    }
    // Resource "alternatives" ({ slug, comparison }): drop a dead slug so the
    // card shows the name (and its external url, if any) instead of a 404 link.
    if (typeof out.slug === "string" && typeof out.comparison === "string" && !isLivePath("resource", out.slug)) {
      if (!out.name) out.name = titleFromSlug(out.slug);
      delete out.slug;
    }
    return out as T;
  }
  return value;
}
