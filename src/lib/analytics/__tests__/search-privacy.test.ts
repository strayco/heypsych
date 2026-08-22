/**
 * Search Analytics Privacy Tests
 *
 * Ensures sensitive search queries are never sent to analytics.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { trackSearchSubmit } from "../product-events";

// Mock the @vercel/analytics track function
vi.mock("@vercel/analytics", () => ({
  track: vi.fn(),
}));

describe("Search Analytics Privacy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not include raw search query in analytics", async () => {
    const { track } = await import("@vercel/analytics");

    // Simulate tracking a sensitive mental health search
    trackSearchSubmit(25, "conditions", true);

    expect(track).toHaveBeenCalledTimes(1);
    const [eventName, properties] = (track as ReturnType<typeof vi.fn>).mock
      .calls[0];

    expect(eventName).toBe("nav_search_submit");

    // Verify no searchQuery property exists
    expect(properties).not.toHaveProperty("searchQuery");
    expect(properties).not.toHaveProperty("query");
    expect(properties).not.toHaveProperty("q");

    // Verify we only have safe metadata
    expect(properties).toHaveProperty("queryLengthBucket");
    expect(properties).toHaveProperty("searchVertical");
    expect(properties).toHaveProperty("hasResults");
  });

  it("buckets query lengths correctly for privacy", async () => {
    const { track } = await import("@vercel/analytics");

    // Test various lengths
    trackSearchSubmit(0, "conditions");
    trackSearchSubmit(3, "conditions");
    trackSearchSubmit(10, "conditions");
    trackSearchSubmit(25, "conditions");
    trackSearchSubmit(45, "conditions");
    trackSearchSubmit(100, "conditions");

    const calls = (track as ReturnType<typeof vi.fn>).mock.calls;

    expect(calls[0][1].queryLengthBucket).toBe("empty");
    expect(calls[1][1].queryLengthBucket).toBe("1-5");
    expect(calls[2][1].queryLengthBucket).toBe("6-15");
    expect(calls[3][1].queryLengthBucket).toBe("16-30");
    expect(calls[4][1].queryLengthBucket).toBe("31-50");
    expect(calls[5][1].queryLengthBucket).toBe("50+");
  });

  it("tracks search vertical without exposing query content", async () => {
    const { track } = await import("@vercel/analytics");

    trackSearchSubmit(15, "treatments", true);

    const properties = (track as ReturnType<typeof vi.fn>).mock.calls[0][1];

    expect(properties.searchVertical).toBe("treatments");
    // Query content should never appear
    expect(JSON.stringify(properties)).not.toContain("depression");
    expect(JSON.stringify(properties)).not.toContain("anxiety");
    expect(JSON.stringify(properties)).not.toContain("suicide");
  });

  it("tracks zero-results state without query", async () => {
    const { track } = await import("@vercel/analytics");

    trackSearchSubmit(20, "conditions", false);

    const properties = (track as ReturnType<typeof vi.fn>).mock.calls[0][1];

    expect(properties.hasResults).toBe(false);
    expect(properties).not.toHaveProperty("searchQuery");
  });
});
