/**
 * PsychTrails - Node Display Component
 *
 * Pure renderer: displays the current story node text.
 * Supports markdown rendering.
 * Domain-neutral (uses scenario time config).
 */

import type { Node, RunState } from "@/lib/psychTrail/types";
import type { IRenderer } from "@/lib/psychTrail/renderer";

interface NodeDisplayProps {
  node: Node;
  stepNumber: number;
  stepLabel: string;
  renderer: IRenderer;
  state: RunState;
  className?: string;
}

export function NodeDisplay({ node, stepNumber, stepLabel, renderer, state, className = "" }: NodeDisplayProps) {
  const nodeText = renderer.renderNodeText(node, state);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-neutral-700">
        {stepLabel.charAt(0).toUpperCase() + stepLabel.slice(1)} {stepNumber}
      </div>
      <div className="prose prose-neutral max-w-none">
        {/* Simple text rendering - can be enhanced with markdown later */}
        {nodeText.split("\n\n").map((paragraph, i) => (
          <p key={i} className="mb-3 leading-relaxed text-neutral-800">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
