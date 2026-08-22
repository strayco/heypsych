/**
 * Tools Analytics Privacy Tests
 *
 * Ensures sensitive search queries and mental health data
 * are never transmitted to analytics.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  trackToolsSearchSubmit,
  trackToolsSponsoredImpression,
  trackToolsSponsoredClick,
  trackToolsProfileView,
  trackToolsAudienceSelect,
  trackToolsFilterApply,
} from "@/lib/analytics/product-events";

// Mock the @vercel/analytics track function
vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

describe("Tools Search Analytics Privacy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not include raw search query in analytics", async () => {
    const { track } = await import("@vercel/analytics");

    // Simulate tracking a sensitive mental health search
    trackToolsSearchSubmit(25, 10, "patient");

    expect(track).toHaveBeenCalledTimes(1);
    const [eventName, properties] = (track as ReturnType<typeof vi.fn>).mock
      .calls[0];

    expect(eventName).toBe("tools_search_submit");

    // Verify no searchQuery property exists
    expect(properties).not.toHaveProperty("searchQuery");
    expect(properties).not.toHaveProperty("query");
    expect(properties).not.toHaveProperty("q");

    // Verify we only have safe metadata
    expect(properties).toHaveProperty("queryLengthBucket");
    expect(properties).toHaveProperty("resultCount");
    expect(properties).toHaveProperty("hasResults");
  });

  it("buckets query lengths correctly for privacy", async () => {
    const { track } = await import("@vercel/analytics");

    // Test various lengths
    trackToolsSearchSubmit(0, 0);
    trackToolsSearchSubmit(3, 5);
    trackToolsSearchSubmit(10, 15);
    trackToolsSearchSubmit(25, 20);
    trackToolsSearchSubmit(45, 30);
    trackToolsSearchSubmit(60, 40);

    const calls = (track as ReturnType<typeof vi.fn>).mock.calls;

    expect(calls[0][1].queryLengthBucket).toBe("empty");
    expect(calls[1][1].queryLengthBucket).toBe("1-5");
    expect(calls[2][1].queryLengthBucket).toBe("6-15");
    expect(calls[3][1].queryLengthBucket).toBe("16-30");
    expect(calls[4][1].queryLengthBucket).toBe("31-50");
    expect(calls[5][1].queryLengthBucket).toBe("50+");
  });
});

describe("Sponsored Impression Deduplication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the module to clear impression tracking
    vi.resetModules();
  });

  it("deduplicates sponsored impressions within session", async () => {
    // Re-import after reset to get fresh state
    const { trackToolsSponsoredImpression } = await import(
      "@/lib/analytics/product-events"
    );
    const { track } = await import("@vercel/analytics");

    // Track same campaign+placement multiple times
    trackToolsSponsoredImpression("betterhelp", "camp_123", "tools-landing-featured");
    trackToolsSponsoredImpression("betterhelp", "camp_123", "tools-landing-featured");
    trackToolsSponsoredImpression("betterhelp", "camp_123", "tools-landing-featured");

    // Should only be tracked once
    expect(track).toHaveBeenCalledTimes(1);
  });

  it("tracks different campaigns separately", async () => {
    const { trackToolsSponsoredImpression } = await import(
      "@/lib/analytics/product-events"
    );
    const { track } = await import("@vercel/analytics");

    trackToolsSponsoredImpression("betterhelp", "camp_123", "tools-landing-featured");
    trackToolsSponsoredImpression("betterhelp", "camp_456", "tools-landing-featured");

    // Different campaigns should both be tracked
    expect(track).toHaveBeenCalledTimes(2);
  });

  it("tracks different placements separately", async () => {
    const { trackToolsSponsoredImpression } = await import(
      "@/lib/analytics/product-events"
    );
    const { track } = await import("@vercel/analytics");

    trackToolsSponsoredImpression("betterhelp", "camp_123", "tools-landing-featured");
    trackToolsSponsoredImpression("betterhelp", "camp_123", "search-results");

    // Different placements should both be tracked
    expect(track).toHaveBeenCalledTimes(2);
  });
});

describe("Campaign Attribution Safety", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sponsored click includes campaign attribution", async () => {
    const { track } = await import("@vercel/analytics");

    trackToolsSponsoredClick("betterhelp", "camp_123", "tools-landing-featured", "patient");

    expect(track).toHaveBeenCalledTimes(1);
    const [eventName, properties] = (track as ReturnType<typeof vi.fn>).mock
      .calls[0];

    expect(eventName).toBe("tools_sponsored_click");
    expect(properties).toEqual({
      toolSlug: "betterhelp",
      campaignId: "camp_123",
      placement: "tools-landing-featured",
      audience: "patient",
      isSponsored: true,
    });
  });

  it("organic profile view does not have campaign attribution", async () => {
    const { track } = await import("@vercel/analytics");

    trackToolsProfileView("betterhelp", "search", "patient");

    expect(track).toHaveBeenCalledTimes(1);
    const [eventName, properties] = (track as ReturnType<typeof vi.fn>).mock
      .calls[0];

    expect(eventName).toBe("tools_profile_view");
    expect(properties.isSponsored).toBe(false);
    expect(properties).not.toHaveProperty("campaignId");
  });
});

describe("Filter Analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("tracks filter application with safe values", async () => {
    const { track } = await import("@vercel/analytics");

    trackToolsFilterApply("hipaa", "true", "clinician");

    expect(track).toHaveBeenCalledTimes(1);
    const [eventName, properties] = (track as ReturnType<typeof vi.fn>).mock
      .calls[0];

    expect(eventName).toBe("tools_filter_apply");
    expect(properties).toEqual({
      filterType: "hipaa",
      filterValue: "true",
      audience: "clinician",
    });
  });

  it("tracks audience selection", async () => {
    const { track } = await import("@vercel/analytics");

    trackToolsAudienceSelect("clinician", "homepage");

    expect(track).toHaveBeenCalledTimes(1);
    const [eventName, properties] = (track as ReturnType<typeof vi.fn>).mock
      .calls[0];

    expect(eventName).toBe("tools_audience_select");
    expect(properties).toEqual({
      audience: "clinician",
      source: "homepage",
    });
  });
});
