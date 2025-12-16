# Phase B: Deep Vibe Code Audit Report
**Date**: November 26, 2025  
**Auditor**: Senior Engineering Team  
**Status**: AUDIT IN PROGRESS

---

## Executive Summary

This audit examines the HeyPsych codebase for "vibe coding" artifacts - code patterns that work superficially but harbor latent bugs, performance issues, or maintainability problems.

---

## 1. `as any` Type Safety Violations

**Total Found**: 82 instances across 40 files

### Critical Files Requiring Fixes:

| File | Count | Risk Level |
|------|-------|------------|
| `src/lib/data/entity-service.ts` | 3 | HIGH |
| `src/lib/hooks/use-entities.ts` | 4 | MEDIUM |
| `src/lib/assessments/engines.ts` | 5 | MEDIUM |
| `src/components/blocks/articles-blogs-hub/index.tsx` | 11 | LOW |
| `src/components/blocks/support-community-hub/index.tsx` | 7 | LOW |

### Action Required:
- Create proper type definitions for all untyped data
- Replace `as any` with proper type guards
- Add runtime validation where needed

---

## 2. Entity Type Detection Duplication

**Finding**: Entity type detection logic is well-consolidated in `src/lib/utils/entity-type.ts`

**Files Using Consolidated Utility** ✅:
- `src/lib/seo/metadata-factory.ts`
- `src/lib/seo/schema-factory.ts`
- `src/lib/seo/metrics-collector.ts`
- `src/lib/utils/link-parser.ts`
- `src/lib/linking/content-enhancer.ts`

**Files Still Using Direct Property Access** ⚠️:
- `src/lib/seo/schema-builders/breadcrumb.ts`
- `src/lib/seo/schema-builders/faq.ts`
- `src/lib/seo/schema-builders/medical-webpage.ts`
- `src/lib/linking/link-engine.ts`
- `src/lib/linking/registry.ts`

### Recommendation:
Update schema builders to use `getEntityType()` utility

---

## 3. Generic Word Blacklist

**Finding**: Blacklist is consolidated in `src/lib/linking/utils.ts` ✅

**Coverage**: Comprehensive with 100+ terms including:
- Medical terms
- Drug class names
- Formulation patterns
- Generic phrases

**No Duplicates Found** ✅

---

## 4. Editorial Metadata Resolution

**Finding**: EditorialService exists with static data ✅

**Current Flow**:
1. JSON has `medicalReviewerIds: ["john-lee-md"]`
2. `entity-mappers.ts` calls `EditorialService.getFirstReviewer()`
3. Full `MedicalReviewerInfo` object is populated on `entity.editorial.medicalReviewer`

**Gap Identified**:
- Static data only includes 6 reviewers
- Need to sync with actual `/data/editorial/reviewers/` directory

---

## 5. Database Query Performance

**Caching Status** ✅:
- `getAllTreatments()` - Cached with 5-min TTL
- `getBySchemaType()` - Cached with 5-min TTL
- `getByEntityType()` - Cached for conditions/resources
- Entity validation - In-memory cache with 1-min TTL

**Query Optimizations Applied** ✅:
- Changed `IN (35 types)` to `NOT IN (3 types)`
- Added query limits (500-800)
- Added batch delays in sync script

---

## 6. Client/Server Boundary

**Files Using fs/path**:
| File | Pattern | Status |
|------|---------|--------|
| `src/lib/data/entity-service.ts` | `eval('require')` | ✅ Safe |
| `src/lib/content.ts` | Direct import | ⚠️ Check |
| `src/app/about/medical-review-board/page.tsx` | Direct import | ✅ Server Component |

---

## 7. Silent Error Handling

**Finding**: No empty catch blocks found ✅

**Pattern Search**: `catch.*\{[\s\n]*\}` returned 0 matches

---

## 8. JSON-LD Encoding

**Finding**: Single `JSON.stringify` usage ✅

No double-encoding patterns detected.

---

## Vibe Code Issues to Fix

### Issue 1: Untyped Assessment Engine
**File**: `src/lib/assessments/engines.ts`
**Lines**: Multiple
**Problem**: Heavy use of `any` types
**Risk**: Runtime errors, incorrect scoring

### Issue 2: Hub Components Type Safety
**Files**: `src/components/blocks/*-hub/index.tsx`
**Problem**: 30+ `as any` casts across hub components
**Risk**: Incorrect data rendering, silent failures

### Issue 3: Schema Builders Direct Type Access
**Files**: `src/lib/seo/schema-builders/*.ts`
**Problem**: Direct `entity.type` access instead of utility
**Risk**: Type detection inconsistency

---

## Next Steps

1. Fix all `as any` casts in critical files
2. Update schema builders to use entity type utility
3. Create Playwright E2E tests
4. Add Schema validation CI gate
5. Final production build validation

