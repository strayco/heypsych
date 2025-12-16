# Lighthouse SEO 100/100 - Pre-Merge Checklist

Branch: `feat/lighthouse-seo-100`
Commit: `787ebe6`
Date: 2025-12-16

---

## ✅ COMPLETED (Ready to Push)

### 1. Dependencies Installed
- ✅ `@lhci/cli@0.15.1` as devDependency
- ✅ `glob@13.0.0` as devDependency
- ✅ All 498 files committed

### 2. Code Implementation
- ✅ Viewport meta tag added
- ✅ Canonical URLs standardized to www.heypsych.com
- ✅ Middleware created for 301 redirects
- ✅ Robots meta implementation (conservative, safe)
- ✅ All metadata generators updated
- ✅ Image alt audit passes (156 files)
- ✅ Lighthouse CI config created
- ✅ GitHub Actions workflow created
- ✅ Validation scripts created
- ✅ Documentation complete

---

## ⚠️ MANUAL STEPS REQUIRED (Before/After Push)

### Step 1: Push Branch to GitHub

```bash
git push -u origin feat/lighthouse-seo-100
```

### Step 2: Configure GitHub Secrets

Go to: `https://github.com/strayco/heypsych/settings/secrets/actions`

**Required secrets:**

1. ✅ `NEXT_PUBLIC_SUPABASE_URL` (already exists from Vercel)
2. ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` (already exists from Vercel)
3. ⚠️ **`LHCI_GITHUB_APP_TOKEN`** (MUST ADD):

```bash
# Generate token:
npx lhci wizard

# Follow the prompts:
# 1. Select "GitHub App"
# 2. Authorize the app
# 3. Copy the token shown
# 4. Add to GitHub Secrets
```

### Step 3: Configure Branch Protection

Go to: `https://github.com/strayco/heypsych/settings/branches`

1. Click "Add rule"
2. Branch name pattern: `main`
3. ✅ Enable "Require status checks to pass before merging"
4. ✅ Search for and select: **"Lighthouse CI"** (or the specific job name: `lighthouse`)
5. ✅ Enable "Require branches to be up to date before merging"
6. Click "Create" or "Save changes"

### Step 4: Create Pull Request

1. Go to: `https://github.com/strayco/heypsych/compare/main...feat:lighthouse-seo-100`
2. Click "Create pull request"
3. Title: `feat: Lighthouse SEO 100/100 Implementation`
4. Description: Use the template below

---

## 📝 PR DESCRIPTION TEMPLATE

```markdown
# Lighthouse SEO 100/100 Implementation

Implements comprehensive SEO optimizations to achieve and maintain Lighthouse SEO score of 100/100.

## Changes

### Phase 1: Critical SEO Fixes (Blockers)
- ✅ Added viewport meta tag to layout.tsx (Lighthouse requirement)
- ✅ Standardized canonical URLs to https://www.heypsych.com
- ✅ Created canonical redirect middleware (301 non-www → www)
- ✅ Fixed OG image config to prevent 404s

### Phase 2: Robots Meta Implementation
- ✅ Added generateRobots() method with conservative rules
- ✅ Wired into all 4 entity metadata generators
- ✅ Auto-noindex for placeholder content (<100 words, "coming soon")

### Phase 3: Image Alt-Text Audit
- ✅ Created audit script (all 156 files pass)
- ✅ Added npm script: `npm run audit:images`

### Phase 4: Lighthouse CI Setup
- ✅ Created lighthouserc.json config
- ✅ Created GitHub Actions workflow
- ✅ SEO score must be 100/100 (build fails otherwise)
- ✅ Tests 7 representative page templates

### Phase 5: Validation & Documentation
- ✅ Hub page verification script
- ✅ Sitemap validation script
- ✅ Pre-deployment SEO check
- ✅ Post-deployment production verification
- ✅ Comprehensive runbook at docs/seo-lighthouse-100.md

## Testing

### Automated
- [x] Image alt text audit: 156 files pass
- [ ] Lighthouse CI: Will run on this PR
- [ ] All checks must pass

### Manual (Post-Merge)
```bash
# After deploy, verify production:
npm run seo:verify-prod
```

## Deployment Notes

**Required before merge:**
1. Add LHCI_GITHUB_APP_TOKEN to GitHub Secrets
2. Verify NEXT_PUBLIC_SUPABASE_* secrets exist
3. Enable branch protection requiring Lighthouse CI

**After merge:**
1. Run `npm run seo:verify-prod` to verify production
2. Manually test: https://pagespeed.web.dev/analysis?url=https://www.heypsych.com
3. Verify canonical redirects: curl -I https://heypsych.com/

## Breaking Changes

None. All changes are additive.

## Rollback Plan

If issues occur:
```bash
git revert 787ebe6
```

Specific rollbacks:
- Viewport issues: Remove viewport export from layout.tsx
- Redirect loop: Disable middleware.ts
- Indexing issues: Comment out robots meta generation

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## 🔍 VERIFICATION CHECKLIST (After PR Created)

### Automated Checks (GitHub Actions)

Wait for CI to complete, then verify:

- [ ] ✅ Lighthouse CI job runs successfully
- [ ] ✅ SEO score = 100/100 for all 7 test URLs
- [ ] ✅ No flaky failures (median across 3 runs is stable)
- [ ] ✅ Artifacts uploaded (HTML reports available)
- [ ] ✅ PR comment posted with results

**If CI fails:**
1. Check Actions logs for specific errors
2. Common issues:
   - Missing LHCI_GITHUB_APP_TOKEN secret
   - Database connection timeout (check Supabase secrets)
   - Build failures (check npm install logs)

---

### Manual Sanity Checks (5 minutes)

**AFTER CI passes, before merging:**

#### Test 1: Canonical Redirects

```bash
# Test non-www → www redirect
curl -I https://heypsych.com/

