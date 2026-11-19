/**
 * Practice plan sheet
 *
 * The blueprint as one printable page: who the practice is, the stack and
 * what each tool covers, what it costs a month and a year as far as prices
 * are published, what to verify before signing, and what is still open.
 *
 * Figures come from the existing cost service. Unknown or quote-only prices
 * are listed as such and excluded from totals, never counted as $0.
 */

"use client";

import { Printer } from "lucide-react";
import {
  CLINICAL_ROLE_LABELS,
  DELIVERY_MODEL_LABELS,
  PRACTICE_SIZE_LABELS,
} from "@/domains/architect/schemas/fingerprint";
import { PAYMENT_MODEL_LABELS, PRACTICE_STAGE_LABELS, type PracticeProject } from "@/domains/architect/schemas/practice-project";
import type { ProjectCostSummary } from "@/domains/architect/services/project-summary-service";
import type { WorldState } from "@/domains/architect/world/world-state";
import { trackArchitectEvent } from "@/domains/architect/analytics";
import type { ArchitectProductDisplay } from "@/domains/architect/services";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";
import Link from "next/link";

/** The HeyPsych profile for a product: same rule as the inspector's links. */
function profileHref(slug: string, display?: ArchitectProductDisplay) {
  const category = display?.category as keyof typeof SCHEMA_TO_TAXONOMY_CATEGORY | undefined;
  return `/tools/for-clinicians/${(category && SCHEMA_TO_TAXONOMY_CATEGORY[category]) ?? display?.category ?? "ehr-practice-management"}/${slug}/`;
}

function money(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}

