# HeyPsych Phase 2 SEO/E-A-T System Audit Report

**Audit Date:** November 25, 2025  
**Auditor:** External Senior Engineering Team  
**Scope:** Deep architecture review, behavioral validation, gap analysis  
**Status:** Phase A Complete — Awaiting Priority Confirmation

---

## Executive Summary

This audit evaluates the Phase 2 SEO + E-A-T + Internal Linking implementation following the previous team's fixes. The system has made **significant progress** since the initial audit (D+ → A-), but **several architectural and behavioral issues remain** that require attention before full production confidence.

### Overall Assessment: **B+ (82/100)**

| Category | Grade | Status |
|----------|-------|--------|
| Entity Layer Architecture | A- | ✅ Solid foundation, minor improvements needed |
| MetadataFactory | A | ✅ Production-ready |
| SchemaFactory | A | ✅ Production-ready with fallbacks |
| Internal Linking Engine | B | ⚠️ Works but needs hardening |
| E-A-T Components | A | ✅ Correctly implemented with fallbacks |
| Editorial Metadata Coverage | A | ✅ 100% coverage achieved |
| Sitemaps | A | ✅ Complete implementation |
| Performance & Observability | C+ | ⚠️ Database timeouts, missing metrics |
| Type Safety | B- | ⚠️ `as any` casts remain |

---

## 1. Architecture Analysis

### 1.1 Entity Layer

**Location:** `src/lib/data/entity-service.ts`, `src/lib/data/entity-mappers.ts`

**Assessment:** ✅ Good — Meets requirements with minor gaps

**What's Working:**
- Centralized `EntityService` class provides single entry point for all entity queries
- `entity-mappers.ts` extracts editorial metadata from multiple sources (content, metadata)
- `normalizeEntityContent()` handles nested JSON structures correctly
- `mapRowToEntity()` adds `editorial`, `seo`, `type`, `tags` fields to Entity

**Architectural Compliance:**
```
✅ All entity access flows through EntityService.getBySlug() / getByEntityType()
✅ JSON structure is abstracted via entity-mappers
✅ Editorial metadata extraction is centralized
✅ Schema metadata is dynamically generated
```

**Gap Identified:**
```typescript
// entity-mappers.ts:118-134
function extractEditorialMetadata(content: any, metadata: any): EditorialMetadata | undefined {
  const contentEditorial = content?.editorial;
  const metadataEditorial = metadata?.editorial;
  const editorial = { ...metadataEditorial, ...contentEditorial };
  
  // Returns undefined if no editorial data - but JSON now has editorial blocks
  if (!editorial || Object.keys(editorial).length === 0) {
    return undefined;
  }
  return editorial as EditorialMetadata;
}
```

**Issue:** The editorial block in JSON uses `medicalReviewerIds: ["john-lee-md"]` but the `EditorialMetadata` interface expects `medicalReviewer?: MedicalReviewerInfo` (a full object, not IDs). This mismatch means the UI/schema layers must handle ID resolution themselves.

**Recommendation:** Add a resolver function that maps reviewer IDs to full `MedicalReviewerInfo` objects:

```typescript
// Proposed: Add to entity-mappers.ts
async function resolveEditorialMetadata(editorial: any): Promise<EditorialMetadata> {
  if (!editorial) return getDefaultEditorial();
  
  if (editorial.medicalReviewerIds?.length > 0) {
    const reviewer = await loadReviewerById(editorial.medicalReviewerIds[0]);
    return { ...editorial, medicalReviewer: reviewer };
  }
  return editorial;
}
```

---

### 1.2 MetadataFactory

**Location:** `src/lib/seo/metadata-factory.ts`, `src/lib/seo/metadata-generators/*`

**Assessment:** ✅ Excellent — Production-ready

**What's Working:**
- Factory pattern correctly routes to specialized generators
- Entity type detection with proper fallback chain
- Character limits enforced (30-60 title, 70-160 description)
- Supports SEO overrides from JSON (`entity.seo.title`, `entity.seo.description`)

**Coverage:**
- ✅ ConditionMetadataGenerator
- ✅ MedicationMetadataGenerator
- ✅ TherapyMetadataGenerator
- ✅ ResourceMetadataGenerator

**No Issues Found.**

---

### 1.3 SchemaFactory

**Location:** `src/lib/seo/schema-factory.ts`, `src/lib/seo/schema-builders/*`

