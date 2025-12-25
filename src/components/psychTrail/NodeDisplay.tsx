/**
 * Psych Trail - Node Display Component
 *
 * Pure renderer: displays the current story node text.
 * Supports markdown rendering.
 * Domain-neutral (uses scenario time config).
 */

import type { Node } from "@/lib/psychTrail/types";

interface NodeDisplayProps {
  node: Node;
  stepNumber: number;
  stepLabel: string;
  className?: string;
}

export function NodeDisplay({ node, stepNumber, stepLabel, className = "" }: NodeDisplayProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-700">
        {stepLabel.charAt(0).toUpperCase() + stepLabel.slice(1)} {stepNumber}
      </div>
      <div className="prose prose-neutral max-w-none">
        {/* Simple text rendering - can be enhanced with markdown later */}
        {node.text.split("\n\n").map((paragraph, i) => (
          <p key={i} className="mb-3 leading-relaxed text-neutral-800">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
