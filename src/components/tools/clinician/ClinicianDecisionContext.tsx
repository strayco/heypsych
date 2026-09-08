"use client";

import { Scale, DollarSign, Building2 } from "lucide-react";
import type { ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";
import { getRoleLabel, getSettingLabel } from "@/lib/schemas/clinician-tool-v4";

interface ClinicianDecisionContextProps {
  tool: ClinicianToolV4;
}

/**
 * ClinicianDecisionContext Component
 *
 * Phase 4: Provides decision-first context for clinician tools including:
 * - Practice fit summary
 * - Cost considerations (beyond sticker price)
 * - Key tradeoffs
 *
 * Helps clinicians make informed purchasing decisions.
 */
export function ClinicianDecisionContext({ tool }: ClinicianDecisionContextProps) {
  // Build practice fit summary
  const practiceFitItems: string[] = [];

  // Size fit
  if (tool.audiences?.organization_sizes?.length) {
    const sizes = tool.audiences.organization_sizes;
    if (sizes.includes("solo") && sizes.includes("small-2-10")) {
      practiceFitItems.push("Solo and small practices");
    } else if (sizes.includes("solo")) {
      practiceFitItems.push("Solo practices");
    } else if (sizes.includes("enterprise-200-plus") || sizes.includes("large-51-200")) {
      practiceFitItems.push("Larger organizations");
    }
  }

  // Settings
  if (tool.audiences?.practice_settings?.length) {
    const settings = tool.audiences.practice_settings.slice(0, 2);
    practiceFitItems.push(settings.map(getSettingLabel).join(", "));
  }

  // Roles
  if (tool.audiences?.clinician_roles?.length) {
    const roles = tool.audiences.clinician_roles.slice(0, 2);
    practiceFitItems.push(roles.map(getRoleLabel).join(", "));
  }

  // Build cost considerations
  const costItems: string[] = [];

  if (tool.pricing?.quote_required) {
    costItems.push("Custom pricing - contact vendor");
  }
  if (tool.pricing?.model === "per-provider-month" || tool.pricing?.model === "per-provider-year") {
    costItems.push("Per-provider pricing model");
  }
  if (tool.pricing?.model === "enterprise-custom") {
    costItems.push("Enterprise pricing - contact vendor");
  }
  if (!tool.pricing?.free_tier && !tool.pricing?.free_trial_days) {
    costItems.push("No free trial available");
  }

  // Build considerations/tradeoffs
  const considerations: string[] = [];

  // Integration complexity
  if (!tool.integrations?.length) {
    considerations.push("No listed EHR integrations");
  }

  // Compliance gaps
  if (tool.compliance?.baa_available !== "yes") {
    considerations.push("Verify BAA availability before HIPAA use");
  }

  // Don't render if nothing meaningful to show
  if (practiceFitItems.length === 0 && costItems.length === 0 && considerations.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-separator bg-surface p-4 mb-6">
      <h3 className="text-sm font-semibold text-label-primary mb-4">Decision Summary</h3>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Practice Fit */}
        {practiceFitItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="h-4 w-4 text-label-tertiary" />
              <span className="text-xs font-medium text-label-tertiary uppercase tracking-wide">
                Fits
              </span>
            </div>
            <ul className="space-y-1">
              {practiceFitItems.slice(0, 2).map((item, i) => (
                <li key={i} className="text-xs text-label-secondary">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cost Considerations */}
        {costItems.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-label-tertiary" />
              <span className="text-xs font-medium text-label-tertiary uppercase tracking-wide">
                Cost Notes
              </span>
            </div>
            <ul className="space-y-1">
              {costItems.slice(0, 2).map((item, i) => (
                <li key={i} className="text-xs text-label-secondary">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Considerations */}
        {considerations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Scale className="h-4 w-4 text-label-tertiary" />
              <span className="text-xs font-medium text-label-tertiary uppercase tracking-wide">
                Consider
              </span>
            </div>
            <ul className="space-y-1">
              {considerations.slice(0, 2).map((item, i) => (
                <li key={i} className="text-xs text-label-secondary">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClinicianDecisionContext;
