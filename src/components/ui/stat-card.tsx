"use client";

/**
 * StatCard Component
 *
 * Apple-style statistic card with animated number counter
 * Used for efficacy percentages, response rates, etc.
 *
 * Features:
 * - Large, animated numbers with count-up effect
 * - Visual comparison bars
 * - NNT badges
 * - Gradient backgrounds
 * - SF Pro typography
 */

import React from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { TrendingUp, TrendingDown, Activity, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { getColorClasses, getStatNumberSize, UIHints } from "@/lib/ui/apple-design-system";
import { ParsedContent } from "./parsed-content";

interface Citation {
  authors: string;
  title: string;
  journal: string;
  year: number;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  pmid?: string;
}

interface StatCardProps {
  metric?: string;
  value: string;
  comparison?: string;
  nnt?: number;
  description?: string;
  clinicalDetails?: string;
  citation?: Citation;
  uiHints?: UIHints;
  className?: string;
}

export function StatCard({
  metric,
  value,
  comparison,
  nnt,
  description,
  clinicalDetails,
  citation,
  uiHints,
  className = ""
}: StatCardProps) {
  const [showDetails, setShowDetails] = React.useState(false);
  const colors = getColorClasses(uiHints?.color || '#34C759');
  const numberSize = getStatNumberSize(uiHints?.visual_priority || 'high');

  // Extract numeric value for animation
  // Only treat as numeric if it's a pure number (optionally with %)
  // Examples: "71%", "50", "2" → numeric (animate)
  // Examples: "2.7× more effective", "Effective", "≈60-70%" → text (no animation)
  const isPureNumeric = /^\d+%?$/.test(value.trim());
  const numericMatch = value.match(/(\d+)/);
  const numericValue = isPureNumeric && numericMatch ? parseInt(numericMatch[1]) : null;
  const isNumeric = numericValue !== null;

  // Animated counter using Framer Motion (only for numeric values)
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [displayValue, setDisplayValue] = React.useState(isNumeric ? "0" : value);

  React.useEffect(() => {
    // Skip animation for non-numeric values
    if (!isNumeric) {
      setDisplayValue(value);
      return;
    }

    const controls = animate(count, numericValue, {
      duration: 2,
      ease: "easeOut"
    });

    const unsubscribe = rounded.on("change", (latest) => {
      // Preserve the original format (e.g., "50%" stays as percentage)
      if (value.includes("%")) {
        setDisplayValue(`${latest}%`);
      } else {
        setDisplayValue(latest.toString());
      }
    });

    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [numericValue, value, count, rounded, isNumeric]);

  // Extract comparison numeric value
  const comparisonNumeric = comparison?.match(/(\d+)/)?.[1];
  const comparisonValue = comparisonNumeric ? parseInt(comparisonNumeric) : 0;

  // Calculate bar widths for visual comparison (only for numeric values)
  const mainBarWidth = numericValue || 0;
  const comparisonBarWidth = comparisonValue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`
        rounded-2xl
        bg-gradient-to-br from-green-50 via-emerald-50 to-green-100
        border-2 border-positive-border
        p-6 sm:p-8
        shadow-lg hover:shadow-xl
        transition-shadow duration-300
        ${className}
      `}
    >
      {/* Metric Label */}
      {metric && (
        <p className="text-xs sm:text-sm font-semibold uppercase tracking-wide text-positive-700 mb-3">
          {metric}
        </p>
      )}

      {/* Main Statistic */}
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-4 mb-6">
        <motion.span
          className={`${numberSize} text-green-800 leading-none tabular-nums`}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {displayValue}
        </motion.span>

        {comparison && (
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            <span className="text-base sm:text-lg text-label-secondary font-medium">
              vs {comparison}
            </span>
          </div>
        )}
      </div>

      {/* Visual Comparison Bars (only for numeric values) */}
      {isNumeric && comparison && comparisonValue > 0 && (
        <div className="space-y-2 mb-6">
          {/* Main value bar */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-green-800 w-20">Active</span>
            <div className="flex-1 h-8 bg-white rounded-lg overflow-hidden border border-positive-border">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-end px-3"
                initial={{ width: 0 }}
                animate={{ width: `${mainBarWidth}%` }}
                transition={{ duration: 1.5, delay: 0.5 }}
              >
                <span className="text-xs font-bold text-white">{value}</span>
              </motion.div>
            </div>
          </div>

          {/* Comparison bar */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-label-tertiary w-20">Placebo</span>
            <div className="flex-1 h-8 bg-white rounded-lg overflow-hidden border border-separator">
              <motion.div
                className="h-full bg-gradient-to-r from-neutral-300 to-neutral-400 flex items-center justify-end px-3"
                initial={{ width: 0 }}
                animate={{ width: `${comparisonBarWidth}%` }}
                transition={{ duration: 1.5, delay: 0.7 }}
              >
                <span className="text-xs font-bold text-label-secondary">{comparison}</span>
              </motion.div>
            </div>
          </div>
        </div>
      )}

      {/* NNT Badge */}
      {nnt && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.2 }}
          className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md mb-4"
        >
          <Activity className="h-4 w-4" />
          <span>NNT = {nnt}</span>
        </motion.div>
      )}

      {/* Description */}
      {description && (
        <div className="text-sm sm:text-base text-label-secondary leading-relaxed">
          <ParsedContent content={description} />
        </div>
      )}

      {/* Collapsible Clinical Details */}
      {(clinicalDetails || citation) && (
        <div className="mt-6 border-t border-positive-border pt-4">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm font-medium text-positive-700 hover:text-green-800 transition-colors w-full text-left"
          >
            <FileText className="h-4 w-4" />
            <span>Clinical Details</span>
            {showDetails ? (
              <ChevronUp className="h-4 w-4 ml-auto" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-auto" />
            )}
          </button>

          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 space-y-4"
            >
              {/* Study Details */}
              {clinicalDetails && (
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-positive-700 mb-2">
                    Study Summary
                  </h4>
                  <p className="text-sm text-label-secondary leading-relaxed">
                    {clinicalDetails}
                  </p>
                </div>
              )}

              {/* Citation */}
              {citation && (
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-positive-700 mb-2">
                    Reference
                  </h4>
                  <div className="text-sm text-label-secondary space-y-1">
                    <p className="font-medium">{citation.authors}</p>
                    <p className="italic">{citation.title}</p>
                    <p>
                      {citation.journal}. {citation.year}
                      {citation.volume && `;${citation.volume}`}
                      {citation.issue && `(${citation.issue})`}
                      {citation.pages && `:${citation.pages}`}.
                    </p>
                    {(citation.doi || citation.pmid) && (
                      <div className="flex flex-wrap gap-3 mt-2">
                        {citation.doi && (
                          <a
                            href={`https://doi.org/${citation.doi}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent hover:text-accent-700 hover:underline"
                          >
                            DOI: {citation.doi}
                          </a>
                        )}
                        {citation.pmid && (
                          <a
                            href={`https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-accent hover:text-accent-700 hover:underline"
                          >
                            PMID: {citation.pmid}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
