# Phase 1 — Architect Behavioral Audit Report

**Audit Date:** 2026-09-02
**Auditor:** Automated exploration
**Base Commit:** `e1ebb5bf1260947954e94bd63b3a16f6f4c23348`

## Executive Summary

The Practice Architect implementation has **5 modes** across **2 workspace implementations** with **2 canvas types**. Critical findings:

1. **Silent fingerprint defaults** - Only 1 question asked, but 6+ fields auto-populated
2. **Duplicate implementations** - ArchitectWorkspace vs MyPractice serve overlapping purposes
3. **Coming Soon modes are fully implemented** - Build for Me and Audit disabled by UI flag only
4. **Publication gate is secure** - Properly enforces V4 publishable-only products

## 1. Mode Inventory

| Mode | Route | Status | Entry Points | Implementation |
|------|-------|--------|--------------|----------------|
| Build for Me | `/architect/my-practice` | `comingSoon: true` | Landing card | MyPractice.tsx |
| Build Myself | `/architect/my-practice?skip=1` | Active, Primary | Landing card | MyPractice.tsx |
| Audit | `/architect/audit` | `comingSoon: true` | Landing card | ArchitectWorkspace.tsx |
| Demo | `/architect/demo` | Active | Footer link | MyPractice.tsx |
| Build (legacy) | `/architect/build` | Active | Direct nav only | ArchitectWorkspace.tsx |

### Mode Routes Detail

```
/architect                     Gateway page (3 mode cards)
/architect/my-practice         Build for Me (with SmartOnboarding)
/architect/my-practice?skip=1  Build Myself (skip onboarding)
/architect/audit               Audit My Stack
/architect/demo                Interactive Demo
/architect/build               Legacy Build (FingerprintWizard)
```

## 2. Critical Finding: Silent Fingerprint Defaults

### Questions Asked vs Fields Required

**SmartOnboarding (Build for Me) asks 1 question:**
- "What do you do?" → clinician type (therapy/prescribing/both)

**But requires 6+ fingerprint fields:**

| Field | Source | User Asked? |
|-------|--------|-------------|
| `clinicalRoles` | Derived from question | Yes |
| `prescribingLevel` | Derived from question | Yes |
| `practiceType` | **SILENTLY DEFAULTED** | No |
| `sizeBucket` | **SILENTLY DEFAULTED** to "solo" | No |
| `primaryPayerType` | **SILENTLY DEFAULTED** to "mixed" | No |
| `deliveryModel` | **SILENTLY DEFAULTED** to "hybrid" | No |
| `priorities` | **SILENTLY DEFAULTED** (3 items) | No |

### Default Values Applied

From `SmartOnboarding.tsx` lines 64-84:

```typescript
// Practice type derived from clinician type
practiceType: type === "therapy"
  ? "therapy-group"
  : type === "meds"
    ? "psychiatry"
    : "therapy-plus-psychiatry"

// Size bucket - defaults to solo if not set
sizeBucket: fingerprint.sizeBucket || "solo"

// Payer type - defaults to mixed if not set
primaryPayerType: fingerprint.primaryPayerType || "mixed"

// Delivery model - defaults to hybrid if not set
deliveryModel: fingerprint.deliveryModel || "hybrid"

// Priorities - 3 defaults based on clinician type
// Therapy: ["ease-of-use", "clinical-workflow", "low-cost"]
// Prescribing: ["clinical-workflow", "billing-collections", "ease-of-use"]
// Both: ["clinical-workflow", "ease-of-use", "billing-collections"]
```

### Impact

Users receive "personalized" recommendations based largely on assumptions they never validated. A solo cash-pay therapist and a 50-clinician mixed-payer practice would get identical recommendations if they both select "Therapy".

## 3. Duplicate Implementations

### ArchitectWorkspace vs MyPractice

| Aspect | ArchitectWorkspace | MyPractice |
|--------|-------------------|------------|
| File | `_components/ArchitectWorkspace.tsx` | `_components/MyPractice.tsx` |
| Size | 31KB (912 lines) | 30KB (969 lines) |
| Canvas | StackCanvas (lifecycle stages) | PracticeCanvas (spatial areas) |
| Sidebar | 3-pane (nav/canvas/health) | Flexible (canvas-centric) |
| Onboarding | FingerprintWizard (full) | SmartOnboarding (1 question) |
| Products | ShortlistPane | ProductDrawer (modal) |
| Mobile | Limited | Full sheets/overlays |
| Used By | Audit, Build (legacy) | Build for Me, Build Myself, Demo |

