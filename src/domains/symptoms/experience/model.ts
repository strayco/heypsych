/**
 * Symptom experience model
 *
 * Turns a SymptomEntity into what the interactive symptom page shows. Pure,
 * and limited to the record: a symptom page explains where an experience can
 * come from; it never suggests which one applies to the reader.
 */

import type { SymptomEntity } from "../types";
import { getCategoryMeta, getSymptomBySlug } from "../registry";
import { CONDITION_SLUGS } from "@/lib/entities/entity-slugs.generated";

export interface SymptomSource {
  slug: string;
  name: string;
  context: string;
  /** How clinicians describe this symptom within the condition. */
  described: string[];
  hasPage: boolean;
}

export interface SymptomExperience {
  slug: string;
  name: string;
  lede: string;
  category: { id: string; name: string } | null;
  aliases: string[];
  phrases: string[];
  glance: { id: string; label: string; value: string; href: string }[];
  examples: string[];
  conditions: SymptomSource[];
  otherCauses: string[];
  related: { slug: string; name: string }[];
  assessments: { label: string; href: string; relevance: string | null }[];
  whenToSeekHelp: string[];
  lastReviewed: string | null;
}

function list(names: string[], max = 2): string {
  if (names.length <= max) return names.join(" and ");
  return `${names.slice(0, max).join(", ")} and ${names.length - max} more`;
}

export function buildSymptomExperience(symptom: SymptomEntity): SymptomExperience {
  const category = getCategoryMeta(symptom.category);
  const conditions: SymptomSource[] = symptom.conditionRelationships.map((r) => ({
    slug: r.conditionSlug,
    name: r.conditionName,
    context: r.context,
    described: r.symptomText ?? [],
    hasPage: CONDITION_SLUGS.has(r.conditionSlug),
  }));
  const otherCauses = symptom.nonPsychiatricConsiderations ?? [];
  const help = symptom.whenToSeekHelp ?? [];

  const glance = [
    conditions.length > 0 && {
      id: "conditions",
      label: "Can be part of",
      value: list(conditions.map((c) => c.name)),
      href: "#causes",
    },
    otherCauses.length > 0 && {
      id: "other",
      label: "Not always mental health",
      value: `${otherCauses.length} other possible causes, like ${otherCauses[0].replace(/\s*\(.*?\)/g, "").split(/\s+(?:can|may|might|often|list)\b/)[0].toLowerCase()}`,
      href: "#causes",
    },
    help.length > 0 && {
      id: "help",
      label: "Get help if",
      value: help[0].replace(/^When\s+/i, "").replace(/^./, (c) => c.toUpperCase()),
      href: "#get-help",
    },
  ].filter((g): g is { id: string; label: string; value: string; href: string } => Boolean(g));

  return {
    slug: symptom.slug,
    name: symptom.name,
    lede: symptom.shortDefinition,
    category: category ? { id: category.id, name: category.name } : null,
    aliases: symptom.aliases.slice(0, 6),
    phrases: symptom.searchPhrases.slice(0, 4),
    glance,
    examples: symptom.examples.map((e) => e.text.trim()).filter(Boolean),
    conditions,
    otherCauses,
    related: symptom.relatedSymptoms
      .map((slug) => {
        const related = getSymptomBySlug(slug);
        return related ? { slug, name: related.name } : null;
      })
      .filter((r): r is { slug: string; name: string } => r !== null),
    assessments: (symptom.assessmentLinks ?? []).map((a) => ({ label: a.label, href: a.href, relevance: a.relevance ?? null })),
    whenToSeekHelp: help,
    lastReviewed: symptom.lastReviewed ?? null,
  };
}
