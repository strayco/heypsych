"use client";

/**
 * Homepage strip for returning visitors: picks up where they left off instead
 * of asking "where would you like to begin?" again. Nothing renders for a
 * first visit, or on the server.
 */

import Link from "next/link";
import { pathWorkspaceEnabled } from "@/lib/config/feature-flags";
import { trackPathEvent } from "./analytics";
import { usePath } from "./store";
import { useFlag } from "@/lib/live/client";
import type { FlagState } from "@/lib/live/config";

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export function ResumePath({ flag = { enabled: true, rollout: 100 } }: { flag?: FlagState }) {
  const { snapshot: p, count, ready } = usePath();
  const on = useFlag(flag, "home.resume-strip");
  if (!on || !pathWorkspaceEnabled() || !ready || count === 0) return null;

  const parts = [
    p.noticed.length && plural(p.noticed.length, "thing you noticed", "things you noticed"),
    p.conditions.length && plural(p.conditions.length, "condition", "conditions"),
    p.treatments.length && plural(p.treatments.length, "treatment", "treatments"),
    p.apps.length && plural(p.apps.length, "saved app", "saved apps"),
  ].filter(Boolean) as string[];

  return (
    <section aria-labelledby="resume-title" className="px-4 pb-4 sm:px-6 lg:px-8">
      <div className="border-accent/25 bg-accent-tint mx-auto flex max-w-5xl flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 id="resume-title" className="font-display text-label-primary text-[22px] leading-tight">
            Welcome back
          </h2>
          <p className="text-label-secondary mt-1 text-[15px]">
            {p.nextStep ? `Your next step: ${p.nextStep.pathName}. ` : ""}
            {parts.length > 0 ? `Your path has ${parts.join(", ")}.` : ""}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link
            href="/my-path"
            onClick={() => trackPathEvent("path_resume_clicked", { surface: "homepage" })}
            className="bg-label-primary text-canvas focus-visible:ring-accent inline-flex min-h-11 items-center rounded-full px-5 text-[15px] font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            <span className="text-canvas">Open your path</span>
          </Link>
          {!p.nextStep && (
            <Link
              href="/find-support?need=support"
              className="border-separator bg-surface text-label-primary hover:border-label-tertiary focus-visible:ring-accent inline-flex min-h-11 items-center rounded-full border px-5 text-[15px] font-medium focus-visible:ring-2 focus-visible:outline-none"
            >
              Find your next step
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
