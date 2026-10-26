/**
 * Scene System
 *
 * The shared geometry, palette, and material rules for the illustrated
 * practice.
 *
 * Every object in the world is drawn through these primitives. That is what
 * makes the scene read as one coherent illustration rather than a collage:
 * one projection angle, one light direction, one shading rule, one palette.
 * Nothing positions itself with ad-hoc coordinates or invents its own shading.
 */

// ============================================================================
// REFERENCE SCENE
// ============================================================================

/**
 * Logical reference scene. All anchors, bounds, and hit areas are expressed
 * here and scaled uniformly to the viewport.
 */
export const SCENE_WIDTH = 1440;
export const SCENE_HEIGHT = 900;

/**
 * The bounding box the room actually occupies in reference coordinates, and
 * the transform that scales it up to fill the frame.
 *
 * Anchors stay in the reference system no matter how the room is framed, so
 * the camera can be adjusted without touching a single object position.
 */
const CONTENT_BOUNDS = { minX: 300, minY: 140, maxX: 1140, maxY: 710 };
const FRAME_FILL = 0.94;

export const CAMERA = (() => {
  const width = CONTENT_BOUNDS.maxX - CONTENT_BOUNDS.minX;
  const height = CONTENT_BOUNDS.maxY - CONTENT_BOUNDS.minY;
  const scale = Math.min(
    (SCENE_WIDTH * FRAME_FILL) / width,
    (SCENE_HEIGHT * FRAME_FILL) / height
  );
  const cx = CONTENT_BOUNDS.minX + width / 2;
  const cy = CONTENT_BOUNDS.minY + height / 2;

  return {
    scale,
    transform: `translate(${SCENE_WIDTH / 2} ${SCENE_HEIGHT / 2}) scale(${scale.toFixed(4)}) translate(${-cx} ${-cy})`,
  };
})();

// ============================================================================
// PROJECTION
// ============================================================================

/**
 * 2:1 isometric projection. A horizontal run of 2 corresponds to a rise of 1,
 * which is the most legible isometric ratio at small sizes and keeps edges
 * crisp.
 */
export const ISO_RUN = 2;
export const ISO_RISE = 1;

/** Screen offset for one unit of depth along each ground axis. */
export const ISO_X = { x: ISO_RUN, y: ISO_RISE };
export const ISO_Y = { x: -ISO_RUN, y: ISO_RISE };

export interface Point {
  x: number;
  y: number;
}

/**
 * Project a point in isometric space onto the 2D scene.
 *
 * @param gx depth along the right-facing ground axis
 * @param gy depth along the left-facing ground axis
 * @param gz height above the ground plane
 */
export function iso(gx: number, gy: number, gz = 0): Point {
  return {
    x: (gx - gy) * ISO_RUN,
    y: (gx + gy) * ISO_RISE - gz,
  };
}

/** Translate a projected point by an anchor. */
export function at(anchor: Point, point: Point): Point {
  return { x: anchor.x + point.x, y: anchor.y + point.y };
}

/** Serialize points into an SVG polygon `points` attribute. */
export function polygon(points: Point[]): string {
  return points.map((p) => `${round(p.x)},${round(p.y)}`).join(" ");
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

// ============================================================================
// PALETTE
// ============================================================================

/**
 * Art-direction palette. Warm, restrained, architectural.
 */
export const PALETTE = {
  background: "#FAF9F6",
  floor: "#EDEBE5",
  surface: "#F5F3EE",
  white: "#FFFFFF",
  graphite: "#252925",
  secondary: "#747A75",
  oak: "#CBAE86",
  sage: "#829B8A",
  slate: "#688594",
  accent: "#456C7E",
  success: "#487D66",
  warning: "#A98243",
  error: "#AD655E",
} as const;

/**
 * Material palette. Objects reference a material rather than a raw colour so
 * the whole world can be retoned in one place.
 */
export const MATERIALS = {
  oak: "#CBAE86",
  walnut: "#A07E58",
  plaster: "#F2EFE8",
  limestone: "#E4E0D6",
  sage: "#829B8A",
  slate: "#688594",
  aluminium: "#C3C7C9",
  graphite: "#3A403D",
  ceramic: "#EDE7DC",
  glass: "#D7E3E8",
  textile: "#D8CFC0",
  screen: "#2E3A40",
  paper: "#FBFAF7",
} as const;

export type MaterialName = keyof typeof MATERIALS;

// ============================================================================
// LIGHTING
// ============================================================================

/**
 * Light arrives from the upper left. Face brightness is therefore fixed:
 * tops catch the most light, left faces are mid, right faces fall into shade.
 *
 * Applying these multipliers uniformly is what prevents objects from looking
 * lit by different suns.
 */
export const FACE_LIGHT = {
  top: 1.1,
  left: 1.0,
  right: 0.86,
} as const;

export type FaceName = keyof typeof FACE_LIGHT;

/**
 * Scale a hex colour's brightness.
 *
 * The channels are weighted rather than scaled flat. Multiplying all three
 * equally drags every shaded face toward grey, which is what makes isometric
 * illustration look like plastic; real shadow in a daylit room stays warm
 * because it is filled by light bounced off warm surfaces. Red therefore falls
 * off slowest and blue fastest.
 */
const CHANNEL_FALLOFF = { r: 0.84, g: 0.95, b: 1.1 };

export function shade(hex: string, multiplier: number): string {
  const normalized = hex.replace("#", "");
  const value = parseInt(normalized, 16);

  const r = clampChannel(
    ((value >> 16) & 0xff) * Math.pow(multiplier, CHANNEL_FALLOFF.r)
  );
  const g = clampChannel(
    ((value >> 8) & 0xff) * Math.pow(multiplier, CHANNEL_FALLOFF.g)
  );
  const b = clampChannel(
    (value & 0xff) * Math.pow(multiplier, CHANNEL_FALLOFF.b)
  );

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function toHex(value: number): string {
  return value.toString(16).padStart(2, "0");
}

/** The colour of a given face of a given material. */
export function faceColor(material: MaterialName, face: FaceName): string {
  return shade(MATERIALS[material], FACE_LIGHT[face]);
}

// ============================================================================
// LAYERS
// ============================================================================

/**
 * Intentional paint order. Objects declare a `zOrder` that slots between these
 * boundaries rather than competing with raw CSS stacking.
 */
export const LAYERS = {
  background: 0,
  shell: 10,
  fixtures: 20,
  furniture: 30,
  objectsBehind: 40,
  objectsFront: 50,
  overlay: 80,
  ui: 90,
} as const;

// ============================================================================
// MOTION
// ============================================================================

/**
 * Motion specification. Restrained and tactile; nothing bounces.
 * Durations are in seconds for the animation library.
 */
export const MOTION = {
  install: { duration: 0.28, rise: 10 },
  select: { duration: 0.15 },
  inspector: { duration: 0.22 },
} as const;