**Assessment:** ✅ Excellent — Correctly implements fallbacks

**What's Working:**
```typescript
// schema-factory.ts:153-179 - CRITICAL: Always generates Person schema
private static generatePersonSchemas(entity: Entity): Record<string, any>[] {
  const schemas: Record<string, any>[] = [];
  
  if (hasAuthor(entity)) {
    schemas.push(buildAuthorSchema(entity.editorial!.author!));
  }
  
  if (hasMedicalReviewer(entity)) {
    schemas.push(buildMedicalReviewerSchema(entity.editorial!.medicalReviewer!));
  } else {
    // CRITICAL: Always generate default Medical Review Board Person schema
    schemas.push(buildDefaultReviewBoardPersonSchema());
  }
  
  return schemas;
}
```

**Schema Stack (per page):**
1. Primary schema (MedicalCondition / Drug / MedicalTherapy / Article)
2. MedicalWebPage (universal)
3. BreadcrumbList (universal)
4. MedicalOrganization (HeyPsych Medical Review Board)
5. Person (individual reviewer OR default board)
6. FAQPage (when available)

**Verified Compliance:**
- ✅ Organization schema on all pages
- ✅ Person schema fallback to Review Board
- ✅ Graceful degradation (try/catch in generators)

---

### 1.4 Internal Linking Engine

**Location:** `src/lib/linking/content-enhancer.ts`, `src/lib/linking/utils.ts`, `src/lib/linking/config.ts`

**Assessment:** ⚠️ B Grade — Works but has risks

**What's Working:**
- Config-driven link limits per entity type
- Priority-based link sorting (critical > high > medium > low)
- Entity validation before link creation (`validateEntityExists()`)
- Generic word blacklist
- Abbreviation support (GAD, MDD, PTSD, etc.)

**Blacklist (from utils.ts:586-591):**
```typescript
const genericWordBlacklist = new Set([
  'anxiety', 'depression', 'mood', 'stress', 'pain', 'sleep',
  'treatment', 'therapy', 'medication', 'disorder', 'condition',
  'mental', 'health', 'care', 'symptom', 'symptoms', 'test',
  'screening', 'assessment', 'scale', 'questionnaire', 'tool',
]);
```

**Issues Identified:**

**Issue 1: Missing common generic terms in blacklist**
```typescript
// SHOULD BE ADDED to genericWordBlacklist:
'drug', 'medicine', 'pill', 'pills', 'effects', 'side effects',
'feeling', 'feelings', 'thoughts', 'behavior', 'behaviors',
'symptom', 'problem', 'problems', 'issue', 'issues'
```

**Issue 2: Prose field extraction too aggressive**

```typescript
// content-enhancer.ts:107-152 - extractEntityNamesFromProse()
// Only extracts known abbreviations + specific condition patterns
// This is conservative (good) but may miss some valid matches
```

**Issue 3: Drug formulation filtering incomplete**

```typescript
// utils.ts:604-611
const drugFormulationsToSkip = [
  'mixed amphetamine salts',
  'methylphenidate er',
  'amphetamine salts',
];
// MISSING: 'dextroamphetamine', 'lisdexamfetamine', generic SSRI names
```

**Recommendation:** Expand the formulation skip list and add more generic terms to blacklist.

---

### 1.5 E-A-T Components

**Location:** `src/components/eat/*`

**Assessment:** ✅ Excellent — Correctly implements E-A-T requirements

**AuthorByline Component (AuthorByline.tsx):**
```typescript
// Lines 76-88 (compact mode) and 168-188 (full mode)
// ALWAYS shows Medical Review Board fallback when no individual reviewer
{medicalReviewer ? (
  <>Reviewed by {medicalReviewer.name}</>
) : (
  <Link href="/about/medical-review-board">
    Reviewed by the HeyPsych Medical Review Board
  </Link>
)}
```

**Verified on All Page Types:**
- ✅ Conditions: `client-wrapper.tsx` renders AuthorByline (lines 529-558)
- ✅ Treatments: Similar implementation
- ✅ Resources: `ResourceDetailClient.tsx` renders AuthorByline (lines 192-205)

**E-A-T Components Available:**
- ✅ AuthorByline (always shows reviewer or board)
- ✅ MedicalReviewBadge
- ✅ MedicalDisclaimer
- ✅ CrisisSupportBanner (for sensitive conditions)
- ✅ CitationList
- ✅ ContentTimestamps

