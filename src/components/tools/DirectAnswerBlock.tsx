"use client";

import { CheckCircle, XCircle, Star } from "lucide-react";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";

interface DirectAnswerBlockProps {
  tool: DigitalToolV3;
}

/**
 * DirectAnswerBlock Component
 *
 * AEO-first hero section that provides immediate, extractable answers.
 * This is the primary content for AI answer engines.
 */
export function DirectAnswerBlock({ tool }: DirectAnswerBlockProps) {
  return (
    <section className="border-b border-separator bg-surface">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tool Name & Rating */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
              Tool Review
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-label-primary sm:text-4xl">
              {tool.name}
            </h1>
            {tool.app_rating && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center">
                  <Star className="h-4 w-4 fill-current text-label-tertiary" />
                  <span className="ml-1 font-medium text-label-primary">
                    {tool.app_rating}
                  </span>
                </div>
                {tool.total_reviews && (
                  <span className="text-sm text-label-tertiary">
                    ({formatReviews(tool.total_reviews)} reviews)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Quick Badges */}
          <div className="flex flex-wrap gap-2">
            {tool.pricing.free_tier && (
              <span className="text-xs font-medium text-label-secondary px-2 py-1 rounded border border-separator bg-canvas">
                Free tier
              </span>
            )}
            {tool.privacy.grade && tool.privacy.grade !== "unknown" && (
              <span className="text-xs font-medium text-label-secondary px-2 py-1 rounded border border-separator bg-canvas">
                Privacy: {tool.privacy.grade}
              </span>
            )}
            {tool.ai_attributes.includes("ai-powered") && (
              <span className="text-xs font-medium text-label-secondary px-2 py-1 rounded border border-separator bg-canvas">
                AI-Powered
              </span>
            )}
          </div>
        </div>

        {/* One-Liner (Direct Answer) */}
        <p className="text-lg text-label-secondary leading-relaxed mb-6">
          {tool.one_liner}
        </p>

        {/* At-a-Glance Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <AtAGlanceItem
            label="Support Level"
            value={formatSupportLevel(tool.support_level)}
          />
          <AtAGlanceItem
            label="Pricing"
            value={formatPricing(tool.pricing.model, tool.pricing.free_tier)}
          />
          <AtAGlanceItem
            label="Platforms"
            value={formatPlatforms(tool.platforms)}
          />
          <AtAGlanceItem
            label="Privacy"
            value={tool.privacy.grade !== "unknown" ? tool.privacy.grade : "Not rated"}
          />
        </div>

        {/* Best For / Not For */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl border border-separator bg-canvas p-4">
            <h2 className="font-medium text-label-primary mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-label-tertiary" />
              Best For
            </h2>
            <ul className="space-y-2">
              {tool.best_for.slice(0, 4).map((item, i) => (
                <li key={i} className="text-sm text-label-secondary flex items-start gap-2">
                  <span className="text-label-tertiary mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-separator bg-canvas p-4">
            <h2 className="font-medium text-label-primary mb-3 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-label-tertiary" />
              Not Recommended For
            </h2>
            <ul className="space-y-2">
              {tool.not_for.slice(0, 3).map((item, i) => (
                <li key={i} className="text-sm text-label-secondary flex items-start gap-2">
                  <span className="text-label-tertiary mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// Helper Components
function AtAGlanceItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-separator bg-canvas p-3">
      <dt className="text-xs font-medium uppercase tracking-wider text-label-tertiary">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-label-primary">{value}</dd>
    </div>
  );
}

// Formatters
function formatReviews(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return count.toString();
}

function formatSupportLevel(level: string): string {
  const labels: Record<string, string> = {
    "self-help": "Self-Help",
    "coached": "Coached",
    "clinical": "Clinical",
    "crisis": "Crisis",
  };
  return labels[level] || level;
}

function formatPricing(model: string, freeTier: boolean): string {
  if (model === "free") return "Free";
  if (freeTier) return "Free + Premium";
  const labels: Record<string, string> = {
    freemium: "Freemium",
    subscription: "Subscription",
    "one-time": "One-time",
    enterprise: "Enterprise",
    "insurance-covered": "Insurance",
  };
  return labels[model] || model;
}

function formatPlatforms(platforms: { ios: boolean; android: boolean; web: boolean; desktop: boolean }): string {
  const available = [];
  if (platforms.ios) available.push("iOS");
  if (platforms.android) available.push("Android");
  if (platforms.web) available.push("Web");
  if (platforms.desktop) available.push("Desktop");
  return available.length > 0 ? available.join(", ") : "N/A";
}

export default DirectAnswerBlock;
