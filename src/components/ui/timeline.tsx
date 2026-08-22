"use client";

/**
 * Timeline Component
 *
 * Apple-style visual timeline for onset/duration information
 * Shows progression over time with connected nodes
 */

import React from "react";
import { motion } from "framer-motion";
import { Clock, Circle } from "lucide-react";
import { getColorClasses, UIHints } from "@/lib/ui/apple-design-system";
import { ParsedContent } from "./parsed-content";

interface TimelineItem {
  time: string;
  label: string;
  description?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  intro?: string;
  uiHints?: UIHints;
  className?: string;
}

export function Timeline({
  items,
  intro,
  uiHints,
  className = ""
}: TimelineProps) {
  const colors = getColorClasses(uiHints?.color || '#007AFF');

  return (
    <div className={`space-y-6 ${className}`}>
      {intro && (
        <p className="text-label-secondary leading-relaxed">
          <ParsedContent content={intro} />
        </p>
      )}

      <div className="relative pl-8">
        {/* Vertical Line */}
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: '100%' }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`absolute left-[15px] top-0 w-0.5 ${colors.bg} opacity-30`}
        />

        {/* Timeline Items */}
        <div className="space-y-8">
          {items.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 * index, duration: 0.5 }}
              className="relative"
            >
              {/* Node */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 * index + 0.3, type: "spring", stiffness: 200 }}
                className={`absolute -left-[23px] top-1 flex items-center justify-center w-8 h-8 rounded-full ${colors.bg} shadow-lg`}
              >
                <Circle className="h-3 w-3 text-white fill-current" />
              </motion.div>

              {/* Content */}
              <div className="bg-white rounded-xl border-2 border-separator p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-baseline gap-3 mb-2">
                  <Clock className={`h-4 w-4 ${colors.text} flex-shrink-0 mt-0.5`} />
                  <span className={`text-sm font-bold uppercase tracking-wide ${colors.text}`}>
                    {item.time}
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-label-primary mb-1">
                  {item.label}
                </h4>
                {item.description && (
                  <p className="text-label-secondary leading-relaxed">
                    <ParsedContent content={item.description} />
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
