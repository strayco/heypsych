/**
 * The same four facts on every app card, in every category, drawn so they
 * compare at a glance: research (dots), privacy (grade), price level, and who
 * you work with. Missing facts show as a dash, never guessed.
 */

import type { FinderApp } from "@/domains/patient-tools/finder/model";
import { COST_LABEL } from "@/domains/patient-tools/fit/model";

const RESEARCH_DOTS: Record<string, number> = {
  "Strong research support": 4,
  "Some research support": 3,
  "Limited research": 2,
  "Early research": 1,
};

function withWhom(app: Pick<FinderApp, "help">): string {
  if (app.help.includes("prescriber") && app.help.includes("therapist")) return "Both";
  if (app.help.includes("prescriber")) return "Prescriber";
  if (app.help.includes("therapist")) return "Therapist";
  if (app.help.includes("peer")) return "Coach";
  return "You";
}

const COST_GLYPH: Record<string, string> = {
  free: "Free",
  "free-start": "Free+",
  $: "$",
  $$: "$$",
  $$$: "$$$",
  insurance: "Ins.",
};

export function FactRow({ app, className = "" }: { app: FinderApp; className?: string }) {
  const dots = app.evidence ? RESEARCH_DOTS[app.evidence] ?? 0 : 0;
  const cells: { label: string; title: string; body: React.ReactNode }[] = [
    {
      label: "Research",
      title: app.evidence ?? "No research listed",
      body: (
        <span className="flex gap-[3px] pt-[3px]" aria-hidden="true">
          {[1, 2, 3, 4].map((i) => (
            <span key={i} className={`h-[7px] w-[7px] rounded-full ${i <= dots ? "bg-accent" : "bg-fill-tertiary"}`} />
          ))}
        </span>
      ),
    },
    {
      label: "Privacy",
      title: app.privacy ? `Privacy grade ${app.privacy}` : "Privacy not graded",
      body: <span className={app.privacy ? "text-label-primary font-semibold" : "text-label-quaternary"}>{app.privacy ?? "–"}</span>,
    },
    {
      label: "Cost",
      title: app.costTier ? COST_LABEL[app.costTier] : app.cost,
      body: (
        <span className={app.costTier ? "text-label-primary font-semibold" : "text-label-quaternary"}>
          {app.costTier ? COST_GLYPH[app.costTier] : "–"}
        </span>
      ),
    },
    {
      label: "With",
      title: { Both: "A therapist and a prescriber", Prescriber: "A prescriber", Therapist: "A licensed therapist", Coach: "A coach or peer", You: "You, on your own" }[withWhom(app)] ?? withWhom(app),
      body: <span className="text-label-primary truncate font-medium">{withWhom(app)}</span>,
    },
  ];
  return (
    <dl className={`border-separator grid grid-cols-4 gap-x-2 border-t pt-2.5 text-[12px] ${className}`}>
      {cells.map((c) => (
        <div key={c.label} className="min-w-0" title={c.title}>
          <dt className="text-label-tertiary text-[10.5px] font-medium tracking-[0.04em] uppercase">{c.label}</dt>
          <dd className="mt-0.5 flex h-[18px] items-center text-[13px]">
            <span className="sr-only">{c.title}</span>
            {c.body}
          </dd>
        </div>
      ))}
    </dl>
  );
}
