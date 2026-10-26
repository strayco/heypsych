/**
 * Discovery objects
 *
 * Five small objects from the same illustrated universe, one for each area of
 * HeyPsych. They are drawn with the Architect primitives at the same scale as
 * the furniture in the worlds, so they read as things picked up from those
 * rooms rather than as an icon set.
 *
 * They are decorative. Every object always appears with a visible text label;
 * meaning never depends on recognising the symbol.
 */

import { MATERIALS, iso, polygon, shade, type MaterialName } from "@/domains/architect/world/scene";
import {
  ContactShadow,
  IsoBox,
  IsoCylinder,
  IsoPanel,
  Screen,
} from "@/app/architect/_components/world/primitives";

export type DiscoveryObjectId =
  | "conditions"
  | "treatments"
  | "tools"
  | "care"
  | "clinician"
  | "notebook"
  | "reading"
  | "armchair"
  | "doorway";

const O = { x: 0, y: 0 };

/** A point near the object's local origin. */
function Q(gx: number, gy: number, gz = 0) {
  return iso(gx, gy, gz);
}

function Frame({ viewBox, children }: { viewBox: string; children: React.ReactNode }) {
  return (
    <svg
      viewBox={viewBox}
      className="h-full w-full"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMax meet"
    >
      {children}
    </svg>
  );
}

// ============================================================================
// CONDITIONS — a stack of books
// ============================================================================

function Book({
  gx,
  gy,
  gz,
  w,
  d,
  h,
  cover,
}: {
  gx: number;
  gy: number;
  gz: number;
  w: number;
  d: number;
  h: number;
  cover: MaterialName;
}) {
  const board = 0.9;
  return (
    <g>
      <IsoBox origin={Q(gx, gy, gz)} w={w} d={d} h={board} material={cover} />
      <IsoBox
        origin={Q(gx, gy, gz + board)}
        w={w - 1.4}
        d={d - 1.4}
        h={h - board * 2}
        material="paper"
      />
      <IsoBox origin={Q(gx, gy, gz + h - board)} w={w} d={d} h={board} material={cover} />
    </g>
  );
}

function Books() {
  return (
    <Frame viewBox="-64 -34 144 106">
      <ContactShadow origin={O} w={36} d={26} opacity={0.1} />
      <Book gx={0} gy={0} gz={0} w={34} d={25} h={8} cover="slate" />
      <Book gx={3} gy={2} gz={8} w={29} d={21} h={7} cover="sage" />
      <Book gx={5} gy={4} gz={15} w={24} d={17} h={6} cover="oak" />
      {/* A ribbon marker hanging from the top book. */}
      <polygon
        points={polygon([
          Q(22, 21, 21),
          Q(24, 21, 21),
          Q(24, 21, 12),
          Q(23, 21, 13),
          Q(22, 21, 12),
        ])}
        fill={shade("#AD655E", 1.05)}
        opacity={0.85}
      />
    </Frame>
  );
}

// ============================================================================
// TREATMENTS — a reference card box
// ============================================================================

function CardBox() {
  const cards = [4, 8, 12, 16, 20, 24];
  return (
    <Frame viewBox="-60 -40 140 104">
      <ContactShadow origin={O} w={32} d={20} opacity={0.1} />
      {/* Cards stand inside the box; their tops show above its rim. */}
      {cards.map((gx, index) => (
        <IsoBox
          key={gx}
          origin={Q(gx, 1.5, 6)}
          w={0.9}
          d={17}
          h={index === 2 ? 15 : 12}
          material="paper"
        />
      ))}
      {/* A coloured divider tab. */}
      <IsoBox origin={Q(12.9, 4, 18)} w={0.9} d={6} h={3.2} material="sage" />
      <IsoBox origin={O} w={32} d={20} h={12} material="walnut" topMaterial="walnut" />
      {/* Open top: the box rim drawn over the cards' lower edges. */}
      <polygon
        points={polygon([Q(1.5, 1.5, 12), Q(30.5, 1.5, 12), Q(30.5, 18.5, 12), Q(1.5, 18.5, 12)])}
        fill={shade(MATERIALS.walnut, 0.66)}
      />
      {cards.map((gx, index) => (
        <IsoBox
          key={`front-${gx}`}
          origin={Q(gx, 1.5, 12)}
          w={0.9}
          d={17}
          h={index === 2 ? 9 : 6}
          material="paper"
        />
      ))}
      <IsoBox origin={Q(12.9, 4, 18)} w={0.9} d={6} h={3.2} material="sage" />
      {/* Label plate on the front. */}
      <IsoPanel origin={Q(12, 20, 4)} w={8} h={4} axis="x" material="limestone" />
    </Frame>
  );
}

// ============================================================================
// APPS & TOOLS — a phone
// ============================================================================

