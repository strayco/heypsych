# HeyPsych Performance Optimization - Deployment Runbook

**Version:** 1.1 (consolidated)
**Date:** 2025-11-15
**Status:** Ready for Execution
**Latest Build:** ✅ Vercel iad1 · 2025-11-15 14:07 UTC · Next.js 15.5.6 · 54 static routes (SSG/ISR) · Bundle 148‑232 kB first load
**Content Sync:** ✅ `npm run sync:content` (2025-11-15 14:06 UTC) — 568 treatments, 130 conditions, 80 resources (0 errors)
**Outstanding Tasks:** ⏳ Apply Supabase migration + verify search performance → Deploy preview → Monitor → Promote to prod

> ℹ️  This runbook now replaces `DEPLOYMENT_COMPLETE.md` and `DEPLOY_NOW.md`. Treat it as the single source of truth for deployment steps, status, monitoring, and rollback procedures.

---

## Deployment Snapshot

- **Latest Build Output:** Static generation + type checks succeeded during the most recent Vercel build (`npm run build` → `next build`), matching the expected route table.
- **Database Status:** `entities` populated with 778 rows (active), awaiting only the full-text search migration (`supabase/migrations/add_fulltext_search.sql`).
- **Performance Scripts:** `scripts/verify-search-performance.sh` prepared; run immediately after applying the migration.
- **Next Production Moves:**
  1. Apply Supabase migration + verify indexes/function.
  2. Execute `./scripts/verify-search-performance.sh`.
  3. Deploy preview via `vercel --preview`, run smoke tests, and monitor for 24 h.
  4. Promote to production with `vercel --prod` once metrics stay green.

---

---

## Unified Deployment Checklist

| # | Action | Command / Link | Status | Notes |
|---|--------|----------------|--------|-------|
| 1 | Sync JSON → DB | `npm run sync:content` | ✅ (2025-11-15 14:06 UTC) | 568 treatments · 130 conditions · 80 resources · 0 errors |
| 2 | Apply FTS migration | `psql $DATABASE_URL < supabase/migrations/add_fulltext_search.sql` | ⏳ | Creates `search_vector` + indexes + `search_entities()` |
| 3 | Verify search performance | `chmod +x scripts/verify-search-performance.sh && ./scripts/verify-search-performance.sh` | ⏳ | Expect <50 ms simple queries, bitmap index scan |
| 4 | Build + index | `npm run build` (runs `prebuild`) | ✅ (2025-11-15 14:07 UTC) | Next.js 15.5.6, 54 static routes, types valid |
| 5 | Local smoke tests | `npm run dev` + `curl` checks | ⏳ | Ensure `/api/search`, `/treatments/sertraline`, `/resources` respond 200 |
| 6 | Deploy preview | `vercel --preview` | ⏳ | Save preview URL; run `curl` smoke tests |
| 7 | Monitor preview 24 h | Sentry + Vercel + DB stats | ⏳ | Ensure p95 <100 ms, error rate <1% |
| 8 | Promote to prod | `vercel --prod` | ⏳ | Deploy after 24 h of green metrics |
| 9 | Post-prod monitoring | Sentry, Analytics, `psql` index stats | ⏳ | Watch first hour for regressions |

---

## Executive Summary

This runbook implements 4 phases of performance optimizations that will:
- **Improve search speed by 5-10x** (200-500ms → 10-50ms)
- **Enable instant page loads** for top 100 treatments (300ms → 20ms TTFB)
- **Reduce client bundle size by 28%** (250KB → 180KB)
- **Eliminate filesystem dependencies** for Edge Runtime compatibility

**Total Expected Impact:**
- p50 response time: -75% improvement
- p95 response time: -80% improvement
- Core Web Vitals: LCP -57%, TTFB -82%
- Operational Cost: -40% (fewer serverless executions)

---

## Prerequisites

### Required Tools

```bash
# Verify tools are installed
psql --version       # PostgreSQL client
node --version       # Node.js 18+
npm --version        # npm 9+
vercel --version     # Vercel CLI
```

### Required Environment Variables

```bash
# .env.local must contain:
DATABASE_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
SENTRY_DSN=...  # Optional but recommended
```

