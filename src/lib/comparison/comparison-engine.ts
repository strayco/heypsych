/**
 * Universal Treatment Comparison Engine
 *
 * Generates dynamic comparisons from canonical treatment records without
 * requiring pair-specific comparison JSON files.
 *
 * Design principles:
 * - No universal winner scoring
 * - Clinically responsible comparison semantics
 * - Explicit handling of missing/unknown data
 * - Condition-aware context where available
 * - Support for 2-4 treatments
 * - Same-modality and cross-modality comparisons
 */

import type {
  TreatmentV3,
  TreatmentModality,
  ClinicalProfile,
  EvidenceLevel,
  ClinicalDataStatus,
} from "../schemas/treatment-v3";

// =============================================================================
// COMPARISON TYPES
// =============================================================================

/**
 * How a comparison attribute should be compared
 */
export type ComparisonSemantics =
  | "categorical" // Distinct categories (e.g., modality types)
  | "presence" // Has/doesn't have (e.g., FDA approval)
  | "range_overlap" // Overlapping ranges (e.g., onset time)
  | "directional" // Better/worse but context-dependent
  | "descriptive" // Text comparison, no ranking
  | "condition_dependent" // Varies by condition
  | "not_directly_comparable"; // Show but don't compare

/**
 * Data type for comparison rendering
 */
export type ComparisonDataType =
  | "text"
  | "boolean"
  | "enum"
  | "tags"
  | "measurement"
  | "range"
  | "schedule"
  | "evidence"
  | "risk"
  | "rich_clinical"
  | "list";

/**
 * Definition of a comparison attribute
 */
export interface ComparisonAttributeDefinition {
  key: string;
  label: string;
  shortLabel?: string;
  description?: string;
  group: ComparisonGroup;
  order: number;
  applicability: TreatmentModality[] | "universal";
  dataType: ComparisonDataType;
  comparisonSemantics: ComparisonSemantics;
  missingBehavior: string;
  renderer: string;
  clinicalCaution?: string;
  extractValue: (treatment: TreatmentV3, context?: ComparisonContext) => ComparisonValue;
}

/**
 * Comparison attribute groups
 */
export type ComparisonGroup =
  | "overview"
  | "indications"
  | "evidence"
  | "experience"
  | "delivery"
  | "safety"
  | "access"
  | "medication_specific"
  | "therapy_specific"
  | "interventional_specific";

/**
 * Context for comparison (e.g., specific condition)
 */
export interface ComparisonContext {
  conditionSlug?: string;
  conditionName?: string;
  populationContext?: string;
  depthLevel: "essential" | "detailed" | "clinical";
}

/**
 * A comparison value with metadata
 */
export interface ComparisonValue {
  raw: unknown;
  display: string;
  status: ClinicalDataStatus;
  isHighlight?: boolean; // Notable difference
  notes?: string;
  citations?: string[];
}

/**
 * A row in the comparison
 */
export interface ComparisonRow {
  attribute: ComparisonAttributeDefinition;
  values: Map<string, ComparisonValue>; // slug -> value
  hasDifferences: boolean;
  isUniversal: boolean;
  applicableModalities: TreatmentModality[];
}

/**
 * Complete comparison result
 */
export interface ComparisonResult {
  treatments: TreatmentV3[];
  context: ComparisonContext;
  rows: ComparisonRow[];
  groups: Map<ComparisonGroup, ComparisonRow[]>;
  modalities: TreatmentModality[];
  isCrossModality: boolean;
  differentiators: TreatmentDifferentiator[];
  shareableUrl: string;
}

/**
 * Treatment-specific differentiator (not a winner)
 */
export interface TreatmentDifferentiator {
  treatmentSlug: string;
  treatmentName: string;
  statement: string;
  attributeKey: string;
  isPositive?: boolean; // Contextually positive, not "better"
}

// =============================================================================
// COMPARISON ATTRIBUTE REGISTRY
// =============================================================================

/**
 * Central registry of all comparison attributes
 */
