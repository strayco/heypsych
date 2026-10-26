/**
 * Patient & Family World — "Find your way"
 *
 * A reading room: daylight through a tall window, an armchair with a lamp
 * beside it, a bookshelf, a writing desk, and an open door with warm light
 * beyond it. Nothing here depicts a person, a symptom, or a clinical setting.
 * The room says only that there is somewhere calm to begin, and a way through.
 *
 * Drawn with the Practice Architect primitives and on the Architect floor
 * footprint, so it shares the clinician world's projection, light, materials,
 * and furniture scale. Painted strictly back to front.
 *
 * Interaction (CSS only, see worlds.module.css):
 * - the lamp, the daylight on the floor, and the light through the doorway
 *   warm up;
 * - the notebook on the desk opens and a mug appears beside it.
 */

import type { CSSProperties } from "react";
import {
  MATERIALS,
  faceColor,
  polygon,
  shade,
  type MaterialName,
} from "@/domains/architect/world/scene";
import {
  ContactShadow,
  IsoBox,
  IsoCylinder,
  IsoPanel,
  WallPlaque,
} from "@/app/architect/_components/world/primitives";
import styles from "./worlds.module.css";
import { Plinth, RoomEnvelope, WallCaps } from "./Diorama";
import { P, WORLD_VIEWBOX_ATTR } from "./geometry";

function light(rest: number, active: number): CSSProperties {
  return { "--rest": rest, "--active": active } as CSSProperties;
}

export function PatientWorldScene() {
  return (
    <svg
      viewBox={WORLD_VIEWBOX_ATTR}
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
      focusable="false"
    >
      <g className={styles.stage}>
        <Plinth shadowClassName={styles.groundShadow} />
        <RoomEnvelope />

        {/* -------------------------------------------------------------- */}
        {/* Left wall: window and a framed print                          */}
        {/* -------------------------------------------------------------- */}
        <Window />
        <WallPlaque origin={P(0, 22, 64)} w={34} h={42} axis="y" material="paper">
          <IsoPanel origin={P(0, 26, 70)} w={26} h={16} axis="y" material="sage" opacity={0.7} />
          <IsoPanel origin={P(0, 26, 86)} w={26} h={14} axis="y" material="glass" opacity={0.9} />
          <circle cx={P(0, 34, 92).x} cy={P(0, 34, 92).y} r={4} fill={shade(MATERIALS.oak, 1.08)} />
        </WallPlaque>

        {/* -------------------------------------------------------------- */}
        {/* Right wall: the open doorway, the bookshelf, the desk         */}
        {/* -------------------------------------------------------------- */}
        <Doorway />
        <Bookshelf />

        {/* A small framed map above the desk. Finding your way, quietly. */}
        <WallPlaque origin={P(160, 0, 66)} w={26} h={24} axis="x" material="paper">
          <polyline
            points={polygon([P(163, 0, 74), P(169, 0, 80), P(175, 0, 76), P(183, 0, 83)])}
            fill="none"
            stroke={shade(MATERIALS.sage, 0.95)}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={P(175, 0, 76).x} cy={P(175, 0, 76).y} r={2.6} fill="#456C7E" />
        </WallPlaque>

        {/* Rug, drawn before any furniture that stands on it. */}
        <polygon
          points={polygon([P(70, 62), P(158, 62), P(158, 148), P(70, 148)])}
          fill={MATERIALS.textile}
          opacity={0.8}
        />
        <polygon
          points={polygon([P(77, 69), P(151, 69), P(151, 141), P(77, 141)])}
          fill="none"
          stroke={shade(MATERIALS.oak, 1.04)}
          strokeWidth={2}
          opacity={0.55}
        />

        {/* Daylight falling through the window onto the floor. */}
        <polygon
          className={styles.light}
          style={light(0.4, 0.7)}
          points={polygon([P(0, 98), P(0, 166), P(58, 190), P(58, 122)])}
          fill="#FFFFFF"
        />
        {/* Light from the doorway, spilling into the room. */}
        <polygon
          className={styles.light}
          style={light(0.45, 1)}
          points={polygon([P(28, 0), P(68, 0), P(82, 74), P(34, 74)])}
          fill="url(#hp-door-spill)"
        />

        {/* Plant in the far corner, beside the door. */}
        <Plant gx={13} gy={14} pot={6} potH={15} scale={1} />

        <Desk />

        <Armchair />
        <SideTableWithLamp />

        {/* A low round table at the centre of the rug. */}
        <LowTable gx={112} gy={104} />

        {/* Ottoman with an open book resting on it. */}
        <ContactShadow origin={P(66, 116)} w={18} d={18} opacity={0.09} />
        <IsoBox origin={P(66, 116)} w={18} d={18} h={11} material="textile" />
        <OpenBook gx={68} gy={119} gz={11} />

        {/* A few books set down on the floor by the chair. */}
        <ContactShadow origin={P(60, 154)} w={12} d={10} opacity={0.07} />
        <IsoBox origin={P(60, 154)} w={12} d={10} h={2.6} material="slate" />
        <IsoBox origin={P(61, 155, 2.6)} w={10} d={8} h={2.4} material="oak" />
        <IsoBox origin={P(60.5, 154.5, 5)} w={11} d={9} h={2.2} material="sage" />

        {/* Near corner: a tall plant and a low bench with a folded throw. */}
        <Plant gx={190} gy={150} pot={8} potH={20} scale={1.35} />
        <ContactShadow origin={P(118, 180)} w={66} d={16} opacity={0.09} />
        <IsoBox origin={P(118, 180)} w={66} d={16} h={13} material="walnut" topMaterial="oak" />
        <IsoBox origin={P(152, 181, 13)} w={24} d={14} h={3.4} material="textile" />
        <IsoBox origin={P(154, 182, 16.4)} w={20} d={12} h={2.4} material="sage" />

        <WallCaps />
      </g>
    </svg>
  );
}

