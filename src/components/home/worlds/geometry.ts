/**
 * HeyPsych Worlds — shared framing
 *
 * Both homepage worlds are drawn in the Practice Architect reference space
 * (1440x900, 2:1 isometric, light from the upper left) and on the same floor
 * footprint as the Architect office, so the two miniatures — and the office a
 * clinician enters at /architect — read as one illustrated universe.
 *
 * See docs/active/design/HOMEPAGE_WORLDS_ART_BIBLE.md.
 */

import { at, iso, type Point } from "@/domains/architect/world/scene";
import { SHELL_GEOMETRY } from "@/app/architect/_components/world/RoomShell";

export const FLOOR_ORIGIN = SHELL_GEOMETRY.floorOrigin;
export const FLOOR_W = SHELL_GEOMETRY.floorW;
export const FLOOR_D = SHELL_GEOMETRY.floorD;

/** Wall height, matching the Architect room shell. */
export const WALL_H = 150;

/** Thickness given to the walls and plinth of the miniature. */
export const WALL_T = 6;
export const PLINTH_H = 18;

/** Scene-space point for a position in the room. */
export function P(gx: number, gy: number, gz = 0): Point {
  return at(FLOOR_ORIGIN, iso(gx, gy, gz));
}

/**
 * The frame around a world: the plinth, walls, and floor shadow with a little
 * breathing room. Expressed in reference coordinates.
 *
 * Desktop and tablet show the whole miniature. Narrow viewports keep the same
 * SVG and crop it with `preserveAspectRatio="xMidYMid slice"` inside a shorter
 * container, so there is one asset and one source of truth for both.
 */
export const WORLD_VIEWBOX = { x: 262, y: 104, width: 916, height: 668 };

export const WORLD_VIEWBOX_ATTR = `${WORLD_VIEWBOX.x} ${WORLD_VIEWBOX.y} ${WORLD_VIEWBOX.width} ${WORLD_VIEWBOX.height}`;
