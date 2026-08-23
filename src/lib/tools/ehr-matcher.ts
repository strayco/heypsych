// src/lib/tools/ehr-matcher.ts
// EHR Matcher scoring algorithm and types
//
// Scores EHR tools based on practice requirements from questionnaire

import {
  type ClinicianToolV4,
  type OrganizationSize,
  type PracticeSetting,
  type CapabilitySlug,
} from "../schemas/clinician-tool-v4";

// ============================================================================
// QUESTIONNAIRE TYPES
// ============================================================================

export interface EHRMatcherAnswers {
  practiceSize: OrganizationSize;
  practiceSetting: PracticeSetting;
  needsTelehealth: boolean;
  needsBilling: boolean;
  needsEPrescribing: boolean;
  needsAI: boolean;
  needsPatientPortal: boolean;
  budget: "budget" | "mid-market" | "premium" | "any";
  hipaaRequired: boolean;
}

export interface EHRMatchScore {
  tool: ClinicianToolV4;
  score: number;
  maxScore: number;
  percentage: number;
  matchReasons: string[];
  mismatchReasons: string[];
  // Mission 4: Hard requirement tracking
  hipaaDisqualified: boolean; // Tool doesn't confirm HIPAA when required
  baaDisqualified: boolean; // Tool doesn't confirm BAA when required
  missingRequirements: string[]; // Required features the tool lacks (hard-gate disqualifiers)
}

// ============================================================================
// QUESTIONNAIRE CONFIG
// ============================================================================

export interface QuestionOption<T> {
  value: T;
  label: string;
  description?: string;
}

export interface Question<T> {
  id: string;
  question: string;
  type: "single" | "boolean";
  options: QuestionOption<T>[];
}

export const EHR_MATCHER_QUESTIONS: Question<unknown>[] = [
  {
    id: "practiceSize",
    question: "What is the size of your practice?",
    type: "single",
    options: [
      { value: "solo", label: "Solo (1 provider)", description: "Just me" },
      { value: "small-2-10", label: "Small (2-10 providers)", description: "Small group practice" },
      { value: "medium-11-50", label: "Medium (11-50 providers)", description: "Medium group or clinic" },
      { value: "large-51-200", label: "Large (51-200 providers)", description: "Large clinic or system" },
      { value: "enterprise-200-plus", label: "Enterprise (200+)", description: "Hospital or health system" },
    ],
  },
  {
    id: "practiceSetting",
    question: "What best describes your practice setting?",
    type: "single",
    options: [
      { value: "solo-practice", label: "Private Practice", description: "Solo or small group" },
      { value: "group-practice", label: "Group Practice", description: "Multi-provider group" },
      { value: "community-mental-health", label: "Community Mental Health", description: "CMHC or FQHC" },
      { value: "hospital-inpatient", label: "Hospital / Inpatient", description: "Hospital-based care" },
      { value: "telehealth-only", label: "Telehealth Only", description: "100% virtual practice" },
    ],
  },
  {
    id: "needsTelehealth",
    question: "Do you need built-in telehealth video sessions?",
    type: "boolean",
    options: [
      { value: true, label: "Yes", description: "I need integrated video sessions" },
      { value: false, label: "No", description: "I use a separate telehealth platform or see patients in-person" },
    ],
  },
  {
    id: "needsBilling",
    question: "Do you need insurance billing and claims submission?",
    type: "boolean",
    options: [
      { value: true, label: "Yes", description: "I bill insurance and need claims features" },
      { value: false, label: "No", description: "I'm cash-pay or use a separate billing service" },
    ],
  },
  {
    id: "needsEPrescribing",
    question: "Do you need e-prescribing (including controlled substances)?",
    type: "boolean",
    options: [
      { value: true, label: "Yes", description: "I prescribe medications" },
      { value: false, label: "No", description: "I don't prescribe or use a separate system" },
    ],
  },
  {
    id: "needsAI",
    question: "Are you interested in AI-powered note-taking or documentation?",
    type: "boolean",
    options: [
      { value: true, label: "Yes", description: "I want AI to help with notes" },
      { value: false, label: "No", description: "I prefer traditional documentation" },
    ],
  },
  {
    id: "budget",
    question: "What is your budget range per provider per month?",
    type: "single",
    options: [
      { value: "budget", label: "Budget ($0-50)", description: "Under $50/provider/month" },
      { value: "mid-market", label: "Mid-Market ($50-150)", description: "$50-150/provider/month" },
      { value: "premium", label: "Premium ($150+)", description: "Over $150/provider/month" },
      { value: "any", label: "Flexible", description: "Price is not the main factor" },
    ],
  },
];

// ============================================================================
// SCORING ALGORITHM
// ============================================================================

