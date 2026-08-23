/**
 * Tool Comparison Engine
 *
 * Generates dynamic comparisons from clinician tool records.
 * Follows patterns from treatment comparison engine.
 *
 * Design principles:
 * - No universal winner scoring
 * - Sponsorship CANNOT affect comparison results
 * - Explicit handling of missing/unknown data
 * - Category-aware comparison templates
 * - Support for 2-4 tools
 */

// =============================================================================
// TYPES
// =============================================================================

// Import canonical type from schema - no shadow types
import type { ClinicianToolV4 } from "@/lib/schemas/clinician-tool-v4";

// Re-export for backwards compatibility with existing imports
export type ClinicianTool = ClinicianToolV4;

/**
 * Tool category types for comparison templates
 */
export type ToolCategory =
  | "ehr-practice-management"
  | "ai-scribe-documentation"
  | "billing-rcm"
  | "telehealth-communication"
  | "measurement-outcomes"
  | "provider-networks"
  | "general";

/**
 * Comparison value status
 */
export type ComparisonDataStatus = "known" | "unknown" | "not_applicable" | "not_verified";

/**
 * How a comparison attribute should be compared
 */
export type ComparisonSemantics =
  | "categorical"
  | "presence"
  | "directional"
  | "descriptive"
  | "not_directly_comparable";

/**
 * Data type for comparison rendering
 */
export type ComparisonDataType =
  | "text"
  | "boolean"
  | "enum"
  | "tags"
  | "price"
  | "list"
  | "integration_count"
  | "capability";

/**
 * Comparison attribute groups
 */
export type ToolComparisonGroup =
  | "overview"
  | "pricing"
  | "compliance"
  | "features"
  | "integrations"
  | "support"
  | "ehr_specific"
  | "ai_scribe_specific"
  | "billing_specific";

/**
 * Provenance for a comparison value (for transparency)
 */
export interface ValueProvenance {
  source?: string;
  sourceUrl?: string;
  verifiedDate?: string;
  confidence?: "high" | "medium" | "low" | "unknown";
}

/**
 * A comparison value with metadata
 */
export interface ToolComparisonValue {
  raw: unknown;
  display: string;
  status: ComparisonDataStatus;
  isHighlight?: boolean;
  notes?: string;
  provenance?: ValueProvenance;
}

/**
 * Context for comparison
 */
export interface ToolComparisonContext {
  category?: ToolCategory;
  depthLevel: "essential" | "detailed" | "clinical";
}

/**
 * Definition of a comparison attribute
 */
export interface ToolComparisonAttributeDefinition {
  key: string;
  label: string;
  shortLabel?: string;
  description?: string;
  group: ToolComparisonGroup;
  order: number;
  applicability: ToolCategory[] | "universal";
  dataType: ComparisonDataType;
  comparisonSemantics: ComparisonSemantics;
  missingBehavior: string;
  extractValue: (tool: ClinicianTool, context?: ToolComparisonContext) => ToolComparisonValue;
}

/**
 * A row in the comparison
 */
export interface ToolComparisonRow {
  attribute: ToolComparisonAttributeDefinition;
  values: Map<string, ToolComparisonValue>;
  hasDifferences: boolean;
  isUniversal: boolean;
  applicableCategories: ToolCategory[];
}

/**
 * Tool-specific differentiator (not a winner)
 */
export interface ToolDifferentiator {
  toolSlug: string;
  toolName: string;
  statement: string;
  attributeKey: string;
  isPositive?: boolean;
}

/**
 * Complete comparison result
 */
export interface ToolComparisonResult {
  tools: ClinicianTool[];
  context: ToolComparisonContext;
  rows: ToolComparisonRow[];
  groups: Map<ToolComparisonGroup, ToolComparisonRow[]>;
  categories: ToolCategory[];
  isCrossCategory: boolean;
  differentiators: ToolDifferentiator[];
  shareableUrl: string;
}

// =============================================================================
// COMPARISON ATTRIBUTE REGISTRY
// =============================================================================

/**
 * Central registry of all tool comparison attributes
 *
 * IMPORTANT: These attributes are defined purely based on data.
 * Sponsorship status CANNOT and DOES NOT affect comparison results.
 */
