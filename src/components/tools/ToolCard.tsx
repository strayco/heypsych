"use client";

import Link from "next/link";
import { Star, Shield, ArrowRight, Smartphone, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DigitalToolV3 } from "@/lib/schemas/digital-tool-v3";

interface ToolCardProps {
  tool: DigitalToolV3;
  showHubBadge?: boolean;
}

/**
 * ToolCard Component
 * 
 * Reusable card for displaying tools in grids and lists.
 */
export function ToolCard({ tool, showHubBadge = false }: ToolCardProps) {
  return (
    <Link href={`/tools/${tool.slug}/`} className="group block h-full">
      <Card className="h-full transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-neutral-200 bg-white">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg group-hover:text-indigo-600 transition-colors truncate">
                {tool.name}
              </CardTitle>
              
              {/* Rating */}
              {tool.app_rating && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-4 w-4 fill-current text-yellow-500" />
                  <span className="font-medium text-sm text-neutral-900">
                    {tool.app_rating}
                  </span>
                  {tool.total_reviews && (
                    <span className="text-xs text-neutral-500">
                      ({formatReviews(tool.total_reviews)})
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* AI Badge */}
            {tool.ai_attributes.includes("ai-powered") && (
              <Badge variant="outline" className="border-purple-300 bg-purple-50 text-purple-700 flex-shrink-0">
                <Bot className="h-3 w-3 mr-1" />
                AI
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* One-liner */}
          <p className="text-sm text-neutral-600 line-clamp-2">
            {tool.short_description || tool.one_liner}
          </p>

          {/* Platforms */}
          <div className="flex flex-wrap gap-1">
            {tool.platforms.ios && (
              <Badge variant="outline" className="text-xs py-0">iOS</Badge>
            )}
            {tool.platforms.android && (
              <Badge variant="outline" className="text-xs py-0">Android</Badge>
            )}
            {tool.platforms.web && (
              <Badge variant="outline" className="text-xs py-0">Web</Badge>
            )}
          </div>

          {/* Bottom row */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {/* Pricing */}
              {tool.pricing.free_tier && (
                <span className="text-xs font-medium text-green-700">Free</span>
              )}
              
              {/* Privacy */}
              {tool.privacy.grade && tool.privacy.grade !== "unknown" && (
                <div className="flex items-center gap-1 text-blue-700">
                  <Shield className="h-3 w-3" />
                  <span className="text-xs font-medium">{tool.privacy.grade}</span>
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-1 text-indigo-600 group-hover:text-indigo-700">
              <span className="text-xs font-medium">View</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function formatReviews(count: number): string {
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
  if (count >= 1000) return `${Math.round(count / 1000)}K`;
  return count.toString();
}

export default ToolCard;
