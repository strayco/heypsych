/**
 * Live updates: overlay safety, config resolution, stable assignment, and
 * (when LIVE_TEST_DB is set) the Postgres store's publish/rollback contract.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { applyToolOverlays, liveVersion, pickEditable, validateToolOverlay } from "../apply-tools";
import { bucketOf, flagOn, resolveConfig, validateCopyValue, validateFlagValue, variantOf } from "../config";
import { FLAGS, COPY, TOOL_EDITABLE_FIELDS } from "../registry";
import { ArchitectProductService } from "@/domains/architect/services/architect-product-service";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import type { ClinicianToolV4 } from "@/lib/schemas/clinician-tool-v4";

let base: ClinicianToolV4[] = [];
beforeAll(async () => {
  base = await ClinicianToolService.getBaseTools();
});

const sp = () => base.find((t) => t.slug === "simplepractice")!;

describe("tool overlays", () => {
  it("only allow-listed fields can be overridden", () => {
    const picked = pickEditable({ name: "X", compliance: { baa_available: "yes" }, commercial: { status: "active_affiliate" }, affiliate_url: "https://evil.example", seo: {}, governance: {} });
    expect(Object.keys(picked)).toEqual(["name"]);
    for (const locked of ["compliance", "commercial", "affiliate_url", "governance", "seo", "editorial"]) {
      expect(TOOL_EDITABLE_FIELDS as readonly string[]).not.toContain(locked);
    }
  });

  it("applies a valid price change and keeps everything else", () => {
    const tool = sp();
    const pricing = { ...tool.pricing!, starting_price_cents: 5900, starting_price_display: "$59/provider/month" };
    const { tools, overriddenSlugs, errors } = applyToolOverlays(base, [{ kind: "tool", key: tool.slug, value: { pricing } }]);
    expect(errors).toEqual([]);
    expect(overriddenSlugs.has(tool.slug)).toBe(true);
    const updated = tools.find((t) => t.slug === tool.slug)!;
    expect(updated.pricing?.starting_price_cents).toBe(5900);
    expect(updated.compliance).toEqual(tool.compliance);
    expect(tools.length).toBe(base.length);
  });

  it("keeps the reviewed record when an overlay is invalid", () => {
    const tool = sp();
    const { tools, errors } = applyToolOverlays(base, [{ kind: "tool", key: tool.slug, value: { pricing: { model: "not-a-model" } } }]);
    expect(errors[0].key).toBe(tool.slug);
    expect(tools.find((t) => t.slug === tool.slug)).toEqual(tool);
    expect(validateToolOverlay(tool, { website_url: "not a url" }).ok).toBe(false);
    expect(validateToolOverlay(tool, { compliance: {} }).ok).toBe(false); // nothing editable
  });

  it("a null overlay means the reviewed record", () => {
    const { tools } = applyToolOverlays(base, [{ kind: "tool", key: "simplepractice", value: null }]);
    expect(tools.find((t) => t.slug === "simplepractice")).toEqual(sp());
  });

  it("creates new tools only with valid, non-colliding records", () => {
    const record = { ...sp(), id: "00000000-0000-4000-8000-000000000001", slug: "new-tool", name: "New Tool" };
    expect(applyToolOverlays(base, [{ kind: "tool-new", key: "new-tool", value: record }]).createdSlugs.has("new-tool")).toBe(true);
    expect(applyToolOverlays(base, [{ kind: "tool-new", key: "simplepractice", value: { ...record, slug: "simplepractice" } }]).errors.length).toBe(1);
    expect(applyToolOverlays(base, [{ kind: "tool-new", key: "other", value: record }]).errors[0].error).toMatch(/Slug must be/);
  });

  it("version changes whenever the set of published rows changes", () => {
    expect(liveVersion([])).toBe("0");
    expect(liveVersion([{ kind: "tool", key: "a", value: {}, id: 3 }])).not.toBe(liveVersion([{ kind: "tool", key: "a", value: {}, id: 4 }]));
  });
});

describe("single source of truth: a published price reaches Practice Architect", () => {
  it("Architect metadata and cost read the merged catalog", async () => {
    const tool = sp();
    const merged = applyToolOverlays(base, [{ kind: "tool", key: tool.slug, value: { pricing: { ...tool.pricing!, starting_price_cents: 12345 } } }]).tools;
    const { deriveArchitectMetadata } = await import("@/domains/architect/adapters/v4-product-adapter");
    const meta = deriveArchitectMetadata(merged.find((t) => t.slug === tool.slug)!);
    expect(meta.pricing?.minPriceCents).toBe(12345);
    const { calculateProductCost } = await import("@/domains/architect/engines/cost-engine");
    const { profileToFingerprint } = await import("@/domains/architect/adapters/profile-to-fingerprint");
    const { createEmptyProfile } = await import("@/domains/architect/schemas/practice-project");
    const cost = calculateProductCost(meta, profileToFingerprint({ ...createEmptyProfile(), roles: ["therapist"], size: "solo" }));
    expect(JSON.stringify(cost)).toContain("12345");
    // And the service path rebuilds when the catalog array changes.
    const first = await ArchitectProductService.loadProducts();
    const again = await ArchitectProductService.loadProducts();
    expect(again.metadataMap).toBe(first.metadataMap);
  });
});

describe("flags, copy and experiments", () => {
  it("falls back to code defaults and ignores unknown or invalid values", () => {
    const config = resolveConfig(
      [
        { kind: "flag", key: "architect.draft-stack", value: { enabled: false, rollout: 100 } },
        { kind: "flag", key: "not.a.flag", value: { enabled: true } },
        { kind: "flag", key: "home.resume-strip", value: { enabled: true, rollout: 250 } },
        { kind: "copy", key: "home.hero.subtitle", value: { text: "<script>x</script>" } },
        { kind: "experiment", key: "architect-draft-cta", value: { active: true } },
      ],
      "v1"
    );
    expect(config.flags["architect.draft-stack"].enabled).toBe(false);
    expect(config.flags["home.resume-strip"]).toEqual({ enabled: FLAGS[1].default, rollout: 100 });
    expect(config.copy["home.hero.subtitle"]).toBe(COPY[0].default);
    expect(config.experiments["architect-draft-cta"].active).toBe(true);
    expect(Object.keys(config.flags)).not.toContain("not.a.flag");
  });

  it("validates copy length and markup", () => {
    expect(validateCopyValue("home.hero.subtitle", { text: "  Clear  next steps.  " })).toBe("Clear next steps.");
    expect(validateCopyValue("home.hero.subtitle", { text: "x".repeat(500) })).toBeNull();
    expect(validateFlagValue({ enabled: true })).toEqual({ enabled: true, rollout: 100 });
    expect(validateFlagValue({ enabled: "yes" })).toBeNull();
  });

  it("assigns rollouts and variants stably and roughly evenly", () => {
    expect(bucketOf("browser-a", "k")).toBe(bucketOf("browser-a", "k"));
    let on = 0;
    for (let i = 0; i < 2000; i += 1) if (flagOn({ enabled: true, rollout: 25 }, `b${i}`, "k")) on += 1;
    expect(on / 2000).toBeGreaterThan(0.2);
    expect(on / 2000).toBeLessThan(0.3);
    const exp = { active: true, variants: [{ id: "a", value: "A" }, { id: "b", value: "B" }] };
    expect(variantOf(exp, "x", "e")).toEqual(variantOf(exp, "x", "e"));
    expect(variantOf({ ...exp, active: false }, "x", "e").id).toBe("a");
    expect(flagOn({ enabled: false, rollout: 100 }, "x", "k")).toBe(false);
  });
});

const DB = process.env.LIVE_TEST_DB;
describe.skipIf(!DB)("Postgres store (LIVE_TEST_DB)", () => {
  afterAll(async () => {
    // Leave no test rows behind in the shared table.
    const { getDbPool } = await import("@/lib/config/db-pool");
    await (await getDbPool()).query("delete from public.hp_live_revisions where key like 'test-%'");
  });
  it("publishes, keeps one published row per key, rolls back by copying", async () => {
    process.env.SUPABASE_DB_URL = DB;
    process.env.DATABASE_SSL = "disable";
    const store = await import("../store");
    await store.ensureSchema();
    const key = `test-${Date.now()}`;
    const d1 = await store.saveDraft("copy", key, { text: "one" }, "first", "test");
    expect(d1.status).toBe("draft");
    const p1 = await store.publishDraft("copy", key);
    await store.saveDraft("copy", key, { text: "two" }, "second", "test");
    const p2 = await store.publishDraft("copy", key);
    let rows = await store.readPublished(["copy"]);
    expect(rows.filter((r) => r.key === key).map((r) => r.value)).toEqual([{ text: "two" }]);
    const back = await store.rollbackTo(p1.id, "test");
    expect(back.restores).toBe(p1.id);
    rows = await store.readPublished(["copy"]);
    expect(rows.filter((r) => r.key === key).map((r) => r.value)).toEqual([{ text: "one" }]);
    const h = await store.history("copy", key);
    expect(h.map((r) => r.status)).toEqual(["published", "superseded", "superseded"]);
    expect(h.some((r) => r.id === p2.id)).toBe(true);
    await expect(store.publishDraft("copy", key)).rejects.toThrow(/no draft/);
    // Preview reads a draft over the published value.
    await store.saveDraft("copy", key, { text: "draft" }, null, "test");
    const preview = await store.readPublished(["copy"], { includeDrafts: true });
    expect(preview.find((r) => r.key === key)?.value).toEqual({ text: "draft" });
    expect((await store.readPublished(["copy"])).find((r) => r.key === key)?.value).toEqual({ text: "one" });
  });
});
