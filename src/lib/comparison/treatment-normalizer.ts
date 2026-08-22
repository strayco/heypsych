/**
 * Treatment Normalizer
 *
 * Converts v2 treatment records to v3 format with clinical_profile.
 * This is a pure transformation that:
 * - Does not mutate inputs
 * - Preserves all original content
 * - Generates clinical_profile from existing structured data
 * - Reports ambiguities for review
 */

import type {
  TreatmentV3,
  TreatmentModality,
  ClinicalProfile,
  ConditionLink,
  MedicationDetails,
  TherapyDetails,
  InterventionalDetails,
  SupplementDetails,
  AlternativeDetails,
  Duration,
  ContentSection,
} from "../schemas/treatment-v3";

// =============================================================================
// V2 TREATMENT TYPE (existing format)
// =============================================================================

/**
 * Existing v2 treatment structure
 */
export interface TreatmentV2 {
  kind: "treatment";
  slug: string;
  type: string;
  name: string;
  summary: string;
  description: string;
  patient_summary?: string;
  category: string;
  tags?: string[];
  metadata: {
    drug_classes?: string[];
    brand_names?: string[];
    administration_routes?: string[];
    prescription_status?: string;
    controlled_substance?: boolean | string | null;
    generic_available?: boolean | string;
    fda_approval_year?: number | string | null;
    pharmacologic_category?: string;
    published_date?: string;
    last_updated?: string;
    medical_review?: {
      reviewed?: boolean;
      review_date?: string;
      reviewer_name?: string;
    };
    wikidata_qid?: string;
    intervention_types?: string[];
    treatment_types?: string[];
    categories?: string[];
    delivery_methods?: string[];
    invasiveness_level?: string;
    equipment_required?: boolean | string | string[];
    training_required?: boolean | string;
    age_groups?: string[];
    session_duration?: string;
    treatment_duration?: string | string[];
    specialty_areas?: string[];
    regulatory_status?: string;
    practice_styles?: string[];
    treatment_variants?: string[];
    setting?: string[];
    compound_type?: string;
    natural_source?: string;
    fda_status?: string;
    trial_phase?: string;
    dea_schedule?: string | null;
    fda_pregnancy_category?: string | null;
    [key: string]: unknown;
  };
  clinical_metadata: {
    primary_indications?: string[];
    linked_conditions?: Array<{
      slug: string;
      relationship: string;
      context?: string;
    }>;
    contraindications?: string[];
    off_label_uses?: string[];
    efficacy_rating?: Record<string, number>;
    monitoring_required?: string[];
    conditions_treated?: string[];
    safety_profile?: string;
    evidence_level?: string;
    pharmacokinetics?: {
      absorption?: string;
      bioavailability?: string;
      onset?: string;
      peak_plasma?: string;
      half_life?: string;
      duration_IR?: string;
      duration_XR?: string | null;
      metabolism?: string;
      excretion?: string;
      protein_binding?: string;
      food_effect?: string;
    };
    efficacy_response?: {
      metric?: string;
      percentage_value?: string;
      comparison_data?: string;
      patient_text?: string;
      citation_tag?: string;
    };
    research_support?: string;
    invasiveness?: string;
    [key: string]: unknown;
  };
  sections: Array<{
    type: string;
    heading?: string;
    text?: string;
    items?: unknown[];
    [key: string]: unknown;
  }>;
  search_metadata?: {
    searchable_terms?: string[];
    synonyms?: string[];
    common_misspellings?: string[];
    [key: string]: unknown;
  };
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    canonical?: string;
    no_index?: boolean;
  };
  editorial?: {
    medicalReviewerIds?: string[];
    reviewBoard?: string;
    lastReviewed?: string;
    lastUpdated?: string;
    reviewStatement?: string;
    citations?: string[];
  };
  faqs?: Array<{
    q: string;
    a: string;
  }>;
  [key: string]: unknown;
}

// =============================================================================
// NORMALIZATION RESULT
// =============================================================================

export interface NormalizationResult {
  treatment: TreatmentV3;
  warnings: NormalizationWarning[];
  ambiguities: NormalizationAmbiguity[];
  preservedLegacyFields: string[];
}

export interface NormalizationWarning {
  field: string;
  message: string;
  severity: "info" | "warning" | "error";
}

