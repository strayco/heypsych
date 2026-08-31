/**
 * Product Analytics Events
 *
 * Tracks key conversion and engagement events for PsychTrails product.
 * Uses Vercel Analytics custom events + optional gtag for GA4.
 *
 * KEY METRICS TO TRACK:
 * - homepage → PsychTrails clickthrough
 * - homepage → How It Works clickthrough
 * - bounce rate on homepage (implicit via Vercel Analytics)
 * - start rate on PsychTrails
 * - scenario completion rate
 * - replay rate
 * - campus page → pilot/contact action
 */

import { track } from "@vercel/analytics";

type ProductEvent =
  // PsychTrails events (legacy)
  | "homepage_psychtrails_click"
  | "homepage_how_it_works_click"
  | "homepage_resources_click"
  | "psychtrails_scenario_start"
  | "psychtrails_scenario_complete"
  | "psychtrails_scenario_replay"
  | "psychtrails_second_scenario_start"
  | "psychtrails_route_discovered"
  | "psychtrails_transfer_commit"
  | "psychtrails_return_visit"
  | "psychtrails_usefulness_signal"
  | "psychtrails_featured_shown"
  | "psychtrails_featured_click"
  | "psychtrails_related_click"
  | "psychtrails_pack_select"
  | "campus_pilot_click"
  | "campus_playlist_select"
  | "how_it_works_play_click"
  | "for_campuses_contact_click"
  // Navigation V1 events
  | "nav_intent_select"
  | "nav_primary_click"
  | "nav_next_step_click"
  | "nav_condition_view"
  | "nav_treatment_view"
  | "nav_find_care_click"
  | "nav_search_submit"
  | "nav_for_clinicians_click"
  // Symptom Explorer events
  | "symptom_hub_view"
  | "symptom_view"
  | "symptom_search"
  | "symptom_to_condition_click"
  | "symptom_related_click"
  | "symptom_safety_panel_shown"
  | "symptom_assessment_click"
  | "symptom_category_filter"
  // Tools Marketplace events
  | "tools_audience_select"
  | "tools_search_submit"
  | "tools_filter_apply"
  | "tools_category_open"
  | "tools_profile_view"
  | "tools_sponsored_impression"
  | "tools_sponsored_click"
  | "tools_vendor_outbound_click"
  | "tools_vendor_listing_cta"
  | "tools_featured_partner_cta";

interface EventProperties {
  // Common
  source?: string;
  // Scenario events
  scenarioId?: string;
  packId?: string;
  difficulty?: string;
  // Completion events
  grade?: string;
  stars?: number;
  duration?: number;
  // Route events
  routeId?: string;
  routeName?: string;
  isHidden?: boolean;
  routesDiscovered?: number;
  totalRoutes?: number;
  // Transfer events
  commitmentType?: string;
  // Return visit
  daysSinceLast?: number;
  totalCompletions?: number;
  // Usefulness signal
  usefulnessRating?: "yes" | "somewhat" | "not_really";
  isFirstCompletion?: boolean;
  // Featured/related tracking
  fromScenarioId?: string;
  toScenarioId?: string;
  // Campus events
  institutionSlug?: string;
  playlistId?: string;
  // Navigation V1 events
  intentId?: string;
  navItem?: string;
  entityType?: string;
  entitySlug?: string;
  stepKind?: string;
  stepId?: string;
  stepTitle?: string;
  // PRIVACY: searchQuery intentionally omitted - mental health queries may contain sensitive data
  searchVertical?: string;
  queryLengthBucket?: string;
  hasResults?: boolean;
  audience?: string;
  // Symptom Explorer events
  symptomSlug?: string;
  symptomCategory?: string;
  conditionSlug?: string;
  // Tools Marketplace events
  toolSlug?: string;
  campaignId?: string;
  placement?: string;
  hubSlug?: string;
  filterType?: string;
  filterValue?: string;
  referringRoute?: string;
  isSponsored?: boolean;
  relatedSymptomSlug?: string;
  assessmentSlug?: string;
  resultCount?: number;
}

/**
 * Track a product event
 *
 * Sends to both Vercel Analytics and GA4 (if available)
 */
