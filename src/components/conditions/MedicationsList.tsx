import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

interface Medication {
  slug: string;
  name: string;
  context: "first-line" | "second-line" | "off-label";
}

interface MedicationsListProps {
  medications: Medication[];
  className?: string;
}

/**
 * MedicationsList Component
 *
 * Displays linked medications on condition pages, grouped by usage context.
 * Links to `/treatments/{slug}` (canonical medication route).
 *
 * CRITICAL: Links must be <a href> in DOM on initial render (crawlable).
 * Next.js <Link> is used (renders as <a href> in HTML).
 *
 * Groups:
 * - First-Line: FDA-approved or primary evidence-based treatments
 * - Second-Line: Alternative treatments with moderate evidence
 * - Off-Label: Used off-label with limited evidence
 */
export function MedicationsList({ medications, className }: MedicationsListProps) {
  if (!medications || medications.length === 0) {
    return null;
  }

  // Group medications by context
  const firstLine = medications.filter((med) => med.context === "first-line");
  const secondLine = medications.filter((med) => med.context === "second-line");
  const offLabel = medications.filter((med) => med.context === "off-label");

  return (
    <div className={cn("rounded-lg border border-slate-200 bg-slate-50 p-6", className)}>
      <h3 className="mb-4 text-lg font-bold text-slate-900">
        Medications Sometimes Used
      </h3>

      <p className="mb-4 text-sm text-slate-600">
        These medications may be prescribed for this condition. Always consult a healthcare
        professional before starting any medication.
      </p>

      <div className="space-y-4">
        {/* First-Line Medications */}
        {firstLine.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-900">First-Line Treatments</h4>
              <Badge variant="success" size="sm">
                FDA-Approved
              </Badge>
            </div>
            <ul className="space-y-1">
              {firstLine.map((med) => (
                <li key={med.slug}>
                  <Link
                    href={`/treatments/${med.slug}`}
                    className="inline-block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {med.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Second-Line Medications */}
        {secondLine.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-900">Second-Line Treatments</h4>
              <Badge variant="outline" size="sm">
                Alternative
              </Badge>
            </div>
            <ul className="space-y-1">
              {secondLine.map((med) => (
                <li key={med.slug}>
                  <Link
                    href={`/treatments/${med.slug}`}
                    className="inline-block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {med.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Off-Label Medications */}
        {offLabel.length > 0 && (
          <div>
            <div className="mb-2 flex items-center gap-2">
              <h4 className="text-sm font-semibold text-slate-900">Off-Label Use</h4>
              <Badge variant="warning" size="sm">
                Limited Evidence
              </Badge>
            </div>
            <ul className="space-y-1">
              {offLabel.map((med) => (
                <li key={med.slug}>
                  <Link
                    href={`/treatments/${med.slug}`}
                    className="inline-block text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {med.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