export interface NormalizationAmbiguity {
  field: string;
  originalValue: unknown;
  reason: string;
  suggestion?: string;
}

// =============================================================================
// NORMALIZER CLASS
// =============================================================================

export class TreatmentNormalizer {
  private warnings: NormalizationWarning[] = [];
  private ambiguities: NormalizationAmbiguity[] = [];
  private preservedLegacyFields: string[] = [];

  /**
   * Normalizes a v2 treatment to v3 format
   */
  normalize(v2: TreatmentV2): NormalizationResult {
    this.warnings = [];
    this.ambiguities = [];
    this.preservedLegacyFields = [];

    const modality = this.normalizeModality(v2.type);

    const v3: TreatmentV3 = {
      schema_version: 3,
      kind: "treatment",
      identity: this.normalizeIdentity(v2),
      taxonomy: this.normalizeTaxonomy(v2, modality),
      summary: v2.summary,
      description: v2.description,
      patient_summary: v2.patient_summary,
      clinical_profile: this.normalizeClinicalProfile(v2, modality),
      sections: this.normalizeSections(v2.sections),
      sources: this.extractSources(v2),
      faqs: v2.faqs,
      search_metadata: v2.search_metadata,
      seo: v2.seo,
      editorial: v2.editorial,
      legacy_preservation: this.buildLegacyPreservation(v2),
    };

    return {
      treatment: v3,
      warnings: this.warnings,
      ambiguities: this.ambiguities,
      preservedLegacyFields: this.preservedLegacyFields,
    };
  }

  // ===========================================================================
  // IDENTITY
  // ===========================================================================

  private normalizeIdentity(v2: TreatmentV2) {
    const name = v2.name;
    let genericName: string | undefined;
    let brandNames: string[] | undefined;

    // Extract generic name from name pattern like "Sertraline (Zoloft)"
    const nameMatch = name.match(/^([^(]+)\s*\(([^)]+)\)$/);
    if (nameMatch) {
      genericName = nameMatch[1].trim().toLowerCase();
      brandNames = [nameMatch[2].trim()];
    }

    // Override with explicit metadata
    if (v2.metadata.brand_names?.length) {
      brandNames = v2.metadata.brand_names;
    }

    return {
      slug: v2.slug,
      name: v2.name,
      generic_name: genericName,
      brand_names: brandNames,
      aliases: v2.search_metadata?.synonyms,
      wikidata_qid: v2.metadata.wikidata_qid,
    };
  }

  // ===========================================================================
  // TAXONOMY
  // ===========================================================================

  private normalizeModality(type: string): TreatmentModality {
    const modalityMap: Record<string, TreatmentModality> = {
      medication: "medication",
      therapy: "therapy",
      interventional: "interventional",
      investigational: "investigational",
      supplement: "supplement",
      alternative: "alternative",
    };

    const normalized = modalityMap[type.toLowerCase()];
    if (!normalized) {
      this.warnings.push({
        field: "type",
        message: `Unknown modality type: ${type}. Defaulting to 'alternative'.`,
        severity: "warning",
      });
      return "alternative";
    }
    return normalized;
  }

  private normalizeTaxonomy(v2: TreatmentV2, modality: TreatmentModality) {
    // Safe cast for array types that might be unknown
    const therapeuticCategories = Array.isArray(v2.metadata.therapeutic_categories)
      ? (v2.metadata.therapeutic_categories as string[])
      : undefined;
    const mechanismCategories = Array.isArray(v2.metadata.mechanism_categories)
      ? (v2.metadata.mechanism_categories as string[])
      : undefined;

    return {
      modality,
      category: v2.category,
      subcategory: undefined,
      drug_classes: v2.metadata.drug_classes,
      intervention_types: v2.metadata.intervention_types,
      therapeutic_categories: therapeuticCategories,
      mechanism_categories: mechanismCategories,
      tags: v2.tags,
    };
  }

  // ===========================================================================
  // CLINICAL PROFILE
  // ===========================================================================

  private normalizeClinicalProfile(v2: TreatmentV2, modality: TreatmentModality): ClinicalProfile {
    return {
      indications: this.normalizeIndications(v2),
      evidence: this.normalizeEvidence(v2),
      experience: this.normalizeExperience(v2),
      delivery: this.normalizeDelivery(v2, modality),
      safety: this.normalizeSafety(v2),
      access: this.normalizeAccess(v2, modality),
      modality_details: this.normalizeModalityDetails(v2, modality),
    };
  }