export function trackProductEvent(
  event: ProductEvent,
  properties?: EventProperties
): void {
  // Vercel Analytics
  try {
    track(event, properties as Record<string, string | number | boolean | null>);
  } catch {
    // Fail silently
  }

  // GA4 via gtag (if available)
  const windowWithGtag = typeof window !== "undefined" ? (window as Window & { gtag?: (...args: unknown[]) => void }) : null;
  if (windowWithGtag?.gtag) {
    try {
      windowWithGtag.gtag("event", event, {
        event_category: "Product",
        ...properties,
      });
    } catch {
      // Fail silently
    }
  }

  // Console log in development
  if (process.env.NODE_ENV === "development") {
    console.log("📊 Product Event:", event, properties);
  }
}

// Convenience functions for common events

export function trackHomepagePsychTrailsClick(): void {
  trackProductEvent("homepage_psychtrails_click", { source: "hero" });
}

export function trackHomepageHowItWorksClick(): void {
  trackProductEvent("homepage_how_it_works_click", { source: "hero" });
}

export function trackHomepageResourcesClick(resourceType: string): void {
  trackProductEvent("homepage_resources_click", { source: resourceType });
}

export function trackScenarioStart(
  scenarioId: string,
  packId: string,
  difficulty: string
): void {
  trackProductEvent("psychtrails_scenario_start", {
    scenarioId,
    packId,
    difficulty,
  });
}

export function trackScenarioComplete(
  scenarioId: string,
  packId: string,
  grade: string,
  stars: number,
  durationMs: number
): void {
  trackProductEvent("psychtrails_scenario_complete", {
    scenarioId,
    packId,
    grade,
    stars,
    duration: Math.round(durationMs / 1000), // Convert to seconds
  });
}

export function trackScenarioReplay(scenarioId: string, packId: string): void {
  trackProductEvent("psychtrails_scenario_replay", { scenarioId, packId });
}

export function trackPackSelect(packId: string): void {
  trackProductEvent("psychtrails_pack_select", { packId });
}

export function trackCampusPilotClick(): void {
  trackProductEvent("campus_pilot_click");
}

export function trackCampusContactClick(): void {
  trackProductEvent("for_campuses_contact_click");
}

export function trackCampusPlaylistSelect(
  institutionSlug: string,
  playlistId: string
): void {
  trackProductEvent("campus_playlist_select", { institutionSlug, playlistId });
}

export function trackHowItWorksPlayClick(): void {
  trackProductEvent("how_it_works_play_click");
}

/**
 * PMF-CRITICAL: Track when a user starts their second (or later) scenario.
 * This indicates continued engagement beyond first completion.
 */
export function trackSecondScenarioStart(
  scenarioId: string,
  packId: string,
  totalCompletions: number
): void {
  trackProductEvent("psychtrails_second_scenario_start", {
    scenarioId,
    packId,
    totalCompletions,
  });
}

/**
 * PMF-CRITICAL: Track route discovery.
 * Hidden route discovery indicates deeper engagement.
 */
export function trackRouteDiscovered(
  scenarioId: string,
  routeId: string,
  routeName: string,
  isHidden: boolean,
  routesDiscovered: number,
  totalRoutes: number
): void {
  trackProductEvent("psychtrails_route_discovered", {
    scenarioId,
    routeId,
    routeName,
    isHidden,
    routesDiscovered,
    totalRoutes,
  });
}

/**
 * PMF-CRITICAL: Track transfer commitment.
 * This measures real-world transfer intention.
 */
export function trackTransferCommit(
  scenarioId: string,
  commitmentType: "24h" | "smaller_step" | "talk_to_someone" | "practice_only"
): void {
  trackProductEvent("psychtrails_transfer_commit", {
    scenarioId,
    commitmentType,
  });
}

/**
 * PMF-CRITICAL: Track return visits.
 * This is the core PMF signal.
 */
export function trackReturnVisit(
  daysSinceLast: number,
  totalCompletions: number
): void {
  trackProductEvent("psychtrails_return_visit", {
    daysSinceLast,
    totalCompletions,
  });
}

/**
 * PMF-CRITICAL: Track explicit usefulness signal.
 * This separates "interesting" from "genuinely useful for real life".
 */
export function trackUsefulnessSignal(
  scenarioId: string,
  rating: "yes" | "somewhat" | "not_really",
  isFirstCompletion: boolean
): void {
  trackProductEvent("psychtrails_usefulness_signal", {
    scenarioId,
    usefulnessRating: rating,
    isFirstCompletion,
  });
}

/**
 * PMF-CRITICAL: Track featured scenario exposure.
 * Allows learning which opener is stronger.
 */
export function trackFeaturedShown(scenarioId: string): void {
  trackProductEvent("psychtrails_featured_shown", { scenarioId });
}

/**
 * PMF-CRITICAL: Track featured scenario click.
 */
