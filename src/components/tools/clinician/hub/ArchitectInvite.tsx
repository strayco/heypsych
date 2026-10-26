/**
 * The way from one job to the whole practice: Practice Architect plans every
 * function at once and shows how the pieces overlap.
 */

import Link from "next/link";

export function ArchitectInvite({ compact = false }: { compact?: boolean }) {
  return (
    <aside
      aria-label="Practice Architect"
      className={`border-separator bg-surface rounded-3xl border shadow-card-1 ${compact ? "p-6" : "p-7 sm:p-9"}`}
    >
      <h2 className="font-display text-label-primary text-[24px] leading-tight sm:text-[28px]">
        Setting up a whole practice?
      </h2>
      <p className="text-label-secondary mt-2 max-w-2xl text-[16px] leading-relaxed">
        Practice Architect walks through every room of the practice, from scheduling to billing, and shows where one
        product already covers another so you don&rsquo;t pay twice.
      </p>
      <Link
        href="/architect"
        className="bg-label-primary text-white focus-visible:ring-accent mt-5 inline-flex rounded-full px-5 py-2.5 text-[15px] font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        Open Practice Architect
      </Link>
    </aside>
  );
}