  // ===========================================================================
  // INDICATIONS
  // ===========================================================================

  private normalizeIndications(v2: TreatmentV2) {
    const primary: ConditionLink[] = [];
    const secondary: ConditionLink[] = [];
    const offLabel: ConditionLink[] = [];

    // From linked_conditions
    if (v2.clinical_metadata.linked_conditions) {
      for (const link of v2.clinical_metadata.linked_conditions) {
        const conditionLink: ConditionLink = {
          condition_slug: link.slug,
          condition_name: this.slugToName(link.slug),
          relationship: this.normalizeRelationship(link.relationship),
          context: link.context,
        };

        if (link.relationship === "primary_treatment" || link.relationship === "primary") {
          conditionLink.fda_approved = true;
          primary.push(conditionLink);
        } else if (link.relationship === "off_label") {
          offLabel.push(conditionLink);
        } else {
          secondary.push(conditionLink);
        }
      }
    }

    // From primary_indications (if no linked_conditions)
    if (primary.length === 0 && v2.clinical_metadata.primary_indications) {
      for (const indication of v2.clinical_metadata.primary_indications) {
        primary.push({
          condition_slug: this.nameToSlug(indication),
          condition_name: indication,
          relationship: "primary_indication",
        });
      }
    }

    // From off_label_uses
    if (offLabel.length === 0 && v2.clinical_metadata.off_label_uses) {
      for (const use of v2.clinical_metadata.off_label_uses) {
        offLabel.push({
          condition_slug: this.nameToSlug(use),
          condition_name: use,
          relationship: "off_label",
        });
      }
    }

    // From conditions_treated (therapy/alternative)
    if (v2.clinical_metadata.conditions_treated) {
      for (const condition of v2.clinical_metadata.conditions_treated) {
        // Only add if not already in primary
        const exists = primary.some((p) => p.condition_name?.toLowerCase() === condition.toLowerCase());
        if (!exists) {
          secondary.push({
            condition_slug: this.nameToSlug(condition),
            condition_name: condition,
            relationship: "secondary_indication",
          });
        }
      }
    }

    return {
      primary: primary.length > 0 ? primary : undefined,
      secondary: secondary.length > 0 ? secondary : undefined,
      off_label: offLabel.length > 0 ? offLabel : undefined,
      contraindicated_conditions: undefined,
      summary: undefined,
    };
  }

  private normalizeRelationship(
    rel: string
  ): ConditionLink["relationship"] {
    const map: Record<string, ConditionLink["relationship"]> = {
      primary_treatment: "primary_indication",
      primary: "primary_indication",
      secondary_treatment: "secondary_indication",
      secondary: "secondary_indication",
      off_label: "off_label",
      off_label_caution: "off_label",
      investigational: "investigational",
      adjunctive: "adjunctive",
      augmentation: "augmentation",
      preventive: "preventive",
    };
    return map[rel] || "secondary_indication";
  }

  // ===========================================================================
  // EVIDENCE
  // ===========================================================================

  private normalizeEvidence(v2: TreatmentV2) {
    const originalLevel = v2.clinical_metadata.evidence_level;
    const normalizedLevel = this.normalizeEvidenceLevel(originalLevel);

    const efficacyRatings: Record<string, { rating: number }> | undefined =
      v2.clinical_metadata.efficacy_rating
        ? Object.fromEntries(
            Object.entries(v2.clinical_metadata.efficacy_rating).map(([k, v]) => [k, { rating: v }])
          )
        : undefined;

    return {
      overall_level: normalizedLevel.mapped,
      // Preserve original verbatim when it couldn't be normalized
      // This ensures lossless migration and distinguishes from missing data
      overall_level_original: normalizedLevel.wasAmbiguous ? originalLevel : undefined,
      efficacy_ratings: efficacyRatings,
      research_support: v2.clinical_metadata.research_support,
      limitations: undefined,
      key_studies: undefined,
    };
  }

