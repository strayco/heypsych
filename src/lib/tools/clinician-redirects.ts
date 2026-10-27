/**
 * Clinician Apps & Tools consolidation (2026-10-23): permanent redirects from
 * the retired landers, audience pages and programmatic guides to the hub, a
 * job page, a profile, or Practice Architect.
 *
 * Imported by next.config.ts, so this file uses relative imports only (no
 * "@/" aliases) and reads the catalog from disk. Destinations that depend on
 * the catalog (a product's profile) are built from the product files, so a
 * product leaving the catalog stops being a redirect target automatically.
 */

import fs from "fs";
import path from "path";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "../schemas/clinician-tool-v4";

export interface Redirect {
  source: string;
  destination: string;
  permanent: true;
}

const HUB = "/tools/for-clinicians";
const job = (slug: string, practice?: string) =>
  `${HUB}/${slug}${practice ? `?practice=${practice}` : ""}`;
const hubFor = (practice: string) => `${HUB}?practice=${practice}`;

const EHR = "ehr-practice-management";
const NOTES = "ai-scribe-documentation";
const BILLING = "billing-rcm";
const NETWORKS = "provider-networks";
const VIDEO = "telehealth-communication";
const MEASURES = "measurement-outcomes";

interface Product {
  slug: string;
  path: string;
}

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

