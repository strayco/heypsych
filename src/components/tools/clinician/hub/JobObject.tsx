"use client";

/**
 * One Practice Architect office object, drawn on its own.
 *
 * The object art draws at its scene anchor's local origin and has no fixed
 * frame, so the frame is measured once on the client (getBBox) and the art
 * fades in. Decorative: hidden from assistive technology.
 */

import { useLayoutEffect, useRef } from "react";
import type { WorldObjectId } from "@/domains/architect/world/object-registry";
import { OBJECT_ART } from "@/app/architect/_components/world/object-art";

export function JobObject({ object, className = "" }: { object: WorldObjectId; className?: string }) {
  const svg = useRef<SVGSVGElement>(null);
  const art = useRef<SVGGElement>(null);
  const Art = OBJECT_ART[object];

  useLayoutEffect(() => {
    const el = svg.current;
    const g = art.current;
    if (!el || !g) return;
    try {
      const box = g.getBBox();
      if (box.width > 0 && box.height > 0) {
        const pad = Math.max(box.width, box.height) * 0.1;
        el.setAttribute(
          "viewBox",
          `${box.x - pad} ${box.y - pad} ${box.width + pad * 2} ${box.height + pad * 2}`
        );
      }
    } catch {
      // getBBox throws on detached or hidden nodes; keep the default frame.
    }
    el.dataset.ready = "true";
  }, [object]);

  return (
    <svg
      ref={svg}
      viewBox="-60 -90 140 120"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      focusable="false"
      className={`opacity-0 transition-opacity duration-300 data-[ready=true]:opacity-100 motion-reduce:transition-none ${className}`}
    >
      <g ref={art}>
        <Art installed />
      </g>
    </svg>
  );
}
