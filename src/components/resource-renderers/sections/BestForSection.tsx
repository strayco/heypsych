// src/components/resource-renderers/sections/BestForSection.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

interface BestForSectionProps {
  text?: string;
  items?: string[];
  not_recommended?: string[];
}

export function BestForSection({
  text,
  items,
  not_recommended
}: BestForSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Who Should Use This?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Best For */}
        {items && items.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h4 className="font-semibold text-label-primary">Best For:</h4>
            </div>
            {text && (
              <p className="mb-3 text-sm text-label-primary">{text}</p>
            )}
            <ul className="space-y-2">
              {items.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-1 flex-shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </span>
                  <span className="text-label-primary">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Not Recommended */}
        {not_recommended && not_recommended.length > 0 && (
          <div className="rounded-lg border border-negative-border bg-negative-tint p-4">
            <div className="mb-3 flex items-center gap-2">
              <XCircle className="h-5 w-5 text-negative" />
              <h4 className="font-semibold text-negative-700">Not Recommended For:</h4>
            </div>
            <ul className="space-y-2">
              {not_recommended.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="mt-1 flex-shrink-0">
                    <XCircle className="h-4 w-4 text-negative" />
                  </span>
                  <span className="text-negative-700">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
