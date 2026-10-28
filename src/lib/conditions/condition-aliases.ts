/**
 * Condition slugs that treatment records use but that have no page of their
 * own ("insomnia", "ptsd", "post-traumatic-stress-disorder-ptsd"), mapped to
 * the condition page(s) they mean.
 *
 * Treatment records link to conditions by slug. About 3,000 of those links
 * pointed at slugs with no page, so Lithium never showed on the bipolar pages
 * and most sleep medicines never showed on Insomnia. Broad labels
 * ("anxiety-disorders", "chronic-stress") are left unmapped on purpose: they
 * do not name one condition.
 */

import { CONDITION_SLUGS } from "@/lib/entities/entity-slugs.generated";

const ALIASES: Readonly<Record<string, readonly string[]>> = {
  insomnia: ["insomnia-disorder"],
  depression: ["major-depressive-disorder"],
  "treatment-resistant-depression": ["major-depressive-disorder"],
  "depression-adjunctive": ["major-depressive-disorder"],
  "seasonal-affective-disorder": ["major-depressive-disorder"],
  ptsd: ["posttraumatic-stress-disorder"],
  adhd: ["attention-deficit-hyperactivity-disorder"],
  "bipolar-disorder": ["bipolar-i-disorder", "bipolar-ii-disorder"],
  "bipolar-depression": ["bipolar-i-disorder", "bipolar-ii-disorder"],
  "bipolar-mania": ["bipolar-i-disorder"],
  "acute-mania": ["bipolar-i-disorder"],
  "alcohol-use-disorder": ["alcohol"],
  "alcohol-dependence": ["alcohol"],
  "alcohol-withdrawal": ["alcohol"],
  "smoking-cessation": ["tobacco"],
  "tobacco-use-disorder": ["tobacco"],
  "nicotine-dependence": ["tobacco"],
  "opioid-withdrawal": ["opioid"],
  // Older slugs of the substance pages, still used by treatment and tool
  // records; the pages are /conditions/opioid, /inhalant, /phencyclidine.
  "opioid-use-disorder": ["opioid"],
  "inhalant-use-disorder": ["inhalant"],
  "phencyclidine-use-disorder": ["phencyclidine"],
  catatonia: ["catatonia-associated-with-mental-disorder"],
  "tourette-syndrome": ["tourettes-disorder"],
  "tourettes-syndrome": ["tourettes-disorder"],
  ocd: ["obsessive-compulsive-disorder"],
  "panic-attacks": ["panic-disorder"],
  "social-anxiety": ["social-anxiety-disorder"],
  "binge-eating": ["binge-eating-disorder"],
  pmdd: ["premenstrual-dysphoric-disorder"],
};

/** Abbreviation or qualifier suffixes: "-ptsd", "-adjunctive", "-in-adults". */
const SUFFIX =
  /-(ptsd|adhd|odd|ocd|gad|mdd|pdd|bpd|asd|pmdd|bed|aud|oud|adjunctive|adjunct|maintenance|acute|augmentation|in-adults|in-children)$/;

const cache = new Map<string, readonly string[]>();

/** The condition page slug(s) a record's condition slug refers to; [] if none. */
export function resolveConditionSlugs(slug: string): readonly string[] {
  if (!slug) return [];
  const hit = cache.get(slug);
  if (hit) return hit;
  let out: readonly string[] = [];
  if (CONDITION_SLUGS.has(slug)) out = [slug];
  else if (ALIASES[slug]) out = ALIASES[slug].filter((s) => CONDITION_SLUGS.has(s));
  else {
    let base = slug;
    for (let i = 0; i < 2 && SUFFIX.test(base); i++) base = base.replace(SUFFIX, "");
    base = base.replace(/^post-traumatic/, "posttraumatic");
    const tries = [base, `${base}-disorder`];
    const found = tries.find((s) => CONDITION_SLUGS.has(s)) ?? (ALIASES[base]?.[0] && CONDITION_SLUGS.has(ALIASES[base][0]) ? ALIASES[base][0] : undefined);
    if (found) out = [found];
  }
  cache.set(slug, out);
  return out;
}

/** The one page to link to for a record's condition slug, or null. */
export function resolveConditionSlug(slug: string): string | null {
  return resolveConditionSlugs(slug)[0] ?? null;
}
