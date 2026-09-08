/**
 * Patient Tools Programmatic SEO Engine
 *
 * Auto-generates page configurations for patient-facing mental health apps.
 * Targets consumer search queries like:
 * - "best [condition] apps"
 * - "free [condition] apps"
 * - "best apps for [condition]"
 * - "[app] vs [app]"
 * - "[app] alternatives"
 *
 * Uses V3 schema (DigitalToolV3) and hub taxonomy.
 */

// ============================================================================
// DIMENSION DEFINITIONS
// ============================================================================

/**
 * Mental health conditions/hubs that users search for
 */
export const CONDITIONS = [
  { slug: "anxiety", display: "Anxiety", hub: "anxiety-stress", queries: ["anxiety", "stress", "worry"] },
  { slug: "depression", display: "Depression", hub: "mood-depression", queries: ["depression", "mood", "sadness"] },
  { slug: "sleep", display: "Sleep", hub: "sleep", queries: ["sleep", "insomnia", "sleep problems"] },
  { slug: "adhd", display: "ADHD", hub: "focus-adhd", queries: ["adhd", "focus", "attention", "add"] },
  { slug: "ptsd", display: "PTSD", hub: "trauma-ptsd", queries: ["ptsd", "trauma", "cptsd"] },
  { slug: "addiction", display: "Addiction", hub: "substance-use", queries: ["addiction", "recovery", "sobriety", "substance use"] },
  { slug: "bipolar", display: "Bipolar", hub: "mood-depression", queries: ["bipolar", "bipolar disorder", "manic depression"] },
  { slug: "ocd", display: "OCD", hub: "anxiety-stress", queries: ["ocd", "obsessive compulsive"] },
  { slug: "eating-disorders", display: "Eating Disorders", hub: "serious-mental-illness", queries: ["eating disorder", "anorexia", "bulimia", "binge eating"] },
  { slug: "grief", display: "Grief", hub: "mood-depression", queries: ["grief", "loss", "bereavement"] },
] as const;

/**
 * App types users search for
 */
export const APP_TYPES = [
  { slug: "therapy-apps", display: "Therapy Apps", toolType: "therapy-platform", queries: ["therapy app", "online therapy"] },
  { slug: "meditation-apps", display: "Meditation Apps", toolType: "meditation", queries: ["meditation app", "mindfulness app"] },
  { slug: "mood-trackers", display: "Mood Trackers", toolType: "mood-tracker", queries: ["mood tracker", "mood journal"] },
  { slug: "cbt-apps", display: "CBT Apps", toolType: "app", queries: ["cbt app", "cognitive behavioral therapy app"] },
  { slug: "journal-apps", display: "Journal Apps", toolType: "journal", queries: ["journal app", "mental health journal"] },
  { slug: "psychiatry-apps", display: "Psychiatry Apps", toolType: "psychiatry-platform", queries: ["psychiatry app", "online psychiatrist"] },
  { slug: "ai-therapy", display: "AI Therapy", toolType: "ai-therapist", queries: ["ai therapist", "ai therapy", "chatbot therapy"] },
  { slug: "peer-support", display: "Peer Support", toolType: "peer-support", queries: ["peer support", "support group app"] },
] as const;

/**
 * Price modifiers users search with
 */
export const PRICE_MODIFIERS = [
  { slug: "free", display: "Free", filter: "free" },
  { slug: "cheap", display: "Cheap", filter: "budget" },
  { slug: "best", display: "Best", filter: null },
] as const;

/**
 * Top consumer apps for displacement pages
 */
export const TOP_APPS = [
  { slug: "calm", name: "Calm", category: "meditation" },
  { slug: "headspace", name: "Headspace", category: "meditation" },
  { slug: "betterhelp", name: "BetterHelp", category: "therapy" },
  { slug: "talkspace", name: "Talkspace", category: "therapy" },
  { slug: "cerebral", name: "Cerebral", category: "psychiatry" },
  { slug: "woebot", name: "Woebot", category: "ai-therapy" },
  { slug: "wysa", name: "Wysa", category: "ai-therapy" },
  { slug: "noom-mood", name: "Noom Mood", category: "cbt" },
  { slug: "daylio", name: "Daylio", category: "mood-tracker" },
  { slug: "finch", name: "Finch", category: "self-care" },
] as const;

