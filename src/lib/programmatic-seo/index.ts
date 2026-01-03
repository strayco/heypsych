/**
 * Programmatic SEO Module
 * 
 * THE NUCLEAR OPTION FOR SEO DOMINATION
 * 
 * This module automatically generates thousands of long-tail SEO pages by:
 * 1. Scanning your JSON data files for treatments and conditions
 * 2. Intelligently combining them based on linked_conditions
 * 3. Generating unique, valuable content for each combination
 * 4. Adding comprehensive schema.org markup
 * 
 * NO HARDCODING - Add new JSONs and pages are automatically generated!
 * 
 * Usage:
 *   import { getDynamicPageStats } from '@/lib/programmatic-seo';
 *   
 *   const stats = await getDynamicPageStats();
 *   console.log(`Generating ${stats.total} programmatic pages`);
 */

// Dynamic generator (the main system)
export {
  generateDynamicPageConfigs,
  parseDynamicSlug,
  getDynamicPageStats,
  clearDynamicCaches,
  type DynamicPageConfig,
  type DynamicPageType,
} from './dynamic-generator';

// Content engine
export {
  generatePageContent,
  type GeneratedContent,
  type ContentSection,
  type FAQ,
  type KeyFact,
  type ComparisonTable,
  type RelatedPage,
  type Breadcrumb,
} from './content-engine';

// Data types (for external use)
export type {
  TreatmentData,
  ConditionData,
} from './content-combiner';

// Data loader utilities
export {
  loadTreatment,
  loadCondition,
  getAllTreatmentSlugs,
  getAllConditionSlugs,
  preloadAllData,
  clearCaches,
} from './data-loader';

// Instant indexing (notify search engines immediately)
export {
  pushAllPagesToIndexNow,
  getHighPriorityUrls,
  generateIndexNowPingUrl,
} from './instant-indexing';

// Golden snippets (position 0 optimization)
export {
  generateGoldenSnippet,
  formatForSnippet,
  generatePAAQuestions,
  type GoldenSnippet,
} from './golden-snippets';

// WebMD Killer utilities
export {
  generateTopicClusters,
  generateFreshnessSignals,
  generateSemanticVariations,
  generateEATSignals,
  getPublishingVelocity,
  getEntitySaturationScore,
  calculateContentDepth,
  getPageTypeForQuery,
  COMPETITOR_GAPS,
  SERP_FEATURE_OPTIMIZATIONS,
  INTENT_MAPPING,
  type TopicCluster,
  type FreshnessSignals as WebMDFreshnessSignals, // Renamed to avoid conflict
  type EATSignals,
  type ContentDepthScore,
} from './webmd-killer';

// World Domination utilities
export {
  generateZeroClickAnswer,
  generateVoiceSearchTargets,
  generateAICitationBlocks,
  calculateExpansionPotential,
  AI_CITATION_TRIGGERS,
  EXPANSION_PATTERNS,
  SEASONAL_TOPICS,
  NEWS_TRIGGERED_TOPICS,
  AUTHORITY_SIGNALS,
  MISSION,
  type ZeroClickAnswer,
  type VoiceSearchTarget,
  type AICitationBlock,
} from './world-domination';

// ============ THE WIN PROTOCOL ============
// These modules implement the FINAL FIX for sustainable dominance

// Index Eligibility Gate
export {
  checkIndexEligibility,
  filterForSitemap,
  getRobotsDirective,
  calculateEligibilityStats,
  type EligibilityResult,
  type EligibilityThresholds,
  type EligibilityStats,
} from './index-eligibility';

// Answer Kings (Canonical Authority Model)
export {
  isAnswerKing,
  getKingSlug,
  getVariantRules,
  generateClusterLinks,
  generateSnippetOptimization,
  type AnswerCluster,
  type VariantRules,
  type ClusterLinks,
  type SnippetOptimization,
} from './answer-kings';

// Medical Authority (Real, Visible, Defensible)
export {
  MEDICAL_REVIEW_BOARD,
  getReviewScope,
  generateHonestFreshness,
  formatFreshnessDisplay,
  generateMedicalAuthoritySchema,
  CITATION_TEMPLATES,
  formatCitation,
  getDisclaimer,
  type MedicalReviewer,
  type ReviewScope,
  type FreshnessSignals,
  type CitationPattern,
  type Disclaimer,
  type DisclaimerLevel,
} from './medical-authority';

// Schema Discipline (Less, but correct)
export {
  validateSchema,
  generateFAQSchema,
  generateDrugSchema,
  generateMedicalConditionSchema,
  generateMedicalWebPageSchema,
  generateSpeakableSchema,
  aggregatePageSchemas,
  type SchemaValidation,
} from './schema-discipline';

// Legacy exports (for backwards compatibility)
export {
  generateAllPageConfigs,
  parsePageSlug,
  getAllProgrammaticSlugs,
  getPageCount,
  HIGH_PRIORITY_COMBINATIONS,
  DEMOGRAPHICS,
  CONTENT_MODIFIERS,
  type ProgrammaticPageConfig,
  type PageType,
  type DemographicModifier,
  type ContentModifier,
} from './page-generator';
