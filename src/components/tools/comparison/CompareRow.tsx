"use client";

/**
 * CompareRow
 *
 * A single comparison row showing an attribute across all tools.
 * Desktop: Grid layout with attribute label + value columns.
 * Mobile: Stacked cards with tool colors.
 */

import React from "react";
import { cn } from "@/lib/utils";
import { CompareCell } from "./CompareCell";
import type {
  ClinicianTool,
  SerializableToolComparisonRow,
} from "@/app/tools/compare/comparison-engine";

interface ToolAccent {
  bg: string;
  border: string;
  text: string;
  headerBg: string;
  dot: string;
}

interface CompareRowProps {
  row: SerializableToolComparisonRow;
  tools: ClinicianTool[];
  depthLevel: "essential" | "detailed";
  accents: ToolAccent[];
}

export function CompareRow({
  row,
  tools,
  depthLevel,
  accents,
}: CompareRowProps) {
  const { attribute, values, hasDifferences } = row;
  const toolCount = tools.length;

  return (
    <>
      {/* Desktop: Grid row */}
      <div
        className={cn(
          "hidden md:grid items-stretch",
          hasDifferences && "bg-caution-50/30"
        )}
        style={{
          gridTemplateColumns: `minmax(160px, 1fr) repeat(${toolCount}, minmax(140px, 1fr))`,
        }}
      >
        {/* Attribute label column */}
        <div className="p-4 border-r border-separator/30 flex flex-col justify-center">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-sm text-label-primary">
              {attribute.label}
            </span>
            {hasDifferences && (
              <span className="text-2xs uppercase tracking-wider font-semibold text-caution-600 bg-caution-100 px-1.5 py-0.5 rounded shrink-0">
                Different
              </span>
            )}
          </div>
          {attribute.description && depthLevel === "detailed" && (
            <p className="text-xs text-label-tertiary mt-1">
              {attribute.description}
            </p>
          )}
        </div>

        {/* Tool value columns */}
        {tools.map((tool, idx) => {
          const value = values[tool.slug];
          const accent = accents[idx % accents.length];

          return (
            <div
              key={tool.slug}
              className={cn(
                "p-4 flex flex-col justify-center",
                idx < toolCount - 1 && "border-r border-separator/20",
                accent.bg
              )}
            >
              <CompareCell
                value={value}
                dataType={attribute.dataType}
                hasDifferences={hasDifferences}
              />
            </div>
          );
        })}
      </div>

      {/* Mobile: Stacked card */}
      <div
        className={cn(
          "md:hidden p-4",
          hasDifferences && "bg-caution-50/30"
        )}
      >
        {/* Attribute label */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="font-medium text-sm text-label-primary">
            {attribute.label}
          </span>
          {hasDifferences && (
            <span className="text-2xs uppercase tracking-wider font-semibold text-caution-600 bg-caution-100 px-1.5 py-0.5 rounded shrink-0">
              Different
            </span>
          )}
        </div>

        {/* Tool values stacked */}
        <div className="space-y-3">
          {tools.map((tool, idx) => {
            const value = values[tool.slug];
            const accent = accents[idx % accents.length];

            return (
              <div
                key={tool.slug}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl",
                  accent.bg,
                  "border",
                  accent.border
                )}
              >
                <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", accent.dot)} />
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-medium text-label-tertiary block mb-1">
                    {tool.name}
                  </span>
                  <CompareCell
                    value={value}
                    dataType={attribute.dataType}
                    hasDifferences={hasDifferences}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {attribute.description && depthLevel === "detailed" && (
          <p className="text-xs text-label-quaternary mt-3 pl-5">
            {attribute.description}
          </p>
        )}
      </div>
    </>
  );
}

export default CompareRow;
