# Provider Egress Optimization - Implementation Guide

**Status:** Phase 1 (Diagnostics + Caching) - ✅ READY TO DEPLOY

---

## Phase 1: Diagnostics + Edge Caching (CURRENT)

### What Changed

1. **Enhanced Logging** - Track egress metrics
   - Result count
   - Query time (ms)
   - **Estimated egress (KB)** - ~850 bytes per provider
   - Data version
   - Filter usage
   - Missing field warnings

2. **Aggressive Edge Caching** - Reduce Supabase hits
   - `s-maxage=3600` - Cache at Vercel Edge for **1 hour**
   - `stale-while-revalidate=86400` - Serve stale up to **24 hours** while revalidating
   - **Expected impact:** 80-95% reduction in Supabase queries for repeat searches

3. **Cache-Busting Mechanism** - Monthly data updates
   - Version constant: `PROVIDER_DATA_VERSION = "2025-12"`
   - Update after monthly uploads to invalidate edge cache
   - Included in API response + custom headers for debugging

4. **Field Validation** - Detect data quality issues
   - Warns if critical fields missing: `first_name`, `last_name`, `credentials`, `address`, `specialties`
   - Helps catch issues from monthly import script

---

## Deployment Steps

### 1. Test Locally (5 minutes)

```bash
# Start dev server
npm run dev

# Test provider search
curl "http://localhost:3000/api/providers/search?state=CA&limit=10"

# Check logs for new metrics:
# - ✅ Provider search complete
# - estimatedEgressKB
# - queryTimeMs
# - dataVersion
```

### 2. Deploy to Production (10 minutes)

```bash
# Commit changes
git add src/app/api/providers/search/route.ts
git commit -m "feat(providers): add egress diagnostics + edge caching

- Add comprehensive logging (query time, egress estimation, filter usage)
- Implement aggressive edge caching (1h cache, 24h stale-while-revalidate)
- Add cache-busting mechanism via PROVIDER_DATA_VERSION constant
- Add field validation to detect data quality issues

Expected impact: 80-95% reduction in Supabase egress from repeat searches"

# Push to main (triggers Vercel deployment)
git push origin main
```

### 3. Monitor Logs (24-48 hours)

After deployment, check Vercel logs for:

```bash
# Via Vercel CLI
vercel logs --follow

# Or via dashboard: vercel.com → Your Project → Logs
```

**Look for:**
```json
{
  "message": "✅ Provider search complete",
  "resultCount": 50,
  "queryTimeMs": 245,
  "estimatedEgressKB": "41.50",
  "estimatedEgressBytes": 42500,
  "dataVersion": "2025-12",
  "filters": {
    "hasState": true,
    "hasCity": false,
    // ...
  }
}
```

### 4. Check Supabase Dashboard (48 hours post-deploy)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/ceqfyvzexvjlmqusscid)
2. Navigate to **Reports** → **Database** → **Egress**
3. Compare egress **before vs. after deployment**

**Expected results:**
- **Before:** ~40-50 KB per search × 1000 searches = 40-50 MB/day
- **After caching:** ~40-50 KB per **unique** search (cached for 1 hour)
  - If 80% of searches are repeat queries: **8-10 MB/day** (80% reduction)

---

## Cache-Busting: Monthly Data Updates

After importing new provider data (monthly NPPES updates):

### Step 1: Update Version Constant

Edit [src/app/api/providers/search/route.ts](src/app/api/providers/search/route.ts):

```typescript
// BEFORE
const PROVIDER_DATA_VERSION = "2025-12";

// AFTER (example for January 2026 data)
const PROVIDER_DATA_VERSION = "2026-01";
```

### Step 2: Deploy

```bash
git add src/app/api/providers/search/route.ts
git commit -m "chore: update provider data version to 2026-01"
git push origin main
```

**What happens:**
- New version invalidates all edge-cached responses
- First search after update fetches fresh data from database
- Subsequent searches use newly cached data for 1 hour

### Step 3: Verify

Check API response includes new version:

```bash
curl "https://your-domain.com/api/providers/search?state=CA&limit=10"
```

Look for:
```json
{
  "providers": [...],
  "dataVersion": "2026-01"  // ← Should match new version
}
```

---

## Monitoring Egress Metrics

### Via Vercel Logs (Real-time)

```bash
# Follow logs
vercel logs --follow

# Filter for egress metrics
vercel logs --follow | grep "estimatedEgressKB"
```

**Example output:**
```
✅ Provider search complete { estimatedEgressKB: "41.50", resultCount: 50, queryTimeMs: 234 }
✅ Provider search complete { estimatedEgressKB: "16.60", resultCount: 20, queryTimeMs: 156 }
```

### Via Custom Script (Daily Summary)

Create a simple log parser:

```bash
# scripts/analyze-provider-egress.sh
#!/bin/bash

# Fetch last 24 hours of logs
vercel logs --since 24h > /tmp/vercel-logs.txt

# Extract egress metrics
grep "estimatedEgressKB" /tmp/vercel-logs.txt | \
  jq -r '.estimatedEgressKB' | \
  awk '{sum+=$1; count++} END {print "Total egress:", sum, "KB from", count, "queries"}'
```

### Via Supabase SQL (Database-side)

Run in Supabase SQL Editor:

```sql
-- Provider query frequency (last 24 hours)
SELECT
  calls,
  rows,
  (calls * rows * 850 / 1024.0)::numeric(10,2) as estimated_egress_kb,
  LEFT(query, 100) as query_preview
FROM pg_stat_statements
WHERE query LIKE '%type%provider%'
  AND query LIKE '%SELECT%'
ORDER BY calls DESC
LIMIT 10;
```

---

## Phase 2: JSONB Field Selection (IF NEEDED)

**⚠️ Only implement if Phase 1 caching is insufficient**

If after 48 hours you're still seeing high egress:

### Current Query (Line 82-84 in route.ts)

```typescript
.select("slug, content", { count: "exact" })
```

**Transfers:** Full `content` JSONB (~850 bytes) × 50 rows = **42.5 KB**

### Optimized Query (Phase 2)

```typescript
.select(`
  slug,
  content->>'npi',
  content->>'first_name',
  content->>'last_name',
  content->>'suffix',
  content->>'credentials',
  content->>'taxonomy_code',
  content->'specialties',
  content->'address',
  content->>'phone'
`, { count: "exact" })
```

**Transfers:** Only needed fields (~400 bytes) × 50 rows = **~20 KB** (50% savings)

### What Needs to Change

1. **Query shape** - Select specific JSONB fields
2. **Mapping code** - Handle flattened structure (lines 240-290)
3. **Testing** - Verify ProviderCard still works

**Estimated effort:** 2-3 hours (requires code changes + testing)

**When to do it:**
- Phase 1 caching reduces egress by <50%
- You're still exceeding Supabase egress limits
- High search volume (>1000 unique searches/day)

---

## Expected Results

### Phase 1 (Current) - Caching Only

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Repeated searches** | 42.5 KB each | ~0 KB (cached) | **100%** |
| **Unique searches** | 42.5 KB each | 42.5 KB each | 0% |
| **Total daily egress** | 40-50 MB | 8-20 MB | **60-80%** |

**Assumptions:**
- 1000 searches/day
- 80% are repeat queries (cached hits)
- 1-hour cache window captures most repeats

### Phase 2 (If implemented) - JSONB Optimization

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Unique searches** | 42.5 KB | 20 KB | **53%** |
| **Total daily egress** | 8-20 MB | 4-10 MB | **50%** |

**Combined Phases 1+2:**
- Overall reduction: **75-90%** from baseline

---

## Troubleshooting

### Issue: Logs don't show egress metrics

**Check:**
```bash
# Ensure deployment succeeded
vercel ls

# Check if new code is deployed
curl "https://your-domain.com/api/providers/search?state=CA&limit=1" -I | grep "X-Provider-Data-Version"
```

Should see: `X-Provider-Data-Version: 2025-12`

### Issue: Cache not working

**Verify cache headers:**
```bash
curl -I "https://your-domain.com/api/providers/search?state=CA&limit=10"
```

Look for:
```
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
X-Provider-Data-Version: 2025-12
```

**Check Vercel Edge caching:**
- First request should be slow (~200-500ms)
- Second request should be fast (<50ms) if cached

### Issue: Missing field warnings in logs

**Example:**
```
⚠️ Provider npi-1234567890 missing fields: ["credentials", "specialties"]
```

**Action:**
1. Investigate provider data import script
2. Check source NPPES data for that NPI
3. Add fallback handling if field is commonly missing

---

## Rollback Plan

If issues arise after deployment:

```bash
# Revert the commit
git revert HEAD

# Deploy rollback
git push origin main
```

**Or manually revert changes:**
1. Remove `PROVIDER_DATA_VERSION` constant
2. Restore old cache headers: `s-maxage=180, stale-while-revalidate=300`
3. Remove enhanced logging
4. Deploy

---

## Next Actions

1. ✅ **Deploy Phase 1** (current changes)
2. ⏳ **Monitor for 48 hours**
3. 📊 **Compare Supabase egress metrics**
4. 🎯 **Decide if Phase 2 (JSONB optimization) is needed**

---

## Questions?

- **How do I know if caching is working?** Check response times - cached responses should be <50ms
- **What if egress is still high?** Share logs + Supabase metrics, we'll implement Phase 2
- **How often should I update the version?** After each monthly NPPES import
- **Will this break anything?** No - it's additive (logging + caching), no breaking changes

---

**Ready to deploy!** 🚀