export const COMPARISON_ATTRIBUTES: ComparisonAttributeDefinition[] = [
  // =========================================================================
  // OVERVIEW GROUP
  // =========================================================================
  {
    key: "treatment_type",
    label: "Treatment Type",
    shortLabel: "Type",
    group: "overview",
    order: 1,
    applicability: "universal",
    dataType: "enum",
    comparisonSemantics: "categorical",
    missingBehavior: "Show 'Unknown type'",
    renderer: "ModalityBadge",
    extractValue: (t) => ({
      raw: t.taxonomy.modality,
      display: formatModality(t.taxonomy.modality),
      status: "known",
    }),
  },
  {
    key: "name",
    label: "Treatment Name",
    shortLabel: "Name",
    group: "overview",
    order: 2,
    applicability: "universal",
    dataType: "text",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show slug",
    renderer: "TreatmentName",
    extractValue: (t) => ({
      raw: t.identity.name,
      display: t.identity.name,
      status: "known",
    }),
  },
  {
    key: "summary",
    label: "What It Is",
    shortLabel: "Summary",
    group: "overview",
    order: 3,
    applicability: "universal",
    dataType: "text",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show description excerpt",
    renderer: "Summary",
    extractValue: (t) => ({
      raw: t.summary,
      display: t.summary,
      status: "known",
    }),
  },
  {
    key: "drug_class",
    label: "Drug Class",
    shortLabel: "Class",
    group: "overview",
    order: 4,
    applicability: ["medication"],
    dataType: "tags",
    comparisonSemantics: "categorical",
    missingBehavior: "Show 'Not classified'",
    renderer: "TagList",
    extractValue: (t) => {
      const classes = t.taxonomy.drug_classes || [];
      return {
        raw: classes,
        display: classes.join(", ") || "Not classified",
        status: classes.length > 0 ? "known" : "unknown",
      };
    },
  },

  // =========================================================================
  // INDICATIONS GROUP
  // =========================================================================
  {
    key: "primary_indications",
    label: "Primary Uses",
    shortLabel: "Uses",
    group: "indications",
    order: 10,
    applicability: "universal",
    dataType: "list",
    comparisonSemantics: "condition_dependent",
    missingBehavior: "Show 'Uses not documented'",
    renderer: "IndicationList",
    extractValue: (t, ctx) => {
      const indications = t.clinical_profile?.indications?.primary || [];
      const display = indications.map((i) => i.condition_name || i.condition_slug).join(", ");
      return {
        raw: indications,
        display: display || "Not documented",
        status: indications.length > 0 ? "known" : "unknown",
      };
    },
  },
  {
    key: "fda_approved_for",
    label: "FDA-Approved For",
    shortLabel: "FDA Approved",
    group: "indications",
    order: 11,
    applicability: ["medication", "interventional"],
    dataType: "list",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Approval status not documented'",
    renderer: "ApprovalList",
    extractValue: (t) => {
      const approved =
        t.clinical_profile?.indications?.primary?.filter((i) => i.fda_approved === true) || [];
      const display = approved.map((i) => i.condition_name || i.condition_slug).join(", ");
      return {
        raw: approved,
        display: display || "Not documented",
        status: approved.length > 0 ? "known" : "unknown",
      };
    },
  },
  {
    key: "off_label_uses",
    label: "Off-Label Uses",
    shortLabel: "Off-Label",
    group: "indications",
    order: 12,
    applicability: ["medication"],
    dataType: "list",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show 'Off-label uses not documented'",
    renderer: "IndicationList",
    extractValue: (t) => {
      const offLabel = t.clinical_profile?.indications?.off_label || [];
      const display = offLabel.map((i) => i.condition_name || i.condition_slug).join(", ");
      return {
        raw: offLabel,
        display: display || "Not documented",
        status: offLabel.length > 0 ? "known" : "unknown",
      };
    },
  },

  // =========================================================================
  // EVIDENCE GROUP
  // =========================================================================
  {
    key: "evidence_level",
    label: "Evidence Strength",
    shortLabel: "Evidence",
    group: "evidence",
    order: 20,
    applicability: "universal",
    dataType: "evidence",
    comparisonSemantics: "condition_dependent",
    missingBehavior: "Show 'Evidence not rated'",
    renderer: "EvidenceLevel",
    clinicalCaution:
      "Evidence levels may vary by indication. Higher evidence does not mean better for your situation.",
    extractValue: (t) => {
      const level = t.clinical_profile?.evidence?.overall_level;
      return {
        raw: level,
        display: level ? formatEvidenceLevel(level) : "Not rated",
        status: level ? "known" : "not_reviewed",
      };
    },
  },
  {
    key: "research_support",
    label: "Research Support",
    shortLabel: "Research",
    group: "evidence",
    order: 21,
    applicability: "universal",
    dataType: "text",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show 'Research support not summarized'",
    renderer: "Text",
    extractValue: (t) => {
      const support = t.clinical_profile?.evidence?.research_support;
      return {
        raw: support,
        display: support || "Not summarized",
        status: support ? "known" : "not_reviewed",
      };
    },
  },

  // =========================================================================
  // EXPERIENCE GROUP
  // =========================================================================
  {
    key: "onset_time",
    label: "Time to Effect",
    shortLabel: "Onset",
    group: "experience",
    order: 30,
    applicability: "universal",
    dataType: "range",
    comparisonSemantics: "range_overlap",
    missingBehavior: "Show 'Onset not documented'",
    renderer: "Duration",
    clinicalCaution: "Faster onset is not always better. Some treatments require time to work safely.",
    extractValue: (t) => {
      const onset = t.clinical_profile?.experience?.onset;
      if (!onset) {
        return { raw: null, display: "Not documented", status: "unknown" };
      }
      const therapeutic = onset.therapeutic_response;
      if (therapeutic?.display) {
        return { raw: therapeutic, display: therapeutic.display, status: "known" };
      }
      return { raw: onset, display: "See details", status: "known" };
    },
  },
  {
    key: "treatment_course",
    label: "Typical Treatment Course",
    shortLabel: "Course",
    group: "experience",
    order: 31,
    applicability: "universal",
    dataType: "text",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show 'Course not documented'",
    renderer: "Text",
    extractValue: (t) => {
      const course = t.clinical_profile?.experience?.treatment_course;
      const duration = t.clinical_profile?.experience?.duration;
      const display = course || duration?.typical_course?.display || "Not documented";
      return {
        raw: { course, duration },
        display,
        status: course || duration ? "known" : "unknown",
      };
    },
  },

  // =========================================================================
  // DELIVERY GROUP
  // =========================================================================
  {
    key: "setting",
    label: "Treatment Setting",
    shortLabel: "Setting",
    group: "delivery",
    order: 40,
    applicability: "universal",
    dataType: "tags",
    comparisonSemantics: "categorical",
    missingBehavior: "Show 'Setting not specified'",
    renderer: "TagList",
    extractValue: (t) => {
      const settings = t.clinical_profile?.delivery?.setting || [];
      return {
        raw: settings,
        display: settings.map(formatSetting).join(", ") || "Not specified",
        status: settings.length > 0 ? "known" : "unknown",
      };
    },
  },
  {
    key: "professional_required",
    label: "Professional Involvement",
    shortLabel: "Professional",
    group: "delivery",
    order: 41,
    applicability: "universal",
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Not specified'",
    renderer: "Professional",
    extractValue: (t) => {
      const prof = t.clinical_profile?.delivery?.professional_required;
      if (!prof) {
        return { raw: null, display: "Not specified", status: "unknown" };
      }
      const display = prof.required
        ? `Required (${prof.credential_types?.join(", ") || "healthcare professional"})`
        : "Not required";
      return { raw: prof, display, status: "known" };
    },
  },
  {
    key: "session_duration",
    label: "Session Duration",
    shortLabel: "Duration",
    group: "delivery",
    order: 42,
    applicability: ["therapy", "interventional", "alternative"],
    dataType: "range",
    comparisonSemantics: "range_overlap",
    missingBehavior: "Show 'Duration not specified'",
    renderer: "Duration",
    extractValue: (t) => {
      const duration = t.clinical_profile?.delivery?.session_duration;
      return {
        raw: duration,
        display: duration?.display || "Not specified",
        status: duration ? "known" : "unknown",
      };
    },
  },
  {
    key: "frequency",
    label: "Treatment Frequency",
    shortLabel: "Frequency",
    group: "delivery",
    order: 43,
    applicability: "universal",
    dataType: "text",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show 'Frequency not specified'",
    renderer: "Text",
    extractValue: (t) => {
      const frequency = t.clinical_profile?.delivery?.frequency;
      return {
        raw: frequency,
        display: frequency || "Not specified",
        status: frequency ? "known" : "unknown",
      };
    },
  },
  {
    key: "invasiveness",
    label: "Invasiveness",
    shortLabel: "Invasive",
    group: "delivery",
    order: 44,
    applicability: "universal",
    dataType: "enum",
    comparisonSemantics: "directional",
    missingBehavior: "Show 'Not specified'",
    renderer: "InvasivenessLevel",
    clinicalCaution: "Less invasive is not always better. Some conditions require more intensive treatment.",
    extractValue: (t) => {
      const level = t.clinical_profile?.delivery?.invasiveness;
      return {
        raw: level,
        display: level ? formatInvasiveness(level) : "Not specified",
        status: level ? "known" : "unknown",
      };
    },
  },

  // =========================================================================
  // SAFETY GROUP
  // =========================================================================
  {
    key: "common_side_effects",
    label: "Common Side Effects",
    shortLabel: "Common Effects",
    group: "safety",
    order: 50,
    applicability: "universal",
    dataType: "list",
    comparisonSemantics: "not_directly_comparable",
    missingBehavior: "Show 'Side effects not documented'",
    renderer: "SideEffectList",
    clinicalCaution:
      "Fewer listed side effects does not mean safer. Documentation completeness varies.",
    extractValue: (t) => {
      const effects = t.clinical_profile?.safety?.common_adverse_effects || [];
      const display = effects.map((e) => e.effect).join(", ");
      return {
        raw: effects,
        display: display || "Not documented",
        status: effects.length > 0 ? "known" : "unknown",
      };
    },
  },
  {
    key: "serious_risks",
    label: "Serious Risks",
    shortLabel: "Risks",
    group: "safety",
    order: 51,
    applicability: "universal",
    dataType: "list",
    comparisonSemantics: "not_directly_comparable",
    missingBehavior: "Show 'Serious risks not documented'",
    renderer: "RiskList",
    clinicalCaution:
      "All treatments have risks. Documented risks reflect thorough review, not higher danger.",
    extractValue: (t) => {
      const risks = t.clinical_profile?.safety?.serious_risks || [];
      const display = risks.map((r) => r.risk).join(", ");
      return {
        raw: risks,
        display: display || "Not documented",
        status: risks.length > 0 ? "known" : "unknown",
      };
    },
  },
  {
    key: "black_box_warning",
    label: "Black Box Warning",
    shortLabel: "Black Box",
    group: "safety",
    order: 52,
    applicability: ["medication"],
    dataType: "text",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'No black box warning'",
    renderer: "BlackBoxWarning",
    extractValue: (t) => {
      const warning = t.clinical_profile?.safety?.black_box_warning;
      // Handle both string and array formats
      const displayWarning = Array.isArray(warning) ? warning.join("; ") : warning;
      return {
        raw: warning,
        display: displayWarning || "None",
        status: warning ? "known" : "known",
        isHighlight: !!warning,
      };
    },
  },
  {
    key: "contraindications",
    label: "Contraindications",
    shortLabel: "Contraindications",
    group: "safety",
    order: 53,
    applicability: "universal",
    dataType: "list",
    comparisonSemantics: "not_directly_comparable",
    missingBehavior: "Show 'Contraindications not documented'",
    renderer: "ContraindicationList",
    extractValue: (t) => {
      const contras = t.clinical_profile?.safety?.contraindications || [];
      const display = contras.map((c) => c.contraindication).join("; ");
      return {
        raw: contras,
        display: display || "Not documented",
        status: contras.length > 0 ? "known" : "unknown",
      };
    },
  },
  {
    key: "monitoring_requirements",
    label: "Monitoring Required",
    shortLabel: "Monitoring",
    group: "safety",
    order: 54,
    applicability: "universal",
    dataType: "list",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show 'Monitoring requirements not documented'",
    renderer: "MonitoringList",
    extractValue: (t) => {
      const monitoring = t.clinical_profile?.safety?.monitoring_requirements || [];
      const display = monitoring.map((m) => m.parameter).join(", ");
      return {
        raw: monitoring,
        display: display || "Not documented",
        status: monitoring.length > 0 ? "known" : "unknown",
      };
    },
  },

  // =========================================================================
  // ACCESS GROUP
  // =========================================================================
  {
    key: "regulatory_status",
    label: "Regulatory Status",
    shortLabel: "Status",
    group: "access",
    order: 60,
    applicability: "universal",
    dataType: "enum",
    comparisonSemantics: "categorical",
    missingBehavior: "Show 'Status not documented'",
    renderer: "RegulatoryStatus",
    extractValue: (t) => {
      const status = t.clinical_profile?.access?.regulatory_status;
      return {
        raw: status,
        display: status ? formatRegulatoryStatus(status) : "Not documented",
        status: status ? "known" : "unknown",
      };
    },
  },
  {
    key: "prescription_required",
    label: "Prescription Required",
    shortLabel: "Rx Required",
    group: "access",
    order: 61,
    applicability: ["medication", "supplement"],
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Not specified'",
    renderer: "Boolean",
    extractValue: (t) => {
      const required = t.clinical_profile?.access?.prescription_required;
      return {
        raw: required,
        display: required === true ? "Yes" : required === false ? "No" : "Not specified",
        status: required !== undefined ? "known" : "unknown",
      };
    },
  },
  {
    key: "controlled_substance",
    label: "Controlled Substance",
    shortLabel: "Controlled",
    group: "access",
    order: 62,
    applicability: ["medication"],
    dataType: "text",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Not specified'",
    renderer: "ControlledStatus",
    extractValue: (t) => {
      const controlled = t.clinical_profile?.access?.controlled_substance;
      if (!controlled) {
        return { raw: null, display: "Not specified", status: "unknown" };
      }
      const display = controlled.is_controlled
        ? `Yes (${controlled.schedule || "schedule not specified"})`
        : "No";
      return { raw: controlled, display, status: "known" };
    },
  },
  {
    key: "generic_available",
    label: "Generic Available",
    shortLabel: "Generic",
    group: "access",
    order: 63,
    applicability: ["medication"],
    dataType: "boolean",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Not specified'",
    renderer: "Boolean",
    extractValue: (t) => {
      const generic = t.clinical_profile?.access?.generic_available;
      return {
        raw: generic,
        display: generic === true ? "Yes" : generic === false ? "No" : "Not specified",
        status: generic !== undefined ? "known" : "unknown",
      };
    },
  },
  {
    key: "cost_category",
    label: "Cost Range",
    shortLabel: "Cost",
    group: "access",
    order: 64,
    applicability: "universal",
    dataType: "enum",
    comparisonSemantics: "directional",
    missingBehavior: "Show 'Cost not documented'",
    renderer: "CostCategory",
    clinicalCaution: "Cost varies significantly by insurance, location, and specific product.",
    extractValue: (t) => {
      const cost = t.clinical_profile?.access?.cost_category;
      const notes = t.clinical_profile?.access?.cost_notes;
      return {
        raw: { cost, notes },
        display: cost ? formatCostCategory(cost) : "Not documented",
        status: cost ? "known" : "unknown",
        notes,
      };
    },
  },

  // =========================================================================
  // MEDICATION-SPECIFIC
  // =========================================================================
  {
    key: "half_life",
    label: "Half-Life",
    shortLabel: "Half-Life",
    group: "medication_specific",
    order: 70,
    applicability: ["medication"],
    dataType: "text",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show 'Half-life not documented'",
    renderer: "Text",
    extractValue: (t) => {
      const pk =
        t.clinical_profile?.modality_details?.modality === "medication"
          ? t.clinical_profile.modality_details.details?.pharmacokinetics
          : null;
      const halfLife = pk?.half_life;
      return {
        raw: halfLife,
        display: halfLife || "Not documented",
        status: halfLife ? "known" : "unknown",
      };
    },
  },
  {
    key: "dosing",
    label: "Typical Dosing",
    shortLabel: "Dosing",
    group: "medication_specific",
    order: 71,
    applicability: ["medication"],
    dataType: "text",
    comparisonSemantics: "not_directly_comparable",
    missingBehavior: "Show 'Dosing not documented'",
    renderer: "Dosing",
    clinicalCaution: "Doses are not directly comparable between medications. Never adjust dosing without medical guidance.",
    extractValue: (t) => {
      const dosing =
        t.clinical_profile?.modality_details?.modality === "medication"
          ? t.clinical_profile.modality_details.details?.dosing
          : null;
      const display = dosing?.typical_dose || "Not documented";
      return {
        raw: dosing,
        display,
        status: dosing ? "known" : "unknown",
      };
    },
  },
  {
    key: "discontinuation",
    label: "Discontinuation",
    shortLabel: "Stopping",
    group: "medication_specific",
    order: 72,
    applicability: ["medication"],
    dataType: "text",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show 'Discontinuation guidance not documented'",
    renderer: "Text",
    extractValue: (t) => {
      const disc =
        t.clinical_profile?.modality_details?.modality === "medication"
          ? t.clinical_profile.modality_details.details?.discontinuation
          : null;
      if (!disc) {
        return { raw: null, display: "Not documented", status: "unknown" };
      }
      const display = disc.taper_required ? "Taper required" : "Can be stopped without taper";
      return { raw: disc, display, status: "known" };
    },
  },

  // =========================================================================
  // THERAPY-SPECIFIC
  // =========================================================================
  {
    key: "therapy_type",
    label: "Therapy Approach",
    shortLabel: "Approach",
    group: "therapy_specific",
    order: 80,
    applicability: ["therapy"],
    dataType: "text",
    comparisonSemantics: "categorical",
    missingBehavior: "Show 'Approach not specified'",
    renderer: "Text",
    extractValue: (t) => {
      const details =
        t.clinical_profile?.modality_details?.modality === "therapy"
          ? t.clinical_profile.modality_details.details
          : null;
      return {
        raw: details?.therapy_type,
        display: details?.therapy_type || "Not specified",
        status: details?.therapy_type ? "known" : "unknown",
      };
    },
  },
  {
    key: "key_techniques",
    label: "Key Techniques",
    shortLabel: "Techniques",
    group: "therapy_specific",
    order: 81,
    applicability: ["therapy"],
    dataType: "list",
    comparisonSemantics: "descriptive",
    missingBehavior: "Show 'Techniques not documented'",
    renderer: "TagList",
    extractValue: (t) => {
      const details =
        t.clinical_profile?.modality_details?.modality === "therapy"
          ? t.clinical_profile.modality_details.details
          : null;
      const techniques = details?.key_techniques || [];
      return {
        raw: techniques,
        display: techniques.join(", ") || "Not documented",
        status: techniques.length > 0 ? "known" : "unknown",
      };
    },
  },
  {
    key: "homework_required",
    label: "Between-Session Work",
    shortLabel: "Homework",
    group: "therapy_specific",
    order: 82,
    applicability: ["therapy"],
    dataType: "text",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Not specified'",
    renderer: "Text",
    extractValue: (t) => {
      const home = t.clinical_profile?.delivery?.home_practice;
      if (!home) {
        return { raw: null, display: "Not specified", status: "unknown" };
      }
      return {
        raw: home,
        display: home.required ? `Yes: ${home.description || ""}`.trim() : "Minimal or none",
        status: "known",
      };
    },
  },

  // =========================================================================
  // INTERVENTIONAL-SPECIFIC
  // =========================================================================
  {
    key: "procedure_type",
    label: "Procedure Type",
    shortLabel: "Procedure",
    group: "interventional_specific",
    order: 90,
    applicability: ["interventional", "investigational"],
    dataType: "text",
    comparisonSemantics: "categorical",
    missingBehavior: "Show 'Procedure type not specified'",
    renderer: "Text",
    extractValue: (t) => {
      const details =
        t.clinical_profile?.modality_details?.modality === "interventional" ||
        t.clinical_profile?.modality_details?.modality === "investigational"
          ? t.clinical_profile.modality_details.details
          : null;
      return {
        raw: details?.procedure_type,
        display: details?.procedure_type || "Not specified",
        status: details?.procedure_type ? "known" : "unknown",
      };
    },
  },
  {
    key: "anesthesia_required",
    label: "Anesthesia",
    shortLabel: "Anesthesia",
    group: "interventional_specific",
    order: 91,
    applicability: ["interventional", "investigational"],
    dataType: "text",
    comparisonSemantics: "presence",
    missingBehavior: "Show 'Not specified'",
    renderer: "Text",
    extractValue: (t) => {
      const details =
        t.clinical_profile?.modality_details?.modality === "interventional" ||
        t.clinical_profile?.modality_details?.modality === "investigational"
          ? t.clinical_profile.modality_details.details
          : null;
      if (details?.anesthesia_required === undefined) {
        return { raw: null, display: "Not specified", status: "unknown" };
      }
      const display = details.anesthesia_required
        ? `Yes (${details.anesthesia_type || "type not specified"})`
        : "No";
      return { raw: details, display, status: "known" };
    },
  },
  {
    key: "recovery_time",
    label: "Recovery Time",
    shortLabel: "Recovery",
    group: "interventional_specific",
    order: 92,
    applicability: ["interventional", "investigational"],
    dataType: "range",
    comparisonSemantics: "range_overlap",
    missingBehavior: "Show 'Not specified'",
    renderer: "Duration",
    extractValue: (t) => {
      const details =
        t.clinical_profile?.modality_details?.modality === "interventional" ||
        t.clinical_profile?.modality_details?.modality === "investigational"
          ? t.clinical_profile.modality_details.details
          : null;
      const recovery = details?.recovery_time;
      return {
        raw: recovery,
        display: recovery?.display || "Not specified",
        status: recovery ? "known" : "unknown",
      };
    },
  },
];

