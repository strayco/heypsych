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
 *   PATIENT_SUPPORT_JOURNEY        - Enable /find-support decision journey (default: true)
 *   NAVIGATION_INVERSION           - Enable audience-first navigation (default: true)
 *   NEXT_PUBLIC_PATH_WORKSPACE     - Enable Your Path (/my-path, save controls,
 *                                    next-step journey) (default: true)
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

  /**
   * Enable the Patient Support Journey at /find-support.
   * When false, /find-support redirects to /tools/find-support.
   * Used in: src/app/find-support/page.tsx
   */
  patientSupportJourney: boolean;

  /**
   * Enable audience-first navigation (Patients, Clinicians as primary).
   * When false, uses taxonomy-first navigation (Conditions, Treatments, etc.).
   * Used in: src/lib/config/site.ts, src/components/layout/header.tsx
   */
  navigationInversion: boolean;

  /**
   * Enable Your Path: the private workspace at /my-path, "Save to your path"
   * on condition and treatment pages, the header count, the homepage resume
   * strip and the next-step journey at /find-support?need=support.
   * When false, /my-path redirects to /find-support, save controls and the
   * header count disappear, and ?need=support shows the previous three links.
   * Nothing stored in visitors' browsers is deleted.
   * Read on server and client (NEXT_PUBLIC_, inlined at build time).
   */
  pathWorkspace: boolean;
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
  patientSupportJourney: envBool("PATIENT_SUPPORT_JOURNEY", true), // Enabled: decision support for patient tools
  navigationInversion: envBool("NAVIGATION_INVERSION", true),
  pathWorkspace: pathWorkspaceEnabled(),
};

/**
 * Literal `process.env.NEXT_PUBLIC_…` access so Next inlines the value into
 * client bundles; `envBool`'s dynamic lookup only works on the server.
 */
export function pathWorkspaceEnabled(): boolean {
  const value = process.env.NEXT_PUBLIC_PATH_WORKSPACE;
  if (value === undefined || value === "") return true;
  return value.toLowerCase() === "true" || value === "1";
}

/**
 * Type guard for checking if OCD journey is enabled
 */
export function isOcdJourneyActive(): boolean {
  return featureFlags.ocdJourneyEnabled && featureFlags.contextualNextSteps;
}
