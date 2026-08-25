/**
 * TREATMENT ALIAS MAP GENERATOR
 *
 * Canonical treatment URLs are compound slugs: `/treatments/sertraline-zoloft`.
 * Real search demand is for the parts, not the compound - people search
 * "sertraline" and "zoloft", never "sertraline zoloft". Those bare URLs
 * previously resolved to nothing, and because the route streams a prerendered
 * shell, `notFound()` could not set a status: they returned HTTP 200 with an
 * empty skeleton. Google reads that as a soft 404, which burns crawl budget and
 * drags down sitewide quality signals.
 *
 * This script precomputes `alias -> canonical slug` so middleware can answer
 * with a real 301 before any rendering happens. Middleware runs on the edge and
 * cannot read the filesystem, so the map has to be generated into a module that
 * gets bundled.
 *
 * Ambiguous aliases are dropped rather than guessed: when two drugs share a
 * brand name, redirecting to either one would be wrong, so the alias is omitted
 * and the URL 404s honestly.
 *
 * Run via `npm run generate:treatment-aliases` (wired into prebuild).
 */

import fs from "fs";
import path from "path";

const TREATMENTS_DIR = path.join(process.cwd(), "data/treatments");
const MODALITY_DIRS = [
  "medications",
  "therapy",
  "interventional",
  "investigational",
  "supplements",
  "alternative",
];

const OUTPUT_PATH = path.join(
  process.cwd(),
  "src/lib/treatments/treatment-aliases.generated.ts"
);

/** Normalize a human name into a URL slug fragment. */
function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Strip version/legacy suffixes from a filename to get its implied slug. */
function deriveSlugFromFilename(fileName: string): string {
  return fileName
    .replace(/\.json$/i, "")
    .replace(/\.legacy$/i, "")
    .replace(/-v2$/i, "")
    .replace(/-E$/i, "-e")
    // Filenames are not consistently cased (e.g. `acamprosate-Campral.json`)
    // but URLs are matched case-sensitively, so aliases must be lowercase.
    .toLowerCase();
}

/**
 * Brand-name fields sometimes carry placeholders rather than an actual brand.
 * Turning those into URLs would invent pages like `/treatments/various-brands`.
 */
const PLACEHOLDER_BRANDS = new Set([
  "various",
  "various-brands",
  "generic",
  "generic-only",
  "none",
  "n-a",
  "na",
  "multiple",
  "multiple-brands",
  "brand-names-vary",
  "discontinued",
  "unbranded",
]);

interface TreatmentRecord {
  canonicalSlug: string;
  aliases: string[];
}