// =============================================================================
// FORMATTING HELPERS
// =============================================================================

function formatModality(modality: TreatmentModality): string {
  const labels: Record<TreatmentModality, string> = {
    medication: "Medication",
    therapy: "Therapy",
    interventional: "Interventional",
    investigational: "Investigational",
    supplement: "Supplement",
    alternative: "Alternative",
  };
  return labels[modality] || modality;
}

function formatEvidenceLevel(level: EvidenceLevel): string {
  const labels: Record<EvidenceLevel, string> = {
    very_strong: "Very Strong",
    strong: "Strong",
    moderate: "Moderate",
    limited: "Limited",
    emerging: "Emerging",
    anecdotal: "Anecdotal",
    insufficient: "Insufficient",
  };
  return labels[level] || level;
}

function formatSetting(setting: string): string {
  const labels: Record<string, string> = {
    home: "Home",
    outpatient_clinic: "Outpatient Clinic",
    hospital_inpatient: "Hospital (Inpatient)",
    emergency: "Emergency",
    residential: "Residential",
    telehealth: "Telehealth",
    specialty_center: "Specialty Center",
    community: "Community",
  };
  return labels[setting] || setting;
}

function formatInvasiveness(level: string): string {
  const labels: Record<string, string> = {
    non_invasive: "Non-invasive",
    minimally_invasive: "Minimally invasive",
    invasive: "Invasive",
    surgical: "Surgical",
  };
  return labels[level] || level;
}

