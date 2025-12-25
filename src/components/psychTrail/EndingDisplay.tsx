/**
 * Psych Trail - Ending Display Component
 *
 * Pure renderer: displays the final ending screen.
 * No simulation logic.
 */

import type { Ending } from "@/lib/psychTrail/types";
import { Trophy, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface EndingDisplayProps {
  ending: Ending;
  stepNumber: number;
  stepLabel: string;
  onRestart?: () => void;
  className?: string;
}

export function EndingDisplay({
  ending,
  stepNumber,
  stepLabel,
  onRestart,
  className = "",
}: EndingDisplayProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full ${
            ending.isPositive
              ? "bg-gradient-to-br from-green-100 to-emerald-100"
              : "bg-gradient-to-br from-blue-100 to-purple-100"
          }`}
        >
          {ending.isPositive ? (
            <Trophy className="h-8 w-8 text-green-600" />
          ) : (
            <Award className="h-8 w-8 text-purple-600" />
          )}
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-neutral-700">
            Journey Complete • {stepLabel.charAt(0).toUpperCase() + stepLabel.slice(1)} {stepNumber}
          </div>
          <h2 className="text-2xl font-bold text-neutral-900">{ending.title}</h2>
        </div>
      </div>

      {/* Ending Text */}
      <div className="prose prose-neutral max-w-none rounded-lg border border-neutral-200 bg-neutral-50 p-6">
        {ending.text.split("\n\n").map((paragraph, i) => (
          <p key={i} className="mb-3 last:mb-0 leading-relaxed">
            {paragraph}
          </p>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-center pt-4">
        <Link href="/psych-trail">
          <Button size="lg" className="min-w-[200px]">
            Back to Scenarios
          </Button>
        </Link>
      </div>
    </div>
  );
}
