import { describe, expect, it } from "vitest";
import {
  REVIEW_INTERVAL_DAYS,
  freshnessState,
  freshnessStateForClaim,
} from "../evidence-freshness";

const NOW = Date.parse("2026-10-22T00:00:00.000Z");

describe("evidence freshness", () => {
  it("treats a missing date as never reviewed, not as false", () => {
    expect(freshnessState(undefined, 90, NOW)).toBe("never_reviewed");
    expect(freshnessState(null, 90, NOW)).toBe("never_reviewed");
    expect(freshnessState("not-a-date", 90, NOW)).toBe("never_reviewed");
  });

  it("keeps a recent review current", () => {
    expect(freshnessState("2026-09-01", 90, NOW)).toBe("current");
  });

  it("flags an elapsed interval as needing freshness review", () => {
    expect(freshnessState("2026-01-01", 90, NOW)).toBe("needs_freshness_review");
  });

  it("does not treat an elapsed pricing review as a zero or a false claim", () => {
    // The function has no path that returns false, ineligible, or 0.
    expect(freshnessStateForClaim("2025-01-01", "pricing", NOW)).toBe(
      "needs_freshness_review"
    );
    expect(REVIEW_INTERVAL_DAYS.pricing).toBe(90);
    expect(REVIEW_INTERVAL_DAYS.epcs).toBe(90);
    expect(REVIEW_INTERVAL_DAYS.baa).toBe(180);
  });
});
