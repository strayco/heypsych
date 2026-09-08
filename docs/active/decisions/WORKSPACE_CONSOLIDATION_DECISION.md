# Workspace Consolidation Decision — ArchitectWorkspace vs MyPractice

**Version:** 1.0
**Created:** 2026-09-02
**Status:** Decision Documented

## Summary

**Decision:** Keep ArchitectWorkspace and MyPractice as separate bounded UI contexts.
Do not consolidate into a single component. Extract shared abstractions incrementally.

## Analysis

### ArchitectWorkspace (912 lines)

Location: `src/app/architect/_components/ArchitectWorkspace.tsx`

**Design Philosophy:**
- Mode-agnostic: Supports build-for-me, build-myself, and audit modes
- Lifecycle-stage organization: Stack building progresses through stages
- Tab-based interface: Recommendations, Selected Stack, Summary
- Minimal visual hierarchy with functional focus

**Key Features:**
- Supports all three Architect modes
- Budget slider controls
- Compatibility warnings between products
- Stack summary with cost breakdown
- Demo mode with fixture data

**State Management:**
- Uses `useArchitectState` hook for global state
- Uses `useArchitectAnalytics` for event tracking
- Mode-specific conditional rendering throughout

### MyPractice (1191 lines)

Location: `src/app/architect/my-practice/_components/MyPractice.tsx`

**Design Philosophy:**
- Spatial practice-area organization: Products grouped by functional area
- Premium UX: Drag-and-drop, visual canvas, category-based layout
- Build-for-me only: Single-purpose, optimized experience
- Rich visual feedback and animations

**Key Features:**
- Category-based canvas layout (EHR, Telehealth, Practice Management, etc.)
- Drag-and-drop product arrangement
- Visual product cards with fit indicators
- Mobile-responsive collapsible sections

**State Management:**
- Uses same `useArchitectState` hook
- Additional local state for drag-drop interactions
- Category-based product grouping logic

### Shared Infrastructure

Both components already share:
- `src/domains/architect/engines/` — recommendation, fit, cost, coverage engines
- `src/domains/architect/schemas/` — fingerprint, product metadata, results
- `src/domains/architect/hooks/useArchitectState.ts` — persistence and state
- `src/domains/architect/adapters/` — V4 product adapter
- `src/domains/architect/analytics/` — event tracking

## Rationale for Separate Contexts

1. **Different Mental Models:**
   - ArchitectWorkspace: Linear decision flow (gather → recommend → select → summarize)
   - MyPractice: Spatial exploration (see entire practice, arrange as desired)

2. **Different Target Users:**
   - ArchitectWorkspace: Users who want guidance (Build for Me, Audit)
   - MyPractice: Users who want to visualize and organize

3. **Mode Requirements:**
   - ArchitectWorkspace must support audit mode (compare existing stack to recommendations)
   - MyPractice is purpose-built for build-for-me visualization

4. **Risk of Consolidation:**
   - A unified component would require extensive mode branching
   - UI paradigm differences would create bloated conditional code
   - Testing complexity would increase significantly
   - Feature velocity would decrease

5. **Current State:**
   - Both work correctly
   - Both use shared engines and schemas
   - Consolidation provides no user-visible benefit

## Recommended Actions

### Do Now

1. **Document as accepted pattern:** Both workspaces are valid bounded contexts for their use cases.

2. **Verify shared abstractions are clean:**
   - Engines remain pure functions
   - State hooks provide consistent interface
   - No domain logic duplicated in UI components

3. **Add navigation clarity:** Ensure users understand which experience they're entering.

### Extract Later (Phase 5)

When proven shared patterns emerge, extract:

| Abstraction | Location | Benefit |
|-------------|----------|---------|
| Product card component | New shared component | Consistent product display |
| Fit indicator badges | New shared component | Consistent fit visualization |
| Cost breakdown view | New shared component | Consistent cost display |
| Stack summary logic | Shared hook or util | Consistent totals/warnings |

### Do Not Do

- Do not create a generic "workspace" component with mode switches
- Do not merge the drag-drop canvas into the tabbed interface
- Do not add audit mode to MyPractice
- Do not add spatial canvas to ArchitectWorkspace

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Shared Domain Layer                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌───────────┐ │
│  │   Engines   │ │   Schemas   │ │   Adapters  │ │  Hooks    │ │
│  │ recommend   │ │ fingerprint │ │ v4-adapter  │ │ useState  │ │
│  │ fit/cost    │ │ product     │ │             │ │ analytics │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └───────────┘ │
└─────────────────────────────────────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          │                                  │
          ▼                                  ▼
┌─────────────────────┐          ┌─────────────────────┐
│  ArchitectWorkspace │          │     MyPractice      │
│                     │          │                     │
│  • Lifecycle stages │          │  • Spatial canvas   │
│  • Tab navigation   │          │  • Drag-and-drop    │
│  • All three modes  │          │  • Build-for-me     │
│  • Functional UX    │          │  • Premium UX       │
└─────────────────────┘          └─────────────────────┘
          │                                  │
          ▼                                  ▼
┌─────────────────────┐          ┌─────────────────────┐
│  /architect/*       │          │  /architect/        │
│  (legacy routes)    │          │  my-practice        │
└─────────────────────┘          └─────────────────────┘
```

## Implementation State Update

This decision resolves the drift item: "Two workspace implementations need consolidation plan."

The plan is: **Do not consolidate.** Keep as separate bounded contexts with shared domain layer.

## Acceptance Criteria

- [x] Analysis documented
- [x] Decision recorded with rationale
- [x] Extractable abstractions identified
- [x] Anti-patterns documented
- [ ] Implementation state updated

## References

- Phase 1 spec: "Consolidate duplicate workspace implementations only when parity tests cover existing behavior."
- D-001: "Preserve and harden Architect; do not build a duplicate clinician recommendation engine."
- Architecture analysis: Both workspaces already use the shared engine layer without duplication.