# Expected: HTTP/1.1 301 Moved Permanently
# Expected: Location: https://www.heypsych.com/

# Verify path preservation
curl -I https://heypsych.com/conditions/depression

# Expected: Location: https://www.heypsych.com/conditions/depression
```

**Note:** Cannot fully test until deployed to production/staging.

#### Test 2: Indexability Verification

**"Should Index" pages (verify `robots: {index: true}`):**

Test 5 representative pages:
1. https://www.heypsych.com/
2. https://www.heypsych.com/conditions/depression-major-depressive-disorder
3. https://www.heypsych.com/treatments/sertraline-zoloft
4. https://www.heypsych.com/treatments
5. https://www.heypsych.com/resources

**How to verify:**
1. Build locally: `npm run build`
2. Start server: `npm run start`
3. View page source
4. Check for `<meta name="robots" content="index, follow">`

**"Should NOT Index" pages (verify `robots: {index: false}`):**

Test placeholder pages (if any exist):
- Psychiatrist pages with "coming soon" review sections
- Any pages with <100 words content

**How to verify:**
1. Check page source for `<meta name="robots" content="noindex, follow">`

**Automated check:**
```bash
# Run sitemap validation (requires DB access)
npm run validate:sitemap
```

---

## ✅ MERGE CRITERIA

**All must be ✅ before merging:**

### Required Checks
- [ ] Dependencies installed (@lhci/cli, glob)
- [ ] GitHub secrets configured (LHCI_GITHUB_APP_TOKEN)
- [ ] Branch protection enabled (requires Lighthouse CI)
- [ ] Lighthouse CI passes with SEO = 100/100 on all URLs
- [ ] No flaky CI failures
- [ ] Canonical redirects work (tested locally or staging)
- [ ] 5 "should index" pages verified indexable
- [ ] Placeholder pages verified noindex (if any exist)

### Optional (Recommended)
- [ ] Manual Lighthouse audit on staging/preview: https://pagespeed.web.dev/
- [ ] Verified sitemap generates correctly
- [ ] Reviewed PR comments from CI

---

## 🚀 POST-MERGE VERIFICATION

**Immediately after merge and deploy:**

### 1. Run Production Verification

```bash
npm run seo:verify-prod
```

Expected output:
```
✅ Non-www → www redirect working
✅ All hub pages accessible
✅ robots.txt contains canonical URL
✅ Sitemap accessible (HTTP 200)
✅ Sitemap contains canonical URLs
✅ Viewport meta tag present
✅ Title tag present
✅ Meta description present
✅ Canonical link present
```

### 2. Manual Lighthouse Audit

1. Visit https://pagespeed.web.dev/
2. Test URLs:
   - https://www.heypsych.com/
   - https://www.heypsych.com/treatments
   - https://www.heypsych.com/conditions/depression-major-depressive-disorder
   - https://www.heypsych.com/treatments/sertraline-zoloft
3. Verify **SEO = 100/100** on all

### 3. Verify in Google Search Console

1. Log in to Google Search Console
2. Go to Coverage report
3. Check for:
   - No "Excluded by noindex" for important pages
   - Canonical URLs all use www subdomain
   - No crawl errors

---

## 🔥 ROLLBACK PLAN

If **SEO score drops** or **critical issues** occur after merge:

### Immediate Rollback

```bash
git revert 787ebe6
git push origin main
```

### Targeted Fixes (if rollback not needed)

**Issue: Viewport breaks mobile layout**
```typescript
// Remove from src/app/layout.tsx
// export const viewport = { ... }
```

**Issue: Redirect loop**
```typescript
// Disable src/middleware.ts temporarily
// Comment out or add early return
```

**Issue: Pages wrongly noindexed**
```typescript
// src/lib/seo/metadata-generator.ts
// Comment out robots meta generation line 57-119
```

**Issue: CI blocks legitimate merges**
```json
// lighthouserc.json - temporarily lower threshold
"categories:seo": ["error", {"minScore": 0.95}]
```

---

## 📞 SUPPORT

**Documentation:**
- Main runbook: `docs/seo-lighthouse-100.md`
- Implementation plan: `~/.claude/plans/goofy-hugging-nova.md`

**Common Commands:**
```bash
# Pre-deployment full check
npm run seo:check

# Post-deployment verification
npm run seo:verify-prod

# Quick Lighthouse audit
npm run lighthouse:quick

# Image alt audit
npm run audit:images

# Validate sitemap
npm run validate:sitemap
```

**Debug Checklist:**
1. Check GitHub Actions logs
2. Verify all secrets are set
3. Test locally with `npm run lighthouse:quick`
4. Review docs/seo-lighthouse-100.md troubleshooting section

---

## ✨ SUCCESS CRITERIA

**Definition of Done:**

- ✅ Lighthouse SEO = 100/100 on mobile + desktop
- ✅ All target URLs score 100 (7 templates)
- ✅ Canonical host consistent (www.heypsych.com)
- ✅ Permanent redirects working (non-www → www)
- ✅ No unintended noindex pages
- ✅ Lighthouse CI gates merges
- ✅ Documentation complete

**Merge when:**
- All automated checks ✅
- Manual verification complete ✅
- Production verification plan ready ✅

---

**Status:** ✅ Ready to push to GitHub
**Next step:** `git push -u origin feat/lighthouse-seo-100`