// ============================================================================
// PARTS
// ============================================================================

function Window() {
  const pane = [P(0, 96, 36), P(0, 170, 36), P(0, 170, 122), P(0, 96, 122)];

  return (
    <g>
      <polygon points={polygon(pane)} fill={MATERIALS.glass} />
      <polygon points={polygon(pane)} fill="url(#hp-window-light)" />
      {/* Brighter sky as the room is considered. */}
      <polygon
        className={styles.light}
        style={light(0, 0.35)}
        points={polygon(pane)}
        fill="#FFFFFF"
      />
      <polygon points={polygon(pane)} fill="none" stroke={MATERIALS.plaster} strokeWidth={5} />
      {[P(0, 133, 36), P(0, 96, 80)].map((from, index) => {
        const to = index === 0 ? P(0, 133, 122) : P(0, 170, 80);
        return (
          <line
            key={index}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={MATERIALS.plaster}
            strokeWidth={3.5}
          />
        );
      })}
      {/* Deep sill, catching the light. */}
      <IsoBox origin={P(0, 92, 33)} w={7} d={82} h={3} material="oak" />
    </g>
  );
}

function Doorway() {
  const opening = [P(28, 0, 0), P(68, 0, 0), P(68, 0, 94), P(28, 0, 94)];

  return (
    <g>
      {/* The space beyond the door, lit warmly. */}
      <polygon points={polygon(opening)} fill="url(#hp-doorway-light)" />
      <polygon
        className={styles.light}
        style={light(0.25, 0.7)}
        points={polygon(opening)}
        fill="#FFF7E8"
      />
      {/* A glimpse of the next room's floor through the opening. */}
      <polygon
        points={polygon([P(28, 0, 0), P(68, 0, 0), P(68, 0, 7), P(28, 0, 7)])}
        fill={shade(MATERIALS.oak, 1.08)}
        opacity={0.7}
      />
      {/* Architrave. */}
      <polygon
        points={polygon([P(24, 0, 0), P(72, 0, 0), P(72, 0, 98), P(24, 0, 98)])}
        fill="none"
        stroke={shade(MATERIALS.plaster, 0.9)}
        strokeWidth={4}
      />
      {/* Threshold. */}
      <polygon
        points={polygon([P(28, 0, 0), P(68, 0, 0), P(68, 4, 0), P(28, 4, 0)])}
        fill={shade(MATERIALS.oak, 0.9)}
      />
      {/* The door stands open into the room, hinged on its far edge. */}
      <ContactShadow origin={P(68, 0)} w={4} d={38} opacity={0.08} />
      <IsoBox origin={P(68, 0)} w={3} d={38} h={92} material="oak" />
      <circle cx={P(71, 33, 46).x} cy={P(71, 33, 46).y} r={2.6} fill={MATERIALS.aluminium} />
    </g>
  );
}

