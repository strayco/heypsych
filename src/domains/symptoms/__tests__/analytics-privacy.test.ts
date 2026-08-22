/**
 * Symptom Analytics Privacy Tests
 *
 * Ensures sensitive symptom search queries are never sent to analytics.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  trackSymptomSearch,
  trackSymptomSafetyPanelShown,
} from "@/lib/analytics/product-events";

// Mock the @vercel/analytics track function
vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

describe("Symptom Analytics Privacy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not include raw search query in analytics", async () => {
    const { track } = await import("@vercel/analytics");

    // Simulate tracking a sensitive symptom search
    trackSymptomSearch(35, 5, "mood");

    expect(track).toHaveBeenCalledTimes(1);
    const [eventName, properties] = (track as ReturnType<typeof vi.fn>).mock
      .calls[0];

    expect(eventName).toBe("symptom_search");

    // Verify no query property exists
    expect(properties).not.toHaveProperty("query");
    expect(properties).not.toHaveProperty("searchQuery");
    expect(properties).not.toHaveProperty("q");
    expect(properties).not.toHaveProperty("text");

    // Verify we only have safe metadata
    expect(properties).toHaveProperty("queryLengthBucket");
    expect(properties).toHaveProperty("resultCount");
  });

  it("buckets query lengths correctly for privacy", async () => {
    const { track } = await import("@vercel/analytics");

    // Test various lengths
    trackSymptomSearch(0, 0);
    trackSymptomSearch(3, 2);
    trackSymptomSearch(10, 5);
    trackSymptomSearch(25, 3);
    trackSymptomSearch(45, 1);
    trackSymptomSearch(100, 0);

    const calls = (track as ReturnType<typeof vi.fn>).mock.calls;

    expect(calls[0][1].queryLengthBucket).toBe("empty");
    expect(calls[1][1].queryLengthBucket).toBe("1-5");
    expect(calls[2][1].queryLengthBucket).toBe("6-15");
    expect(calls[3][1].queryLengthBucket).toBe("16-30");
    expect(calls[4][1].queryLengthBucket).toBe("31-50");
    expect(calls[5][1].queryLengthBucket).toBe("50+");
  });

  it("safety panel tracking does not include trigger query", async () => {
    const { track } = await import("@vercel/analytics");

    trackSymptomSafetyPanelShown("search");

    const [eventName, properties] = (track as ReturnType<typeof vi.fn>).mock
      .calls[0];

    expect(eventName).toBe("symptom_safety_panel_shown");

    // Verify no query-related properties
    expect(properties).not.toHaveProperty("query");
    expect(properties).not.toHaveProperty("searchQuery");
    expect(properties).not.toHaveProperty("triggerKeyword");

    // Only source should be present
    expect(properties.source).toBe("search");
  });

  it("does not leak sensitive terms in any property value", async () => {
    const { track } = await import("@vercel/analytics");

    // Track with a category that could be sensitive
    trackSymptomSearch(25, 3, "mood");

    const properties = (track as ReturnType<typeof vi.fn>).mock.calls[0][1];
    const stringified = JSON.stringify(properties);

    // These should never appear in analytics
    expect(stringified).not.toContain("suicide");
    expect(stringified).not.toContain("self-harm");
    expect(stringified).not.toContain("kill");
    expect(stringified).not.toContain("depression");
    expect(stringified).not.toContain("anxiety");
  });
});
