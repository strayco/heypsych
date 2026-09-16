/**
 * Practice Header
 *
 * Shows the practice title, subtitle, and summary stats.
 * "Build your practice" / "We've started with the essentials"
 * "7 components · 4 decisions left · ~$0/mo"
 */

"use client";

import { motion } from "framer-motion";

interface PracticeHeaderProps {
  /** Number of components in the practice */
  componentCount: number;
  /** Number of decisions remaining */
  decisionsLeft: number;
  /** Estimated monthly cost in cents (null if unknown) */
  estimatedCostCents: number | null;
  /** Number of solutions selected */
  solutionCount: number;
  /** Whether the practice is complete */
  isComplete: boolean;
  /** Practice profile summary (e.g., "Solo Psychiatry · Cash Pay") */
  profileSummary?: string;
}

export function PracticeHeader({
  componentCount,
  decisionsLeft,
  estimatedCostCents,
  solutionCount,
  isComplete,
  profileSummary,
}: PracticeHeaderProps) {
  const formatCost = (cents: number | null): string => {
    if (cents === null || cents === 0) return "$0";
    return `~$${Math.round(cents / 100)}`;
  };

  return (
    <header className="mb-8 text-center">
      {/* Main title */}
      <motion.h1
        className="text-3xl font-bold tracking-tight text-label-primary sm:text-4xl"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        Build your practice
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        className="mt-2 text-label-secondary"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        We've started with the essentials.
      </motion.p>

      {/* Summary bar */}
      <motion.div
        className="mt-6 inline-flex flex-col items-center gap-1"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {/* Profile summary if available */}
        {profileSummary && (
          <p className="text-sm font-medium text-label-primary">
            {profileSummary}
          </p>
        )}

        {/* Stats summary */}
        <div className="flex items-center gap-2 text-sm text-label-secondary">
          {/* Solution/Component count */}
          <span className="font-medium">
            {solutionCount > 0
              ? `${solutionCount} ${solutionCount === 1 ? "tool" : "tools"}`
              : `${componentCount} components`}
          </span>

          <span className="text-separator-opaque">·</span>

          {/* Decisions left or complete */}
          {isComplete ? (
            <span className="font-medium text-positive">
              Everything essential is covered
            </span>
          ) : (
            <span>
              <span className="font-semibold text-label-primary">
                {decisionsLeft}
              </span>{" "}
              {decisionsLeft === 1 ? "decision" : "decisions"} left
            </span>
          )}

          <span className="text-separator-opaque">·</span>

          {/* Cost estimate */}
          <span>
            Estimated cost:{" "}
            <span className="font-medium text-label-primary">
              {formatCost(estimatedCostCents)}/mo
            </span>
          </span>
        </div>
      </motion.div>
    </header>
  );
}
