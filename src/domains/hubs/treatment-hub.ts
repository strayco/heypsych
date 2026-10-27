/**
 * Treatment hub data, shared by /treatments and its six kind hubs
 * (/treatments/medications, /therapy, …). Built from the same local files as
 * the treatment pages, so every treatment is listed and the hubs are static.
 * Server-only (reads files).
 */

import { getAllTreatmentSlugs, loadTreatment } from "@/lib/comparison/treatment-loader";
import { resolveConditionSlug } from "@/lib/conditions/condition-aliases";
import { firstSentence, type HubItem } from "./model";

export interface TreatmentHubData {
  items: HubItem[];
  /** condition slug → the name most records give it. */
  conditionNames: Map<string, string>;
}

/**
 * Medication families, from the record's own drug classes. The classes are
 * spelled many ways ("Second-Generation (Atypical) Antipsychotic",
 * "Atypical Antipsychotic"), so each family is a pattern.
 */
export const MEDICATION_FAMILIES: { id: string; label: string; description: string; match: RegExp }[] = [
  { id: "ssri", label: "SSRIs", description: "Selective serotonin reuptake inhibitors, the most prescribed antidepressants.", match: /\bSSRI\b|selective serotonin reuptake/i },
  { id: "snri", label: "SNRIs", description: "Serotonin–norepinephrine reuptake inhibitors.", match: /\bSNRI\b|serotonin.norepinephrine reuptake/i },
  { id: "antidepressant", label: "Other antidepressants", description: "Tricyclics, MAOIs, bupropion, mirtazapine and newer antidepressants.", match: /antidepressant|\bMAOI\b|monoamine oxidase|\bTCA\b|serotonin modulator|NMDA|dissociative|dopamine.norepinephrine/i },
  { id: "antipsychotic", label: "Antipsychotics", description: "First- and second-generation antipsychotics, including long-acting injections.", match: /antipsychotic/i },
  { id: "mood", label: "Mood stabilizers & antiseizure", description: "Lithium, and antiseizure medicines, some used for mood.", match: /mood stabili|antiseizure|anticonvulsant|antiepileptic/i },
  { id: "adhd", label: "ADHD medicines", description: "Stimulants and non-stimulants such as atomoxetine and guanfacine.", match: /stimulant|norepinephrine reuptake inhibitor \(NRI\)|\bNRI\b|alpha-?2a?[- ]adrenergic agonist/i },
  { id: "anxiety", label: "Benzodiazepines & anxiety", description: "Benzodiazepines, buspirone and other anti-anxiety medicines.", match: /(?<!non)benzodiazepine(?! receptor agonist)|antianxiety|anxiolytic/i },
  { id: "sleep", label: "Sleep & wakefulness", description: "Z-drugs, orexin and melatonin medicines, and wake-promoting medicines.", match: /hypnotic|orexin|melatonin|benzodiazepine receptor agonist|antihistamine|sleep medicine|wake|sedative/i },
  { id: "substance", label: "Substance use", description: "Medicines for alcohol, opioid and nicotine use.", match: /opioid|nicotin|alcohol|smoking|craving|addiction|\bMOUD\b/i },
  { id: "dementia", label: "Memory & dementia", description: "Cholinesterase inhibitors, memantine and related medicines.", match: /cholinesterase|dementia/i },
];

/**
 * Hand-checked family for records whose classes are missing (the legacy
 * import) or point the wrong way (modafinil lists "stimulant" first but treats
 * sleepiness; memantine's first class is "NMDA antagonist" but it is a
 * dementia medicine). Checked against standard drug references, 2026-10-27.
 */
