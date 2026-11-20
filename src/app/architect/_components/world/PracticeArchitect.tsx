/**
 * Practice Architect
 *
 * The root of the experience. Owns the three steps — Your Practice, Your
 * Blueprint, Your Setup Plan — and keeps application orchestration here so
 * the scene stays a presentation layer and the engines stay pure.
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LayoutGrid, 
  Loader2,
  Pencil,
  RotateCcw,
  Save,
  Sparkles,
} from "lucide-react";
import { useArchitectProducts } from "@/domains/architect/hooks/useArchitectProducts";
import { profileToFingerprint } from "@/domains/architect/adapters/profile-to-fingerprint";
import { deriveWorldState } from "@/domains/architect/world/world-state";
import {
  type WorldObjectId,
} from "@/domains/architect/world/object-registry";
import {
  calculateProjectCost,
  formatProjectCost,
} from "@/domains/architect/services/project-summary-service";
import type { ProductOption } from "@/domains/architect/services/capability-recommendation-service";
import {
  gapFillCapabilities,
  reconcileCoverage,
} from "@/domains/architect/world/coverage";
import type { CapabilityId } from "@/domains/architect/schemas/lifecycle";
import { ObjectInspector } from "./ObjectInspector";
import { PracticeOnboarding } from "./PracticeOnboarding";
import { PracticeScene } from "./PracticeScene";
import { PracticeChecklist } from "./PracticeChecklist";
import { numberById, numberObjects } from "./object-order";
import { SetupPlan } from "./SetupPlan";
import { PlanLedger } from "./PlanLedger";
import { draftPracticeStack } from "@/domains/architect/services/draft-stack-service";
import { previewSelectionCost, type SelectionPlan } from "@/domains/architect/services/selection-preview";
import { trackArchitectEvent } from "@/domains/architect/analytics";
import { markFirstInteraction } from "@/components/path/analytics";
import { useFlag, useVariant } from "@/lib/live/client";
import type { ExperimentState, FlagState } from "@/lib/live/config";
import { COPY, EXPERIMENTS } from "@/lib/live/registry";
import type { PublicConsensus } from "@/domains/consensus/public";

/** Live (Admin-managed) nonclinical settings, resolved on the server. */
export interface ArchitectLive {
  catalogVersion: string;
  draftFlag: FlagState;
  ledgerFlag: FlagState;
  draftCta: ExperimentState;
  draftTitle: string;
  draftBody: string;
  /** Approved HeyPsych Consensus Scores by product slug (display only; never affects ranking or cost). */
  consensus: Record<string, PublicConsensus>;
}

const LIVE_DEFAULTS: ArchitectLive = {
  catalogVersion: "0",
  consensus: {},
  draftFlag: { enabled: true, rollout: 100 },
  ledgerFlag: { enabled: true, rollout: 100 },
  draftCta: { active: false, variants: EXPERIMENTS[0].variants.map((v) => ({ ...v })) },
  draftTitle: COPY.find((c) => c.key === "architect.draft.title")!.default,
  draftBody: COPY.find((c) => c.key === "architect.draft.body")!.default,
};
import { WorldList } from "./WorldList";
import { usePracticeProject } from "./usePracticeProject";

type ViewMode = "world" | "list";
type Step = "blueprint" | "plan";