### Pre-Deployment Checklist

- [ ] All environment variables set
- [ ] Database accessible from local machine
- [ ] Vercel project connected
- [ ] Sentry configured (optional)
- [ ] Git working directory clean
- [ ] All team members notified of deployment window

---

## Phase 0: JSON → Database Sync (Foundation)

**Objective:** Establish JSON as canonical source, database as runtime mirror

**Duration:** 15-20 minutes

### Step 1: Verify Sync Script

```bash
# Test sync in dry-run mode
npm run sync:content:dry

# Expected output:
# 📦 Syncing treatments...
#    Found 568 files
# 📦 Syncing conditions...
#    Found 130 files
# 📦 Syncing resources...
#    Found 100+ files
# ✅ DRY RUN completed
```

### Step 2: Full Sync

```bash
# Run full sync to database
npm run sync:content

# Expected output:
# ✅ Successfully synced: 700+
# ❌ Errors: 0
# ⏱️  Total time: 15-30s
```

**Verification:**

```sql
psql $DATABASE_URL -c "
SELECT type, COUNT(*) as count
FROM entities
WHERE status = 'active'
GROUP BY type
ORDER BY count DESC;
"

# Expected:
#      type      | count
# ---------------+-------
#  medication    |   568
#  condition     |   130
#  resource      |   100+
```

**🚨 Rollback:** If sync fails, database remains unchanged (safe to retry)

---

## Phase 1: Database Full-Text Search + Optimized API

**Objective:** Replace in-memory search with database full-text search

**Duration:** 30 minutes

**Expected Improvement:** 200-500ms → 10-50ms (5-10x faster)

### Step 1: Apply Database Migration

```bash
# Apply full-text search migration
psql $DATABASE_URL < supabase/migrations/add_fulltext_search.sql

# Verify indexes created
psql $DATABASE_URL -c "\d entities"
```

**Expected Output:**
```
Indexes:
    "entities_pkey" PRIMARY KEY, btree (id)
    "entities_slug_key" UNIQUE CONSTRAINT, btree (slug)
    "idx_entities_search_vector" gin (search_vector)  ← NEW!
    "idx_entities_type_status" btree (type, status)   ← NEW!
```

### Step 2: Performance Verification

```bash
# Run performance tests
chmod +x scripts/verify-search-performance.sh
./scripts/verify-search-performance.sh
```

**Expected Results:**
- Execution time: <50ms for simple queries
- Execution time: <100ms for complex queries
- Index used: "Bitmap Index Scan on idx_entities_search_vector" ✅
- Planning time: <5ms

**🚨 Rollback Trigger:**
- Execution time >100ms consistently
- "Seq Scan" instead of "Bitmap Index Scan"
- Planning time >5ms

### Step 3: Deploy Optimized Search API

```bash
# Backup current route (already done)
# Deploy optimized version
cp src/app/api/search/route.optimized.ts src/app/api/search/route.ts

# Build and test
npm run build
npm run dev

# Test search locally
curl "http://localhost:3000/api/search?q=anxiety"
```

**Verification:**
- Response time: <100ms
- Results returned correctly
- loadTimeMs field present in response

### Step 4: Deploy to Preview

```bash
vercel --preview
```

**Monitor for 15 minutes:**
- Sentry: Check p95 response time
- Vercel Analytics: Check TTFB
- Error rate: <0.1%

**Success Criteria:**
- ✅ p95 response time <100ms
- ✅ Error rate <1%
- ✅ Index being used (check EXPLAIN output)

**🚨 Rollback Procedure:**

If p95 > 400ms for 5+ minutes OR error rate > 2%:

```bash
./scripts/rollback-phase1.sh
vercel --prod  # Deploy immediately
```

**Deploy to Production:**

```bash
# If preview is successful for 24 hours
vercel --prod
```

---

## Phase 2: Static Generation + ISR

**Objective:** Pre-render top 100 treatments for instant page loads

**Duration:** 1 hour (includes build time)

**Expected Improvement:** 300ms TTFB → 20ms TTFB (15x faster)

### Step 1: Understand the Pattern

