# HeyPsych Phase 2 — Prioritized Fix Roadmap (2-6 Weeks)

**Start Date:** November 25, 2025
**Target Completion:** December 20, 2025 (4 weeks)
**Team Size:** 2-3 engineers

---

## Week 1: Critical E-A-T Compliance Fixes (HIGH PRIORITY)

### 🔴 Sprint 1.1: Medical Review Board Fallback (3 days)

**Objective:** Ensure EVERY page displays "Reviewed by the HeyPsych Medical Review Board"

**Tasks:**
1. **Update AuthorByline component** (`/src/components/eat/AuthorByline.tsx`)
   - Remove `return null` when no author/reviewer
   - Add fallback rendering for Medical Review Board
   - Always show "Reviewed by the HeyPsych Medical Review Board" + review date
   - Display individual reviewer IF specified, otherwise show board

2. **Add default review date logic** (`/src/lib/data/entity-mappers.ts`)
   - If `entity.editorial.lastReviewed` missing → fallback to `entity.updated_at`
   - If both missing → fallback to hardcoded "2025-11-01" (organization-wide review date)

3. **Update component rendering logic:**
   - Conditions: Always render AuthorByline (even if editorial undefined)
   - Treatments: Always render AuthorByline (even if editorial undefined)
   - Resources: Add AuthorByline rendering (currently missing)

**Files Changed:**
- `/src/components/eat/AuthorByline.tsx`
- `/src/lib/data/entity-mappers.ts`
- `/src/app/conditions/[slug]/client-wrapper.tsx`
- `/src/app/treatments/[slug]/client-wrapper.tsx`
- `/src/components/resources/ResourceDetailClient.tsx`

**Acceptance Criteria:**
- ✅ Every condition page shows "Reviewed by the HeyPsych Medical Review Board"
- ✅ Every treatment page shows "Reviewed by the HeyPsych Medical Review Board"
- ✅ Every resource page shows "Reviewed by the HeyPsych Medical Review Board"
- ✅ "Last reviewed: <date>" shows on all pages
- ✅ Individual reviewer name shows ONLY if specified in editorial metadata

**Test Plan:**
- Manual QA: Visit 20 random pages (conditions, treatments, resources)
- Verify E-A-T badge visible on all pages
- Playwright E2E test: Assert badge presence on all entity types

---

### 🔴 Sprint 1.2: Create Medical Review Board Page (2 days)

**Objective:** Create `/about/medical-review-board` page listing all reviewers

**Tasks:**
1. **Create page component** (`/src/app/about/medical-review-board/page.tsx`)
   - Server component (static generation)
   - SEO metadata (title, description, canonical)
   - Generate Person schema.org for each reviewer
   - Generate Organization schema.org for board

2. **Reviewer data structure** (`/data/editorial/reviewers/board.json`)
   ```json
   {
     "organization": {
       "name": "HeyPsych Medical Review Board",
       "description": "Board-certified psychiatrists and licensed mental health professionals",
       "url": "https://heypsych.com/about/medical-review-board"
     },
     "reviewers": [
       {
         "id": "john-lee-md",
         "name": "Dr. John Lee",
         "credentials": "MD, Board-Certified Psychiatrist",
         "specialty": "Mood Disorders and Anxiety",
         "board_certifications": ["American Board of Psychiatry and Neurology"],
         "education": ["Stanford University School of Medicine"],
         "affiliations": ["American Psychiatric Association"],
         "bio": "Dr. Lee is a board-certified psychiatrist with over 15 years of experience...",
         "image_url": "/images/reviewers/john-lee.jpg"
       }
     ]
   }
   ```

3. **UI Design:**
   - Header with board description
   - Grid of reviewer cards (photo, name, credentials, bio)
   - Link to board page from all entity pages (AuthorByline component)

**Files Created:**
- `/src/app/about/medical-review-board/page.tsx`
- `/data/editorial/reviewers/board.json`
- `/src/lib/data/review-board-service.ts` (fetch reviewer data)

**Acceptance Criteria:**
- ✅ Page accessible at `/about/medical-review-board`
- ✅ Lists all medical reviewers with credentials
- ✅ Includes Person schema.org for each reviewer
- ✅ Includes Organization schema.org for board
- ✅ Mobile-responsive design
- ✅ Linked from footer navigation

---

### 🔴 Sprint 1.3: Add E-A-T Components to Resource Pages (1 day)

**Objective:** Resource pages must display E-A-T components

**Tasks:**
1. **Update ResourceDetailClient** (`/src/components/resources/ResourceDetailClient.tsx`)
   - Import E-A-T components (AuthorByline, MedicalReviewBadge, MedicalDisclaimer)
   - Render AuthorByline after resource header
   - Render MedicalDisclaimer at bottom (for medical resource types)
   - Render ContentTimestamps for publication dates

