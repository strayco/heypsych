"use client";

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
    <section className="border-b border-separator bg-canvas py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
          Featured
        </p>
        <h2 className="mt-1 text-xl font-semibold text-label-primary">
          {title}
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tools.slice(0, 3).map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default TopPicks;
