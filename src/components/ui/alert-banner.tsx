"use client";

/**
 * AlertBanner Component
 *
 * Apple-style alert banner for critical warnings and safety information
 * Features attention-grabbing animations and sticky positioning
 */

import React from "react";
import { motion } from "framer-motion";
import { AlertOctagon, AlertTriangle, Info } from "lucide-react";
import { getColorClasses, UIHints } from "@/lib/ui/apple-design-system";
import { ParsedContent } from "./parsed-content";

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
  const colors = getColorClasses(
    uiHints?.color || (severity === 'critical' ? '#FF3B30' : severity === 'warning' ? '#FF9500' : '#007AFF')
  );

  const Icon = severity === 'critical' ? AlertOctagon : severity === 'warning' ? AlertTriangle : Info;

  const severityStyles = {
    critical: 'bg-gradient-to-br from-red-50 to-red-100 border-red-500 shadow-red-200',
    warning: 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-400 shadow-amber-200',
    info: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 shadow-blue-200'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{
        opacity: 1,
        y: 0
      }}
      className={`
        rounded-2xl
        border-2
        ${severityStyles[severity]}
        p-6
        shadow-lg
        ${isSticky ? 'sticky top-4 z-20' : ''}
        ${uiHints?.animation === 'attention_pulse' ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className={`flex-shrink-0 ${colors.text}`}
        >
          <Icon className="h-8 w-8" strokeWidth={2} />
        </motion.div>

        {/* Content */}
        <div className="flex-1 space-y-3">
          {title && (
            <h3 className={`text-xl font-bold ${colors.text}`}>
              {title}
            </h3>
          )}

          <div className={`text-base leading-relaxed ${severity === 'critical' ? 'text-red-900 font-semibold' : 'text-neutral-800'}`}>
            <ParsedContent content={message} />
          </div>

          {items && items.length > 0 && (
            <ul className="space-y-2 mt-4">
              {items.map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-start gap-2"
                >
                  <span className={`mt-1 ${colors.text} font-bold`}>→</span>
                  <ParsedContent content={item} className="flex-1 text-neutral-800" />
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
}