/** Published-or-not, every product file with its canonical profile path. */
export function loadProductPaths(root: string): Product[] {
  const dir = path.join(root, "data/tools-v4/products");
  if (!fs.existsSync(dir)) return [];
  const out: Product[] = [];
  for (const sub of fs.readdirSync(dir)) {
    const subdir = path.join(dir, sub);
    if (!fs.statSync(subdir).isDirectory()) continue;
    for (const f of fs.readdirSync(subdir)) {
      if (!f.endsWith(".json")) continue;
      try {
        const rec = readJson(path.join(subdir, f)) as { slug?: string; primary_category?: string };
        if (!rec.slug || !rec.primary_category) continue;
        const cat =
          SCHEMA_TO_TAXONOMY_CATEGORY[rec.primary_category as keyof typeof SCHEMA_TO_TAXONOMY_CATEGORY] ??
          rec.primary_category;
        out.push({ slug: rec.slug, path: `${HUB}/${cat}/${rec.slug}` });
      } catch {
        // A malformed record is reported by the catalog tests, not here.
      }
    }
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

/** Taxonomy categories with no product: their pages redirect to the hub. */
export function emptyCategories(root: string, products: Product[]): string[] {
  const file = path.join(root, "data/tools-v4/taxonomies/clinician-categories.json");
  if (!fs.existsSync(file)) return [];
  const taxonomy = readJson(file) as { categories: { slug: string }[] };
  const live = new Set(products.map((p) => p.path.split("/")[3]));
  return taxonomy.categories.map((c) => c.slug).filter((slug) => !live.has(slug));
}

const r = (source: string, destination: string): Redirect => ({ source, destination, permanent: true });

/**
 * Retired slugs with one specific destination (data/tools-v4/retired-redirects.json):
 * a duplicate of a live clinician profile, or a consumer service whose real
 * page is the patient profile at /tools/<slug>. A target that is not on disk
 * is skipped, so the slug falls back to the category redirect.
 */
export function loadRetiredTargets(root: string, products: Product[] = loadProductPaths(root)): Map<string, string> {
  const out = new Map<string, string>();
  const file = path.join(root, "data/tools-v4/retired-redirects.json");
  if (!fs.existsSync(file)) return out;
  const data = readJson(file) as { clinician?: Record<string, string>; patient?: Record<string, string> };
  const live = new Map(products.map((p) => [p.slug, p.path]));
  for (const [slug, target] of Object.entries(data.clinician ?? {})) {
    const dest = live.get(target);
    if (dest && !live.has(slug)) out.set(slug, dest);
  }
  for (const [slug, target] of Object.entries(data.patient ?? {})) {
    if (live.has(slug)) continue;
    if (fs.existsSync(path.join(root, "data/resources/tools", `${target}.json`))) out.set(slug, `/tools/${target}`);
  }
  return out;
}

export function buildClinicianRedirects(root: string = process.cwd()): Redirect[] {
  const products = loadProductPaths(root);
  const out: Redirect[] = [];

  // Retired duplicates and consumer services → their one real page. Before the
  // generic integrations/alternatives rules below so these match first.
  for (const [slug, dest] of loadRetiredTargets(root, products)) {
    const clinician = dest.startsWith(`${HUB}/`);
    out.push(
      r(`${HUB}/:category/${slug}`, dest),
      r(`/tools/alternatives/${slug}`, clinician ? `/tools/alternatives/${dest.split("/").pop()}` : dest),
      r(`/tools/integrations/${slug}`, dest)
    );
  }

  // Audience pages → the hub, preselecting the kind of practice.
  out.push(
    r("/tools/for-therapists", hubFor("solo-therapist")),
    r("/tools/for-counselors", hubFor("solo-therapist")),
    r("/tools/for-solo-practice", hubFor("solo-therapist")),
    r("/tools/for-group-practice", hubFor("group-practice")),
    r("/tools/for-psychiatrists", job(EHR, "prescriber")),
    r("/tools/for-practices", HUB),
    r("/tools/for-practices/solo-therapist", hubFor("solo-therapist")),
    r("/tools/for-practices/therapy-group", hubFor("group-practice")),
    r("/tools/for-practices/psychiatry", job(EHR, "prescriber")),
    r("/tools/for-practices/starting-out", "/architect"),
    r("/tools/for-practices/:type", HUB)
  );

  // Topic landers → the job that answers them.
  out.push(
    r("/tools/cheapest-ehr", job(EHR, "budget")),
    r("/tools/ai-documentation", job(NOTES)),
    r("/tools/therapy-billing", job(BILLING)),
    r("/tools/credentialing", job(NETWORKS)),
    r("/tools/telehealth-comparison", job(VIDEO)),
    r("/tools/outcome-measurement", job(MEASURES)),
    r("/tools/hipaa-compliant", HUB),
    r("/tools/with-baa", HUB),
    r("/tools/stacks", "/architect"),
    r("/tools/stacks/:type", "/architect"),
    r("/tools/pricing", HUB),
    r("/tools/pricing/psychiatry-ehr", job(EHR, "prescriber")),
    r("/tools/pricing/:c(mental-health-ehr|therapy-ehr)", job(EHR)),
    r("/tools/pricing/ai-scribe", job(NOTES)),
    r("/tools/pricing/:category", HUB),
    r("/tools/switch-from", HUB),
    r("/tools/switch-from/:slug", "/tools/alternatives/:slug"),
    r("/tools/alternatives", HUB),
    r(`${HUB}/${EHR}/match`, job(EHR))
  );

  // "Best X 20XX" year pages.
  out.push(
    r("/tools/best/:c(psychiatry-ehr)-:year(\\d{4})", job(EHR, "prescriber")),
    r("/tools/best/:c(ehr-software|therapy-software|mental-health-ehr)-:year(\\d{4})", job(EHR)),
    r("/tools/best/ai-scribe-:year(\\d{4})", job(NOTES)),
    r("/tools/best/telehealth-platforms-:year(\\d{4})", job(VIDEO)),
    r("/tools/best/billing-software-:year(\\d{4})", job(BILLING)),
    r("/tools/best/:slug", HUB)
  );

  // "Best for <specialty>" pages.
  const bestFor: [string, string][] = [
    ["therapists", hubFor("solo-therapist")],
    ["counselors", hubFor("solo-therapist")],
    ["psychologists", hubFor("solo-therapist")],
    ["social-workers", hubFor("solo-therapist")],
    ["solo-practice", hubFor("solo-therapist")],
    ["group-practice", hubFor("group-practice")],
    ["insurance-based", hubFor("insurance-billing")],
    ["insurance-billing", job(BILLING, "insurance-billing")],
    ["cash-pay", hubFor("private-pay")],
    ["psychiatrists", job(EHR, "prescriber")],
    ["pmhnps", job(EHR, "prescriber")],
    ["solo-psychiatrists", job(EHR, "prescriber")],
    ["medication-management", job(EHR, "prescriber")],
    ["with-epcs", job(EHR, "prescriber")],
    ["with-telehealth", job(VIDEO)],
    ["with-ai-notes", job(NOTES)],
    ["hipaa-ai-scribe", job(NOTES)],
    ["ai-therapy-notes", job(NOTES)],
    ["ai-scribe-therapists", job(NOTES, "solo-therapist")],
    ["ai-scribe-psychiatrists", job(NOTES, "prescriber")],
    ["ai-scribe-pmhnps", job(NOTES, "prescriber")],
  ];
  for (const [slug, dest] of bestFor) out.push(r(`/tools/best-for/${slug}`, dest));
  out.push(r("/tools/best-for/:specialty", HUB));

  // Integrations and "works with" pages → the product's profile.
  out.push(r("/tools/integrations", HUB));
  for (const p of products) {
    out.push(r(`/tools/integrations/${p.slug}`, p.path));
    out.push(r(`/tools/works-with/${p.slug}/:partner`, p.path));
  }
  out.push(r("/tools/integrations/:slug", HUB), r("/tools/works-with/:product/:partner", HUB));

  // Programmatic clinician guides.
  for (const p of products) {
    out.push(r(`${HUB}/guides/${p.slug}-alternatives`, `/tools/alternatives/${p.slug}`));
    out.push(r(`${HUB}/guides/${p.slug}-pricing`, `${p.path}#pricing`));
  }
  out.push(r(`${HUB}/guides/:slug`, HUB));

  // Legacy V3 hub names → today's job (or the hub when that job is empty).
  const liveJobs = new Set(products.map((p) => p.path.split("/")[3]));
  const jobOrHub = (slug: string, practice?: string) => (liveJobs.has(slug) ? job(slug, practice) : HUB);
  out.push(
    r(`${HUB}/ai-scribes-documentation`, jobOrHub(NOTES)),
    r(`${HUB}/billing-coding`, jobOrHub(BILLING)),
    r(`${HUB}/practice-admin-operations`, jobOrHub(EHR)),
    r(`${HUB}/prescribing-medication-support`, jobOrHub(EHR, "prescriber")),
    r(`${HUB}/clinical-answers-evidence`, HUB),
    r(`${HUB}/patient-engagement-between-visits`, HUB)
  );

  // Taxonomy categories with nothing published.
  for (const slug of emptyCategories(root, products)) out.push(r(`${HUB}/${slug}`, HUB));

  return out;
}
