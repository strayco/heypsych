/**
 * The bridge from a condition page to Apps & Tools: a few apps and services
 * for the condition, and the finder page for its need.
 *
 * Apps whose records name the condition come first; the rest of the short
 * list comes from the condition category's need, in the finder's order
 * (sign-up-yourself, research, privacy). Record-only, like the finder.
 */

import { ToolService } from "@/lib/tools/tool-service";
import {
  byRank,
  getNeed,
  isClinicianFacing,
  isCrisisTool,
  isListable,
  toFinderApp,
  type FinderApp,
  type NeedDefinition,
  type NeedId,
} from "@/domains/patient-tools/finder/model";

const CATEGORY_TO_NEED: Record<string, NeedId> = {
  "anxiety-fear": "anxiety-stress",
  "obsessive-compulsive": "anxiety-stress",
  "somatic-health-anxiety": "anxiety-stress",
  "mood-depression": "mood-depression",
  "sleep-disorders": "sleep",
  "attention-learning": "focus-adhd",
  "trauma-stress": "trauma-ptsd",
  "dissociative-disorders": "trauma-ptsd",
  "substance-use-disorders": "substance-use",
  "psychotic-disorders": "serious-mental-illness",
  "eating-body-image": "serious-mental-illness",
};

export interface ConditionApps {
  need: NeedDefinition;
  apps: Pick<FinderApp, "slug" | "name" | "href" | "summary" | "cost" | "evidence">[];
  total: number;
}

export async function getAppsForCondition(conditionSlug: string, category: string | undefined, limit = 3): Promise<ConditionApps | null> {
  const need = getNeed(CATEGORY_TO_NEED[category ?? ""] ?? "find-support");
  if (!need) return null;
  const all = (await ToolService.getAll()).filter((t) => isListable(t) && !isCrisisTool(t) && !isClinicianFacing(t));
  const named = all
    .filter((t) => (t.conditions ?? []).includes(conditionSlug) || (t.related_conditions ?? []).includes(conditionSlug))
    .map((t) => toFinderApp(t))
    .filter((a) => a.open)
    .sort(byRank);
  const forNeed = all
    .filter((t) => t.primary_hubs.includes(need.id))
    .map((t) => toFinderApp(t))
    .filter((a) => a.open)
    .sort(byRank);
  // One way to start of each kind first (a therapist, an app, a prescriber),
  // then fill in order, so the list isn't three of the same thing.
  const pool = [...named, ...forNeed];
  const seen = new Set<string>();
  const apps: FinderApp[] = [];
  for (const help of ["therapist", "self-guided", "prescriber", "peer"] as const) {
    const pick = pool.find((a) => !seen.has(a.slug) && a.help.includes(help));
    if (pick && apps.length < limit) {
      seen.add(pick.slug);
      apps.push(pick);
    }
  }
  for (const a of pool) {
    if (apps.length >= limit) break;
    if (!seen.has(a.slug)) {
      seen.add(a.slug);
      apps.push(a);
    }
  }
  if (apps.length === 0) return null;
  return {
    need,
    apps: apps.map(({ slug, name, href, summary, cost, evidence }) => ({ slug, name, href, summary, cost, evidence })),
    total: all.filter((t) => t.primary_hubs.includes(need.id)).length,
  };
}
