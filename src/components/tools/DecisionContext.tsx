"use client";

import { AlertCircle, Beaker, HelpCircle, Scale } from "lucide-react";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";

interface DecisionContextProps {
  tool: DigitalToolV3;
}

/**
 * DecisionContext Component
 *
 * Phase 4: Provides decision-first context including:
 * - Evidence quality indicator
 * - Key tradeoffs and considerations
 * - Uncertainty disclosure (what we don't know)
 *
 * This helps users make informed decisions by surfacing
 * both strengths and limitations upfront.
 */
export function DecisionContext({ tool }: DecisionContextProps) {
  const evidenceLevel = tool.clinical_metadata?.evidence_level;
  const hasEvidence = tool.clinical_metadata?.evidence_based;

  // Gather uncertainty items - things we don't know or can't verify
  const uncertainties: string[] = [];

  if (tool.privacy.grade === "unknown") {
    uncertainties.push("Privacy practices have not been independently verified");
  }
  if (tool.privacy.hipaa_compliant === "unknown" || tool.privacy.hipaa_compliant === undefined) {
    uncertainties.push("HIPAA compliance status is unverified");
  }
  if (!hasEvidence && !evidenceLevel) {
    uncertainties.push("Clinical effectiveness has not been independently studied");
  }
  if (evidenceLevel === "emerging" || evidenceLevel === "low") {
    uncertainties.push("Clinical evidence is limited or still emerging");
  }

  // Key tradeoffs based on tool attributes
  const tradeoffs: string[] = [];

  // Cost tradeoff
  if (tool.pricing.model === "subscription" && !tool.pricing.free_tier) {
    tradeoffs.push("Requires ongoing subscription with no free option");
  }
  if (tool.pricing.insurance_accepted === false) {
    tradeoffs.push("Not covered by insurance");
  }

  // Platform tradeoff
  if (!tool.platforms.ios && !tool.platforms.android) {
    tradeoffs.push("No mobile app available");
  }
  if (!tool.platforms.web) {
    tradeoffs.push("Requires app download - no web version");
  }

  // Support level consideration
  if (tool.support_level === "self-help") {
    tradeoffs.push("Self-guided only - no direct professional support");
  }

  // Don't render if nothing to show
  if (uncertainties.length === 0 && tradeoffs.length === 0 && !evidenceLevel) {
    return null;
  }

  return (
    <section className="border-b border-separator bg-canvas">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {/* Evidence Quality */}
          <div className="rounded-xl border border-separator bg-surface p-4">
            <div className="flex items-center gap-2 mb-2">
              <Beaker className="h-4 w-4 text-label-tertiary" />
              <h3 className="text-sm font-medium text-label-primary">Evidence</h3>
            </div>
            <div className="flex items-center gap-2">
              <EvidenceBadge level={evidenceLevel} hasClinicalTrials={hasEvidence} />
            </div>
            {hasEvidence && (
              <p className="mt-2 text-xs text-label-tertiary">
                Has published research
              </p>
            )}
          </div>

          {/* Key Tradeoffs */}
          {tradeoffs.length > 0 && (
            <div className="rounded-xl border border-separator bg-surface p-4">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="h-4 w-4 text-label-tertiary" />
                <h3 className="text-sm font-medium text-label-primary">Consider</h3>
              </div>
              <ul className="space-y-1">
                {tradeoffs.slice(0, 2).map((item, i) => (
                  <li key={i} className="text-xs text-label-secondary flex items-start gap-1.5">
                    <span className="text-label-quaternary mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Uncertainty Disclosure */}
          {uncertainties.length > 0 && (
            <div className="rounded-xl border border-separator bg-surface p-4">
              <div className="flex items-center gap-2 mb-2">
                <HelpCircle className="h-4 w-4 text-label-tertiary" />
                <h3 className="text-sm font-medium text-label-primary">Unknown</h3>
              </div>
              <ul className="space-y-1">
                {uncertainties.slice(0, 2).map((item, i) => (
                  <li key={i} className="text-xs text-label-secondary flex items-start gap-1.5">
                    <span className="text-label-quaternary mt-0.5">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function EvidenceBadge({
  level,
  hasClinicalTrials,
}: {
  level?: string;
  hasClinicalTrials?: boolean;
}) {
  if (level === "high") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-positive-700 bg-positive-tint px-2 py-1 rounded">
        Strong evidence
      </span>
    );
  }
  if (level === "moderate") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-700 bg-accent-tint px-2 py-1 rounded">
        Moderate evidence
      </span>
    );
  }
  if (level === "low" || level === "emerging") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-warning-700 bg-warning-tint px-2 py-1 rounded">
        Limited evidence
      </span>
    );
  }
  if (hasClinicalTrials) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-label-secondary bg-fill-tertiary px-2 py-1 rounded">
        Research available
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-label-tertiary bg-fill-quaternary px-2 py-1 rounded">
      Not yet studied
    </span>
  );
}

export default DecisionContext;
