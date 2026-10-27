/**
 * Loads every treatment and condition record through the same loaders the
 * pages use, and builds each page model, so an edit that breaks a record is
 * caught before deploy.
 *
 * Run: npx tsx --tsconfig tsconfig.json scripts/audit/validate-records.ts
 * Exit code 1 if any record fails.
 */

import { getAllTreatmentSlugs, loadTreatment } from "../../src/lib/comparison/treatment-loader";
import { buildTreatmentExperience } from "../../src/domains/treatments/experience/model";
import fs from "node:fs";
import path from "node:path";
import { buildConditionExperience } from "../../src/domains/conditions/experience/model";

async function main() {
  const failures: string[] = [];
  let treatments = 0;
  for (const slug of getAllTreatmentSlugs()) {
    try {
      const t = await loadTreatment(slug);
      if (!t) throw new Error("did not load");
      buildTreatmentExperience(t);
      treatments++;
    } catch (e) {
      failures.push(`treatment ${slug}: ${(e as Error).message}`);
    }
  }
  let conditions = 0;
  const walk = (dir: string): string[] =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(path.join(dir, e.name)) : e.name.endsWith(".json") ? [path.join(dir, e.name)] : []
    );
  for (const file of walk(path.join(process.cwd(), "data/conditions"))) {
    try {
      const c = JSON.parse(fs.readFileSync(file, "utf8"));
      if (!c || typeof c !== "object" || !c.slug) continue;
      buildConditionExperience(c.name ?? c.slug, c.content ?? {}, c.metadata ?? {});
      conditions++;
    } catch (e) {
      failures.push(`condition ${path.relative(process.cwd(), file)}: ${(e as Error).message}`);
    }
  }
  // Everything else must at least be valid JSON.
  for (const dir of ["data/learn", "data/resources", "data/editorial", "data/treatments"]) {
    for (const file of walk(path.join(process.cwd(), dir))) {
      try {
        JSON.parse(fs.readFileSync(file, "utf8"));
      } catch (e) {
        failures.push(`json ${path.relative(process.cwd(), file)}: ${(e as Error).message}`);
      }
    }
  }
  console.log(`treatments ok: ${treatments}, conditions ok: ${conditions}, failures: ${failures.length}`);
  for (const f of failures) console.log("  " + f);
  process.exit(failures.length ? 1 : 0);
}

main();