function Phone() {
  const tiles: [number, number, MaterialName][] = [];
  const materials: MaterialName[] = [
    "sage",
    "slate",
    "oak",
    "ceramic",
    "slate",
    "sage",
    "oak",
    "ceramic",
    "sage",
  ];
  let i = 0;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      tiles.push([3 + col * 4.6, 5 + row * 5, materials[i++]]);
    }
  }
  return (
    <Frame viewBox="-84 -26 144 106">
      <ContactShadow origin={O} w={18} d={32} opacity={0.12} />
      <IsoBox origin={O} w={18} d={32} h={2.2} material="graphite" topMaterial="screen" />
      {tiles.map(([gx, gy, material]) => (
        <polygon
          key={`${gx}-${gy}`}
          points={polygon([
            Q(gx, gy, 2.25),
            Q(gx + 3.2, gy, 2.25),
            Q(gx + 3.2, gy + 3.2, 2.25),
            Q(gx, gy + 3.2, 2.25),
          ])}
          fill={shade(MATERIALS[material], 1.05)}
          opacity={0.9}
        />
      ))}
      {/* Single highlight across the glass. */}
      <polygon
        points={polygon([Q(1, 1, 2.3), Q(9, 1, 2.3), Q(1, 14, 2.3)])}
        fill="#FFFFFF"
        opacity={0.08}
      />
    </Frame>
  );
}

// ============================================================================
// FIND CARE — a folded map with a pin
// ============================================================================

function MapWithPin() {
  const folds = [0, 11, 22, 33];
  const pin = Q(20, 13, 1.4);
  return (
    <Frame viewBox="-58 -44 140 102">
      <ContactShadow origin={O} w={33} d={24} opacity={0.1} />
      {folds.slice(0, 3).map((gx, index) => {
        const z0 = index % 2 === 0 ? 0 : 2.4;
        const z1 = index % 2 === 0 ? 2.4 : 0;
        const next = folds[index + 1];
        return (
          <polygon
            key={gx}
            points={polygon([Q(gx, 0, z0), Q(next, 0, z1), Q(next, 24, z1), Q(gx, 24, z0)])}
            fill={shade(MATERIALS.paper, index === 1 ? 0.93 : 1.02)}
            stroke={shade(MATERIALS.limestone, 0.9)}
            strokeWidth={0.6}
          />
        );
      })}
      {/* A route and a patch of park. */}
      <polygon
        points={polygon([Q(3, 3, 0.4), Q(9, 3, 1.7), Q(9, 10, 1.7), Q(3, 10, 0.4)])}
        fill={MATERIALS.sage}
        opacity={0.45}
      />
      <polyline
        points={polygon([Q(4, 20, 0.6), Q(11, 15, 2.4), Q(16, 15, 1.3), Q(20, 13, 1.4)])}
        fill="none"
        stroke={MATERIALS.slate}
        strokeWidth={1.4}
        strokeDasharray="3 2.4"
        strokeLinecap="round"
        opacity={0.8}
      />
      {/* The pin: a short stem and a head, casting a small shadow. */}
      <ellipse cx={pin.x + 2} cy={pin.y + 1} rx={4} ry={2} fill="#4A4336" opacity={0.18} />
      <line
        x1={pin.x}
        y1={pin.y}
        x2={pin.x}
        y2={pin.y - 15}
        stroke={MATERIALS.graphite}
        strokeWidth={1.4}
      />
      <circle cx={pin.x} cy={pin.y - 18} r={5} fill="#456C7E" />
      <circle cx={pin.x - 1.6} cy={pin.y - 19.6} r={1.6} fill="#FFFFFF" opacity={0.35} />
    </Frame>
  );
}

// ============================================================================
// CLINICIAN TOOLS — a small workstation
// ============================================================================

function Workstation() {
  return (
    <Frame viewBox="-58 -50 144 112">
      <ContactShadow origin={O} w={32} d={20} opacity={0.1} />
      <IsoBox origin={O} w={32} d={20} h={11} material="oak" topMaterial="limestone" />
      {/* Monitor stand and screen, angled into the room like the Architect's. */}
      <IsoBox origin={Q(13, 5, 11)} w={6} d={4} h={1} material="aluminium" />
      <IsoBox origin={Q(15.2, 6, 12)} w={1.6} d={1.6} h={5} material="aluminium" />
      <g transform={`translate(${Q(7, 7, 17).x}, ${Q(7, 7, 17).y})`}>
        <IsoPanel origin={O} w={18} h={13} axis="x" material="graphite" />
        <Screen origin={{ x: 1.2, y: -0.6 }} w={16} h={11} axis="x" active accent="#9BBFCE" />
      </g>
      {/* Keyboard. */}
      <IsoBox origin={Q(10, 12, 11)} w={12} d={4} h={0.8} material="ceramic" />
      {/* A small plant at the desk corner. */}
      <IsoCylinder origin={Q(27, 4, 11)} radius={2.2} h={4} material="ceramic" />
      <ellipse
        cx={Q(27, 4, 15).x}
        cy={Q(27, 4, 15).y - 3}
        rx={5}
        ry={4}
        fill={shade(MATERIALS.sage, 0.96)}
      />
    </Frame>
  );
}