export function trackFeaturedClick(scenarioId: string): void {
  trackProductEvent("psychtrails_featured_click", { scenarioId });
}

/**
 * PMF-CRITICAL: Track related scenario click.
 * Measures intentional continuation vs random exploration.
 */
export function trackRelatedClick(
  fromScenarioId: string,
  toScenarioId: string
): void {
  trackProductEvent("psychtrails_related_click", {
    fromScenarioId,
    toScenarioId,
  });
}

// ============================================================================
// NAVIGATION V1 EVENTS
// Tracks key engagement for the mental health navigation product
// ============================================================================

/**
 * Track intent selection from homepage IntentGrid
 */
export function trackIntentSelect(intentId: string): void {
  trackProductEvent("nav_intent_select", { intentId, source: "homepage" });
}

/**
 * Track primary navigation clicks
 */
export function trackPrimaryNavClick(navItem: string): void {
  trackProductEvent("nav_primary_click", { navItem });
}

/**
 * Track next step clicks from contextual navigation
 */
export function trackNextStepClick(
  stepId: string,
  stepKind: string,
  stepTitle: string,
  sourceType: string,
  sourceSlug: string
): void {
  trackProductEvent("nav_next_step_click", {
    stepId,
    stepKind,
    stepTitle,
    entityType: sourceType,
    entitySlug: sourceSlug,
  });
}

/**
 * Track condition page views
 */
export function trackConditionView(slug: string, source?: string): void {
  trackProductEvent("nav_condition_view", {
    entitySlug: slug,
    entityType: "condition",
    source,
  });
}

/**
 * Track treatment page views
 */
export function trackTreatmentView(slug: string, source?: string): void {
  trackProductEvent("nav_treatment_view", {
    entitySlug: slug,
    entityType: "treatment",
    source,
  });
}

/**
 * Track Find Care / psychiatrist directory clicks
 */
export function trackFindCareClick(source: string): void {
  trackProductEvent("nav_find_care_click", { source });
}

/**
 * Get a bucketed length for privacy-safe analytics
 */
function getQueryLengthBucket(length: number): string {
  if (length === 0) return "empty";
  if (length <= 5) return "1-5";
  if (length <= 15) return "6-15";
  if (length <= 30) return "16-30";
  if (length <= 50) return "31-50";
  return "50+";
}

/**
 * Track search submissions
 *
 * PRIVACY: Does NOT log the actual search query.
 * Mental health queries may contain sensitive symptoms, diagnoses,
 * medications, or personal details. Only nonsensitive metadata is tracked.
 */
export function trackSearchSubmit(
  queryLength: number,
  vertical?: string,
  hasResults?: boolean
): void {
  trackProductEvent("nav_search_submit", {
    searchVertical: vertical,
    queryLengthBucket: getQueryLengthBucket(queryLength),
    hasResults: hasResults ?? true,
  });
}

/**
 * Track For Clinicians page engagement
 */
export function trackForCliniciansClick(source: string): void {
  trackProductEvent("nav_for_clinicians_click", {
    source,
    audience: "clinician",
  });
}

// ============================================================================
// SYMPTOM EXPLORER EVENTS
// Privacy-safe analytics for symptom exploration experience
// ============================================================================

/**
 * Track symptom hub page view
 */
export function trackSymptomHubView(): void {
  trackProductEvent("symptom_hub_view", { source: "direct" });
}

/**
 * Track symptom detail page view
 */
export function trackSymptomView(slug: string, category: string, source?: string): void {
  trackProductEvent("symptom_view", {
    symptomSlug: slug,
    symptomCategory: category,
    source,
  });
}

/**
 * Track symptom search
 *
 * PRIVACY: Does NOT log the actual search query.
 * Only tracks metadata: query length bucket, result count, category.
 */
export function trackSymptomSearch(
  queryLength: number,
  resultCount: number,
  category?: string
): void {
  trackProductEvent("symptom_search", {
    queryLengthBucket: getQueryLengthBucket(queryLength),
    resultCount,
    symptomCategory: category,
  });
}

/**
 * Track click from symptom page to condition page
 */
export function trackSymptomToConditionClick(
  symptomSlug: string,
  conditionSlug: string
): void {
  trackProductEvent("symptom_to_condition_click", {
    symptomSlug,
    conditionSlug,
  });
}

/**
 * Track click to a related symptom
 */
export function trackRelatedSymptomClick(
  fromSymptomSlug: string,
  toSymptomSlug: string
): void {
  trackProductEvent("symptom_related_click", {
    symptomSlug: fromSymptomSlug,
    relatedSymptomSlug: toSymptomSlug,
  });
}

