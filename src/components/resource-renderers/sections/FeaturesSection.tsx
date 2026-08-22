// src/components/resource-renderers/sections/FeaturesSection.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, FlaskConical } from "lucide-react";

interface FeatureItem {
  feature: string;
  description: string;
  evidence?: string;
}

interface FeaturesSectionProps {
  heading?: string;
  items: FeatureItem[];
}

export function FeaturesSection({ heading, items }: FeaturesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Lightbulb className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-lg">{heading || "Key Features"}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {items.map((item, i) => (
            <div key={i} className="border-b border-separator pb-6 last:border-b-0 last:pb-0">
              <h4 className="mb-2 font-semibold text-label-primary">{item.feature}</h4>
              <p className="mb-2 text-sm text-label-primary">{item.description}</p>
              {item.evidence && (
                <div className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2">
                  <div className="flex items-start gap-2">
                    <FlaskConical className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-700" />
                    <p className="text-xs text-purple-900">
                      <span className="font-semibold">Evidence: </span>
                      {item.evidence}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