  private normalizeEvidenceLevel(level?: string): {
    mapped: "very_strong" | "strong" | "moderate" | "limited" | "emerging" | "anecdotal" | "insufficient" | undefined;
    wasAmbiguous: boolean;
  } {
    if (!level) return { mapped: undefined, wasAmbiguous: false };

    const normalized = level.toLowerCase().replace(/[\s-]/g, "_");

    const map: Record<string, string> = {
      very_strong: "very_strong",
      strong: "strong",
      moderate: "moderate",
      limited: "limited",
      emerging: "emerging",
      anecdotal: "anecdotal",
      insufficient: "insufficient",
      low_to_moderate: "limited",
      "low-to-moderate": "limited",
      moderate_to_high: "moderate",
      high: "strong",
      low: "limited",
    };

    const result = map[normalized];
    if (!result) {
      this.ambiguities.push({
        field: "evidence_level",
        originalValue: level,
        reason: `Unknown evidence level: ${level}`,
        suggestion: "Manual review needed to map to standard evidence level",
      });
      // Return undefined instead of "insufficient" to avoid misleading grades
      // The original value is preserved in overall_level_original
      return { mapped: undefined, wasAmbiguous: true };
    }

    return {
      mapped: result as "very_strong" | "strong" | "moderate" | "limited" | "emerging" | "anecdotal" | "insufficient",
      wasAmbiguous: false,
    };
  }

  // ===========================================================================
  // EXPERIENCE
  // ===========================================================================

  private normalizeExperience(v2: TreatmentV2) {
    const pk = v2.clinical_metadata.pharmacokinetics;

    // Extract onset from pharmacokinetics or onset_duration section
    let onsetSection: Duration | undefined;
    const onsetDurationSection = v2.sections.find((s) => s.type === "onset_duration");
    if (onsetDurationSection) {
      const keyPoints = onsetDurationSection.key_points as string[] | undefined;
      if (keyPoints?.length) {
        onsetSection = {
          unit: "days",
          display: keyPoints.join("; "),
        };
      }
    }

    // Extract treatment duration
    let courseDuration: Duration | undefined;
    if (v2.metadata.treatment_duration) {
      const dur = v2.metadata.treatment_duration;
      courseDuration = {
        unit: "ongoing",
        display: Array.isArray(dur) ? dur.join("; ") : dur,
      };
    }

    return {
      onset: pk?.onset
        ? {
            therapeutic_response: {
              unit: "days" as const,
              display: pk.onset,
            },
          }
        : onsetSection
        ? {
            therapeutic_response: onsetSection,
          }
        : undefined,
      duration: courseDuration
        ? {
            typical_course: courseDuration,
          }
        : undefined,
      treatment_course: undefined,
    };
  }

  // ===========================================================================
  // DELIVERY
  // ===========================================================================

  private normalizeDelivery(v2: TreatmentV2, modality: TreatmentModality) {
    const settings = this.normalizeSettings(v2.metadata.setting);

    return {
      routes: v2.metadata.administration_routes,
      dosage_forms: undefined,
      format: v2.metadata.delivery_methods,
      setting: settings,
      session_duration: v2.metadata.session_duration
        ? {
            unit: "minutes" as const,
            display: v2.metadata.session_duration,
          }
        : undefined,
      frequency: undefined,
      total_sessions: undefined,
      professional_required:
        v2.metadata.training_required !== undefined
          ? {
              required: this.normalizeBoolean(v2.metadata.training_required) ?? false,
              notes:
                typeof v2.metadata.training_required === "string"
                  ? v2.metadata.training_required
                  : undefined,
            }
          : undefined,
      home_practice: undefined,
      invasiveness: this.normalizeInvasiveness(v2.metadata.invasiveness_level || v2.clinical_metadata.invasiveness),
    };
  }

  private normalizeSettings(
    settings?: string[]
  ): Array<"home" | "outpatient_clinic" | "hospital_inpatient" | "emergency" | "residential" | "telehealth" | "specialty_center" | "community"> | undefined {
    if (!settings) return undefined;

    const map: Record<string, string> = {
      home: "home",
      clinic: "outpatient_clinic",
      outpatient: "outpatient_clinic",
      "outpatient clinic": "outpatient_clinic",
      hospital: "hospital_inpatient",
      inpatient: "hospital_inpatient",
      emergency: "emergency",
      residential: "residential",
      telehealth: "telehealth",
      "specialty center": "specialty_center",
      "integrative medicine center": "specialty_center",
      "pain clinic": "specialty_center",
      community: "community",
      "therapy session": "outpatient_clinic",
      "meditation/yoga class": "community",
      outdoors: "community",
      "therapeutic camps": "residential",
      "rehabilitation centers": "residential",
      "school or community programs": "community",
    };

    return settings
      .map((s) => map[s.toLowerCase()] || s.toLowerCase())
      .filter((s) =>
        ["home", "outpatient_clinic", "hospital_inpatient", "emergency", "residential", "telehealth", "specialty_center", "community"].includes(
          s
        )
      ) as Array<"home" | "outpatient_clinic" | "hospital_inpatient" | "emergency" | "residential" | "telehealth" | "specialty_center" | "community">;
  }