The current treatment page ([src/app/treatments/[slug]/page.tsx](src/app/treatments/[slug]/page.tsx)) is a client component that:
1. Fetches data with useQuery on mount
2. Shows loading state
3. Renders content

**New Pattern:**
1. Server component fetches data at build time
2. Static HTML sent to client instantly
3. Client component handles interactivity only

### Step 2: Implementation

**Option A: Gradual (Recommended)**

Keep current client-only page, add server variant for specific routes:

```typescript
// src/app/treatments/top/[slug]/page.tsx (new route)
import { generateStaticParams, generateMetadata } from './static-helpers';
import { EntityService } from '@/lib/data/entity-service';
import TreatmentClient from '../../[slug]/page';

export { generateStaticParams, generateMetadata };

export default async function TopTreatmentPage({ params }: { params: { slug: string } }) {
  const entity = await EntityService.getBySlug(params.slug);

  // Pre-fetched data passed as prop
  return <TreatmentClient entity={entity} isStatic={true} />;
}

export const revalidate = 86400; // 24 hours
```

**Option B: Full Migration**

Replace existing page.tsx with server component (provided in [page.server.tsx](src/app/treatments/[slug]/page.server.tsx))

### Step 3: Test Build

```bash
npm run build

# Check build output for:
# ○ Static   automatically rendered as static HTML
#
# Route (app)                               Size     First Load JS
# ├ ○ /treatments/[slug]                    X KB           Y KB
# │   ├ /treatments/sertraline              ← Should see 100 routes
# │   ├ /treatments/fluoxetine
# │   └ ...
```

**Expected:**
- 100 treatment pages pre-rendered
- Build time: <5 minutes
- No build errors

**🚨 Rollback Trigger:**
- Build time >10 minutes
- Build fails 2+ times
- Static page count <10

**Rollback Procedure:**

```bash
# Keep client-only version
git checkout src/app/treatments/[slug]/page.tsx

# Rebuild
npm run build
vercel --prod
```

### Step 4: Measure Performance

```bash
# Before deployment (SSR):
curl -w "@curl-format.txt" https://heypsych.com/treatments/sertraline
# TTFB: ~300ms

# After deployment (SSG):
curl -w "@curl-format.txt" https://preview.heypsych.com/treatments/sertraline
# TTFB: ~20ms (should be 15x faster)
```

---

## Phase 3: Remove Filesystem Dependencies

**Objective:** Eliminate runtime file reads for Edge Runtime compatibility

**Duration:** 45 minutes

**Expected Improvement:** Edge deployment enabled, -50-100ms cold start

### Step 1: Verify Database Completeness

```bash
# Check all content is in database
npm run provider-stats

# Expected output:
# Treatments: 568
# Conditions: 130
# Resources: 100+
# Total entities: 700+
```

### Step 2: Update EntityService

Remove API route fallback, query database only:

```typescript
// src/lib/data/entity-service.ts
export class EntityService {
  static async getBySlug(slug: string): Promise<Entity | null> {
    // Remove: if (!entity) fallback to API route
    // Just query database

    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .single();

    return data || null;
  }
}
```

### Step 3: Remove API Routes (Optional)

If all content is in database:

```bash
# Optional: Remove filesystem-dependent API routes
git rm src/app/api/treatments/[slug]/route.ts
git rm src/app/api/conditions/[slug]/route.ts
```

### Step 4: Test Edge Runtime

```typescript
// Add to route segments:
export const runtime = 'edge';

// Test locally
npm run dev
```

**Verification:**
- All pages load correctly
- No filesystem errors in logs
- Edge runtime works (if enabled)

---

## Phase 4: Server-Side Resource Loading

**Objective:** Eliminate 321KB client-side resource index load

**Duration:** 30 minutes

**Expected Improvement:** -68% bundle size, +200-400ms faster mobile TTI

### Implementation

Replace client-side fetch with server-side loading:

```typescript
// BEFORE (client):
function ResourcesPage() {
  const { data } = useQuery({
    queryKey: ['resources'],
    queryFn: () => fetch('/resources-index.json').then(r => r.json()),
  });
  // 321KB download + parse on client
}

// AFTER (server):
import { ResourceService } from '@/lib/data/resource-service';

export default async function ResourcesPage() {
  const resources = await ResourceService.getResourceIndex();
  // Loaded on server, HTML sent to client
  return <ResourceGrid resources={resources} />;
}
```