function collectTreatments(): TreatmentRecord[] {
  const records: TreatmentRecord[] = [];

  for (const modality of MODALITY_DIRS) {
    const dir = path.join(TREATMENTS_DIR, modality);
    if (!fs.existsSync(dir)) continue;

    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      if (file.includes(".legacy.")) continue;

      let data: any;
      try {
        data = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
      } catch {
        continue;
      }

      // Mirror the canonical loader's publication gate so we never advertise a
      // redirect target that the page itself refuses to render.
      if (data.kind && data.kind !== "treatment") continue;
      if (data.draft === true || data.noIndex === true) continue;

      const canonicalSlug: string | undefined = data.identity?.slug || data.slug;
      if (!canonicalSlug) continue;

      const aliases = new Set<string>();

      // Filename-derived slug (e.g. `sertraline-zoloft-v2.json`).
      aliases.add(deriveSlugFromFilename(file));

      // Generic ingredient name - the highest-volume query form.
      const generic: string | undefined =
        data.identity?.generic_name || data.metadata?.generic_name;
      if (generic) aliases.add(slugify(generic));

      // Brand names, which often outrank the generic in search volume.
      const brands: string[] =
        data.identity?.brand_names || data.metadata?.brand_names || [];
      for (const brand of brands) {
        if (typeof brand !== "string" || !brand.trim()) continue;
        const brandSlug = slugify(brand);
        if (!brandSlug || PLACEHOLDER_BRANDS.has(brandSlug)) continue;
        aliases.add(brandSlug);
      }

      // "Sertraline (Zoloft)" -> "sertraline"
      const name: string | undefined = data.identity?.name || data.name;
      const parenMatch = name?.match(/^([^(]+)\s*\(/);
      if (parenMatch) aliases.add(slugify(parenMatch[1]));

      records.push({
        canonicalSlug,
        aliases: [...aliases].filter(Boolean),
      });
    }
  }

  return records;
}

function buildAliasMap(records: TreatmentRecord[]): {
  map: Record<string, string>;
  canonicalSlugs: Set<string>;
  dropped: Array<{ alias: string; targets: string[] }>;
} {
  const canonicalSlugs = new Set(records.map((r) => r.canonicalSlug));

  // alias -> set of canonical targets, so collisions are detectable.
  const candidates = new Map<string, Set<string>>();

  for (const record of records) {
    for (const alias of record.aliases) {
      // An alias that is already a real page must never be redirected.
      if (canonicalSlugs.has(alias)) continue;

      if (!candidates.has(alias)) candidates.set(alias, new Set());
      candidates.get(alias)!.add(record.canonicalSlug);
    }
  }

  const map: Record<string, string> = {};
  const dropped: Array<{ alias: string; targets: string[] }> = [];

  for (const [alias, targets] of candidates) {
    if (targets.size === 1) {
      map[alias] = [...targets][0];
    } else {
      // Ambiguous: two treatments claim the same alias. Guessing would send
      // users and crawlers to the wrong drug, so let it 404 instead.
      dropped.push({ alias, targets: [...targets].sort() });
    }
  }

  return { map, canonicalSlugs, dropped };
}

function render(map: Record<string, string>, canonicalSlugs: Set<string>): string {
  const sortedAliases = Object.keys(map).sort();
  const aliasEntries = sortedAliases
    .map((alias) => `  ${JSON.stringify(alias)}: ${JSON.stringify(map[alias])},`)
    .join("\n");

  const sortedCanonical = [...canonicalSlugs].sort();
  const canonicalEntries = sortedCanonical
    .map((slug) => `  ${JSON.stringify(slug)},`)
    .join("\n");

  return `/**
 * GENERATED FILE - DO NOT EDIT
 *
 * Produced by scripts/generate-treatment-aliases.ts from data/treatments/.
 * Run \`npm run generate:treatment-aliases\` to regenerate.
 *
 * Maps alternate treatment slugs (generic ingredient names, brand names,
 * filename-derived slugs) to the canonical slug that actually renders a page.
 * Consumed by middleware to issue 301s before rendering, so the redirect
 * carries a real status code instead of a streamed soft 404.
 */

/** alias slug -> canonical slug */
export const TREATMENT_SLUG_ALIASES: Readonly<Record<string, string>> = {
${aliasEntries}
};

/** Every slug that resolves to a real treatment page. */
export const CANONICAL_TREATMENT_SLUGS: ReadonlySet<string> = new Set([
${canonicalEntries}
]);

/**
 * Resolve a requested treatment slug to the canonical slug it should redirect
 * to, or \`null\` when the slug is already canonical or entirely unknown.
 */
export function resolveTreatmentAlias(slug: string): string | null {
  const target = TREATMENT_SLUG_ALIASES[slug];
  return target && target !== slug ? target : null;
}
`;
}

function main(): void {
  const records = collectTreatments();
  const { map, canonicalSlugs, dropped } = buildAliasMap(records);

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, render(map, canonicalSlugs), "utf-8");

  console.log(
    `[treatment-aliases] ${canonicalSlugs.size} canonical slugs, ` +
      `${Object.keys(map).length} aliases -> ${path.relative(process.cwd(), OUTPUT_PATH)}`
  );

  if (dropped.length > 0) {
    console.log(
      `[treatment-aliases] ${dropped.length} ambiguous aliases omitted (they will 404):`
    );
    for (const { alias, targets } of dropped.slice(0, 20)) {
      console.log(`  - ${alias} -> ${targets.join(" | ")}`);
    }
    if (dropped.length > 20) {
      console.log(`  ... and ${dropped.length - 20} more`);
    }
  }
}

main();
