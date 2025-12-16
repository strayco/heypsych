# Provider Egress Optimization - Deployment Checklist

**Phase 1: Diagnostics + Edge Caching** ✅ READY

---

## Pre-Deployment Verification

### 1. Review Changes ✅

Modified files:
- ✅ [src/app/api/providers/search/route.ts](src/app/api/providers/search/route.ts)

New files:
- ✅ [PROVIDER_EGRESS_OPTIMIZATION.md](PROVIDER_EGRESS_OPTIMIZATION.md) - Deployment guide
- ✅ [PROVIDER_PHASE2_JSONB_OPTIMIZATION.md](PROVIDER_PHASE2_JSONB_OPTIMIZATION.md) - Future optimization
- ✅ [scripts/update-provider-version.sh](scripts/update-provider-version.sh) - Cache-busting helper
- ✅ [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - This file

### 2. Test Locally (5 minutes)

```bash
# Start dev server
npm run dev

# Test provider search
curl "http://localhost:3000/api/providers/search?state=CA&limit=10" | jq '.providers | length'

# Should return 10 providers

# Check response includes new fields
curl "http://localhost:3000/api/providers/search?state=CA&limit=1" | jq '.dataVersion'

# Should return "2025-12"
```

### 3. Check TypeScript Build

```bash
npx tsc --noEmit

# Should show no errors
```

---

## Deployment Steps

### Option A: Deploy Immediately

```bash
# Stage changes
git add src/app/api/providers/search/route.ts \
  PROVIDER_EGRESS_OPTIMIZATION.md \
  PROVIDER_PHASE2_JSONB_OPTIMIZATION.md \
  scripts/update-provider-version.sh \
  DEPLOYMENT_CHECKLIST.md

# Commit with descriptive message
git commit -m "feat(providers): add egress diagnostics + aggressive edge caching

Phase 1 Optimizations:
- Add comprehensive logging (query time, egress estimation, filters)
- Implement 1-hour edge cache + 24-hour stale-while-revalidate
- Add cache-busting via PROVIDER_DATA_VERSION (2025-12)
- Add field validation to detect data quality issues from imports

Expected Impact:
- 60-80% reduction in Supabase egress (cached repeat searches)
- Detailed metrics for monitoring and future optimization

Docs:
- PROVIDER_EGRESS_OPTIMIZATION.md - Deployment & monitoring guide
- PROVIDER_PHASE2_JSONB_OPTIMIZATION.md - Future JSONB optimization (if needed)
- scripts/update-provider-version.sh - Cache-busting helper

Provider-only scope - no changes to treatments/medications/conditions"

# Push to trigger deployment
git push origin main
```

### Option B: Review First

```bash
# Create a review branch
git checkout -b feature/provider-egress-optimization

# Stage and commit
git add -A
git commit -m "feat(providers): add egress diagnostics + edge caching"

# Push for review
git push origin feature/provider-egress-optimization

# Create PR on GitHub
# After review, merge to main to deploy
```

---

## Post-Deployment Verification (15 minutes)

### 1. Check Deployment Status

```bash
# Via Vercel CLI
vercel ls

# Or check dashboard: vercel.com → Your Project → Deployments
```

Wait until status = "Ready" (usually 2-5 minutes)

### 2. Verify New Headers

```bash
curl -I "https://your-production-domain.com/api/providers/search?state=CA&limit=10"
```

**Should see:**
```
HTTP/2 200
cache-control: public, s-maxage=3600, stale-while-revalidate=86400
x-provider-data-version: 2025-12
x-estimated-egress-kb: 41.50
```

### 3. Verify Response Structure

```bash
curl "https://your-production-domain.com/api/providers/search?state=CA&limit=5" | jq .
```

**Should include:**
```json
{
  "providers": [...],
  "totalCount": 12345,
  "loadTimeMs": 234,
  "dataVersion": "2025-12"
}
```

### 4. Test UI Still Works

1. Visit `https://your-domain.com/psychiatrists`
2. Enter search filters (state, city, specialty)
3. Click "Apply Filters"
4. Verify provider cards display correctly:
   - ✅ Names + credentials
   - ✅ Locations
   - ✅ Specialties
   - ✅ No broken UI

5. Click "View Profile" on a provider
6. Verify detail page loads correctly

### 5. Check Logs for New Metrics

```bash
# Via Vercel CLI (real-time)
vercel logs --follow

# Or via dashboard: Logs tab
```

**Look for:**
```
✅ Provider search complete {
  resultCount: 50,
  queryTimeMs: 234,
  estimatedEgressKB: "41.50",
  dataVersion: "2025-12",
  filters: { hasState: true, ... }
}
```

### 6. Test Cache Behavior

```bash
# First request (cache miss - should be slower)
time curl "https://your-domain.com/api/providers/search?state=CA&limit=10" > /dev/null

# Wait 2 seconds, then second request (cache hit - should be faster)
sleep 2
time curl "https://your-domain.com/api/providers/search?state=CA&limit=10" > /dev/null
```

**Expected:**
- First request: 200-500ms
- Second request: <50ms (cached at edge)

---

## Monitoring (24-48 Hours)

### Daily Check (Day 1-2)

1. **Check Vercel Logs**
   ```bash
   vercel logs | grep "estimatedEgressKB" | tail -20
   ```

   Look for:
   - Consistent egress estimates (~41-42 KB for 50 providers)
   - No errors or warnings
   - Variety of filter combinations

2. **Check Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/ceqfyvzexvjlmqusscid
   - Navigate: Reports → Database → Egress
   - Compare to pre-deployment baseline
   - **Expected:** 60-80% reduction if caching is working

3. **Check for Field Validation Warnings**
   ```bash
   vercel logs | grep "missing fields"
   ```

   If you see warnings, note which providers/fields are problematic

### After 48 Hours

Review metrics and decide:

**✅ Success (Egress reduced by 60%+):**
- Keep Phase 1 as-is
- Update `PROVIDER_DATA_VERSION` after next monthly upload
- Monitor ongoing

**⚠️ Partial Success (Egress reduced by 20-50%):**
- Investigate cache hit rate (might be low unique searches)
- Consider implementing Phase 2 (JSONB optimization)
- Review `PROVIDER_PHASE2_JSONB_OPTIMIZATION.md`

**❌ No Improvement (<20% reduction):**
- Check if caching is working (verify headers)
- Check if high unique search volume (many different queries)
- Implement Phase 2 (JSONB optimization) immediately

---

## Monthly Maintenance

After each NPPES data import:

### 1. Update Cache Version

```bash
# Use helper script (automatically uses current YYYY-MM)
./scripts/update-provider-version.sh

# Or manually specify version
./scripts/update-provider-version.sh 2026-01
```

### 2. Review Changes

```bash
git diff src/app/api/providers/search/route.ts
```

### 3. Commit and Deploy

```bash
git add src/app/api/providers/search/route.ts
git commit -m "chore: update provider data version to 2026-01"
git push origin main
```

### 4. Verify New Version

```bash
curl "https://your-domain.com/api/providers/search?state=CA&limit=1" | jq .dataVersion

# Should show new version: "2026-01"
```

---

## Rollback (If Needed)

If anything breaks:

```bash
# Quick revert
git revert HEAD
git push origin main

# Or restore specific file
git checkout HEAD~1 -- src/app/api/providers/search/route.ts
git commit -m "revert: restore provider API to previous state"
git push origin main
```

**Recovery time:** 2-5 minutes (Vercel auto-deploys on push)

---

## Success Metrics

### Immediate (First 24 Hours)
- ✅ No errors in logs
- ✅ Provider search still works
- ✅ New metrics appear in logs
- ✅ Cache headers present in responses

### Short-term (48 Hours)
- ✅ Supabase egress reduced by 60-80%
- ✅ Fast response times for repeat searches (<50ms)
- ✅ No UI regressions reported

### Long-term (Ongoing)
- ✅ Stable egress costs
- ✅ Good user experience (fast searches)
- ✅ Easy monthly maintenance (version updates)

---

## Contact

**Issues or questions?**
- Check [PROVIDER_EGRESS_OPTIMIZATION.md](PROVIDER_EGRESS_OPTIMIZATION.md) for detailed guide
- Check logs: `vercel logs --follow`
- Check Supabase dashboard for egress metrics
- If Phase 2 needed, see [PROVIDER_PHASE2_JSONB_OPTIMIZATION.md](PROVIDER_PHASE2_JSONB_OPTIMIZATION.md)

---

## Status

- [x] Code changes complete
- [x] Documentation complete
- [x] Local testing complete (pending your verification)
- [ ] Deployed to production
- [ ] Post-deployment verification complete
- [ ] 48-hour monitoring complete

**Ready to deploy!** 🚀
