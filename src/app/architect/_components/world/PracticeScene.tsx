/**
 * Practice Scene
 *
 * The interactive illustrated world.
 *
 * Accessibility: every object is a real focusable button with an accessible
 * name and a described state. The scene is navigable by keyboard alone, and
 * the equivalent list view shares the same commands and state rather than
 * being a lesser parallel interface.
 */

"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  CAMERA,
  MOTION,
  PALETTE,
  SCENE_HEIGHT,
  SCENE_WIDTH,
} from "@/domains/architect/world/scene";
import type { WorldObjectId } from "@/domains/architect/world/object-registry";
import type {
  WorldObjectState,
  WorldState,
} from "@/domains/architect/world/world-state";
import { OBJECT_ART } from "./object-art";
import { RoomShell } from "./RoomShell";

interface PracticeSceneProps {
  world: WorldState;
  selectedObjectId: WorldObjectId | null;
  onSelectObject: (objectId: WorldObjectId) => void;
  /** Objects that just became covered, for the install animation. */
  recentlyInstalled?: WorldObjectId[];
  /** Shared numbering with the checklist, so marker 3 is checklist item 3. */
  markerNumbers?: ReadonlyMap<WorldObjectId, number>;
  /** Object highlighted from the checklist (or by hovering its marker). */
  hoveredObjectId?: WorldObjectId | null;
  onHoverObject?: (objectId: WorldObjectId | null) => void;
}

export function PracticeScene({
  world,
  selectedObjectId,
  onSelectObject,
  recentlyInstalled = [],
  markerNumbers,
  hoveredObjectId = null,
  onHoverObject,
}: PracticeSceneProps) {
  const reduceMotion = useReducedMotion();
  const gradientId = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const markerPositions = useMarkerPositions(svgRef, world);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
      className="h-full w-full"
      role="group"
      aria-label="Your practice, shown as an illustrated office"
    >
      <defs>
        {/* Soft daylight pooling on the floor from the window side. */}
        <radialGradient id={`${gradientId}-daylight`} cx="26%" cy="34%" r="62%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id={`${gradientId}-window`}
          x1="0%"
          y1="0%"
          x2="60%"
          y2="100%"
        >
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#CFE0E7" stopOpacity="0.25" />
        </linearGradient>
        <filter
          id="hp-soft-shadow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur stdDeviation="5" />
        </filter>

        {/* Aliases so the shell can reference the gradients by stable name. */}
        <radialGradient id="hp-daylight" cx="26%" cy="34%" r="62%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="hp-window-light" x1="0%" y1="0%" x2="60%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#CFE0E7" stopOpacity="0.25" />
        </linearGradient>
      </defs>

      <rect
        width={SCENE_WIDTH}
        height={SCENE_HEIGHT}
        fill={PALETTE.background}
      />

      {/* One camera transform frames the whole room, so every object keeps
          its reference-space anchor regardless of framing. */}
      <g transform={CAMERA.transform}>
        <RoomShell />

        {/* Objects, painted in registry z-order. */}
        {world.objects.map((object) => (
          <SceneObject
            key={object.definition.objectId}
            object={object}
            isSelected={selectedObjectId === object.definition.objectId}
            justInstalled={recentlyInstalled.includes(
              object.definition.objectId
            )}
            reduceMotion={reduceMotion ?? false}
            onSelect={() => onSelectObject(object.definition.objectId)}
            isHighlighted={hoveredObjectId === object.definition.objectId}
            onHover={onHoverObject}
          />
        ))}

        {/* Markers: drawn above all furniture so that stacked objects on a
            desk stay individually readable. They are visual handles for the
            object buttons above (which carry the accessible name and state),
            so they are hidden from assistive technology. */}
        {markerNumbers && (
          <g aria-hidden="true">
            {world.objects.map((object) => {
              const number = markerNumbers.get(object.definition.objectId);
              if (number === undefined) return null;
              return (
                <SceneMarker
                  key={object.definition.objectId}
                  object={object}
                  position={markerPositions.get(object.definition.objectId)}
                  number={number}
                  isSelected={selectedObjectId === object.definition.objectId}
                  isHighlighted={hoveredObjectId === object.definition.objectId}
                  onSelect={() => onSelectObject(object.definition.objectId)}
                  onHover={onHoverObject}
                />
              );
            })}
          </g>
        )}

        {/* Name of the hovered or focused object. Drawn last, above every
            object and marker, so nothing covers it. Touch does not need it:
            the inspector opens on tap, and the accessible name is already on
            the control. */}
        {hoveredObjectId && (
          <HoverLabel
            object={world.byId.get(hoveredObjectId)}
            position={markerNumbers?.has(hoveredObjectId) ? markerPositions.get(hoveredObjectId) : undefined}
            hasMarker={markerNumbers?.has(hoveredObjectId) ?? false}
          />
        )}
      </g>
    </svg>
  );
}

