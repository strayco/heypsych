/**
 * Architect Adapters
 *
 * Bridge between existing V4 clinician tools data and Architect domain.
 */

// Capability mapping
export {
  V4_TO_ARCHITECT_CAPABILITY_MAP,
  ARCHITECT_TO_V4_CAPABILITY_MAP,
  ARCHITECT_ONLY_CAPABILITIES,
  mapV4ToArchitectCapabilities,
  getV4CapabilitiesForArchitect,
  hasV4Mapping,
} from "./capability-mapping";

// V4 product adapter
export {
  deriveArchitectMetadata,
  PRACTICE_SETTING_TO_TYPE,
  ORG_SIZE_TO_BUCKET,
  CLINICIAN_ROLE_TO_CLINICAL,
  CATEGORY_CORE_CAPABILITIES,
} from "./v4-product-adapter";

// V4 category to Architect stage mapping
export {
  V4_CATEGORY_TO_ARCHITECT_STAGE,
  ARCHITECT_STAGE_TO_V4_CATEGORIES,
  STAGE_TO_CATEGORY_DISPLAY,
  getStageForCategory,
  getCategoriesForStage,
  getPrimaryCategoryForStage,
} from "./category-stage-mapping";