export const MEDICATION_FAMILY_OVERRIDES: Readonly<Record<string, string>> = {
  // Corrections to records that do have classes
  "armodafinil-nuvigil": "sleep",
  "modafinil-provigil": "sleep",
  "lofexidine-lucemyra": "substance",
  "memantine-namenda": "dementia",
  "contrave-naltrexone-bupropion": "other",
  "hydroxyzine-vistaril-atarax": "anxiety",
  "methohexital-brevital-ect": "other",
  "phenobarbital-sezaby": "mood",
  // Legacy records with no classes
  camazepam: "anxiety",
  "cannabidiol-epidiolex": "mood",
  cinolazepam: "anxiety",
  "clomethiazole-heminevrin": "sleep",
  etizolam: "anxiety",
  "felbamate-felbatol": "mood",
  "flunitrazepam-lower-dose-hypnodorm": "anxiety",
  "flunitrazepam-rohypnol": "anxiety",
  "fluphenazine-decanoate-prolixin-decanoate": "antipsychotic",
  "glutethimide-doriden": "sleep",
  hexobarbital: "sleep",
  hydergine: "dementia",
  idebenone: "other",
  iproniazid: "antidepressant",
  "lacosamide-vimpat": "mood",
  "levetiracetam-keppra": "mood",
  loprazolam: "anxiety",
  lormetazepam: "anxiety",
  "low-dose-doxepin-silenor": "sleep",
  "maprotiline-ludiomil": "antidepressant",
  melperone: "antipsychotic",
  "mesoridazine-serentil": "antipsychotic",
  "methaqualone-quaalude": "sleep",
  "methylphenidate-transdermal-daytrana": "adhd",
  "mianserin-tolvon": "antidepressant",
  mosapramine: "antipsychotic",
  "nalmefene-selincro": "substance",
  nicergoline: "dementia",
  "nicotine-gum-nicorette": "substance",
  "nicotine-lozenge": "substance",
  "nicotine-patch-nicoderm": "substance",
  "nomifensine-merital": "antidepressant",
  "olanzapine-pamoate-zyprexa-relprevv": "antipsychotic",
  "paliperidone-palmitate-invega-sustenna": "antipsychotic",
  "paliperidone-palmitate-3mo-invega-trinza": "antipsychotic",
  "paliperidone-palmitate-6mo-invega-hafyera": "antipsychotic",
  "perampanel-fycompa": "mood",
  perospirone: "antipsychotic",
  "perphenazine-enanthate": "antipsychotic",
  "perphenazine-amitriptyline-triavil": "antidepressant",
  piracetam: "other",
  pramiracetam: "other",
  prazepam: "anxiety",
  "primidone-mysoline": "mood",
  "quetiapine-nortriptyline": "antipsychotic",
  "quetiapine-er-seroquel-xr": "antipsychotic",
  "reboxetine-edronax": "antidepressant",
  "risperidone-lai-risperdal-consta": "antipsychotic",
  "risperidone-microsphereslai": "antipsychotic",
  "secobarbital-seconal": "sleep",
  "selegiline-eldepryl": "other",
  "sertindole-serdolect": "antipsychotic",
  setiptiline: "antidepressant",
  "valproate-sodium": "mood",
  "sulpiride-dogmatil": "antipsychotic",
  "sulpiride-dolmatil": "antipsychotic",
  talbutal: "sleep",
  "thiopental-pentothal": "other",
  "tianeptine-stablon": "antidepressant",
  "tiapride-tiapridal": "antipsychotic",
  tofizopam: "anxiety",
  valnoctamide: "anxiety",
  "valproate-magnesium": "mood",
  "valproic-acid-depakene": "mood",
  "viloxazine-ir": "adhd",
  vinpocetine: "other",
  "zolpidem-cr-ambien-cr": "sleep",
  zotepine: "antipsychotic",
};

/** Classes that only say "antidepressant", so a more specific one can win. */
const GENERIC_CLASS = /^(rapid-acting )?antidepressants?( \(pharmacologic class\))?$/i;

export function medicationFamily(drugClasses: string[] | undefined, slug?: string): string {
  if (slug && MEDICATION_FAMILY_OVERRIDES[slug]) return MEDICATION_FAMILY_OVERRIDES[slug];
  const classes = drugClasses ?? [];
  // The first specific class is the primary one (clomipramine is a tricyclic
  // first, SNRI-like second). A bare "Antidepressant" listed first must not
  // hide "SSRI" listed second, as it did for Lexapro.
  for (const cls of classes) {
    if (GENERIC_CLASS.test(cls.trim())) continue;
    const family = MEDICATION_FAMILIES.find((f) => f.match.test(cls));
    if (family) return family.id;
  }
  if (classes.some((c) => GENERIC_CLASS.test(c.trim()))) return "antidepressant";
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
  // Legacy records with no drug class are older or rarely used medicines
  // (glutethimide, hexobarbital); they go after the researched ones on each shelf.
  const thin = new Set<string>();

  for (const slug of getAllTreatmentSlugs()) {
    const t = await loadTreatment(slug);
    if (!t?.identity?.name || seen.has(t.identity.slug)) continue;
    const kind = t.taxonomy?.modality ?? "treatment";
    if (modality && kind !== modality) continue;
    seen.add(t.identity.slug);

    const indications = t.clinical_profile?.indications;
    const uses = [...(indications?.primary ?? []), ...(indications?.secondary ?? [])]
      .map((u) => ({ ...u, condition_slug: u.condition_slug ? resolveConditionSlug(u.condition_slug) ?? "" : "" }))
      .filter((u) => u.condition_slug);
    for (const u of uses) {
      if (!u.condition_name) continue;
      const votes = nameVotes.get(u.condition_slug) ?? new Map<string, number>();
      votes.set(u.condition_name, (votes.get(u.condition_name) ?? 0) + 1);
      nameVotes.set(u.condition_slug, votes);
    }

    const drugClasses = (t.taxonomy as { drug_classes?: string[] } | undefined)?.drug_classes;
    if (!drugClasses?.length) thin.add(`/treatments/${t.identity.slug}`);
    items.push({
      href: `/treatments/${t.identity.slug}`,
      title: t.identity.name,
      subtitle: firstSentence(t.patient_summary ?? t.summary ?? null),
      groups: modality === "medication" ? [medicationFamily(drugClasses, t.identity.slug)] : [kind],
      facets: uses.map((u) => u.condition_slug).filter(Boolean),
      keywords: [
        ...(t.identity.brand_names ?? []),
        ...(t.identity.aliases ?? []),
        t.identity.generic_name ?? "",
        ...(drugClasses ?? []),
      ].filter(Boolean),
    });
  }
  items.sort((a, b) =>
    modality === "medication"
      ? Number(thin.has(a.href)) - Number(thin.has(b.href)) || a.title.localeCompare(b.title)
      : a.title.localeCompare(b.title)
  );

  const conditionNames = new Map(
    [...nameVotes.entries()].map(([slug, votes]) => [slug, [...votes.entries()].sort((a, b) => b[1] - a[1])[0][0]])
  );
  return { items, conditionNames };
}
