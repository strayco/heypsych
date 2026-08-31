# Step 8.1: Treatment Consumer Inventory

Generated: 2026-08-21

## Executive Summary

This inventory identifies all runtime and build-time consumers of treatment data.
The goal is to unify all consumers under a single canonical V3 loading pipeline.

**Key Finding:** 4 major consumers bypass the canonical loader and implement their own
slug resolution and file loading logic. These must be migrated to use `treatment-loader.ts`.

## Canonical Loader API

**Location:** `src/lib/comparison/treatment-loader.ts`

**Exports:**
- `loadTreatment(slug)` → `Promise<TreatmentV3 | null>` - Single treatment
- `loadTreatments(slugs)` → `Promise<Map<string, TreatmentV3>>` - Multiple treatments
- `findTreatmentFile(slug)` → `string | null` - File path resolution
- `resolveCanonicalSlug(slug)` → `string` - Alias resolution
- `getAllTreatmentSlugs()` → `string[]` - All canonical slugs
- `buildTreatmentIndex()` → `TreatmentIndexEntry[]` - Lightweight index
- `searchTreatments(query, options)` → `TreatmentIndexEntry[]` - Search
- `generateTreatmentManifest()` → Manifest data for client-side selection

**Key Features:**
- Canonical slug resolution (internal `slug` field, not filename)
- Alias support (filename-derived → canonical)
- Priority-based deduplication (-v2 > plain > -E)
- Legacy file exclusion (.legacy.json)
- Caching for performance
- Returns normalized V3 format

---

## Consumer Classification

### ✅ CATEGORY A: Already Using Canonical Loader

| File | Status | Notes |
|------|--------|-------|
| `src/app/treatments/compare/universal/page.tsx` | ✅ Good | Uses `loadTreatments`, `parseComparisonUrl` |
| `src/app/treatments/compare/universal/treatment-selector.tsx` | ✅ Good | Uses treatment-loader imports |

### ❌ CATEGORY B: Bypassing Canonical Loader (NEEDS MIGRATION)

#### B.1: Treatment Page (`src/app/treatments/[slug]/page.tsx`)

**Current Implementation:**
```typescript
async function loadTreatmentFromJSON(slug: string): Promise<any | null> {
  const categories = ["medications", "therapy", ...];
  for (const category of categories) {
    // Custom slug-v2 prioritization
    // Custom legacy fallback
    // Direct fs.readFileSync
  }
}
```

**Issues:**
- Custom slug resolution (tries `${slug}-v2` first, then exact, then legacy)
- Doesn't use canonical `slug` field from JSON
- Falls back to database (`EntityService.getBySlug`)
- Inconsistent with manifest API

**Migration Path:**
- Replace with `loadTreatment(slug)` from canonical loader
- Handle 404 if not found (no database fallback needed post-V3)

---

#### B.2: Treatment API (`src/app/api/treatments/[slug]/route.ts`)

**Current Implementation:**
```typescript
class DynamicTreatmentLoader {
  static loadTreatment(slug: string): { data: any; category: string } | null
  static getSlugIndex(): Record<string, { category: string; fileName: string }>
  // Case-insensitive slug matching
  // Direct fs operations
}
```

**Issues:**
- Separate `DynamicTreatmentLoader` class with own caching
- Builds its own slug index
- Returns raw JSON (not V3 format)
- Doesn't respect canonical slug field

**Migration Path:**
- Replace `DynamicTreatmentLoader.loadTreatment()` with canonical `loadTreatment()`
- Return V3 format directly
- Can be simplified to 10-15 lines

---

#### B.3: Manifest API (`src/app/api/treatments/manifest/route.ts`)

**Current Implementation:**
```typescript
function buildManifest(): TreatmentManifestEntry[] {
  // Custom directory scanning
  // Custom priority deduplication
  // Custom canonical slug resolution
  // 200+ lines of code
}
```

**Issues:**
- Duplicates all logic from treatment-loader.ts
- 247 lines that could be 20
- Own caching layer

**Migration Path:**
- Replace with `generateTreatmentManifest()` from canonical loader
- Remove entire `buildManifest()` function

---

#### B.4: Programmatic SEO Data Loader (`src/lib/programmatic-seo/data-loader.ts`)

**Current Implementation:**
```typescript
const BRAND_TO_SLUG: Record<string, string> = {
  'lexapro': 'escitalopram-lexapro',
  'zoloft': 'sertraline-zoloft',
  // Hardcoded mapping
};

async function findTreatmentFile(slug: string): Promise<string | null>
export async function loadTreatment(slug: string): Promise<TreatmentData | null>
```

**Issues:**
- Hardcoded brand-to-slug mapping (gets stale)
- Own `findTreatmentFile()` that duplicates canonical loader
- Returns V2 format (`TreatmentData`), not V3
- Name collision with canonical loader's `loadTreatment()`

**Migration Path:**
- Remove `findTreatmentFile()` and `loadTreatment()`
- Import from canonical loader (rename to avoid collision)
- Remove hardcoded `BRAND_TO_SLUG` (canonical loader has alias support)

---

### 🔧 CATEGORY C: Migration Scripts (Intentionally Independent)

These scripts intentionally bypass the canonical loader because they:
1. Need to process ALL files including legacy/draft
2. Need raw JSON for transformation
3. Need to write files

| File | Purpose |
|------|---------|
| `scripts/migrate-treatments-v3.ts` | V2→V3 migration |
| `scripts/canary-migration.ts` | Migration testing |
| `scripts/verify-modality-batch.ts` | Batch verification |
| `scripts/post-write-verification.ts` | Losslessness verification |
| `scripts/full-corpus-verification.ts` | Full validation |
| `scripts/count-reconciliation.ts` | Count tracking |
| `scripts/validate-migration-gates.ts` | Gate validation |
| `scripts/audit-treatments-comprehensive.ts` | Comprehensive audit |
| `scripts/audit-slug-canonicalization.ts` | Slug audit |

**Status:** ✅ No changes needed (intentionally direct access)

---

### 📊 CATEGORY D: Build-Time/SSG Consumers

| File | Uses Loader? | Notes |
|------|-------------|-------|
| `src/app/treatments/[slug]/page.tsx` - generateStaticParams | ❌ Uses Supabase | Build-time slug discovery |

**Note:** `generateStaticParams()` currently uses Supabase to get slugs.
Post-migration, could use `getAllTreatmentSlugs()` from canonical loader.

---

### 📄 CATEGORY E: Generated Artifacts (Read-Only)

| File | Source |
|------|--------|
| `public/sitemap-treatments.xml` | Generated from treatment data |
| `public/treatments-index.json` | Generated manifest |

---

## Migration Priority

### P0: Critical (4 files)
1. `src/app/treatments/[slug]/page.tsx` - Main treatment page
2. `src/app/api/treatments/[slug]/route.ts` - Treatment API
3. `src/app/api/treatments/manifest/route.ts` - Manifest API
4. `src/lib/programmatic-seo/data-loader.ts` - SEO data loader

### P1: Low Priority (1 file)
1. `generateStaticParams()` in treatment page - Could use canonical loader

---

## Summary Table

| Category | Count | Status |
|----------|-------|--------|
| A: Using Canonical Loader | 2 | ✅ Good |
| B: Bypassing Loader | 4 | ❌ NEEDS MIGRATION |
| C: Migration Scripts | 9 | ✅ Intentionally Independent |
| D: Build-Time | 1 | ⚠️ Uses Database |
| E: Generated | 2 | ✅ N/A |

**Total Treatment Consumers:** 18
**Need Migration:** 4 (P0 Critical)
