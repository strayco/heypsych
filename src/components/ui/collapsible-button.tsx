"use client";

import React from "react";
import { motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface CollapsibleButtonProps {
  isExpanded: boolean;
  onToggle: () => void;
  labelExpanded: string;
  labelCollapsed: string;
  className?: string;
  variant?: "default" | "neutral" | "subtle";
}

/**
 * Shared collapsible button component with Apple-like smoothness
 * - Smooth animations (200-240ms easing)
 * - Rotating chevron (180°)
 * - Touch-friendly hit target (≥44×44px)
 * - Consistent styling across all sections
 */
export function CollapsibleButton({
  isExpanded,
  onToggle,
  labelExpanded,
  labelCollapsed,
  className = "",
  variant = "default",
}: CollapsibleButtonProps) {
  const variantStyles = {
    default: "text-blue-600 hover:text-blue-700",
    neutral: "text-neutral-600 hover:text-neutral-700",
    subtle: "text-neutral-500 hover:text-neutral-600",
  };

  return (
    <button
      onClick={onToggle}
      className={`
        flex items-center gap-2
        text-sm font-medium
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        rounded-md px-2 py-1 -ml-2
        min-h-[44px] min-w-[44px]
        touch-manipulation
        ${variantStyles[variant]}
        ${className}
      `}
      aria-expanded={isExpanded}
      aria-label={isExpanded ? labelExpanded : labelCollapsed}
    >
      <span>{isExpanded ? labelExpanded : labelCollapsed}</span>
      <motion.span
        animate={{ rotate: isExpanded ? 180 : 0 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        className="inline-flex items-center"
      >
        <ChevronDown className="h-4 w-4" strokeWidth={2.5} />
      </motion.span>
    </button>
  );
}

interface CollapsibleContentProps {
  isExpanded: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Animated collapsible content wrapper
 * Smoothly expands/collapses with no layout shift
 */
export function CollapsibleContent({
  isExpanded,
  children,
  className = "",
}: CollapsibleContentProps) {
  return (
    <motion.div
      initial={false}
      animate={{
        height: isExpanded ? "auto" : 0,
        opacity: isExpanded ? 1 : 0,
      }}
      transition={{
        duration: 0.24,
        ease: [0.4, 0, 0.2, 1], // Custom easing for Apple-like feel
      }}
      style={{ overflow: "hidden" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}