type Book = readonly [gx: number, w: number, h: number, material: MaterialName];

const SHELF_ROWS: { z: number; books: Book[] }[] = [
  {
    z: 6,
    books: [
      [90, 4, 19, "slate"],
      [94.5, 3.5, 21, "oak"],
      [98.5, 5, 18, "sage"],
      [104, 3.5, 22, "walnut"],
      [116, 4, 17, "ceramic"],
      [120.5, 4.5, 20, "slate"],
      [125.5, 3.5, 18, "oak"],
    ],
  },
  {
    z: 37,
    books: [
      [89, 3.5, 20, "walnut"],
      [93, 4.5, 17, "textile"],
      [98, 3.5, 21, "sage"],
      [102, 4, 19, "slate"],
      [125, 4, 18, "oak"],
      [129.5, 4, 21, "walnut"],
    ],
  },
  {
    z: 68,
    books: [
      [89, 4, 18, "sage"],
      [93.5, 3.5, 20, "oak"],
      [111, 4, 19, "slate"],
      [115.5, 3.5, 17, "textile"],
      [119.5, 4.5, 21, "walnut"],
    ],
  },
];

function Bookshelf() {
  const left = 84;
  const right = 136;
  const depth = 12;
  const height = 100;
  const board = 2.5;

  return (
    <g>
      <ContactShadow origin={P(left, 0)} w={right - left + 3} d={depth} opacity={0.08} />
      {/* A darker back panel so the books read against it. */}
      <polygon
        points={polygon([
          P(left, 0, 0),
          P(right + 3, 0, 0),
          P(right + 3, 0, height),
          P(left, 0, height),
        ])}
        fill={shade(MATERIALS.oak, 0.72)}
      />
      <IsoBox origin={P(left, 0)} w={3} d={depth} h={height} material="oak" />

      {/* Plinth of the shelf. */}
      <IsoBox origin={P(left + 3, 0)} w={right - left - 3} d={depth} h={6} material="oak" />

      {SHELF_ROWS.map((row, rowIndex) => (
        <g key={row.z}>
          {rowIndex > 0 && (
            <IsoBox
              origin={P(left + 3, 0, row.z - board)}
              w={right - left - 3}
              d={depth}
              h={board}
              material="oak"
            />
          )}
          {row.books.map(([gx, w, h, material]) => (
            <IsoBox
              key={gx}
              origin={P(gx, 1.5, row.z)}
              w={w}
              d={depth - 3}
              h={h}
              material={material}
            />
          ))}
        </g>
      ))}

      {/* A small stack lying flat, and a pot, so the shelf feels lived with. */}
      <IsoBox origin={P(109, 2, 6)} w={6} d={8} h={2.4} material="sage" />
      <IsoBox origin={P(109.5, 2.5, 8.4)} w={5} d={7} h={2.2} material="paper" />
      <IsoCylinder origin={P(110, 7, 37)} radius={3.6} h={7} material="ceramic" />
      <ellipse
        cx={P(110, 7, 44).x}
        cy={P(110, 7, 44).y - 6}
        rx={8}
        ry={6.5}
        fill={shade(MATERIALS.sage, 0.95)}
      />
      <IsoBox origin={P(100, 2, 68)} w={7} d={8} h={2.6} material="walnut" />

      {/* Top. */}
      <IsoBox
        origin={P(left + 3, 0, height - 3)}
        w={right - left - 3}
        d={depth}
        h={3}
        material="oak"
      />
      <IsoBox origin={P(right, 0)} w={3} d={depth} h={height} material="oak" />
    </g>
  );
}

