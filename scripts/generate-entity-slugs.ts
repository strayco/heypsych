/**
 * ENTITY SLUG MANIFEST GENERATOR
 *
 * `/conditions/[slug]` and `/resources/[slug]` render on demand (the static
 * generation policy classifies them `on_demand`): `generateStaticParams`
 * returns an empty list and `dynamicParams` stays true. Every URL under those
 * prefixes therefore reaches the page component, and an unknown slug renders a
 * shell before `notFound()` resolves - the response is HTTP 200 with no
 * content, which Google classes as a soft 404.
 *
 * Unlike `/treatments`, the fix cannot be `dynamicParams = false`: that would
 * 404 the entire section, because the policy deliberately pre-renders none of
 * these pages. Instead this script snapshots the set of slugs that genuinely
 * exist so middleware can reject unknown ones with a real 404 before rendering
 * begins, leaving on-demand rendering of real pages untouched.
 *
 * Static sibling routes (`/conditions/anxiety-fear`, `/resources/knowledge-hub`)
 * are real pages that are not database rows, so they are read from the app
 * directory and included - omitting them would 404 working hubs.
 *
 * Slugs come from the data/ files the pages render. The generator still fails
 * rather than emitting an empty or short manifest, so a broken checkout can
 * never ship a middleware that 404s a whole section.
 *
 * Run via `npm run generate:entity-slugs` (wired into prebuild).
 */

import fs from "fs";
import path from "path";
import { getLocalRowsByType } from "../src/lib/data/local-entities";

const OUTPUT_PATH = path.join(
  process.cwd(),
  "src/lib/entities/entity-slugs.generated.ts"
);

/**
 * Minimum rows expected per section. Guards against a partially-populated
 * database producing a manifest that 404s most of the section.
 */
const MIN_EXPECTED: Record<string, number> = {
  condition: 100,
  resource: 50,
};

/** Sibling directories under an app route that are real pages, not [slug] rows. */
function readStaticSegments(routeDir: string): string[] {
  const dir = path.join(process.cwd(), "src/app", routeDir);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    // Dynamic and private segments are not literal URL paths.
    .filter((entry) => !entry.name.startsWith("[") && !entry.name.startsWith("_"))
    .map((entry) => entry.name)
    .sort();
}

/**
 * Active slugs of one entity type, from the data/ files the pages render
 * (src/lib/data/local-entities.ts), so the manifest always matches the site.
 */
async function fetchSlugs(entityType: "condition" | "resource"): Promise<string[]> {
  return getLocalRowsByType(entityType).map((r) => r.slug).filter(Boolean);
}

async function collectSlugs(
  entityType: "condition" | "resource",
  routeDir: string
): Promise<string[]> {
  const dbSlugs = await fetchSlugs(entityType);

  const minimum = MIN_EXPECTED[entityType] ?? 1;
  if (dbSlugs.length < minimum) {
    throw new Error(
      `Only ${dbSlugs.length} ${entityType} slugs returned (expected at least ${minimum}). ` +
        `Refusing to generate a manifest that would 404 live pages. ` +
        `Check the data/ content files before building.`
    );
  }

  const staticSegments = readStaticSegments(routeDir);
  const all = new Set([...dbSlugs, ...staticSegments]);

  console.log(
    `  ${routeDir}: ${dbSlugs.length} from data files + ${staticSegments.length} static routes = ${all.size} slugs`
  );

  return [...all].sort();
}

/** Slugs of every JSON record under a data directory (recursively). */
function readDataSlugs(dataDir: string): Set<string> {
  const root = path.join(process.cwd(), dataDir);
  const slugs = new Set<string>();
  if (!fs.existsSync(root)) return slugs;

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.name.endsWith(".json")) {
        try {
          const record = JSON.parse(fs.readFileSync(full, "utf8"));
          slugs.add(record.slug || path.basename(entry.name, ".json"));
        } catch {
          // Unparseable files are reported by the data validators, not here.
        }
      }
    }
  };
  walk(root);
  return slugs;
}