**File:** [src/lib/data/resource-service.ts](src/lib/data/resource-service.ts) (already created)

### Verification

```bash
# Measure bundle size
npm run analyze

# Before:
# Page JS: 250KB (includes fetch + parsing)
# Data: 321KB downloaded
# Total: 571KB

# After:
# Page JS: 180KB (no fetch code)
# Data: server-rendered
# Total: 180KB (-68%)
```

---

## Complete Deployment Workflow

### Pre-Deployment

```bash
# 1. Sync JSON to database
npm run sync:content

# 2. Run tests
npm test

# 3. Lint check
npm run lint

# 4. Type check
npm run typecheck

# 5. Build
npm run build
```

### Deployment Sequence

```bash
# 1. Deploy to preview
vercel --preview

# 2. Run smoke tests
curl https://preview.heypsych.com/
curl https://preview.heypsych.com/treatments/sertraline
curl "https://preview.heypsych.com/api/search?q=anxiety"

# 3. Monitor for 2-24 hours
# Check Sentry, Vercel Analytics

# 4. Deploy to production
vercel --prod
```

### Post-Deployment

**First Hour:**
- [ ] Check Sentry for new errors
- [ ] Verify p95 response time <100ms
- [ ] Check Core Web Vitals in Vercel

**First Day:**
- [ ] Review performance trends
- [ ] Check database query performance
- [ ] Validate static page count
- [ ] Monitor error rates

**First Week:**
- [ ] Analyze bundle size changes
- [ ] Review ISR regeneration performance
- [ ] Check SEO rankings (if applicable)

---

## Monitoring & Alerts

### Key Metrics to Watch

| Metric | Target | Warning | Critical | Rollback |
|--------|--------|---------|----------|----------|
| **Search p95** | <100ms | >250ms | >400ms | >400ms for 5min |
| **Page TTFB (static)** | <50ms | >100ms | >200ms | N/A (graceful degradation) |
| **Error Rate** | <0.1% | >1% | >2% | >2% for 2min |
| **Build Time** | <5min | >8min | >10min | >10min (2x fail) |

### Sentry Dashboards

Create custom dashboard with:
1. Search API p50/p95/p99
2. Error rate by endpoint
3. Database query duration
4. Static page generation count

### Alert Rules

**Critical (Immediate Action):**
- Search p95 >400ms for 5+ minutes → Rollback Phase 1
- Error rate >2% for 2+ minutes → Investigate immediately
- Build fails 2+ times → Rollback Phase 2

**Warning (Business Hours):**
- Search p95 >250ms for 15+ minutes
- Build time >8 minutes
- ISR regeneration slow (>5s average)

---

## Rollback Procedures

### Phase 1 Rollback (Search API)

```bash
./scripts/rollback-phase1.sh
vercel --prod
```

**Time to execute:** <5 minutes
**Impact:** Reverts to original search (200-500ms)

### Phase 2 Rollback (Static Generation)

```bash
# Restore client-only page
git checkout src/app/treatments/[slug]/page.tsx
npm run build
vercel --prod
```

**Time to execute:** <10 minutes
**Impact:** Back to SSR (300ms TTFB)

### Database Migration Rollback

```sql
-- Only if absolutely necessary
DROP INDEX idx_entities_search_vector;
ALTER TABLE entities DROP COLUMN search_vector;
DROP FUNCTION search_entities;
```

**⚠️  NOT RECOMMENDED:** Migration is safe to keep even if not used.

---

## Testing Checklist

### Before Each Phase

- [ ] Read phase instructions completely
- [ ] Understand rollback procedure
- [ ] Have monitoring dashboards open
- [ ] Notify team of deployment window

### After Each Phase

- [ ] Run smoke tests
- [ ] Check Sentry for errors
- [ ] Verify performance improvement
- [ ] Monitor for 15-60 minutes before next phase

### Final Integration Testing