function formatRegulatoryStatus(status: string): string {
  const labels: Record<string, string> = {
    fda_approved: "FDA Approved",
    fda_cleared: "FDA Cleared",
    off_label: "Off-Label Use",
    investigational: "Investigational",
    unregulated: "Not FDA Regulated",
    schedule_controlled: "Controlled Substance",
    discontinued: "Discontinued",
  };
  return labels[status] || status;
}

function formatCostCategory(cost: string): string {
  const labels: Record<string, string> = {
    low: "Low ($)",
    moderate: "Moderate ($$)",
    high: "High ($$$)",
    very_high: "Very High ($$$$)",
    variable: "Highly Variable",
  };
  return labels[cost] || cost;
}

// =============================================================================
// COMPARISON ENGINE
// =============================================================================

/**
 * Generates a comparison from treatment records
 */
export function generateComparison(
  treatments: TreatmentV3[],
  context: ComparisonContext
): ComparisonResult {
  if (treatments.length < 2 || treatments.length > 4) {
    throw new Error("Comparison requires 2-4 treatments");
  }

  const modalities = [...new Set(treatments.map((t) => t.taxonomy.modality))];
  const isCrossModality = modalities.length > 1;

  // Build rows for applicable attributes
  const rows: ComparisonRow[] = [];

  for (const attr of COMPARISON_ATTRIBUTES) {
    // Check if attribute applies to any selected treatment
    const applicable =
      attr.applicability === "universal" ||
      modalities.some((m) => attr.applicability.includes(m));

    if (!applicable) continue;

    // Skip modality-specific attributes in cross-modality comparisons at essential depth
    if (
      isCrossModality &&
      context.depthLevel === "essential" &&
      ["medication_specific", "therapy_specific", "interventional_specific"].includes(attr.group)
    ) {
      continue;
    }

    const values = new Map<string, ComparisonValue>();
    let hasDifferences = false;
    const displayValues: string[] = [];

    for (const treatment of treatments) {
      const value = attr.extractValue(treatment, context);
      values.set(treatment.identity.slug, value);
      displayValues.push(value.display);
    }

    // Detect differences
    const uniqueDisplays = new Set(displayValues);
    hasDifferences = uniqueDisplays.size > 1;

    rows.push({
      attribute: attr,
      values,
      hasDifferences,
      isUniversal: attr.applicability === "universal",
      applicableModalities:
        attr.applicability === "universal" ? modalities : (attr.applicability as TreatmentModality[]),
    });
  }

  // Group rows
  const groups = new Map<ComparisonGroup, ComparisonRow[]>();
  for (const row of rows) {
    const group = row.attribute.group;
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group)!.push(row);
  }

  // Sort rows within groups
  for (const [, groupRows] of groups) {
    groupRows.sort((a, b) => a.attribute.order - b.attribute.order);
  }

  // Generate differentiators
  const differentiators = generateDifferentiators(treatments, rows, context);

  // Build shareable URL
  const slugs = treatments.map((t) => t.identity.slug).join(",");
  const shareableUrl = `/treatments/compare?items=${slugs}${
    context.conditionSlug ? `&condition=${context.conditionSlug}` : ""
  }`;

  return {
    treatments,
    context,
    rows,
    groups,
    modalities,
    isCrossModality,
    differentiators,
    shareableUrl,
  };
}

