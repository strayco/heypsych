/**
 * Clinician World — "Build your practice"
 *
 * A miniature of the actual Practice Architect office, not a separate
 * illustration. It renders the canonical Architect `RoomShell` and the
 * canonical object art at their registry anchors, so the office a clinician
 * previews here is the office they enter at /architect.
 *
 * It is a preview, not the product. It does not run the recommendation engine,
 * show products, prices, or vendor names, or imply that any practice has been
 * configured. The objects shown are the functions every practice has: a sign,
 * scheduling, records, a way to take payment. Everything else in the room is
 * left as architecture.
 *
 * Interaction (CSS only, see worlds.module.css):
 * - the practice sign comes into focus;
 * - the clinical computer and the calendar gently light up;
 * - the intake tablet appears on the welcome desk.
 */

import type { CSSProperties } from "react";
import { WORLD_OBJECTS, type WorldObjectId } from "@/domains/architect/world/object-registry";
import { OBJECT_ART } from "@/app/architect/_components/world/object-art";
import { RoomShell } from "@/app/architect/_components/world/RoomShell";
import styles from "./worlds.module.css";
import { Plinth, WallCaps } from "./Diorama";
import { WORLD_VIEWBOX_ATTR } from "./geometry";

type PreviewTreatment = "rest" | "focus" | "reveal";

/** The objects shown in the preview, and how each responds to interest. */
const PREVIEW_OBJECTS: { id: WorldObjectId; treatment: PreviewTreatment }[] = [
  { id: "practice_sign", treatment: "focus" },
  { id: "telehealth_display", treatment: "rest" },
  { id: "reception_calendar", treatment: "rest" },
  { id: "intake_tablet", treatment: "reveal" },
  { id: "clinical_computer", treatment: "rest" },
  { id: "payment_terminal", treatment: "rest" },
];

function light(rest: number, active: number): CSSProperties {
  return { "--rest": rest, "--active": active } as CSSProperties;
}

export function ClinicianWorldScene() {
  // Paint in the registry's z-order, exactly as the Architect scene does.
  const objects = PREVIEW_OBJECTS.map((entry) => ({
    ...entry,
    definition: WORLD_OBJECTS[entry.id],
  })).sort((a, b) => a.definition.zOrder - b.definition.zOrder);

  const computer = WORLD_OBJECTS.clinical_computer.defaultAnchor;
  const calendar = WORLD_OBJECTS.reception_calendar.defaultAnchor;

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
        <RoomShell />

        {/* Screen light, beneath the objects so it reads as cast light. */}
        <ellipse
          className={styles.light}
          style={light(0, 0.9)}
          cx={computer.x}
          cy={computer.y - 30}
          rx={78}
          ry={50}
          fill="url(#hp-screen-light)"
        />
        <ellipse
          className={styles.light}
          style={light(0, 0.8)}
          cx={calendar.x + 6}
          cy={calendar.y - 16}
          rx={52}
          ry={34}
          fill="url(#hp-warm-light)"
        />

        {objects.map(({ id, treatment, definition }, index) => {
          const Art = OBJECT_ART[id];
          const { x, y } = definition.defaultAnchor;
          const className =
            treatment === "focus"
              ? styles.focus
              : treatment === "reveal"
                ? `${styles.reveal} ${index % 2 ? styles.delay1 : styles.delay2}`
                : undefined;

          return (
            <g key={id} className={className}>
              <g transform={`translate(${x}, ${y})`}>
                <Art installed />
              </g>
            </g>
          );
        })}

        <WallCaps />
      </g>
    </svg>
  );
}