export const TOOL_COMPARISON_ATTRIBUTES: ToolComparisonAttributeDefinition[] = [
  // =========================================================================
  // OVERVIEW GROUP
  // =========================================================================
  {
    key: "name",
    label: "Tool Name",
    shortLabel: "Name",
    group: "overview",
    order: 1,
    applicability: "universal",
    dataType: "text",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show slug",
    extractValue: (tool) => ({
      raw: tool.name,
      display: tool.name,
      status: "known",
    }),
  },
  {
    key: "company",
    label: "Company",
    shortLabel: "Company",
    group: "overview",
    order: 2,
    applicability: "universal",
    dataType: "text",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => ({
      raw: tool.company_name,
      display: tool.company_name || "Unknown",
      status: tool.company_name ? "known" : "unknown",
    }),
  },
  {
    key: "description",
    label: "What It Is",
    shortLabel: "Summary",
    group: "overview",
    order: 3,
    applicability: "universal",
    dataType: "text",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show short description",
    extractValue: (tool) => ({
      raw: tool.one_liner || tool.short_description,
      display: tool.one_liner || tool.short_description || "No description available",
      status: tool.one_liner || tool.short_description ? "known" : "unknown",
    }),
  },
  {
    key: "category",
    label: "Primary Category",
    shortLabel: "Category",
    group: "overview",
    order: 4,
    applicability: "universal",
    dataType: "enum",
    comparisonSemantics: "categorical",
    missingBehavior: "Show 'Uncategorized'",
    extractValue: (tool) => ({
      raw: tool.primary_category,
      display: formatCategory(tool.primary_category),
      status: tool.primary_category ? "known" : "unknown",
    }),
  },
  {
    key: "founded",
    label: "Founded",
    shortLabel: "Founded",
    group: "overview",
    order: 5,
    applicability: "universal",
    dataType: "text",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show 'Unknown'",
    // NOTE: company_info doesn't exist in canonical ClinicianToolV4 schema
    extractValue: () => ({
      raw: null,
      display: "Unknown",
      status: "unknown" as const,
    }),
  },
  {
    key: "best_for",
    label: "Best For",
    shortLabel: "Best For",
    group: "overview",
    order: 6,
    applicability: "universal",
    dataType: "list",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show 'Not specified'",
    extractValue: (tool) => {
      const bestFor = tool.best_for || [];
      return {
        raw: bestFor,
        display: bestFor.length > 0 ? bestFor.slice(0, 3).join("; ") : "Not specified",
        status: bestFor.length > 0 ? "known" : "unknown",
      };
    },
  },

  // =========================================================================
  // PRICING GROUP
  // =========================================================================
  {
    key: "starting_price",
    label: "Starting Price",
    shortLabel: "Price",
    group: "pricing",
    order: 10,
    applicability: "universal",
    dataType: "price",
    comparisonSemantics: "directional",
    missingBehavior: "Show 'Contact for pricing'",
    extractValue: (tool) => {
      const pricing = tool.pricing;
      if (!pricing) {
        return { raw: null, display: "Contact for pricing", status: "unknown" };
      }
      if (pricing.quote_required) {
        return { raw: null, display: "Custom quote required", status: "known" };
      }
      return {
        raw: pricing.starting_price_cents,
        display: pricing.starting_price_display || "Contact for pricing",
        status: pricing.starting_price_display ? "known" : "unknown",
        provenance: pricing.last_verified
          ? { verifiedDate: pricing.last_verified, confidence: "high" }
          : undefined,
      };
    },
  },
  {
    key: "pricing_model",
    label: "Pricing Model",
    shortLabel: "Model",
    group: "pricing",
    order: 11,
    applicability: "universal",
    dataType: "enum",
    comparisonSemantics: "categorical",
    missingBehavior: "Show 'Not specified'",
    extractValue: (tool) => ({
      raw: tool.pricing?.model,
      display: formatPricingModel(tool.pricing?.model) || "Not specified",
      status: tool.pricing?.model ? "known" : "unknown",
    }),
  },
  {
    key: "free_trial",
    label: "Free Trial",
    shortLabel: "Trial",
    group: "pricing",
    order: 12,
    applicability: "universal",
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => {
      const trialDays = tool.pricing?.free_trial_days;
      if (trialDays && trialDays > 0) {
        return {
          raw: trialDays,
          display: `${trialDays} days`,
          status: "known",
        };
      }
      if (tool.pricing?.free_tier) {
        return { raw: true, display: "Free tier available", status: "known" };
      }
      return { raw: false, display: "No free trial", status: "known" };
    },
  },
  {
    key: "pricing_notes",
    label: "Pricing Details",
    shortLabel: "Details",
    group: "pricing",
    order: 13,
    applicability: "universal",
    dataType: "text",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show 'No additional details'",
    extractValue: (tool) => ({
      raw: tool.pricing?.notes,
      display: tool.pricing?.notes || "No additional details",
      status: tool.pricing?.notes ? "known" : "unknown",
    }),
  },

  // =========================================================================
  // COMPLIANCE GROUP
  // =========================================================================
  {
    key: "hipaa_compliant",
    label: "HIPAA Compliant",
    shortLabel: "HIPAA",
    group: "compliance",
    order: 20,
    applicability: "universal",
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => {
      // CORRECT: compliance fields use UncertaintyBoolean strings, not booleans
      const hipaa = tool.compliance?.hipaa_support;
      const isYes = hipaa === "yes";
      const isNo = hipaa === "no";
      const isNotApplicable = hipaa === "not_applicable";
      return {
        raw: hipaa,
        display: isYes ? "Yes" : isNo ? "No" : isNotApplicable ? "N/A" : "Unknown",
        status: hipaa && hipaa !== "unknown" ? "known" : "unknown",
        provenance: tool.compliance?.hipaa_provenance
          ? {
              sourceUrl: tool.compliance.hipaa_provenance.source_url,
              verifiedDate: tool.compliance.hipaa_provenance.verified_date,
              // Map verification status to confidence level
              confidence: mapVerificationStatusToConfidence(tool.compliance.hipaa_provenance.status),
            }
          : undefined,
      };
    },
  },
  {
    key: "baa_available",
    label: "BAA Available",
    shortLabel: "BAA",
    group: "compliance",
    order: 21,
    applicability: "universal",
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => {
      // CORRECT: compliance fields use UncertaintyBoolean strings, not booleans
      const baa = tool.compliance?.baa_available;
      const isYes = baa === "yes";
      const isNo = baa === "no";
      const isNotApplicable = baa === "not_applicable";
      return {
        raw: baa,
        display: isYes ? "Yes" : isNo ? "No" : isNotApplicable ? "N/A" : "Unknown",
        status: baa && baa !== "unknown" ? "known" : "unknown",
        provenance: tool.compliance?.baa_provenance
          ? {
              sourceUrl: tool.compliance.baa_provenance.source_url,
              verifiedDate: tool.compliance.baa_provenance.verified_date,
              // Map verification status to confidence level
              confidence: mapVerificationStatusToConfidence(tool.compliance.baa_provenance.status),
            }
          : undefined,
      };
    },
  },
  {
    key: "soc2",
    label: "SOC 2 Certified",
    shortLabel: "SOC 2",
    group: "compliance",
    order: 22,
    applicability: "universal",
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => {
      // CORRECT: compliance fields use UncertaintyBoolean strings
      const soc2 = tool.compliance?.soc2;
      const isYes = soc2 === "yes";
      const isNo = soc2 === "no";
      const isNotApplicable = soc2 === "not_applicable";
      return {
        raw: soc2,
        display: isYes ? "Yes" : isNo ? "No" : isNotApplicable ? "N/A" : "Unknown",
        status: soc2 && soc2 !== "unknown" ? "known" : "unknown",
      };
    },
  },
  {
    key: "hitrust",
    label: "HITRUST Certified",
    shortLabel: "HITRUST",
    group: "compliance",
    order: 23,
    applicability: "universal",
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => {
      // CORRECT: compliance fields use UncertaintyBoolean strings
      const hitrust = tool.compliance?.hitrust;
      const isYes = hitrust === "yes";
      const isNo = hitrust === "no";
      const isNotApplicable = hitrust === "not_applicable";
      return {
        raw: hitrust,
        display: isYes ? "Yes" : isNo ? "No" : isNotApplicable ? "N/A" : "Unknown",
        status: hitrust && hitrust !== "unknown" ? "known" : "unknown",
      };
    },
  },

  // =========================================================================
  // FEATURES GROUP
  // =========================================================================
  {
    key: "has_telehealth",
    label: "Telehealth Included",
    shortLabel: "Telehealth",
    group: "features",
    order: 30,
    applicability: ["ehr-practice-management"],
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => ({
      raw: tool.feature_flags?.has_telehealth,
      display: tool.feature_flags?.has_telehealth ? "Yes" : "No",
      status: tool.feature_flags?.has_telehealth !== undefined ? "known" : "unknown",
    }),
  },
  {
    key: "has_billing",
    label: "Billing/Claims",
    shortLabel: "Billing",
    group: "features",
    order: 31,
    applicability: ["ehr-practice-management"],
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => ({
      raw: tool.feature_flags?.has_rcm,
      display: tool.feature_flags?.has_rcm ? "Yes" : "No",
      status: tool.feature_flags?.has_rcm !== undefined ? "known" : "unknown",
    }),
  },
  {
    key: "has_e_prescribing",
    label: "e-Prescribing",
    shortLabel: "e-Rx",
    group: "features",
    order: 32,
    applicability: ["ehr-practice-management"],
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => ({
      raw: tool.feature_flags?.has_e_prescribing,
      display: tool.feature_flags?.has_e_prescribing ? "Yes" : "No",
      status: tool.feature_flags?.has_e_prescribing !== undefined ? "known" : "unknown",
    }),
  },
  {
    key: "has_patient_portal",
    label: "Patient Portal",
    shortLabel: "Portal",
    group: "features",
    order: 33,
    applicability: ["ehr-practice-management"],
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => ({
      raw: tool.feature_flags?.has_patient_portal,
      display: tool.feature_flags?.has_patient_portal ? "Yes" : "No",
      status: tool.feature_flags?.has_patient_portal !== undefined ? "known" : "unknown",
    }),
  },
  {
    key: "has_mobile_app",
    label: "Mobile App",
    shortLabel: "Mobile",
    group: "features",
    order: 34,
    applicability: "universal",
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => ({
      raw: tool.feature_flags?.has_mobile_app,
      display: tool.feature_flags?.has_mobile_app ? "Yes" : "No",
      status: tool.feature_flags?.has_mobile_app !== undefined ? "known" : "unknown",
    }),
  },
  {
    key: "mental_health_specific",
    label: "Mental Health Specific",
    shortLabel: "MH Specific",
    group: "features",
    order: 35,
    applicability: "universal",
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => ({
      raw: tool.feature_flags?.is_mental_health_specific,
      display: tool.feature_flags?.is_mental_health_specific ? "Yes" : "No",
      status: tool.feature_flags?.is_mental_health_specific !== undefined ? "known" : "unknown",
    }),
  },

  // =========================================================================
  // INTEGRATIONS GROUP
  // =========================================================================
  {
    key: "integration_count",
    label: "Total Integrations",
    shortLabel: "Integrations",
    group: "integrations",
    order: 40,
    applicability: "universal",
    dataType: "integration_count",
    comparisonSemantics: "directional",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => {
      const count = tool.integrations?.length || 0;
      return {
        raw: count,
        display: count > 0 ? `${count} integrations` : "Unknown",
        status: count > 0 ? "known" : "unknown",
      };
    },
  },
  {
    key: "calendar_integrations",
    label: "Calendar Sync",
    shortLabel: "Calendar",
    group: "integrations",
    order: 41,
    applicability: ["ehr-practice-management"],
    dataType: "list",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => {
      const calendars = tool.integrations?.filter((i) => i.category === "calendar") || [];
      const names = calendars.map((c) => c.name);
      return {
        raw: names,
        display: names.length > 0 ? names.join(", ") : "Unknown",
        status: names.length > 0 ? "known" : "unknown",
      };
    },
  },
  {
    key: "clearinghouse",
    label: "Clearinghouse",
    shortLabel: "Clearinghouse",
    group: "integrations",
    order: 42,
    applicability: ["ehr-practice-management", "billing-rcm"],
    dataType: "list",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => {
      const payers = tool.integrations?.filter((i) => i.category === "payer") || [];
      const names = payers.map((c) => c.name);
      return {
        raw: names,
        display: names.length > 0 ? names.join(", ") : "Unknown",
        status: names.length > 0 ? "known" : "unknown",
      };
    },
  },

  // =========================================================================
  // AI SCRIBE SPECIFIC
  // NOTE: These fields require extended schema fields (ai_capabilities, note_types,
  // ehr_integrations) that are not yet in the canonical ClinicianToolV4 schema.
  // All will return "Unknown" until the schema is extended.
  // =========================================================================
  {
    key: "ambient_listening",
    label: "Ambient Listening",
    shortLabel: "Ambient",
    group: "ai_scribe_specific",
    order: 50,
    applicability: ["ai-scribe-documentation"],
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: () => ({
      raw: null,
      display: "Unknown",
      status: "unknown" as const,
    }),
  },
  {
    key: "dictation",
    label: "Dictation Mode",
    shortLabel: "Dictation",
    group: "ai_scribe_specific",
    order: 51,
    applicability: ["ai-scribe-documentation"],
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: () => ({
      raw: null,
      display: "Unknown",
      status: "unknown" as const,
    }),
  },
  {
    key: "note_types_supported",
    label: "Note Types",
    shortLabel: "Notes",
    group: "ai_scribe_specific",
    order: 52,
    applicability: ["ai-scribe-documentation"],
    dataType: "list",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show 'Unknown'",
    extractValue: () => ({
      raw: null,
      display: "Unknown",
      status: "unknown" as const,
    }),
  },
  {
    key: "languages_supported",
    label: "Languages",
    shortLabel: "Languages",
    group: "ai_scribe_specific",
    order: 53,
    applicability: ["ai-scribe-documentation"],
    dataType: "text",
    comparisonSemantics: "directional",
    missingBehavior: "Show 'Unknown'",
    extractValue: () => ({
      raw: null,
      display: "Unknown",
      status: "unknown" as const,
    }),
  },
  {
    key: "ehr_integration_method",
    label: "EHR Integration",
    shortLabel: "EHR Integration",
    group: "ai_scribe_specific",
    order: 54,
    applicability: ["ai-scribe-documentation"],
    dataType: "text",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show 'Unknown'",
    extractValue: () => ({
      raw: null,
      display: "Unknown",
      status: "unknown" as const,
    }),
  },
  {
    key: "native_ehr_integrations",
    label: "Native EHR Integrations",
    shortLabel: "Native EHRs",
    group: "ai_scribe_specific",
    order: 55,
    applicability: ["ai-scribe-documentation"],
    dataType: "list",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show 'Unknown'",
    extractValue: () => ({
      raw: null,
      display: "Unknown",
      status: "unknown" as const,
    }),
  },
  {
    key: "coding_suggestions",
    label: "Coding Suggestions",
    shortLabel: "Coding",
    group: "ai_scribe_specific",
    order: 56,
    applicability: ["ai-scribe-documentation"],
    dataType: "list",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: () => ({
      raw: null,
      display: "Unknown",
      status: "unknown" as const,
    }),
  },

  // =========================================================================
  // EHR SPECIFIC
  // =========================================================================
  {
    key: "scheduling",
    label: "Scheduling",
    shortLabel: "Scheduling",
    group: "ehr_specific",
    order: 60,
    applicability: ["ehr-practice-management"],
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => {
      const hasScheduling = tool.capabilities?.includes("appointment-scheduling");
      return {
        raw: hasScheduling,
        display: hasScheduling ? "Yes" : "Unknown",
        status: hasScheduling ? "known" : "unknown",
      };
    },
  },
  {
    key: "clinical_notes",
    label: "Clinical Notes",
    shortLabel: "Notes",
    group: "ehr_specific",
    order: 61,
    applicability: ["ehr-practice-management"],
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => {
      const hasNotes = tool.capabilities?.includes("clinical-notes");
      return {
        raw: hasNotes,
        display: hasNotes ? "Yes" : "Unknown",
        status: hasNotes ? "known" : "unknown",
      };
    },
  },
  {
    key: "treatment_planning",
    label: "Treatment Planning",
    shortLabel: "Treatment Plans",
    group: "ehr_specific",
    order: 62,
    applicability: ["ehr-practice-management"],
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => {
      const hasTx = tool.capabilities?.includes("treatment-planning");
      return {
        raw: hasTx,
        display: hasTx ? "Yes" : "Unknown",
        status: hasTx ? "known" : "unknown",
      };
    },
  },

  // =========================================================================
  // BILLING SPECIFIC
  // =========================================================================
  {
    key: "claims_submission",
    label: "Claims Submission",
    shortLabel: "Claims",
    group: "billing_specific",
    order: 70,
    applicability: ["billing-rcm", "ehr-practice-management"],
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => {
      const hasClaims = tool.capabilities?.includes("claims-submission");
      return {
        raw: hasClaims,
        display: hasClaims ? "Yes" : "Unknown",
        status: hasClaims ? "known" : "unknown",
      };
    },
  },
  {
    key: "eligibility_verification",
    label: "Eligibility Verification",
    shortLabel: "Eligibility",
    group: "billing_specific",
    order: 71,
    applicability: ["billing-rcm", "ehr-practice-management"],
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => {
      const hasElig = tool.capabilities?.includes("eligibility-verification");
      return {
        raw: hasElig,
        display: hasElig ? "Yes" : "Unknown",
        status: hasElig ? "known" : "unknown",
      };
    },
  },
  {
    key: "era_processing",
    label: "ERA Processing",
    shortLabel: "ERA",
    group: "billing_specific",
    order: 72,
    applicability: ["billing-rcm"],
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Unknown'",
    // NOTE: "era-processing" capability doesn't exist in canonical CapabilitySlugZ
    extractValue: () => ({
      raw: null,
      display: "Unknown",
      status: "unknown" as const,
    }),
  },

  // =========================================================================
  // SUPPORT GROUP
  // =========================================================================
  {
    key: "practice_sizes",
    label: "Practice Sizes",
    shortLabel: "Sizes",
    group: "support",
    order: 80,
    applicability: "universal",
    dataType: "list",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show 'Unknown'",
    extractValue: (tool) => {
      const sizes = tool.audiences?.organization_sizes || [];
      return {
        raw: sizes,
        display: sizes.length > 0 ? sizes.map(formatOrgSize).join(", ") : "Unknown",
        status: sizes.length > 0 ? "known" : "unknown",
      };
    },
  },
  {
    key: "customer_count",
    label: "Customer Base",
    shortLabel: "Customers",
    group: "support",
    order: 81,
    applicability: "universal",
    dataType: "text",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show 'Unknown'",
    // NOTE: company_info doesn't exist in canonical ClinicianToolV4 schema
    extractValue: () => ({
      raw: null,
      display: "Unknown",
      status: "unknown" as const,
    }),
  },
];

