/**
 * Architect Domain Engines
 *
 * Re-exports all deterministic scoring and analysis engines.
 * These engines are pure functions with no side effects.
 */

// Relevance Engine
export {
  getCapabilityRelevance,
  getAllCapabilityRelevance,
  getCapabilitiesByRelevance,
  getImportantCapabilities,
  countByRelevance,
  type RelevanceResult,
} from "./relevance-engine";

// Fit Engine
export {
  calculateFitScore,
  sortByFit,
  type ProductFitInput,
} from "./fit-engine";

// Coverage Engine
export {
  calculateStackCoverage,
  getCoverageSummary,
  getProductCoverage,
  getProductsForCapability,
} from "./coverage-engine";

// Overlap Engine
export {
  analyzeOverlaps,
  analyzeProductPairOverlaps,
  countOverlapsByClass,
  getOverlapsForProduct,
  getProductPairOverlapsForProduct,
  getOverlapForCapability,
  hasRedundancyConcerns,
  getOverlapSummary,
} from "./overlap-engine";

// Compatibility Engine
export {
  analyzeCompatibility,
  getCompatibilityConcerns,
  getProductCompatibility,
  checkAddProductCompatibility,
  calculateCompatibilityScore,
  getIntegrationSummary,
} from "./compatibility-engine";

// Cost Engine
export {
  calculateProductCost,
  calculateStackCost,
  formatCost,
  formatCostRange,
  checkBudget,
  type ProductCostResult,
  type ProductMetadataMap,
} from "./cost-engine";

// Eligibility Engine
export {
  evaluateEligibility,
  isEligible,
  HARD_EXCLUSION_POLICIES,
  type EligibilityFinding,
  type EligibilityResult,
  type HardExclusionPolicy,
} from "./eligibility-engine";

// Health Engine
export {
  calculateStackHealth,
  getImprovementSuggestions,
  compareHealthImpact,
  type HealthEngineInput,
} from "./health-engine";

// Recommendation Engine
export {
  generateRecommendation,
  shouldRegenerateRecommendation,
  getRecommendationSummary,
  type RecommendationInput,
  type RecommendedProduct,
  type StackRecommendation,
} from "./recommendation-engine";
