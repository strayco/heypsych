/**
 * Symptom Domain
 *
 * Exports all symptom-related types, utilities, and data.
 */

// Types
export type {
  SymptomCategory,
  SymptomCategoryMeta,
  ExampleContext,
  SymptomExample,
  SymptomConditionRelationship,
  ExtractedSymptom,
  SymptomEntity,
  SymptomSearchResult,
  SymptomSearchIndexEntry,
  QualityGateResult,
  NoticedItem,
  SymptomExplorerProps,
  SymptomDetailProps,
} from "./types";

// Registry
export {
  SYMPTOM_CATEGORIES,
  SYMPTOM_REGISTRY,
  getCategoryMeta,
  getIndexableSymptoms,
  getSymptomBySlug,
  getSymptomsByCategory,
  getAllSymptomSlugs,
  findSymptomBySlugOrAlias,
} from "./registry";

// Normalizer
export {
  extractSymptomsFromCondition,
  extractExamplesFromCondition,
  loadAllConditions,
  extractAllSymptoms,
  groupSymptomsByText,
  getSymptomFrequency,
  normalizeSymptomText,
  getSymptomsByCondition,
} from "./normalizer";

// Search
export {
  buildSearchIndex,
  searchSymptoms,
  getSuggestedPrompts,
  suggestCategories,
  checkForSafetyKeywords,
  getPrebuiltSearchIndex,
} from "./search-index";

// Quality Gate
export {
  validateSymptomEntity,
  validateAllSymptoms,
  getApprovedSymptoms,
  getFailingSymptoms,
  validateUniqueSlugs,
  validateConditionReferences,
  runFullValidation,
} from "./quality-gate";