const WEIGHTS = {
  practiceSize: 20,
  practiceSetting: 15,
  telehealth: 15,
  billing: 15,
  ePrescribing: 10,
  ai: 10,
  budget: 10,
  hipaa: 5,
};

/**
 * Score a tool against user requirements
 *
 * Mission FIX 4: Hard-gates for required features
 * - Required features exclude tools that don't have them
 * - Unknown audiences remain unknown (no partial credit)
 * - BAA checked separately from HIPAA
 * - Explicit tracking of missing requirements
 */
export function scoreEHRTool(
  tool: ClinicianToolV4,
  answers: EHRMatcherAnswers
): EHRMatchScore {
  let score = 0;
  const maxScore = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
  const matchReasons: string[] = [];
  const mismatchReasons: string[] = [];
  const missingRequirements: string[] = []; // Hard-gate disqualifiers

  // Practice Size Match
  // FIX 4: Unknown audiences stay unknown - no partial credit
  if (tool.audiences.organization_sizes.length === 0) {
    // Unknown - we don't know if it fits
    mismatchReasons.push("Practice size compatibility not specified");
  } else if (tool.audiences.organization_sizes.includes(answers.practiceSize)) {
    score += WEIGHTS.practiceSize;
    matchReasons.push(`Designed for ${formatOrgSize(answers.practiceSize)} practices`);
  } else {
    mismatchReasons.push(`May not be ideal for ${formatOrgSize(answers.practiceSize)} practices`);
  }

  // Practice Setting Match
  // FIX 4: Unknown audiences stay unknown - no partial credit
  if (tool.audiences.practice_settings.length === 0) {
    mismatchReasons.push("Practice setting compatibility not specified");
  } else if (tool.audiences.practice_settings.includes(answers.practiceSetting)) {
    score += WEIGHTS.practiceSetting;
    matchReasons.push(`Built for ${formatSetting(answers.practiceSetting)}`);
  } else {
    mismatchReasons.push(`May not be optimized for ${formatSetting(answers.practiceSetting)}`);
  }

  // FIX 4: Telehealth - HARD REQUIREMENT if requested
  if (answers.needsTelehealth) {
    if (tool.feature_flags.has_telehealth || hasCapability(tool, "video-sessions")) {
      score += WEIGHTS.telehealth;
      matchReasons.push("Built-in telehealth video sessions");
    } else {
      missingRequirements.push("Built-in telehealth");
      mismatchReasons.push("No built-in telehealth (required)");
    }
  } else {
    score += WEIGHTS.telehealth; // Not needed, no penalty
  }

  // FIX 4: Billing/RCM - HARD REQUIREMENT if requested
  if (answers.needsBilling) {
    if (tool.feature_flags.has_rcm || hasCapability(tool, "claims-submission")) {
      score += WEIGHTS.billing;
      matchReasons.push("Insurance billing and claims submission");
    } else {
      missingRequirements.push("Insurance billing");
      mismatchReasons.push("No insurance billing (required)");
    }
  } else {
    score += WEIGHTS.billing;
  }

  // FIX 4: E-Prescribing - HARD REQUIREMENT if requested
  if (answers.needsEPrescribing) {
    if (tool.feature_flags.has_e_prescribing || hasCapability(tool, "e-prescribing")) {
      score += WEIGHTS.ePrescribing;
      matchReasons.push("E-prescribing available");
      if (hasCapability(tool, "epcs-controlled")) {
        matchReasons.push("EPCS for controlled substances");
      }
    } else {
      missingRequirements.push("E-prescribing");
      mismatchReasons.push("No e-prescribing (required)");
    }
  } else {
    score += WEIGHTS.ePrescribing;
  }

  // AI Features - NOT a hard requirement (nice-to-have)
  if (answers.needsAI) {
    if (tool.feature_flags.has_ai || hasCapability(tool, "note-generation") || hasCapability(tool, "ambient-listening")) {
      score += WEIGHTS.ai;
      matchReasons.push("AI-powered documentation");
    } else {
      mismatchReasons.push("No AI features");
      // Not a hard requirement - still show tool but note the gap
    }
  } else {
    score += WEIGHTS.ai;
  }

  // Budget Match
  if (answers.budget === "any") {
    score += WEIGHTS.budget;
  } else if (tool.pricing?.price_range) {
    if (tool.pricing.price_range === answers.budget) {
      score += WEIGHTS.budget;
      matchReasons.push(`Fits ${answers.budget} budget`);
    } else if (
      (answers.budget === "mid-market" && tool.pricing.price_range === "budget") ||
      (answers.budget === "premium" && tool.pricing.price_range !== "enterprise")
    ) {
      // Under budget is okay
      score += WEIGHTS.budget * 0.8;
      matchReasons.push(`Under budget (${tool.pricing.price_range})`);
    } else {
      mismatchReasons.push(`May exceed ${answers.budget} budget`);
    }
  } else {
    // FIX 4: Unknown pricing stays unknown
    mismatchReasons.push("Pricing not available");
  }

  // FIX 4: HIPAA and BAA checked separately
  // IMPORTANT: We report what vendors CLAIM. Always verify directly with vendors.
  let hipaaDisqualified = false;
  let baaDisqualified = false;

  if (answers.hipaaRequired) {
    // HIPAA is a hard requirement
    if (tool.compliance.hipaa_support === "yes") {
      score += WEIGHTS.hipaa * 0.5; // Half credit for HIPAA
      matchReasons.push("Vendor reports HIPAA support (verify directly)");
    } else if (tool.compliance.hipaa_support === "unknown") {
      hipaaDisqualified = true;
      mismatchReasons.push("HIPAA support not confirmed");
    } else {
      hipaaDisqualified = true;
      mismatchReasons.push("No HIPAA support reported");
    }

    // BAA checked separately
    if (tool.compliance.baa_available === "yes") {
      score += WEIGHTS.hipaa * 0.5; // Other half for BAA
      matchReasons.push("BAA available (always obtain signed copy)");
    } else if (tool.compliance.baa_available === "unknown") {
      baaDisqualified = true;
      mismatchReasons.push("BAA availability not confirmed");
    } else {
      baaDisqualified = true;
      mismatchReasons.push("No BAA available");
    }
  } else {
    // HIPAA nice-to-have when not required
    if (tool.compliance.hipaa_support === "yes") {
      score += WEIGHTS.hipaa * 0.5;
      matchReasons.push("Vendor reports HIPAA support");
    }
    if (tool.compliance.baa_available === "yes") {
      score += WEIGHTS.hipaa * 0.5;
      matchReasons.push("BAA available");
    }
  }

  return {
    tool,
    score,
    maxScore,
    percentage: Math.round((score / maxScore) * 100),
    matchReasons,
    mismatchReasons,
    hipaaDisqualified,
    baaDisqualified,
    missingRequirements,
  };
}

