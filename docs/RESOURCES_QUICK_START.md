# Resources SEO Implementation — Quick Start Guide

## What's Been Delivered

I've completed a comprehensive audit and implementation plan for your Resources section, matching the patterns you established in Conditions and Medications. Here's what you have:

### 📋 Documentation (4 files)
1. **[RESOURCES_SEO_IMPLEMENTATION.md](./RESOURCES_SEO_IMPLEMENTATION.md)** — Full implementation plan
   - Step 0: Consistency memo (patterns from Conditions/Medications)
   - Inventory + IA map
   - Gold standard template specs
   - JSON data contract
   - Phase 1 implementation plan
   - Validation script specification
   - QA checklist

2. **[RESOURCES_IMPLEMENTATION_SUMMARY.md](./RESOURCES_IMPLEMENTATION_SUMMARY.md)** — Executive summary
   - Critical issues found
   - Recommended action plan
   - Testing checklist
   - Timeline estimates

3. **[RESOURCES_AUDIT_REPORT.md](./RESOURCES_AUDIT_REPORT.md)** — Current state audit
   - Category distribution
   - Orphaned resources list (40 items!)
   - Missing metadata
   - Recommendations

4. **[RESOURCES_QUICK_START.md](./RESOURCES_QUICK_START.md)** — This file

### 🛠️ Implementation Files

1. **[src/lib/config/resource-categories.ts](./src/lib/config/resource-categories.ts)** — Category configuration
   - Defines 4 canonical categories
   - Display metadata, styling, SEO
   - Helper functions for validation

2. **[scripts/validate-resources.cjs](./scripts/validate-resources.cjs)** — Build-blocking validation
   - 8 validation checks
   - Fails build if critical issues found
   - Runs automatically in `prebuild`

3. **[scripts/audit-resources.cjs](./scripts/audit-resources.cjs)** — Informational audit
   - Generates detailed report
   - Recommendations
   - Non-blocking

4. **[scripts/fix-orphaned-resources.cjs](./scripts/fix-orphaned-resources.cjs)** — Auto-fix script
   - Adds missing `metadata.category` (40 resources)
   - Adds missing `metadata.resourceType` (93 resources)
   - Adds missing `status` (93 resources)
   - Dry-run mode available

---

## Critical Issues Found

### 🚨 40 Orphaned Resources (43%!)

**All support-community crisis helplines and organizations** are missing `metadata.category`:
- 28 crisis helplines (988, Crisis Text Line, NAMI Helpline, etc.)
- 12 support organizations (NAMI, DBSA, CHADD, etc.)

**Impact:** Not discoverable, not in sitemap, SEO disaster

**Fix:** Run the auto-fix script (see below)

### 🚨 93/93 Resources Missing `metadata.resourceType`

**Impact:** Can't filter by type, poor UX, missing structured data

**Fix:** Auto-fix script handles this

### 🚨 0% Crosslinks

**Impact:** Missed SEO opportunity, poor navigation

**Fix:** Manual work required (add `relatedConditionSlugs[]` arrays)

---

## How to Fix (Step by Step)

### Step 1: Run Auto-Fix Script (5 minutes)

This will add all missing metadata fields automatically:

```bash
# Preview what will change (dry run)
npm run fix:resources:dry

# Apply the changes
npm run fix:resources
```

**What it does:**
- ✅ Adds `metadata.category: "support-community"` to 40 orphaned resources
- ✅ Adds `metadata.resourceType` to all 93 resources
  - `"assessment"` for PHQ-9, GAD-7, etc.
  - `"app"` for Headspace, Calm, etc.
  - `"guide"` for knowledge hub articles
  - `"support"` for crisis helplines
- ✅ Adds `status: "active"` to all 93 resources

### Step 2: Verify with Validation (1 minute)

```bash
npm run validate:resources
```

**Expected result:**
```
✅ Category Validation: 93/93 resources have valid categories
✅ Slug Uniqueness: No duplicates found (93 unique slugs)
✅ Status Validation: All resources have status "active"
✅ Indexing Validation: All 93 active resources properly indexed
✅ Required Fields: All resources have required fields
✅ SEO Metadata: Validation complete (check warnings above)
✅ Crosslink Validation: No broken resource links found
✅ Directory Structure: All resources in correct category directories

VALIDATION PASSED
```

### Step 3: Run Audit to Confirm (1 minute)

```bash
npm run audit:resources
```

**Expected improvements:**
- ✅ Orphaned: 0 (down from 40)
- ✅ Categories: 4 (down from 5, no more "unknown")
- ⚠️ Crosslinks: Still 0% (manual work needed)

### Step 4: Rebuild Resources Index (2 minutes)

```bash
npm run build:index
```

This regenerates `public/resources-index.json` with the updated metadata.

### Step 5: Commit Changes

```bash
git add .
git commit -m "fix: add missing metadata to 93 resources (category, resourceType, status)

- Add metadata.category to 40 orphaned support-community resources
- Add metadata.resourceType to all 93 resources
- Add status field to all 93 resources
- Implement resource validation and audit scripts
- Add category configuration matching Conditions pattern

Fixes resource discoverability and SEO issues"
```

---

## Available Commands

### Validation & Auditing

```bash
# Run validation (build-blocking, exit code 1 on failure)
npm run validate:resources

# Run audit (informational, generates report)
npm run audit:resources

# Preview auto-fix changes (dry run)
npm run fix:resources:dry

# Apply auto-fix changes
npm run fix:resources
```

### During Development

```bash
# Full validation before build (includes resources)
npm run prebuild

# Build (validation runs automatically)
npm run build
```

---

## Next Steps (After Auto-Fix)

