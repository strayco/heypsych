/**
 * Private-data isolation by construction: no client component (or anything a
 * public page renders) imports the engine, the server helpers or the store,
 * and the only public data path is the approved projection.
 */
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const SRC = path.join(process.cwd(), "src");
function walk(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" || e.name === "__tests__" ? [] : walk(p);
    return /\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
}
const files = walk(SRC).map((f) => ({ f: path.relative(process.cwd(), f), s: fs.readFileSync(f, "utf8") }));
const PRIVATE = /(from\s+|import\()["']@\/domains\/consensus\/(engine|server)["']|from\s+["']\.\/(engine|server)["']/;

describe("consensus private-data isolation", () => {
  it("no client component imports the engine or server helpers", () => {
    const offenders = files.filter(({ s }) => /^\s*["']use client["']/m.test(s.slice(0, 200)) && PRIVATE.test(s)).map(({ f }) => f);
    expect(offenders).toEqual([]);
  });

  it("only the Admin API and the cached public reader import the private modules", () => {
    const importers = files.filter(({ f, s }) => PRIVATE.test(s) && !f.startsWith("src/domains/consensus/")).map(({ f }) => f).sort();
    expect(importers).toEqual(["src/app/api/hp-ctrl-8k3m9x/consensus/route.ts", "src/lib/live/state.ts"]);
  });

  it("public pages read scores only through getPublicConsensus", () => {
    const readers = files.filter(({ f, s }) => /getPublicConsensus\(/.test(s) && !f.startsWith("src/lib/live/")).map(({ f }) => f).sort();
    expect(readers).toEqual(["src/app/architect/page.tsx", "src/app/tools/compare/[slug]/page.tsx", "src/app/tools/for-clinicians/[category]/[slug]/page.tsx"]);
  });
});
