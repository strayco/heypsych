/**
 * Component Card
 *
 * Displays a single practice component with its current state.
 * Four states: unresolved, covered, already-handled, not-needed
 */

"use client";

import { motion } from "framer-motion";
import { Check, ArrowRight, X, AlertTriangle } from "lucide-react";
import type { ComponentState, ComponentId } from "@/domains/architect/schemas/practice-v2";
import {
  COMPONENT_DEFINITIONS,
  type ComponentDefinition,
} from "@/domains/architect/component-mapping";

interface ComponentCardProps {
  componentId: ComponentId;
  state: ComponentState;
  /** Zone color for styling (e.g., "blue", "rose", "emerald", "amber") */
  zoneColor: string;
  /** Solution name to display (if covered) */
  solutionName?: string;
  /** Number of solutions that cover this component (for overlap warning) */
  overlapCount?: number;
  /** Whether this card is being animated as part of a cascade */
  animateResolve?: boolean;
  /** Animation delay for cascade effect */
  animationDelay?: number;
  /** Click handler */
  onClick: () => void;
}

const colorClasses: Record<
  string,
  { border: string; bg: string; icon: string; text: string }
> = {
  blue: {
    border: "border-blue-200 hover:border-blue-300",
    bg: "bg-blue-50",
    icon: "bg-blue-100 text-blue-600",
    text: "text-blue-700",
  },
  rose: {
    border: "border-rose-200 hover:border-rose-300",
    bg: "bg-rose-50",
    icon: "bg-rose-100 text-rose-600",
    text: "text-rose-700",
  },
  emerald: {
    border: "border-emerald-200 hover:border-emerald-300",
    bg: "bg-emerald-50",
    icon: "bg-emerald-100 text-emerald-600",
    text: "text-emerald-700",
  },
  amber: {
    border: "border-amber-200 hover:border-amber-300",
    bg: "bg-amber-50",
    icon: "bg-amber-100 text-amber-600",
    text: "text-amber-700",
  },
};

export function ComponentCard({
  componentId,
  state,
  zoneColor,
  solutionName,
  overlapCount = 0,
  animateResolve = false,
  animationDelay = 0,
  onClick,
}: ComponentCardProps) {
  const definition = COMPONENT_DEFINITIONS[componentId];
  const colors = colorClasses[zoneColor] ?? colorClasses.blue;
  const Icon = definition.icon;

  const isResolved = state.status !== "unresolved";
  const isCovered = state.status === "covered";
  const isHandled = state.status === "already-handled";
  const isNotNeeded = state.status === "not-needed";
  const hasOverlap = overlapCount > 1;

  // Determine display content based on state
  const getStateContent = () => {
    switch (state.status) {
      case "covered": {
        // Use provided solution name, or fallback to formatting slug
        const displayName = solutionName ?? state.solutionSlug.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
        return (
          <span className="flex items-center gap-1 text-sm font-medium text-positive">
            <Check className="h-3.5 w-3.5" />
            {/* Show solution name - truncate if long */}
            <span className="truncate max-w-[120px]">
              {displayName}
            </span>
          </span>
        );
      }
      case "already-handled":
        return (
          <span className="flex items-center gap-1 text-sm text-label-secondary">
            <Check className="h-3.5 w-3.5 text-positive" />
            {state.provider ? (
              <span className="truncate max-w-[120px]">{state.provider}</span>
            ) : (
              "Already handled"
            )}
          </span>
        );
      case "not-needed":
        return (
          <span className="flex items-center gap-1 text-sm text-label-tertiary">
            <X className="h-3.5 w-3.5" />
            Not needed
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-sm text-label-secondary group-hover:text-accent">
            Recommend one
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        );
    }
  };

  return (
    <motion.button
      className={`
        group relative flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all
        ${isNotNeeded ? "opacity-50" : ""}
        ${
          isResolved
            ? "border-separator bg-surface"
            : `${colors.border} ${colors.bg}`
        }
        hover:shadow-soft
        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2
      `}
      onClick={onClick}
      initial={animateResolve ? { scale: 1 } : false}
      animate={
        animateResolve
          ? {
              scale: [1, 1.02, 1],
              transition: {
                delay: animationDelay,
                duration: 0.3,
                ease: "easeOut",
              },
            }
          : {}
      }
    >
      {/* Icon */}
      <div
        className={`
          flex h-10 w-10 shrink-0 items-center justify-center rounded-lg
          ${isResolved ? "bg-fill-secondary text-label-secondary" : colors.icon}
          transition-colors
        `}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <h3
          className={`
            text-sm font-semibold
            ${isNotNeeded ? "text-label-tertiary line-through" : "text-label-primary"}
          `}
        >
          {definition.name}
        </h3>
        {getStateContent()}
      </div>

      {/* Overlap warning badge */}
      {hasOverlap && !animateResolve && (
        <div
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white"
          title={`${overlapCount} tools overlap on this`}
        >
          <span className="text-[10px] font-bold">{overlapCount}</span>
        </div>
      )}

      {/* Resolved indicator for cascade animation */}
      {animateResolve && isCovered && (
        <motion.div
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-positive text-white"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: animationDelay + 0.1, duration: 0.2, type: "spring" }}
        >
          <Check className="h-3 w-3" />
        </motion.div>
      )}
    </motion.button>
  );
}

/**
 * Compact variant for mobile or dense layouts.
 */
export function ComponentCardCompact({
  componentId,
  state,
  onClick,
}: {
  componentId: ComponentId;
  state: ComponentState;
  onClick: () => void;
}) {
  const definition = COMPONENT_DEFINITIONS[componentId];
  const Icon = definition.icon;
  const isResolved = state.status !== "unresolved";

  return (
    <button
      className={`
        flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all
        ${isResolved ? "border-separator bg-surface" : "border-separator bg-surface hover:border-accent hover:bg-accent/5"}
        focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1
      `}
      onClick={onClick}
    >
      <Icon className="h-4 w-4 text-label-secondary" />
      <span className="text-sm font-medium text-label-primary">
        {definition.name}
      </span>
      {isResolved && <Check className="ml-auto h-4 w-4 text-positive" />}
      {!isResolved && <ArrowRight className="ml-auto h-4 w-4 text-label-tertiary" />}
    </button>
  );
}
