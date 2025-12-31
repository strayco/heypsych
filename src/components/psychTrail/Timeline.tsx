/**
 * PsychTrails - Timeline Component
 *
 * Pure renderer: displays the history of the run as a timeline.
 * Domain-neutral (uses step instead of hardcoded "week").
 */

import type { HistoryEntry } from "@/lib/psychTrail/types";
import { Circle } from "lucide-react";

interface TimelineProps {
  history: HistoryEntry[];
  stepLabel: string;
  className?: string;
}

export function Timeline({ history, stepLabel, className = "" }: TimelineProps) {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">
        Journey Timeline
      </h3>
      <div className="space-y-1">
        {history.map((entry, i) => (
          <TimelineEntry
            key={i}
            entry={entry}
            isLatest={i === history.length - 1}
            stepLabel={stepLabel}
          />
        ))}
      </div>
    </div>
  );
}

interface TimelineEntryProps {
  entry: HistoryEntry;
  isLatest: boolean;
  stepLabel: string;
}

function TimelineEntry({ entry, isLatest, stepLabel }: TimelineEntryProps) {
  const capitalizedLabel = stepLabel.charAt(0).toUpperCase() + stepLabel.slice(1);

  return (
    <div className="flex items-start gap-2 text-xs">
      <div className="mt-1 flex-shrink-0">
        <Circle
          className={`h-2 w-2 ${
            isLatest ? "fill-purple-600 text-purple-600" : "fill-neutral-300 text-neutral-300"
          }`}
        />
      </div>
      <div className={`flex-1 ${isLatest ? "text-neutral-900" : "text-neutral-600"}`}>
        <span className="font-medium">
          {capitalizedLabel} {entry.step}
        </span>
        {entry.choiceId && <span className="ml-1">• Choice made</span>}
        {entry.events.length > 0 && (
          <span className="ml-1">• {entry.events.length} event(s)</span>
        )}
      </div>
    </div>
  );
}