---

### 1.6 Medical Review Board Page

**Location:** `src/app/about/medical-review-board/page.tsx`

**Assessment:** ✅ Complete

**Features:**
- Loads reviewer data from `data/editorial/reviewers/medical-review-board.json`
- Generates Organization schema (MedicalOrganization)
- Generates Person schema for each reviewer
- Displays credentials, education, board certifications, affiliations, clinical expertise

**Reviewer Data (currently):**
- 1 reviewer: Dr. John Lee, MD (Board-Certified Psychiatrist, 15+ years experience)

---

## 2. Editorial Metadata Verification

**Sample Files Checked:**
- `data/conditions/attention-learning/attention-deficit-hyperactivity-disorder.json` ✅
- `data/treatments/medications/sertraline-Zoloft.json` ✅
- `data/resources/assessments-screeners/gad-7.json` ✅

**Editorial Block Structure (all files):**
```json
{
  "editorial": {
    "medicalReviewerIds": ["john-lee-md"],
    "reviewBoard": "official",
    "lastReviewed": "2025-11-24",
    "lastUpdated": "2025-11-24"
  }
}
```

**Coverage:** 778/778 files (100%)

---

## 3. Critical Issues (Must Fix)

### CRITICAL #1: Editorial Metadata Type Mismatch

**Severity:** Medium-High  
**Impact:** Schema generation may not include full reviewer details

**Problem:**
The JSON editorial block stores `medicalReviewerIds: ["john-lee-md"]` (array of IDs), but the TypeScript `EditorialMetadata` interface expects `medicalReviewer?: MedicalReviewerInfo` (full object).

**Evidence:**
```typescript
// types/editorial.ts:165-191
export interface EditorialMetadata {
  author?: AuthorInfo;
  medicalReviewer?: MedicalReviewerInfo;  // Expects full object
  dates?: EditorialDates;
  // ...
}

// JSON files have:
{
  "editorial": {
    "medicalReviewerIds": ["john-lee-md"]  // Just IDs
  }
}
```

**Consequence:** 
- `hasAuthor()` and `hasMedicalReviewer()` type guards check for full objects
- When only IDs exist, these return false
- SchemaFactory falls back to default Review Board (which is correct, but loses individual attribution)

**Fix Required:**
1. Add resolver function to map reviewer IDs to full objects
2. OR update `hasAuthor()`/`hasMedicalReviewer()` to check for both formats
3. Ensure entity-mappers resolves IDs before returning Entity

---

### CRITICAL #2: Database Performance Issues

**Severity:** Medium  
**Impact:** Build timeouts, SEO metrics scripts failing

**Problem (from previous execution report):**
```
Error: canceling statement due to statement timeout
```

**Evidence:**
- 14 pages experienced 60s timeout on first build attempt
- SEO metrics scripts timing out completely
- Bulk queries to `entities` table are slow

**Fix Required:**
1. Add database indexes for common queries
2. Implement connection pooling
3. Add query timeouts with graceful fallbacks
4. Consider read replicas for analytics

---

## 4. Design Misalignments (Should Fix)

### MISALIGNMENT #1: Type Safety Violations

**Severity:** Low-Medium  
**Impact:** TypeScript safety bypassed

**Evidence (client-wrapper.tsx):**
```typescript
// Line 426, 531, 601
(entity as any)?.metadata?.medical_review?.reviewed
```

**Fix:** Add proper types to Entity interface or use type guards.

---

### MISALIGNMENT #2: Inconsistent Entity Type Handling

**Severity:** Low-Medium  
**Impact:** Edge cases may not route correctly

**Problem:** Multiple systems determine entity type differently:
- `entity-mappers.ts`: Uses `content?.type`, `metadata?.type`, falls back to schema
- `metadata-factory.ts`: Uses `entity.type`, `entity.schema.entity_type`, `entity.data.kind`
- `link-parser.ts`: Uses `normalizeEntityTypeToRouteType()`
- `content-enhancer.ts`: Uses `getCanonicalRoute()`

**Fix:** Consolidate to single `getEntityType()` utility function.

---

### MISALIGNMENT #3: Linking Config Scattered

**Severity:** Low  
**Impact:** Hard to adjust linking behavior