  private normalizeInvasiveness(
    level?: string
  ): "non_invasive" | "minimally_invasive" | "invasive" | "surgical" | undefined {
    if (!level) return undefined;

    const normalized = level.toLowerCase().replace(/[\s-]/g, "_");
    const map: Record<string, string> = {
      non_invasive: "non_invasive",
      noninvasive: "non_invasive",
      minimally_invasive: "minimally_invasive",
      invasive: "invasive",
      surgical: "surgical",
    };

    return map[normalized] as "non_invasive" | "minimally_invasive" | "invasive" | "surgical" | undefined;
  }

  // ===========================================================================
  // SAFETY
  // ===========================================================================

  private normalizeSafety(v2: TreatmentV2) {
    const warningsSection = v2.sections.find((s) => s.type === "warnings");
    const adverseSection = v2.sections.find((s) => s.type === "adverse_effects");
    const sideEffectsSection = v2.sections.find((s) => s.type === "side_effects");
    const contraindicationsSection = v2.sections.find((s) => s.type === "contraindications");
    const monitoringSection = v2.sections.find((s) => s.type === "monitoring");

    // Extract common adverse effects
    const commonEffects =
      (adverseSection?.common as Array<{ symptom: string; incidence?: string; patient_note?: string }>) ||
      (sideEffectsSection?.common as string[])?.map((e) => ({ effect: e })) ||
      [];

    // Extract serious risks
    const seriousRisks =
      (adverseSection?.serious as string[])?.map((r) => ({ risk: r })) ||
      (sideEffectsSection?.rare as string[])?.map((r) => ({ risk: r })) ||
      [];

    // Extract contraindications
    const contraindications = this.normalizeContraindications(
      v2.clinical_metadata.contraindications,
      contraindicationsSection
    );

    // Extract monitoring
    const monitoring = this.normalizeMonitoring(v2.clinical_metadata.monitoring_required, monitoringSection);

    return {
      overall_safety: v2.clinical_metadata.safety_profile,
      common_adverse_effects: commonEffects.length > 0
        ? commonEffects.map((e) =>
            typeof e === "string"
              ? { effect: e }
              : {
                  effect: e.symptom || (e as { effect?: string }).effect || String(e),
                  incidence: e.incidence,
                  notes: e.patient_note,
                }
          )
        : undefined,
      serious_risks: seriousRisks.length > 0 ? seriousRisks : undefined,
      black_box_warning: (warningsSection?.black_box as string) || undefined,
      contraindications: contraindications.length > 0 ? contraindications : undefined,
      precautions: (warningsSection?.other as string[]) || undefined,
      interactions: this.normalizeInteractions(v2),
      monitoring_requirements: monitoring.length > 0 ? monitoring : undefined,
      special_populations: this.normalizeSpecialPopulations(v2),
    };
  }

  private normalizeContraindications(
    clinicalContras?: string[],
    section?: { type: string; absolute?: string[]; relative?: string[]; [key: string]: unknown }
  ) {
    const result: Array<{ contraindication: string; type?: "absolute" | "relative" }> = [];

    if (section?.absolute) {
      for (const c of section.absolute) {
        result.push({ contraindication: c, type: "absolute" });
      }
    }

    if (section?.relative) {
      for (const c of section.relative) {
        result.push({ contraindication: c, type: "relative" });
      }
    }

    if (clinicalContras && result.length === 0) {
      for (const c of clinicalContras) {
        const isAbsolute = c.toLowerCase().includes("absolute:");
        result.push({
          contraindication: c.replace(/^(Absolute|Relative):\s*/i, ""),
          type: isAbsolute ? "absolute" : undefined,
        });
      }
    }

    return result;
  }

