/**
 * Centralized Static Generation Policy
 *
 * Controls which pages are pre-rendered at build time vs generated on-demand via ISR.
 * This policy removes Supabase from the build critical path while preserving SEO through
 * comprehensive sitemaps and complete server-rendered HTML on first request.
 *
 * IMPORTANT: This controls BUILD OPTIMIZATION, not indexability.
 * Indexability is determined by the SEO control plane (index-decision-service.ts).
 *
 * Environment Variables:
 * - BUILD_TIME_SSG_MODE: 'none' | 'curated' | 'all' (default: 'none' for safety)
 * - BUILD_TIME_SSG_LIMIT: Maximum pages to generate for bounded routes (default: 50)
 *
 * @see src/lib/seo/index-decision-service.ts - SEO/indexability decisions
 * @see src/lib/seo/sitemap-generator.ts - Sitemap generation (independent of SSG)
 */

// =============================================================================
// TYPES
// =============================================================================

/**
 * Build cohort assignment - controls whether a page is pre-built or on-demand.
 * This is INDEPENDENT of SEO cohort (indexable, noindex, etc.)
 */
export type BuildCohort = "prebuilt" | "on_demand";

/**
 * SSG mode determines the overall build-time generation strategy
 */
export type SsgMode = "none" | "curated" | "all";

/**
 * Rendering decision output - returned by the policy for route planning
 */
export interface RenderingDecision {
  mode: BuildCohort;
  reason: RenderingReason;
}

export type RenderingReason =
  | "curated_high_value" // Explicitly curated for pre-rendering
  | "small_local_corpus" // Small dataset from local files, safe to pre-render all
  | "large_programmatic_corpus" // Large programmatic route, use on-demand
  | "database_backed" // Requires database access, use on-demand
  | "build_budget" // Exceeds build budget, use on-demand
  | "ssg_mode_none" // SSG mode is 'none', all routes are on-demand
  | "curated_limit_exceeded"; // Beyond curated limit

/**
 * Route classification for determining build strategy
 */
export type RouteType =
  | "conditions" // Database-backed mental health conditions
  | "treatments" // Local JSON-backed treatments
  | "resources" // Database-backed resources
  | "guide" // Programmatic SEO pages (potentially thousands)
  | "tools" // Local JSON-backed digital tools
  | "symptoms" // Local registry-backed symptoms
  | "compare" // Local JSON-backed comparisons
  | "static"; // Static pages (always pre-render)

/**
 * Route configuration for build-time decisions
 */
export interface RouteConfig {
  type: RouteType;
  dataSource: "local" | "database" | "programmatic";
  estimatedCount: "small" | "medium" | "large" | "unbounded";
  curatedSlugs?: string[];
}

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Parse SSG mode from environment with safe default
 */
function parseSsgMode(): SsgMode {
  const mode = process.env.BUILD_TIME_SSG_MODE?.toLowerCase();

  if (mode === "all") return "all";
  if (mode === "curated") return "curated";

  // Safe default: 'none' means no database-backed pages at build time
  // This ensures builds succeed without Supabase
  return "none";
}

/**
 * Parse SSG limit from environment with bounded default
 */
function parseSsgLimit(): number {
  const limit = parseInt(process.env.BUILD_TIME_SSG_LIMIT || "", 10);

  // Validate: must be positive and bounded
  if (isNaN(limit) || limit <= 0) {
    return 50; // Safe default
  }

  // Hard cap to prevent runaway generation
  if (limit > 500) {
    console.warn(
      `[StaticPolicy] BUILD_TIME_SSG_LIMIT=${limit} exceeds maximum of 500, capping`
    );
    return 500;
  }

  return limit;
}

/**
 * Get current SSG mode
 */
export function getSsgMode(): SsgMode {
  return parseSsgMode();
}

/**
 * Get current SSG limit
 */
export function getSsgLimit(): number {
  return parseSsgLimit();
}

/**
 * Check if this is a production build
 */
