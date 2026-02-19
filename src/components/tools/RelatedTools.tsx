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
    <section className="py-8 bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6">
          {title}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default RelatedTools;
