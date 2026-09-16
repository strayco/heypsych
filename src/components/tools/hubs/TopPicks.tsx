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
 * MUST produce UNIQUE, DIFFERENTIATING reasons - not generic platitudes.
 */
function getChooseIfReason(tool: DigitalToolV3): string {
  // Priority 1: Use best_for (most specific to the tool)
  if (tool.best_for.length > 0) {
    const bestFor = tool.best_for[0].toLowerCase();
    // Clean up and make it read naturally after "if you..."
    if (bestFor.startsWith("people who")) {
      return bestFor.replace("people who", "you");
    }
    if (bestFor.startsWith("those who")) {
      return bestFor.replace("those who", "you");
    }
    if (bestFor.startsWith("users who")) {
      return bestFor.replace("users who", "you");
    }
    // If it's already a "you" statement or short enough, use it
    if (bestFor.length < 80) {
      return `you're looking for ${bestFor}`;
    }
  }

  // Priority 2: Use short_description to extract a differentiator
  const desc = tool.short_description.toLowerCase();

  // Look for specific differentiating features
  if (desc.includes("adhd")) return "you need ADHD-specific support";
  if (desc.includes("medication") && desc.includes("delivery")) return "you want medication delivered to your door";
  if (desc.includes("unlimited messaging")) return "you prefer text-based therapy over video";
  if (desc.includes("video")) return "you prefer live video sessions";
  if (desc.includes("ai") || desc.includes("chatbot")) return "you want 24/7 AI-powered support";
  if (desc.includes("meditation")) return "you want guided meditation and mindfulness";
  if (desc.includes("sleep")) return "you're focused on improving sleep";
  if (desc.includes("journal")) return "you prefer journaling and self-reflection";
  if (desc.includes("mood track")) return "you want to track and understand your moods";
  if (desc.includes("cbt") || desc.includes("cognitive behavioral")) return "you want structured CBT exercises";
  if (desc.includes("psychiatr")) return "you need psychiatric evaluation or medication management";
  if (desc.includes("couples") || desc.includes("relationship")) return "you're seeking couples or relationship therapy";

  // Priority 3: Pricing-based (only if nothing else works)
  if (tool.pricing.model === "free") {
    return "you want a completely free option with no subscription";
  }

  // Fallback - try to extract something from name/category
  const name = tool.name.toLowerCase();
  if (name.includes("calm")) return "you want sleep stories and relaxation content";
  if (name.includes("headspace")) return "you want structured meditation courses";

  return "it matches your specific needs";
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
