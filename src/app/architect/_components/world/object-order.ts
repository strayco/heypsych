/**
 * One numbering for the practice's functions, shared by the office markers,
 * the checklist, and the list view: zone order (Welcome, Clinical Care,
 * Operations, Specialist), then registry order within each zone. Marker 3 in
 * the room is always item 3 in the checklist.
 */

import { getOrderedZones, type WorldObjectId } from "@/domains/architect/world/object-registry";
import type { WorldObjectState, WorldState } from "@/domains/architect/world/world-state";

export interface NumberedObject {
  number: number;
  object: WorldObjectState;
}

export function numberObjects(world: WorldState): NumberedObject[] {
  const ordered: NumberedObject[] = [];
  for (const zone of getOrderedZones()) {
    for (const object of world.objects) {
      if (object.definition.zone === zone.id) {
        ordered.push({ number: ordered.length + 1, object });
      }
    }
  }
  return ordered;
}

export function numberById(numbered: NumberedObject[]): Map<WorldObjectId, number> {
  return new Map(numbered.map((n) => [n.object.definition.objectId, n.number]));
}

/** Resolved by any means: a tool, handled elsewhere, or not needed. */
export function isResolved(object: WorldObjectState): boolean {
  return object.state !== "unconfigured";
}

/** The one-line status shown wherever an object is listed. */
export function describeObjectStatus(object: WorldObjectState): string {
  switch (object.state) {
    case "configured":
      return object.overlappingProductNames.join(", ");
    case "handled-elsewhere":
      return object.productName ? `Handled by ${object.productName}` : "Handled elsewhere";
    case "not-needed":
      return "Not needed";
    default:
      return "Choose a tool";
  }
}