// =============================================================================
// FORMATTING HELPERS
// =============================================================================

/**
 * Map VerificationStatus from canonical schema to confidence level for display
 */
function mapVerificationStatusToConfidence(
  status?: string
): "high" | "medium" | "low" | "unknown" {
  switch (status) {
    case "verified":
      return "high";
    case "vendor_provided":
      return "medium";
    case "public_source":
      return "medium";
    case "unverified":
      return "low";
    default:
      return "unknown";
  }
}

function formatCategory(category: string): string {
  const labels: Record<string, string> = {
    "ehr-practice-management": "EHR & Practice Management",
    "ai-scribe-documentation": "AI Scribe & Documentation",
    "billing-rcm": "Billing & RCM",
    "telehealth-communication": "Telehealth",
    "measurement-outcomes": "Measurement & Outcomes",
    "provider-networks": "Provider Networks",
  };
  return labels[category] || category;
}

function formatPricingModel(model?: string): string {
  if (!model) return "Not specified";
  const labels: Record<string, string> = {
    "per-provider-month": "Per provider/month",
    "per-user-month": "Per user/month",
    "flat-monthly": "Flat monthly",
    subscription: "Subscription",
    "percentage-of-collections": "% of collections",
    "per-claim": "Per claim",
    custom: "Custom",
  };
  return labels[model] || model;
}

