/**
 * Compact app card. Works on the server and inside islands.
 *
 * Every card, in every category, reads the same way: what it is (its main
 * approach — "Learn a program", "Specialist care"), the one-line summary, the
 * price, then the shared fact row. A role badge ("Best-studied") and the fact
 * that earned it appear when the card is a pick.
 */

import Link from "next/link";
import { ToolMark } from "@/components/tools/ToolMark";
import type { FinderApp } from "@/domains/patient-tools/finder/model";
import { APPROACHES, type ApproachId } from "@/domains/patient-tools/fit/model";
import { whatYouGet } from "@/domains/patient-tools/shelves/model";
import { FactRow } from "@/components/patient-tools/fit/FactRow";
import { SaveButton } from "./SaveButton";

export function AppCard({
  app,
  wide = false,
  role,
  because,
  approachId,
}: {
  app: FinderApp;
  wide?: boolean;
  /** Role badge, e.g. "Best-studied". */
  role?: string;
  /** The fact behind the role. */
  because?: string;
  /** Approach to show, when the card sits on a particular step. */
  approachId?: ApproachId | null;
}) {
  const approach = APPROACHES.find((a) => a.id === (approachId !== undefined ? approachId : app.approaches[0]));
  const human = app.help.some((h) => h !== "self-guided");
  return (
    <article
      className={`border-separator bg-surface shadow-card-1 hover:shadow-card-2 focus-within:shadow-card-2 group relative flex h-full w-full flex-col rounded-2xl border p-4 transition-[transform,box-shadow] duration-300 [transition-timing-function:cubic-bezier(0.22,0.61,0.36,1)] hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
        wide ? "" : "w-[17rem] shrink-0 snap-start sm:w-[18.5rem]"
      }`}
    >
      {role && (
        <p className="mb-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="bg-label-primary rounded-full px-2.5 py-0.5 text-[11.5px] font-semibold tracking-[0.02em] text-white">{role}</span>
          {because && <span className="text-label-tertiary text-[12.5px]">{because}</span>}
        </p>
      )}
      <div className="flex items-start gap-3">
        <ToolMark name={app.name} slug={app.slug} />
        <div className="min-w-0 flex-1">
          <h3 className="text-label-primary truncate text-[16px] leading-tight font-semibold">
            <Link
              href={app.href}
              className="focus-visible:ring-accent after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-2"
            >
              {app.name}
            </Link>
          </h3>
          <p className={`mt-0.5 truncate text-[13px] font-medium ${human ? "text-treatment" : "text-accent"}`}>
            {approach ? approach.label : whatYouGet(app)}
          </p>
        </div>
        <SaveButton slug={app.slug} name={app.name} className="-mt-1 -mr-1" />
      </div>
      {app.summary && <p className="text-label-secondary mt-3 line-clamp-2 text-[14px] leading-snug">{app.summary}</p>}
      {app.limited && <p className="text-label-tertiary mt-2 line-clamp-1 text-[12.5px]">{app.limited}</p>}
      <div className="mt-auto pt-3">
        <p className="text-label-primary line-clamp-1 text-[13.5px]">
          {app.cost}
          {app.pay.includes("insurance") && app.costTier !== "insurance" && <span className="text-positive-600"> · Takes insurance</span>}
        </p>
        <FactRow app={app} className="mt-2.5" />
      </div>
    </article>
  );
}
