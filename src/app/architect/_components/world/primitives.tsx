/**
 * Isometric Drawing Primitives
 *
 * Every illustrated object in the practice is composed from these shapes.
 * Sharing the primitives is what guarantees a single projection angle, one
 * light direction, and one material treatment across the whole scene.
 *
 * Objects never draw raw polygons with hand-picked colours.
 */

import {
  at,
  faceColor,
  iso,
  polygon,
  shade,
  type MaterialName,
  type Point,
} from "@/domains/architect/world/scene";

// ============================================================================
// BOX
// ============================================================================

interface IsoBoxProps {
  /** Scene-space position of the box's near-bottom corner. */
  origin: Point;
  /** Depth along the right-facing axis. */
  w: number;
  /** Depth along the left-facing axis. */
  d: number;
  /** Height. */
  h: number;
  material: MaterialName;
  /** Optional override for the top face, for screens and inlays. */
  topMaterial?: MaterialName;
  opacity?: number;
}

/**
 * A cuboid drawn with the three visible faces, each shaded by the shared
 * lighting rule.
 */
export function IsoBox({
  origin,
  w,
  d,
  h,
  material,
  topMaterial,
  opacity = 1,
}: IsoBoxProps) {
  // Corners of the top face.
  const topFar = at(origin, iso(0, 0, h));
  const topRight = at(origin, iso(w, 0, h));
  const topNear = at(origin, iso(w, d, h));
  const topLeft = at(origin, iso(0, d, h));

  // Corresponding ground corners for the two visible side faces.
  const groundRight = at(origin, iso(w, 0, 0));
  const groundNear = at(origin, iso(w, d, 0));
  const groundLeft = at(origin, iso(0, d, 0));

  const top = topMaterial ?? material;

  return (
    <g opacity={opacity}>
      {/* Left face catches direct light. */}
      <polygon
        points={polygon([topLeft, topNear, groundNear, groundLeft])}
        fill={faceColor(material, "left")}
      />
      {/* Right face falls into shade. */}
      <polygon
        points={polygon([topNear, topRight, groundRight, groundNear])}
        fill={faceColor(material, "right")}
      />
      {/* Top face is brightest. */}
      <polygon
        points={polygon([topFar, topRight, topNear, topLeft])}
        fill={faceColor(top, "top")}
      />
    </g>
  );
}

// ============================================================================
// GROUND PLANE
// ============================================================================

interface IsoPlaneProps {
  origin: Point;
  w: number;
  d: number;
  /** Height above the ground. */
  z?: number;
  fill: string;
  opacity?: number;
}

/** A flat quad lying on a horizontal plane. */
export function IsoPlane({
  origin,
  w,
  d,
  z = 0,
  fill,
  opacity = 1,
}: IsoPlaneProps) {
  const points = [
    at(origin, iso(0, 0, z)),
    at(origin, iso(w, 0, z)),
    at(origin, iso(w, d, z)),
    at(origin, iso(0, d, z)),
  ];

  return <polygon points={polygon(points)} fill={fill} opacity={opacity} />;
}

// ============================================================================
// VERTICAL PANEL
// ============================================================================

interface IsoPanelProps {
  origin: Point;
  /** Width along the chosen ground axis. */
  w: number;
  h: number;
  /** Which ground axis the panel runs along. */
  axis: "x" | "y";
  material: MaterialName;
  opacity?: number;
}

/**
 * A zero-thickness upright surface: screens, signage, framed artwork.
 */
export function IsoPanel({
  origin,
  w,
  h,
  axis,
  material,
  opacity = 1,
}: IsoPanelProps) {
  const span = axis === "x" ? iso(w, 0, 0) : iso(0, w, 0);
  const spanTop = axis === "x" ? iso(w, 0, h) : iso(0, w, h);

  const points = [
    at(origin, iso(0, 0, 0)),
    at(origin, span),
    at(origin, spanTop),
    at(origin, iso(0, 0, h)),
  ];

  return (
    <polygon
      points={polygon(points)}
      fill={faceColor(material, axis === "x" ? "right" : "left")}
      opacity={opacity}
    />
  );
}

// ============================================================================
// WALL PLAQUE
// ============================================================================

interface WallPlaqueProps {
  origin: Point;
  w: number;
  h: number;
  /** Which wall the plaque sits on. `x` is the right-hand wall. */
  axis?: "x" | "y";
  material: MaterialName;
  children?: React.ReactNode;
}

