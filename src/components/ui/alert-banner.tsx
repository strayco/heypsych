"use client";

/**
 * AlertBanner Component
 *
 * Alert banner for critical warnings and safety information
 * Features attention-grabbing animations and sticky positioning
 *
 * Design: Light-first with semantic color system
 */

import React from "react";
import { motion } from "framer-motion";
import { AlertOctagon, AlertTriangle, Info } from "lucide-react";
import { getColorClasses, UIHints } from "@/lib/ui/apple-design-system";
import { ParsedContent } from "./parsed-content";
import { cn } from "@/lib/utils";

interface AlertBannerProps {
  title?: string;
  message: string;
  items?: string[];
  severity?: 'critical' | 'warning' | 'info';
  uiHints?: UIHints;
  className?: string;
}

export function AlertBanner({
  title,
  message,
  items,
  severity = 'warning',
  uiHints,
  className = ""
}: AlertBannerProps) {
  const isSticky = uiHints?.sticky;

  const Icon = severity === 'critical' ? AlertOctagon : severity === 'warning' ? AlertTriangle : Info;

  // Light-first severity styles with semantic tokens
  const severityStyles = {
    critical: 'bg-negative-tint border-negative-border',
    warning: 'bg-caution-tint border-caution-border',
    info: 'bg-accent-tint border-accent-border'
  };

  const severityIconColors = {
    critical: 'text-negative',
    warning: 'text-caution',
    info: 'text-accent'
  };

  const severityTitleColors = {
    critical: 'text-negative-700',
    warning: 'text-caution-700',
    info: 'text-accent-700'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "rounded-2xl border p-5 shadow-subtle",
        severityStyles[severity],
        isSticky && "sticky top-4 z-20",
        uiHints?.animation === 'attention_pulse' && "animate-pulse",
        className
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className={cn("shrink-0", severityIconColors[severity])}
        >
          <Icon className="h-6 w-6" strokeWidth={2} />
        </motion.div>

        {/* Content */}
        <div className="flex-1 space-y-2">
          {title && (
            <h3 className={cn("text-lg font-semibold", severityTitleColors[severity])}>
              {title}
            </h3>
          )}

          <div className={cn(
            "text-sm leading-relaxed",
            severity === 'critical' ? 'text-negative-700 font-medium' : 'text-label-secondary'
          )}>
            <ParsedContent content={message} />
          </div>

          {items && items.length > 0 && (
            <ul className="space-y-2 mt-3">
              {items.map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-start gap-2"
                >
                  <span className={cn("mt-0.5 font-bold", severityIconColors[severity])}>→</span>
                  <ParsedContent content={item} className="flex-1 text-label-secondary text-sm" />
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
}