function HoverLabel({
  object,
  position,
  hasMarker,
}: {
  object?: WorldObjectState;
  position?: MarkerPosition;
  hasMarker: boolean;
}) {
  if (!object) return null;
  const { definition } = object;
  const { x: ax, y: ay } = definition.defaultAnchor;
  // Sit just above the marker (radius 15 when highlighted, plus its halo),
  // or above the object when there is no marker.
  const markerTop =
    position?.y ?? ay - Math.min(definition.bounds.height, 120) - 24;
  const x = hasMarker ? (position?.x ?? ax) : ax;
  const y = hasMarker ? markerTop - 24 : ay - definition.bounds.height - 34;
  return (
    <g aria-hidden="true">
      <ObjectLabel x={x} y={y} name={definition.name} width={definition.bounds.width} forceVisible />
    </g>
  );
}

// ============================================================================
// OBJECT
// ============================================================================

interface SceneObjectProps {
  object: WorldObjectState;
  isSelected: boolean;
  justInstalled: boolean;
  reduceMotion: boolean;
  onSelect: () => void;
  isHighlighted?: boolean;
  onHover?: (objectId: WorldObjectId | null) => void;
}

function SceneObject({
  object,
  isSelected,
  justInstalled,
  reduceMotion,
  onSelect,
  isHighlighted = false,
  onHover,
}: SceneObjectProps) {
  const { definition, state } = object;
  const Art = OBJECT_ART[definition.objectId];
  const { x, y } = definition.defaultAnchor;
  const { width, height } = definition.bounds;

  const installed = state === "configured" || state === "handled-elsewhere";
  const dimmed = state === "not-needed";

  // The install animation plays once, and only when motion is welcome.
  const animation =
    justInstalled && !reduceMotion
      ? {
          initial: { opacity: 0, y: MOTION.install.rise },
          animate: { opacity: dimmed ? 0.4 : 1, y: 0 },
          transition: {
            duration: MOTION.install.duration,
            ease: "easeOut" as const,
          },
        }
      : {
          initial: false as const,
          animate: { opacity: dimmed ? 0.4 : 1, y: 0 },
          transition: { duration: 0 },
        };

  return (
    <motion.g
      {...animation}
      style={{ transformOrigin: `${x}px ${y}px` }}
      className="group cursor-pointer focus:outline-none"
      role="button"
      tabIndex={0}
      aria-label={definition.accessibleName}
      aria-description={describeState(object)}
      aria-pressed={isSelected}
      onClick={onSelect}
      onMouseEnter={() => onHover?.(definition.objectId)}
      onMouseLeave={() => onHover?.(null)}
      onFocus={() => onHover?.(definition.objectId)}
      onBlur={() => onHover?.(null)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Selection halo sits beneath the art so it never obscures detail. */}
      {isSelected && (
        <ellipse
          cx={x}
          cy={y + 4}
          rx={width * 0.62}
          ry={width * 0.3}
          fill={PALETTE.accent}
          opacity={0.14}
        />
      )}

      {/* Desktop hover, or the matching checklist row hovered: a quieter
          version of the same halo, never a glow. */}
      {!isSelected && (
        <ellipse
          cx={x}
          cy={y + 4}
          rx={width * 0.58}
          ry={width * 0.28}
          fill={PALETTE.oak}
          className={`pointer-events-none group-hover:opacity-[0.18] ${
            isHighlighted ? "opacity-[0.22]" : "opacity-0"
          }`}
        />
      )}

      <g
        transform={`translate(${x}, ${y})`}
        data-art-id={definition.objectId}
      >
        <Art installed={installed} />
      </g>

      {/* Overlap warning: more than one product covering the same function.
          Pinned to the object's own top corner rather than floating above it,
          so it is obvious which object it belongs to. */}
      {object.hasOverlap && (
        <g
          transform={`translate(${x + Math.min(34, width * 0.3)}, ${
            y - Math.min(40, Math.max(18, height * 0.35))
          })`}
        >
          <circle r={9} fill={PALETTE.warning} stroke="#FFFFFF" strokeWidth={2} />
          <text
            textAnchor="middle"
            dy={3.5}
            fontSize={11}
            fontWeight={700}
            fill="#FFFFFF"
          >
            {object.assignments.length}
          </text>
        </g>
      )}

      {/*
        Transparent hit target. Sized generously so objects are reachable on
        touch without demanding precise tapping, and so the focus ring has a
        predictable shape whatever the object looks like.
      */}
      <rect
        x={x - width / 2}
        y={y - height}
        width={width}
        height={height + 16}
        fill="transparent"
        rx={10}
      />

      {/* Keyboard focus indicator. Drawn last so it is never obscured, and
          tied to :focus-visible so it appears for keyboard users without
          outlining everything a mouse touches. */}
      <rect
        x={x - width / 2}
        y={y - height}
        width={width}
        height={height + 16}
        rx={10}
        fill="none"
        stroke={PALETTE.accent}
        strokeWidth={3}
        className="pointer-events-none opacity-0 group-focus-visible:opacity-100"
      />
    </motion.g>
  );
}

