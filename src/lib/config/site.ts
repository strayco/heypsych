export const siteConfig = {
  name: "HeyPsych",
  description: "Beautiful mental health treatment education",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",

  // Navigation (easily reorderable)
  navigation: [
    { name: "Treatments", href: "/treatments", icon: "pill" },
    { name: "Conditions", href: "/conditions", icon: "brain" },
    { name: "Resources", href: "/resources", icon: "book-open" },
    { name: "Psychiatrists", href: "/psychiatrists", icon: "users" },
    { name: "About", href: "/about", icon: "info" },
  ],

  // Feature flags (turn features on/off)
  features: {
    showInvestigationalTreatments: process.env.NEXT_PUBLIC_SHOW_INVESTIGATIONAL === "true",
    enableComparisons: true,
    showCostData: true,
    enableAnimations: process.env.NEXT_PUBLIC_ENABLE_ANIMATIONS === "true",
    showProviderDirectory: false,
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
