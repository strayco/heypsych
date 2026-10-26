/**
 * Which treatments list a condition as an indication.
 *
 * The reverse of each treatment record's `clinical_profile.indications`, so a
 * condition page can link to the real treatment pages that cover it, with the
 * same context sentence the treatment page shows. Built once per server
 * process from the local treatment files (no database).
 */

import { getAllTreatmentSlugs, loadTreatment } from "@/lib/comparison/treatment-loader";

export interface TreatmentForCondition {
  slug: string;
  name: string;
  modality: string;
  /** "primary" | "secondary" | "off_label" */
  use: "primary" | "secondary" | "off_label";
  fdaApproved: boolean;
  context: string | null;
}

let index: Promise<Map<string, TreatmentForCondition[]>> | null = null;

async function build(): Promise<Map<string, TreatmentForCondition[]>> {
  const map = new Map<string, TreatmentForCondition[]>();
  for (const slug of getAllTreatmentSlugs()) {
    const treatment = await loadTreatment(slug);
    const indications = treatment?.clinical_profile?.indications;
    if (!treatment || !indications) continue;

    const groups: Array<[TreatmentForCondition["use"], typeof indications.primary]> = [
      ["primary", indications.primary],
      ["secondary", indications.secondary],
      ["off_label", indications.off_label],
    ];
    for (const [use, links] of groups) {
      for (const link of links ?? []) {
        if (!link.condition_slug) continue;
        const list = map.get(link.condition_slug) ?? [];
        if (list.some((t) => t.slug === treatment.identity.slug)) continue;
        list.push({
          slug: treatment.identity.slug,
          name: treatment.identity.name,
          modality: treatment.taxonomy?.modality ?? "treatment",
          use,
          fdaApproved: Boolean(link.fda_approved),
          context: link.context ?? null,
        });
        map.set(link.condition_slug, list);
      }
    }
  }

  // Approved primary uses first, then other primary, secondary, off-label.
  const rank = (t: TreatmentForCondition) =>
    (t.use === "primary" ? 0 : t.use === "secondary" ? 2 : 4) + (t.fdaApproved ? 0 : 1);
  for (const list of map.values()) list.sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
  return map;
}

export async function getTreatmentsForCondition(conditionSlug: string): Promise<TreatmentForCondition[]> {
  index ??= build();
  return (await index).get(conditionSlug) ?? [];
}
