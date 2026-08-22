/**
 * Feature Flags for HeyPsych
 *
 * These flags control specific features and can be used to disable
 * functionality without code changes.
 *
 * IMPORTANT: These flags control what they say. Each flag is only
 * meaningful if actually consumed in production code.
 *
 * Environment variables:
 *   OCD_JOURNEY_ENABLED            - Enable OCD next-steps (default: true)
 *   CONTEXTUAL_NEXT_STEPS_ENABLED  - Enable next-steps on conditions (default: true)
 *   FOR_CLINICIANS_PAGE_ENABLED    - Enable /for-clinicians (default: true)
 *
 * Usage:
 *   import { featureFlags } from '@/lib/config/feature-flags';
 *   if (featureFlags.ocdJourneyEnabled) { ... }
 */

/**
 * Type-safe feature flag definitions
 */
export interface FeatureFlags {
  /**
   * Enable OCD vertical slice with contextual next-steps.
   * When false, OCD page renders without the "What's Next?" section.
   * Used in: src/app/conditions/[slug]/page.tsx
   */
  ocdJourneyEnabled: boolean;

  /**
   * Enable contextual next-steps on condition pages.
   * Currently only affects OCD (see ocdJourneyEnabled).
   * Used in: src/app/conditions/[slug]/page.tsx
   */
  contextualNextSteps: boolean;

  /**
   * Enable the For Clinicians landing page.
   * When false, /for-clinicians returns 404.
   * Used in: src/app/for-clinicians/page.tsx
   */
  forCliniciansPage: boolean;
}

/**
 * Parse boolean environment variable with default
 */
function envBool(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined || value === "") {
    return defaultValue;
  }
  return value.toLowerCase() === "true" || value === "1";
}

/**
 * Feature flags with safe defaults.
 *
 * All flags default to true (features enabled).
 * Set environment variables to disable specific features.
 */
export const featureFlags: Readonly<FeatureFlags> = {
  ocdJourneyEnabled: envBool("OCD_JOURNEY_ENABLED", true),
  contextualNextSteps: envBool("CONTEXTUAL_NEXT_STEPS_ENABLED", true),
  forCliniciansPage: envBool("FOR_CLINICIANS_PAGE_ENABLED", true),
};

/**
 * Type guard for checking if OCD journey is enabled
 */
export function isOcdJourneyActive(): boolean {
  return featureFlags.ocdJourneyEnabled && featureFlags.contextualNextSteps;
}
