/**
 * PageIntro
 *
 * The opening of every section of HeyPsych: a quiet editorial title, a plain
 * line about what is here, an optional control (usually search), and the
 * section's object from the Worlds — the same object a visitor saw on the
 * homepage, so each area is recognisable before a word is read.
 *
 * It sits directly on the paper. No eyebrow labels, no white band, no icon
 * badge. One clear thing to read, then the page.
 */

import Link from "next/link";
import type { ReactNode } from "react";
import {
  DISCOVERY_OBJECTS,
  type DiscoveryObjectId,
} from "@/components/home/worlds/DiscoveryObjects";

export interface PageIntroCrumb {
  label: string;
  href: string;
}

interface PageIntroProps {
  title: ReactNode;
  description?: ReactNode;
  /** The section's object from the Worlds. Decorative. */
  object?: DiscoveryObjectId;
  /** A link back up one level, shown above the title. */
  parent?: PageIntroCrumb;
  /** Search, filters, or a primary action. */
  children?: ReactNode;
  /** Extra line under the controls: counts, freshness, disclaimers. */
  footnote?: ReactNode;
  /** Narrow layouts for reading pages. */
  width?: "wide" | "reading";
}

export function PageIntro({
  title,
  description,
  object,
  parent,
  children,
  footnote,
  width = "wide",
}: PageIntroProps) {
  const Art = object ? DISCOVERY_OBJECTS[object] : null;
  const max = width === "reading" ? "max-w-4xl" : "max-w-6xl";

  return (
    <section className="border-separator border-b px-4 pt-8 pb-10 sm:px-6 sm:pt-12 sm:pb-12 lg:px-8 lg:pt-14">
      <div
        className={`mx-auto grid ${max} items-center gap-6 ${
          Art ? "lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-12" : ""
        }`}
      >
        <div className="min-w-0">
          {parent && (
            <Link
              href={parent.href}
              className="text-label-secondary hover:text-label-primary focus-visible:ring-accent mb-5 inline-flex items-center gap-1.5 text-[14px] font-medium focus-visible:rounded focus-visible:ring-2 focus-visible:outline-none"
            >
              <span aria-hidden="true">←</span> {parent.label}
            </Link>
          )}

          {Art && (
            <span aria-hidden="true" className="mb-4 block h-14 w-20 lg:hidden">
              <Art />
            </span>
          )}

          <h1 className="font-display text-label-primary text-[34px] leading-[1.06] font-normal tracking-[-0.02em] sm:text-[44px] lg:text-[52px]">
            {title}
          </h1>

          {description && (
            <p className="text-label-secondary mt-3 max-w-2xl text-[16px] leading-relaxed sm:mt-4 sm:text-[18px]">
              {description}
            </p>
          )}

          {children && <div className="mt-7 max-w-2xl">{children}</div>}

          {footnote && (
            <p className="text-label-tertiary mt-4 text-[13px] leading-relaxed">{footnote}</p>
          )}
        </div>

        {Art && (
          <div aria-hidden="true" className="hidden h-[200px] lg:block">
            <Art />
          </div>
        )}
      </div>
    </section>
  );
}
