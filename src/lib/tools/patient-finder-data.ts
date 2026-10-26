/**
 * Server loader for the patient app finder (/tools and the need pages).
 * File-backed. Lists carry no outbound links: visiting happens from a profile.
 */

import { ToolService } from "@/lib/tools/tool-service";
import { getSponsoredPlacement, type SponsoredPlacement } from "@/lib/commercial/placements";
import { KEY_COMPARISONS } from "@/lib/seo/patient-programmatic-seo-engine";
import {
  byRank,
  isClinicianFacing,
  isCrisisTool,
  isEmployerOnly,
  isListable,
  toFinderApp,
  type FinderApp,
  type NeedId,
} from "@/domains/patient-tools/finder/model";

export interface CrisisLink {
  slug: string;
  name: string;
  href: string;
}

export interface PatientComparison {
  slug: string;
  href: string;
  label: string;
  needs: NeedId[];
}

export interface PatientFinderData {
  apps: FinderApp[];
  crisis: CrisisLink[];
  comparisons: PatientComparison[];
  placement: SponsoredPlacement | null;
  lastReviewed: string | null;
  /** Listed starting price text per app, for at-a-glance numbers. */
  prices: Record<string, string | null>;
}


export async function loadPatientFinder(need: NeedId | null = null): Promise<PatientFinderData> {
  const all = (await ToolService.getAll()).filter(isListable);
  const crisis = all
    .filter(isCrisisTool)
    .map((t) => ({ slug: t.slug, name: t.name, href: `/tools/${t.slug}` }))
    .sort((a, b) => a.name.localeCompare(b.name));
  // Consumer views list only what a person can sign up for themselves.
  // Employer-, school- and plan-only products (e.g. Wysa for Employers) keep
  // their profiles but are not offered here.
  const apps = all
    .filter((t) => !isCrisisTool(t) && !isClinicianFacing(t))
    .filter((t) => !isEmployerOnly(t))
    .map((t) => toFinderApp(t))
    .sort(byRank);

  const bySlug = new Map(apps.map((a) => [a.slug, a]));
  const comparisons: PatientComparison[] = [];
  for (const { a, b } of KEY_COMPARISONS) {
    const x = bySlug.get(a);
    const y = bySlug.get(b);
    if (!x || !y) continue;
    comparisons.push({
      slug: `${a}-vs-${b}`,
      href: `/tools/for-patients/compare/${a}-vs-${b}`,
      label: `${x.name} vs ${y.name}`,
      needs: x.needs.filter((n) => y.needs.includes(n)),
    });
  }

  const placement = await getSponsoredPlacement({ audience: "patient", hub: need ?? undefined });
  const lastReviewed =
    all
      .map((t) => t.governance?.last_reviewed)
      .filter((d): d is string => Boolean(d))
      .sort()
      .at(-1) ?? null;

  const prices = Object.fromEntries(all.map((t) => [t.slug, t.pricing.starting_price ?? null]));

  return { apps, crisis, comparisons, placement, lastReviewed, prices };
}