export function PracticeArchitect({ live = LIVE_DEFAULTS }: { live?: ArchitectLive }) {
  const draftOn = useFlag(live.draftFlag, "architect.draft-stack");
  const ledgerOn = useFlag(live.ledgerFlag, "architect.plan-ledger");
  const draftCta = useVariant(live.draftCta, "architect-draft-cta");
  const {
    project,
    isHydrated,
    saveStatus,
    saveError,
    recovery,
    dismissRecovery,
    downloadRecoveredOriginal,
    completeOnboarding,
    assignProduct,
    removeProductFromCapabilities,
    extendCoverage,
    recordDecision,
    clearDecision,
    setTaskStatus,
    confirmSuggestions,
    confirmSuggestion,
    acknowledgePrice,
    saveNow,
    reset,
  } = usePracticeProject();

  const { metadataMap, displayMap, isInitialLoading, error } =
    useArchitectProducts(live.catalogVersion);

  const [selectedObjectId, setSelectedObjectId] =
    useState<WorldObjectId | null>(null);
  // The room needs width to be legible; on a phone it would be a postage
  // stamp of unreadable furniture. Narrow screens open on the list, which
  // carries the same state and the same actions, and the office remains one
  // tap away rather than being withheld.
  const [viewMode, setViewMode] = useState<ViewMode>("world");
  const hasChosenView = useRef(false);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const apply = () => {
      if (query.matches && !hasChosenView.current) setViewMode("list");
    };
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const [step, setStep] = useState<Step>("blueprint");
  const [editingProfile, setEditingProfile] = useState(false);
  const recentlyInstalled = useRef<WorldObjectId[]>([]);

  // --- Derived state ------------------------------------------------------
  const fingerprint = useMemo(
    () => (project ? profileToFingerprint(project.profile) : null),
    [project]
  );

  const world = useMemo(
    () => (project ? deriveWorldState(project) : null),
    [project]
  );

  // Costing an assignment against an empty catalog yields "$0 + 1 unpriced",
  // which reads as a real total rather than as a page that has not finished
  // loading. No figure is shown until there is something to price it against.
  const costSummary = useMemo(
    () =>
      project && fingerprint && metadataMap.size > 0
        ? calculateProjectCost(project, fingerprint, metadataMap)
        : null,
    [project, fingerprint, metadataMap]
  );

  const assignedSlugs = useMemo(
    () => project?.assignments.map((a) => a.productSlug) ?? [],
    [project]
  );

  const selectedObject = selectedObjectId
    ? (world?.byId.get(selectedObjectId) ?? null)
    : null;

  // One numbering for the room's markers and the checklist beside it.
  const numbered = useMemo(() => (world ? numberObjects(world) : []), [world]);
  const markerNumbers = useMemo(() => numberById(numbered), [numbered]);
  const [hoveredObjectId, setHoveredObjectId] =
    useState<WorldObjectId | null>(null);

  // For the inspector: which objects each chosen product resolves, so a
  // clinician can see everything an all-in-one tool takes care of.
  const objectNamesByProduct = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const object of world?.objects ?? []) {
      for (const assignment of object.assignments) {
        const names = map.get(assignment.productSlug) ?? [];
        names.push(object.definition.name);
        map.set(assignment.productSlug, names);
      }
    }
    return map;
  }, [world]);

  // Every function that applies to this practice: the capabilities of the
  // objects in the room. Automatic coverage never reaches beyond it.
  const applicableCapabilities = useMemo(
    () =>
      new Set<CapabilityId>(
        world?.objects
          .filter((o) => !o.definition.isExternal)
          .flatMap((o) => o.definition.capabilityIds) ?? []
      ),
    [world]
  );

  // Projects saved before automatic coverage existed: once per project load,
  // let each chosen product fill the open functions it already covers.
  const reconciledProjectId = useRef<string | null>(null);
  useEffect(() => {
    if (!project || !world || metadataMap.size === 0) return;
    if (reconciledProjectId.current === project.id) return;
    reconciledProjectId.current = project.id;
    extendCoverage(reconcileCoverage(project, metadataMap, applicableCapabilities));
  }, [project, world, metadataMap, applicableCapabilities, extendCoverage]);

  // --- Actions ------------------------------------------------------------
  /**
   * What choosing `option` on the selected function does: the assignment and
   * the draft suggestion it replaces. The selection and the inspector's cost
   * preview both use this, so the preview is exactly what the choice does.
   */
  const planSelection = useCallback(
    (option: ProductOption): (SelectionPlan & { additional: CapabilityId[] }) | null => {
      if (!selectedObject || !project) return null;

      // Bind to the capabilities this object represents that the product
      // actually covers. A product never claims coverage it lacks.
      const requested = option.coversRequested.map((c) => c.capabilityId);
      if (requested.length === 0) return null;

      // ...and to the other open functions it handles as a built-in feature,
      // so choosing an all-in-one tool resolves everything it takes care of.
      const additional = gapFillCapabilities({
        project,
        productSlug: option.productSlug,
        metadata: metadataMap.get(option.productSlug),
        applicable: applicableCapabilities,
        claimed: new Set(requested),
      });

      // Replacing a draft suggestion with a different tool is a refinement.
      const replaced = selectedObject.assignments.find((a) => a.suggested && a.productSlug !== option.productSlug);
      return {
        additional,
        replaced: replaced ? { productSlug: replaced.productSlug, capabilityIds: selectedObject.definition.capabilityIds } : null,
        assignment: {
          productSlug: option.productSlug,
          productName: option.productName,
          capabilityIds: [...requested, ...additional],
          source: "selected",
          // The clinician chose it, so it is no longer a "Draft my practice" suggestion.
          suggested: false,
          quotedMonthlyCents: option.cost.minMonthlyCents,
          // An unresolved evidence question stays attached to the choice.
          needsReview: option.uncertainties.length > 0,
          reviewReason: option.uncertainties[0]?.reason,
        },
      };
    },
    [selectedObject, project, metadataMap, applicableCapabilities]
  );

  /** Net change to the whole stack's monthly total if `option` is chosen. */
  const previewSelection = useCallback(
    (option: ProductOption) => {
      const plan = planSelection(option);
      if (!plan || !project || !fingerprint || metadataMap.size === 0) return null;
      return previewSelectionCost(project, plan, fingerprint, metadataMap);
    },
    [planSelection, project, fingerprint, metadataMap]
  );

  const handleSelectProduct = useCallback(
    (option: ProductOption) => {
      const plan = planSelection(option);
      if (!plan || !selectedObject) return;
      const { additional, replaced } = plan;
      trackArchitectEvent(replaced ? "architect_product_replace" : "architect_product_add", {
        productSlug: option.productSlug,
        previousProductSlug: replaced?.productSlug,
        capabilityId: option.coversRequested[0]?.capabilityId,
      });
      if (replaced) removeProductFromCapabilities(replaced.productSlug, replaced.capabilityIds);

      assignProduct(plan.assignment);

      // Every object this choice resolves plays the install animation.
      recentlyInstalled.current = [
        selectedObject.definition.objectId,
        ...(world?.objects
          .filter(
            (o) =>
              o.definition.objectId !== selectedObject.definition.objectId &&
              o.state === "unconfigured" &&
              o.definition.capabilityIds.some((id) => additional.includes(id))
          )
          .map((o) => o.definition.objectId) ?? []),
      ];
    },
    [planSelection, selectedObject, assignProduct, removeProductFromCapabilities, world]
  );

  // Removing a product from an object removes it from that object's
  // functions only. A product that also covers other parts of the practice
  // stays there.
  const handleRemoveProduct = useCallback(
    (productSlug: string) => {
      if (!selectedObject) return;
      removeProductFromCapabilities(productSlug, selectedObject.definition.capabilityIds);
    },
    [selectedObject, removeProductFromCapabilities]
  );

  const handleMarkHandledElsewhere = useCallback(() => {
    if (!selectedObject) return;
    const { definition } = selectedObject;
    const targets = definition.isExternal
      ? [definition.objectId as unknown as never]
      : definition.capabilityIds;

    for (const capabilityId of targets) {
      recordDecision({ capabilityId, decision: "handled-elsewhere" });
    }
  }, [selectedObject, recordDecision]);

  const handleMarkNotNeeded = useCallback(() => {
    if (!selectedObject) return;
    const { definition } = selectedObject;
    const targets = definition.isExternal
      ? [definition.objectId as unknown as never]
      : definition.capabilityIds;

    for (const capabilityId of targets) {
      recordDecision({ capabilityId, decision: "not-needed" });
    }
  }, [selectedObject, recordDecision]);

  const handleClearDecision = useCallback(() => {
    if (!selectedObject) return;
    const { definition } = selectedObject;
    const targets = definition.isExternal
      ? [definition.objectId as unknown as never]
      : definition.capabilityIds;

    for (const capabilityId of targets) clearDecision(capabilityId);
  }, [selectedObject, clearDecision]);

  // Funnel: started, returning visit, plan completed. Counts only.
  const funnelSent = useRef<{ started?: boolean; visit?: boolean; complete?: string }>({});
  useEffect(() => {
    if (!isHydrated || !project) return;
    if (!project.onboardingComplete && !funnelSent.current.started) {
      funnelSent.current.started = true;
      trackArchitectEvent("architect_fingerprint_start", { source: "practice-architect" });
    }
    if (project.onboardingComplete && !funnelSent.current.visit) {
      funnelSent.current.visit = true;
      try {
        const today = new Date().toISOString().slice(0, 10);
        const last = window.localStorage.getItem("hp:architect-visit");
        window.localStorage.setItem("hp:architect-visit", today);
        if (last && last !== today) {
          const days = Math.round((Date.parse(today) - Date.parse(last)) / 86_400_000);
          const bucket = days <= 1 ? "1" : days <= 7 ? "2-7" : days <= 30 ? "8-30" : "31+";
          trackArchitectEvent("architect_stack_load", { source: `return:${bucket}`, productsCount: project.assignments.length });
        }
      } catch {
        // storage unavailable
      }
    }
  }, [isHydrated, project]);
  useEffect(() => {
    if (!world || !project || !world.isComplete || funnelSent.current.complete === project.id) return;
    funnelSent.current.complete = project.id;
    trackArchitectEvent("architect_blueprint_complete", { productsCount: project.assignments.length, blueprintReadyPercent: 100 });
  }, [world, project]);

  // Draft my practice: the engines' best eligible pick for every function
  // the practice needs, placed as suggestions the clinician can change.
  const [draftNote, setDraftNote] = useState<string | null>(null);
  const draftable = useMemo(() => {
    if (!project || !fingerprint || metadataMap.size === 0) return 0;
    const products = [...metadataMap.entries()].map(([slug, metadata]) => ({ metadata, name: displayMap.get(slug)?.name ?? slug }));
    return draftPracticeStack({ project, fingerprint, products }).picks.length;
  }, [project, fingerprint, metadataMap, displayMap]);
  const handleDraft = useCallback(() => {
    if (!project || !fingerprint || metadataMap.size === 0) return;
    const products = [...metadataMap.entries()].map(([slug, metadata]) => ({
      metadata,
      name: displayMap.get(slug)?.name ?? slug,
      tagline: displayMap.get(slug)?.tagline,
    }));
    const draft = draftPracticeStack({ project, fingerprint, products });
    markFirstInteraction("architect");
    for (const pick of draft.picks) assignProduct(pick.assignment);
    recentlyInstalled.current = world?.objects
      .filter((o) => o.state === "unconfigured")
      .map((o) => o.definition.objectId) ?? [];
    const tools = new Set(draft.picks.map((p) => p.assignment.productSlug)).size;
    setDraftNote(
      draft.picks.length === 0
        ? "Nothing in the catalog fits the open functions yet. Choose them one by one."
        : `Drafted with ${tools} ${tools === 1 ? "tool" : "tools"}. Every choice is a suggestion: open any function to compare alternatives.${
            draft.leftOpen.length ? ` Left for you: ${draft.leftOpen.map((l) => l.objectName.toLowerCase()).join(", ")}.` : ""
          }`
    );
    trackArchitectEvent("architect_blueprint_generated", { mode: "build-for-me", productsCount: tools, source: draftCta.id });
  }, [project, fingerprint, metadataMap, displayMap, assignProduct, world, draftCta.id]);

  // --- Render -------------------------------------------------------------

  // Until storage has been read, render a stable shell. Nothing time- or
  // random-dependent is evaluated during render, so server and client agree.
  if (!isHydrated || !project || !world || !fingerprint) {
    return <ArchitectSkeleton />;
  }

  if (!project.onboardingComplete || editingProfile) {
    return (
      <PracticeOnboarding
        initialProfile={project.profile}
        onComplete={(profile) => {
          completeOnboarding(profile);
          setEditingProfile(false);
        }}
      />
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-canvas">
      {/* Header ------------------------------------------------------- */}
      <header className="sticky top-16 z-30 border-b border-separator bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-5 gap-y-2 px-5 py-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-label-primary">
              {project.name}
            </h1>
            <p className="text-xs text-label-tertiary">
              {world.resolvedCount} of {world.applicableCount} decisions made
              {costSummary && costSummary.lines.length > 0 && (
                <> · {formatProjectCost(costSummary)}</>
              )}
            </p>
          </div>

          {/* The two remaining steps of the journey. Step one, the profile,
              is behind "Practice details" because it is revisited rather
              than worked through again. */}
          <nav
            aria-label="Practice Architect steps"
            className="flex rounded-lg bg-fill-quaternary p-0.5"
          >
            {(
              [
                ["blueprint", "Your blueprint"],
                ["plan", "Your setup plan"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setStep(id)}
                aria-current={step === id ? "step" : undefined}
                className={`rounded-[7px] px-3 py-1.5 text-xs font-medium transition-colors ${
                  step === id
                    ? "bg-surface text-label-primary shadow-sm"
                    : "text-label-secondary hover:text-label-primary"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            {draftOn && draftable > 0 && project.assignments.length > 0 && (
              <HeaderButton onClick={handleDraft} icon={<Sparkles className="h-3.5 w-3.5" />}>
                Draft the rest
              </HeaderButton>
            )}
            <HeaderButton
              onClick={() => setEditingProfile(true)}
              icon={<Pencil className="h-3.5 w-3.5" />}
            >
              Practice details
            </HeaderButton>

            {step === "blueprint" && (
              <HeaderButton
                onClick={() => {
                  hasChosenView.current = true;
                  setViewMode((m) => (m === "world" ? "list" : "world"));
                }}
                icon={
                  viewMode === "world" ? (
                    <LayoutGrid className="h-3.5 w-3.5" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5" />
                  )
                }
              >
                {viewMode === "world" ? "List view" : "Office view"}
              </HeaderButton>
            )}

            <HeaderButton
              onClick={saveNow}
              icon={
                saveStatus === "saving" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )
              }
            >
              {saveStatus === "saved"
                ? "Saved"
                : saveStatus === "error"
                  ? "Save failed"
                  : "Save"}
            </HeaderButton>

            <HeaderButton
              onClick={() => {
                if (
                  window.confirm(
                    "Start over? This clears your practice and every tool you have chosen."
                  )
                ) {
                  reset();
                  setSelectedObjectId(null);
                }
              }}
              icon={<RotateCcw className="h-3.5 w-3.5" />}
            >
              Start over
            </HeaderButton>
          </div>
        </div>

        {saveStatus === "error" && saveError && (
          <p
            role="alert"
            className="border-t border-separator bg-negative/5 px-5 py-1.5 text-xs text-negative"
          >
            {saveError}
          </p>
        )}

        {recovery && (
          <div
            role="status"
            className="flex flex-wrap items-center justify-between gap-3 border-t border-separator bg-amber-50 px-5 py-2 text-xs text-amber-900"
          >
            <p className="min-w-0 flex-1">{recovery.message}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={downloadRecoveredOriginal}
                className="rounded-md border border-amber-300 bg-white px-2 py-1 font-medium text-amber-900"
              >
                Download original
              </button>
              <button
                onClick={dismissRecovery}
                className="rounded-md px-2 py-1 font-medium text-amber-800 hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Body --------------------------------------------------------- */}
      <div className="flex-1">
        {error && (
          <p
            role="alert"
            className="mx-auto max-w-[1600px] px-5 pt-4 text-sm text-negative"
          >
            We could not load the tool catalogue. Your practice is saved; try
            reloading the page.
          </p>
        )}

        {step === "plan" ? (
          <SetupPlan
            project={project}
            world={world}
            cost={costSummary}
            displayMap={displayMap}
            onSetTaskStatus={setTaskStatus}
          />
        ) : viewMode === "world" ? (
          <div className="mx-auto grid w-full max-w-[1600px] gap-5 px-2 py-4 sm:px-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <div>
              {world.resolvedCount === 0 ? (
                draftOn && <DraftBanner disabled={metadataMap.size === 0} onDraft={handleDraft} title={live.draftTitle} body={live.draftBody} cta={draftCta.value} />
              ) : (
                draftNote && (
                  <p role="status" className="mb-3 rounded-xl bg-accent-tint px-4 py-2.5 text-[14px] text-label-primary">
                    {draftNote}
                  </p>
                )
              )}
              {/* The room is framed to the viewport, so the whole practice is
                  visible at once. Scrolling to find your own office defeats
                  the point of showing it as a room. */}
              <div className="mx-auto aspect-[16/10] w-full max-w-[calc((100vh-13rem)*1.6)] overflow-hidden rounded-2xl border border-separator bg-canvas">
                <PracticeScene
                  world={world}
                  selectedObjectId={selectedObjectId}
                  onSelectObject={setSelectedObjectId}
                  recentlyInstalled={recentlyInstalled.current}
                  markerNumbers={markerNumbers}
                  hoveredObjectId={hoveredObjectId}
                  onHoverObject={setHoveredObjectId}
                />
              </div>
            </div>

            <div className="space-y-4">
            {ledgerOn && (
              <PlanLedger
                project={project}
                world={world}
                cost={costSummary}
                onSelectObject={setSelectedObjectId}
                onOpenPlan={() => setStep("plan")}
                onConfirmSuggestions={confirmSuggestions}
                displayMap={displayMap}
                onAcknowledgePrice={acknowledgePrice}
              />
            )}
            <PracticeChecklist
              world={world}
              numbered={numbered}
              selectedObjectId={selectedObjectId}
              hoveredObjectId={hoveredObjectId}
              onSelectObject={setSelectedObjectId}
              onHoverObject={setHoveredObjectId}
            />
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-[1600px] space-y-4 px-2 pt-4 sm:px-5">
            {world.resolvedCount === 0 ? (
              draftOn && <DraftBanner disabled={metadataMap.size === 0} onDraft={handleDraft} title={live.draftTitle} body={live.draftBody} cta={draftCta.value} />
            ) : ledgerOn && (
              <PlanLedger
                project={project}
                world={world}
                cost={costSummary}
                onSelectObject={setSelectedObjectId}
                onOpenPlan={() => setStep("plan")}
                onConfirmSuggestions={confirmSuggestions}
                displayMap={displayMap}
                onAcknowledgePrice={acknowledgePrice}
              />
            )}
          </div>
        )}
        {step === "blueprint" && viewMode === "list" && (
          <WorldList
            world={world}
            selectedObjectId={selectedObjectId}
            onSelectObject={setSelectedObjectId}
          />
        )}
      </div>

      <ObjectInspector
        object={step === "blueprint" ? selectedObject : null}
        fingerprint={fingerprint}
        metadataMap={metadataMap}
        displayMap={displayMap}
        consensus={live.consensus}
        isLoadingProducts={isInitialLoading}
        assignedSlugs={assignedSlugs}
        onClose={() => setSelectedObjectId(null)}
        onSelectProduct={handleSelectProduct}
        previewSelection={previewSelection}
        onRemoveProduct={handleRemoveProduct}
        objectNamesByProduct={objectNamesByProduct}
        onMarkHandledElsewhere={handleMarkHandledElsewhere}
        onMarkNotNeeded={handleMarkNotNeeded}
        onClearDecision={handleClearDecision}
        onKeepSuggestion={(slug) => {
          confirmSuggestion(slug);
          trackArchitectEvent("architect_recommendation_accepted", { productSlug: slug, recommendationType: "primary" });
        }}
      />
    </div>
  );
}

// ============================================================================
// PIECES
// ============================================================================

function HeaderButton({
  onClick,
  icon,
  children,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg border border-separator bg-surface px-2.5 py-1.5 text-xs font-medium text-label-secondary transition-colors hover:bg-fill-quaternary"
    >
      {icon}
      {children}
    </button>
  );
}

function DraftBanner({ onDraft, disabled, title, body, cta }: { onDraft: () => void; disabled: boolean; title: string; body: string; cta: string }) {
  return (
    <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-separator bg-surface p-4 shadow-card-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-[16px] font-semibold text-label-primary">{title}</p>
        <p className="mt-0.5 text-[14px] text-label-secondary">{body}</p>
      </div>
      <button
        type="button"
        onClick={onDraft}
        disabled={disabled}
        className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-label-primary px-5 text-[15px] font-medium text-white transition-colors hover:bg-accent disabled:opacity-40"
      >
        <Sparkles className="h-4 w-4" />
        {disabled ? "Loading tools…" : cta}
      </button>
    </div>
  );
}

function ArchitectSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-5 py-6">
      {/* The server renders only this skeleton (see hydration note above),
          so it carries the page's heading for crawlers and screen readers.
          The onboarding or office replaces it once storage has been read. */}
      <h1 className="sr-only">Practice Architect: design your mental health practice</h1>
      <div className="h-8 w-56 animate-pulse rounded-lg bg-fill-quaternary" />
      <div className="mt-4 aspect-[16/10] w-full animate-pulse rounded-2xl bg-fill-quaternary" />
    </div>
  );
}