/**
 * A wall-mounted object: a thin plaque flush to the wall, with a contact
 * shadow on the plaster behind it.
 *
 * The shadow is drawn on the same plane as the wall, offset slightly down and
 * away from the light, so the plaque reads as attached rather than pasted
 * over the scene. Nothing here uses a CSS offset.
 */
export function WallPlaque({
  origin,
  w,
  h,
  axis = "x",
  material,
  children,
}: WallPlaqueProps) {
  const span = axis === "x" ? iso(w, 0, 0) : iso(0, w, 0);
  const spanTop = axis === "x" ? iso(w, 0, h) : iso(0, w, h);

  const corners = [
    at(origin, iso(0, 0, 0)),
    at(origin, span),
    at(origin, spanTop),
    at(origin, iso(0, 0, h)),
  ];

  // Light is upper-left. A right-wall plaque casts a short shadow down-right;
  // a left-wall plaque casts down-left. Both stay on the wall plane.
  const ox = axis === "x" ? 6 : -5;
  const oy = 5;
  const shadow = corners.map((p) => ({ x: p.x + ox, y: p.y + oy }));

  return (
    <g>
      <polygon
        points={polygon(shadow)}
        fill="#8C8372"
        opacity={0.22}
        filter="url(#hp-soft-shadow)"
      />
      <IsoPanel origin={origin} w={w} h={h} axis={axis} material={material} />
      {children}
    </g>
  );
}

// ============================================================================
// CONTACT SHADOW
// ============================================================================

interface ContactShadowProps {
  origin: Point;
  w: number;
  d: number;
  opacity?: number;
}

/**
 * The soft shadow an object casts where it meets the floor.
 *
 * Offset down-right because the light is up-left, consistently for every
 * object in the scene.
 */
export function ContactShadow({
  origin,
  w,
  d,
  opacity = 0.1,
}: ContactShadowProps) {
  const shifted = { x: origin.x + 3, y: origin.y + 2 };
  const points = [
    at(shifted, iso(0, 0, 0)),
    at(shifted, iso(w, 0, 0)),
    at(shifted, iso(w, d, 0)),
    at(shifted, iso(0, d, 0)),
  ];

  return (
    <polygon
      points={polygon(points)}
      fill="#4A4336"
      opacity={opacity}
      filter="url(#hp-soft-shadow)"
    />
  );
}

// ============================================================================
// CYLINDER
// ============================================================================

interface IsoCylinderProps {
  origin: Point;
  radius: number;
  h: number;
  material: MaterialName;
}

/**
 * An upright cylinder: plant pots, stools, lamp stems.
 *
 * Drawn as an ellipse-capped body so it shares the projection of the boxes.
 */
export function IsoCylinder({
  origin,
  radius,
  h,
  material,
}: IsoCylinderProps) {
  const rx = radius * 2;
  const ry = radius;
  const top = { x: origin.x, y: origin.y - h };

  return (
    <g>
      <path
        d={[
          `M ${origin.x - rx} ${origin.y}`,
          `L ${origin.x - rx} ${top.y}`,
          `A ${rx} ${ry} 0 0 1 ${origin.x + rx} ${top.y}`,
          `L ${origin.x + rx} ${origin.y}`,
          `A ${rx} ${ry} 0 0 1 ${origin.x - rx} ${origin.y}`,
          "Z",
        ].join(" ")}
        fill={faceColor(material, "left")}
      />
      {/* Shade the right half so the cylinder turns away from the light. */}
      <path
        d={[
          `M ${origin.x} ${origin.y + ry}`,
          `L ${origin.x} ${top.y - ry}`,
          `A ${rx} ${ry} 0 0 1 ${origin.x + rx} ${top.y}`,
          `L ${origin.x + rx} ${origin.y}`,
          `A ${rx} ${ry} 0 0 1 ${origin.x} ${origin.y + ry}`,
          "Z",
        ].join(" ")}
        fill={faceColor(material, "right")}
      />
      <ellipse
        cx={top.x}
        cy={top.y}
        rx={rx}
        ry={ry}
        fill={faceColor(material, "top")}
      />
    </g>
  );
}

// ============================================================================
// SCREEN GLASS
// ============================================================================

interface ScreenProps {
  origin: Point;
  w: number;
  h: number;
  axis: "x" | "y";
  /** Whether the screen is showing content. */
  active: boolean;
  /** Accent used for active content. */
  accent?: string;
}

/**
 * A display surface.
 *
 * When inactive it reads as dark glass. When a tool has been assigned it shows
 * an abstract, generic interface: deliberately not a depiction of any
 * vendor's actual product.
 */