/**
 * Score all EHR tools and return sorted results
 *
 * FIX 4: Hard-gates filter out tools missing required features
 */
export function matchEHRTools(
  tools: ClinicianToolV4[],
  answers: EHRMatcherAnswers
): EHRMatchScore[] {
  // Only consider EHR category tools
  const ehrTools = tools.filter(
    (t) =>
      t.primary_category === "ehr-practice-management" ||
      t.feature_flags.has_ehr
  );

  // Score each tool
  const scores = ehrTools.map((tool) => scoreEHRTool(tool, answers));

  // FIX 4: Separate qualified and disqualified tools
  const qualified = scores.filter((s) => s.missingRequirements.length === 0);
  const disqualified = scores.filter((s) => s.missingRequirements.length > 0);

  // Sort qualified tools by:
  // 1. Non-compliance-disqualified first
  // 2. Score descending
  // 3. Alphabetical by name (deterministic tie-breaker)
  qualified.sort((a, b) => {
    // Compliance disqualified goes lower in qualified list
    const aCompliance = a.hipaaDisqualified || a.baaDisqualified;
    const bCompliance = b.hipaaDisqualified || b.baaDisqualified;
    if (aCompliance !== bCompliance) {
      return aCompliance ? 1 : -1;
    }
    // Higher score first
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Alphabetical tie-breaker
    return a.tool.name.localeCompare(b.tool.name);
  });

  // Sort disqualified tools by score (for "Other options" section)
  disqualified.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.tool.name.localeCompare(b.tool.name);
  });

  // Return qualified first, then disqualified
  return [...qualified, ...disqualified];
}

// ============================================================================
// HELPERS
// ============================================================================

function hasCapability(tool: ClinicianToolV4, cap: CapabilitySlug): boolean {
  return tool.capabilities.includes(cap);
}

function formatOrgSize(size: OrganizationSize): string {
  const labels: Record<OrganizationSize, string> = {
    solo: "solo",
    "small-2-10": "small (2-10 provider)",
    "medium-11-50": "medium (11-50 provider)",
    "large-51-200": "large (51-200 provider)",
    "enterprise-200-plus": "enterprise",
  };
  return labels[size] || size;
}

function formatSetting(setting: PracticeSetting): string {
  const labels: Record<PracticeSetting, string> = {
    "solo-practice": "private practice",
    "group-practice": "group practice",
    "community-mental-health": "community mental health",
    "hospital-inpatient": "hospital/inpatient",
    "telehealth-only": "telehealth-only",
    "multi-site-enterprise": "multi-site enterprise",
    "integrated-care": "integrated care",
    "residential-treatment": "residential treatment",
  };
  return labels[setting] || setting;
}
