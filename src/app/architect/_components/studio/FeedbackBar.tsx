/**
 * FeedbackBar Component
 *
 * Simple, ambient feedback that shows cost and status.
 * NOT a metrics dashboard - just helpful context as you build.
 */

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign } from "lucide-react";
import type { CostEstimate, StackHealthResult } from "@/domains/architect/schemas";

interface FeedbackBarProps {
  /** Number of tools placed */
  toolCount: number;
  /** Total zones/slots in the build */
  totalSlots: number;
  /** Number of slots that are filled */
  filledSlots: number;
  /** Cost calculation result */
  costResult: CostEstimate;
  /** Health calculation result */
  healthResult: StackHealthResult;
  /** Number of tool integrations */
  integrationCount?: number;
  /** Warning messages to display */
  warnings?: string[];
  /** Whether the build is complete */
  isComplete?: boolean;
}

export function FeedbackBar({
  toolCount,
  costResult,
  isComplete = false,
}: FeedbackBarProps) {
  // Format monthly cost
  const costDisplay = useMemo(() => {
    if (!costResult.knownMinMonthlyCents) return null;

    const min = Math.round(costResult.knownMinMonthlyCents / 100);
    const max = costResult.knownMaxMonthlyCents
      ? Math.round(costResult.knownMaxMonthlyCents / 100)
      : null;

    if (max && max !== min) {
      return `$${min}–$${max}`;
    }
    return `$${min}`;
  }, [costResult]);

  // Don't show anything if no tools placed
  if (toolCount === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-center gap-6 py-4"
    >
      {/* Tool count */}
      <div className="text-sm text-label-secondary">
        <span className="font-semibold text-label-primary">{toolCount}</span>
        {" "}tool{toolCount !== 1 ? "s" : ""} in your stack
      </div>

      {/* Divider */}
      {costDisplay && <div className="w-px h-4 bg-slate-200" />}

      {/* Cost estimate */}
      {costDisplay && (
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-emerald-600" />
          <span className="font-semibold text-label-primary">{costDisplay}</span>
          <span className="text-label-tertiary">/mo estimated</span>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Compact version for mobile
 */
export function FeedbackBarCompact({
  toolCount,
  costResult,
}: Pick<FeedbackBarProps, "toolCount" | "costResult">) {
  const costDisplay = useMemo(() => {
    if (!costResult.knownMinMonthlyCents) return null;
    const min = Math.round(costResult.knownMinMonthlyCents / 100);
    return `$${min}`;
  }, [costResult]);

  if (toolCount === 0) return null;

  return (
    <div className="flex items-center justify-center gap-4 py-3 text-sm text-label-secondary">
      <span>
        <span className="font-medium text-label-primary">{toolCount}</span> tools
      </span>
      {costDisplay && (
        <>
          <span>•</span>
          <span className="font-medium text-emerald-600">{costDisplay}/mo</span>
        </>
      )}
    </div>
  );
}
