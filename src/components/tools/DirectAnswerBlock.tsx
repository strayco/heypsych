"use client";

import { CheckCircle, XCircle, Star, Shield, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
    <section className="bg-gradient-to-br from-white to-slate-50 border-b border-neutral-200">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Tool Name & Rating */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
              {tool.name}
            </h1>
            {tool.app_rating && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center">
                  <Star className="h-5 w-5 fill-current text-yellow-500" />
                  <span className="ml-1 font-bold text-lg text-neutral-900">
                    {tool.app_rating}
                  </span>
                </div>
                {tool.total_reviews && (
                  <span className="text-neutral-600">
                    ({formatReviews(tool.total_reviews)} reviews)
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Quick Badges */}
          <div className="flex flex-wrap gap-2">
            {tool.pricing.free_tier && (
              <Badge variant="outline" className="border-green-300 bg-green-50 text-green-800">
                Free Available
              </Badge>
            )}
            {tool.privacy.grade && tool.privacy.grade !== "unknown" && (
              <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-800">
                <Shield className="h-3 w-3 mr-1" />
                Privacy: {tool.privacy.grade}
              </Badge>
            )}
            {tool.ai_attributes.includes("ai-powered") && (
              <Badge variant="outline" className="border-purple-300 bg-purple-50 text-purple-800">
                AI-Powered
              </Badge>
            )}
          </div>
        </div>

        {/* One-Liner (Direct Answer) */}
        <p className="text-lg text-neutral-700 leading-relaxed mb-6">
          {tool.one_liner}
        </p>

        {/* At-a-Glance Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h2 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Best For
            </h2>
            <ul className="space-y-2">
              {tool.best_for.slice(0, 4).map((item, i) => (
                <li key={i} className="text-sm text-neutral-700 flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-lg p-4 border border-red-200">
            <h2 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              Not Recommended For
            </h2>
            <ul className="space-y-2">
              {tool.not_for.slice(0, 3).map((item, i) => (
                <li key={i} className="text-sm text-neutral-700 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
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
    <div className="bg-white rounded-lg p-3 border border-neutral-200">
      <dt className="text-xs text-neutral-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-neutral-900">{value}</dd>
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
    "freemium": "Freemium",
    "subscription": "Subscription",
    "one-time": "One-time",
    "enterprise": "Enterprise",
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
