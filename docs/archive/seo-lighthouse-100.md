# HeyPsych - Lighthouse SEO 100/100 Guide

Complete guide for maintaining and troubleshooting Lighthouse SEO 100/100 scores on HeyPsych.

## Table of Contents

- [Quick Start](#quick-start)
- [Running Lighthouse Locally](#running-lighthouse-locally)
- [Understanding Lighthouse CI](#understanding-lighthouse-ci)
- [Common SEO Issues & Fixes](#common-seo-issues--fixes)
- [Maintenance Checklist](#maintenance-checklist)
- [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Node.js 20+
- npm or yarn
- Database access (for sitemap generation)

### Running Pre-Deployment Checks

```bash
# Run full pre-deployment SEO validation
npm run seo:check

# Individual checks
npm run audit:images        # Check image alt text
npm run validate:sitemap    # Validate sitemap structure
npm run verify:hubs         # Verify hub pages return 200
```

### Running Lighthouse

```bash
# Quick single-run audit (fastest)
npm run lighthouse:quick

# Full 3-run median audit (most accurate)
npm run lighthouse:ci
```

---

## Running Lighthouse Locally

### Option 1: Using npm Scripts (Recommended)

```bash
# 1. Build the production bundle
npm run build

# 2. Start production server
npm run start

# 3. In another terminal, run Lighthouse
npm run lighthouse:quick
```

### Option 2: Using Chrome DevTools

1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "SEO" category
4. Click "Analyze page load"

### Option 3: Using PageSpeed Insights

1. Visit https://pagespeed.web.dev/
2. Enter your URL
3. Wait for analysis
4. Check "SEO" score

---

## Understanding Lighthouse CI

### How It Works

Lighthouse CI runs automatically on every PR and push to main:

1. **Triggers:** Push to `main` or PR against `main`
2. **Build:** Builds production Next.js bundle
3. **Server:** Starts local production server
4. **Audit:** Runs Lighthouse on 7 representative URLs
5. **Report:** Uploads results & comments on PR

### Tested URLs

- Homepage: `/`
- Treatments hub: `/treatments`
- Treatment category: `/treatments/supplements`
- Treatment detail: `/treatments/sertraline-zoloft`
- Condition detail: `/conditions/depression-major-depressive-disorder`
- Resources hub: `/resources`
- Psychiatrists: `/psychiatrists`

### Score Requirements

| Category | Requirement | Action on Failure |
|----------|-------------|-------------------|
| **SEO** | **100/100** | ❌ **Build fails** |
| Accessibility | 90+ | ⚠️ Warning |
| Best Practices | 90+ | ⚠️ Warning |
| Performance | 50+ | ℹ️ Info |

### Viewing Results

**In GitHub Actions:**
1. Go to Actions tab in GitHub
2. Click on the workflow run
3. Download "lighthouse-results" artifact
4. Open HTML reports in browser

**In PR Comments:**
Lighthouse CI automatically comments on PRs with summary results.

---

## Common SEO Issues & Fixes

### Issue 1: Missing Viewport Meta Tag

**Error:** "Document does not have a meta viewport tag"

**Fix:**
```typescript
// src/app/layout.tsx
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};
```

**Why:** Required by Lighthouse for mobile-friendliness scoring.

---

### Issue 2: Inconsistent Canonical URLs

**Error:** "Document has multiple conflicting rel=canonical tags"

**Fix:** Ensure all canonicals use www subdomain:
- ✅ `https://www.heypsych.com/page`
- ❌ `https://heypsych.com/page`

**Files to check:**
- `src/lib/seo/config.ts` (line 18)
- `src/app/sitemap.ts` (line 4)
- `public/robots.txt` (line 14)

---

### Issue 3: Missing Alt Text on Images

**Error:** "Image elements do not have [alt] attributes"

**Fix:**
```tsx
// ✅ Good: Descriptive alt
<Image src="/brain.png" alt="Brain scan showing TMS treatment area" />

// ✅ Good: Decorative image
<Image src="/decoration.png" alt="" />

// ❌ Bad: Missing alt
<Image src="/image.png" />
```

**Audit command:**
```bash
npm run audit:images
```

---

### Issue 4: Non-Indexable Pages

**Error:** "Page has unsuccessful HTTP status code"

**Causes:**
- Server errors (500)
- Client errors (404)
- Redirects without proper destination

**Fix:**
```bash
# Verify all hub pages
npm run verify:hubs

# Check specific page
curl -I https://www.heypsych.com/page
```

---

### Issue 5: Missing Meta Description

**Error:** "Document does not have a meta description"

**Fix:** Each page should have unique description in metadata generator:

```typescript
// src/lib/seo/metadata-generators/*.ts
return {
  title: "...",
  description: "Unique, descriptive 70-160 char description",
  // ...
};
```

---

### Issue 6: Broken robots.txt or Sitemap

**Error:** "robots.txt is not valid" or "Sitemap could not be fetched"

**Fix:**
```bash
# Validate sitemap
npm run validate:sitemap

# Check robots.txt locally
cat public/robots.txt

# Check in production
curl https://www.heypsych.com/robots.txt
curl https://www.heypsych.com/sitemap.xml
```

**Common issues:**
- Sitemap URL in robots.txt doesn't match actual sitemap path
- Non-www vs www mismatch
- Sitemap exceeds 50,000 URL limit

---

### Issue 7: Thin or Placeholder Content

**Error:** Pages with "coming soon" or very little content

**Fix:** Pages are automatically noindexed if:
- Explicit `seo.noindex = true` flag
- Status is not "active"
- Contains placeholder keywords ("coming soon", etc.)
- <100 words of content

**Check indexability:**
```typescript
// In metadata generator
robots: this.generateRobots(entity)
// Returns { index: false, follow: true } for thin content
```

---

## Maintenance Checklist

### Weekly

- [ ] Run `npm run seo:check` before deploying
- [ ] Verify Lighthouse CI passes on all PRs
- [ ] Check no new accessibility issues

### Monthly

- [ ] Run full Lighthouse audit on production
- [ ] Validate sitemap size (<50,000 URLs)
- [ ] Check Google Search Console for crawl errors

### Quarterly

- [ ] Review robots meta implementation for false positives
- [ ] Update SEO metadata for new entity types
- [ ] Audit image alt text compliance

### After Major Changes

- [ ] Run full pre-deployment checks
- [ ] Test canonical redirects manually
- [ ] Verify structured data with schema tester

---

## Troubleshooting

### Lighthouse CI Fails But Local Passes

**Possible causes:**
1. Environment variable mismatch
2. Database connectivity issues in CI
3. Build artifacts differ between environments

**Debug steps:**
```bash
# Check CI logs for errors
# Verify environment variables in GitHub Secrets
# Test with same Node version as CI (20.x)
node -v
```

---

### Canonical Redirect Loop

**Symptoms:** Browser shows "Too many redirects"

**Debug:**
```bash
# Test redirect chain
curl -L -v https://heypsych.com/
```

**Fix:** Check middleware.ts for conditions that might cause loop:
```typescript
// src/middleware.ts
// Ensure localhost and preview environments are excluded
if (hostname.includes('localhost') || hostname.includes('.vercel.app')) {
  return NextResponse.next();
}
```

---

### Sitemap Generation Fails

**Symptoms:** `npm run validate:sitemap` fails

**Common causes:**
1. Database connection timeout
2. Missing environment variables
3. Invalid entity data

**Debug:**
```bash
# Test database connection
node --env-file=.env.local scripts/validate-sitemap.mjs

# Check environment
echo $NEXT_PUBLIC_SUPABASE_URL
```

---

### Images Suddenly Fail Alt Text Audit

**Debug:**
```bash
# Run audit with details
npm run audit:images

# Find specific files
grep -r "<img" src/components/ | grep -v "alt="
```

**Fix:** Add alt attributes to all images or mark decorative images with `alt=""`.

---

### Hub Pages Return 404

**Debug:**
```bash
# Test locally
npm run verify:hubs

# Test specific hub
curl -I http://localhost:3000/treatments
```

**Common causes:**
1. Server not running
2. Database empty (run `npm run seed`)
3. Route misconfiguration

---

## Advanced Topics

### Custom Metadata for New Entity Types

When adding a new entity type, create a metadata generator:

```typescript
// src/lib/seo/metadata-generators/new-type.ts
import { MetadataGenerator } from '../metadata-generator';

export class NewTypeMetadataGenerator extends MetadataGenerator {
  async generate(entity: Entity): Promise<Metadata> {
    // Use helper methods
    const title = this.ensureTitleLength(`${entity.name} | HeyPsych`);
    const description = this.ensureDescriptionLength(entity.description);
    const canonical = this.generateCanonical(entity);

    return {
      title,
      description,
      alternates: { canonical },
      robots: this.generateRobots(entity), // Auto noindex for thin content
      openGraph: this.generateOpenGraph(title, description, canonical),
      twitter: this.generateTwitterCard(title, description),
    };
  }

  protected getPath(entity: Entity): string {
    return `/new-type/${entity.slug}`;
  }
}
```

---

### Modifying Robots Meta Rules

To adjust what gets noindexed, edit `src/lib/seo/metadata-generator.ts`:

```typescript
protected generateRobots(entity: Entity): Metadata['robots'] {
  // Add custom rules here
  if (entity.customFlag) {
    return { index: false, follow: true };
  }

  // Default logic...
}
```

**Be conservative:** False positives (noindexing good pages) hurt more than false negatives.

---

### Testing Canonical Redirects

```bash
# Test non-www → www redirect
curl -I https://heypsych.com/ | grep -i location

# Expected: Location: https://www.heypsych.com/

# Test that www doesn't redirect
curl -I https://www.heypsych.com/ | grep -i location

# Expected: No Location header (stays on www)
```

---

## Production Verification

After deploying, run:

```bash
npm run seo:verify-prod
```

This checks:
- ✅ Canonical redirects working
- ✅ All hub pages return 200
- ✅ robots.txt accessible and correct
- ✅ Sitemap accessible and contains canonical URLs
- ✅ Meta tags present on homepage

---

## Resources

### Official Documentation

- [Lighthouse SEO Audits](https://developer.chrome.com/docs/lighthouse/seo/)
- [Next.js Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)
- [Google Search Central](https://developers.google.com/search)

### Internal Documentation

- **Plan file:** `~/.claude/plans/goofy-hugging-nova.md`
- **Middleware:** `src/middleware.ts`
- **SEO Config:** `src/lib/seo/config.ts`
- **Metadata Generators:** `src/lib/seo/metadata-generators/`

### Useful Commands

```bash
# SEO
npm run seo:check              # Pre-deployment full check
npm run seo:verify-prod        # Post-deployment verification
npm run audit:images           # Check alt text
npm run validate:sitemap       # Validate sitemap

# Lighthouse
npm run lighthouse:quick       # Fast audit
npm run lighthouse:ci          # Full 3-run audit

# Verification
npm run verify:hubs            # Check hub pages
npm run validate:treatment     # Check treatment JSON schema
```

---

## Support

For issues or questions:

1. Check this guide first
2. Review [implementation plan](~/.claude/plans/goofy-hugging-nova.md)
3. Check GitHub Actions logs for CI failures
4. Test locally with `npm run lighthouse:quick`

---

**Last updated:** 2025-12-16
**Maintainer:** HeyPsych Engineering Team