// ============================================================================
// SYMPTOMS — an open notebook and pencil
// ============================================================================

function Notebook() {
  const z = 2.2;
  return (
    <Frame viewBox="-62 -24 140 92">
      <ContactShadow origin={O} w={34} d={24} opacity={0.1} />
      {/* Covers. */}
      <IsoBox origin={O} w={34} d={24} h={1.4} material="sage" />
      {/* Left and right pages, rising slightly toward the spine. */}
      <polygon
        points={polygon([Q(1, 1, z), Q(17, 1, z + 1.6), Q(17, 23, z + 1.6), Q(1, 23, z)])}
        fill={shade(MATERIALS.paper, 1.04)}
      />
      <polygon
        points={polygon([Q(17, 1, z + 1.6), Q(33, 1, z), Q(33, 23, z), Q(17, 23, z + 1.6)])}
        fill={shade(MATERIALS.paper, 0.95)}
      />
      {/* Ruled lines with a few words already written. */}
      {[5, 9, 13, 17].map((gy, index) => (
        <line
          key={gy}
          x1={Q(3, gy, z + 0.4).x}
          y1={Q(3, gy, z + 0.4).y}
          x2={Q(index === 3 ? 9 : 14.5, gy, z + 1.4).x}
          y2={Q(index === 3 ? 9 : 14.5, gy, z + 1.4).y}
          stroke={shade(MATERIALS.slate, 1.15)}
          strokeWidth={1}
          strokeLinecap="round"
          opacity={0.7}
        />
      ))}
      {/* Spine stitching. */}
      <line
        x1={Q(17, 1, z + 1.6).x}
        y1={Q(17, 1, z + 1.6).y}
        x2={Q(17, 23, z + 1.6).x}
        y2={Q(17, 23, z + 1.6).y}
        stroke={shade(MATERIALS.textile, 0.78)}
        strokeWidth={0.9}
      />
      {/* Pencil resting across the right page. */}
      <line
        x1={Q(21, 6, z + 1.6).x}
        y1={Q(21, 6, z + 1.6).y}
        x2={Q(31, 18, z + 0.6).x}
        y2={Q(31, 18, z + 0.6).y}
        stroke={MATERIALS.oak}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
      <circle
        cx={Q(31, 18, z + 0.6).x}
        cy={Q(31, 18, z + 0.6).y}
        r={1.2}
        fill={MATERIALS.graphite}
      />
    </Frame>
  );
}

// ============================================================================
// LEARN & GUIDES — a book open on a reading stand
// ============================================================================

function ReadingStand() {
  return (
    <Frame viewBox="-60 -48 136 108">
      <ContactShadow origin={O} w={30} d={22} opacity={0.1} />
      {/* A low walnut stand with a raised back. */}
      <IsoBox origin={O} w={30} d={22} h={4} material="walnut" topMaterial="oak" />
      <IsoBox origin={Q(0, 0, 4)} w={30} d={4} h={12} material="walnut" />
      {/* Open book leaning against the stand. */}
      <polygon
        points={polygon([Q(1, 4, 16), Q(15, 4, 17.5), Q(15, 18, 5.5), Q(1, 18, 4.2)])}
        fill={shade(MATERIALS.paper, 1.04)}
      />
      <polygon
        points={polygon([Q(15, 4, 17.5), Q(29, 4, 16), Q(29, 18, 4.2), Q(15, 18, 5.5)])}
        fill={shade(MATERIALS.paper, 0.94)}
      />
      {[7, 10, 13].map((t) => (
        <line
          key={t}
          x1={Q(3, t, 16 - (t - 4) * 0.84).x}
          y1={Q(3, t, 16 - (t - 4) * 0.84).y}
          x2={Q(12.5, t, 17.2 - (t - 4) * 0.86).x}
          y2={Q(12.5, t, 17.2 - (t - 4) * 0.86).y}
          stroke={shade(MATERIALS.slate, 1.2)}
          strokeWidth={0.9}
          opacity={0.6}
        />
      ))}
      <line
        x1={Q(15, 4, 17.5).x}
        y1={Q(15, 4, 17.5).y}
        x2={Q(15, 18, 5.5).x}
        y2={Q(15, 18, 5.5).y}
        stroke={shade(MATERIALS.textile, 0.75)}
        strokeWidth={0.9}
      />
      {/* A bookmark ribbon. */}
      <polygon
        points={polygon([
          Q(22, 18, 4.8),
          Q(24, 18, 4.6),
          Q(24, 21, 0.4),
          Q(23, 20.5, 1.2),
          Q(22, 21, 0.4),
        ])}
        fill={shade("#AD655E", 1.05)}
        opacity={0.85}
      />
    </Frame>
  );
}