function formatOrgSize(size: string): string {
  const labels: Record<string, string> = {
    solo: "Solo",
    "small-2-10": "Small (2-10)",
    "medium-11-50": "Medium (11-50)",
    "large-51-200": "Large (51-200)",
    enterprise: "Enterprise (200+)",
  };
  return labels[size] || size;
}

// =============================================================================
// COMPARISON ENGINE
// =============================================================================

/**
 * Extract the primary category from a tool
 */
function getToolCategory(tool: ClinicianTool): ToolCategory {
  const categoryMap: Record<string, ToolCategory> = {
    "ehr-practice-management": "ehr-practice-management",
    "ai-scribe-documentation": "ai-scribe-documentation",
    "billing-rcm-insurance": "billing-rcm",
    "billing-rcm": "billing-rcm",
    "telehealth-communication": "telehealth-communication",
    "measurement-outcomes": "measurement-outcomes",
    "measurement-dtx": "measurement-outcomes",
    "provider-networks": "provider-networks",
  };
  return categoryMap[tool.primary_category] || "general";
}

/**
 * Generates a comparison from tool records
 *
 * IMPORTANT: This function operates purely on data.
 * Sponsorship status CANNOT and DOES NOT affect comparison results.
 */
export function generateToolComparison(
  tools: ClinicianTool[],
  context: ToolComparisonContext
): ToolComparisonResult {
  if (tools.length < 2 || tools.length > 4) {
    throw new Error("Comparison requires 2-4 tools");
  }

  const categories = Array.from(new Set(tools.map(getToolCategory)));
  const isCrossCategory = categories.length > 1;

  // Build rows for applicable attributes
  const rows: ToolComparisonRow[] = [];

  for (const attr of TOOL_COMPARISON_ATTRIBUTES) {
    // Check if attribute applies to any selected tool's category
    const applicable =
      attr.applicability === "universal" ||
      categories.some((c) => (attr.applicability as ToolCategory[]).includes(c));

    if (!applicable) continue;

    // Skip category-specific attributes in cross-category comparisons at essential depth
    if (
      isCrossCategory &&
      context.depthLevel === "essential" &&
      ["ehr_specific", "ai_scribe_specific", "billing_specific"].includes(attr.group)
    ) {
      continue;
    }

    const values = new Map<string, ToolComparisonValue>();
    let hasDifferences = false;
    const displayValues: string[] = [];

    for (const tool of tools) {
      const value = attr.extractValue(tool, context);
      values.set(tool.slug, value);
      displayValues.push(value.display);
    }

    // Detect differences (ignore "Unknown" values when comparing)
    const knownValues = displayValues.filter(
      (v) => v !== "Unknown" && v !== "Not specified" && v !== "Contact for pricing"
    );
    const uniqueDisplays = new Set(knownValues);
    hasDifferences = uniqueDisplays.size > 1;

    rows.push({
      attribute: attr,
      values,
      hasDifferences,
      isUniversal: attr.applicability === "universal",
      applicableCategories:
        attr.applicability === "universal" ? categories : (attr.applicability as ToolCategory[]),
    });
  }

  // Group rows
  const groups = new Map<ToolComparisonGroup, ToolComparisonRow[]>();
  for (const row of rows) {
    const group = row.attribute.group;
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group)!.push(row);
  }

  // Sort rows within groups
  Array.from(groups.values()).forEach((groupRows) => {
    groupRows.sort((a, b) => a.attribute.order - b.attribute.order);
  });

  // Generate differentiators
  const differentiators = generateToolDifferentiators(tools, rows);

  // Build shareable URL
  const slugs = tools.map((t) => t.slug).join(",");
  const shareableUrl = `/tools/compare?tools=${slugs}`;

  return {
    tools,
    context,
    rows,
    groups,
    categories,
    isCrossCategory,
    differentiators,
    shareableUrl,
  };
}

