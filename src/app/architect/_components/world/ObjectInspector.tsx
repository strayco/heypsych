/**
 * Object Inspector
 *
 * The contextual panel that opens when a clinician selects an object.
 *
 * Everything shown here comes from the capability recommendation service,
 * which composes the existing engines. This component contains no vendor
 * list, no ranking rule, and no eligibility logic of its own.
 */

"use client";

import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  Check,
  ExternalLink,
  Info,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import type { PracticeFingerprint } from "@/domains/architect/schemas/fingerprint";
import type { ProductArchitectureMetadata } from "@/domains/architect/schemas/product-metadata";
import type { ArchitectProductDisplay } from "@/domains/architect/services";
import type { SelectionCostPreview } from "@/domains/architect/services/selection-preview";
import {
  EVIDENCE_CONFIDENCE_LABELS,
  FIT_TIER_LABELS,
  recommendProductsForCapabilities,
  type ProductOption,
} from "@/domains/architect/services/capability-recommendation-service";
import { MOTION } from "@/domains/architect/world/scene";
import { trackArchitectEvent } from "@/domains/architect/analytics";
import type { WorldObjectState } from "@/domains/architect/world/world-state";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";
import type { PublicConsensus } from "@/domains/consensus/public";
import { ConsensusBadge } from "@/components/tools/clinician/consensus/ConsensusScore";

interface ObjectInspectorProps {
  object: WorldObjectState | null;
  fingerprint: PracticeFingerprint;
  metadataMap: Map<string, ProductArchitectureMetadata>;
  displayMap: Map<string, ArchitectProductDisplay>;
  /** Approved Consensus Scores by slug; display only. */
  consensus?: Record<string, PublicConsensus>;
  isLoadingProducts: boolean;
  assignedSlugs: string[];
  onClose: () => void;
  onSelectProduct: (option: ProductOption) => void;
  /** Net change to the whole stack's monthly total if `option` is chosen. */
  previewSelection?: (option: ProductOption) => SelectionCostPreview | null;
  onRemoveProduct: (productSlug: string) => void;
  /** Names of every object each chosen product resolves, keyed by slug. */
  objectNamesByProduct?: ReadonlyMap<string, string[]>;
  onMarkHandledElsewhere: () => void;
  onMarkNotNeeded: () => void;
  onClearDecision: () => void;
  /** Keep a "Draft my practice" suggestion as the clinician's choice. */
  onKeepSuggestion?: (productSlug: string) => void;
}

