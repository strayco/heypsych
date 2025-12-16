"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CollapsibleSectionProps {
  children: React.ReactNode;
  defaultExpanded?: boolean;
  showToggle?: boolean;
  toggleLabel?: {
    expanded: string;
    collapsed: string;
  };
  className?: string;
}

/**
 * Shared collapsible section component for consistent UX
 * Provides smooth transitions and mobile-optimized buttons
 */
export function CollapsibleSection({
  children,
  defaultExpanded = true,
  showToggle = false,
  toggleLabel = {
    expanded: "Show less",
    collapsed: "Show more",
  },
  className = "",
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (!showToggle) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={{
              expanded: { height: "auto", opacity: 1 },
              collapsed: { height: 0, opacity: 0 },
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-4 flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 underline focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1 -ml-2 min-h-[44px] min-w-[44px] touch-manipulation"
        aria-expanded={isExpanded}
        aria-controls="collapsible-content"
      >
        <span>{isExpanded ? toggleLabel.expanded : toggleLabel.collapsed}</span>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="inline-block"
        >
          ▼
        </motion.span>
      </button>
      {!isExpanded && (
        <div className="mt-4 text-sm text-neutral-500 italic">
          {toggleLabel.collapsed} to see full content
        </div>
      )}
    </div>
  );
}

/**
 * Utility to generate section ID from section type
 * Converts "patient_experience" → "patient-experience"
 */
export function getSectionId(type: string): string {
  return type.toLowerCase().replace(/_/g, "-");
}











