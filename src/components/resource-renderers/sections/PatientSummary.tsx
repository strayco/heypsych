// src/components/resource-renderers/sections/PatientSummary.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ParsedContent } from "@/components/ui/parsed-content";
import { Info } from "lucide-react";

interface PatientSummaryProps {
  text: string;
}

export function PatientSummary({ text }: PatientSummaryProps) {
  return (
    <Card className="border-accent-border bg-accent-tint">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <Info className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-accent-700">In Plain Terms</h3>
            <p className="text-sm leading-relaxed text-accent-700"><ParsedContent content={text} /></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
