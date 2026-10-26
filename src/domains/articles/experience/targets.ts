/**
 * Which pages exist, and what they are called, for article and resource
 * crosslinks. Server-only (reads data/ files); no database queries.
 */

import fs from "fs";
import path from "path";
import { CONDITION_SLUGS, RESOURCE_SLUGS, isResourceToolStub } from "@/lib/entities/entity-slugs.generated";
import { getAllTreatmentSlugs } from "@/lib/comparison/treatment-loader";
import { loadRecord } from "@/lib/search/record-files";
import type { LinkTargets } from "./model";

const KNOWN_RESOURCE_NAMES: Record<string, string> = {
  "phq-9": "PHQ-9 depression screener",
  "gad-7": "GAD-7 anxiety screener",
  "asrs-v1-1": "ASRS v1.1 adult ADHD screener",
  "assist-v3": "ASSIST substance use screener",
  "988-lifeline": "988 Suicide & Crisis Lifeline",
};

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => (w.length <= 3 && /\d/.test(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function nameOf(record: unknown): string | null {
  if (!record || typeof record !== "object") return null;
  const r = record as Record<string, unknown>;
  const identity = r.identity as Record<string, unknown> | undefined;
  const candidates = [identity?.name, r.name, r.title];
  for (const c of candidates) if (typeof c === "string" && c.trim()) return c.trim();
  return null;
}

let treatmentSlugs: Set<string> | null = null;
let learnTitles: Map<string, string> | null = null;

function learnIndex(): Map<string, string> {
  if (learnTitles) return learnTitles;
  learnTitles = new Map();
  const dir = path.join(process.cwd(), "data/learn");
  try {
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      try {
        const a = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
        if (typeof a.title === "string") learnTitles.set(file.slice(0, -5), a.title);
      } catch {
        // Unreadable article: no link to it.
      }
    }
  } catch {
    // No learn directory.
  }
  return learnTitles;
}

export const linkTargets: LinkTargets = {
  condition: (slug) => (CONDITION_SLUGS.has(slug) ? nameOf(loadRecord("condition", slug)) ?? titleCase(slug) : null),
  treatment: (slug) => {
    treatmentSlugs ??= new Set(getAllTreatmentSlugs());
    return treatmentSlugs.has(slug) ? nameOf(loadRecord("treatment", slug)) ?? titleCase(slug) : null;
  },
  resource: (slug) =>
    RESOURCE_SLUGS.has(slug) && !isResourceToolStub(slug) ? KNOWN_RESOURCE_NAMES[slug] ?? titleCase(slug) : null,
  article: (slug) => learnIndex().get(slug) ?? null,
};