/**
 * Track when safety panel is shown
 *
 * PRIVACY: Does NOT log the triggering query.
 * This tracks that the safety panel was triggered, not why.
 */
export function trackSymptomSafetyPanelShown(source: "search" | "direct"): void {
  trackProductEvent("symptom_safety_panel_shown", { source });
}

/**
 * Track assessment link click from symptom page
 */
export function trackSymptomAssessmentClick(
  symptomSlug: string,
  assessmentSlug: string
): void {
  trackProductEvent("symptom_assessment_click", {
    symptomSlug,
    assessmentSlug,
  });
}

/**
 * Track category filter usage
 */
export function trackSymptomCategoryFilter(category: string): void {
  trackProductEvent("symptom_category_filter", { symptomCategory: category });
}

// ============================================================================
// TOOLS MARKETPLACE EVENTS
// Privacy-safe analytics for tools discovery and vendor conversion
// CRITICAL: Never log raw search queries - may contain sensitive mental health info
// ============================================================================

/**
 * Track audience selection (patients/clinicians)
 */
export function trackToolsAudienceSelect(
  audience: "patient" | "clinician",
  source: string
): void {
  trackProductEvent("tools_audience_select", { audience, source });
}

/**
 * Track tools search
 *
 * PRIVACY: Does NOT log the actual search query.
 * Mental health tool queries may reveal conditions, symptoms, or treatment interests.
 */
export function trackToolsSearchSubmit(
  queryLength: number,
  resultCount: number,
  audience?: string
): void {
  trackProductEvent("tools_search_submit", {
    queryLengthBucket: getQueryLengthBucket(queryLength),
    resultCount,
    audience,
    hasResults: resultCount > 0,
  });
}

/**
 * Track filter application
 */
export function trackToolsFilterApply(
  filterType: string,
  filterValue: string,
  audience?: string
): void {
  trackProductEvent("tools_filter_apply", {
    filterType,
    filterValue,
    audience,
  });
}

/**
 * Track category/hub opening
 */
export function trackToolsCategoryOpen(
  hubSlug: string,
  audience: "patient" | "clinician",
  source: string
): void {
  trackProductEvent("tools_category_open", {
    hubSlug,
    audience,
    source,
  });
}

/**
 * Track organic (non-sponsored) tool profile view
 */
export function trackToolsProfileView(
  toolSlug: string,
  source: string,
  audience?: string
): void {
  trackProductEvent("tools_profile_view", {
    toolSlug,
    source,
    audience,
    isSponsored: false,
  });
}

// Track which sponsored impressions have already been recorded this session
// to prevent duplicate impression counting
const recordedSponsoredImpressions = new Set<string>();

/**
 * Track sponsored tool impression (deduplicated)
 *
 * Impressions are deduplicated within session by campaign+placement.
 */
export function trackToolsSponsoredImpression(
  toolSlug: string,
  campaignId: string,
  placement: string,
  audience?: string
): void {
  const dedupeKey = `${campaignId}:${placement}`;

  // Skip if already recorded this session
  if (recordedSponsoredImpressions.has(dedupeKey)) {
    return;
  }
  recordedSponsoredImpressions.add(dedupeKey);

  trackProductEvent("tools_sponsored_impression", {
    toolSlug,
    campaignId,
    placement,
    audience,
    isSponsored: true,
  });
}

/**
 * Track sponsored tool click
 */
export function trackToolsSponsoredClick(
  toolSlug: string,
  campaignId: string,
  placement: string,
  audience?: string
): void {
  trackProductEvent("tools_sponsored_click", {
    toolSlug,
    campaignId,
    placement,
    audience,
    isSponsored: true,
  });
}

/**
 * Track outbound click to vendor website
 */
export function trackToolsVendorOutboundClick(
  toolSlug: string,
  destinationType: "website" | "app_store" | "play_store" | "affiliate",
  source: string
): void {
  trackProductEvent("tools_vendor_outbound_click", {
    toolSlug,
    source,
    filterType: destinationType, // reusing for destination type
  });
}

/**
 * Track vendor listing CTA click
 */
export function trackToolsVendorListingCTA(source: string): void {
  trackProductEvent("tools_vendor_listing_cta", { source });
}

/**
 * Track featured partner CTA click
 */
export function trackToolsFeaturedPartnerCTA(source: string): void {
  trackProductEvent("tools_featured_partner_cta", { source });
}