export function PracticePlanSheet({
  project,
  world,
  cost,
  completedTasks,
  totalTasks,
  displayMap,
}: {
  project: PracticeProject;
  world: WorldState;
  cost: ProjectCostSummary | null;
  completedTasks: number;
  totalTasks: number;
  displayMap?: Map<string, ArchitectProductDisplay>;
}) {
  const p = project.profile;
  const who = [
    p.roles.map((r) => CLINICAL_ROLE_LABELS[r]).join(", "),
    p.size ? PRACTICE_SIZE_LABELS[p.size] : null,
    p.states[0] ?? null,
    p.delivery ? DELIVERY_MODEL_LABELS[p.delivery] : null,
    p.payment ? PAYMENT_MODEL_LABELS[p.payment] : null,
    p.stage ? PRACTICE_STAGE_LABELS[p.stage] : null,
  ].filter(Boolean);

  const covers = (slug: string) => world.objects.filter((o) => o.assignments.some((a) => a.productSlug === slug)).map((o) => o.definition.name);
  const open = world.objects.filter((o) => o.state === "unconfigured").map((o) => o.definition.name);
  const verify = project.assignments.filter((a) => a.needsReview);
  const pending = cost ? cost.unknownCount + cost.quoteCount : 0;
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const print = () => {
    trackArchitectEvent("architect_stack_export", { productsCount: project.assignments.length });
    const sheet = document.querySelector("[data-brief-print]");
    const root = document.createElement("div");
    root.setAttribute("data-print-root", "");
    if (sheet) root.appendChild(sheet.cloneNode(true));
    document.body.appendChild(root);
    document.body.dataset.printBrief = "1";
    const done = () => {
      delete document.body.dataset.printBrief;
      root.remove();
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
  };

  return (
    <section aria-labelledby="plan-sheet-title" className="mb-10">
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={print}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-label-primary px-4 text-[14px] font-medium text-white hover:bg-accent"
        >
          <Printer className="h-4 w-4" /> Print or save as PDF
        </button>
      </div>
      <article data-brief-print className="rounded-2xl border border-separator bg-surface p-6 shadow-card-1 sm:p-8">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="plan-sheet-title" className="font-display text-[28px] leading-tight text-label-primary">
            {project.name}: practice plan
          </h2>
          <p className="text-[13px] text-label-secondary">Prepared {today}</p>
        </header>
        <p className="mt-1 text-[14px] text-label-secondary">{who.join(" · ")}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-fill-quaternary p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-label-secondary">Monthly, published prices</p>
            <p className="mt-1 text-[24px] font-semibold tabular-nums text-label-primary">
              {cost && cost.lines.length > 0 && !(cost.knownMonthlyCents === 0 && pending > 0) ? money(cost.knownMonthlyCents) : "—"}
            </p>
            {pending > 0 && <p className="text-[12px] text-label-secondary">+ {pending} priced on request</p>}
          </div>
          <div className="rounded-xl bg-fill-quaternary p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-label-secondary">First year</p>
            <p className="mt-1 text-[24px] font-semibold tabular-nums text-label-primary">
              {cost && cost.knownMonthlyCents > 0 ? money(cost.knownMonthlyCents * 12) : "—"}
            </p>
            <p className="text-[12px] text-label-secondary">Monthly × 12, before setup fees</p>
          </div>
          <div className="rounded-xl bg-fill-quaternary p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-label-secondary">Decided</p>
            <p className="mt-1 text-[24px] font-semibold tabular-nums text-label-primary">
              {world.resolvedCount} of {world.applicableCount}
            </p>
            <p className="text-[12px] text-label-secondary">
              {completedTasks} of {totalTasks} setup tasks done
            </p>
          </div>
        </div>

        {cost && cost.lines.length > 0 && (
          <table className="mt-6 w-full text-left text-[14px]">
            <caption className="sr-only">Tools in this plan</caption>
            <thead>
              <tr className="border-b border-separator text-[11px] uppercase tracking-[0.08em] text-label-tertiary">
                <th scope="col" className="py-2 pr-3 font-semibold">Tool</th>
                <th scope="col" className="py-2 pr-3 font-semibold">Covers</th>
                <th scope="col" className="py-2 pr-3 text-right font-semibold">Monthly</th>
                <th scope="col" className="py-2 text-right font-semibold">Price status</th>
              </tr>
            </thead>
            <tbody>
              {cost.lines.map((line) => {
                const assignment = project.assignments.find((a) => a.productSlug === line.productSlug);
                return (
                  <tr key={line.productSlug} className="border-b border-separator align-top last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-label-primary">
                      <Link
                        href={profileHref(line.productSlug, displayMap?.get(line.productSlug))}
                        onClick={() => trackArchitectEvent("architect_product_drawer_open", { productSlug: line.productSlug, source: "practice-plan" })}
                        className="underline decoration-separator-opaque underline-offset-4 hover:decoration-label-primary"
                      >
                        {line.productName}
                      </Link>
                      {assignment?.suggested && <span className="ml-1.5 text-[11px] font-normal text-label-tertiary">(suggested)</span>}
                    </td>
                    <td className="py-2.5 pr-3 text-label-secondary">{covers(line.productSlug).join(", ")}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums text-label-primary">
                      {line.monthlyCents !== null ? `${money(line.monthlyCents)}${line.isEstimate ? "*" : ""}` : line.requiresQuote ? "Quote" : "Unknown"}
                    </td>
                    <td className="py-2.5 text-right text-[12px] text-label-secondary">
                      {displayMap?.get(line.productSlug)?.priceVerifiedOn ? `Checked ${displayMap.get(line.productSlug)!.priceVerifiedOn}` : "Not verified"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {cost?.hasEstimatedLines && <p className="mt-2 text-[12px] text-label-tertiary">* Estimated from per-provider pricing and your provider count.</p>}

        {verify.length > 0 && (
          <div className="mt-6">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-label-tertiary">Verify before you sign</h3>
            <ul className="mt-2 space-y-1 text-[14px] text-label-primary">
              {verify.map((a) => (
                <li key={a.productSlug}>☐ {a.productName}: {a.reviewReason ?? "confirm with the vendor"}</li>
              ))}
            </ul>
          </div>
        )}

        {open.length > 0 && (
          <div className="mt-6">
            <h3 className="text-[12px] font-semibold uppercase tracking-[0.08em] text-label-tertiary">Still to decide</h3>
            <p className="mt-1 text-[14px] text-label-primary">{open.join(", ")}</p>
          </div>
        )}

        {cost && cost.assumptions.length > 0 && (
          <p className="mt-6 text-[12px] leading-relaxed text-label-tertiary">Assumptions: {cost.assumptions.join(" ")}</p>
        )}
        <p className="mt-4 text-[12px] leading-relaxed text-label-tertiary">
          Picks come from HeyPsych&apos;s catalog and recommendation engines, which commercial relationships cannot influence. Prices are as published by vendors and
          may have changed. Confirm pricing, BAA terms and any e-prescribing capability directly with each vendor before signing. heypsych.com
        </p>
      </article>
    </section>
  );
}
