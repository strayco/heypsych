/**
 * Plan ledger
 *
 * The live state of the practice beside the office: what it costs a month
 * (known, and what is still priced on request), how much of the practice is
 * decided, which tools cover what, what still needs verifying, and which
 * choices are suggestions the clinician has not confirmed yet. Every edit in
 * the room updates it at once.
 *
 * Presentation only: figures come from the existing cost service and world
 * state. Unknown prices are never shown as $0.
 */

"use client";

import type { PracticeProject } from "@/domains/architect/schemas/practice-project";
import type { ProjectCostSummary } from "@/domains/architect/services/project-summary-service";
import type { WorldObjectId } from "@/domains/architect/world/object-registry";
import type { WorldState } from "@/domains/architect/world/world-state";
import type { ArchitectProductDisplay } from "@/domains/architect/services";

function money(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

export function PlanLedger({
  project,
  world,
  cost,
  onSelectObject,
  onOpenPlan,
  onConfirmSuggestions,
  displayMap,
  onAcknowledgePrice,
}: {
  project: PracticeProject;
  world: WorldState;
  cost: ProjectCostSummary | null;
  onSelectObject: (id: WorldObjectId) => void;
  onOpenPlan: () => void;
  onConfirmSuggestions: () => void;
  displayMap?: Map<string, ArchitectProductDisplay>;
  onAcknowledgePrice?: (productSlug: string, monthlyCents: number | null) => void;
}) {
  const suggested = project.assignments.filter((a) => a.suggested);
  const toVerify = project.assignments.filter((a) => a.needsReview);
  const objectFor = (slug: string) => world.objects.find((o) => o.assignments.some((a) => a.productSlug === slug));
  const percent = world.applicableCount ? Math.round((world.resolvedCount / world.applicableCount) * 100) : 0;
  const pending = cost ? cost.unknownCount + cost.quoteCount : 0;

  return (
    <section aria-labelledby="ledger-title" className="border-separator bg-surface shadow-card-1 rounded-2xl border p-4">
      <h2 id="ledger-title" className="sr-only">
        Your plan so far
      </h2>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-label-tertiary text-[11px] font-semibold tracking-[0.08em] uppercase">Monthly</p>
          <p className="text-label-primary text-[28px] leading-none font-semibold tabular-nums">
            {cost && cost.lines.length > 0 && !(cost.knownMonthlyCents === 0 && pending > 0) ? money(cost.knownMonthlyCents) : "—"}
          </p>
          {pending > 0 && <p className="text-label-tertiary mt-1 text-[12px]">+ {pending} priced on request</p>}
          {cost?.hasEstimatedLines && <p className="text-label-tertiary text-[12px]">Includes estimates</p>}
        </div>
        <div className="text-right">
          <p className="text-label-tertiary text-[11px] font-semibold tracking-[0.08em] uppercase">Decided</p>
          <p className="text-label-primary text-[17px] font-semibold tabular-nums">
            {world.resolvedCount}/{world.applicableCount}
          </p>
        </div>
      </div>
      <div
        className="bg-fill-tertiary mt-3 h-1.5 overflow-hidden rounded-full"
        role="progressbar"
        aria-label="Functions decided"
        aria-valuemin={0}
        aria-valuemax={world.applicableCount}
        aria-valuenow={world.resolvedCount}
      >
        <div className="bg-positive h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${percent}%` }} />
      </div>

      {cost && cost.lines.length > 0 && (
        <ul className="border-separator mt-4 space-y-1.5 border-t pt-3">
          {cost.lines.map((line) => {
            const assignment = project.assignments.find((a) => a.productSlug === line.productSlug);
            const object = objectFor(line.productSlug);
            return (
              <li key={line.productSlug}>
                <button
                  type="button"
                  onClick={() => object && onSelectObject(object.definition.objectId)}
                  className="hover:bg-fill-quaternary -mx-1.5 flex w-[calc(100%+0.75rem)] items-baseline justify-between gap-2 rounded-lg px-1.5 py-1 text-left"
                >
                  <span className="min-w-0">
                    <span className="text-label-primary text-[14px] font-medium">{line.productName}</span>
                    {assignment?.suggested && <span className="bg-accent-tint text-accent ml-1.5 rounded-full px-1.5 py-px text-[10px] font-semibold tracking-wide uppercase">Suggested</span>}
                    <span className="text-label-tertiary block text-[12px]">
                      {(() => {
                        const n = world.objects.filter((o) => o.assignments.some((a) => a.productSlug === line.productSlug)).length;
                        return `Covers ${n} ${n === 1 ? "part" : "parts"} of your practice`;
                      })()}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="text-label-secondary block text-[13px] tabular-nums">
                      {line.monthlyCents !== null ? `${money(line.monthlyCents)}/mo${line.isEstimate ? "*" : ""}` : line.requiresQuote ? "Quote" : "Price unknown"}
                    </span>
                    <span className="text-label-tertiary block text-[11px]">{displayMap?.get(line.productSlug)?.priceVerifiedOn ? "price checked" : "unverified price"}</span>
                  </span>
                </button>
                {assignment && assignment.quotedMonthlyCents !== undefined && assignment.quotedMonthlyCents !== line.monthlyCents && (
                  <p className="border-caution-200 bg-caution-50 mt-1 rounded-lg border px-2 py-1 text-[12px] text-label-primary">
                    Price changed since you chose it: {assignment.quotedMonthlyCents === null ? "unknown" : money(assignment.quotedMonthlyCents)} → {line.monthlyCents === null ? "unknown" : money(line.monthlyCents)}/mo.{" "}
                    {onAcknowledgePrice && (
                      <button type="button" onClick={() => onAcknowledgePrice(line.productSlug, line.monthlyCents)} className="font-medium underline">
                        OK
                      </button>
                    )}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {toVerify.length > 0 && (
        <div className="border-caution-200 bg-caution-50 mt-3 rounded-xl border px-3 py-2">
          <p className="text-label-primary text-[13px] font-semibold">Verify before you sign · {toVerify.length}</p>
          <ul className="text-label-secondary mt-1 space-y-0.5 text-[12px] leading-snug">
            {toVerify.slice(0, 3).map((a) => (
              <li key={a.productSlug}>
                {a.productName}: {a.reviewReason ?? "check this with the vendor"}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {suggested.length > 0 && (
          <button type="button" onClick={onConfirmSuggestions} className="border-separator text-label-primary hover:border-label-primary min-h-9 rounded-full border px-3 text-[13px] font-medium">
            Keep {suggested.length === 1 ? "the suggestion" : `all ${suggested.length} suggestions`}
          </button>
        )}
        {project.assignments.length > 0 && (
          <button type="button" onClick={onOpenPlan} className="bg-label-primary text-canvas min-h-9 rounded-full px-3.5 text-[13px] font-medium">
            See your practice plan →
          </button>
        )}
      </div>
    </section>
  );
}
