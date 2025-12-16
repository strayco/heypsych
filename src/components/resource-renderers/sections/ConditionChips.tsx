// src/components/resource-renderers/sections/ConditionChips.tsx
import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link2, FlaskConical } from "lucide-react";

interface LinkedCondition {
  slug: string;
  relationship: "supportive" | "adjunctive" | "complementary" | "investigational";
  context: string;
  evidence_level: "high" | "moderate" | "low" | "anecdotal";
}

interface ConditionChipsProps {
  conditions: LinkedCondition[];
}

const relationshipColors = {
  supportive: "bg-green-100 text-green-800 border-green-300",
  adjunctive: "bg-blue-100 text-blue-800 border-blue-300",
  complementary: "bg-purple-100 text-purple-800 border-purple-300",
  investigational: "bg-amber-100 text-amber-800 border-amber-300"
};

const evidenceColors = {
  high: "text-green-700",
  moderate: "text-blue-700",
  low: "text-amber-700",
  anecdotal: "text-gray-600"
};

export function ConditionChips({ conditions }: ConditionChipsProps) {
  if (!conditions || conditions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Link2 className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Related Mental Health Conditions</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {conditions.map((condition, i) => (
            <div key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <div className="mb-2 flex items-start justify-between gap-4">
                <Link
                  href={`/conditions/${condition.slug}`}
                  className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  {condition.slug
                    .split("-")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
                </Link>
                <div className="flex flex-shrink-0 gap-2">
                  <Badge
                    variant="outline"
                    className={relationshipColors[condition.relationship]}
                  >
                    {condition.relationship}
                  </Badge>
                  <div
                    className={`flex items-center gap-1 text-xs font-medium ${evidenceColors[condition.evidence_level]}`}
                    title={`Evidence level: ${condition.evidence_level}`}
                  >
                    <FlaskConical className="h-3 w-3" />
                    {condition.evidence_level}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-700">{condition.context}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
