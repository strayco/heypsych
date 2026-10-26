/**
 * Room Shell
 *
 * The architectural envelope of the practice: floor, two walls, entrance,
 * window, and the permanent furniture that defines each zone.
 *
 * The shell is always present. An empty practice is still a room, never a void
 * with floating placeholders.
 */

import {
  MATERIALS,
  PALETTE,
  faceColor,
  iso,
  at,
  polygon,
  shade,
} from "@/domains/architect/world/scene";
import {
  ContactShadow,
  IsoBox,
  IsoCylinder,
  IsoPanel,
  WallPlaque,
} from "./primitives";

/**
 * Origin of the floor plane in scene coordinates.
 *
 * Chosen so the projected room sits centred in the 1440x900 reference scene:
 * the floor diamond spans x 300-1140 and the walls rise to y 140.
 */
const FLOOR_ORIGIN = { x: 720, y: 290 };
const FLOOR_W = 210;
const FLOOR_D = 210;

/**
 * Scene definitions used by both the shell and the object layer so furniture
 * and functional objects sit on the same surfaces.
 */
export const SHELL_GEOMETRY = {
  floorOrigin: FLOOR_ORIGIN,
  floorW: FLOOR_W,
  floorD: FLOOR_D,
};

export function RoomShell() {
  const floorFill = PALETTE.floor;

  const floorCorners = [
    at(FLOOR_ORIGIN, iso(0, 0, 0)),
    at(FLOOR_ORIGIN, iso(FLOOR_W, 0, 0)),
    at(FLOOR_ORIGIN, iso(FLOOR_W, FLOOR_D, 0)),
    at(FLOOR_ORIGIN, iso(0, FLOOR_D, 0)),
  ];

  const WALL_H = 150;

  return (
    <g>
      {/* ---------------------------------------------------------------- */}
      {/* Floor                                                             */}
      {/* ---------------------------------------------------------------- */}
      <polygon points={polygon(floorCorners)} fill={floorFill} />

      {/* A soft pool of daylight from the window, up and to the left. */}
      <polygon
        points={polygon(floorCorners)}
        fill="url(#hp-daylight)"
        opacity={0.75}
      />

      {/* Subtle plank seams, running with the right-hand axis only, so the */}
      {/* floor reads as boards rather than a grid.                         */}
      {Array.from({ length: 13 }, (_, i) => {
        const offset = (i + 1) * (FLOOR_D / 14);
        const from = at(FLOOR_ORIGIN, iso(0, offset, 0));
        const to = at(FLOOR_ORIGIN, iso(FLOOR_W, offset, 0));
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

      {/* Ambient occlusion where the floor meets each wall. Without it the
          floor and walls read as two flat shapes sharing an edge rather than
          as surfaces meeting in a corner. */}
      {(
        [
          [iso(0, 0, 0), iso(0, FLOOR_D, 0), 1],
          [iso(0, 0, 0), iso(FLOOR_W, 0, 0), -1],
        ] as const
      ).map(([from, to, side], index) => {
        const a = at(FLOOR_ORIGIN, from);
        const b = at(FLOOR_ORIGIN, to);
        return (
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
        );
      })}

      {/* ---------------------------------------------------------------- */}
      {/* Walls                                                             */}
      {/* ---------------------------------------------------------------- */}

      {/* Left wall (runs along the y axis, faces the light). */}
      <polygon
        points={polygon([
          at(FLOOR_ORIGIN, iso(0, 0, 0)),
          at(FLOOR_ORIGIN, iso(0, FLOOR_D, 0)),
          at(FLOOR_ORIGIN, iso(0, FLOOR_D, WALL_H)),
          at(FLOOR_ORIGIN, iso(0, 0, WALL_H)),
        ])}
        fill={faceColor("plaster", "left")}
      />

      {/* Right wall (runs along the x axis, turns away from the light). */}
      <polygon
        points={polygon([
          at(FLOOR_ORIGIN, iso(0, 0, 0)),
          at(FLOOR_ORIGIN, iso(FLOOR_W, 0, 0)),
          at(FLOOR_ORIGIN, iso(FLOOR_W, 0, WALL_H)),
          at(FLOOR_ORIGIN, iso(0, 0, WALL_H)),
        ])}
        fill={faceColor("plaster", "right")}
      />

      {/* Skirting, picking up the oak of the floor. */}
      <polygon
        points={polygon([
          at(FLOOR_ORIGIN, iso(0, 0, 0)),
          at(FLOOR_ORIGIN, iso(0, FLOOR_D, 0)),
          at(FLOOR_ORIGIN, iso(0, FLOOR_D, 5)),
          at(FLOOR_ORIGIN, iso(0, 0, 5)),
        ])}
        fill={shade(MATERIALS.limestone, 0.94)}
      />
      <polygon
        points={polygon([
          at(FLOOR_ORIGIN, iso(0, 0, 0)),
          at(FLOOR_ORIGIN, iso(FLOOR_W, 0, 0)),
          at(FLOOR_ORIGIN, iso(FLOOR_W, 0, 5)),
          at(FLOOR_ORIGIN, iso(0, 0, 5)),
        ])}
        fill={shade(MATERIALS.limestone, 0.82)}
      />

      {/* ---------------------------------------------------------------- */}
      {/* Window on the left wall                                           */}
      {/* ---------------------------------------------------------------- */}
      <polygon
        points={polygon([
          at(FLOOR_ORIGIN, iso(0, 118, 44)),
          at(FLOOR_ORIGIN, iso(0, 186, 44)),
          at(FLOOR_ORIGIN, iso(0, 186, 116)),
          at(FLOOR_ORIGIN, iso(0, 118, 116)),
        ])}
        fill={MATERIALS.glass}
      />
      <polygon
        points={polygon([
          at(FLOOR_ORIGIN, iso(0, 118, 44)),
          at(FLOOR_ORIGIN, iso(0, 186, 44)),
          at(FLOOR_ORIGIN, iso(0, 186, 116)),
          at(FLOOR_ORIGIN, iso(0, 118, 116)),
        ])}
        fill="url(#hp-window-light)"
      />
      {/* Window frame and a single central mullion. */}
      <polygon
        points={polygon([
          at(FLOOR_ORIGIN, iso(0, 118, 44)),
          at(FLOOR_ORIGIN, iso(0, 186, 44)),
          at(FLOOR_ORIGIN, iso(0, 186, 116)),
          at(FLOOR_ORIGIN, iso(0, 118, 116)),
        ])}
        fill="none"
        stroke={MATERIALS.plaster}
        strokeWidth={5}
      />
      <line
        x1={at(FLOOR_ORIGIN, iso(0, 152, 44)).x}
        y1={at(FLOOR_ORIGIN, iso(0, 152, 44)).y}
        x2={at(FLOOR_ORIGIN, iso(0, 152, 116)).x}
        y2={at(FLOOR_ORIGIN, iso(0, 152, 116)).y}
        stroke={MATERIALS.plaster}
        strokeWidth={3.5}
      />

      {/* Built-in shelf and a quiet picture, on the left wall, away from the
          window. These are architecture, not controls — they have no hit
          target and never open the inspector. */}
      <IsoBox
        origin={at(FLOOR_ORIGIN, iso(0, 28, 52))}
        w={8}
        d={42}
        h={3}
        material="oak"
        topMaterial="oak"
      />
      {/* A few volumes on the shelf, so it reads as furniture rather than a
          floating plank. They are not controls. */}
      {(
        [
          [0, 29, 8, "walnut"],
          [0, 33, 11, "sage"],
          [0, 62, 10, "oak"],
          [0, 66, 8, "walnut"],
        ] as const
      ).map(([gx, gy, h, material], index) => (
        <IsoBox
          key={index}
          origin={at(FLOOR_ORIGIN, iso(gx, gy, 55))}
          w={6}
          d={3.2}
          h={h}
          material={material}
        />
      ))}
      <WallPlaque
        origin={at(FLOOR_ORIGIN, iso(0, 38, 72))}
        w={22}
        h={28}
        axis="y"
        material="limestone"
      >
        <IsoPanel
          origin={at(FLOOR_ORIGIN, iso(0, 40, 76))}
          w={18}
          h={20}
          axis="y"
          material="sage"
          opacity={0.55}
        />
      </WallPlaque>

      {/* ---------------------------------------------------------------- */}
      {/* Entrance on the right wall                                        */}
      {/* ---------------------------------------------------------------- */}
      <polygon
        points={polygon([
          at(FLOOR_ORIGIN, iso(26, 0, 0)),
          at(FLOOR_ORIGIN, iso(72, 0, 0)),
          at(FLOOR_ORIGIN, iso(72, 0, 92)),
          at(FLOOR_ORIGIN, iso(26, 0, 92)),
        ])}
        fill={shade(MATERIALS.oak, 0.74)}
      />
      <polygon
        points={polygon([
          at(FLOOR_ORIGIN, iso(30, 0, 4)),
          at(FLOOR_ORIGIN, iso(68, 0, 4)),
          at(FLOOR_ORIGIN, iso(68, 0, 88)),
          at(FLOOR_ORIGIN, iso(30, 0, 88)),
        ])}
        fill="none"
        stroke={shade(MATERIALS.oak, 0.62)}
        strokeWidth={2}
      />
      {/* Handle. */}
      <circle
        cx={at(FLOOR_ORIGIN, iso(64, 0, 46)).x}
        cy={at(FLOOR_ORIGIN, iso(64, 0, 46)).y}
        r={3}
        fill={MATERIALS.aluminium}
      />

      {/* ---------------------------------------------------------------- */}
      {/* Rug anchoring the clinical area                                   */}
      {/* ---------------------------------------------------------------- */}
      <polygon
        points={polygon([
          at(FLOOR_ORIGIN, iso(84, 62, 0)),
          at(FLOOR_ORIGIN, iso(168, 62, 0)),
          at(FLOOR_ORIGIN, iso(168, 146, 0)),
          at(FLOOR_ORIGIN, iso(84, 146, 0)),
        ])}
        fill={MATERIALS.textile}
        opacity={0.85}
      />
      <polygon
        points={polygon([
          at(FLOOR_ORIGIN, iso(92, 70, 0)),
          at(FLOOR_ORIGIN, iso(160, 70, 0)),
          at(FLOOR_ORIGIN, iso(160, 138, 0)),
          at(FLOOR_ORIGIN, iso(92, 138, 0)),
        ])}
        fill="none"
        stroke={shade(MATERIALS.sage, 1.08)}
        strokeWidth={2}
        opacity={0.5}
      />

      {/* ---------------------------------------------------------------- */}
      {/* Permanent furniture                                               */}
      {/* ---------------------------------------------------------------- */}

      {/* Welcome desk, near the entrance. */}
      <ContactShadow
        origin={at(FLOOR_ORIGIN, iso(30, 54, 0))}
        w={44}
        d={22}
      />
      <IsoBox
        origin={at(FLOOR_ORIGIN, iso(30, 54, 0))}
        w={44}
        d={22}
        h={30}
        material="oak"
        topMaterial="limestone"
      />

      {/* Clinician desk, centre of the clinical zone. */}
      <ContactShadow
        origin={at(FLOOR_ORIGIN, iso(104, 78, 0))}
        w={52}
        d={26}
      />
      <IsoBox
        origin={at(FLOOR_ORIGIN, iso(104, 78, 0))}
        w={52}
        d={26}
        h={28}
        material="oak"
        topMaterial="limestone"
      />

      {/* Two consultation chairs facing each other across the rug. */}
      <Chair origin={at(FLOOR_ORIGIN, iso(100, 118, 0))} facing="left" />
      <Chair origin={at(FLOOR_ORIGIN, iso(142, 100, 0))} facing="right" />

      {/* Operations surface along the right wall. */}
      <ContactShadow
        origin={at(FLOOR_ORIGIN, iso(174, 34, 0))}
        w={30}
        d={44}
      />
      <IsoBox
        origin={at(FLOOR_ORIGIN, iso(174, 34, 0))}
        w={30}
        d={44}
        h={30}
        material="walnut"
        topMaterial="limestone"
      />

      {/* ---------------------------------------------------------------- */}
      {/* Waiting area, in the foreground                                   */}
      {/* ---------------------------------------------------------------- */}
      {/* The near corner of an isometric room reads as a hole if it is left
          bare. A practice also genuinely has somewhere for people to sit
          before a session, so filling it is honest as well as compositional. */}
      <polygon
        points={polygon([
          at(FLOOR_ORIGIN, iso(104, 152, 0)),
          at(FLOOR_ORIGIN, iso(202, 152, 0)),
          at(FLOOR_ORIGIN, iso(202, 202, 0)),
          at(FLOOR_ORIGIN, iso(104, 202, 0)),
        ])}
        fill={shade(MATERIALS.textile, 1.04)}
        opacity={0.55}
      />

      {/* Low table. Drawn first because it stands further back than the
          sofa; the scene is painted strictly back to front. */}
      <ContactShadow
        origin={at(FLOOR_ORIGIN, iso(112, 162, 0))}
        w={24}
        d={18}
        opacity={0.08}
      />
      <IsoBox
        origin={at(FLOOR_ORIGIN, iso(112, 162, 0))}
        w={24}
        d={18}
        h={10}
        material="walnut"
        topMaterial="oak"
      />

      {/* Two-seat sofa, facing back into the room. */}
      <ContactShadow
        origin={at(FLOOR_ORIGIN, iso(152, 154, 0))}
        w={44}
        d={24}
        opacity={0.1}
      />
      <IsoBox
        origin={at(FLOOR_ORIGIN, iso(152, 154, 0))}
        w={44}
        d={24}
        h={13}
        material="oak"
        topMaterial="sage"
      />
      {/* The back is a solid box rather than a flat panel, so the sofa has
          thickness from every visible face. */}
      <IsoBox
        origin={at(FLOOR_ORIGIN, iso(190, 154, 0))}
        w={6}
        d={24}
        h={30}
        material="sage"
      />
      {/* Floor lamp, between the waiting area and the window, so the near
          corner of the room is inhabited without adding another control. */}
      <ContactShadow
        origin={at(FLOOR_ORIGIN, iso(28, 148, 0))}
        w={12}
        d={12}
        opacity={0.08}
      />
      <IsoCylinder
        origin={at(FLOOR_ORIGIN, iso(34, 154, 0))}
        radius={3.4}
        h={4}
        material="walnut"
      />
      <IsoBox
        origin={at(FLOOR_ORIGIN, iso(33, 153, 4))}
        w={2.4}
        d={2.4}
        h={46}
        material="aluminium"
      />
      <IsoCylinder
        origin={at(FLOOR_ORIGIN, iso(34, 154, 50))}
        radius={9}
        h={6}
        material="ceramic"
      />

      {/* Seat division, so it reads as two places rather than one slab. */}
      <line
        x1={at(FLOOR_ORIGIN, iso(152, 166, 13)).x}
        y1={at(FLOOR_ORIGIN, iso(152, 166, 13)).y}
        x2={at(FLOOR_ORIGIN, iso(190, 166, 13)).x}
        y2={at(FLOOR_ORIGIN, iso(190, 166, 13)).y}
        stroke={shade(MATERIALS.sage, 0.86)}
        strokeWidth={1.2}
      />

      {/* Plant, softening the corner by the window. */}
      <ContactShadow
        origin={at(FLOOR_ORIGIN, iso(16, 170, 0))}
        w={14}
        d={14}
        opacity={0.08}
      />
      <IsoCylinder
        origin={at(FLOOR_ORIGIN, iso(23, 177, 0))}
        radius={7}
        h={18}
        material="ceramic"
      />
      <Foliage origin={at(FLOOR_ORIGIN, iso(23, 177, 18))} />
    </g>
  );
}

/**
 * A consultation chair.
 *
 * `facing` mirrors the backrest so the two chairs read as being in
 * conversation rather than as duplicates of one asset.
 */
function Chair({
  origin,
  facing,
}: {
  origin: { x: number; y: number };
  facing: "left" | "right";
}) {
  const seatW = 20;
  const seatD = 20;
  const legH = 6;

  return (
    <g>
      <ContactShadow origin={origin} w={seatW} d={seatD} opacity={0.09} />

      {/* Legs. A seat resting directly on the floor reads as a block; the
          gap underneath is most of what makes a chair look like furniture. */}
      {[
        [2, 2],
        [seatW - 5, 2],
        [2, seatD - 5],
      ].map(([dx, dy], index) => (
        <IsoBox
          key={index}
          origin={at(origin, iso(dx, dy, 0))}
          w={3}
          d={3}
          h={legH}
          material="walnut"
        />
      ))}

      {/* Seat cushion. */}
      <IsoBox
        origin={at(origin, iso(0, 0, legH))}
        w={seatW}
        d={seatD}
        h={9}
        material="sage"
        topMaterial="sage"
      />

      {/* Backrest on the side away from the rug centre. */}
      {facing === "left" ? (
        <IsoPanel
          origin={at(origin, iso(0, 0, legH + 9))}
          w={seatD}
          h={20}
          axis="y"
          material="sage"
        />
      ) : (
        <IsoPanel
          origin={at(origin, iso(0, 0, legH + 9))}
          w={seatW}
          h={20}
          axis="x"
          material="sage"
        />
      )}
    </g>
  );
}

/** Restrained foliage: three overlapping leaves, no detail noise. */
function Foliage({ origin }: { origin: { x: number; y: number } }) {
  return (
    <g>
      {[
        { dx: 0, dy: -16, r: 13, tone: 1.0 },
        { dx: -11, dy: -9, r: 10, tone: 0.9 },
        { dx: 11, dy: -8, r: 10, tone: 0.82 },
      ].map((leaf, index) => (
        <ellipse
          key={index}
          cx={origin.x + leaf.dx}
          cy={origin.y + leaf.dy}
          rx={leaf.r}
          ry={leaf.r * 0.82}
          fill={shade(MATERIALS.sage, leaf.tone)}
        />
      ))}
    </g>
  );
}