/**
 * Generates tool-specific differentiators (not winners)
 */
function generateToolDifferentiators(
  tools: ClinicianTool[],
  rows: ToolComparisonRow[]
): ToolDifferentiator[] {
  const differentiators: ToolDifferentiator[] = [];
  const differenceRows = rows.filter((r) => r.hasDifferences);

  for (const tool of tools) {
    const slug = tool.slug;
    const name = tool.name;

    // Check for free tier
    if (tool.pricing?.free_tier) {
      differentiators.push({
        toolSlug: slug,
        toolName: name,
        statement: "Offers a free tier",
        attributeKey: "free_trial",
        isPositive: true,
      });
    }

    // Check for mental health specific
    if (tool.feature_flags?.is_mental_health_specific) {
      differentiators.push({
        toolSlug: slug,
        toolName: name,
        statement: "Purpose-built for mental health",
        attributeKey: "mental_health_specific",
        isPositive: true,
      });
    }

    // Check for AI capabilities
    if (tool.feature_flags?.has_ai) {
      differentiators.push({
        toolSlug: slug,
        toolName: name,
        statement: "Includes AI-powered features",
        attributeKey: "has_ai",
        isPositive: true,
      });
    }

    // Check for e-prescribing
    if (tool.feature_flags?.has_e_prescribing) {
      const others = tools.filter((t) => t.slug !== slug);
      const othersHave = others.some((t) => t.feature_flags?.has_e_prescribing);
      if (!othersHave) {
        differentiators.push({
          toolSlug: slug,
          toolName: name,
          statement: "Includes e-prescribing",
          attributeKey: "has_e_prescribing",
          isPositive: true,
        });
      }
    }

    // Check for integration count
    const integrationCount = tool.integrations?.length || 0;
    const otherCounts = tools
      .filter((t) => t.slug !== slug)
      .map((t) => t.integrations?.length || 0);
    if (integrationCount > 0 && integrationCount > Math.max(...otherCounts)) {
      differentiators.push({
        toolSlug: slug,
        toolName: name,
        statement: `More integrations (${integrationCount})`,
        attributeKey: "integration_count",
        isPositive: true,
      });
    }
  }

  // Limit to 2 differentiators per tool
  const byTool = new Map<string, ToolDifferentiator[]>();
  for (const d of differentiators) {
    if (!byTool.has(d.toolSlug)) {
      byTool.set(d.toolSlug, []);
    }
    byTool.get(d.toolSlug)!.push(d);
  }

  const limited: ToolDifferentiator[] = [];
  Array.from(byTool.values()).forEach((diffs) => {
    limited.push(...diffs.slice(0, 2));
  });

  return limited;
}