/**
 * Resource rows that are only stubs of a patient tool. The database holds a
 * `resource` row for most tools, but the review lives at `/tools/[slug]`;
 * `/resources/[slug]` renders an empty card for them. Middleware 301s these
 * to the tool page and search links there directly.
 *
 * A slug that is also a genuine support or assessment resource (NAMI, Crisis
 * Text Line) keeps its resource page.
 */
function collectToolStubSlugs(resourceSlugs: string[]): string[] {
  const toolSlugs = readDataSlugs("data/resources/tools");
  const genuine = new Set([
    ...readDataSlugs("data/resources/support-community"),
    ...readDataSlugs("data/resources/assessments-screeners"),
  ]);
  // Every tool file, whatever its status: an archived or merged tool still
  // has its old /resources/<slug> URL redirected to /tools/<slug>, where the
  // tools section decides what to show.
  void resourceSlugs;
  const stubs = [...toolSlugs].filter((s) => !genuine.has(s)).sort();
  console.log(`  resources: ${stubs.length} tool stubs redirect to /tools`);
  return stubs;
}

function serializeSet(name: string, slugs: string[]): string {
  const entries = slugs.map((s) => `  ${JSON.stringify(s)},`).join("\n");
  return `export const ${name}: ReadonlySet<string> = new Set([\n${entries}\n]);`;
}

async function main() {
  console.log("Generating entity slug manifest...");

  const conditionSlugs = await collectSlugs("condition", "conditions");
  const resourceSlugs = await collectSlugs("resource", "resources");
  const toolStubSlugs = collectToolStubSlugs(resourceSlugs);

  const output = `/**
 * GENERATED FILE - DO NOT EDIT
 *
 * Regenerate with: npm run generate:entity-slugs
 * Source: scripts/generate-entity-slugs.ts
 *
 * The set of slugs that resolve to a real page under each database-backed
 * route, used by middleware to answer unknown URLs with a true 404 instead of
 * a soft 404. Includes static sibling routes, which are real pages but not
 * database rows.
 *
 * Generated: ${new Date().toISOString()}
 */

${serializeSet("CONDITION_SLUGS", conditionSlugs)}

${serializeSet("RESOURCE_SLUGS", resourceSlugs)}

/** Resource slugs that are tool stubs; \`/resources/[slug]\` 301s to \`/tools/[slug]\`. */
${serializeSet("RESOURCE_TOOL_STUB_SLUGS", toolStubSlugs)}

/**
 * Whether a slug resolves to a real page under the given route.
 *
 * Returns true when the manifest is empty so that a failed generation degrades
 * to today's behaviour (soft 404) rather than 404-ing a whole section.
 */
export function entitySlugExists(
  route: "conditions" | "resources",
  slug: string
): boolean {
  const slugs = route === "conditions" ? CONDITION_SLUGS : RESOURCE_SLUGS;
  if (slugs.size === 0) return true;
  return slugs.has(slug);
}

/** Whether \`/resources/[slug]\` is a stub whose real page is \`/tools/[slug]\`. */
export function isResourceToolStub(slug: string): boolean {
  return RESOURCE_TOOL_STUB_SLUGS.has(slug);
}
`;

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, output, "utf8");

  console.log(
    `\nWrote ${conditionSlugs.length} condition + ${resourceSlugs.length} resource slugs to ${path.relative(process.cwd(), OUTPUT_PATH)}`
  );
}

main().catch((error) => {
  console.error("\nEntity slug generation failed:", error.message);
  // The manifest is committed. If the database can't be reached at build
  // time, building with the last good manifest is safe (it only decides 404 vs
  // page for unknown URLs); building with an empty one is not, so that still
  // fails. Never overwrite the committed file with a bad result.
  const existing = fs.existsSync(OUTPUT_PATH) ? fs.readFileSync(OUTPUT_PATH, "utf8") : "";
  const kept = (existing.match(/^ {2}"[^"]+",$/gm) ?? []).length;
  if (kept >= (MIN_EXPECTED.condition ?? 1) + (MIN_EXPECTED.resource ?? 1)) {
    console.warn(`Keeping the committed manifest (${kept} slugs) and continuing the build.`);
    process.exit(0);
  }
  process.exit(1);
});
