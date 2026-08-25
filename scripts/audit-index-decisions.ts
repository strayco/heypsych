/**
 * INDEX DECISION AUDIT
 *
 * Prints, for a whole entity cohort, what the central indexation firewall
 * decides and why. The point is to make "why is this page noindex?" a question
 * with a data answer rather than a guess, and to show how far short of each
 * quality gate the corpus actually falls.
 *
 * Usage:
 *   npx tsx scripts/audit-index-decisions.ts conditions
 *   npx tsx scripts/audit-index-decisions.ts resources
 *   npx tsx scripts/audit-index-decisions.ts treatments
 */

import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

async function main() {
  const target = (process.argv[2] || "conditions").toLowerCase();

  const { makeEntityIndexDecision } = await import(
    "../src/lib/seo/index-decision-service"
  );
  const { EntityService } = await import("../src/lib/data/entity-service");

  const typeMap: Record<string, { type: string; pathFor: (slug: string) => string }> = {
    conditions: { type: "condition", pathFor: (s) => `/conditions/${s}` },
    resources: { type: "resource", pathFor: (s) => `/resources/${s}` },
    treatments: { type: "medication", pathFor: (s) => `/treatments/${s}` },
  };

  let entities: Awaited<ReturnType<typeof EntityService.getByType>>;
  let cfg: { type: string; pathFor: (slug: string) => string };

  if (target === "treatments-local") {
    // Treatment pages render from local JSON, so this is the shape whose
    // decision must match the robots tag the page actually emits.
    const { getAllTreatmentSlugs, loadTreatment } = await import(
      "../src/lib/comparison/treatment-loader"
    );
    const { treatmentV3ToEntity } = await import(
      "../src/lib/comparison/treatment-entity-adapter"
    );

    cfg = { type: "medication", pathFor: (s) => `/treatments/${s}` };
    const loaded = [];
    for (const slug of getAllTreatmentSlugs()) {
      const t = await loadTreatment(slug);
      if (t) loaded.push(treatmentV3ToEntity(t));
    }
    entities = loaded as typeof entities;
    console.log(`Loaded ${entities.length} treatments from local JSON\n`);
  } else {
    const resolved = typeMap[target];
    if (!resolved) {
      console.error(
        `Unknown target "${target}". Use conditions|resources|treatments|treatments-local.`
      );
      process.exit(1);
    }
    cfg = resolved;
    entities = await EntityService.getByType(cfg.type as never);
    console.log(`Loaded ${entities.length} ${target} from database\n`);
  }

  if (entities.length === 0) {
    console.error("No entities loaded - cannot audit. Check database credentials.");
    process.exit(2);
  }

  const byCohort: Record<string, number> = {};
  const reasonCounts: Record<string, number> = {};
  const wordCounts: number[] = [];
  const completeness: number[] = [];
  const failures: Array<{ slug: string; reason: string }> = [];

  for (const entity of entities) {
    const decision = makeEntityIndexDecision(entity, cfg.pathFor(entity.slug));

    byCohort[decision.cohort] = (byCohort[decision.cohort] ?? 0) + 1;

    const quality = decision.evidence?.quality ?? {};
    if (typeof quality.wordCount === "number") wordCounts.push(quality.wordCount);
    if (typeof quality.clinicalCompletenessScore === "number") {
      completeness.push(quality.clinicalCompletenessScore);
    }

    if (!decision.indexable) {
      const raw = decision.reasons[0] ?? `cohort:${decision.cohort}`;
      // Collapse per-entity numbers so reasons aggregate into buckets.
      const normalized = raw.replace(/\d+/g, "N");
      reasonCounts[normalized] = (reasonCounts[normalized] ?? 0) + 1;
      failures.push({ slug: entity.slug, reason: raw });
    }
  }

  const pct = (n: number) => ((n / entities.length) * 100).toFixed(1) + "%";

  console.log("=== COHORTS ===");
  for (const [cohort, count] of Object.entries(byCohort).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cohort.padEnd(20)} ${String(count).padStart(4)}  ${pct(count)}`);
  }

  console.log("\n=== TOP NON-INDEXABLE REASONS ===");
  for (const [reason, count] of Object.entries(reasonCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)) {
    console.log(`  ${String(count).padStart(4)}x  ${reason}`);
  }

  const stats = (label: string, values: number[]) => {
    if (values.length === 0) return;
    const sorted = [...values].sort((a, b) => a - b);
    const at = (q: number) => sorted[Math.floor(sorted.length * q)];
    console.log(
      `  ${label.padEnd(22)} min=${sorted[0]?.toFixed(2)} p25=${at(0.25)?.toFixed(2)} ` +
        `median=${at(0.5)?.toFixed(2)} p75=${at(0.75)?.toFixed(2)} max=${sorted[sorted.length - 1]?.toFixed(2)}`
    );
  };

  console.log("\n=== QUALITY DISTRIBUTION ===");
  stats("word count", wordCounts);
  stats("clinical completeness", completeness);

  console.log("\n=== SAMPLE FAILURES ===");
  for (const f of failures.slice(0, 12)) {
    console.log(`  ${f.slug.padEnd(45)} ${f.reason}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