export function Screen({
  origin,
  w,
  h,
  axis,
  active,
  accent = "#7FA8B8",
}: ScreenProps) {
  const span = (n: number) => (axis === "x" ? iso(n, 0, 0) : iso(0, n, 0));
  const lift = (n: number) => iso(0, 0, n);

  const corners = [
    at(origin, iso(0, 0, 0)),
    at(origin, span(w)),
    at(origin, { x: span(w).x, y: span(w).y - h }),
    at(origin, lift(h)),
  ];

  const glass = active ? "#31444E" : "#2E3A40";

  // Abstract interface rows, inset from the screen edge.
  const rows = [0.3, 0.5, 0.68].map((t, index) => {
    const inset = 0.12;
    const start = at(origin, {
      x: span(w * inset).x,
      y: span(w * inset).y - h * t,
    });
    const end = at(origin, {
      x: span(w * (index === 0 ? 0.74 : index === 1 ? 0.56 : 0.66)).x,
      y: span(w * (index === 0 ? 0.74 : index === 1 ? 0.56 : 0.66)).y - h * t,
    });
    return { start, end, key: t };
  });

  return (
    <g>
      <polygon points={polygon(corners)} fill={glass} />
      {active && (
        <>
          {rows.map((row) => (
            <line
              key={row.key}
              x1={row.start.x}
              y1={row.start.y}
              x2={row.end.x}
              y2={row.end.y}
              stroke={accent}
              strokeWidth={2.4}
              strokeLinecap="round"
              opacity={0.85}
            />
          ))}
        </>
      )}
      {/* A single specular highlight, same corner on every screen. */}
      <polygon
        points={polygon([
          corners[0],
          at(origin, span(w * 0.34)),
          at(origin, {
            x: span(w * 0.34).x,
            y: span(w * 0.34).y - h * 0.34,
          }),
          at(origin, lift(h * 0.34)),
        ])}
        fill="#FFFFFF"
        opacity={0.06}
      />
    </g>
  );
}

// ============================================================================
// PLACEHOLDER
// ============================================================================

interface PlaceholderProps {
  origin: Point;
  w: number;
  d: number;
  h: number;
  /**
   * Where the object will attach. A wall-mounted placeholder drops its
   * shadow onto the wall behind it; without that it reads as floating in
   * mid-air rather than as a reserved spot on the wall.
   */
  mount?: "floor" | "wall";
}

/**
 * The understated footprint shown where an applicable capability has not yet
 * been resolved.
 *
 * The room is never empty: an unconfigured function reads as a reserved space
 * waiting to be filled, not as a missing object.
 */
export function Placeholder({
  origin,
  w,
  d,
  h,
  mount = "floor",
}: PlaceholderProps) {
  const base = [
    at(origin, iso(0, 0, 0)),
    at(origin, iso(w, 0, 0)),
    at(origin, iso(w, d, 0)),
    at(origin, iso(0, d, 0)),
  ];

  const topFar = at(origin, iso(0, 0, h));
  const topRight = at(origin, iso(w, 0, h));
  const topNear = at(origin, iso(w, d, h));
  const topLeft = at(origin, iso(0, d, h));

  return (
    <g>
      {/* A warm footprint marks the reserved space: on the floor for
          furniture, on the wall behind for anything that hangs. */}
      <polygon
        points={polygon(
          mount === "wall"
            ? [topFar, topRight, base[1], base[0]].map((p) => ({
                x: p.x + 4,
                y: p.y + 4,
              }))
            : base
        )}
        fill={shade("#CBAE86", mount === "wall" ? 0.7 : 1.08)}
        opacity={mount === "wall" ? 0.18 : 0.3}
        filter={mount === "wall" ? "url(#hp-soft-shadow)" : undefined}
      />
      {/* Dashed upright edges suggest the volume the object will occupy. */}
      {[
        [base[1], topRight],
        [base[2], topNear],
        [base[3], topLeft],
      ].map(([from, to], index) => (
        <line
          key={index}
          x1={from.x}
          y1={from.y}
          x2={to.x}
          y2={to.y}
          stroke="#A1957C"
          strokeWidth={1.6}
          strokeDasharray="5 4"
          opacity={0.75}
        />
      ))}
      <polygon
        points={polygon([topFar, topRight, topNear, topLeft])}
        fill="none"
        stroke="#A1957C"
        strokeWidth={1.8}
        strokeDasharray="5 4"
        opacity={0.9}
      />
    </g>
  );
}
