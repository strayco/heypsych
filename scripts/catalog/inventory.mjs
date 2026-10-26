#!/usr/bin/env node
/**
 * Catalog inventory.
 *
 * Reads every product record on disk and reports what is actually there:
 * coverage, review status, evidence gaps, and suspected duplicates.
 *
 * This exists so catalog claims in planning documents can be checked against
 * the repository rather than estimated. It only reads; it never writes.
 *
 * Usage:
 *   node scripts/catalog/inventory.mjs            # summary
 *   node scripts/catalog/inventory.mjs --json     # machine-readable
 *   node scripts/catalog/inventory.mjs --gaps     # per-product gap detail
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const PRODUCTS_DIR = "data/tools-v4/products";

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...walk(path));
    else if (entry.endsWith(".json")) out.push(path);
  }
  return out;
}

/** Normalized form used only for duplicate detection. */
function normalizeName(name) {
  return (name ?? "")
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|co|corp|software|health|healthcare|ehr|emr|platform|suite|app)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const files = walk(PRODUCTS_DIR);
const products = [];
const unreadable = [];

for (const file of files) {
  try {
    products.push({ file, data: JSON.parse(readFileSync(file, "utf8")) });
  } catch (error) {
    unreadable.push({ file, error: error.message });
  }
}

// --- Aggregates -------------------------------------------------------------

const byCategory = new Map();
const byStatus = new Map();
const byPricingModel = new Map();
const byBaa = new Map();
const byHipaa = new Map();

let needsReview = 0;
let neverReviewed = 0;
let noCapabilities = 0;
let noPricing = 0;
let noWebsite = 0;
let qualityScores = [];

const STALE_DAYS = 180;
const now = Date.now();
let staleReviews = 0;

const gaps = [];
const nameIndex = new Map();
const slugIndex = new Map();

for (const { file, data } of products) {
  const category = data.primary_category ?? "(none)";
  byCategory.set(category, (byCategory.get(category) ?? 0) + 1);

  const status = data.lifecycle?.status ?? data.status ?? "(none)";
  byStatus.set(status, (byStatus.get(status) ?? 0) + 1);

  const pricingModel = data.pricing?.model ?? "(none)";
  byPricingModel.set(pricingModel, (byPricingModel.get(pricingModel) ?? 0) + 1);

  const baa = data.compliance?.baa_available ?? "(absent)";
  byBaa.set(baa, (byBaa.get(baa) ?? 0) + 1);

  const hipaa = data.compliance?.hipaa_support ?? "(absent)";
  byHipaa.set(hipaa, (byHipaa.get(hipaa) ?? 0) + 1);

  const gov = data.governance ?? {};
  if (gov.needs_review) needsReview++;
  if (!gov.last_reviewed) neverReviewed++;
  else {
    const age = (now - Date.parse(gov.last_reviewed)) / 86_400_000;
    if (age > STALE_DAYS) staleReviews++;
  }
  if (typeof gov.data_quality_score === "number") {
    qualityScores.push(gov.data_quality_score);
  }

  const productGaps = [];
  if (!data.capabilities?.length) {
    noCapabilities++;
    productGaps.push("no capabilities");
  }
  if (!data.pricing || data.pricing.model === undefined) {
    noPricing++;
    productGaps.push("no pricing model");
  }
  if (!data.website_url) {
    noWebsite++;
    productGaps.push("no website url");
  }
  if (!data.compliance?.baa_available || data.compliance.baa_available === "unknown") {
    productGaps.push("BAA unknown");
  }
  if (!gov.last_reviewed) productGaps.push("never reviewed");

  if (productGaps.length) {
    gaps.push({ slug: data.slug, category, gaps: productGaps });
  }

  // Duplicate detection.
  const key = normalizeName(data.name);
  if (key) {
    if (!nameIndex.has(key)) nameIndex.set(key, []);
    nameIndex.get(key).push({ slug: data.slug, name: data.name, category, file });
  }
  if (!slugIndex.has(data.slug)) slugIndex.set(data.slug, []);
  slugIndex.get(data.slug).push(file);
}

const duplicateNames = [...nameIndex.entries()]
  .filter(([, list]) => list.length > 1)
  .map(([key, list]) => ({ key, products: list }));

const duplicateSlugs = [...slugIndex.entries()].filter(
  ([, list]) => list.length > 1
);

const report = {
  generatedAt: new Date().toISOString(),
  totalFiles: files.length,
  parsed: products.length,
  unreadable,
  byCategory: Object.fromEntries([...byCategory].sort((a, b) => b[1] - a[1])),
  byStatus: Object.fromEntries([...byStatus].sort((a, b) => b[1] - a[1])),
  byPricingModel: Object.fromEntries(
    [...byPricingModel].sort((a, b) => b[1] - a[1])
  ),
  compliance: {
    baaAvailable: Object.fromEntries([...byBaa].sort((a, b) => b[1] - a[1])),
    hipaaSupport: Object.fromEntries([...byHipaa].sort((a, b) => b[1] - a[1])),
  },
  review: {
    flaggedNeedsReview: needsReview,
    neverReviewed,
    reviewedButStale: staleReviews,
    staleThresholdDays: STALE_DAYS,
    meanDataQualityScore:
      qualityScores.length > 0
        ? Math.round(
            (qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length) * 10
          ) / 10
        : null,
  },
  evidenceGaps: {
    noCapabilities,
    noPricingModel: noPricing,
    noWebsiteUrl: noWebsite,
    productsWithAnyGap: gaps.length,
  },
  duplicates: {
    duplicateSlugs: duplicateSlugs.length,
    suspectedDuplicateNames: duplicateNames.length,
    examples: duplicateNames.slice(0, 15),
  },
};

