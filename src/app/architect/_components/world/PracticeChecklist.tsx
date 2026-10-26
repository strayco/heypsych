/**
 * Practice Checklist
 *
 * "What your practice needs": every function in the room, numbered to match
 * the markers in the office, with what has been decided and what is left.
 * It answers the two questions the room alone cannot: what can I click, and
 * how much is left to do.
 */

"use client";

import { AlertTriangle, Check, Minus } from "lucide-react";
import { getOrderedZones, type WorldObjectId } from "@/domains/architect/world/object-registry";
import type { WorldState } from "@/domains/architect/world/world-state";
import { describeObjectStatus, isResolved, type NumberedObject } from "./object-order";

interface PracticeChecklistProps {
  world: WorldState;
  numbered: NumberedObject[];
  selectedObjectId: WorldObjectId | null;
  hoveredObjectId: WorldObjectId | null;
  onSelectObject: (objectId: WorldObjectId) => void;
  onHoverObject: (objectId: WorldObjectId | null) => void;
}

export function PracticeChecklist({
  world,
  numbered,
  selectedObjectId,
  hoveredObjectId,
  onSelectObject,
  onHoverObject,
}: PracticeChecklistProps) {
  const remaining = world.decisionsRemaining;
  const percent = world.applicableCount
    ? Math.round((world.resolvedCount / world.applicableCount) * 100)
    : 0;

  return (
    <aside aria-labelledby="checklist-heading" className="flex flex-col">
      <div className="px-1">
        <h2 id="checklist-heading" className="text-label-primary text-[22px] leading-tight">
          What your practice needs
        </h2>
        <p className="text-label-secondary mt-1 text-[13px]">
          {remaining === 0
            ? "Every function has a decision."
            : `${remaining} of ${world.applicableCount} still to decide.`}{" "}
          Choose a numbered item, in the room or here.
        </p>
        <div
          className="bg-fill-tertiary mt-3 h-1.5 w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-label="Functions decided"
          aria-valuemin={0}
          aria-valuemax={world.applicableCount}
          aria-valuenow={world.resolvedCount}
        >
          <div
            className="bg-positive h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {getOrderedZones().map((zone) => {
          const items = numbered.filter((n) => n.object.definition.zone === zone.id);
          if (items.length === 0) return null;
          return (
            <section key={zone.id}>
              <h3 className="text-label-tertiary px-1 text-[11px] font-semibold tracking-[0.06em] uppercase">
                {zone.name}
              </h3>
              <ul className="border-separator bg-surface mt-1.5 overflow-hidden rounded-xl border">
                {items.map(({ number, object }) => {
                  const id = object.definition.objectId;
                  const resolved = isResolved(object);
                  const isSelected = selectedObjectId === id;
                  const isHovered = hoveredObjectId === id;
                  return (
                    <li key={id} className="border-separator border-b last:border-b-0">
                      <button
                        type="button"
                        onClick={() => onSelectObject(id)}
                        onMouseEnter={() => onHoverObject(id)}
                        onMouseLeave={() => onHoverObject(null)}
                        onFocus={() => onHoverObject(id)}
                        onBlur={() => onHoverObject(null)}
                        aria-pressed={isSelected}
                        className={`focus-visible:ring-accent flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-inset ${
                          isSelected
                            ? "bg-accent-tint"
                            : isHovered
                              ? "bg-fill-quaternary"
                              : "hover:bg-fill-quaternary"
                        }`}
                      >
                        <MarkerBadge number={number} state={object.state} />
                        <span className="min-w-0 flex-1">
                          <span className="text-label-primary block text-[14px] font-medium">
                            {object.definition.name}
                          </span>
                          <span
                            className={`block truncate text-[12px] ${
                              resolved ? "text-label-secondary" : "text-accent"
                            }`}
                          >
                            {describeObjectStatus(object)}
                          </span>
                        </span>
                        {object.hasOverlap && (
                          <AlertTriangle
                            className="text-caution h-4 w-4 shrink-0"
                            aria-label="More than one tool covers this"
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </aside>
  );
}

/** The same badge the office markers use, so the two read as one system. */
export function MarkerBadge({
  number,
  state,
}: {
  number: number;
  state: WorldState["objects"][number]["state"];
}) {
  if (state === "configured" || state === "handled-elsewhere") {
    return (
      <span className="bg-positive flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white">
        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
        <span className="sr-only">Decided</span>
      </span>
    );
  }
  if (state === "not-needed") {
    return (
      <span className="bg-fill-secondary text-label-tertiary flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
        <Minus className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
        <span className="sr-only">Not needed</span>
      </span>
    );
  }
  return (
    <span className="bg-accent flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold text-white tabular-nums">
      {number}
    </span>
  );
}