// ============================================================================
// SUPPORT & COMMUNITY — an armchair with a throw
// ============================================================================

function Armchair() {
  const legH = 4;
  return (
    <Frame viewBox="-70 -78 144 150">
      <ContactShadow origin={O} w={28} d={26} opacity={0.12} />
      {[
        [1, 1],
        [25, 1],
        [1, 23],
        [25, 23],
      ].map(([gx, gy], index) => (
        <IsoBox key={index} origin={Q(gx, gy)} w={2.2} d={2.2} h={legH} material="walnut" />
      ))}
      <IsoBox origin={Q(0, 0, legH)} w={28} d={26} h={8} material="sage" />
      <IsoBox origin={Q(0, 0, legH + 8)} w={7} d={26} h={30} material="sage" />
      <IsoBox origin={Q(7, 0, legH + 8)} w={21} d={5} h={12} material="sage" />
      <IsoBox
        origin={Q(7, 5, legH + 8)}
        w={20}
        d={16}
        h={4}
        material="sage"
        topMaterial="textile"
      />
      <IsoBox origin={Q(7, 9, legH + 12)} w={4} d={8} h={11} material="textile" />
      <IsoBox origin={Q(7, 21, legH + 8)} w={21} d={5} h={12} material="sage" />
      <IsoBox origin={Q(12, 20.5, legH + 20)} w={10} d={6} h={1.6} material="oak" />
    </Frame>
  );
}

// ============================================================================
// ABOUT & NOT FOUND — a doorway, open, with light beyond
// ============================================================================

function Doorway() {
  const W = 40;
  const H = 64;
  return (
    <Frame viewBox="-54 -92 166 168">
      {/* A short section of wall standing on a plinth. */}
      <IsoBox origin={Q(-4, -4, -4)} w={W + 8} d={14} h={4} material="limestone" />
      <polygon
        points={polygon([Q(-4, 0, 0), Q(W + 4, 0, 0), Q(W + 4, 0, H + 8), Q(-4, 0, H + 8)])}
        fill={MATERIALS.plaster}
      />
      {/* The opening, lit warmly from the other side. */}
      <polygon
        points={polygon([Q(8, 0, 0), Q(W - 8, 0, 0), Q(W - 8, 0, H), Q(8, 0, H)])}
        fill="#F6E2BE"
      />
      <polygon
        points={polygon([Q(8, 0, 0), Q(W - 8, 0, 0), Q(W - 8, 0, H * 0.55), Q(8, 0, H * 0.35)])}
        fill="#FBF1DE"
        opacity={0.8}
      />
      {/* Light spilling forward onto the floor. */}
      <polygon
        points={polygon([Q(8, 0, 0), Q(W - 8, 0, 0), Q(W - 4, 16, 0), Q(10, 16, 0)])}
        fill="#F6E2BE"
        opacity={0.6}
      />
      {/* Architrave. */}
      <polygon
        points={polygon([Q(6, 0, 0), Q(W - 6, 0, 0), Q(W - 6, 0, H + 2), Q(6, 0, H + 2)])}
        fill="none"
        stroke={shade(MATERIALS.plaster, 0.86)}
        strokeWidth={2.4}
      />
      {/* The door, swung open toward the viewer. */}
      <IsoBox origin={Q(W - 8, 0)} w={2} d={20} h={H - 1} material="oak" />
      <circle
        cx={Q(W - 6, 17, H / 2).x}
        cy={Q(W - 6, 17, H / 2).y}
        r={1.6}
        fill={MATERIALS.aluminium}
      />
      {/* Wall end and top, showing its thickness. */}
      <polygon
        points={polygon([
          Q(-4, -4, H + 8),
          Q(W + 4, -4, H + 8),
          Q(W + 4, 0, H + 8),
          Q(-4, 0, H + 8),
        ])}
        fill="#FFFFFF"
      />
      <polygon
        points={polygon([Q(W + 4, -4, 0), Q(W + 4, 0, 0), Q(W + 4, 0, H + 8), Q(W + 4, -4, H + 8)])}
        fill={shade(MATERIALS.plaster, 0.82)}
      />
    </Frame>
  );
}

export const DISCOVERY_OBJECTS: Record<DiscoveryObjectId, () => React.ReactElement> = {
  conditions: Books,
  treatments: CardBox,
  tools: Phone,
  care: MapWithPin,
  clinician: Workstation,
  notebook: Notebook,
  reading: ReadingStand,
  armchair: Armchair,
  doorway: Doorway,
};