```bash
# Test complete flow:
# 1. Search
curl "https://heypsych.com/api/search?q=anxiety"

# 2. Treatment page (static)
curl https://heypsych.com/treatments/sertraline

# 3. Resource page (server-rendered)
curl https://heypsych.com/resources

# 4. Condition page
curl https://heypsych.com/conditions/generalized-anxiety-disorder

# All should return:
# - HTTP 200
# - Valid HTML/JSON
# - Response time <500ms
```

---

## Success Criteria

### Phase 1 Success
- ✅ Search p95 <100ms
- ✅ Index used (confirmed via EXPLAIN)
- ✅ Error rate <1%
- ✅ No performance degradation

### Phase 2 Success
- ✅ 100 pages pre-rendered
- ✅ TTFB <50ms for static pages
- ✅ Build time <5 minutes
- ✅ Lighthouse performance score >90

### Phase 3 Success
- ✅ No filesystem errors
- ✅ Edge Runtime compatible
- ✅ All pages load correctly
- ✅ Cold start latency improved

### Phase 4 Success
- ✅ Bundle size reduced by 20%+
- ✅ No client-side resource fetch
- ✅ TTI improved (esp. mobile)
- ✅ Performance budget met

---

## Troubleshooting

### Build Fails with "Cannot find module"

```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Database Migration Fails

```bash
# Check connection
psql $DATABASE_URL -c "SELECT 1;"

# Verify migrations directory exists
ls -la supabase/migrations/

# Reapply migration
psql $DATABASE_URL < supabase/migrations/add_fulltext_search.sql
```

### Search Returns Empty Results

```sql
-- Check search function exists
SELECT proname FROM pg_proc WHERE proname = 'search_entities';

-- Test function directly
SELECT * FROM search_entities('test', 10, 0);

-- Check entities exist
SELECT COUNT(*) FROM entities WHERE status = 'active';
```

### Static Generation Not Working

```bash
# Check generateStaticParams output
npm run build -- --debug

# Verify database has data
psql $DATABASE_URL -c "SELECT COUNT(*) FROM entities WHERE type IN ('medication', 'therapy');"

# Check for errors in console
```

---

## FAQ

**Q: Can I deploy all phases at once?**
A: Not recommended. Deploy incrementally to isolate issues and allow rollback.

**Q: What if I need to rollback to before any optimizations?**
A: All original files are backed up with .backup.ts extension. Database migration is safe to keep.

**Q: How do I update content after deployment?**
A: Edit JSON files, run `npm run sync:content`, then redeploy. ISR will regenerate static pages within 24 hours.

**Q: Will this affect my Vercel bill?**
A: Overall cost should **decrease** by 30-40% due to fewer serverless executions and faster response times.

**Q: Can I run this on a non-Vercel host?**
A: Yes! All optimizations work on any Next.js host. Static generation works everywhere.

---

## Next Steps After Deployment

1. **Monitor for 1 week**
   - Review performance trends
   - Collect user feedback
   - Check SEO impact

2. **Optimize Further** (Optional)
   - Add more routes to static generation
   - Implement service worker for offline support
   - Add CDN caching headers

3. **Scale Up** (When Ready)
   - Increase static page count to 500
   - Add conditions pages to static generation
   - Implement predictive prefetching

---

## Support & Escalation

**Documentation:**
- [OBSERVABILITY.md](./OBSERVABILITY.md) - Monitoring and alerts
- [CODE_STRUCTURE.md](./CODE_STRUCTURE.md) - Architecture overview
- [DEPLOYMENT.md](./DEPLOYMENT.md) - General deployment guide

**Contacts:**
- Engineering Lead: [Your Name]
- Database Admin: [DBA Name]
- DevOps: [DevOps Name]

**Emergency Rollback:** Execute rollback script and notify team immediately.

---

**Document Version:** 1.0
**Last Updated:** 2025-11-15
**Next Review:** After Phase 4 deployment

**Approval:**
- [ ] Technical Lead
- [ ] Product Manager
- [ ] DevOps Lead

**Execution Status:**
- [ ] Phase 0: JSON Sync
- [ ] Phase 1: Database Search
- [ ] Phase 2: Static Generation
- [ ] Phase 3: Remove Filesystem
- [ ] Phase 4: Server Resources
