/**
 * V4 Category → Architect Stage Mapping
 *
 * Maps V4 clinician tool categories to Architect lifecycle stages.
 * This ensures consistency between /tools/for-clinicians and Practice Architect.
 *
 * V4 Categories are SEO-optimized for how clinicians search.
 * Architect Stages represent the practice lifecycle.
 */

import type { LifecycleStageId } from "../schemas";

/**
 * Mapping from V4 category slugs to Architect lifecycle stage IDs.
 * Multiple V4 categories can map to the same stage.
 */
export const V4_CATEGORY_TO_ARCHITECT_STAGE: Record<string, LifecycleStageId> = {
  // GROW stage - Patient acquisition and growth
  "marketing-patient-acquisition": "grow",
  "provider-networks": "grow", // Partially - also helps with access

  // ACCESS stage - Intake, scheduling, and patient access
  "scheduling-intake": "access",

  // ENGAGE stage - Patient communication and engagement
  "telehealth-communication": "engage",
  "patient-engagement": "engage",

  // CARE stage - Clinical documentation and care delivery
  "ehr-practice-management": "care",
  "ai-scribe-documentation": "care",
  "clinical-decision-support": "care",
  "prescribing-erx": "care",
  "measurement-outcomes": "care",
  "care-coordination": "care",
  "digital-therapeutics": "care",

  // REVENUE stage - Billing, coding, and revenue cycle
  "billing-rcm": "revenue",
  "credentialing-workforce": "revenue", // Partially - also operate

  // OPERATE stage - Practice operations and compliance
  "compliance-security": "operate",
  "analytics-reporting": "operate",
};

/**
 * Reverse mapping: Architect stage → V4 categories
 */
export const ARCHITECT_STAGE_TO_V4_CATEGORIES: Record<LifecycleStageId, string[]> = {
  grow: ["marketing-patient-acquisition", "provider-networks"],
  access: ["scheduling-intake"],
  engage: ["telehealth-communication", "patient-engagement"],
  care: [
    "ehr-practice-management",
    "ai-scribe-documentation",
    "clinical-decision-support",
    "prescribing-erx",
    "measurement-outcomes",
    "care-coordination",
    "digital-therapeutics",
  ],
  revenue: ["billing-rcm", "credentialing-workforce"],
  operate: ["compliance-security", "analytics-reporting"],
};

/**
 * Human-readable names for linking between systems
 */
export const STAGE_TO_CATEGORY_DISPLAY: Record<LifecycleStageId, { primary: string; url: string }> = {
  grow: {
    primary: "Marketing & Patient Acquisition",
    url: "/tools/for-clinicians/marketing-patient-acquisition/",
  },
  access: {
    primary: "Scheduling & Intake",
    url: "/tools/for-clinicians/scheduling-intake/",
  },
  engage: {
    primary: "Telehealth & Communication",
    url: "/tools/for-clinicians/telehealth-communication/",
  },
  care: {
    primary: "EHR & Practice Management",
    url: "/tools/for-clinicians/ehr-practice-management/",
  },
  revenue: {
    primary: "Billing, RCM & Insurance",
    url: "/tools/for-clinicians/billing-rcm/",
  },
  operate: {
    primary: "Compliance & Security",
    url: "/tools/for-clinicians/compliance-security/",
  },
};

/**
 * Get the Architect stage for a V4 category
 */
export function getStageForCategory(categorySlug: string): LifecycleStageId | null {
  return V4_CATEGORY_TO_ARCHITECT_STAGE[categorySlug] ?? null;
}

/**
 * Get V4 categories for an Architect stage
 */
export function getCategoriesForStage(stageId: LifecycleStageId): string[] {
  return ARCHITECT_STAGE_TO_V4_CATEGORIES[stageId] ?? [];
}

/**
 * Get the primary category link for a stage
 */
export function getPrimaryCategoryForStage(stageId: LifecycleStageId): { name: string; url: string } {
  const mapping = STAGE_TO_CATEGORY_DISPLAY[stageId];
  return { name: mapping.primary, url: mapping.url };
}
