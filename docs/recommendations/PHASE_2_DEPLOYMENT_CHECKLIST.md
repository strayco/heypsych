# Phase 2 Deployment Checklist

Complete checklist for Phase 2 SEO Foundation deployment and post-launch monitoring.

## Pre-Deployment Validation

### 1. SEO Metrics Check

```bash
npm run seo:metrics
```

**Required Thresholds:**
- ✅ Health Score: ≥ 90/100
- ✅ Metadata Coverage: 100% title, ≥95% description
- ✅ Schema Coverage: 100%
- ✅ Avg Links/Page: ≥ 10
- ✅ Orphan Pages: 0
- ✅ Broken Links: 0
- ✅ E-A-T Coverage: ≥50% author, ≥30% medical reviewer

**If Failures:**
- Review issues list from metrics output
- Fix all critical issues
- Re-run metrics until all checks pass

### 2. SEO Validation

```bash
npm run seo:validate
```

**Validates:**
- ✅ Metadata generation for all entities
- ✅ Schema.org markup structure
- ✅ Sitemap XML well-formedness
- ✅ Required fields present
- ✅ Character length limits

**If Failures:**
- Check validation error output
- Fix schema/metadata generation issues
- Re-run validation

### 3. TypeScript & Linting

```bash
npm run typecheck
npm run lint
npm run format:check
```

**All must pass with zero errors.**

### 4. Build Verification

```bash
npm run build
```

**Verify:**
- ✅ Build completes without errors
- ✅ No TypeScript compilation errors
- ✅ All pages generate successfully
- ✅ Static generation for entity pages works
- ✅ Check build output logs for warnings

---

## CI/CD Pipeline

### GitHub Actions Workflow

Located: `.github/workflows/seo-quality.yml`

**Jobs:**
1. **seo-validation** - Runs metrics, blocks on issues
2. **schema-validation** - Validates schema.org markup
3. **sitemap-validation** - Validates XML sitemaps

**Quality Gates:**
- ❌ Blocks deployment if health score < 90
- ❌ Blocks if any critical issues found
- ❌ Blocks if broken links detected
- ❌ Blocks if orphan pages exist
- ⚠️  Warns but allows if warnings present

**Artifact Output:**
- SEO metrics JSON report uploaded to artifacts
- Retained for 30 days
- Available for download from GitHub Actions

---

## Full QA Pass

### Schema QA

For each entity type (condition, medication, therapy, resource):

**Verify Schema Generation:**
1. Navigate to entity detail page
2. View page source
3. Search for `<script type="application/ld+json"`
4. Validate schema presence:
   - ✅ Primary schema (MedicalCondition/Drug/MedicalTherapy/MedicalRiskEstimator)
   - ✅ MedicalWebPage wrapper
   - ✅ BreadcrumbList navigation
   - ✅ Person schema (if author/reviewer present)
   - ✅ FAQPage (if FAQs present)

**Test with Google Rich Results Test:**
1. Go to: https://search.google.com/test/rich-results
2. Enter page URL or paste HTML
3. Verify no errors
4. Check recognized schema types

**Sample Pages to Test:**
- `/conditions/major-depressive-disorder`
- `/treatments/sertraline`
- `/treatments/cognitive-behavioral-therapy`
- `/resources/assessments-screeners/phq-9`

### Metadata QA

**Check Every Entity Type:**

1. **Title Tags**
   - ✅ Present on all pages
   - ✅ Unique per page
   - ✅ 50-60 characters
   - ✅ Includes primary keyword
   - ✅ Follows format: "[Entity] | [Category] | HeyPsych"

2. **Meta Descriptions**
   - ✅ Present on all pages
   - ✅ Unique per page
   - ✅ 150-160 characters
   - ✅ Compelling and actionable
   - ✅ Includes primary + secondary keywords

