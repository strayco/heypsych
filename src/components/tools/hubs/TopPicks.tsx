"use client";

import { Trophy } from "lucide-react";
import { ToolCard } from "../ToolCard";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";

interface TopPicksProps {
  tools: DigitalToolV3[];
  title?: string;
}

/**
 * TopPicks Component
 * 
 * Featured tools section for hub pages.
 */
export function TopPicks({ tools, title = "Top Picks" }: TopPicksProps) {
  if (!tools || tools.length === 0) {
    return null;
  }

  return (
    <section className="py-8 bg-gradient-to-br from-amber-50 to-orange-50 border-b border-amber-200">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl font-bold text-label-primary mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-amber-600" />
          {title}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.slice(0, 3).map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default TopPicks;
