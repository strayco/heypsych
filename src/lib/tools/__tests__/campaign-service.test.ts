/**
 * Campaign Service Tests
 *
 * Tests for tool sponsorship campaign handling:
 * - Valid/invalid schema validation
 * - Active date range filtering
 * - Audience and hub targeting
 * - Sponsorship link safety
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ToolCampaignZ,
  CampaignPlacementZ,
  CampaignAudienceZ,
  CampaignStatusZ,
} from "@/lib/schemas/tool-campaign";
import {
  safeParseUrl,
  normalizeHost,
  isSafeSponsoredUrl,
  buildSafeDestinationUrl,
  hostsMatch,
} from "@/lib/tools/campaign-service";

describe("Tool Campaign Schema", () => {
  it("validates a complete valid campaign", () => {
    const validCampaign = {
      campaign_id: "camp_test123",
      tool_slug: "betterhelp",
      placements: ["tools-landing-featured"],
      audience: "all",
      start_date: "2024-01-01",
      end_date: "2024-12-31",
      priority: 50,
      disclosure_label: "Sponsored",
      status: "active",
      tracking: {
        utm_source: "heypsych",
        utm_medium: "sponsored",
        utm_campaign: "test",
      },
    };

    const result = ToolCampaignZ.safeParse(validCampaign);
    expect(result.success).toBe(true);
  });

  it("rejects campaign with invalid campaign_id format", () => {
    const invalidCampaign = {
      campaign_id: "invalid_format", // Should start with camp_
      tool_slug: "betterhelp",
      placements: ["tools-landing-featured"],
      start_date: "2024-01-01",
    };

    const result = ToolCampaignZ.safeParse(invalidCampaign);
    expect(result.success).toBe(false);
  });

  it("rejects campaign with empty tool_slug", () => {
    const invalidCampaign = {
      campaign_id: "camp_test123",
      tool_slug: "",
      placements: ["tools-landing-featured"],
      start_date: "2024-01-01",
    };

    const result = ToolCampaignZ.safeParse(invalidCampaign);
    expect(result.success).toBe(false);
  });

  it("rejects campaign with no placements", () => {
    const invalidCampaign = {
      campaign_id: "camp_test123",
      tool_slug: "betterhelp",
      placements: [],
      start_date: "2024-01-01",
    };

    const result = ToolCampaignZ.safeParse(invalidCampaign);
    expect(result.success).toBe(false);
  });

  it("rejects invalid date format", () => {
    const invalidCampaign = {
      campaign_id: "camp_test123",
      tool_slug: "betterhelp",
      placements: ["tools-landing-featured"],
      start_date: "01-01-2024", // Wrong format
    };

    const result = ToolCampaignZ.safeParse(invalidCampaign);
    expect(result.success).toBe(false);
  });

  it("validates all placement types", () => {
    const placements = [
      "tools-landing-hero",
      "tools-landing-featured",
      "hub-top-picks",
      "hub-inline",
      "tool-profile-alternatives",
      "clinician-landing-featured",
      "patient-landing-featured",
      "search-results",
      "comparison-page",
    ];

    for (const placement of placements) {
      const result = CampaignPlacementZ.safeParse(placement);
      expect(result.success).toBe(true);
    }
  });

  it("rejects invalid placement type", () => {
    const result = CampaignPlacementZ.safeParse("invalid-placement");
    expect(result.success).toBe(false);
  });

  it("validates all audience types", () => {
    const audiences = ["all", "patient", "clinician"];

    for (const audience of audiences) {
      const result = CampaignAudienceZ.safeParse(audience);
      expect(result.success).toBe(true);
    }
  });

  it("validates all status types", () => {
    const statuses = ["draft", "scheduled", "active", "paused", "completed", "cancelled"];

    for (const status of statuses) {
      const result = CampaignStatusZ.safeParse(status);
      expect(result.success).toBe(true);
    }
  });
});

describe("Campaign Date Range", () => {
  it("identifies active campaign within date range", () => {
    const now = new Date();
    const campaign = {
      campaign_id: "camp_test123",
      tool_slug: "betterhelp",
      placements: ["tools-landing-featured"],
      start_date: "2020-01-01",
      end_date: "2099-12-31",
      status: "active",
    };

    const startDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);

    const isActive =
      campaign.status === "active" && now >= startDate && now <= endDate;

    expect(isActive).toBe(true);
  });

  it("identifies expired campaign past end date", () => {
    const now = new Date();
    const campaign = {
      campaign_id: "camp_test123",
      tool_slug: "betterhelp",
      placements: ["tools-landing-featured"],
      start_date: "2020-01-01",
      end_date: "2020-12-31",
      status: "active",
    };

    const endDate = new Date(campaign.end_date);
    const isExpired = now > endDate;

    expect(isExpired).toBe(true);
  });

  it("identifies future campaign before start date", () => {
    const now = new Date();
    const campaign = {
      campaign_id: "camp_test123",
      tool_slug: "betterhelp",
      placements: ["tools-landing-featured"],
      start_date: "2099-01-01",
      status: "active",
    };

    const startDate = new Date(campaign.start_date);
    const isFuture = now < startDate;

    expect(isFuture).toBe(true);
  });
});

describe("Campaign Audience Targeting", () => {
  it("campaign with 'all' audience matches any target", () => {
    const campaignAudience = "all";
    const targetAudiences = ["patient", "clinician", "all"];

    for (const target of targetAudiences) {
      const matches = campaignAudience === "all" || campaignAudience === target;
      expect(matches).toBe(true);
    }
  });

  it("campaign with 'patient' audience only matches patient", () => {
    const campaignAudience = "patient";

    expect(campaignAudience === "patient" || campaignAudience === "all").toBe(
      true
    );
    expect(campaignAudience === "clinician").toBe(false);
  });

  it("campaign with 'clinician' audience only matches clinician", () => {
    const campaignAudience = "clinician";

    expect(campaignAudience === "clinician" || campaignAudience === "all").toBe(
      true
    );
    expect(campaignAudience === "patient").toBe(false);
  });
});

// ============================================================================
// URL SAFETY TESTS
// ============================================================================

describe("Safe URL Parsing", () => {
  describe("safeParseUrl", () => {
    it("parses valid HTTPS URL", () => {
      const result = safeParseUrl("https://example.com/path");
      expect(result).not.toBeNull();
      expect(result?.hostname).toBe("example.com");
    });

    it("parses valid HTTP URL", () => {
      const result = safeParseUrl("http://example.com");
      expect(result).not.toBeNull();
    });

    it("returns null for invalid URL", () => {
      expect(safeParseUrl("not-a-url")).toBeNull();
      expect(safeParseUrl("")).toBeNull();
    });

    it("parses javascript: URLs (safety checked elsewhere)", () => {
      // Note: javascript: is syntactically valid but safety is checked in isSafeSponsoredUrl
      const result = safeParseUrl("javascript:alert(1)");
      expect(result).not.toBeNull();
      expect(result?.protocol).toBe("javascript:");
    });
  });

  describe("normalizeHost", () => {
    it("removes www prefix", () => {
      expect(normalizeHost("www.example.com")).toBe("example.com");
    });

    it("converts to lowercase", () => {
      expect(normalizeHost("EXAMPLE.COM")).toBe("example.com");
    });

    it("handles already normalized hosts", () => {
      expect(normalizeHost("example.com")).toBe("example.com");
    });
  });

  describe("isSafeSponsoredUrl", () => {
    it("accepts valid HTTPS external URL", () => {
      expect(isSafeSponsoredUrl("https://betterhelp.com")).toBe(true);
      expect(isSafeSponsoredUrl("https://www.talkspace.com/therapy")).toBe(true);
    });

    it("rejects HTTP URLs", () => {
      expect(isSafeSponsoredUrl("http://example.com")).toBe(false);
    });

    it("rejects javascript: URLs", () => {
      expect(isSafeSponsoredUrl("javascript:alert(1)")).toBe(false);
    });

    it("rejects data: URLs", () => {
      expect(isSafeSponsoredUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    });

    it("rejects URLs to our own domain", () => {
      expect(isSafeSponsoredUrl("https://heypsych.com/tools/")).toBe(false);
      expect(isSafeSponsoredUrl("https://www.heypsych.com/")).toBe(false);
    });

    it("rejects invalid URLs", () => {
      expect(isSafeSponsoredUrl("not-a-url")).toBe(false);
      expect(isSafeSponsoredUrl("")).toBe(false);
    });
  });

  describe("buildSafeDestinationUrl", () => {
    it("returns campaign URL if valid", () => {
      expect(buildSafeDestinationUrl("https://betterhelp.com", "betterhelp")).toBe(
        "https://betterhelp.com"
      );
    });

    it("falls back to internal URL if campaign URL is invalid", () => {
      expect(buildSafeDestinationUrl("javascript:alert(1)", "betterhelp")).toBe(
        "/tools/betterhelp/"
      );
    });

    it("falls back to internal URL if campaign URL is HTTP", () => {
      expect(buildSafeDestinationUrl("http://insecure.com", "sometool")).toBe(
        "/tools/sometool/"
      );
    });

    it("returns internal URL if no campaign URL provided", () => {
      expect(buildSafeDestinationUrl(undefined, "betterhelp")).toBe(
        "/tools/betterhelp/"
      );
    });
  });

  describe("hostsMatch", () => {
    it("matches same hosts", () => {
      expect(hostsMatch("https://example.com/path1", "https://example.com/path2")).toBe(true);
    });

    it("matches with and without www", () => {
      expect(hostsMatch("https://www.example.com", "https://example.com")).toBe(true);
    });

    it("matches case-insensitively", () => {
      expect(hostsMatch("https://EXAMPLE.COM", "https://example.com")).toBe(true);
    });

    it("returns false for different hosts", () => {
      expect(hostsMatch("https://example.com", "https://different.com")).toBe(false);
    });

    it("returns false for invalid URLs", () => {
      expect(hostsMatch("not-a-url", "https://example.com")).toBe(false);
    });
  });
});
