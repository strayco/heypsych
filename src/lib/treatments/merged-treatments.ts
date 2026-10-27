/**
 * Thin legacy treatment records that duplicate a researched one.
 *
 * The 2025 import left ~100 medication records with no drug class, no
 * indications and a one-paragraph summary. Where a full record now covers the
 * same product, the old URL redirects (301) to it and the old record is left
 * out of hubs, static params and sitemaps, so people never see "Lithium" next
 * to "Lithium (Lithobid)".
 *
 * Only true duplicates are listed: the same drug and the same product. Distinct
 * formulations with their own page (long-acting injections, Ambien CR, nicotine
 * gum vs patch) stay.
 *
 * Keys: legacy slug. Values: the page that replaces it.
 */
export const MERGED_TREATMENTS: Readonly<Record<string, string>> = {
  lithium: "lithium-lithobid",
  ketamine: "ketamine-ketalar",
  guanfacine: "guanfacine-intuniv",
  "hydroxyzine-vistaril": "hydroxyzine-vistaril-atarax",
  "methadone-dolophine": "methadone",
  "meprobamate-miltown": "meprobamate-equanil",
  "methohexital-brevital": "methohexital-brevital-ect",
  "methylphenidate-ritalin": "methylphenidate-ritalin-concerta",
  "methylphenidate-er-concerta": "methylphenidate-ritalin-concerta",
  "midazolam-versed": "midazolam-versed-nayzilam",
  "moclobemide-aurorix": "moclobemide-manerix",
  "naltrexone-revia": "naltrexone-vivitrol-revia",
  "naltrexone-er-vivitrol": "naltrexone-vivitrol-revia",
  nitrazepam: "nitrazepam-mogadon",
  "oxcarbazepine-trileptal": "oxcarbazepine-trileptal-oxtellar-xr",
  periciazine: "periciazine-neuleptil",
  phenobarbital: "phenobarbital-sezaby",
  "prazosin-minipress": "prazosin-minipress-ptsd-nightmares",
  "propranolol-inderal": "propranolol",
  "quazepam-doral": "quazepam",
  "trimipramine-surmontil": "trimipramine",
  "venlafaxine-effexor": "venlafaxine-effexor-xr",
  "viloxazine-er-qelbree": "viloxazine-qelbree",
  "zonisamide-zonegran": "zonisamide-zonegran-zonisade",
  "galantamine-razadyne": "galantamine-razadyne-er",
  "selegiline-emsam": "selegiline-emsam-zelapar",
  "valproate-semisodium-divalproex": "valproate-divalproex",
  "loxapine-loxitane": "loxapine-adasuve",
  "loxapine-inhalation-adasuve": "loxapine-adasuve",
  "metformin-antipsychotic-weight-gain-glucophage": "metformin-psychiatry-weight-gain",
  // Same drug, two names (methotrimeprazine). Redirect already existed.
  levomepromazine: "methotrimeprazine-nozinan",
  // Researched duplicates of each other: keep the fuller one.
  "trazodone-desyrel": "trazodone",
  "olanzapine-fluoxetine-symbyax": "fluoxetine-olanzapine-symbyax",
  "valproate-depakote": "valproate-divalproex",
  "naltrexone-bupropion-contrave": "contrave-naltrexone-bupropion",
  "mixed-amphetamine-salts-adderall": "dextroamphetamine-amphetamine-adderall",
  // Other kinds of treatment
  "electroconvulsive-therapy-for-severe-depression": "electroconvulsive-therapy",
  "family-play-therapy": "play-therapy-family",
  "glabellar-botulinum-toxin-injection": "glabellar-botulinum-toxini-injection",
  "glabellar-botulinum-toxin-injection-for-depression": "glabellar-botulinum-toxini-injection",
  "spravato-esketamine": "esketamine-spravato",
};

export function isMergedTreatment(slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(MERGED_TREATMENTS, slug);
}
