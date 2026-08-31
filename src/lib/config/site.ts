export const siteConfig = {
  name: "HeyPsych",
  description: "Make better mental health decisions. For patients: find the right care, apps, and treatments. For clinicians: build the right practice stack with transparent pricing.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  email: "hello@heypsych.com",

  // Navigation V1 - Mental health navigation hierarchy
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
    accentColor: "blue",
  },
} as const;

export type SiteConfig = typeof siteConfig;