/**
 * Research queue from the Practice Architect 3.1 specification.
 *
 * This is a lookup list, not a recommendation list. Presence in the catalog
 * does not mean the product has been clinically reviewed.
 */
const RESEARCH_QUEUE = [
  // A. EHR
  "simplepractice", "therapynotes", "sessions-health", "jane", "intakeq-practiceq",
  "theranest", "ensora", "therapyappointment", "theraplatform", "icanotes",
  "valant", "valant-ehr-suite", "luminello", "tebra", "cliniko", "practice-better",
  "carepatron", "healthie", "zanda", "owl-practice", "qualifacts-insync",
  // B. Psychiatry
  "rxnt", "charmhealth", "drchrono", "advancedmd", "osmind",
  // C. Assessment
  "pearson-clinical", "q-global", "q-interactive",
  // D. AI notes
  "mentalyc", "upheal", "blueprint", "autonotes",
  // E. Scheduling / intake
  "calendly", "acuity-scheduling", "jotform",
  // F. Telehealth
  "zoom-for-healthcare", "doxy-me",
  // G. Payments
  "stripe", "square", "ivy-pay",
  // H. Websites
  "squarespace", "wix", "wordpress", "therapysites", "brighter-vision",
  "psychology-today",
  // I. Accounting
  "quickbooks", "xero", "wave", "wave-accounting",
  // J. Malpractice — matched by category rather than a single slug
];

if (process.argv.includes("--queue")) {
  const slugs = new Set(products.map((p) => p.data.slug));
  const names = new Map(
    products.map((p) => [normalizeName(p.data.name), p.data.slug])
  );
  console.log("\nRESEARCH QUEUE vs CATALOG");
  console.log("=========================");
  let found = 0;
  let missing = 0;
  for (const slug of RESEARCH_QUEUE) {
    const hit =
      slugs.has(slug) ||
      names.get(normalizeName(slug.replace(/-/g, " ")));
    if (hit) {
      found++;
      console.log(`  in catalog   ${slug}${typeof hit === "string" && hit !== slug ? `  (as ${hit})` : ""}`);
    } else {
      missing++;
      console.log(`  MISSING      ${slug}`);
    }
  }
  const malpractice = products.filter(
    (p) => p.data.primary_category === "malpractice-insurance"
  );
  console.log(`\n  malpractice records: ${malpractice.length}`);
  console.log(`  queue found: ${found}  missing: ${missing}\n`);
  process.exit(0);
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(report, null, 2));
} else if (process.argv.includes("--gaps")) {
  for (const g of gaps) console.log(`${g.slug}  [${g.category}]  ${g.gaps.join(", ")}`);
  console.log(`\n${gaps.length} products with at least one gap`);
} else {
  const line = (label, value) => console.log(`  ${label.padEnd(34)} ${value}`);
  console.log("\nCATALOG INVENTORY");
  console.log("=================");
  line("product files", report.totalFiles);
  line("parsed successfully", report.parsed);
  line("unreadable", report.unreadable.length);

  console.log("\nBy lifecycle status");
  for (const [k, v] of Object.entries(report.byStatus)) line(k, v);

  console.log("\nBy category");
  for (const [k, v] of Object.entries(report.byCategory)) line(k, v);

  console.log("\nReview state");
  line("flagged needs_review", report.review.flaggedNeedsReview);
  line("never reviewed", report.review.neverReviewed);
  line(`reviewed > ${STALE_DAYS}d ago`, report.review.reviewedButStale);
  line("mean data_quality_score", report.review.meanDataQualityScore);

  console.log("\nEvidence gaps");
  line("no capabilities", report.evidenceGaps.noCapabilities);
  line("no pricing model", report.evidenceGaps.noPricingModel);
  line("no website url", report.evidenceGaps.noWebsiteUrl);
  line("any gap", report.evidenceGaps.productsWithAnyGap);

  console.log("\nBAA availability");
  for (const [k, v] of Object.entries(report.compliance.baaAvailable)) line(k, v);

  console.log("\nDuplicates");
  line("duplicate slugs", report.duplicates.duplicateSlugs);
  line("suspected duplicate names", report.duplicates.suspectedDuplicateNames);
  for (const d of report.duplicates.examples.slice(0, 10)) {
    console.log(`    ${d.products.map((p) => p.slug).join("  |  ")}`);
  }
  console.log();
}
