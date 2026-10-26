import { describe, expect, it } from "vitest";
import { resolveOutbound } from "../outbound";
import { clearKillSwitchCache } from "../kill-switch";

describe("resolveOutbound", () => {
  it("uses the vendor site, untracked, when there is no active agreement", () => {
    const o = resolveOutbound({
      slug: "x",
      affiliateUrl: "https://partner.example/?ref=hp",
      websiteUrl: "https://vendor.example",
      commercial: { status: "unknown" },
    });
    expect(o?.href).toBe("https://vendor.example/");
    expect(o?.partner).toBe(false);
    expect(o?.disclosure).toBeNull();
  });

  it("uses a partner link only for an active affiliate, with disclosure and rel=sponsored", () => {
    clearKillSwitchCache();
    const o = resolveOutbound({
      slug: "x",
      affiliateUrl: "https://partner.example/?ref=hp",
      websiteUrl: "https://vendor.example",
      commercial: { status: "active_affiliate" },
    });
    expect(o?.partner).toBe(true);
    expect(o?.rel).toContain("sponsored");
    expect(o?.disclosure).toBeTruthy();
  });

  it("drops non-http links", () => {
    expect(resolveOutbound({ slug: "x", websiteUrl: "javascript:alert(1)" })).toBeNull();
  });
});