function ObjectLabel({
  x,
  y,
  name,
  width,
  forceVisible = false,
}: {
  x: number;
  y: number;
  name: string;
  width: number;
  forceVisible?: boolean;
}) {
  const labelWidth = Math.max(width * 0.7, name.length * 7.2 + 16);

  return (
    <g
      transform={`translate(${x}, ${y})`}
      className={`pointer-events-none group-hover:opacity-100 group-focus-visible:opacity-100 ${
        forceVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      <rect
        x={-labelWidth / 2}
        y={-16}
        width={labelWidth}
        height={20}
        rx={6}
        fill={PALETTE.white}
        stroke={PALETTE.oak}
        strokeWidth={1}
      />
      <text
        textAnchor="middle"
        y={-2}
        fontSize={11}
        fontWeight={600}
        fill={PALETTE.graphite}
      >
        {name}
      </text>
    </g>
  );
}

/** Spoken description of an object's current state. */
function describeState(object: WorldObjectState): string {
  switch (object.state) {
    case "configured":
      return object.productName
        ? `Selected: ${object.productName}`
        : "Selected";
    case "handled-elsewhere":
      return object.productName
        ? `Already handled by ${object.productName}`
        : "Already handled outside Practice Architect";
    case "not-needed":
      return "Marked as not needed";
    default:
      return "No tool chosen yet";
  }
}

// ============================================================================
// MARKER
// ============================================================================

/**
 * A numbered marker floating above an object, matching the checklist badge:
 * slate-teal number = still to decide, sage check = decided, grey dash = not
 * needed. Always visible, so the room shows at a glance what is left.
 */
function SceneMarker({
  object,
  position,
  number,
  isSelected,
  isHighlighted,
  onSelect,
  onHover,
}: {
  object: WorldObjectState;
  position?: MarkerPosition;
  number: number;
  isSelected: boolean;
  isHighlighted: boolean;
  onSelect: () => void;
  onHover?: (objectId: WorldObjectId | null) => void;
}) {
  const { definition, state } = object;
  // Until the art has been measured, fall back to the registry bounds.
  const x = position?.x ?? definition.defaultAnchor.x;
  const top =
    position?.y ??
    definition.defaultAnchor.y - Math.min(definition.bounds.height, 120) - 24;
  const stem = position?.stem ?? 12;
  const dx = position?.dx ?? 0;
  const decided = state === "configured" || state === "handled-elsewhere";
  const notNeeded = state === "not-needed";
  const r = isSelected || isHighlighted ? 15 : 13;

  const fill = decided ? PALETTE.success : notNeeded ? "#D9D4C9" : PALETTE.accent;

  return (
    <g
      transform={`translate(${x}, ${top})`}
      className="cursor-pointer"
      onClick={onSelect}
      onMouseEnter={() => onHover?.(definition.objectId)}
      onMouseLeave={() => onHover?.(null)}
    >
      {/* Stem to the object, so a marker never reads as floating free. */}
      <line x1={0} y1={r - 2} x2={dx} y2={r + stem} stroke={fill} strokeWidth={2} opacity={0.7} />
      {(isSelected || isHighlighted) && (
        <circle r={r + 6} fill={fill} opacity={0.18} />
      )}
      <circle r={r} fill={fill} stroke="#FFFFFF" strokeWidth={2.5} />
      {decided ? (
        <path
          d="M -5 0.5 L -1.5 4 L 5.5 -3.5"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : notNeeded ? (
        <line x1={-5} y1={0} x2={5} y2={0} stroke="#6F746E" strokeWidth={2.6} strokeLinecap="round" />
      ) : (
        <text
          textAnchor="middle"
          dy={4.5}
          fontSize={13}
          fontWeight={700}
          fill="#FFFFFF"
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {number}
        </text>
      )}
    </g>
  );
}

// ============================================================================
// MARKER PLACEMENT
// ============================================================================

interface MarkerPosition {
  /** Marker centre, in scene space. */
  x: number;
  y: number;
  /** Stem length from the marker's lower edge to the top of the object. */
  stem: number;
  /** Horizontal offset from the marker to the object, when fanned out. */
  dx: number;
}

// Marker diameter (26) plus its white ring and breathing room, so fanned
// markers on a shared desk never touch.
const MARKER_GAP = 38;
const MARKER_LIFT = 26;

/**
 * Places each marker just above the top of its object's drawn art, measured
 * from the rendered SVG, not from the registry's nominal bounds, so a marker
 * always sits on the thing it labels. Objects sharing a desk would otherwise
 * stack their markers on top of each other, so markers closer than one
 * marker-width are fanned out sideways, and the stem keeps pointing at the
 * object.
 */
function useMarkerPositions(
  svgRef: React.RefObject<SVGSVGElement | null>,
  world: WorldState
): Map<WorldObjectId, MarkerPosition> {
  const [positions, setPositions] = useState<Map<WorldObjectId, MarkerPosition>>(
    () => new Map()
  );
  const key = world.objects.map((o) => o.definition.objectId).join("|");

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const tops: { id: WorldObjectId; x: number; y: number }[] = [];
    for (const object of world.objects) {
      const id = object.definition.objectId;
      const node = svg.querySelector<SVGGElement>(`[data-art-id="${id}"]`);
      if (!node) continue;
      let box: DOMRect;
      try {
        box = node.getBBox();
      } catch {
        continue;
      }
      if (box.width === 0 && box.height === 0) continue;
      const { x, y } = object.definition.defaultAnchor;
      tops.push({ id, x: x + box.x + box.width / 2, y: y + box.y });
    }

    // Highest objects first, then left to right, so fanning is stable.
    tops.sort((a, b) => a.y - b.y || a.x - b.x);
    const placed: MarkerPosition[] = [];
    const next = new Map<WorldObjectId, MarkerPosition>();
    for (const top of tops) {
      let x = top.x;
      const y = top.y - MARKER_LIFT;
      for (let attempt = 1; attempt < 8; attempt++) {
        const clash = placed.some(
          (p) => Math.abs(p.x - x) < MARKER_GAP && Math.abs(p.y - y) < MARKER_GAP
        );
        if (!clash) break;
        const step = Math.ceil(attempt / 2) * MARKER_GAP;
        x = top.x + (attempt % 2 === 1 ? step : -step);
      }
      const position = { x, y, stem: MARKER_LIFT - 14, dx: top.x - x };
      placed.push(position);
      next.set(top.id, position);
    }
    setPositions(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-measure only when the set of objects changes
  }, [key, svgRef]);

  return positions;
}
