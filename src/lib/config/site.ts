import { featureFlags } from "./feature-flags";

export const siteConfig = {
  name: "HeyPsych",
  description: "Make better mental health decisions. For patients: find the right care, apps, and treatments. For clinicians: build the right practice stack with transparent pricing.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  email: "hello@heypsych.com",

  // Navigation V2 - Audience-first navigation
  // The two decision products are entered from the homepage worlds; the
  // header stays minimal: a way to explore, Practice Architect for clinicians,
  // About, and search (rendered as the header's search control).
  navigationInverted: [
    { name: "Explore", href: "/browse", icon: "compass" },
    { name: "Apps", href: "/tools", icon: "smartphone" },
    { name: "For Clinicians", href: "/architect", icon: "stethoscope", audience: "clinician" },
    { name: "About", href: "/about", icon: "info" },
  ],

  // Navigation V1 - Taxonomy-first navigation (rollback option)
  // Primary surfaces: Conditions, Treatments, Tools, Find Care, For Clinicians
  navigation: [
    { name: "Conditions", href: "/conditions", icon: "heart-pulse" },
    { name: "Treatments", href: "/treatments", icon: "pill" },
    { name: "Tools", href: "/tools", icon: "smartphone" },
    { name: "Find Care", href: "/psychiatrists", icon: "map-pin" },
    { name: "For Clinicians", href: "/tools/for-clinicians", icon: "stethoscope" },
  ],

  // Secondary navigation (footer, mobile menu expanded)
  secondaryNavigation: [
    { name: "Resources", href: "/resources", icon: "book-open" },
    { name: "About", href: "/about", icon: "info" },
  ],

  // Feature flags (turn features on/off)
  features: {
    showInvestigationalTreatments: process.env.NEXT_PUBLIC_SHOW_INVESTIGATIONAL === "true",
    enableComparisons: true,
    showCostData: true,
    enableAnimations: process.env.NEXT_PUBLIC_ENABLE_ANIMATIONS === "true",
    showProviderDirectory: true, // Enabled for Navigation V1
  },

  // Visual preferences
  ui: {
    defaultTheme: "light",
    animationSpeed: "normal" as "slow" | "normal" | "fast",
    density: "comfortable" as "compact" | "comfortable" | "spacious",
    accentColor: "slate-teal", // --hp-accent #456C7E
  },
} as const;

export type SiteConfig = typeof siteConfig;

/**
 * Get the active navigation based on feature flag.
 * When navigationInversion is enabled, uses audience-first navigation.
 * When disabled, uses taxonomy-first navigation (rollback).
 */
export function getActiveNavigation() {
  return featureFlags.navigationInversion
    ? siteConfig.navigationInverted
    : siteConfig.navigation;
}
