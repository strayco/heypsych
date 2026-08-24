"use client";

import { ToolCard } from "./ToolCard";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";

interface RelatedToolsProps {
  tools: DigitalToolV3[];
  title?: string;
}

/**
 * RelatedTools Component
 *
 * Grid of related tool cards for cross-linking.
 */
export function RelatedTools({ tools, title = "Related Tools" }: RelatedToolsProps) {
  if (!tools || tools.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-separator bg-canvas py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
          Explore
        </p>
        <h2 className="mt-1 text-xl font-semibold text-label-primary">
          {title}
        </h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default RelatedTools;
