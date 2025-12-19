/**
 * Psych Trail - Event Log Component
 *
 * Pure renderer: displays events that happened on the last turn.
 * No simulation logic.
 */

import type { GameEvent } from "@/lib/psychTrail/types";
import { AlertCircle, TrendingUp } from "lucide-react";

interface EventLogProps {
  events: GameEvent[];
  className?: string;
}

export function EventLog({ events, className = "" }: EventLogProps) {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {events.map((event, i) => (
        <EventItem key={`${event.id}-${i}`} event={event} />
      ))}
    </div>
  );
}

interface EventItemProps {
  event: GameEvent;
}

function EventItem({ event }: EventItemProps) {
  // Determine if event is positive or negative based on effects
  const isPositive = event.effects.some(
    (e) => e.type === "metric" && e.change > 0
  );

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-3 text-sm ${
        isPositive
          ? "border-green-200 bg-green-50"
          : "border-orange-200 bg-orange-50"
      }`}
    >
      <div className="mt-0.5 flex-shrink-0">
        {isPositive ? (
          <TrendingUp className="h-4 w-4 text-green-600" />
        ) : (
          <AlertCircle className="h-4 w-4 text-orange-600" />
        )}
      </div>
      <div className="flex-1">
        <p
          className={`leading-relaxed ${
            isPositive ? "text-green-900" : "text-orange-900"
          }`}
        >
          {event.text}
        </p>
      </div>
    </div>
  );
}