/**
 * Generates treatment-specific differentiators (not winners)
 */
function generateDifferentiators(
  treatments: TreatmentV3[],
  rows: ComparisonRow[],
  context: ComparisonContext
): TreatmentDifferentiator[] {
  const differentiators: TreatmentDifferentiator[] = [];

  // Find notable differences
  const differenceRows = rows.filter((r) => r.hasDifferences);

  for (const treatment of treatments) {
    const slug = treatment.identity.slug;
    const name = treatment.identity.name;

    // Check for unique FDA approvals
    const fdaRow = differenceRows.find((r) => r.attribute.key === "fda_approved_for");
    if (fdaRow) {
      const value = fdaRow.values.get(slug);
      if (value && value.status === "known" && value.raw && Array.isArray(value.raw)) {
        const count = value.raw.length;
        if (count > 0) {
          // Check if this treatment has more approved indications
          const otherCounts = treatments
            .filter((t) => t.identity.slug !== slug)
            .map((t) => {
              const v = fdaRow.values.get(t.identity.slug);
              return v?.raw && Array.isArray(v.raw) ? v.raw.length : 0;
            });
          if (count > Math.max(...otherCounts)) {
            differentiators.push({
              treatmentSlug: slug,
              treatmentName: name,
              statement: `${name} has broader FDA-approved indications.`,
              attributeKey: "fda_approved_for",
              isPositive: true,
            });
          }
        }
      }
    }

    // Check for unique monitoring requirements
    const monitoringRow = differenceRows.find((r) => r.attribute.key === "monitoring_requirements");
    if (monitoringRow) {
      const value = monitoringRow.values.get(slug);
      if (value && value.status === "known" && value.raw && Array.isArray(value.raw)) {
        if (value.raw.length === 0) {
          differentiators.push({
            treatmentSlug: slug,
            treatmentName: name,
            statement: `${name} does not require routine laboratory monitoring.`,
            attributeKey: "monitoring_requirements",
          });
        } else if (value.raw.length > 3) {
          differentiators.push({
            treatmentSlug: slug,
            treatmentName: name,
            statement: `${name} requires regular monitoring.`,
            attributeKey: "monitoring_requirements",
          });
        }
      }
    }

    // Check for invasiveness differences
    const invasivenessRow = differenceRows.find((r) => r.attribute.key === "invasiveness");
    if (invasivenessRow) {
      const value = invasivenessRow.values.get(slug);
      if (value && value.raw === "non_invasive") {
        differentiators.push({
          treatmentSlug: slug,
          treatmentName: name,
          statement: `${name} is non-invasive.`,
          attributeKey: "invasiveness",
        });
      }
    }

    // Check for professional involvement
    const profRow = differenceRows.find((r) => r.attribute.key === "professional_required");
    if (profRow) {
      const value = profRow.values.get(slug);
      if (value && value.raw && typeof value.raw === "object") {
        const prof = value.raw as { required: boolean };
        if (!prof.required) {
          differentiators.push({
            treatmentSlug: slug,
            treatmentName: name,
            statement: `${name} can be practiced independently without professional supervision.`,
            attributeKey: "professional_required",
          });
        }
      }
    }
  }

  // Limit to 2 differentiators per treatment
  const byTreatment = new Map<string, TreatmentDifferentiator[]>();
  for (const d of differentiators) {
    if (!byTreatment.has(d.treatmentSlug)) {
      byTreatment.set(d.treatmentSlug, []);
    }
    byTreatment.get(d.treatmentSlug)!.push(d);
  }

  const limited: TreatmentDifferentiator[] = [];
  for (const [, diffs] of byTreatment) {
    limited.push(...diffs.slice(0, 2));
  }

  return limited;
}

