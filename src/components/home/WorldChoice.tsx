"use client";

/**
 * WorldChoice
 *
 * One of the two homepage destinations: an illustrated world and its label,
 * together forming a single, ordinary link.
 *
 * - It is a real <a>: it opens in a new tab, works without JavaScript, and
 *   keeps browser back navigation.
 * - The accessible name is the audience and the action ("For me or someone I
 *   love, Find my way"); the description is the supporting line. The
 *   illustration is decorative and hidden from assistive technology.
 * - On a plain click it records the choice and marks the world as selected so
 *   it settles forward while the next page loads. Navigation is never delayed
 *   for this; modified clicks (new tab, new window) are left alone.
 */

import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import { trackHomepageWorldSelect } from "@/lib/analytics/product-events";
import styles from "./worlds/worlds.module.css";

interface WorldChoiceProps {
  world: "patient" | "clinician";
  href: string;
  title: string;
  description: string;
  action: string;
  /** The server-rendered illustration. */
  children: ReactNode;
}

export function WorldChoice({
  world,
  href,
  title,
  description,
  action,
  children,
}: WorldChoiceProps) {
  const [selected, setSelected] = useState(false);
  const id = useId();
  const titleId = `${id}-title`;
  const actionId = `${id}-action`;
  const descriptionId = `${id}-description`;

  return (
    <Link
      href={href}
      className={`${styles.world} group focus-visible:ring-accent focus-visible:ring-offset-canvas block rounded-[28px] outline-none focus-visible:ring-2 focus-visible:ring-offset-4`}
      data-selected={selected ? "true" : undefined}
      aria-labelledby={`${titleId} ${actionId}`}
      aria-describedby={descriptionId}
      onClick={(event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }
        setSelected(true);
        trackHomepageWorldSelect(world);
      }}
    >
      {/* Space is reserved by aspect ratio, so nothing shifts as the page
          settles. Narrow screens use a shorter, purpose-made crop of the
          same scene. */}
      <div className="relative aspect-[16/10] w-full md:aspect-[916/668]">{children}</div>

      <div className="mt-1 flex items-center justify-between gap-4 px-1 md:mt-2 md:flex-col md:items-center md:gap-0 md:px-6 md:text-center">
        <div className="min-w-0">
          <h3
            id={titleId}
            className={`${styles.label} text-label-primary text-[18px] leading-snug font-semibold tracking-[-0.01em] md:text-[22px]`}
          >
            {title}
          </h3>
          <p
            id={descriptionId}
            className="text-label-secondary mt-1 text-[14px] leading-relaxed md:mt-1.5 md:max-w-[22rem] md:text-[16px]"
          >
            {description}
          </p>
        </div>
        <span
          id={actionId}
          className={`${styles.action} bg-label-primary inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-[14px] font-medium whitespace-nowrap text-white md:mt-5 md:px-5 md:py-3 md:text-[15px]`}
        >
          {action}
          <span className={styles.arrow} aria-hidden="true">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
