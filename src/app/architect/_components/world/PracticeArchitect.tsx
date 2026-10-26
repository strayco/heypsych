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
import { WorldList } from "./WorldList";
import { usePracticeProject } from "./usePracticeProject";

type ViewMode = "world" | "list";
type Step = "blueprint" | "plan";

export function PracticeArchitect() {
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
    saveNow,
    reset,
  } = usePracticeProject();

  const { metadataMap, displayMap, isInitialLoading, error } =
    useArchitectProducts();

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
  const handleSelectProduct = useCallback(
    (option: ProductOption) => {
      if (!selectedObject) return;

      // Bind to the capabilities this object represents that the product
      // actually covers. A product never claims coverage it lacks.
      const requested = option.coversRequested.map((c) => c.capabilityId);
      if (requested.length === 0 || !project) return;

      // ...and to the other open functions it handles as a built-in feature,
      // so choosing an all-in-one tool resolves everything it takes care of.
      const additional = gapFillCapabilities({
        project,
        productSlug: option.productSlug,
        metadata: metadataMap.get(option.productSlug),
        applicable: applicableCapabilities,
        claimed: new Set(requested),
      });
      const capabilityIds = [...requested, ...additional];

      assignProduct({
        productSlug: option.productSlug,
        productName: option.productName,
        capabilityIds,
        source: "selected",
        // An unresolved evidence question stays attached to the choice.
        needsReview: option.uncertainties.length > 0,
        reviewReason: option.uncertainties[0]?.reason,
      });

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
    [selectedObject, assignProduct, project, metadataMap, applicableCapabilities, world]
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
            onSetTaskStatus={setTaskStatus}
          />
        ) : viewMode === "world" ? (
          <div className="mx-auto grid w-full max-w-[1600px] gap-5 px-2 py-4 sm:px-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
            <div>
              {world.resolvedCount === 0 && (
                <p className="mb-3 flex items-center gap-2 px-1 text-[14px] text-label-secondary">
                  <span
                    aria-hidden="true"
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white"
                  >
                    1
                  </span>
                  Click a numbered marker to choose a tool for that part of your
                  practice.
                </p>
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

            <PracticeChecklist
              world={world}
              numbered={numbered}
              selectedObjectId={selectedObjectId}
              hoveredObjectId={hoveredObjectId}
              onSelectObject={setSelectedObjectId}
              onHoverObject={setHoveredObjectId}
            />
          </div>
        ) : (
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
        isLoadingProducts={isInitialLoading}
        assignedSlugs={assignedSlugs}
        onClose={() => setSelectedObjectId(null)}
        onSelectProduct={handleSelectProduct}
        onRemoveProduct={handleRemoveProduct}
        objectNamesByProduct={objectNamesByProduct}
        onMarkHandledElsewhere={handleMarkHandledElsewhere}
        onMarkNotNeeded={handleMarkNotNeeded}
        onClearDecision={handleClearDecision}
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