/**
 * Filters rows to show only differences
 */
export function filterDifferencesOnly(rows: ComparisonRow[]): ComparisonRow[] {
  return rows.filter((r) => r.hasDifferences);
}

/**
 * Filters rows to show only similarities
 */
export function filterSimilaritiesOnly(rows: ComparisonRow[]): ComparisonRow[] {
  return rows.filter((r) => !r.hasDifferences);
}

/**
 * Gets rows for a specific group
 */
export function getGroupRows(
  groups: Map<ComparisonGroup, ComparisonRow[]>,
  group: ComparisonGroup
): ComparisonRow[] {
  return groups.get(group) || [];
}

/**
 * Gets all group labels in display order
 */
export function getGroupOrder(): { key: ComparisonGroup; label: string }[] {
  return [
    { key: "overview", label: "At a Glance" },
    { key: "indications", label: "Used For" },
    { key: "evidence", label: "Evidence & Effectiveness" },
    { key: "experience", label: "Treatment Experience" },
    { key: "delivery", label: "How Treatment Works" },
    { key: "safety", label: "Safety Profile" },
    { key: "access", label: "Access & Practical" },
    { key: "medication_specific", label: "Medication Details" },
    { key: "therapy_specific", label: "Therapy Details" },
    { key: "interventional_specific", label: "Procedure Details" },
  ];
}

