// src/components/resource-renderers/sections/PatientSummary.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

interface PatientSummaryProps {
  text: string;
}

export function PatientSummary({ text }: PatientSummaryProps) {
  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="pt-6">
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <Info className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="mb-2 font-semibold text-blue-900">In Plain Terms</h3>
            <p className="text-sm leading-relaxed text-blue-800">{text}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