  private normalizeMonitoring(
    required?: string[],
    section?: { type: string; items?: unknown[]; [key: string]: unknown }
  ) {
    const result: Array<{ parameter: string; frequency?: string }> = [];

    if (section?.items && Array.isArray(section.items)) {
      for (const item of section.items) {
        if (typeof item === "string") {
          result.push({ parameter: item });
        }
      }
    } else if (required) {
      for (const item of required) {
        result.push({ parameter: item });
      }
    }

    return result;
  }

  private normalizeInteractions(v2: TreatmentV2) {
    const interactionsSection = v2.sections.find((s) => s.type === "interactions");
    if (!interactionsSection?.items) return undefined;

    const items = interactionsSection.items as Array<{
      with: string;
      risk: string;
      action?: string;
    }>;

    return items.map((i) => ({
      interactant: i.with,
      mechanism: i.risk,
      action: i.action,
    }));
  }

  private normalizeSpecialPopulations(v2: TreatmentV2) {
    const section = v2.sections.find((s) => s.type === "special_populations");
    if (!section) return undefined;

    return {
      pregnancy: section.pregnancy as string | undefined,
      lactation: section.lactation as string | undefined,
      pediatric: section.pediatrics as string | undefined,
      geriatric: section.geriatrics as string | undefined,
      renal_impairment: section.renal as string | undefined,
      hepatic_impairment: section.hepatic as string | undefined,
    };
  }

  // ===========================================================================
  // ACCESS
  // ===========================================================================

  private normalizeAccess(v2: TreatmentV2, modality: TreatmentModality) {
    const prescriptionRequired =
      v2.metadata.prescription_status?.toLowerCase().includes("prescription") ?? undefined;

    const controlledSubstance = this.normalizeControlledSubstance(v2.metadata);

    return {
      regulatory_status: this.normalizeRegulatoryStatus(v2.metadata),
      prescription_required: prescriptionRequired,
      controlled_substance: controlledSubstance,
      generic_available: this.normalizeBoolean(v2.metadata.generic_available),
      fda_approval_year:
        typeof v2.metadata.fda_approval_year === "number" ? v2.metadata.fda_approval_year : undefined,
      cost_category: undefined,
      cost_notes: undefined,
      insurance_coverage: undefined,
      availability: undefined,
    };
  }

  private normalizeRegulatoryStatus(
    metadata: TreatmentV2["metadata"]
  ):
    | "fda_approved"
    | "fda_cleared"
    | "off_label"
    | "investigational"
    | "unregulated"
    | "schedule_controlled"
    | "discontinued"
    | undefined {
    if (metadata.regulatory_status) {
      const status = metadata.regulatory_status.toLowerCase();
      if (status.includes("approved")) return "fda_approved";
      if (status.includes("cleared")) return "fda_cleared";
      if (status.includes("investigational")) return "investigational";
      if (status.includes("unregulated") || status.includes("not regulated")) return "unregulated";
    }

    if (metadata.fda_status) {
      const status = metadata.fda_status.toLowerCase();
      if (status.includes("approved")) return "fda_approved";
      if (status.includes("otc") || status.includes("supplement")) return "unregulated";
    }

    if (metadata.trial_phase) {
      return "investigational";
    }

    if (metadata.fda_approval_year) {
      return "fda_approved";
    }

    return undefined;
  }

  private normalizeControlledSubstance(metadata: TreatmentV2["metadata"]) {
    const controlled = metadata.controlled_substance;
    const schedule = metadata.dea_schedule || metadata.controlled_schedule;

    if (controlled === false || controlled === "Not Controlled" || controlled === null) {
      return { is_controlled: false };
    }

    if (controlled === true || schedule) {
      return {
        is_controlled: true,
        schedule: typeof schedule === "string" ? schedule : undefined,
      };
    }

    return undefined;
  }

  // ===========================================================================
  // MODALITY DETAILS
  // ===========================================================================

