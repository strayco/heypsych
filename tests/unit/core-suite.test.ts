/**
 * Core test suite verification
 *
 * This test exists to prove the core test suite does not silently omit all tests.
 * If this test runs, the vitest configuration is working correctly.
 */
import { describe, it, expect } from "vitest";

describe("Core Test Suite", () => {
  it("verifies the test suite is running", () => {
    expect(true).toBe(true);
  });

  it("verifies basic math operations", () => {
    expect(1 + 1).toBe(2);
  });

  it("verifies string operations", () => {
    expect("HeyPsych".toLowerCase()).toBe("heypsych");
  });

  describe("Environment", () => {
    it("runs in node environment", () => {
      expect(typeof process).toBe("object");
    });
  });
});