function Desk() {
  const x0 = 150;
  const y0 = 4;
  const w = 50;
  const d = 24;
  const legH = 26;

  return (
    <g>
      <ContactShadow origin={P(x0, y0)} w={w} d={d} opacity={0.08} />
      {/* Back legs, then front legs, then the top. */}
      {[
        [x0 + 1, y0 + 1],
        [x0 + w - 4, y0 + 1],
        [x0 + 1, y0 + d - 4],
        [x0 + w - 4, y0 + d - 4],
      ].map(([gx, gy], index) => (
        <IsoBox key={index} origin={P(gx, gy)} w={2.6} d={2.6} h={legH} material="walnut" />
      ))}
      <IsoBox origin={P(x0, y0, legH)} w={w} d={d} h={3} material="oak" />

      {/* On the desk: a notebook, a pencil, a phone. */}
      <g className={`${styles.focus}`}>
        <IsoBox origin={P(156, 9, legH + 3)} w={14} d={11} h={1.4} material="sage" />
        <OpenNotebookPages />
      </g>
      <line
        x1={P(173, 12, legH + 3.4).x}
        y1={P(173, 12, legH + 3.4).y}
        x2={P(173, 21, legH + 3.4).x}
        y2={P(173, 21, legH + 3.4).y}
        stroke={shade(MATERIALS.oak, 0.6)}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <IsoBox
        origin={P(178, 10, legH + 3)}
        w={6}
        d={10}
        h={1.2}
        material="graphite"
        topMaterial="screen"
      />

      {/* A mug appears beside the notebook. */}
      <g className={`${styles.reveal} ${styles.delay1}`}>
        <IsoCylinder origin={P(191, 14, legH + 3)} radius={2.6} h={6} material="ceramic" />
      </g>

      {/* Chair pulled up to the desk. */}
      <ContactShadow origin={P(164, 32)} w={18} d={18} opacity={0.08} />
      {[
        [165, 33],
        [179, 33],
        [165, 47],
        [179, 47],
      ].map(([gx, gy], index) => (
        <IsoBox key={index} origin={P(gx, gy)} w={2.2} d={2.2} h={15} material="walnut" />
      ))}
      <IsoBox origin={P(164, 32, 15)} w={18} d={18} h={3} material="oak" />
      <IsoBox origin={P(164, 47, 18)} w={18} d={3} h={18} material="oak" />
    </g>
  );
}

/** Two pages of an open notebook on the desk, revealed on interest. */
function OpenNotebookPages() {
  const z = 29.4;
  return (
    <g>
      <polygon
        points={polygon([
          P(156.5, 9.5, z),
          P(163, 9.5, z + 0.6),
          P(163, 19.5, z + 0.6),
          P(156.5, 19.5, z),
        ])}
        fill={faceColor("paper", "top")}
      />
      <polygon
        points={polygon([
          P(163, 9.5, z + 0.6),
          P(169.5, 9.5, z),
          P(169.5, 19.5, z),
          P(163, 19.5, z + 0.6),
        ])}
        fill={shade(MATERIALS.paper, 0.97)}
      />
      {[12, 14.5, 17].map((gy) => (
        <line
          key={gy}
          x1={P(158, gy, z + 0.3).x}
          y1={P(158, gy, z + 0.3).y}
          x2={P(161.5, gy, z + 0.5).x}
          y2={P(161.5, gy, z + 0.5).y}
          stroke={shade(MATERIALS.slate, 1.2)}
          strokeWidth={0.9}
          opacity={0.6}
        />
      ))}
    </g>
  );
}

