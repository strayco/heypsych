# Resources SEO + UX Implementation — Summary

## What I've Delivered

### ✅ Step 0: Consistency Memo
**File:** [RESOURCES_SEO_IMPLEMENTATION.md](./RESOURCES_SEO_IMPLEMENTATION.md)

Comprehensive documentation of:
- Patterns to reuse from Conditions (routing, SEO, UI, validation)
- Patterns to reuse from Medications (crosslinking, content enhancement, section rendering)
- What differs for Resources (lighter content, multi-tiered categories, hybrid data sources)
- Complete mapping of which patterns to apply where

### ✅ Step 1: Inventory + IA Map
**Included in:** [RESOURCES_SEO_IMPLEMENTATION.md](./RESOURCES_SEO_IMPLEMENTATION.md#step-1-inventory--ia-map)

**Current State:**
- **93 total resources** across 4 active categories
- **40 orphaned resources** (43%!) missing `metadata.category`
- **0% with crosslinks** to conditions/medications/other resources
- **16% with FAQs** (room for improvement)
- **100% missing `resourceType`** metadata field

**Critical Finding:** All 40 support-community crisis helplines and organizations are orphaned because they lack the `metadata.category` field in their JSON files.

### ✅ Step 2: Gold Standard Template Spec
**Included in:** [RESOURCES_SEO_IMPLEMENTATION.md](./RESOURCES_SEO_IMPLEMENTATION.md#step-2-gold-standard-resources-template-spec)

Detailed specifications for:
- **Hub Template** (`/resources`) — search, category tiles, A-Z directory
- **Category Hub Template** (`/resources/{category}`) — breadcrumbs, resource list, filters
- **Detail Template** (`/resources/{resource}`) — content sections, crosslinks, SEO

### ✅ Step 3: JSON Data Contract
**Included in:** [RESOURCES_SEO_IMPLEMENTATION.md](./RESOURCES_SEO_IMPLEMENTATION.md#step-3-json-data-contract)

- Required fields (name, slug, type, status, metadata.category)
- Recommended fields (SEO, editorial)
- Optional fields (crosslinks, sections, FAQs, citations)
- Field → UI mapping
- Schema generation logic

### ✅ Step 4: Phase 1 Implementation

#### 1. Category Configuration
**File:** [src/lib/config/resource-categories.ts](./src/lib/config/resource-categories.ts)

Defines 4 canonical resource categories with:
- Display metadata (title, subtitle, emoji, icon)
- Visual styling (gradient, colors)
- SEO metadata (description, keywords)
- Helper functions for validation

#### 2. Validation Script
**File:** [scripts/validate-resources.cjs](./scripts/validate-resources.cjs)
**Command:** `npm run validate:resources`

Build-blocking validation that checks:
- ✅ Category validation (metadata.category exists and is valid)
- ✅ Slug uniqueness
- ✅ Status validation (only "active" in production)
- ✅ Indexing validation (JSON files ↔ resources-index.json sync)
- ✅ Required fields (name, slug, type, status)
- ✅ SEO metadata (title/description lengths)
- ✅ Crosslink validation (no broken references)
- ✅ Directory structure (files in correct category folders)

**Added to prebuild:** Validation now runs automatically before build

#### 3. Audit Script
**File:** [scripts/audit-resources.cjs](./scripts/audit-resources.cjs)
**Command:** `npm run audit:resources`
**Output:** [RESOURCES_AUDIT_REPORT.md](./RESOURCES_AUDIT_REPORT.md)

Informational (non-blocking) audit that generates detailed report on:
- Category distribution
- Orphaned resources
- Missing metadata fields
- Long SEO titles
- Crosslink coverage
- Content richness (FAQs, structured sections)
- Actionable recommendations

---

## Critical Issues Found (Audit Results)

### 🚨 Priority 1: 40 Orphaned Resources

**Problem:** 43% of resources are missing `metadata.category` field

**Impact:**
- Not discoverable on category pages
- Not in sitemap properly
- SEO catastrophe

**Affected Resources:**
- All 28 crisis helplines in `support-community/immediate-crisis/`
- All 12 organizations in `support-community/organizations-communities/`

**Fix Required:** Add `metadata.category: "support-community"` to these 40 JSON files

---

### 🚨 Priority 2: Missing `metadata.resourceType`

**Problem:** 100% of resources lack `metadata.resourceType` field

**Impact:**
- Can't filter by type (assessment, guide, app, etc.)
- Missing structured data for schema.org
- Poor UX for category filtering

**Fix Required:** Add `metadata.resourceType` to all 93 resources
- Options: `"assessment"`, `"article"`, `"guide"`, `"app"`, `"support"`, `"reference"`

---

### 🚨 Priority 3: Zero Crosslinks

**Problem:** 0% of resources have crosslinks to conditions/medications/other resources

**Impact:**
- Missed SEO opportunity (internal linking)
- Poor user navigation
- No knowledge graph connections

**Fix Required:** Add crosslink fields to top 20-30 resources:
```json
{
  "relatedConditionSlugs": ["generalized-anxiety-disorder", "panic-disorder"],
  "relatedResourceSlugs": ["gad-7", "finding-a-therapist"]
}
```

---

### ⚠️ Priority 4: 10 Long SEO Titles

**Problem:** 10 resources have SEO titles >60 chars (will be truncated in SERPs)

**Examples:**
- "Headspace: 4.8★ Meditation & Sleep App - 14% Stress Reduction | HeyPsych" (72 chars)
- "Woebot: 4.7★ AI Mental Health Chatbot | Depression & Anxiety Support | HeyPsych" (79 chars)

**Fix Required:** Shorten to ≤60 chars

---

## Next Steps — Recommended Action Plan

### Phase 1A: Data Cleanup (CRITICAL — 1-2 days)

**Goal:** Fix orphaned resources and missing metadata

1. **Add `metadata.category` to 40 orphaned resources**
   - Script: Create bulk-update script or manual edit
   - Files: All in `support-community/immediate-crisis/` and `support-community/organizations-communities/`
   - Add: `"metadata": { "category": "support-community" }`

2. **Add `metadata.resourceType` to all 93 resources**
   - Assessments (4): `"resourceType": "assessment"`
   - Digital tools (15): `"resourceType": "app"`
   - Knowledge hub (21): `"resourceType": "guide"` or `"article"`
   - Support community (53): `"resourceType": "support"`

3. **Add `status` field to all resources**
   - Default: `"status": "active"`
   - This is currently missing (audit shows 0/0/0 for active/draft/archived)

4. **Verify with validation script**
   ```bash
   npm run validate:resources
   ```

### Phase 1B: SEO Fixes (MEDIUM — 2-3 days)

**Goal:** Improve SEO metadata

1. **Shorten 10 long SEO titles**
   - Target: ≤60 chars
   - Keep brand names and key info
   - Remove HeyPsych suffix if needed (it's in `<title>` template)

2. **Add descriptions to resources missing them**
   - Currently most have `summary` or `description`
   - Ensure all have at least one

3. **Verify sitemap inclusion**
   - Run: `npm run validate:sitemap`
   - Ensure all 93 resources appear

### Phase 1C: Crosslinking (MEDIUM — 3-5 days)

**Goal:** Add internal links to top resources

1. **Start with top 20 most-accessed resources**
   - PHQ-9, GAD-7 → link to depression/anxiety conditions
   - Finding a Therapist → link to all anxiety/mood conditions
   - CBT Explained → link to anxiety, depression, OCD conditions

2. **Add `relatedConditionSlugs[]` arrays**
   - Reference existing condition slugs
   - 3-5 conditions per resource max

3. **Add `relatedResourceSlugs[]` arrays**
   - Link related assessments, guides
   - 3-5 resources max

4. **Update detail page template to render crosslinks**
   - Reuse ParsedContent pattern from medications
   - Ensure crawlable `<a href>` links

### Phase 1D: Hub UX (LOW PRIORITY — 3-4 days)

**Goal:** Improve hub page discoverability

1. **Add A-Z directory to `/resources` footer**
   - Component: Create `ResourcesAlphabeticalDirectory.tsx`
   - Pattern: Reuse from `ConditionBreadcrumbs`
   - All 93 resources linked in initial HTML

2. **Enhance search with aliases**
   - Add `aliases` field to JSON (e.g., `["PHQ-9", "Patient Health Questionnaire"]`)
   - Update search to include aliases

3. **Add popular resource chips**
   - 5-7 most useful resources above category tiles
   - Examples: "PHQ-9", "988 Lifeline", "Finding a Therapist"

---

## Testing Checklist

Before deploying, verify:

### Data Quality
- [ ] All 93 resources have `metadata.category`
- [ ] All 93 resources have `metadata.resourceType`
- [ ] All 93 resources have `status: "active"`
- [ ] No duplicate slugs
- [ ] `npm run validate:resources` passes (exit 0)

### Crawlability
- [ ] Hub links to all 4 categories (inspect DOM)
- [ ] Each category hub links to all its resources (inspect DOM)
- [ ] A-Z directory exists on hub (inspect DOM)
- [ ] All crosslinks render as `<a href>` in initial HTML (View Source)
- [ ] No broken links (screaming-frog crawl)

### SEO
- [ ] All pages have unique `<title>` ≤60 chars
- [ ] All pages have unique `<meta name="description">` ≤160 chars
- [ ] Canonical URLs correct on all pages
- [ ] All 93 resources in sitemap
- [ ] BreadcrumbList schema on category + detail pages
- [ ] Article/HowTo/MedicalWebPage schemas on detail pages

### CWV
- [ ] Mobile CLS <0.1 (test on real device)
- [ ] Desktop CLS <0.1
- [ ] No layout shift on hub (search bar reserved space)

---

## Files Created/Updated

### New Files
1. ✅ `src/lib/config/resource-categories.ts` — Category configuration
2. ✅ `scripts/validate-resources.cjs` — Build-blocking validation
3. ✅ `scripts/audit-resources.cjs` — Informational audit
4. ✅ `RESOURCES_SEO_IMPLEMENTATION.md` — Implementation plan
5. ✅ `RESOURCES_AUDIT_REPORT.md` — Current state audit (auto-generated)
6. ✅ `RESOURCES_IMPLEMENTATION_SUMMARY.md` — This file

### Updated Files
1. ✅ `package.json` — Added `validate:resources` and `audit:resources` scripts
2. ⏳ `prebuild` script — Added `npm run validate:resources` (will block builds with bad data)

### Files to Create (Next Phase)
1. `src/components/resources/ResourcesAlphabeticalDirectory.tsx` — A-Z directory
2. `scripts/bulk-update-resources.cjs` — Helper to add missing metadata fields
3. Detail page crosslink rendering (update existing `ResourceDetailClient.tsx`)

---

## How to Use

### Run Audit (Informational)
```bash
npm run audit:resources
```
- Generates `RESOURCES_AUDIT_REPORT.md`
- Shows current state, issues, recommendations
- Does NOT fail build

### Run Validation (Build-Blocking)
```bash
npm run validate:resources
```
- Checks for critical errors
- Exit code 1 if failures (blocks build)
- Exit code 0 if all checks pass

### During Development
1. Make changes to resource JSON files
2. Run `npm run audit:resources` to see impact
3. Run `npm run validate:resources` to check for errors
4. Fix any validation errors before committing

### Before Deployment
```bash
npm run validate:resources && npm run build
```
- Validation runs automatically in `prebuild`
- Build will fail if validation fails
- Ensures bad data never reaches production

---

## Success Criteria ("100/100")

### Discoverability ✅
- [ ] 100% of resources accessible from hub (via category or A-Z)
- [ ] 0 orphaned resources
- [ ] 0 broken internal links

### Crawlability ✅
- [ ] 100% of critical links in initial HTML
- [ ] 100% of resources in sitemap
- [ ] 0 client-side-only navigation

### SEO ✅
- [ ] 100% of pages have unique metadata
- [ ] 100% of pages have correct canonicals
- [ ] 100% of structured data validates
- [ ] All titles ≤60 chars
- [ ] All descriptions ≤160 chars

### UX ✅
- [ ] Search works (title + aliases)
- [ ] Mobile CLS <0.1
- [ ] Desktop CLS <0.1
- [ ] Apple-like design consistency maintained

### Validation ✅
- [ ] `npm run validate:resources` passes
- [ ] No build warnings/errors
- [ ] Backward compatible (no broken URLs)

---

## Estimated Timeline

| Phase | Tasks | Effort | Priority |
|-------|-------|--------|----------|
| **1A: Data Cleanup** | Fix orphaned resources, add metadata fields | 1-2 days | 🚨 CRITICAL |
| **1B: SEO Fixes** | Shorten titles, verify sitemap | 2-3 days | ⚠️ HIGH |
| **1C: Crosslinking** | Add crosslinks to top 20 resources | 3-5 days | ⚠️ MEDIUM |
| **1D: Hub UX** | A-Z directory, search enhancement | 3-4 days | ℹ️ LOW |
| **Total** | | **9-14 days** | |

**Recommendation:** Start with Phase 1A (data cleanup) immediately. This fixes the most critical SEO issues and unblocks the rest of the work.

---

## Questions?

Refer to:
- [RESOURCES_SEO_IMPLEMENTATION.md](./RESOURCES_SEO_IMPLEMENTATION.md) — Full implementation plan
- [RESOURCES_AUDIT_REPORT.md](./RESOURCES_AUDIT_REPORT.md) — Current state details
- `src/lib/config/resource-categories.ts` — Category definitions
- `scripts/validate-resources.cjs` — Validation logic

Run `npm run audit:resources` anytime to regenerate the audit report with current data.
