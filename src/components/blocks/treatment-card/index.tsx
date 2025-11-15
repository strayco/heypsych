"use client";

import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils/format";
import { Entity } from "@/lib/types/database";

interface TreatmentCardProps {
  entity: Entity;
  variant?: "default" | "compact" | "detailed" | "comparison";
  showCharts?: boolean;
  onCompare?: (entity: Entity) => void;
  onLearnMore?: (entity: Entity) => void;
  className?: string;
}

export function TreatmentCard({
  entity,
  variant = "default",
  showCharts = false,
  onCompare,
  onLearnMore,
  className = "",
}: TreatmentCardProps) {
  const schema = entity.schema;
  const data = entity.data;
  const treatmentType = schema?.schema_name || "default";

  // Helper function to extract data from sections-based JSON structure
  const extractFromSections = (sectionType: string, path?: string) => {
    if (!data.sections || !Array.isArray(data.sections)) return null;

    const section = data.sections.find((s: any) => s.type === sectionType);
    if (!section) return null;

    if (path) {
      return path.split(".").reduce((obj, key) => obj?.[key], section);
    }
    return section;
  };

  // Get key metrics based on treatment type and data structure
  const getKeyMetrics = () => {
    switch (treatmentType) {
      case "medication": {
        // Try both flat structure and sections structure
        const dosingSection = extractFromSections("dosing");

        // Handle different dosing data structures
        let startDose = "N/A";
        let usualRange = "N/A";

        if (dosingSection?.adult) {
          const adult = dosingSection.adult;

          // Check if adult has nested conditions (like schizophrenia, mdd_adjunct, etc.)
          const nestedKeys = Object.keys(adult).filter(key =>
            typeof adult[key] === 'object' && adult[key] !== null &&
            !['oral', 'start', 'usual_range', 'max', 'adjustment', 'titrate'].includes(key)
          );

          if (nestedKeys.length > 0) {
            // Has nested conditions - use the first one
            const firstCondition = adult[nestedKeys[0]];
            startDose = firstCondition.start || "N/A";
            usualRange = firstCondition.usual_range || firstCondition.max || "N/A";
          } else if (adult.start) {
            // Direct start field
            startDose = adult.start;
            usualRange = adult.usual_range || adult.max || "N/A";
          } else if (adult.oral) {
            // Handle string format: "Start at 25–50 mg..."
            const oralDosing = adult.oral;

            // Extract starting dose
            const startMatch = oralDosing.match(/start\s+at\s+([^;,]+)/i);
            if (startMatch) {
              startDose = startMatch[1].trim();
            }

            // Extract usual range (maximum dose)
            const maxMatch = oralDosing.match(/(?:up to|maximum of)\s+([^;,.]+)/i);
            if (maxMatch) {
              usualRange = `Up to ${maxMatch[1].trim()}`;
            } else {
              usualRange = oralDosing;
            }
          }
        } else if (data.starting_dose) {
          startDose = data.starting_dose;
        }

        const indicationsSection = extractFromSections("indications");
        const indications = indicationsSection?.items || data.indications || [];
        const primaryIndication = Array.isArray(indications) ? indications[0] : "N/A";

        const onsetSection = extractFromSections("onset_duration");
        const onset = onsetSection?.text || data.onset || "N/A";

        return [
          { label: "Starting Dose", value: startDose },
          { label: "Usual Range", value: usualRange },
          { label: "Primary Use", value: primaryIndication },
          { label: "Onset", value: typeof onset === "string" ? onset.slice(0, 30) + "..." : onset },
        ];
      }
      case "interventional":
        // Extract session duration from metadata
        const interventionalSessionDuration = data.metadata?.session_duration || "N/A";

        // Extract treatment duration
        const interventionalTreatmentCourse = data.metadata?.treatment_duration?.[0] || "N/A";

        // Extract cost from sections
        const interventionalCostSection = extractFromSections("cost_considerations");
        const interventionalTotalCost = interventionalCostSection?.total_treatment_cost || "N/A";

        // Extract invasiveness level
        const interventionalInvasiveness = data.metadata?.invasiveness_level || "N/A";

        return [
          { label: "Session Time", value: interventionalSessionDuration },
          { label: "Course Length", value: interventionalTreatmentCourse },
          { label: "Equipment Cost", value: interventionalTotalCost },
          { label: "Invasiveness", value: interventionalInvasiveness },
        ];
      case "supplement": {
        // Extract dosing information from sections
        const dosingSection = extractFromSections("dosing");
        const supplementDose = dosingSection?.adult?.usual_range || "N/A";

        // Extract dosage forms
        const dosageFormsSection = extractFromSections("dosage_forms");
        const supplementForm = dosageFormsSection?.items?.[0] || "N/A";

        // Extract compound type from metadata
        const supplementType = data.metadata?.compound_type || "N/A";

        // Extract FDA status
        const supplementStatus = data.metadata?.fda_status || "N/A";

        return [
          { label: "Usual Dose", value: supplementDose },
          { label: "Form", value: supplementForm },
          { label: "Type", value: supplementType },
          { label: "FDA Status", value: supplementStatus },
        ];
      }
      case "therapy":
        return [
          { label: "Type", value: data.therapy_type || "N/A" },
          { label: "Sessions", value: data.typical_sessions || "N/A" },
          {
            label: "Duration",
            value: data.session_duration ? `${data.session_duration} min` : "N/A",
          },
          { label: "Format", value: data.format || "N/A" },
        ];
      case "alternative":
        // Extract session info from metadata
        const alternativeSessionDuration = data.metadata?.session_duration || "N/A";
        const alternativeTreatmentDuration = data.metadata?.treatment_duration?.[0] || "N/A";

        // Extract cost from sections
        const alternativeCostSection = extractFromSections("cost_considerations");
        const alternativeSessionCost = alternativeCostSection?.typical_session_cost || "N/A";

        // Extract evidence level from clinical metadata
        const alternativeEvidenceLevel = data.clinical_metadata?.evidence_level || "N/A";

        return [
          { label: "Session Length", value: alternativeSessionDuration },
          { label: "Treatment Course", value: alternativeTreatmentDuration },
          { label: "Session Cost", value: alternativeSessionCost },
          { label: "Evidence Level", value: alternativeEvidenceLevel },
        ];
      case "investigational":
        // Extract trial phase from metadata
        const investigationalTrialPhase = data.metadata?.trial_phase || "N/A";

        // Extract regulatory status
        const investigationalRegulatoryStatus = data.metadata?.regulatory_status || "N/A";

        // Extract session duration if available
        const investigationalSessionTime = data.metadata?.session_duration || "N/A";

        // Extract treatment duration
        const investigationalTreatmentTime = data.metadata?.treatment_duration?.[0] || "N/A";

        return [
          { label: "Trial Phase", value: investigationalTrialPhase },
          { label: "Status", value: investigationalRegulatoryStatus },
          { label: "Session Time", value: investigationalSessionTime },
          { label: "Course Length", value: investigationalTreatmentTime },
        ];
      default:
        return [];
    }
  };

  const keyMetrics = getKeyMetrics();

  // Get variant-specific styling
  const getCardVariant = () => {
    switch (variant) {
      case "compact":
        return "filled";
      case "detailed":
        return "gradient";
      case "comparison":
        return "outlined";
      default:
        return "default";
    }
  };

  const getBadgeVariant = () => {
    switch (treatmentType) {
      case "medication":
        return "medication";
      case "interventional":
        return "intervention";
      case "supplement":
        return "supplement";
      case "therapy":
        return "therapy";
      case "alternative":
        return "alternative";
      case "investigational":
        return "investigational";
      default:
        return "default";
    }
  };

  // Get description - try multiple sources
  const getDescription = () => {
    return entity.description || (entity as any).summary || data.summary || data.description || "";
  };

  // Get side effects from sections
  const getSideEffects = () => {
    const adverseSection = extractFromSections("adverse_effects");
    if (adverseSection) {
      const common = adverseSection.common || [];
      return Array.isArray(common) ? common.slice(0, 4) : [];
    }
    return data.side_effects || [];
  };

  // Get indications from sections
  const getIndications = () => {
    const indicationsSection = extractFromSections("indications");
    if (indicationsSection?.items) {
      return Array.isArray(indicationsSection.items) ? indicationsSection.items.slice(0, 3) : [];
    }
    return data.indications || [];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className={className}
      onClick={() => onLearnMore?.(entity)}
      style={{ cursor: 'pointer' }}
    >
      <Card
        variant={getCardVariant()}
        size={variant === "compact" ? "sm" : "md"}
        interactive
        className="h-full"
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <CardTitle className={`${variant === "compact" ? "text-lg" : "text-xl"} font-bold`}>
                {entity.name}
              </CardTitle>

              {/* Category/type info hidden */}

              {/* Show description if available */}
              {getDescription() && variant !== "compact" && (
                <p className="mt-2 line-clamp-2 text-sm text-neutral-800">{getDescription()}</p>
              )}
            </div>
            <Badge variant={getBadgeVariant() as any} size="sm" className="ml-3 flex-shrink-0">
              {schema?.display_name || "Treatment"}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Key Metrics Grid */}
          {variant !== "compact" && keyMetrics.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {keyMetrics.slice(0, 4).map((metric, index) => (
                <div key={index} className="min-w-0 space-y-1">
                  <p className="text-xs font-medium tracking-wide text-neutral-700 uppercase">
                    {metric.label}
                  </p>
                  <p className="text-sm font-semibold text-neutral-900 break-words line-clamp-2">{metric.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Compact metrics */}
          {variant === "compact" && keyMetrics.length > 0 && (
            <div className="flex justify-between text-xs text-neutral-800">
              <span>{keyMetrics[0]?.value}</span>
              <span>{keyMetrics[1]?.value}</span>
            </div>
          )}

          {/* Indications */}
          {variant === "detailed" && getIndications().length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-neutral-900">Primary Uses</h4>
              <div className="flex flex-wrap gap-1">
                {getIndications().map((indication: string, index: number) => (
                  <Badge key={index} variant="success" size="sm">
                    {indication}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Side Effects for medications */}
          {variant === "detailed" &&
            treatmentType === "medication" &&
            getSideEffects().length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-neutral-900">Common Side Effects</h4>
                <div className="flex flex-wrap gap-1">
                  {getSideEffects().map((effect: string, index: number) => (
                    <Badge key={index} variant="warning" size="sm">
                      {effect}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          {/* FDA Status for Interventional */}
          {treatmentType === "interventional" && data.fda_cleared_conditions && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-neutral-900">FDA Cleared For</h4>
              <div className="flex flex-wrap gap-1">
                {data.fda_cleared_conditions.map((condition: string) => (
                  <Badge key={condition} variant="success" size="sm">
                    {condition}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Learn More Button */}
          <div className="pt-3">
            <Button
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onLearnMore?.(entity);
              }}
            >
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
