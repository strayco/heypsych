import { describe, expect, it } from "vitest";
import { loadRecord, looseKey } from "../record-files";

describe("looseKey", () => {
  it("matches file names that differ from slugs", () => {
    expect(looseKey("dextroamphetamine-Dexedrine-v2")).toBe(looseKey("dextroamphetamine-dexedrine"));
    expect(looseKey("valproate-semisodiumdivalproex.legacy")).toBe(looseKey("valproate-semisodium-divalproex"));
    expect(looseKey("propranolol-Inderal.legacy")).toBe(looseKey("propranolol-inderal"));
  });
});

describe("loadRecord", () => {
  it("finds a treatment whose file name is not its slug", () => {
    const record = loadRecord("treatment", "dextroamphetamine-dexedrine") as Record<string, unknown> | null;
    expect(record).not.toBeNull();
    expect(JSON.stringify(record)).toMatch(/Adderall/);
  });

  it("returns null for unknown slugs", () => {
    expect(loadRecord("condition", "not-a-real-condition")).toBeNull();
  });
});