### Canvas Implementations

**StackCanvas.tsx** (15KB)
- Displays products by lifecycle stage
- 6 stages: attract → retain
- Used by ArchitectWorkspace

**PracticeCanvas.tsx** (30KB)
- Displays products by practice areas (6 visual areas)
- Spatial/visual layout
- Used by MyPractice

## 4. Fingerprint Validation Requirements

### `hasBuildForMeRequirements()` (fingerprint.ts:314-323)

```typescript
export function hasBuildForMeRequirements(fp: PracticeFingerprint): boolean {
  return !!(
    fp.practiceType &&
    fp.sizeBucket &&
    fp.primaryPayerType &&
    fp.prescribingLevel &&
    fp.deliveryModel &&
    fp.priorities.length >= 3
  );
}
```

All 6 fields are required for recommendations, but only 1-2 are actually asked.

### `hasAuditRequirements()` (fingerprint.ts:328-335)

```typescript
export function hasAuditRequirements(fp: PracticeFingerprint): boolean {
  return !!(
    fp.practiceType &&
    fp.sizeBucket &&
    fp.primaryPayerType &&
    fp.prescribingLevel
  );
}
```

4 fields required, 0 asked in audit mode.

## 5. Publication Gate Status

**Location:** `architect-product-service.ts:85-106`

The publication gate is correctly implemented:

1. Calls `ClinicianToolService.loadClinicianTools()` - publishable only
2. Never calls `loadAllToolsIncludingDrafts()`
3. Test coverage in `architect-publication-gate.test.ts`
4. API caching with 5-min TTL in production

**Status: SECURE** - No changes needed.

## 6. V4 Product Adapter

**Location:** `v4-product-adapter.ts`

Derives `ProductArchitectureMetadata` from `ClinicianToolV4` when explicit metadata unavailable.

Key derivations:
- Practice settings → practice type
- Organization size → size buckets
- Clinician roles → clinical roles
- Primary category → core capabilities

**Status: FUNCTIONAL** - Enables fallback capability derivation.

## 7. Hard Policy Audit

The implementation document requires defining hard policies for:

| Policy Area | Current State | Action Needed |
|-------------|--------------|---------------|
| Practice type | Derived from 1 question | Should be asked explicitly |
| Role/license | Asked via clinician type | Adequate but could be refined |
| State | NOT asked | Should be asked for licensing/compliance |
| Prescribing | Asked (therapy/meds/both) | Adequate |
| EPCS | NOT asked | Should be asked for prescriber journeys |
| Payer model | Silently defaulted to "mixed" | Should be asked |
| Lifecycle | NOT asked | Should be asked or surfaced as assumption |
| HIPAA/BAA | NOT asked | Should be asked for compliance clarity |
| Practice size | Silently defaulted to "solo" | Should be asked |

## 8. Recommendations

### Immediate (Phase 1 Slice 1A)

1. **Add explicit questions for silently defaulted fields** or clearly show assumptions
   - Practice size: solo / small (2-10) / medium (11-50) / large
   - Payer model: private pay / insurance-focused / mixed
   - Delivery model: in-person / telehealth / hybrid

2. **Consolidate mode entry points**
   - Make `comingSoon` status clear in implementation docs
   - Either activate Build for Me/Audit or remove from landing page

3. **Add assumption disclosure panel**
   - Show users what defaults were applied
   - Allow one-click refinement

### Deferred (Phase 1 Slice 1B+)

4. **Consolidate workspace implementations**
   - Requires parity tests first
   - Choose one canvas type as primary

5. **Add state/jurisdiction question**
   - Affects licensing requirements
   - Affects compliance recommendations

## 9. Files Requiring Changes

| File | Change Type | Priority |
|------|-------------|----------|
| `SmartOnboarding.tsx` | Add questions or assumption disclosure | HIGH |
| `page.tsx` (gateway) | Reconcile comingSoon status | MEDIUM |
| `fingerprint.ts` | Document default rationale | MEDIUM |
| `FingerprintWizard.tsx` | Align with SmartOnboarding | LOW |

## 10. Test Coverage Gaps

- No golden tests for fingerprint defaults
- No tests verifying recommendations with default vs explicit fingerprints
- No tests for unknown/null field handling

## Conclusion

The Architect implementation is architecturally sound but has transparency issues around fingerprint defaults. Users receive recommendations based on 5+ assumptions they never validated. The immediate remediation should either:

1. **Ask the missing questions**, or
2. **Clearly disclose assumptions** with refinement options

The publication gate and V4 adapter are working correctly and need no changes.