### Phase 2: Add Crosslinks (Manual — 3-5 days)

**Goal:** Add internal links to top 20-30 resources

**Example:** PHQ-9 Depression Screener
```json
{
  "name": "PHQ-9",
  "slug": "phq-9",
  "metadata": {
    "category": "assessments-screeners",
    "resourceType": "assessment"
  },
  "relatedConditionSlugs": [
    "major-depression",
    "persistent-depressive-disorder",
    "bipolar-disorder"
  ],
  "relatedResourceSlugs": [
    "gad-7",
    "finding-a-therapist",
    "talk-to-doctor-antidepressants"
  ]
}
```

**Priority resources for crosslinking:**
1. PHQ-9, GAD-7, ASRS v1.1 (assessments)
2. Finding a Therapist, CBT Explained (guides)
3. Headspace, Calm, BetterHelp (apps)
4. 988 Lifeline, Crisis Text Line (support)

### Phase 3: SEO Fixes (2-3 days)

1. **Shorten 10 long SEO titles** (see audit report)
   - Target: ≤60 chars
   - Example: "Headspace: 4.8★ Meditation & Sleep App - 14% Stress Reduction | HeyPsych" (72 chars)
   - Better: "Headspace: Meditation & Sleep App (4.8★) | HeyPsych" (52 chars)

2. **Verify sitemap inclusion**
   ```bash
   npm run validate:sitemap
   ```

3. **Add structured data to detail pages** (if not already present)
   - Use `SchemaFactory.generateAll(entity)`
   - Article/HowTo/MedicalWebPage schemas

### Phase 4: Hub UX Enhancements (3-4 days)

1. **Create A-Z Directory component**
   - File: `src/components/resources/ResourcesAlphabeticalDirectory.tsx`
   - Pattern: Reuse from `ConditionBreadcrumbs`
   - Add to `/resources` hub footer

2. **Add search aliases**
   - Example: PHQ-9 → `"aliases": ["Patient Health Questionnaire", "PHQ9"]`
   - Update search to include aliases

3. **Add popular resource chips**
   - Above category tiles on hub
   - Examples: "PHQ-9", "988 Lifeline", "Finding a Therapist"

---

## Success Criteria

### After Auto-Fix (Step 1-5 above) ✅

- [x] 0 orphaned resources (down from 40)
- [x] All resources have `metadata.category`
- [x] All resources have `metadata.resourceType`
- [x] All resources have `status: "active"`
- [x] `npm run validate:resources` passes

### After Phase 2-4 (Future work) 🚧

- [ ] 80%+ resources with crosslinks (currently 0%)
- [ ] All SEO titles ≤60 chars
- [ ] A-Z directory on hub for crawlability
- [ ] Search works with aliases
- [ ] All 93 resources in sitemap
- [ ] Mobile CLS <0.1

---

## Testing

### Manual Testing

1. **Visit category pages:**
   - `/resources/support-community` — Should now show all 53 resources (not just 13)
   - `/resources/assessments-screeners` — All 4 assessments
   - `/resources/digital-tools` — All 15 apps
   - `/resources/knowledge-hub` — All 21 guides

2. **Check individual resource pages:**
   - `/resources/988-suicide-crisis-lifeline`
   - `/resources/phq-9`
   - `/resources/headspace`

3. **Verify metadata in `<head>`:**
   - View Source on any resource page
   - Check for `<meta name="description">`
   - Check for `<link rel="canonical">`
   - Check for structured data (JSON-LD)

### Automated Testing

```bash
# Validation
npm run validate:resources

# Audit
npm run audit:resources

# Sitemap
npm run validate:sitemap

# Full build
npm run build
```

---

## Rollback (If Needed)

If the auto-fix script causes issues:

```bash
# Revert changes
git checkout -- data/resources/

# Or revert specific category
git checkout -- data/resources/support-community/
```

---

## Support

### Documentation
- [RESOURCES_SEO_IMPLEMENTATION.md](./RESOURCES_SEO_IMPLEMENTATION.md) — Full plan
- [RESOURCES_IMPLEMENTATION_SUMMARY.md](./RESOURCES_IMPLEMENTATION_SUMMARY.md) — Summary
- [RESOURCES_AUDIT_REPORT.md](./RESOURCES_AUDIT_REPORT.md) — Current state

### Scripts
- `scripts/validate-resources.cjs` — Validation logic
- `scripts/audit-resources.cjs` — Audit logic
- `scripts/fix-orphaned-resources.cjs` — Auto-fix logic

### Configuration
- `src/lib/config/resource-categories.ts` — Category definitions
- `package.json` — npm scripts

---

## Timeline Estimate

| Phase | Description | Effort | Status |
|-------|-------------|--------|--------|
| **Phase 1** | Auto-fix + validation | 15 minutes | ✅ Ready to run |
| **Phase 2** | Add crosslinks | 3-5 days | 🚧 Manual work |
| **Phase 3** | SEO fixes | 2-3 days | 🚧 Manual work |
| **Phase 4** | Hub UX | 3-4 days | 🚧 Manual work |
| **Total** | | **8-12 days** | |

**Recommendation:** Run Phase 1 immediately (15 minutes). This fixes the most critical SEO issues and unblocks future work.

---

## Ready to Start?

Run these commands in order:

```bash
# 1. Preview changes
npm run fix:resources:dry

# 2. Apply changes
npm run fix:resources

# 3. Verify
npm run validate:resources

# 4. Audit
npm run audit:resources

# 5. Rebuild index
npm run build:index

# 6. Commit
git add .
git commit -m "fix: add missing metadata to 93 resources"
```

That's it! You've fixed the critical resource discoverability issues. 🎉