// =============================================================================
// SERIALIZABLE TYPES FOR CLIENT COMPONENTS
// =============================================================================

/**
 * Serializable version of ComparisonAttributeDefinition (no functions)
 */
export interface SerializableAttributeDefinition {
  key: string;
  label: string;
  shortLabel?: string;
  description?: string;
  group: ComparisonGroup;
  order: number;
  applicability: TreatmentModality[] | "universal";
  dataType: ComparisonDataType;
  comparisonSemantics: ComparisonSemantics;
  missingBehavior: string;
  renderer: string;
  clinicalCaution?: string;
}

/**
 * Serializable comparison row (no functions)
 */
export interface SerializableComparisonRow {
  attribute: SerializableAttributeDefinition;
  values: Record<string, ComparisonValue>; // slug -> value (converted from Map)
  hasDifferences: boolean;
  isUniversal: boolean;
  applicableModalities: TreatmentModality[];
}

/**
 * Serializable comparison result for client components
 */
export interface SerializableComparisonResult {
  treatments: TreatmentV3[];
  context: ComparisonContext;
  rows: SerializableComparisonRow[];
  groups: Record<ComparisonGroup, SerializableComparisonRow[]>;
  modalities: TreatmentModality[];
  isCrossModality: boolean;
  differentiators: TreatmentDifferentiator[];
  shareableUrl: string;
}

/**
 * Converts a ComparisonResult to a serializable version for client components
 */
export function serializeComparisonResult(result: ComparisonResult): SerializableComparisonResult {
  // Convert rows: strip extractValue function and convert Map to Record
  const serializeRow = (row: ComparisonRow): SerializableComparisonRow => ({
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
      renderer: row.attribute.renderer,
      clinicalCaution: row.attribute.clinicalCaution,
    },
    values: Object.fromEntries(row.values.entries()),
    hasDifferences: row.hasDifferences,
    isUniversal: row.isUniversal,
    applicableModalities: row.applicableModalities,
  });

  const rows = result.rows.map(serializeRow);

  // Convert groups Map to Record
  const groups: Record<ComparisonGroup, SerializableComparisonRow[]> = {} as Record<ComparisonGroup, SerializableComparisonRow[]>;
  for (const [key, groupRows] of result.groups.entries()) {
    groups[key] = groupRows.map(serializeRow);
  }

  return {
    treatments: result.treatments,
    context: result.context,
    rows,
    groups,
    modalities: result.modalities,
    isCrossModality: result.isCrossModality,
    differentiators: result.differentiators,
    shareableUrl: result.shareableUrl,
  };
}