  private normalizeModalityDetails(
    v2: TreatmentV2,
    modality: TreatmentModality
  ): ClinicalProfile["modality_details"] {
    switch (modality) {
      case "medication":
        return {
          modality: "medication",
          details: this.normalizeMedicationDetails(v2),
        };
      case "therapy":
        return {
          modality: "therapy",
          details: this.normalizeTherapyDetails(v2),
        };
      case "interventional":
      case "investigational":
        return {
          modality: modality,
          details: this.normalizeInterventionalDetails(v2),
        };
      case "supplement":
        return {
          modality: "supplement",
          details: this.normalizeSupplementDetails(v2),
        };
      case "alternative":
        return {
          modality: "alternative",
          details: this.normalizeAlternativeDetails(v2),
        };
    }
  }

  private normalizeMedicationDetails(v2: TreatmentV2): MedicationDetails {
    const pk = v2.clinical_metadata.pharmacokinetics;
    const dosingSection = v2.sections.find((s) => s.type === "dosing");
    const taperingSection = v2.sections.find((s) => s.type === "tapering");

    return {
      pharmacokinetics: pk
        ? {
            absorption: pk.absorption,
            bioavailability: pk.bioavailability,
            peak_plasma: pk.peak_plasma,
            half_life: pk.half_life,
            metabolism: pk.metabolism,
            excretion: pk.excretion,
            protein_binding: pk.protein_binding,
            food_effect: pk.food_effect,
          }
        : undefined,
      dosing: dosingSection
        ? {
            starting_dose: (dosingSection.adult as Record<string, string>)?.initial,
            typical_dose: (dosingSection.adult as Record<string, string>)?.typical,
            max_dose: (dosingSection.adult as Record<string, string>)?.max,
            titration: dosingSection.text as string | undefined,
          }
        : undefined,
      discontinuation: taperingSection
        ? {
            taper_required: true,
            taper_guidance: taperingSection.text as string | undefined,
          }
        : undefined,
    };
  }

  private normalizeTherapyDetails(v2: TreatmentV2): TherapyDetails {
    const protocolSection = v2.sections.find((s) => s.type === "protocol");
    const sessionSection = v2.sections.find((s) => s.type === "session_structure");
    const trainingSection = v2.sections.find((s) => s.type === "training_requirements");

    return {
      therapy_type: v2.metadata.treatment_types?.join(", "),
      theoretical_basis: undefined,
      key_techniques: v2.metadata.categories,
      session_structure: sessionSection
        ? {
            pre_session: sessionSection.pre_session as string | undefined,
            during_session: sessionSection.treatment_phase as string | undefined,
            post_session: sessionSection.post_session as string | undefined,
            homework: undefined,
          }
        : undefined,
      training_requirements: trainingSection
        ? {
            practitioner: trainingSection.practitioner as string[] | undefined,
            certification: undefined,
          }
        : undefined,
      variants: v2.metadata.treatment_variants,
    };
  }

  private normalizeInterventionalDetails(v2: TreatmentV2): InterventionalDetails {
    const protocolSection = v2.sections.find((s) => s.type === "protocol");

    return {
      procedure_type: v2.metadata.intervention_types?.join(", "),
      device_name: undefined,
      anesthesia_required: undefined,
      anesthesia_type: undefined,
      recovery_time: undefined,
      equipment_required: Array.isArray(v2.metadata.equipment_required)
        ? v2.metadata.equipment_required
        : v2.metadata.equipment_required
        ? [String(v2.metadata.equipment_required)]
        : undefined,
      session_protocol: protocolSection?.procedure
        ? (protocolSection.procedure as string[]).join("\n")
        : undefined,
      maintenance_schedule: undefined,
    };
  }

  private normalizeSupplementDetails(v2: TreatmentV2): SupplementDetails {
    return {
      compound_type: v2.metadata.compound_type,
      natural_source: v2.metadata.natural_source,
      typical_dose_range: undefined,
      quality_considerations: undefined,
      regulatory_notes: v2.metadata.fda_status,
    };
  }

  private normalizeAlternativeDetails(v2: TreatmentV2): AlternativeDetails {
    return {
      practice_style: v2.metadata.practice_styles?.join(", "),
      tradition_origin: undefined,
      variants: v2.metadata.treatment_variants,
      self_practice_possible: !this.normalizeBoolean(v2.metadata.training_required),
      equipment_needed: Array.isArray(v2.metadata.equipment_required)
        ? v2.metadata.equipment_required
        : undefined,
    };
  }

  // ===========================================================================
  // SECTIONS
  // ===========================================================================

