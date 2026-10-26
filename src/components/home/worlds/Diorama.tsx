/**
 * Diorama
 *
 * The part every HeyPsych World shares: a cut-away architectural miniature
 * standing on a plinth, with thickness at the cut edges of its walls.
 *
 * The Architect office is drawn as an inhabited room filling its workspace.
 * On the homepage the same room becomes an object on the page — something a
 * visitor can look into and choose — and the plinth and wall thickness are what
 * make it read as a crafted miniature rather than a floating illustration.
 *
 * `RoomEnvelope` draws the floor and walls for worlds that are not the
 * Architect office, with exactly the Architect shell's materials and seams.
 */

import { MATERIALS, PALETTE, faceColor, polygon, shade } from "@/domains/architect/world/scene";
import { IsoBox } from "@/app/architect/_components/world/primitives";
import { FLOOR_D, FLOOR_W, P, PLINTH_H, WALL_H, WALL_T, WORLD_VIEWBOX } from "./geometry";

// ============================================================================
// PLINTH — drawn before the room
// ============================================================================

interface PlinthProps {
  shadowClassName?: string;
}

/**
 * The base the miniature stands on, and the soft shadow it casts on the page.
 */
export function Plinth({ shadowClassName }: PlinthProps) {
  const near = P(FLOOR_W, FLOOR_D, -PLINTH_H);

  return (
    <g>
      {/* Page shadow: wide and soft, offset down-right with the light. */}
      <ellipse
        className={shadowClassName}
        cx={near.x + 16}
        cy={near.y - 92}
        rx={WORLD_VIEWBOX.width * 0.44}
        ry={96}
        fill="#5B5140"
        filter="url(#hp-world-shadow)"
      />

      {/* Limestone base. */}
      <IsoBox
        origin={P(-WALL_T, -WALL_T, -PLINTH_H)}
        w={FLOOR_W + WALL_T}
        d={FLOOR_D + WALL_T}
        h={PLINTH_H - 4}
        material="limestone"
      />
      {/* An oak band at floor level gives the floor its thickness. */}
      <IsoBox
        origin={P(-WALL_T, -WALL_T, -4)}
        w={FLOOR_W + WALL_T}
        d={FLOOR_D + WALL_T}
        h={4}
        material="oak"
      />
      {/* A hairline where the oak meets the stone. */}
      <polyline
        points={polygon([
          P(-WALL_T, FLOOR_D, -4),
          P(FLOOR_W, FLOOR_D, -4),
          P(FLOOR_W, -WALL_T, -4),
        ])}
        fill="none"
        stroke={shade(MATERIALS.oak, 0.7)}
        strokeWidth={1}
        opacity={0.6}
      />
    </g>
  );
}

// ============================================================================
// WALL CAPS — drawn after the room's walls
// ============================================================================

/**
 * Thickness on the two cut edges of the walls: the top of each wall and its
 * exposed end. Only these faces are visible from the camera, so only these are
 * drawn.
 */
export function WallCaps() {
  const top = WALL_H;

  return (
    <g>
      {/* Left wall: top edge, then the end face at the front-left. */}
      <polygon
        points={polygon([
          P(-WALL_T, -WALL_T, top),
          P(0, -WALL_T, top),
          P(0, FLOOR_D, top),
          P(-WALL_T, FLOOR_D, top),
        ])}
        fill={faceColor("plaster", "top")}
      />
      <polygon
        points={polygon([
          P(-WALL_T, FLOOR_D, -0.5),
          P(0, FLOOR_D, -0.5),
          P(0, FLOOR_D, top),
          P(-WALL_T, FLOOR_D, top),
        ])}
        fill={shade(MATERIALS.plaster, 0.95)}
      />

      {/* Right wall: top edge, then the end face at the front-right. */}
      <polygon
        points={polygon([
          P(-WALL_T, -WALL_T, top),
          P(FLOOR_W, -WALL_T, top),
          P(FLOOR_W, 0, top),
          P(-WALL_T, 0, top),
        ])}
        fill={faceColor("plaster", "top")}
      />
      <polygon
        points={polygon([
          P(FLOOR_W, -WALL_T, -0.5),
          P(FLOOR_W, 0, -0.5),
          P(FLOOR_W, 0, top),
          P(FLOOR_W, -WALL_T, top),
        ])}
        fill={shade(MATERIALS.plaster, 0.8)}
      />

      {/* A crisp edge along the cut, as on a hand-built model. */}
      <polyline
        points={polygon([P(0, FLOOR_D, top), P(0, 0, top), P(FLOOR_W, 0, top)])}
        fill="none"
        stroke={shade(MATERIALS.plaster, 0.84)}
        strokeWidth={1}
      />
    </g>
  );
}

// ============================================================================
// ROOM ENVELOPE — for worlds other than the Architect office
// ============================================================================

/**
 * Floor, daylight, plank seams, wall junction shading, walls, and skirting,
 * matching the Architect room shell so both rooms share one construction.
 */
export function RoomEnvelope() {
  const floor = [P(0, 0), P(FLOOR_W, 0), P(FLOOR_W, FLOOR_D), P(0, FLOOR_D)];

  return (
    <g>
      <polygon points={polygon(floor)} fill={PALETTE.floor} />
      <polygon points={polygon(floor)} fill="url(#hp-daylight)" opacity={0.75} />

      {Array.from({ length: 13 }, (_, i) => {
        const offset = (i + 1) * (FLOOR_D / 14);
        const from = P(0, offset);
        const to = P(FLOOR_W, offset);
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke="#DFDCD2"
            strokeWidth={1}
            opacity={0.55}
          />
        );
      })}

      {(
        [
          [P(0, 0), P(0, FLOOR_D), 1],
          [P(0, 0), P(FLOOR_W, 0), -1],
        ] as const
      ).map(([a, b, side], index) => (
        <line
          key={index}
          x1={a.x}
          y1={a.y}
          x2={b.x}
          y2={b.y}
          stroke="#8C8372"
          strokeWidth={16}
          opacity={0.2}
          filter="url(#hp-soft-shadow)"
          transform={`translate(${side * 2} 3)`}
        />
      ))}

      {/* Left wall faces the light; right wall turns away from it. */}
      <polygon
        points={polygon([P(0, 0), P(0, FLOOR_D), P(0, FLOOR_D, WALL_H), P(0, 0, WALL_H)])}
        fill={faceColor("plaster", "left")}
      />
      <polygon
        points={polygon([P(0, 0), P(FLOOR_W, 0), P(FLOOR_W, 0, WALL_H), P(0, 0, WALL_H)])}
        fill={faceColor("plaster", "right")}
      />

      <polygon
        points={polygon([P(0, 0), P(0, FLOOR_D), P(0, FLOOR_D, 5), P(0, 0, 5)])}
        fill={shade(MATERIALS.limestone, 0.94)}
      />
      <polygon
        points={polygon([P(0, 0), P(FLOOR_W, 0), P(FLOOR_W, 0, 5), P(0, 0, 5)])}
        fill={shade(MATERIALS.limestone, 0.82)}
      />
    </g>
  );
}
