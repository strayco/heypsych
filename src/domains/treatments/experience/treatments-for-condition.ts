/**
 * Which treatments list a condition as an indication.
 *
 * The reverse of each treatment record's `clinical_profile.indications`, so a
 * condition page can link to the real treatment pages that cover it, with the
 * same context sentence the treatment page shows. Built once per server
 * process from the local treatment files (no database).
 */

import { getAllTreatmentSlugs, loadTreatment } from "@/lib/comparison/treatment-loader";
import { medicationFamily } from "@/domains/hubs/treatment-hub";
import { resolveConditionSlugs } from "@/lib/conditions/condition-aliases";

export interface TreatmentForCondition {
  slug: string;
  name: string;
  modality: string;
  /** "primary" | "secondary" | "off_label" */
  use: "primary" | "secondary" | "off_label";
  fdaApproved: boolean;
  context: string | null;
  /** Ordering hint within a tier; lower comes first. Not shown. */
  weight: number;
}

/**
 * First-line choices by condition, from the usual guideline picks (APA, NICE,
 * CANMAT): what a person is most likely to be offered first. Used only to
 * order the list, never shown as a claim. Matched on the condition slug and
 * the treatment's medication family, drug class or slug.
 */
const FIRST_LINE: { condition: RegExp; families?: string[]; classes?: RegExp; slugs?: RegExp }[] = [
  {
    condition: /depress|dysthymi/,
    families: ["ssri", "snri"],
    slugs:
      /^(bupropion|mirtazapine|vortioxetine)|^cognitive-behavioral-therapy$|^interpersonal-therapy|^behavioral-activation/,
  },
  {
    condition: /generalized-anxiety|panic|social-anxiety|obsessive|ocd|posttraumatic|ptsd/,
    families: ["ssri", "snri"],
    slugs:
      /^cognitive-behavioral-therapy$|^exposure-response-prevention|^cognitive-processing|^cognitive-therapy-ptsd|^prolonged-exposure|^emdr$/,
  },
  { condition: /schizo|psychos/, classes: /second[- ]generation|atypical/i },
  {
    condition: /bipolar|mania|manic/,
    slugs: /^(lithium|valproate|lamotrigine|quetiapine)/,
    classes: /second[- ]generation|atypical/i,
  },
  { condition: /adhd|attention-deficit/, classes: /(?<!non-?)stimulant/i },
  {
    condition: /insomnia/,
    slugs:
      /^cognitive-behavioral-therapy-insomnia|^(daridorexant|lemborexant|suvorexant|zolpidem|eszopiclone)/,
  },
  { condition: /alcohol/, slugs: /^(naltrexone|acamprosate)/ },
  { condition: /opioid/, slugs: /^(buprenorphine|methadone|naltrexone)/ },
  { condition: /borderline/, slugs: /^dialectical-behavior/ },
];

function isFirstLine(
  conditionSlug: string,
  slug: string,
  family: string | null,
  classes: string[]
): boolean {
  return FIRST_LINE.some(
    (rule) =>
      rule.condition.test(conditionSlug) &&
      ((family !== null && rule.families?.includes(family)) ||
        rule.slugs?.test(slug) ||
        (rule.classes && classes.some((c) => rule.classes!.test(c))))
  );
}

/**
 * Within a tier, what a person is most likely to be offered comes first, and
 * old fixed-dose combinations (Limbitrol, Triavil) and thin legacy records
 * sink. Without this, depression listed Agomelatine and Limbitrol above
 * Sertraline.
 */
function weightFor(firstLine: boolean, name: string, thin: boolean, modality: string): number {
  let w = firstLine ? -3 : 0;
  // Still in trials: listed, but after everything people can get today.
  if (modality === "investigational") w += 5;
  if (/\+|\//.test(name.replace(/\(.*?\)/g, ""))) w += 1;
  if (thin) w += 3;
  return w;
}

let index: Promise<Map<string, TreatmentForCondition[]>> | null = null;

async function build(): Promise<Map<string, TreatmentForCondition[]>> {
  const map = new Map<string, TreatmentForCondition[]>();
  for (const slug of getAllTreatmentSlugs()) {
    const treatment = await loadTreatment(slug);
    const indications = treatment?.clinical_profile?.indications;
    if (!treatment || !indications) continue;
    const classes =
      (treatment.taxonomy as { drug_classes?: string[] } | undefined)?.drug_classes ?? [];
    const isMedication = treatment.taxonomy?.modality === "medication";
    const family = isMedication ? medicationFamily(classes, treatment.identity.slug) : null;

    const groups: Array<[TreatmentForCondition["use"], typeof indications.primary]> = [
      ["primary", indications.primary],
      ["secondary", indications.secondary],
      ["off_label", indications.off_label],
    ];
    for (const [use, links] of groups) {
      for (const link of links ?? []) {
        if (!link.condition_slug) continue;
        // Records say "insomnia" or "ptsd"; the pages are insomnia-disorder
        // and posttraumatic-stress-disorder.
        for (const conditionSlug of resolveConditionSlugs(link.condition_slug)) {
          const list = map.get(conditionSlug) ?? [];
          if (list.some((t) => t.slug === treatment.identity.slug)) continue;
          list.push({
            slug: treatment.identity.slug,
            name: treatment.identity.name,
            modality: treatment.taxonomy?.modality ?? "treatment",
            use,
            fdaApproved: Boolean(link.fda_approved),
            context: link.context ?? null,
            weight: weightFor(
              isFirstLine(conditionSlug, treatment.identity.slug, family, classes),
              treatment.identity.name,
              isMedication && classes.length === 0,
              treatment.taxonomy?.modality ?? "treatment"
            ),
          });
          map.set(conditionSlug, list);
        }
      }
    }
  }

  // Approved primary uses first, then other primary, secondary, off-label.
  const rank = (t: TreatmentForCondition) =>
    (t.use === "primary" ? 0 : t.use === "secondary" ? 2 : 4) + (t.fdaApproved ? 0 : 1);
  for (const list of map.values())
    list.sort((a, b) => rank(a) - rank(b) || a.weight - b.weight || a.name.localeCompare(b.name));
  return map;
}

export async function getTreatmentsForCondition(
  conditionSlug: string
): Promise<TreatmentForCondition[]> {
  index ??= build();
  return (await index).get(conditionSlug) ?? [];
}