/**
 * Key VS comparisons
 */
export const KEY_COMPARISONS = [
  { a: "calm", b: "headspace" },
  { a: "betterhelp", b: "talkspace" },
  { a: "cerebral", b: "done" },
  { a: "woebot", b: "wysa" },
  { a: "headspace", b: "insight-timer" },
  { a: "betterhelp", b: "cerebral" },
  { a: "calm", b: "balance" },
  { a: "talkspace", b: "cerebral" },
] as const;

// ============================================================================
// PAGE CONFIGURATION TYPES
// ============================================================================

export interface PatientPageConfig {
  slug: string;
  route: string;
  title: string;
  description: string;
  h1: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  pageType: "best-for" | "condition" | "app-type" | "comparison" | "alternatives" | "free";
  filters: {
    hub?: string;
    toolType?: string;
    priceFilter?: string;
  };
  relatedPages: string[];
  priority: number;
  estimatedVolume?: "high" | "medium" | "low";
}

// ============================================================================
// PAGE GENERATORS
// ============================================================================

/**
 * Generate "Best [Condition] Apps" pages
 * These capture high-intent consumer searches
 */
export function generateConditionPages(): PatientPageConfig[] {
  const pages: PatientPageConfig[] = [];

  for (const condition of CONDITIONS) {
    // Best apps for condition
    pages.push({
      slug: `best-${condition.slug}-apps`,
      route: `/tools/for-patients/guides/best-${condition.slug}-apps`,
      title: `Best ${condition.display} Apps (2026) - Free & Paid Options | HeyPsych`,
      description: `Compare the best apps for ${condition.display.toLowerCase()}. Free options, premium apps, and which actually work based on clinical research. Updated for 2026.`,
      h1: `Best ${condition.display} Apps in 2026`,
      primaryKeyword: `best ${condition.display.toLowerCase()} apps`,
      secondaryKeywords: [
        `${condition.display.toLowerCase()} app`,
        `apps for ${condition.display.toLowerCase()}`,
        `free ${condition.display.toLowerCase()} apps`,
        ...condition.queries.map(q => `${q} app`),
      ],
      pageType: "condition",
      filters: {
        hub: condition.hub,
      },
      relatedPages: [
        `/tools/for-patients/${condition.hub}/`,
        `/tools/for-patients/guides/free-${condition.slug}-apps`,
      ],
      priority: 0.9,
      estimatedVolume: "high",
    });

    // Free apps for condition
    pages.push({
      slug: `free-${condition.slug}-apps`,
      route: `/tools/for-patients/guides/free-${condition.slug}-apps`,
      title: `Free ${condition.display} Apps (2026) - No Subscription Required | HeyPsych`,
      description: `Completely free ${condition.display.toLowerCase()} apps with no subscriptions or hidden fees. Clinician-reviewed options that actually work.`,
      h1: `Free ${condition.display} Apps That Actually Work`,
      primaryKeyword: `free ${condition.display.toLowerCase()} apps`,
      secondaryKeywords: [
        `free apps for ${condition.display.toLowerCase()}`,
        `best free ${condition.display.toLowerCase()} app`,
        ...condition.queries.map(q => `free ${q} app`),
      ],
      pageType: "free",
      filters: {
        hub: condition.hub,
        priceFilter: "free",
      },
      relatedPages: [
        `/tools/for-patients/guides/best-${condition.slug}-apps`,
      ],
      priority: 0.85,
      estimatedVolume: "high",
    });
  }

  return pages;
}

/**
 * Generate "Best [App Type]" pages
 */