export function isProductionBuild(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

/**
 * Check if we're in development mode
 */
export function isDevelopmentMode(): boolean {
  return process.env.NODE_ENV === "development";
}

// =============================================================================
// ROUTE CLASSIFICATION
// =============================================================================

/**
 * Route configurations - defines data source and expected scale
 */
const ROUTE_CONFIGS: Record<RouteType, RouteConfig> = {
  conditions: {
    type: "conditions",
    dataSource: "database",
    estimatedCount: "medium", // ~130 pages
  },
  treatments: {
    type: "treatments",
    dataSource: "local",
    estimatedCount: "medium", // ~200 pages
  },
  resources: {
    type: "resources",
    dataSource: "database",
    estimatedCount: "medium", // ~100 pages
  },
  guide: {
    type: "guide",
    dataSource: "programmatic",
    estimatedCount: "unbounded", // Potentially thousands
  },
  tools: {
    type: "tools",
    dataSource: "local",
    estimatedCount: "small", // ~30 pages
  },
  symptoms: {
    type: "symptoms",
    dataSource: "local",
    estimatedCount: "small", // ~50 pages
  },
  compare: {
    type: "compare",
    dataSource: "local",
    estimatedCount: "small", // ~20 pages
  },
  static: {
    type: "static",
    dataSource: "local",
    estimatedCount: "small", // Fixed static pages
  },
};

// =============================================================================
// CURATED COHORT
// =============================================================================

/**
 * Curated high-value pages that should be pre-rendered when mode is 'curated'.
 * These are Answer Kings and primary authority pages.
 *
 * NOTE: This list is deliberately small and static. Do not add database-backed
 * slug enumeration here - that defeats the purpose of removing Supabase from builds.
 *
 * @see src/lib/seo/answer-kings.ts - Answer King registry
 */
const CURATED_CONDITIONS: string[] = [
  // Major mental health conditions (highest traffic)
  "major-depressive-disorder",
  "generalized-anxiety-disorder",
  "attention-deficit-hyperactivity-disorder",
  "bipolar-i-disorder",
  "bipolar-ii-disorder",
  "posttraumatic-stress-disorder",
  "obsessive-compulsive-disorder",
  "panic-disorder",
  "social-anxiety-disorder",
  "borderline-personality-disorder",
  "autism-spectrum-disorder",
  "schizophrenia",
];

const CURATED_TREATMENTS: string[] = [
  // Top SSRI medications (highest search volume)
  "sertraline-zoloft",
  "escitalopram-lexapro",
  "fluoxetine-prozac",
  "paroxetine-paxil",
  "citalopram-celexa",
  // Other high-volume treatments
  "bupropion-wellbutrin",
  "venlafaxine-effexor",
  "duloxetine-cymbalta",
  "alprazolam-xanax",
  "lorazepam-ativan",
  // Therapy modalities
  "cognitive-behavioral-therapy",
  "dialectical-behavior-therapy",
];

const CURATED_RESOURCES: string[] = [
  // Crisis resources (critical for user safety)
  "988-lifeline",
  "crisis-text-line",
  "samhsa-helpline",
  // High-traffic assessment tools
  "gad-7",
  "phq-9",
  "asrs-v1-1",
];

const CURATED_GUIDE: string[] = [
  // Highest-value programmatic pages (Answer Kings)
  "lexapro-for-anxiety",
  "zoloft-for-depression",
  "lexapro-vs-zoloft",
  "lexapro-side-effects",
  "zoloft-side-effects",
];

/**
 * Get curated slugs for a route type
 */
function getCuratedSlugs(routeType: RouteType): string[] {
  switch (routeType) {
    case "conditions":
      return CURATED_CONDITIONS;
    case "treatments":
      return CURATED_TREATMENTS;
    case "resources":
      return CURATED_RESOURCES;
    case "guide":
      return CURATED_GUIDE;
    default:
      return [];
  }
}

// =============================================================================
// POLICY DECISIONS
// =============================================================================

/**
 * Make a rendering decision for a route type
 */
export function makeRenderingDecision(routeType: RouteType): RenderingDecision {
  const config = ROUTE_CONFIGS[routeType];
  const mode = getSsgMode();

  // In 'none' mode, everything is on-demand except static pages
  if (mode === "none") {
    if (routeType === "static") {
      return { mode: "prebuilt", reason: "small_local_corpus" };
    }
    return { mode: "on_demand", reason: "ssg_mode_none" };
  }

  // Static pages are always pre-rendered
  if (routeType === "static") {
    return { mode: "prebuilt", reason: "small_local_corpus" };
  }

  // 'curated' mode: pre-render hardcoded curated slugs (no database needed)
  // This check comes BEFORE database check because curated slugs are local
  if (mode === "curated") {
    const curatedSlugs = getCuratedSlugs(routeType);
    if (curatedSlugs.length > 0) {
      return { mode: "prebuilt", reason: "curated_high_value" };
    }
    // No curated slugs for this route type - fall through to other checks
  }

  // Database-backed routes without curated slugs are on-demand in production
  // to avoid Supabase dependency during deployment
  if (config.dataSource === "database" && isProductionBuild()) {
    if (mode === "all") {
      // In 'all' mode, we still can't safely enumerate database slugs
      console.warn(
        `[StaticPolicy] Route '${routeType}' is database-backed, using on-demand ISR`
      );
    }
    return { mode: "on_demand", reason: "database_backed" };
  }

  // Unbounded programmatic routes are always on-demand
  if (config.estimatedCount === "unbounded") {
    return { mode: "on_demand", reason: "large_programmatic_corpus" };
  }

  // 'all' mode with local data source
  if (mode === "all" && config.dataSource === "local") {
    // Small local corpuses are safe to pre-render
    if (config.estimatedCount === "small") {
      return { mode: "prebuilt", reason: "small_local_corpus" };
    }
    // Medium corpuses are pre-rendered up to the limit
    if (config.estimatedCount === "medium") {
      return { mode: "prebuilt", reason: "small_local_corpus" };
    }
  }

  // Default to on-demand for safety
  return { mode: "on_demand", reason: "build_budget" };
}

/**
 * Get static params for a route based on the current policy
 *
 * @param routeType The type of route
 * @param allSlugsProvider Function that returns all possible slugs (from local data)
 * @returns Array of slug objects for generateStaticParams(), or empty array for on-demand
 */
export async function getStaticParamsForRoute(
  routeType: RouteType,
  allSlugsProvider?: () => string[] | Promise<string[]>
): Promise<{ slug: string }[]> {
  const decision = makeRenderingDecision(routeType);
  const limit = getSsgLimit();

  // Log decision for build diagnostics
  console.log(
    `[StaticPolicy] Route '${routeType}': mode=${decision.mode}, reason=${decision.reason}`
  );

  // On-demand routes return empty array - all pages generated via ISR
  if (decision.mode === "on_demand") {
    return [];
  }

  // Curated mode returns only curated slugs
  if (decision.reason === "curated_high_value") {
    const curated = getCuratedSlugs(routeType);
    const result = curated.slice(0, limit).map((slug) => ({ slug }));
    console.log(
      `[StaticPolicy] Generating ${result.length} curated pages for '${routeType}'`
    );
    return result;
  }

  // Local data routes: get all slugs and apply limit
  if (allSlugsProvider) {
    try {
      const allSlugs = await allSlugsProvider();
      const result = allSlugs.slice(0, limit).map((slug) => ({ slug }));
      console.log(
        `[StaticPolicy] Generating ${result.length}/${allSlugs.length} pages for '${routeType}'`
      );
      return result;
    } catch (error) {
      console.error(
        `[StaticPolicy] Failed to get slugs for '${routeType}':`,
        error
      );
      return [];
    }
  }

  return [];
}

// =============================================================================
// BUILD SUMMARY
// =============================================================================

/**
 * Generate a build summary for logging
 */
export function getBuildSummary(): {
  mode: SsgMode;
  limit: number;
  routes: Record<RouteType, RenderingDecision>;
} {
  const mode = getSsgMode();
  const limit = getSsgLimit();

  const routes = {} as Record<RouteType, RenderingDecision>;
  for (const routeType of Object.keys(ROUTE_CONFIGS) as RouteType[]) {
    routes[routeType] = makeRenderingDecision(routeType);
  }

  return { mode, limit, routes };
}

/**
 * Log build summary at start of build
 */
export function logBuildSummary(): void {
  const summary = getBuildSummary();

  console.log("\n=== Static Generation Policy ===");
  console.log(`Mode: ${summary.mode}`);
  console.log(`Limit: ${summary.limit}`);
  console.log("\nRoute Decisions:");

  for (const [route, decision] of Object.entries(summary.routes)) {
    const icon = decision.mode === "prebuilt" ? "📦" : "🔄";
    console.log(`  ${icon} ${route}: ${decision.mode} (${decision.reason})`);
  }

  console.log("================================\n");
}