function Armchair() {
  const gx = 30;
  const gy = 110;
  const w = 30;
  const d = 28;
  const legH = 6;

  return (
    <g>
      <ContactShadow origin={P(gx, gy)} w={w} d={d} opacity={0.1} />
      {[
        [gx + 1, gy + 1],
        [gx + w - 4, gy + 1],
        [gx + 1, gy + d - 4],
        [gx + w - 4, gy + d - 4],
      ].map(([lx, ly], index) => (
        <IsoBox key={index} origin={P(lx, ly)} w={2.4} d={2.4} h={legH} material="walnut" />
      ))}
      {/* Seat base. */}
      <IsoBox origin={P(gx, gy, legH)} w={w} d={d} h={9} material="sage" />
      {/* Back, against the window side, so the chair faces into the room. */}
      <IsoBox origin={P(gx, gy, legH + 9)} w={8} d={d} h={34} material="sage" />
      {/* Far arm, cushion, near arm. */}
      <IsoBox origin={P(gx + 8, gy, legH + 9)} w={w - 8} d={5} h={14} material="sage" />
      <IsoBox
        origin={P(gx + 8, gy + 5, legH + 9)}
        w={w - 9}
        d={d - 10}
        h={5}
        material="sage"
        topMaterial="textile"
      />
      <IsoBox origin={P(gx + 8, gy + d - 5, legH + 9)} w={w - 8} d={5} h={14} material="sage" />
      {/* A cushion against the back, and a throw over the near arm. */}
      <IsoBox origin={P(gx + 8, gy + 9, legH + 14)} w={4} d={10} h={12} material="textile" />
      <IsoBox origin={P(gx + 13, gy + d - 5.5, legH + 23)} w={10} d={6} h={1.6} material="oak" />
    </g>
  );
}

function SideTableWithLamp() {
  const gx = 34;
  const gy = 146;
  const size = 14;
  const h = 22;
  const cx = gx + size / 2;
  const cy = gy + size / 2;
  const shade_ = P(cx, cy, h + 34);

  return (
    <g>
      {/* The pool of lamplight on the floor and the glow around the shade. */}
      <ellipse
        className={styles.light}
        style={light(0.35, 0.9)}
        cx={P(cx, cy).x}
        cy={P(cx, cy).y}
        rx={62}
        ry={30}
        fill="url(#hp-warm-light)"
      />
      <ContactShadow origin={P(gx, gy)} w={size} d={size} opacity={0.08} />
      <IsoBox origin={P(gx, gy)} w={size} d={size} h={h} material="walnut" topMaterial="oak" />
      <IsoCylinder origin={P(cx, cy, h)} radius={2.6} h={3} material="ceramic" />
      <IsoBox origin={P(cx - 0.8, cy - 0.8, h + 3)} w={1.6} d={1.6} h={24} material="aluminium" />
      <ellipse
        className={styles.light}
        style={light(0.45, 1)}
        cx={shade_.x}
        cy={shade_.y - 2}
        rx={44}
        ry={38}
        fill="url(#hp-warm-light)"
      />
      {/* The shade's lit underside, then the shade. */}
      <ellipse cx={P(cx, cy, h + 27).x} cy={P(cx, cy, h + 27).y} rx={16} ry={8} fill="#F7E3BC" />
      <IsoCylinder origin={P(cx, cy, h + 27)} radius={8} h={12} material="textile" />
      {/* A notebook on the table. */}
      <IsoBox origin={P(gx + 2, gy + 8, h)} w={7} d={5} h={1.2} material="slate" />
    </g>
  );
}

