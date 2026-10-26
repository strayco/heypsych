/**
 * Treatment hub data, shared by /treatments and its six kind hubs
 * (/treatments/medications, /therapy, …). Built from the same local files as
 * the treatment pages, so every treatment is listed and the hubs are static.
 * Server-only (reads files).
 */

import { getAllTreatmentSlugs, loadTreatment } from "@/lib/comparison/treatment-loader";
import { CONDITION_SLUGS } from "@/lib/entities/entity-slugs.generated";
import { firstSentence, type HubItem } from "./model";

export interface TreatmentHubData {
  items: HubItem[];
  /** condition slug → the name most records give it. */
  conditionNames: Map<string, string>;
}

/**
 * Medication families, from the record's own drug classes. The classes are
 * spelled many ways ("Second-Generation (Atypical) Antipsychotic",
 * "Atypical Antipsychotic"), so each family is a pattern; first match wins.
 */
export const MEDICATION_FAMILIES: { id: string; label: string; description: string; match: RegExp }[] = [
  { id: "ssri", label: "SSRIs", description: "Selective serotonin reuptake inhibitors, the most prescribed antidepressants.", match: /\bSSRI\b|selective serotonin reuptake/i },
  { id: "snri", label: "SNRIs", description: "Serotonin–norepinephrine reuptake inhibitors.", match: /\bSNRI\b|serotonin.norepinephrine reuptake/i },
  { id: "antidepressant", label: "Other antidepressants", description: "Tricyclics, MAOIs, atypical and newer antidepressants.", match: /antidepressant|\bMAOI\b|monoamine oxidase|\bTCA\b|serotonin modulator|NMDA|dissociative/i },
  { id: "antipsychotic", label: "Antipsychotics", description: "First- and second-generation antipsychotics.", match: /antipsychotic/i },
  { id: "mood", label: "Mood stabilizers & antiseizure", description: "Lithium and antiseizure medicines used for mood.", match: /mood stabili|antiseizure|anticonvulsant|antiepileptic/i },
  { id: "adhd", label: "ADHD medicines", description: "Stimulants and non-stimulants such as atomoxetine and guanfacine.", match: /stimulant|norepinephrine reuptake inhibitor \(NRI\)|\bNRI\b|alpha-2/i },
  { id: "anxiety", label: "Anxiety & benzodiazepines", description: "Benzodiazepines and other anti-anxiety medicines.", match: /benzodiazepine(?! receptor agonist)|antianxiety|anxiolytic|barbiturate/i },
  { id: "sleep", label: "Sleep medicines", description: "Hypnotics, orexin and melatonin receptor medicines.", match: /hypnotic|orexin|melatonin|benzodiazepine receptor agonist|antihistamine|sedative/i },
  { id: "substance", label: "Substance use", description: "Medicines for alcohol, opioid and nicotine use.", match: /opioid|nicotin|alcohol|antagonist/i },
  { id: "dementia", label: "Memory & dementia", description: "Cholinesterase inhibitors and related medicines.", match: /cholinesterase|memantine/i },
];

export function medicationFamily(drugClasses: string[] | undefined): string {
  // The record's first-listed class is its primary one (clomipramine is a
  // tricyclic first, an SNRI-like second), so classes are tried in order.
  for (const cls of drugClasses ?? []) {
    const family = MEDICATION_FAMILIES.find((f) => f.match.test(cls));
    if (family) return family.id;
  }
  return "other";
}

/** Every treatment as a hub item, optionally only one kind (modality). */
export async function loadTreatmentHub(modality?: string): Promise<TreatmentHubData> {
  const items: HubItem[] = [];
  // Records name the same condition differently ("PTSD", "Post-traumatic
  // stress disorder"), so chips use real condition pages only, each under the
  // name most records give it.
  const nameVotes = new Map<string, Map<string, number>>();
  const seen = new Set<string>();

  for (const slug of getAllTreatmentSlugs()) {
    const t = await loadTreatment(slug);
    if (!t?.identity?.name || seen.has(t.identity.slug)) continue;
    const kind = t.taxonomy?.modality ?? "treatment";
    if (modality && kind !== modality) continue;
    seen.add(t.identity.slug);

    const indications = t.clinical_profile?.indications;
    const uses = [...(indications?.primary ?? []), ...(indications?.secondary ?? [])].filter(
      (u) => u.condition_slug && CONDITION_SLUGS.has(u.condition_slug)
    );
    for (const u of uses) {
      if (!u.condition_name) continue;
      const votes = nameVotes.get(u.condition_slug) ?? new Map<string, number>();
      votes.set(u.condition_name, (votes.get(u.condition_name) ?? 0) + 1);
      nameVotes.set(u.condition_slug, votes);
    }

    const drugClasses = (t.taxonomy as { drug_classes?: string[] } | undefined)?.drug_classes;
    items.push({
      href: `/treatments/${t.identity.slug}`,
      title: t.identity.name,
      subtitle: firstSentence(t.patient_summary ?? t.summary ?? null),
      groups: modality === "medication" ? [medicationFamily(drugClasses)] : [kind],
      facets: uses.map((u) => u.condition_slug).filter(Boolean),
      keywords: [
        ...(t.identity.brand_names ?? []),
        ...(t.identity.aliases ?? []),
        t.identity.generic_name ?? "",
        ...(drugClasses ?? []),
      ].filter(Boolean),
    });
  }
  items.sort((a, b) => a.title.localeCompare(b.title));

  const conditionNames = new Map(
    [...nameVotes.entries()].map(([slug, votes]) => [slug, [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0]])
  );
  return { items, conditionNames };
}
