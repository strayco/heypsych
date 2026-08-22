/**
 * Feature Flags Tests
 *
 * These tests verify:
 * - Default values are set correctly
 * - Environment variable parsing works
 * - Type guards function properly
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("Feature Flags", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Default values", () => {
    it("should enable OCD journey by default", async () => {
      delete process.env.OCD_JOURNEY_ENABLED;
      const { featureFlags } = await import("../feature-flags");
      expect(featureFlags.ocdJourneyEnabled).toBe(true);
    });

    it("should enable contextual next steps by default", async () => {
      delete process.env.CONTEXTUAL_NEXT_STEPS_ENABLED;
      const { featureFlags } = await import("../feature-flags");
      expect(featureFlags.contextualNextSteps).toBe(true);
    });

    it("should enable For Clinicians page by default", async () => {
      delete process.env.FOR_CLINICIANS_PAGE_ENABLED;
      const { featureFlags } = await import("../feature-flags");
      expect(featureFlags.forCliniciansPage).toBe(true);
    });
  });

  describe("Environment variable parsing", () => {
    it("should parse 'true' string as boolean true", async () => {
      process.env.OCD_JOURNEY_ENABLED = "true";
      const { featureFlags } = await import("../feature-flags");
      expect(featureFlags.ocdJourneyEnabled).toBe(true);
    });

    it("should parse 'false' string as boolean false", async () => {
      process.env.OCD_JOURNEY_ENABLED = "false";
      const { featureFlags } = await import("../feature-flags");
      expect(featureFlags.ocdJourneyEnabled).toBe(false);
    });

    it("should parse '1' as boolean true", async () => {
      process.env.OCD_JOURNEY_ENABLED = "1";
      const { featureFlags } = await import("../feature-flags");
      expect(featureFlags.ocdJourneyEnabled).toBe(true);
    });

    it("should treat empty string as default", async () => {
      process.env.OCD_JOURNEY_ENABLED = "";
      const { featureFlags } = await import("../feature-flags");
      expect(featureFlags.ocdJourneyEnabled).toBe(true);
    });

    it("should disable feature when set to false", async () => {
      process.env.FOR_CLINICIANS_PAGE_ENABLED = "false";
      const { featureFlags } = await import("../feature-flags");
      expect(featureFlags.forCliniciansPage).toBe(false);
    });
  });

  describe("Type guards", () => {
    it("isOcdJourneyActive should require both flags enabled", async () => {
      process.env.OCD_JOURNEY_ENABLED = "true";
      process.env.CONTEXTUAL_NEXT_STEPS_ENABLED = "true";
      const { isOcdJourneyActive } = await import("../feature-flags");
      expect(isOcdJourneyActive()).toBe(true);
    });

    it("isOcdJourneyActive should return false if ocdJourneyEnabled is false", async () => {
      process.env.OCD_JOURNEY_ENABLED = "false";
      process.env.CONTEXTUAL_NEXT_STEPS_ENABLED = "true";
      const { isOcdJourneyActive } = await import("../feature-flags");
      expect(isOcdJourneyActive()).toBe(false);
    });

    it("isOcdJourneyActive should return false if contextualNextSteps is false", async () => {
      process.env.OCD_JOURNEY_ENABLED = "true";
      process.env.CONTEXTUAL_NEXT_STEPS_ENABLED = "false";
      const { isOcdJourneyActive } = await import("../feature-flags");
      expect(isOcdJourneyActive()).toBe(false);
    });
  });
});