3. **Open Graph Tags**
   - ✅ og:title present
   - ✅ og:description present
   - ✅ og:image present (1200x630 recommended)
   - ✅ og:url present (canonical)
   - ✅ og:type = "website"

4. **Twitter Card Tags**
   - ✅ twitter:card = "summary_large_image"
   - ✅ twitter:title present
   - ✅ twitter:description present

5. **Canonical URLs**
   - ✅ Present on all pages
   - ✅ Absolute URLs (not relative)
   - ✅ Self-referencing

**Verification Tools:**
- [Open Graph Debugger](https://www.opengraph.xyz/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- Browser DevTools (view source)

### Internal Link QA

**Verify Link Generation:**

1. **Condition Pages**
   - ✅ Treatment Options section appears
   - ✅ Related Conditions section appears
   - ✅ Assessment CTAs appear
   - ✅ Related Articles appear
   - ✅ Minimum 10 internal links per page
   - ✅ Anchor text varies (not repetitive)
   - ✅ Links go to correct targets

2. **Treatment Pages**
   - ✅ Conditions Treated section appears
   - ✅ Related Treatments section appears
   - ✅ Drug class links (for medications)
   - ✅ Alternative treatments linked
   - ✅ Anchor text natural and varied

3. **Assessment Pages**
   - ✅ Conditions This Assessment Screens For
   - ✅ Treatment Options linked
   - ✅ Other Assessment Tools linked
   - ✅ Related Resources linked

**Check Reciprocal Links:**
- Navigate from Page A to Page B
- Verify Page B links back to Page A
- Confirm bidirectional enforcement working

**Test Link Quality:**
- ✅ No broken links (404s)
- ✅ No self-links in related sections
- ✅ Links go to active pages only
- ✅ Anchor text matches target page title

### E-A-T Component QA

**Verify on Clinical Pages:**

1. **AuthorByline Component**
   - ✅ Shows author name + credentials
   - ✅ Shows medical reviewer (if present)
   - ✅ Published/updated dates display
   - ✅ Verified badge appears (if verified)
   - ✅ Bio text appears (if present)

2. **MedicalReviewBadge**
   - ✅ Appears on medically reviewed content
   - ✅ Shows reviewer name + credentials
   - ✅ Review date displays
   - ✅ Compact mode in header works

3. **ContentTimestamps**
   - ✅ Published date appears
   - ✅ Last updated date appears
   - ✅ Last reviewed date appears (if applicable)
   - ✅ Dates formatted correctly

4. **MedicalDisclaimer**
   - ✅ Appears on all clinical pages
   - ✅ Entity-specific text (condition/medication/therapy/assessment)
   - ✅ Crisis line appears on sensitive content
   - ✅ Prominent styling appropriate

5. **CrisisSupportBanner**
   - ✅ Appears on depression/suicide-related pages
   - ✅ 988 Suicide & Crisis Lifeline displayed
   - ✅ Crisis Text Line displayed
   - ✅ SAMHSA National Helpline displayed
   - ✅ Links functional

6. **CitationList**
   - ✅ Appears when references present
   - ✅ Citations formatted correctly
   - ✅ DOI links working
   - ✅ PMID links working
   - ✅ External links open in new tab

### Cluster QA

**Run Cluster Analysis:**

```bash
# Add to scripts if not exists
tsx scripts/analyze-clusters.ts
```

**Verify:**
- ✅ Condition clusters formed correctly
- ✅ Drug class clusters logical
- ✅ Therapy modality clusters accurate
- ✅ Assessment category clusters valid
- ✅ Cluster strength scores reasonable (>30)
- ✅ No unexpected orphans
- ✅ Cluster boundaries make semantic sense

### Sitemap QA

**Verify Sitemap Generation:**

1. **Sitemap Index**
   - URL: `/sitemap-index.xml`
   - ✅ Well-formed XML
   - ✅ Lists all sub-sitemaps
   - ✅ Lastmod dates present

2. **Sub-Sitemaps**
   - `/sitemap-conditions.xml` - All condition pages
   - `/sitemap-treatments.xml` - All treatment pages
   - `/sitemap-assessments.xml` - All assessment pages
   - `/sitemap-resources.xml` - Other resource pages
   - `/sitemap-hubs.xml` - Hub/category pages
   - `/sitemap-static.xml` - Static pages

**For Each Sitemap:**
- ✅ Well-formed XML (no syntax errors)
- ✅ All URLs use HTTPS
- ✅ All URLs are absolute (not relative)
- ✅ Priority values appropriate (0.0-1.0)
- ✅ Changefreq values valid
- ✅ Lastmod dates present and valid
- ✅ < 50,000 URLs per file
- ✅ < 50MB file size

**Validation Tools:**
- [XML Sitemap Validator](https://www.xml-sitemaps.com/validate-xml-sitemap.html)
- Google Search Console Sitemap Report
- Screaming Frog SEO Spider

---

## Deployment Steps

### Staging Deployment

1. **Deploy to Vercel Staging**
   ```bash
   git push origin develop
   ```

2. **Run Full Metrics on Staging**
   ```bash
   NEXT_PUBLIC_SITE_URL=https://staging.heypsych.com npm run seo:metrics
   ```

3. **Manual QA on Staging**
   - Test 10 random entity pages
   - Verify schema in Rich Results Test
   - Check metadata in OG debugger
   - Verify internal links functional
   - Test E-A-T components display
   - Verify sitemaps accessible

4. **Performance Test**
   - Run Lighthouse on 5 pages
   - Target: Performance ≥ 90
   - Target: SEO score = 100
   - Target: Accessibility ≥ 90

5. **Regression Test**
   - Verify all existing functionality works
   - Test search still functional
   - Test provider directory still works
   - Test assessment tools still work

### Production Deployment

1. **Merge to Main**
   ```bash
   git checkout main
   git merge develop
   git push origin main
   ```

2. **Verify Production Build**
   - Monitor Vercel deployment
   - Check build logs for errors
   - Verify deployment completes successfully

3. **Post-Deploy Verification**
   - Access production site
   - Test 5 entity pages
   - Verify sitemaps accessible
   - Check schema renders correctly
   - Verify no 500 errors

4. **Submit Sitemap to Google**
   - Go to Google Search Console
   - Navigate to Sitemaps
   - Add sitemap URL: `https://heypsych.com/sitemap-index.xml`
   - Click Submit
   - Verify no errors

5. **Enable Monitoring**
   - Verify Sentry error tracking active
   - Check Vercel Analytics configured
   - Monitor initial traffic patterns
   - Watch for any error spikes

---

## Post-Launch Monitoring

### Week 1: Immediate Monitoring

**Daily Checks:**

1. **Google Search Console**
   - Check Coverage report (no new errors)
   - Monitor Index status (pages being indexed)
   - Check Sitemaps status (submitted successfully)
   - Review Performance report (impressions/clicks)
   - Watch for manual actions

2. **Schema Validation**
   - Check Rich Results report in GSC
   - Monitor schema error counts
   - Watch for new schema issues
   - Verify rich results appearing

3. **Error Monitoring**
   - Sentry: Check for new errors
   - Vercel: Monitor function errors
   - Watch for 404s or 500s
   - Check sitemap fetch errors

4. **Performance**
   - Core Web Vitals in GSC
   - Lighthouse scores for key pages
   - Page load times
   - Server response times

### Week 2-4: Active Indexing Phase

**Weekly Checks:**

1. **Indexing Progress**
   - Track pages indexed vs submitted
   - Monitor index coverage
   - Identify pages not indexed (investigate why)
   - Check crawl stats

2. **Rich Results**
   - Verify rich snippets appearing in SERPs
   - Check FAQ schema rendering
   - Monitor breadcrumb display
   - Watch for schema markup errors

3. **Internal Link Analysis**
   - Run metrics weekly
   - Monitor orphan page count
   - Check average links/page holds
   - Verify no broken links emerged

4. **Rankings Baseline**
   - Track target keyword positions
   - Monitor SERP features
   - Note any featured snippets
   - Track competitor rankings

### Month 2-3: Stabilization

**Bi-Weekly Checks:**

1. **SEO Health Metrics**
   ```bash
   npm run seo:metrics --output=reports/week-N.json
   ```
   - Compare to baseline
   - Track health score trend
   - Monitor any degradation
   - Fix issues immediately

2. **Search Console Deep Dive**
   - Analyze top queries
   - Review top pages
   - Check CTR trends
   - Identify optimization opportunities

3. **Content Gaps**
   - Review pages with low impressions
   - Identify missing internal links
   - Check cluster coverage
   - Plan content additions

### Ongoing Maintenance

**Monthly:**
- Full SEO metrics report
- Cluster analysis
- Internal link audit
- Schema validation
- Sitemap verification
- Competitive analysis

**Quarterly:**
- Comprehensive content audit
- E-A-T review (add/update author info)
- Update medical review dates
- Refresh outdated content
- Add new references/citations

---

## Success Metrics

### Technical SEO KPIs

- **Indexing:** 100% of pages indexed within 30 days
- **Schema:** 0 schema errors in GSC
- **Core Web Vitals:** All "Good" status
- **Mobile Usability:** 0 issues
- **Security:** HTTPS everywhere, no mixed content

### Content Quality KPIs

- **Internal Links:** Avg ≥ 10 links/page maintained
- **Orphan Pages:** 0 orphan pages
- **Broken Links:** 0 broken internal links
- **E-A-T Coverage:** ≥ 50% pages with author info
- **Medical Review:** ≥ 30% clinical pages medically reviewed

### Search Performance KPIs

- **Impressions:** Track growth week-over-week
- **Clicks:** Track CTR improvements
- **Rankings:** Monitor target keyword positions
- **Rich Results:** Count of pages with rich snippets
- **Featured Snippets:** Track acquisitions

### Health Score

- **Target:** ≥ 90/100 consistently
- **Alert Threshold:** < 85/100 requires immediate action
- **Weekly Tracking:** Graph trend over time

---

## Rollback Plan

If critical issues detected post-deployment:

1. **Immediate Actions**
   - Revert to previous deployment
   - Notify team of rollback
   - Document issue encountered

2. **Investigation**
   - Pull production logs
   - Reproduce issue locally
   - Identify root cause
   - Create fix plan

3. **Fix & Redeploy**
   - Implement fix in develop
   - Run full QA suite
   - Re-run metrics validation
   - Deploy to staging
   - Verify fix works
   - Redeploy to production

4. **Post-Mortem**
   - Document what went wrong
   - Identify prevention measures
   - Update QA checklist
   - Add automated tests

---

## Contact & Escalation

**For Issues:**
1. Check logs (Vercel + Sentry)
2. Review documentation
3. Run diagnostics (`npm run seo:metrics`)
4. Create GitHub issue if bug found
5. Escalate if critical SEO impact

**Critical Issues** (require immediate attention):
- Sitemap not accessible
- Schema errors preventing indexing
- Large number of 404s/500s
- Health score < 70
- GSC manual actions

---

## Completion Criteria

Phase 2 is considered **fully deployed** when:

✅ All pre-deployment checks pass
✅ CI/CD pipeline runs successfully
✅ Staging QA completed with zero issues
✅ Production deployment successful
✅ Sitemap submitted to Google Search Console
✅ No errors in first 24 hours of monitoring
✅ Health score ≥ 90/100 in production
✅ Schema.org validation passes
✅ Internal links functional
✅ E-A-T components displaying
✅ Post-launch monitoring active

**Final Sign-Off:** Product Owner + Tech Lead