  private normalizeSections(sections: TreatmentV2["sections"]): ContentSection[] {
    return sections.map((s) => ({
      type: s.type,
      heading: s.heading,
      text: s.text,
      items: s.items,
      ...Object.fromEntries(
        Object.entries(s).filter(([k]) => !["type", "heading", "text", "items"].includes(k))
      ),
    }));
  }

  // ===========================================================================
  // SOURCES
  // ===========================================================================

  private extractSources(v2: TreatmentV2) {
    const referencesSection = v2.sections.find((s) => s.type === "references");
    if (!referencesSection?.items) return undefined;

    const items = referencesSection.items as Array<{
      label?: string;
      url?: string;
      description?: string;
    }>;

    return items
      .map((item, index) => ({
        id: `ref-${index + 1}`,
        type: "other" as const,
        title: item.label || "Reference",
        url: item.url,
        description: item.description,
      }))
      .filter((s) => s.title);
  }

  // ===========================================================================
  // LEGACY PRESERVATION
  // ===========================================================================

  private buildLegacyPreservation(v2: TreatmentV2) {
    // Identify fields that couldn't be fully normalized
    const unmappedFields: Record<string, unknown> = {};

    // Check for metadata fields we didn't explicitly handle
    const handledMetadataFields = new Set([
      "drug_classes",
      "brand_names",
      "administration_routes",
      "prescription_status",
      "controlled_substance",
      "generic_available",
      "fda_approval_year",
      "pharmacologic_category",
      "published_date",
      "last_updated",
      "medical_review",
      "wikidata_qid",
      "intervention_types",
      "treatment_types",
      "categories",
      "delivery_methods",
      "invasiveness_level",
      "equipment_required",
      "training_required",
      "age_groups",
      "session_duration",
      "treatment_duration",
      "specialty_areas",
      "regulatory_status",
      "practice_styles",
      "treatment_variants",
      "setting",
      "compound_type",
      "natural_source",
      "fda_status",
      "trial_phase",
      "dea_schedule",
      "fda_pregnancy_category",
      "therapeutic_categories",
      "mechanism_categories",
    ]);

    for (const [key, value] of Object.entries(v2.metadata)) {
      if (!handledMetadataFields.has(key)) {
        unmappedFields[`metadata.${key}`] = value;
        this.preservedLegacyFields.push(`metadata.${key}`);
      }
    }

    if (Object.keys(unmappedFields).length === 0 && this.ambiguities.length === 0) {
      return undefined;
    }

    return {
      original_schema_version: 2,
      unmapped_fields: Object.keys(unmappedFields).length > 0 ? unmappedFields : undefined,
      migration_notes:
        this.ambiguities.length > 0
          ? this.ambiguities.map((a) => `${a.field}: ${a.reason}`)
          : undefined,
      requires_review: this.ambiguities.length > 0,
      review_reasons: this.ambiguities.length > 0 ? this.ambiguities.map((a) => a.reason) : undefined,
    };
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  private normalizeBoolean(value: unknown): boolean | undefined {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
      const lower = value.toLowerCase();
      if (lower === "true" || lower === "yes") return true;
      if (lower === "false" || lower === "no") return false;
    }
    return undefined;
  }

  private slugToName(slug: string): string {
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  private nameToSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }
}

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

/**
 * Normalizes a v2 treatment to v3 format
 */
export function normalizeTreatment(v2: TreatmentV2): NormalizationResult {
  const normalizer = new TreatmentNormalizer();
  return normalizer.normalize(v2);
}

/**
 * Checks if data looks like a v2 treatment
 */
export function isV2Treatment(data: unknown): data is TreatmentV2 {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    obj.kind === "treatment" &&
    typeof obj.slug === "string" &&
    typeof obj.type === "string" &&
    typeof obj.clinical_metadata === "object" &&
    Array.isArray(obj.sections)
  );
}

/**
 * Gets a treatment as v3 format, normalizing if needed
 */
export function getTreatmentAsV3(data: unknown): TreatmentV3 | null {
  if (typeof data !== "object" || data === null) return null;

  const obj = data as Record<string, unknown>;

  // Already v3
  if (obj.schema_version === 3) {
    return obj as unknown as TreatmentV3;
  }

  // Try to normalize from v2
  if (isV2Treatment(data)) {
    const result = normalizeTreatment(data);
    return result.treatment;
  }

  return null;
}
