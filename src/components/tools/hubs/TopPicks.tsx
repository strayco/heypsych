"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ToolCard } from "../ToolCard";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";

interface TopPicksProps {
  tools: DigitalToolV3[];
  title?: string;
  showDecisionGuide?: boolean;
}

/**
 * Generate "Choose X if..." guidance based on tool characteristics.
 * Addresses the growth prompt requirement:
 * "Start with: CHOOSE A IF… CHOOSE B IF… CHOOSE NEITHER IF…"
 */
function getChooseIfReason(tool: DigitalToolV3): string {
  const reasons: string[] = [];

  // Pricing-based guidance
  if (tool.pricing.model === "free") {
    reasons.push("you want a free, no-strings-attached option");
  } else if (tool.pricing.model === "freemium") {
    reasons.push("you want to try before committing");
  }

  // Support level guidance
  if (tool.support_level === "clinical") {
    reasons.push("you need professional clinical support");
  } else if (tool.support_level === "self-help") {
    reasons.push("you prefer self-guided tools");
  }

  // Use the first best_for item if no other reason
  if (reasons.length === 0 && tool.best_for.length > 0) {
    // Extract a concise reason from best_for
    const bestFor = tool.best_for[0].toLowerCase();
    if (bestFor.length < 60) {
      reasons.push(bestFor);
    }
  }

  return reasons[0] || "it fits your needs";
}

/**
 * TopPicks Component
 *
 * Featured tools section for hub pages.
 * Now includes "Choose X if..." decision guidance per the growth prompt.
 */
export function TopPicks({ tools, title = "Top Picks", showDecisionGuide = true }: TopPicksProps) {
  if (!tools || tools.length === 0) {
    return null;
  }

  const displayTools = tools.slice(0, 3);

  return (
    <section className="border-b border-separator bg-canvas py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
          Featured
        </p>
        <h2 className="mt-1 text-xl font-semibold text-label-primary">
          {title}
        </h2>

        {/* Quick Decision Guide - "Choose X if..." */}
        {showDecisionGuide && displayTools.length >= 2 && (
          <div className="mt-4 rounded-lg border border-separator bg-surface p-4">
            <p className="text-sm font-medium text-label-primary mb-3">Quick guide:</p>
            <ul className="space-y-2">
              {displayTools.map((tool) => (
                <li key={tool.slug} className="flex items-start gap-2 text-sm">
                  <span className="text-label-tertiary">→</span>
                  <span>
                    <Link href={`/tools/${tool.slug}/`} className="font-medium text-accent hover:underline">
                      Choose {tool.name}
                    </Link>
                    <span className="text-label-secondary"> if {getChooseIfReason(tool)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayTools.map((tool) => (
            <ToolCard key={tool.slug} tool={tool} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default TopPicks;
