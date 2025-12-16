// src/components/resource-renderers/sections/GettingStartedSection.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Lightbulb, AlertCircle } from "lucide-react";

interface GettingStartedSectionProps {
  heading?: string;
  steps?: string[];
  tips?: string[];
  common_mistakes?: string[];
}

export function GettingStartedSection({
  heading,
  steps,
  tips,
  common_mistakes
}: GettingStartedSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Play className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">{heading || "Getting Started"}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Steps */}
        {steps && steps.length > 0 && (
          <div>
            <h4 className="mb-3 font-semibold text-gray-900">How to Get Started</h4>
            <ol className="space-y-3">
              {steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                    {i + 1}
                  </span>
                  <span className="pt-0.5 text-sm text-gray-700">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Tips */}
        {tips && tips.length > 0 && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-green-700" />
              <h4 className="font-semibold text-green-900">Pro Tips</h4>
            </div>
            <ul className="space-y-2">
              {tips.map((tip, i) => (
                <li key={i} className="text-sm text-green-800">
                  • {tip}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Common Mistakes */}
        {common_mistakes && common_mistakes.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-700" />
              <h4 className="font-semibold text-amber-900">Common Mistakes to Avoid</h4>
            </div>
            <ul className="space-y-2">
              {common_mistakes.map((mistake, i) => (
                <li key={i} className="text-sm text-amber-800">
                  • {mistake}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