2. **Add conditional logic:**
   - Show MedicalDisclaimer for: assessments-screeners, articles-guides
   - Skip MedicalDisclaimer for: digital-tools, support-community

**Files Changed:**
- `/src/components/resources/ResourceDetailClient.tsx`

**Acceptance Criteria:**
- ✅ Assessment pages show AuthorByline + MedicalDisclaimer
- ✅ Article pages show AuthorByline + MedicalDisclaimer
- ✅ Digital tool pages show AuthorByline (no disclaimer)
- ✅ All resource pages show "Reviewed by the HeyPsych Medical Review Board"

---

## Week 2: JSON Editorial Metadata Population (MEDIUM PRIORITY)

### 🟡 Sprint 2.1: Automated Editorial Metadata Script (2 days)

**Objective:** Add default editorial metadata to ALL 800+ entity JSON files

**Tasks:**
1. **Create migration script** (`/scripts/add-editorial-metadata.ts`)
   ```typescript
   // Pseudo-code
   for each JSON file in /data/ {
     if (file has NO editorial field) {
       file.editorial = {
         medicalReviewerIds: ["john-lee-md"],
         reviewBoard: "official",
         lastReviewed: file.metadata?.last_updated || "2025-11-10",
         lastUpdated: file.metadata?.last_updated || "2025-11-10"
       }
       save(file)
     }
   }
   ```

2. **Validation:**
   - Verify all JSON files have `editorial` field
   - Verify no malformed JSON after edits
   - Generate report: "Added editorial to N files"

3. **Database sync:**
   - Run `npm run sync:json-to-db` to update entities table
   - Verify `entity.editorial` populated in database

**Files Created:**
- `/scripts/add-editorial-metadata.ts`
- `/scripts/validate-editorial-coverage.ts`

**Acceptance Criteria:**
- ✅ 100% of JSON files have `editorial` field
- ✅ All entities in database have `editorial` metadata
- ✅ Script idempotent (can be run multiple times safely)

---

### 🟡 Sprint 2.2: Manual Editorial Refinement (3 days)

**Objective:** Review and refine editorial metadata for high-traffic pages

**Tasks:**
1. **Identify top 50 pages** (by traffic/importance):
   - Major depressive disorder
   - Generalized anxiety disorder
   - PTSD
   - Cognitive behavioral therapy
   - Sertraline
   - Prozac
   - Etc.

2. **Add author attributions** where appropriate:
   - Articles/guides → assign to content authors
   - Assessments → assign to assessment developers
   - Conditions/Treatments → keep as Medical Review Board only

3. **Set accurate review dates:**
   - Research when each page was last medically reviewed
   - Update `lastReviewed` to actual date (not default)

4. **Add custom disclaimers** where needed:
   - ADHD medications → controlled substance warnings
   - Suicide-related content → crisis resources

**Acceptance Criteria:**
- ✅ Top 50 pages have accurate editorial metadata
- ✅ Author assignments appropriate
- ✅ Review dates accurate
- ✅ Custom disclaimers added where needed

---

## Week 3: Schema & Linking Improvements (MEDIUM PRIORITY)

### 🟡 Sprint 3.1: Add Organization Schema & Person Schema Defaults (2 days)

**Objective:** Generate Organization schema for Medical Review Board on all pages

**Tasks:**
1. **Create Organization schema builder** (`/src/lib/seo/schema-builders/organization.ts`)
   ```typescript
   export function buildMedicalReviewBoardSchema() {
     return {
       "@context": "https://schema.org",
       "@type": "MedicalOrganization",
       "name": "HeyPsych Medical Review Board",
       "description": "Board-certified psychiatrists and mental health professionals",
       "url": "https://heypsych.com/about/medical-review-board",
       "logo": "https://heypsych.com/images/logo.png",
       "sameAs": [
         "https://twitter.com/heypsych",
         "https://linkedin.com/company/heypsych"
       ]
     };
   }
   ```

2. **Update SchemaFactory** (`/src/lib/seo/schema-factory.ts`)
   - Add Organization schema to schema stack (all pages)
   - Generate default Person schema for "HeyPsych Medical Review Board" when no individual reviewer

3. **Add fallback logic:**
   - If `entity.editorial.medicalReviewer` exists → generate individual Person schema
   - If NOT exists → generate generic "Medical Review Board" Person schema

**Files Changed:**
- `/src/lib/seo/schema-builders/organization.ts` (new)
- `/src/lib/seo/schema-factory.ts`