/**
 * Filters rows to show only differences
 */
export function filterToolDifferencesOnly(rows: ToolComparisonRow[]): ToolComparisonRow[] {
  return rows.filter((r) => r.hasDifferences);
}

/**
 * Filters rows to show only similarities
 */
export function filterToolSimilaritiesOnly(rows: ToolComparisonRow[]): ToolComparisonRow[] {
  return rows.filter((r) => !r.hasDifferences);
}

/**
 * Gets all group labels in display order
 */
export function getToolGroupOrder(): { key: ToolComparisonGroup; label: string }[] {
  return [
    { key: "overview", label: "At a Glance" },
    { key: "pricing", label: "Pricing" },
    { key: "compliance", label: "Compliance & Security" },
    { key: "features", label: "Features" },
    { key: "integrations", label: "Integrations" },
    { key: "ehr_specific", label: "EHR Features" },
    { key: "ai_scribe_specific", label: "AI Scribe Features" },
    { key: "billing_specific", label: "Billing Features" },
    { key: "support", label: "Support & Fit" },
  ];
}

// =============================================================================
// SERIALIZABLE TYPES FOR CLIENT COMPONENTS
// =============================================================================

/**
 * Serializable version of ToolComparisonAttributeDefinition (no functions)
 */
export interface SerializableToolAttributeDefinition {
  key: string;
  label: string;
  shortLabel?: string;
  description?: string;
  group: ToolComparisonGroup;
  order: number;
  applicability: ToolCategory[] | "universal";
  dataType: ComparisonDataType;
  comparisonSemantics: ComparisonSemantics;
  missingBehavior: string;
}