export function generateAppTypePages(): PatientPageConfig[] {
  const pages: PatientPageConfig[] = [];

  for (const appType of APP_TYPES) {
    pages.push({
      slug: `best-${appType.slug}`,
      route: `/tools/for-patients/guides/best-${appType.slug}`,
      title: `Best ${appType.display} (2026) - Reviewed by Clinicians | HeyPsych`,
      description: `Compare the best ${appType.display.toLowerCase()} for mental health. Expert reviews, pricing comparison, and which apps are worth your time.`,
      h1: `Best ${appType.display} in 2026`,
      primaryKeyword: `best ${appType.display.toLowerCase()}`,
      secondaryKeywords: [...appType.queries],
      pageType: "app-type",
      filters: {
        toolType: appType.toolType,
      },
      relatedPages: [
        `/tools/for-patients/`,
      ],
      priority: 0.85,
      estimatedVolume: "medium",
    });
  }

  return pages;
}

/**
 * Generate "[App] Alternatives" pages
 */
export function generateAlternativesPages(): PatientPageConfig[] {
  return TOP_APPS.map((app) => ({
    slug: `${app.slug}-alternatives`,
    route: `/tools/for-patients/guides/${app.slug}-alternatives`,
    title: `${app.name} Alternatives (2026) - Better & Cheaper Options | HeyPsych`,
    description: `Looking for ${app.name} alternatives? Compare similar apps with better pricing, different features, or free options.`,
    h1: `${app.name} Alternatives: Find a Better Fit`,
    primaryKeyword: `${app.name.toLowerCase()} alternatives`,
    secondaryKeywords: [
      `apps like ${app.name.toLowerCase()}`,
      `${app.name.toLowerCase()} competitors`,
      `better than ${app.name.toLowerCase()}`,
      `cheaper than ${app.name.toLowerCase()}`,
    ],
    pageType: "alternatives",
    filters: {},
    relatedPages: [
      `/tools/for-patients/`,
    ],
    priority: 0.8,
    estimatedVolume: "medium",
  }));
}

/**
 * Generate "[App] vs [App]" comparison pages
 */
export function generateVsPages(): PatientPageConfig[] {
  return KEY_COMPARISONS.map(({ a, b }) => {
    const appA = TOP_APPS.find(app => app.slug === a);
    const appB = TOP_APPS.find(app => app.slug === b);
    const nameA = appA?.name || a.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const nameB = appB?.name || b.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());

    return {
      slug: `${a}-vs-${b}`,
      route: `/tools/for-patients/compare/${a}-vs-${b}`,
      title: `${nameA} vs ${nameB} (2026) - Which Is Better? | HeyPsych`,
      description: `${nameA} vs ${nameB}: detailed comparison of features, pricing, and who each app is best for. See which one wins.`,
      h1: `${nameA} vs ${nameB}: Which Should You Choose?`,
      primaryKeyword: `${nameA.toLowerCase()} vs ${nameB.toLowerCase()}`,
      secondaryKeywords: [
        `${nameB.toLowerCase()} vs ${nameA.toLowerCase()}`,
        `${nameA.toLowerCase()} or ${nameB.toLowerCase()}`,
        `${nameA.toLowerCase()} compared to ${nameB.toLowerCase()}`,
      ],
      pageType: "comparison",
      filters: {},
      relatedPages: [
        `/tools/for-patients/`,
      ],
      priority: 0.85,
      estimatedVolume: "high",
    };
  });
}

// ============================================================================
// MASTER GENERATOR
// ============================================================================

export function generateAllPatientProgrammaticPages(): {
  total: number;
  byType: Record<string, number>;
  pages: PatientPageConfig[];
} {
  const allPages: PatientPageConfig[] = [
    ...generateConditionPages(),
    ...generateAppTypePages(),
    ...generateAlternativesPages(),
    ...generateVsPages(),
  ];

  const byType: Record<string, number> = {};
  for (const page of allPages) {
    byType[page.pageType] = (byType[page.pageType] || 0) + 1;
  }

  return {
    total: allPages.length,
    byType,
    pages: allPages,
  };
}

/**
 * Get high-priority pages for initial implementation
 */
export function getHighPriorityPatientPages(): PatientPageConfig[] {
  const all = generateAllPatientProgrammaticPages();
  return all.pages
    .filter((p) => p.priority >= 0.85 || p.estimatedVolume === "high")
    .sort((a, b) => b.priority - a.priority);
}
