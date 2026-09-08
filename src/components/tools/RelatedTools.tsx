"use client";

import Link from "next/link";
import { ToolCard } from "./ToolCard";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";

interface RelatedToolsProps {
  tools: DigitalToolV3[];
  title?: string;
  currentToolName?: string;
}

/**
 * Generate contextual anchor text for internal links.
 * SEO best practice: descriptive anchor text > generic "click here"
 */
function getContextualLinkText(tool: DigitalToolV3): string {
  if (tool.pricing.model === "free") {
    return `${tool.name} (Free)`;
  }
  if (tool.support_level === "clinical") {
    return `${tool.name} - Clinical Support`;
  }
  if (tool.ai_attributes.includes("ai-powered")) {
    return `${tool.name} - AI-Powered`;
  }
  return tool.name;
}

/**
 * RelatedTools Component
 *
 * Grid of related tool cards for cross-linking.
 * Enhanced with SEO-optimized contextual anchor text and structured markup.
 */
export function RelatedTools({ tools, title = "Related Tools", currentToolName }: RelatedToolsProps) {
  if (!tools || tools.length === 0) {
    return null;
  }

  return (
    <section className="border-t border-separator bg-canvas py-10" aria-labelledby="related-tools-heading">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
          Explore More
        </p>
        <h2 id="related-tools-heading" className="mt-1 text-xl font-semibold text-label-primary">
          {title}
        </h2>

        {/* Quick comparison text - SEO content for related queries */}
        {currentToolName && (
          <p className="mt-2 text-sm text-label-secondary">
            Looking for alternatives to {currentToolName}? Compare these similar mental health apps:
          </p>
        )}

        {/* Quick Links Row - Text links for additional crawlable paths */}
        <nav className="mt-4 flex flex-wrap gap-x-4 gap-y-2" aria-label="Related tools quick links">
          {tools.map((tool) => (
            <Link
              key={`quick-${tool.slug}`}
              href={`/tools/${tool.slug}/`}
              className="text-sm text-accent hover:underline"
            >
              {getContextualLinkText(tool)}
            </Link>
          ))}
        </nav>

        {/* Card Grid */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>

        {/* Bottom text links - Additional crawlable anchor text variations */}
        <div className="mt-6 text-center">
          <p className="text-sm text-label-tertiary">
            Need help choosing?{" "}
            <Link href="/tools/for-patients/" className="text-accent hover:underline">
              Browse all mental health apps
            </Link>
            {" "}or use our{" "}
            <Link href="/find-support/" className="text-accent hover:underline">
              personalized app finder
            </Link>
            .
          </p>
        </div>
      </div>
    </section>
  );
}

export default RelatedTools;