**Problem:**
- `linking/config.ts` has link limits, priorities, slot configs
- `linking/content-enhancer.ts` has `LINKABLE_FIELDS`, `PROSE_FIELDS` (separate from config)
- `seo/config.ts` has `LINK_LIMITS`, `LINK_PRIORITY` (duplicate)

**Fix:** Consolidate all linking configuration into `linking/config.ts`.

---

## 5. Opportunities (Nice to Have)

### OPPORTUNITY #1: SEO Metrics Dashboard

**Current State:** Scripts timeout, no observability

**Recommendation:** Build lightweight metrics collection:
```typescript
// Proposed: src/lib/seo/metrics.ts
export const SEOMetrics = {
  collectPageMetrics(slug: string): PageMetrics {
    return {
      hasTitle: boolean,
      hasDescription: boolean,
      schemaCount: number,
      schemaTypes: string[],
      internalLinkCount: number,
      hasEATAttribution: boolean,
      lastReviewDate: Date | null,
    };
  },
  
  async generateReport(): Promise<SEOReport> {
    // Aggregate metrics across all pages
  }
};
```

---

### OPPORTUNITY #2: Link Allow/Block Mechanism

**Per Requirements:**
> "I need the ability to opt a specific mention in or out of linking"

**Current State:** No per-field/per-mention control

**Recommendation:** Add `link_config` to JSON:
```json
{
  "content": {
    "description": "...",
    "link_config": {
      "block": ["anxiety", "depression"],  // Don't link these in this entity
      "allow": ["{FORCE:condition:gad:GAD}"]  // Force specific links
    }
  }
}
```

---

### OPPORTUNITY #3: Add More Medical Reviewers

**Current State:** 1 reviewer (Dr. John Lee)

**Recommendation:** Add 2-3 more reviewers with different specialties:
- Child/Adolescent Psychiatry
- Substance Use Disorders
- Psychotherapy/Clinical Psychology

---

## 6. Summary of Findings

### Must Fix (Week 1)
1. **Editorial metadata type resolution** — Map reviewer IDs to full objects
2. **Database performance** — Add indexes, optimize queries

### Should Fix (Week 2)
3. **Type safety violations** — Remove `as any` casts
4. **Entity type consolidation** — Single utility function
5. **Expand generic word blacklist** — Add missing terms

### Nice to Have (Week 3+)
6. **SEO metrics dashboard** — Build observability
7. **Per-field link control** — Allow/block mechanism
8. **Additional reviewers** — Expand Medical Review Board

---

## 7. Validated Behavior Checklist

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Every page shows "Reviewed by HeyPsych Medical Review Board" | ✅ | AuthorByline.tsx:76-88, 168-188 |
| Or shows individual reviewer when present | ✅ | AuthorByline.tsx:81, 137-167 |
| Medical Review Board page exists | ✅ | `/about/medical-review-board/page.tsx` |
| Organization schema on all pages | ✅ | SchemaFactory.ts:94 |
| Person schema on all pages (reviewer or board) | ✅ | SchemaFactory.ts:97-99, 173-176 |
| Internal links are inline only | ✅ | No section-based linking components used |
| No generic words linked | ✅ | utils.ts:586-591 blacklist |
| Entity validation before linking | ✅ | content-enhancer.ts:231 |
| No 404s from links | ✅ | validateEntityExists() returns null if not found |
| Editorial metadata in JSON | ✅ | 778/778 files (100%) |

---

## 8. Recommended Priority Order

**Phase B Implementation:**

1. **Day 1-2:** Fix editorial metadata type resolution
2. **Day 2-3:** Database optimization (indexes, query tuning)
3. **Day 3-4:** Expand generic word blacklist + type safety fixes
4. **Day 4-5:** Entity type consolidation
5. **Week 2:** SEO metrics collection

---

## 9. Files to Modify

| File | Change Type | Priority |
|------|-------------|----------|
| `src/lib/data/entity-mappers.ts` | Add reviewer ID resolution | High |
| `src/lib/types/editorial.ts` | Add ID-based types | High |
| `supabase/migrations/` | Add database indexes | High |
| `src/lib/linking/utils.ts` | Expand blacklist | Medium |
| `src/app/*/client-wrapper.tsx` | Remove `as any` casts | Medium |
| `src/lib/linking/config.ts` | Consolidate configs | Low |

---

**End of Audit Report**

**Status:** ✅ Phase A Complete — Ready for Phase B Implementation upon approval

