/**
 * Architect Domain Analytics
 *
 * Re-exports analytics tracking functions.
 */

export {
  // Core
  trackArchitectEvent,
  trackArchitectPageView,
  trackModeSelect,
  trackDemoStart,
  // Fingerprint / Onboarding
  trackFingerprintStart,
  trackFingerprintStepComplete,
  trackFingerprintComplete,
  trackFingerprintEdit,
  // Practice Areas (new visual experience)
  trackAreaView,
  trackItemView,
  trackItemAction,
  // Lifecycle (legacy)
  trackStageView,
  trackCapabilityView,
  // Stack Management
  trackProductAdd,
  trackProductRemove,
  trackProductReplace,
  trackStackUndo,
  // Product Discovery
  trackShortlistView,
  trackFitScoreView,
  trackWhyFitsOpen,
  trackReplacementPreview,
  trackProductDrawerOpen,
  trackProductDrawerClose,
  // Recommendations
  trackRecommendationShown,
  trackRecommendationAccepted,
  trackRecommendationCustomized,
  // Gap Analysis
  trackGapClick,
  trackOverlapReview,
  trackCompatibilityAlertView,
  // Health & Cost
  trackHealthView,
  trackCostView,
  trackAdvancedToggle,
  // Commercial Funnel
  trackCommercialCtaShown,
  trackCommercialCtaClick,
  trackDemoRequest,
  trackQuoteRequest,
  trackVendorVisit,
  trackProductDetailView,
  // Persistence
  trackStackSave,
  trackStackLoad,
  trackStackExport,
  trackStackImport,
  // Blueprint Milestones
  trackBlueprintGenerated,
  trackBlueprintComplete,
  // Session
  trackSessionComplete,
  trackHelpClick,
  // Utilities
  getScoreBucket,
} from "./architect-events";