/**
 * Serializable comparison row (no functions)
 */
export interface SerializableToolComparisonRow {
  attribute: SerializableToolAttributeDefinition;
  values: Record<string, ToolComparisonValue>;
  hasDifferences: boolean;
  isUniversal: boolean;
  applicableCategories: ToolCategory[];
}

/**
 * Serializable comparison result for client components
 */
export interface SerializableToolComparisonResult {
  tools: ClinicianTool[];
  context: ToolComparisonContext;
  rows: SerializableToolComparisonRow[];
  groups: Record<ToolComparisonGroup, SerializableToolComparisonRow[]>;
  categories: ToolCategory[];
  isCrossCategory: boolean;
  differentiators: ToolDifferentiator[];
  shareableUrl: string;
}

/**
 * Converts a ToolComparisonResult to a serializable version for client components
 */
export function serializeToolComparisonResult(
  result: ToolComparisonResult
): SerializableToolComparisonResult {
  const serializeRow = (row: ToolComparisonRow): SerializableToolComparisonRow => ({
    attribute: {
      key: row.attribute.key,
      label: row.attribute.label,
      shortLabel: row.attribute.shortLabel,
      description: row.attribute.description,
      group: row.attribute.group,
      order: row.attribute.order,
      applicability: row.attribute.applicability,
      dataType: row.attribute.dataType,
      comparisonSemantics: row.attribute.comparisonSemantics,
      missingBehavior: row.attribute.missingBehavior,
    },
    values: Object.fromEntries(row.values.entries()),
    hasDifferences: row.hasDifferences,
    isUniversal: row.isUniversal,
    applicableCategories: row.applicableCategories,
  });

  const rows = result.rows.map(serializeRow);

  const groups: Record<ToolComparisonGroup, SerializableToolComparisonRow[]> = {} as Record<
    ToolComparisonGroup,
    SerializableToolComparisonRow[]
  >;
  Array.from(result.groups.entries()).forEach(([key, groupRows]) => {
    groups[key] = groupRows.map(serializeRow);
  });

  return {
    tools: result.tools,
    context: result.context,
    rows,
    groups,
    categories: result.categories,
    isCrossCategory: result.isCrossCategory,
    differentiators: result.differentiators,
    shareableUrl: result.shareableUrl,
  };
}
