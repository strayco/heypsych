/**
 * World List
 *
 * The equivalent non-illustrated view of the same world.
 *
 * It reads from the same derived world state and opens the same inspector, so
 * a clinician who prefers a list — or who is on a narrow screen, or using a
 * screen reader — gets the identical capability set rather than a reduced one.
 * It uses the same numbering and badges as the office markers and checklist,
 * so switching views never changes what "item 3" means.
 */

"use client";

import { useMemo } from "react";
import { AlertTriangle, ChevronRight } from "lucide-react";
import {
  getOrderedZones,
  type WorldObjectId,
} from "@/domains/architect/world/object-registry";
import type {
  WorldObjectState,
  WorldState,
} from "@/domains/architect/world/world-state";
import { describeObjectStatus, numberObjects } from "./object-order";
import { MarkerBadge } from "./PracticeChecklist";

interface WorldListProps {
  world: WorldState;
  selectedObjectId: WorldObjectId | null;
  onSelectObject: (objectId: WorldObjectId) => void;
}

export function WorldList({
  world,
  selectedObjectId,
  onSelectObject,
}: WorldListProps) {
  const numbered = useMemo(() => numberObjects(world), [world]);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-6">
      <p className="mb-6 text-[13px] text-label-secondary">
        {world.decisionsRemaining === 0
          ? "Every function has a decision."
          : `${world.decisionsRemaining} of ${world.applicableCount} still to decide.`}
      </p>

      {getOrderedZones().map((zone) => {
        const items = numbered.filter(
          (n) => n.object.definition.zone === zone.id
        );
        if (items.length === 0) return null;

        return (
          <section key={zone.id} className="mb-8">
            <h2 className="text-sm font-semibold text-label-primary">
              {zone.name}
            </h2>
            <p className="mb-3 text-xs text-label-tertiary">
              {zone.description}
            </p>

            <ul className="divide-y divide-separator overflow-hidden rounded-xl border border-separator bg-surface">
              {items.map(({ number, object }) => (
                <li key={object.definition.objectId}>
                  <ObjectRow
                    number={number}
                    object={object}
                    isSelected={
                      selectedObjectId === object.definition.objectId
                    }
                    onSelect={() =>
                      onSelectObject(object.definition.objectId)
                    }
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function ObjectRow({
  number,
  object,
  isSelected,
  onSelect,
}: {
  number: number;
  object: WorldObjectState;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const unresolved = object.state === "unconfigured";
  return (
    <button
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-fill-quaternary ${
        isSelected ? "bg-accent-tint" : ""
      }`}
    >
      <MarkerBadge number={number} state={object.state} />

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-label-primary">
          {object.definition.name}
        </span>
        {/* Undecided rows keep the description: in the list there is no
            room to look at, so it is the only hint of what the item is. */}
        <span className="block truncate text-xs text-label-secondary">
          {unresolved
            ? object.definition.description
            : describeObjectStatus(object)}
        </span>
      </span>

      {object.hasOverlap && (
        <AlertTriangle
          className="h-4 w-4 shrink-0 text-caution"
          aria-label="More than one tool covers this"
        />
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-label-tertiary" />
    </button>
  );
}
