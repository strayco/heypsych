"use client";

import React from "react";
import { ParsedContent } from "./parsed-content";

interface FastFactsProps {
  onsetSection?: {
    key_points?: string[];
  };
  efficacySection?: {
    metric?: string;
    value?: string;
    comparison?: string;
  };
  warningsSection?: {
    highlight?: string;
  };
}

/**
 * Fast Facts Strip Component
 * Displays key numbers (onset, efficacy, key risk) prominently
 * Designed to be visually featured, not buried in paragraphs
 */
export function FastFacts({
  onsetSection,
  efficacySection,
  warningsSection,
}: FastFactsProps) {
  const facts: Array<{ icon: string; text: string }> = [];

  // Extract onset time from key_points[0]
  if (onsetSection?.key_points?.[0]) {
    const onsetPoint = onsetSection.key_points[0];
    const onsetMatch = onsetPoint.match(/Onset:\s*(.+?)(?:\.|$)/i);
    if (onsetMatch) {
      // Extract time portion (e.g., "30–60 minutes", "under an hour")
      const timeMatch =
        onsetMatch[1].match(/(\d+\s*[–-]\s*\d+\s*minutes?)/i) ||
        onsetMatch[1].match(/(\d+\s*to\s*\d+\s*minutes?)/i) ||
        onsetMatch[1].match(/(under\s+an\s+hour|about\s+an\s+hour)/i);
      if (timeMatch) {
        facts.push({
          icon: "⏱️",
          text: `Onset: ${timeMatch[1]}`,
        });
      } else {
        // Fallback: use first sentence if no time match
        const firstSentence = onsetMatch[1].split(/[.!?]/)[0].trim();
        if (firstSentence.length > 0 && firstSentence.length < 60) {
          facts.push({
            icon: "⏱️",
            text: `Onset: ${firstSentence}`,
          });
        }
      }
    }
  }

  // Extract efficacy stat
  if (efficacySection?.value && efficacySection?.comparison) {
    const metric = efficacySection.metric || "Efficacy";
    const comparisonText = efficacySection.comparison
      .replace(/for\s+/i, "")
      .replace(/^vs\s+/i, "")
      .replace(/^compared\s+with\s+/i, "")
      .trim();
    
    // Extract key metric name (e.g., "Panic-free at 4 weeks")
    let metricLabel = "Efficacy";
    if (metric.toLowerCase().includes("panic-free")) {
      metricLabel = "Panic-free at 4 weeks";
    } else if (metric.toLowerCase().includes("response")) {
      metricLabel = "Response rate";
    } else if (metric.toLowerCase().includes("improvement")) {
      metricLabel = "Improvement";
    } else {
      // Use first part of metric
      metricLabel = metric.split(/[:(]/)[0].trim();
    }

    facts.push({
      icon: "📈",
      text: `${metricLabel}: ~${efficacySection.value} (vs ${comparisonText})`,
    });
  }

  // Extract key risk from warnings highlight
  if (warningsSection?.highlight) {
    const highlight = warningsSection.highlight;
    
    // Try to extract core safety issues
    let riskText: string | null = null;
    
    // Pattern 1: "two major safety issues: X and Y"
    const riskMatch1 = highlight.match(/two major safety issues:\s*(.+?)(?:\.|$)/i);
    if (riskMatch1) {
      const riskContent = riskMatch1[1].trim();
      // Simplify: "High dependence; dangerous with alcohol/opioids"
      if (riskContent.toLowerCase().includes("dependence") && 
          (riskContent.toLowerCase().includes("alcohol") || 
           riskContent.toLowerCase().includes("opioid"))) {
        riskText = "High dependence; dangerous with alcohol/opioids";
      } else {
        // Use first part before "and" or comma
        riskText = riskContent.split(/\s+and\s+|,\s*/)[0].trim();
      }
    }
    
    // Pattern 2: Look for "risk" or "warning" keywords
    if (!riskText) {
      const riskMatch2 = highlight.match(/(?:risk|warning|danger):\s*(.+?)(?:\.|$)/i);
      if (riskMatch2) {
        riskText = riskMatch2[1].trim().split(/[.!;]/)[0].trim();
      }
    }
    
    // Pattern 3: Use first sentence if it mentions key risks
    if (!riskText && highlight.length > 0) {
      const firstSentence = highlight.split(/[.!?]/)[0].trim();
      if (firstSentence.length > 0 && firstSentence.length < 75) {
        riskText = firstSentence;
      }
    }
    
    if (riskText && riskText.length > 0 && riskText.length < 75) {
      facts.push({
        icon: "⚠️",
        text: `Key risk: ${riskText}`,
      });
    }
  }

  // Only render if we have at least one fact
  if (facts.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 sm:mt-6 rounded-xl border border-neutral-200 bg-gradient-to-r from-neutral-50 to-white p-4 sm:p-5 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        {facts.map((fact, index) => (
          <div key={index} className="flex items-start gap-2.5 sm:gap-3">
            <span className="text-xl sm:text-2xl flex-shrink-0" aria-hidden="true">
              {fact.icon}
            </span>
            <span className="text-sm sm:text-base text-neutral-800 leading-relaxed flex-1 font-medium">
              <ParsedContent content={fact.text} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}