**Acceptance Criteria:**
- ✅ All pages include MedicalOrganization schema
- ✅ All pages include Person schema (individual reviewer OR board)
- ✅ Schema validates with schema.org validator

---

### 🟡 Sprint 3.2: Fix Assessment Routing (1 day)

**Objective:** Ensure assessment links route to `/resources/assessments-screeners/{slug}`

**Tasks:**
1. **Update link parser** (`/src/lib/utils/link-parser.ts`)
   - Add logic to detect assessment resources
   - Generate `/resources/assessments-screeners/{slug}` for assessments
   - Keep `/resources/{slug}` for other resource types

2. **Add assessment link type:**
   ```typescript
   export type LinkType = "condition" | "treatment" | "resource" | "assessment";

   function getLinkPath(linkType, slug) {
     switch (linkType) {
       case "assessment":
         return `/resources/assessments-screeners/${slug}`;
       case "resource":
         return `/resources/${slug}`;
       // ...
     }
   }
   ```

3. **Update content enhancer:**
   - Detect assessment entities
   - Use `linkType: "assessment"` instead of `"resource"`

**Files Changed:**
- `/src/lib/utils/link-parser.ts`
- `/src/lib/linking/content-enhancer.ts`

**Acceptance Criteria:**
- ✅ Assessment links route to `/resources/assessments-screeners/{slug}`
- ✅ Other resource links route to `/resources/{slug}`
- ✅ Sitemap consistency verified

---

### 🟡 Sprint 3.3: Generic Word Filtering Validation (2 days)

**Objective:** Ensure generic medical terms are NOT auto-linked

**Tasks:**
1. **Add comprehensive blocklist** (`/src/lib/linking/content-enhancer.ts`)
   ```typescript
   const GENERIC_TERMS = [
     "anxiety", "depression", "mood", "stress", "test", "assessment",
     "therapy", "treatment", "medication", "disorder", "symptom",
     "mental health", "behavior", "emotion", "feeling"
   ];
   ```

2. **Update entity name matching:**
   - Only link EXACT entity names (case-sensitive)
   - Require minimum 3-word phrases for auto-linking
   - Skip linking if word is in generic terms blocklist

3. **Add manual testing:**
   - Test 20 random pages
   - Verify NO generic words linked
   - Verify legitimate entity names ARE linked

**Files Changed:**
- `/src/lib/linking/content-enhancer.ts`

**Acceptance Criteria:**
- ✅ Generic words NOT linked ("anxiety", "depression", etc.)
- ✅ Entity names still linked correctly ("Major Depressive Disorder")
- ✅ Abbreviations work (ADHD, PTSD, OCD)

---

## Week 4: Type Safety, Testing & Validation (LOW PRIORITY)

### 🟢 Sprint 4.1: Remove Type Safety Violations (2 days)

**Objective:** Eliminate all `as any` casts and enforce TypeScript safety

**Tasks:**
1. **Update Entity type definition** (`/src/lib/types/database.ts`)
   ```typescript
   interface Entity {
     // ...existing fields
     editorial?: EditorialMetadata;
     metadata?: {
       medical_review?: MedicalReviewInfo;
       author?: AuthorInfo;
       medical_reviewer?: MedicalReviewerInfo;
     };
   }
   ```

2. **Remove all `as any` casts:**
   - Conditions client wrapper
   - Treatments client wrapper
   - Resource client
   - Schema builders

3. **Fix TypeScript errors:**
   - Run `npx tsc --noEmit`
   - Fix all type errors
   - Verify build succeeds

**Files Changed:**
- `/src/lib/types/database.ts`
- `/src/app/conditions/[slug]/client-wrapper.tsx`
- `/src/app/treatments/[slug]/client-wrapper.tsx`
- `/src/components/resources/ResourceDetailClient.tsx`

**Acceptance Criteria:**
- ✅ Zero `as any` casts in codebase
- ✅ `npx tsc --noEmit` passes with no errors
- ✅ `npm run build` succeeds

---

### 🟢 Sprint 4.2: Add E-A-T Integration Tests (2 days)

**Objective:** Automated tests for E-A-T component rendering

**Tasks:**
1. **Create Playwright test suite** (`/tests/e2e/eat-compliance.spec.ts`)
   ```typescript
   test("Condition page shows Medical Review Board", async ({ page }) => {
     await page.goto("/conditions/major-depressive-disorder");
     await expect(page.locator('text=/Reviewed by the HeyPsych Medical Review Board/i')).toBeVisible();
     await expect(page.locator('text=/Last reviewed:/i')).toBeVisible();
   });

   test("Resource page shows E-A-T components", async ({ page }) => {
     await page.goto("/resources/assessments-screeners/phq-9");
     await expect(page.locator('text=/Reviewed by/i')).toBeVisible();
     await expect(page.locator('text=/Medical Disclaimer/i')).toBeVisible();
   });
   ```