export function ObjectInspector({
  object,
  fingerprint,
  metadataMap,
  displayMap,
  consensus = {},
  isLoadingProducts,
  assignedSlugs,
  onClose,
  onSelectProduct,
  previewSelection,
  onRemoveProduct,
  objectNamesByProduct,
  onMarkHandledElsewhere,
  onMarkNotNeeded,
  onClearDecision,
  onKeepSuggestion,
}: ObjectInspectorProps) {
  const reduceMotion = useReducedMotion();
  const panelRef = useRef<HTMLElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const objectId = object?.definition.objectId ?? null;

  /*
    Focus handling for an opening panel.

    Moving focus into the panel is what makes it reachable at all for a
    keyboard or screen-reader user; returning focus to the object afterwards
    is what stops them being dumped back at the top of the page and having to
    tab through the whole room again to reach the object they were just on.
  */
  useEffect(() => {
    if (!objectId) return;

    returnFocusRef.current = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    return () => {
      returnFocusRef.current?.focus?.();
    };
  }, [objectId]);

  useEffect(() => {
    if (!objectId) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [objectId, onClose]);

  const recommendation = useMemo(() => {
    if (!object || object.definition.isExternal) return null;

    const products = [...metadataMap.entries()].map(([slug, metadata]) => ({
      metadata,
      name: displayMap.get(slug)?.name ?? slug,
      tagline: displayMap.get(slug)?.tagline,
    }));

    return recommendProductsForCapabilities({
      capabilityIds: object.definition.capabilityIds,
      fingerprint,
      products,
      assignedSlugs,
      alternativeCount: 2,
    });
  }, [object, metadataMap, displayMap, fingerprint, assignedSlugs]);

  /** The tool now covering this function, to compare each option against. */
  const currentFor = (slug: string): { slug: string; name: string; cents: number | null; covers: number } | undefined => {
    const assigned = object?.assignments.find((a) => a.productSlug !== slug);
    if (!assigned || !recommendation) return undefined;
    const all = [recommendation.recommended, ...recommendation.alternatives, ...recommendation.others].filter(Boolean) as ProductOption[];
    const match = all.find((o) => o.productSlug === assigned.productSlug);
    return { slug: assigned.productSlug, name: assigned.productName, cents: match?.cost.minMonthlyCents ?? null, covers: match ? match.coversRequested.length + match.coversAdditional.length : 0 };
  };

  const transition = reduceMotion
    ? { duration: 0 }
    : { duration: MOTION.inspector.duration, ease: "easeOut" as const };

  return (
    <AnimatePresence>
      {object && (
        <motion.aside
          key={object.definition.objectId}
          ref={panelRef}
          role="dialog"
          aria-label={object.definition.name}
          tabIndex={-1}
          className="fixed bottom-0 right-0 top-32 z-40 flex w-full max-w-[26rem] flex-col border-l border-separator bg-surface shadow-floating focus:outline-none md:max-w-[24rem]"
          initial={reduceMotion ? false : { x: 24, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { x: 24, opacity: 0 }}
          transition={transition}
        >
          {/* Header ------------------------------------------------------ */}
          <header className="flex items-start justify-between gap-3 border-b border-separator px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-label-primary">
                {object.definition.name}
              </h2>
              <p className="mt-1 text-sm leading-snug text-label-secondary">
                {object.definition.description}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close panel"
              className="shrink-0 rounded-lg p-1.5 text-label-tertiary transition-colors hover:bg-fill-secondary hover:text-label-primary"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {/* Current state ------------------------------------------- */}
            {object.state === "handled-elsewhere" && (
              <StatusNote
                tone="neutral"
                title="Already handled"
                body={
                  object.productName
                    ? `You told us this is covered by ${object.productName}.`
                    : "You told us this is covered outside Practice Architect."
                }
                actionLabel="Choose a tool instead"
                onAction={onClearDecision}
              />
            )}

            {object.state === "not-needed" && (
              <StatusNote
                tone="neutral"
                title="Not needed"
                body="This function is excluded from your practice architecture."
                actionLabel="Add it back"
                onAction={onClearDecision}
              />
            )}

            {object.hasOverlap && (
              <StatusNote
                tone="warning"
                title={`${object.assignments.length} tools cover this`}
                body={`${object.overlappingProductNames.join(
                  " and "
                )} both cover this function. You may be paying twice.`}
              />
            )}

            {/* External objects ----------------------------------------- */}
            {object.definition.isExternal ? (
              <ExternalGuidance />
            ) : isLoadingProducts ? (
              <LoadingState />
            ) : recommendation?.isEmpty ? (
              <EmptyState />
            ) : (
              <>
                {/* A gap in our evidence, stated once rather than on
                    every card, where it would just be tuned out. */}
                {recommendation &&
                  recommendation.sharedUncertainties.length > 0 && (
                    <div className="mb-5 rounded-xl border border-separator bg-fill-quaternary p-3">
                      <p className="text-xs font-medium text-label-secondary">
                        What we haven&apos;t verified
                      </p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-4">
                        {recommendation.sharedUncertainties.map((item) => (
                          <li
                            key={item.policy}
                            className="text-xs leading-snug text-label-tertiary"
                          >
                            {item.headline ? (
                              <>
                                <span className="font-medium">
                                  {item.headline}
                                </span>{" "}
                                — {item.detail}
                              </>
                            ) : (
                              <>{item.reason}, for any of these tools.</>
                            )}
                          </li>
                        ))}
                      </ul>
                      <p className="mt-1.5 text-xs leading-snug text-label-tertiary">
                        Confirm these with the vendor before you commit.
                      </p>
                    </div>
                  )}

                {/* Assigned ------------------------------------------- */}
                {object.assignments.length > 0 && (
                  <section className="mb-6">
                    <SectionHeading>In your practice</SectionHeading>
                    <div className="space-y-2">
                      {object.assignments.map((assignment) => (
                        <AssignedCard
                          key={assignment.productSlug}
                          name={assignment.productName}
                          objectName={object.definition.name}
                          alsoCovers={(
                            objectNamesByProduct?.get(assignment.productSlug) ?? []
                          ).filter((n) => n !== object.definition.name)}
                          needsReview={assignment.needsReview}
                          reviewReason={assignment.reviewReason}
                          suggested={assignment.suggested === true}
                          onKeep={onKeepSuggestion ? () => onKeepSuggestion(assignment.productSlug) : undefined}
                          onRemove={() =>
                            onRemoveProduct(assignment.productSlug)
                          }
                        />
                      ))}
                    </div>
                  </section>
                )}

                {/* Recommended ---------------------------------------- */}
                {recommendation?.recommended && (
                  <section className="mb-6">
                    <SectionHeading>Recommended for your practice</SectionHeading>
                    <OptionCard
                      option={recommendation.recommended}
                      current={currentFor(recommendation.recommended.productSlug)}
                      netDeltaCents={previewSelection?.(recommendation.recommended)?.deltaCents ?? null}
                      displayMap={displayMap}
                      consensus={consensus[recommendation.recommended.productSlug] ?? null}
                      isAssigned={assignedSlugs.includes(
                        recommendation.recommended.productSlug
                      )}
                      emphasis
                      onSelect={() =>
                        onSelectProduct(recommendation.recommended!)
                      }
                    />
                  </section>
                )}

                {/* Alternatives --------------------------------------- */}
                {recommendation && recommendation.alternatives.length > 0 && (
                  <section className="mb-6">
                    <SectionHeading>Other options</SectionHeading>
                    <div className="space-y-2">
                      {recommendation.alternatives.map((option) => (
                        <OptionCard
                          key={option.productSlug}
                          option={option}
                          current={currentFor(option.productSlug)}
                          netDeltaCents={previewSelection?.(option)?.deltaCents ?? null}
                          displayMap={displayMap}
                          consensus={consensus[option.productSlug] ?? null}
                          isAssigned={assignedSlugs.includes(
                            option.productSlug
                          )}
                          onSelect={() => onSelectProduct(option)}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>

          {/* Quick actions ---------------------------------------------- */}
          {object.state === "unconfigured" && (
            <footer className="border-t border-separator px-5 py-3">
              <div className="flex gap-2">
                <button
                  onClick={onMarkHandledElsewhere}
                  className="flex-1 rounded-lg border border-separator px-3 py-2 text-xs font-medium text-label-secondary transition-colors hover:bg-fill-quaternary"
                >
                  I already have this
                </button>
                <button
                  onClick={onMarkNotNeeded}
                  className="flex-1 rounded-lg border border-separator px-3 py-2 text-xs font-medium text-label-secondary transition-colors hover:bg-fill-quaternary"
                >
                  I don&apos;t need this
                </button>
              </div>
            </footer>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// PIECES
// ============================================================================

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-label-tertiary">
      {children}
    </h3>
  );
}

function StatusNote({
  tone,
  title,
  body,
  actionLabel,
  onAction,
}: {
  tone: "neutral" | "warning";
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const toneClasses =
    tone === "warning"
      ? "border-amber-200 bg-amber-50"
      : "border-separator bg-fill-quaternary";

  return (
    <div className={`mb-5 rounded-xl border p-3 ${toneClasses}`}>
      <div className="flex items-start gap-2">
        {tone === "warning" ? (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        ) : (
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-label-tertiary" />
        )}
        <div className="min-w-0">
          <p className="text-sm font-medium text-label-primary">{title}</p>
          <p className="mt-0.5 text-xs leading-snug text-label-secondary">
            {body}
          </p>
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="mt-2 text-xs font-medium text-accent hover:underline"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AssignedCard({
  name,
  objectName,
  alsoCovers,
  needsReview,
  reviewReason,
  suggested,
  onKeep,
  onRemove,
}: {
  name: string;
  objectName: string;
  alsoCovers: string[];
  needsReview: boolean;
  reviewReason?: string;
  suggested?: boolean;
  onKeep?: () => void;
  onRemove: () => void;
}) {
  return (
    <div className={`rounded-xl border p-3 ${suggested ? "border-accent/40 bg-accent/5" : "border-positive/40 bg-positive/5"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {suggested ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-accent">
              <Sparkles className="h-3.5 w-3.5" />
              Suggested by your draft
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-positive">
              <Check className="h-3.5 w-3.5" />
              Selected
            </span>
          )}
          <p className="mt-0.5 truncate text-sm font-semibold text-label-primary">
            {name}
          </p>
          {alsoCovers.length > 0 && (
            <p className="mt-1 text-xs leading-snug text-label-secondary">
              Also covers {formatList(alsoCovers)} in your practice.
            </p>
          )}
          {needsReview && reviewReason && (
            <p className="mt-1 text-xs text-caution-700">{reviewReason}</p>
          )}
          {suggested && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {onKeep && (
                <button onClick={onKeep} className="rounded-lg bg-label-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent">
                  Keep it
                </button>
              )}
              <span className="text-xs text-label-secondary">or pick an option below to replace it.</span>
            </div>
          )}
        </div>
        <button
          onClick={onRemove}
          aria-label={`Remove ${name} from ${objectName}`}
          title={alsoCovers.length > 0 ? `Remove from ${objectName} only` : `Remove ${name}`}
          className="shrink-0 rounded-md p-1.5 text-label-tertiary transition-colors hover:bg-fill-secondary hover:text-negative"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function OptionCard({
  option,
  current,
  netDeltaCents,
  displayMap,
  consensus,
  isAssigned,
  emphasis = false,
  onSelect,
}: {
  consensus: PublicConsensus | null;
  option: ProductOption;
  /**
   * Net change to the plan's monthly total if this option is chosen, from the
   * same cost calculation as the ledger (shared coverage included); null
   * when it can't be known (quotes or unlisted prices).
   */
  netDeltaCents: number | null;
  /** The tool now covering this function, when different from this option. */
  current?: { slug: string; name: string; cents: number | null; covers: number };
  displayMap: Map<string, ArchitectProductDisplay>;
  isAssigned: boolean;
  emphasis?: boolean;
  onSelect: () => void;
}) {
  const verifiedOn = displayMap.get(option.productSlug)?.priceVerifiedOn;
  const delta = netDeltaCents;
  const coverDelta = current ? option.coversRequested.length + option.coversAdditional.length - current.covers : 0;
  const display = displayMap.get(option.productSlug);
  const category = display?.category as
    | keyof typeof SCHEMA_TO_TAXONOMY_CATEGORY
    | undefined;
  const href = `/tools/for-clinicians/${
    (category && SCHEMA_TO_TAXONOMY_CATEGORY[category]) ??
    display?.category ??
    "ehr-practice-management"
  }/${option.productSlug}/`;

  return (
    <div
      className={`rounded-xl border p-3 ${
        emphasis
          ? "border-accent/40 bg-accent/5"
          : "border-separator bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-label-primary">
            {option.productName}
          </p>

          {/* Fit tier and evidence confidence are two separate signals. */}
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge tone={option.fitTier === "strong" ? "accent" : "neutral"}>
              {FIT_TIER_LABELS[option.fitTier]}
            </Badge>
            <Badge
              tone={
                option.evidenceConfidence === "low" ? "warning" : "neutral"
              }
            >
              {EVIDENCE_CONFIDENCE_LABELS[option.evidenceConfidence]}
            </Badge>
            {option.coversRequested.some((c) => c.awaitingVerification) && (
              <Badge tone="warning">Requires verification</Badge>
            )}
          </div>
          {consensus && (
            <p className="mt-1.5">
              <ConsensusBadge consensus={consensus} name={option.productName} />
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-medium text-label-primary">
            {formatCost(option)}
          </p>
          <p className="text-[11px] text-label-tertiary">
            {verifiedOn ? `Price checked ${formatDay(verifiedOn)}` : "Price not verified by us"}
          </p>
        </div>
      </div>

      {/* Against what the practice has now: cost and coverage, never a verdict. */}
      {current && !isAssigned && (
        <p className="mt-2 text-xs text-label-secondary">
          Compared with {current.name}:{" "}
          {delta === null ? "change to your total unknown" : delta === 0 ? "no change to your monthly total" : `${delta > 0 ? "+" : "−"}$${Math.round(Math.abs(delta) / 100)}/mo to your total`}
          {coverDelta !== 0 && `, covers ${Math.abs(coverDelta)} ${coverDelta > 0 ? "more" : "fewer"} ${Math.abs(coverDelta) === 1 ? "function" : "functions"}`}
          {" · "}
          <Link
            href={`/tools/compare?tools=${current.slug},${option.productSlug}`}
            onClick={() => trackArchitectEvent("architect_replacement_preview", { productSlug: option.productSlug, previousProductSlug: current.slug })}
            className="font-medium text-label-primary underline underline-offset-2"
          >
            Compare side by side
          </Link>
        </p>
      )}

      {/* Why it fits. */}
      {option.reasons.length > 0 && (
        <p className="mt-2 text-xs leading-snug text-label-secondary">
          {option.reasons[0]}
        </p>
      )}

      {/* The material tradeoff. */}
      {option.tradeoff && (
        <p className="mt-1.5 text-xs leading-snug text-label-tertiary">
          <span className="font-medium">Trade-off:</span> {option.tradeoff}
        </p>
      )}

      {/* Unverified evidence must stay visible. */}
      {option.uncertainties.length > 0 && (
        <div className="mt-1.5 flex items-start gap-1 text-xs leading-snug text-amber-700">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          {/* Findings with prescribed wording render it verbatim; the rest
              read as a clause after the label. Never case-folded, which
              would turn "EPCS" into "epcs". */}
          {option.uncertainties[0].headline ? (
            <span>
              <span className="font-medium">
                {option.uncertainties[0].headline}
              </span>{" "}
              — {option.uncertainties[0].detail}
            </span>
          ) : (
            <span>Needs verification: {option.uncertainties[0].reason}</span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={onSelect}
          disabled={isAssigned}
          className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
            isAssigned
              ? "cursor-default bg-fill-tertiary text-label-tertiary"
              : emphasis
                ? "bg-accent text-white hover:bg-accent-hover"
                : "border border-separator text-label-primary hover:bg-fill-quaternary"
          }`}
        >
          {isAssigned ? "Selected" : "Select"}
        </button>
        <Link
          href={href}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs text-accent hover:underline"
        >
          Details
          <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone: "accent" | "warning" | "neutral";
  children: React.ReactNode;
}) {
  const classes = {
    accent: "bg-accent/10 text-accent",
    warning: "bg-amber-100 text-amber-800",
    neutral: "bg-fill-tertiary text-label-secondary",
  }[tone];

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${classes}`}
    >
      {children}
    </span>
  );
}

function formatDay(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** Never render a fabricated price. */
function formatCost(option: ProductOption): string {
  if (option.cost.requiresQuote) return "Quote required";
  if (option.cost.minMonthlyCents === null) {
    return option.cost.priceDisplayText ?? "Price unknown";
  }
  if (option.cost.minMonthlyCents === 0) return "Free tier";
  return `$${Math.round(option.cost.minMonthlyCents / 100)}/mo`;
}

function LoadingState() {
  return (
    <div className="space-y-2" aria-live="polite">
      <p className="text-sm text-label-secondary">Choosing tools for this…</p>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-xl bg-fill-quaternary"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-separator bg-fill-quaternary p-4">
      <p className="text-sm text-label-secondary">
        We do not have a well-known tool for this that fits your practice yet.
      </p>
      <p className="mt-1 text-xs text-label-tertiary">
        Mark it as already handled if you cover it another way.
      </p>
    </div>
  );
}

function ExternalGuidance() {
  return (
    <div className="rounded-xl border border-separator bg-fill-quaternary p-4">
      <p className="text-sm text-label-secondary">
        This is arranged with an insurer rather than through software, so we
        don&apos;t recommend products for it.
      </p>
      <p className="mt-2 text-xs text-label-tertiary">
        Mark it as handled once your cover is in place, and it will appear in
        your setup plan.
      </p>
    </div>
  );
}

/** "A", "A and B", "A, B and C". */
function formatList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}
