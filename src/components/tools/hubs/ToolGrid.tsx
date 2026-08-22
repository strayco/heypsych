"use client";

import { Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToolCard } from "../ToolCard";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";

interface ToolGridProps {
  tools: DigitalToolV3[];
  emptyMessage?: string;
  onClearFilters?: () => void;
}

/**
 * ToolGrid Component
 * 
 * Grid layout for displaying tools with empty state.
 */
export function ToolGrid({ tools, emptyMessage, onClearFilters }: ToolGridProps) {
  if (!tools || tools.length === 0) {
    return (
      <div className="py-12 text-center">
        <Smartphone className="mx-auto h-12 w-12 text-label-quaternary" />
        <h3 className="mt-4 text-lg font-semibold text-label-primary">
          No tools found
        </h3>
        <p className="mt-2 text-label-tertiary">
          {emptyMessage || "Try adjusting your filters to see more results."}
        </p>
        {onClearFilters && (
          <Button onClick={onClearFilters} className="mt-4" variant="outline">
            Clear filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <ToolCard key={tool.slug} tool={tool} />
      ))}
    </div>
  );
}

export default ToolGrid;