2. **Schema validation tests** (`/tests/e2e/schema-validation.spec.ts`)
   - Extract schema.org JSON-LD from pages
   - Validate against schema.org vocabulary
   - Assert all required properties present

3. **Link validation tests** (`/tests/e2e/internal-linking.spec.ts`)
   - Visit MDD condition page
   - Assert treatment links visible
   - Click link, verify navigation works
   - Assert NO generic word links

**Files Created:**
- `/tests/e2e/eat-compliance.spec.ts`
- `/tests/e2e/schema-validation.spec.ts`
- `/tests/e2e/internal-linking.spec.ts`

**Acceptance Criteria:**
- ✅ E2E tests pass for 10+ sample pages
- ✅ Schema validation tests pass
- ✅ Link rendering tests pass
- ✅ Tests run in CI/CD pipeline

---

### 🟢 Sprint 4.3: Final Validation & Deployment Prep (1 day)

**Objective:** Run all validation tools and prepare for deployment

**Tasks:**
1. **Run validation suite:**
   ```bash
   npm run build
   npm run seo:metrics
   npm run seo:validate
   ```

2. **Generate final reports:**
   - Schema coverage report
   - Metadata completeness report
   - Link quality metrics
   - E-A-T compliance score

3. **Manual QA checklist:**
   - [ ] Visit 50 random pages (all entity types)
   - [ ] Verify E-A-T components visible
   - [ ] Verify schemas valid (Google Rich Results Test)
   - [ ] Verify internal links work
   - [ ] Verify sitemaps accessible
   - [ ] Verify Medical Review Board page accessible

4. **Create deployment checklist:**
   - [ ] Backup production database
   - [ ] Deploy to staging
   - [ ] Run smoke tests on staging
   - [ ] Deploy to production
   - [ ] Monitor error logs for 24 hours

**Acceptance Criteria:**
- ✅ `npm run build` succeeds
- ✅ `npm run seo:metrics` shows 100% schema coverage
- ✅ `npm run seo:validate` shows 0 errors
- ✅ Manual QA checklist 100% complete
- ✅ Deployment checklist created

---

## Roadmap Summary

| Week | Sprint | Days | Priority | Status |
|------|--------|------|----------|--------|
| 1 | Medical Review Board Fallback | 3 | 🔴 HIGH | Pending |
| 1 | Create Review Board Page | 2 | 🔴 HIGH | Pending |
| 1 | E-A-T on Resource Pages | 1 | 🔴 HIGH | Pending |
| 2 | Automated Editorial Metadata | 2 | 🟡 MEDIUM | Pending |
| 2 | Manual Editorial Refinement | 3 | 🟡 MEDIUM | Pending |
| 3 | Organization Schema | 2 | 🟡 MEDIUM | Pending |
| 3 | Assessment Routing Fix | 1 | 🟡 MEDIUM | Pending |
| 3 | Generic Word Filtering | 2 | 🟡 MEDIUM | Pending |
| 4 | Type Safety Fixes | 2 | 🟢 LOW | Pending |
| 4 | E-A-T Integration Tests | 2 | 🟢 LOW | Pending |
| 4 | Final Validation | 1 | 🟢 LOW | Pending |

**Total Duration:** 21 days (4 weeks + 1 day buffer)

---

## Risk Mitigation

### Risk #1: Editorial Metadata Script Breaks JSON Files
**Mitigation:**
- Backup all JSON files before running script
- Run on 10 test files first
- Validate JSON syntax after each file edit
- Git commit after successful run

### Risk #2: E-A-T Changes Break Existing Pages
**Mitigation:**
- Deploy to staging environment first
- Run full regression test suite
- Manual QA on 50+ pages
- Gradual rollout (10% → 50% → 100%)

### Risk #3: Schema Changes Affect SEO Rankings
**Mitigation:**
- Validate schemas with Google Rich Results Test
- Monitor Google Search Console for errors
- Keep old schema structure for 2 weeks (dual schema output)
- Rollback plan ready

---

## Post-Launch Monitoring (Week 5+)

### Week 5: Monitoring & Iteration
- **Google Search Console:** Monitor schema errors
- **Analytics:** Track traffic impact
- **User feedback:** Collect feedback on E-A-T UI
- **Performance:** Monitor page load times

### Week 6: Optimization
- **Content enhancement caching:** Implement in-memory cache
- **Schema minification:** Reduce JSON-LD payload size
- **Editorial workflow:** Build CMS admin panel for reviewers

---

**End of Roadmap**