function LowTable({ gx, gy }: { gx: number; gy: number }) {
  return (
    <g>
      <ContactShadow origin={P(gx - 11, gy - 11)} w={22} d={22} opacity={0.08} />
      <IsoCylinder origin={P(gx, gy)} radius={4} h={9} material="walnut" />
      <IsoCylinder origin={P(gx, gy, 9)} radius={12} h={3} material="oak" />
      {/* A small vase with a single stem, and two books. */}
      <IsoCylinder origin={P(gx - 3, gy - 4, 12)} radius={2.2} h={8} material="ceramic" />
      <path
        d={`M ${P(gx - 3, gy - 4, 20).x} ${P(gx - 3, gy - 4, 20).y} q 3 -10 9 -14`}
        fill="none"
        stroke={shade(MATERIALS.sage, 0.9)}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <ellipse
        cx={P(gx - 3, gy - 4, 20).x + 9}
        cy={P(gx - 3, gy - 4, 20).y - 14}
        rx={4}
        ry={2.6}
        fill={shade(MATERIALS.sage, 1.02)}
      />
      <IsoBox origin={P(gx + 1, gy + 1, 12)} w={8} d={6} h={1.8} material="slate" />
      <IsoBox origin={P(gx + 1.5, gy + 1.5, 13.8)} w={7} d={5} h={1.6} material="paper" />
    </g>
  );
}

function OpenBook({ gx, gy, gz }: { gx: number; gy: number; gz: number }) {
  return (
    <g>
      <polygon
        points={polygon([
          P(gx, gy, gz),
          P(gx + 6.5, gy, gz + 1.2),
          P(gx + 6.5, gy + 11, gz + 1.2),
          P(gx, gy + 11, gz),
        ])}
        fill={faceColor("paper", "top")}
      />
      <polygon
        points={polygon([
          P(gx + 6.5, gy, gz + 1.2),
          P(gx + 13, gy, gz),
          P(gx + 13, gy + 11, gz),
          P(gx + 6.5, gy + 11, gz + 1.2),
        ])}
        fill={shade(MATERIALS.paper, 0.95)}
      />
      <line
        x1={P(gx + 6.5, gy, gz + 1.2).x}
        y1={P(gx + 6.5, gy, gz + 1.2).y}
        x2={P(gx + 6.5, gy + 11, gz + 1.2).x}
        y2={P(gx + 6.5, gy + 11, gz + 1.2).y}
        stroke={shade(MATERIALS.textile, 0.8)}
        strokeWidth={0.8}
      />
    </g>
  );
}

function Plant({
  gx,
  gy,
  pot,
  potH,
  scale,
}: {
  gx: number;
  gy: number;
  pot: number;
  potH: number;
  scale: number;
}) {
  const top = P(gx, gy, potH);
  const leaves = [
    { dx: 0, dy: -22, r: 12, tone: 1.02 },
    { dx: -12, dy: -14, r: 11, tone: 0.92 },
    { dx: 11, dy: -12, r: 10, tone: 0.84 },
    { dx: -4, dy: -32, r: 9, tone: 1.06 },
    { dx: 6, dy: -26, r: 9, tone: 0.9 },
  ];

  return (
    <g>
      <ContactShadow origin={P(gx - pot, gy - pot)} w={pot * 2} d={pot * 2} opacity={0.08} />
      <IsoCylinder origin={P(gx, gy)} radius={pot} h={potH} material="ceramic" />
      {leaves.map((leaf, index) => (
        <ellipse
          key={index}
          cx={top.x + leaf.dx * scale}
          cy={top.y + leaf.dy * scale}
          rx={leaf.r * scale}
          ry={leaf.r * 0.82 * scale}
          fill={shade(MATERIALS.sage, leaf.tone)}
        />
      ))}
    </g>
  );
}
