# Observability & Performance Monitoring

This document defines monitoring strategies, alert thresholds, and rollback triggers for the HeyPsych platform optimizations.

## Overview

**Monitoring Philosophy:**
- Measure what matters: Response time, error rate, user-facing performance
- Define clear thresholds for rollback decisions
- Use database-level query analysis to validate optimizations
- Monitor trends, not just absolute values

---

## Database Performance Monitoring

### Full-Text Search Query Analysis

**Verify GIN Index Usage:**

```sql
-- EXPLAIN ANALYZE for full-text search
-- Should show "Bitmap Index Scan" using idx_entities_search_vector

EXPLAIN ANALYZE
SELECT
  id, type, slug, name, description, metadata,
  ts_rank(search_vector, websearch_to_tsquery('english', 'anxiety depression')) as rank
FROM entities
WHERE
  status = 'active'
  AND search_vector @@ websearch_to_tsquery('english', 'anxiety depression')
ORDER BY rank DESC
LIMIT 50;
```

**Expected Output:**
```
Limit  (cost=X..Y rows=50 width=Z) (actual time=5..15 rows=50 loops=1)
  ->  Sort  (cost=X..Y rows=N width=Z) (actual time=5..10 rows=50 loops=1)
        Sort Key: (ts_rank(...)) DESC
        ->  Bitmap Heap Scan on entities  (cost=X..Y rows=N width=Z) (actual time=2..8 rows=120 loops=1)
              Recheck Cond: (search_vector @@ ...)
              Heap Blocks: exact=45
              ->  Bitmap Index Scan on idx_entities_search_vector  (cost=0..X rows=N width=0) (actual time=1..1 rows=120 loops=1)
                    Index Cond: (search_vector @@ ...)
Planning Time: 0.5 ms
Execution Time: 12.3 ms  ← TARGET: <50ms
```

**🚨 Rollback Trigger:**
- If `Execution Time > 100ms` consistently
- If index is NOT used (shows "Seq Scan" instead of "Bitmap Index Scan")
- If planning time > 5ms (indicates missing/bloated index)

**Validation Script:**

```bash
# scripts/verify-search-performance.sh
psql $DATABASE_URL <<EOF
\timing on

-- Test 1: Single-term search
EXPLAIN ANALYZE
SELECT * FROM search_entities('anxiety', 50, 0);

-- Test 2: Multi-term search
EXPLAIN ANALYZE
SELECT * FROM search_entities('cognitive behavioral therapy', 50, 0);

-- Test 3: Brand name search (medications)
EXPLAIN ANALYZE
SELECT * FROM search_entities('zoloft', 50, 0);

-- Test 4: Large result set
EXPLAIN ANALYZE
SELECT * FROM search_entities('treatment', 100, 0);
EOF
```

**Run before deployment:**
```bash
chmod +x scripts/verify-search-performance.sh
./scripts/verify-search-performance.sh
```

### Database Index Health

**Check Index Size & Bloat:**

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND tablename = 'entities'
ORDER BY pg_relation_size(indexrelid) DESC;
```

**Expected:**
- `idx_entities_search_vector`: 5-20MB (depending on content volume)
- `idx_scans` should be > 0 (confirms index is used)
- `tuples_read / tuples_fetched` ratio close to 1.0 (efficient index)

**🚨 Alert Conditions:**
- Index size > 100MB (investigate bloat)
- `idx_scan = 0` after 24 hours (index not being used)
- Ratio `tuples_read / tuples_fetched > 10` (inefficient queries)

---

## API Performance Monitoring

### Search API Metrics

**Key Performance Indicators (KPIs):**

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| **p50 response time** | <30ms | >100ms | >200ms |
| **p95 response time** | <100ms | >250ms | >400ms |
| **p99 response time** | <200ms | >500ms | >1000ms |
| **Error rate** | <0.1% | >1% | >2% |
| **Timeout rate** | 0% | >0.5% | >1% |

**Sentry Configuration:**

```typescript
// src/app/api/search/route.ts
import * as Sentry from '@sentry/nextjs';

export async function GET(req: NextRequest) {
  const transaction = Sentry.startTransaction({
    op: 'api.search',
    name: 'Search API',
  });

  const startTime = Date.now();

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    // ... search logic ...

    const loadTime = Date.now() - startTime;

    // Track performance metric
    Sentry.metrics.distribution('search.duration', loadTime, {
      unit: 'millisecond',
      tags: {
        query_length: query?.length || 0,
        result_count: results?.length || 0,
      },
    });

    // Alert on slow queries
    if (loadTime > 400) {
      Sentry.captureMessage('Slow search query detected', {
        level: 'warning',
        tags: {
          query,
          duration: loadTime,
        },
      });
    }

    return NextResponse.json({ results, loadTimeMs: loadTime });
  } finally {
    transaction.finish();
  }
}
```

**🚨 Rollback Trigger:**

**Immediate rollback if:**
- p95 response time > 400ms for **sustained 5+ minutes**
- Error rate > 2% for **sustained 2+ minutes**
- Any 5xx error rate > 5%

**Rollback Procedure:**
```bash
# 1. Revert to backup search route
git checkout src/app/api/search/route.backup.ts
mv src/app/api/search/route.backup.ts src/app/api/search/route.ts

# 2. Deploy immediately
vercel --prod

# 3. Monitor recovery
# p95 should drop to <300ms within 2 minutes
```

### Static Generation Metrics

**Build-Time Monitoring:**

```typescript
// next.config.ts
export default {
  // ... other config

  onBuildComplete: async () => {
    const stats = {
      timestamp: new Date().toISOString(),
      staticPageCount: 0, // Count from build output
      buildDuration: 0,   // Measure build time
    };

    // Log to monitoring service
    await fetch(process.env.MONITORING_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats),
    });
  },
};
```

**Key Metrics:**

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| **Static pages generated** | 100-150 | <50 | <10 |
| **Build duration** | <5min | >8min | >10min |
| **Build success rate** | 100% | <99% | <95% |
| **ISR regeneration time** | <2s | >5s | >10s |

**🚨 Rollback Trigger:**

**Fallback to client-only rendering if:**
- Build fails 2+ times consecutively
- Build duration > 10 minutes (indicates bottleneck)
- Static page count < 10 (generateStaticParams not working)
- ISR regeneration causing memory errors

**Fallback Procedure:**
```bash
# 1. Rename server component
mv src/app/treatments/[slug]/page.tsx src/app/treatments/[slug]/page.server.broken.tsx

# 2. Restore client-only version
git checkout src/app/treatments/[slug]/page.client-only.tsx
mv src/app/treatments/[slug]/page.client-only.tsx src/app/treatments/[slug]/page.tsx

# 3. Rebuild and deploy
npm run build
vercel --prod
```

---

## Client-Side Performance Monitoring

### Core Web Vitals Targets

**Vercel Speed Insights:**

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | <2.5s | 2.5-4.0s | >4.0s |
| **FID** (First Input Delay) | <100ms | 100-300ms | >300ms |
| **CLS** (Cumulative Layout Shift) | <0.1 | 0.1-0.25 | >0.25 |
| **TTFB** (Time to First Byte) | <800ms | 800-1800ms | >1800ms |
| **FCP** (First Contentful Paint) | <1.8s | 1.8-3.0s | >3.0s |

**After Optimizations (Expected Improvements):**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **LCP** | 2.8s | 1.2s | **-57%** |
| **TTFB** | 450ms | 80ms | **-82%** (static pages) |
| **FCP** | 2.1s | 0.9s | **-57%** |
| **Bundle Size** | 250KB | 180KB | **-28%** |

**🚨 Alert Conditions:**
- LCP > 4.0s for p75 of users (sustained 24h)
- CLS > 0.25 (indicates layout shift bug)
- TTFB regression > 200ms from baseline

### Bundle Size Monitoring

**Analyze Bundle:**
```bash
ANALYZE=true npm run build
```

**Size Budgets:**

| Bundle | Current | Target | Max |
|--------|---------|--------|-----|
| **First Load JS** | 250KB | 180KB | 300KB |
| **Page JS** | 50KB | 35KB | 75KB |
| **Shared chunks** | 150KB | 120KB | 200KB |

**Track in CI/CD:**
```yaml
# .github/workflows/bundle-size.yml
- name: Check bundle size
  run: |
    npm run build
    npx @next/bundle-analyzer
    # Fail if First Load JS > 300KB
```

---

## Error Monitoring & Alerting

### Sentry Alert Rules

**Critical Alerts (Page immediately):**

1. **High Error Rate**
   - Condition: Error rate > 2% for 2+ minutes
   - Action: Page on-call engineer
   - Channels: PagerDuty, Slack #incidents

2. **API Timeout Spike**
   - Condition: Timeout rate > 1% for 5+ minutes
   - Action: Auto-rollback + page
   - Channels: PagerDuty, Slack #incidents

3. **Database Connection Failures**
   - Condition: Any Supabase connection error
   - Action: Immediate investigation
   - Channels: PagerDuty, Slack #database

**Warning Alerts (Slack only):**

1. **Slow Search Queries**
   - Condition: p95 > 400ms for 10+ minutes
   - Action: Investigate during business hours
   - Channels: Slack #performance

2. **Build Failures**
   - Condition: Vercel build fails
   - Action: Check build logs
   - Channels: Slack #deployments

3. **ISR Regeneration Slow**
   - Condition: ISR > 5s average
   - Action: Review static params
   - Channels: Slack #performance

### Sentry Configuration

```typescript
// sentry.server.config.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.VERCEL_ENV || 'development',

  tracesSampleRate: 0.1, // 10% of transactions

  beforeSend(event, hint) {
    // Filter out known issues
    if (event.exception?.values?.[0]?.value?.includes('ResizeObserver')) {
      return null; // Browser quirk, not actionable
    }
    return event;
  },

  integrations: [
    // Performance monitoring
    new Sentry.Integrations.Http({ tracing: true }),
  ],
});
```

---

## Monitoring Dashboards

### Recommended Sentry Dashboard

**Create custom dashboard with:**

1. **API Performance Panel**
   - Chart: p50, p95, p99 response times (search API)
   - Alert line at 400ms (p95 threshold)
   - Time range: Last 24 hours

2. **Error Rate Panel**
   - Chart: Error count by endpoint
   - Alert line at 2% error rate
   - Group by: HTTP status code

3. **Database Query Performance**
   - Chart: Average query duration
   - Alert line at 100ms
   - Filter: Only search queries

4. **Static Generation Panel**
   - Chart: Build duration trend
   - Alert line at 10 minutes
   - Show: Static page count per build

### Vercel Analytics Dashboard

**Configure custom events:**

```typescript
// Track search usage
import { track } from '@vercel/analytics';

track('search_performed', {
  query: searchTerm,
  result_count: results.length,
  load_time_ms: loadTime,
});

// Track treatment page views
track('treatment_viewed', {
  slug,
  render_mode: 'static', // or 'dynamic'
});
```

---

## Performance Regression Testing

### Automated Performance Tests

**Lighthouse CI:**

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on: [pull_request]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://preview.heypsych.com/
            https://preview.heypsych.com/treatments/sertraline
          budgetPath: ./lighthouse-budget.json
          uploadArtifacts: true
```

**lighthouse-budget.json:**
```json
{
  "performance": 90,
  "accessibility": 95,
  "best-practices": 90,
  "seo": 95,
  "first-contentful-paint": 1800,
  "largest-contentful-paint": 2500,
  "time-to-interactive": 3000,
  "total-blocking-time": 300
}
```

### Load Testing

**Basic load test script:**

```bash
# scripts/load-test.sh
#!/bin/bash

echo "🔥 Load Testing Search API"

# Test 1: Burst load (100 requests in 5 seconds)
echo "Test 1: Burst load..."
ab -n 100 -c 20 -g burst.tsv \
  "https://heypsych.com/api/search?q=anxiety"

# Test 2: Sustained load (1000 requests over 60 seconds)
echo "Test 2: Sustained load..."
ab -n 1000 -c 10 -t 60 -g sustained.tsv \
  "https://heypsych.com/api/search?q=depression"

# Test 3: Complex queries
echo "Test 3: Complex multi-term queries..."
ab -n 100 -c 10 -g complex.tsv \
  "https://heypsych.com/api/search?q=cognitive+behavioral+therapy"

echo "✅ Load test complete. Results:"
grep "Requests per second" burst.tsv sustained.tsv complex.tsv
```

**Expected Results:**
- Burst: >50 req/sec with p95 < 100ms
- Sustained: >30 req/sec with p95 < 150ms
- Complex: >20 req/sec with p95 < 200ms

**🚨 Rollback Trigger:**
- Requests per second drops >50% from baseline
- p95 > 400ms under load
- Any timeout errors during load test

---

## Health Check Endpoints

### API Health Check

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/config/database';

export async function GET() {
  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {
      database: 'unknown',
      search: 'unknown',
    },
  };

  // Test database connection
  try {
    const { data, error } = await supabase
      .from('entities')
      .select('count')
      .limit(1);

    checks.checks.database = error ? 'unhealthy' : 'healthy';
  } catch (error) {
    checks.checks.database = 'unhealthy';
    checks.status = 'degraded';
  }

  // Test search function
  try {
    const { data, error } = await supabase.rpc('search_entities', {
      query_text: 'test',
      limit_count: 1,
      offset_count: 0,
    });

    checks.checks.search = error ? 'unhealthy' : 'healthy';
  } catch (error) {
    checks.checks.search = 'unhealthy';
    checks.status = 'degraded';
  }

  const status = checks.status === 'healthy' ? 200 : 503;
  return NextResponse.json(checks, { status });
}
```

**Monitor with uptime service:**
```bash
# Uptime check (every 1 minute)
curl https://heypsych.com/api/health

# Expected response time: <100ms
# Alert if: Response time > 500ms or status !== 200
```

---

## Observability Checklist

### Pre-Deployment

- [ ] Run `EXPLAIN ANALYZE` on all new database queries
- [ ] Verify GIN indexes are used (not Seq Scan)
- [ ] Load test search API (100+ req/sec sustainable)
- [ ] Check bundle size analysis (`npm run analyze`)
- [ ] Lighthouse CI passes performance budget
- [ ] Health check endpoint returns 200

### Post-Deployment (First 24 Hours)

- [ ] Monitor Sentry for new error types
- [ ] Check p95 response time < 100ms (search)
- [ ] Verify static page count matches target (100+)
- [ ] Core Web Vitals remain in "Good" range
- [ ] No alerts triggered in monitoring dashboards
- [ ] Database query performance stable (<50ms p95)

### Ongoing (Weekly)

- [ ] Review Sentry performance trends
- [ ] Check database index health (bloat, usage)
- [ ] Analyze bundle size changes
- [ ] Review Core Web Vitals by device/region
- [ ] Check build duration trend
- [ ] Validate ISR regeneration times

---

## Rollback Decision Matrix

| Scenario | Severity | Rollback Time | Action |
|----------|----------|---------------|--------|
| p95 > 400ms for 5+ min | **High** | Immediate | Revert search API |
| Error rate > 2% for 2+ min | **Critical** | Immediate | Full rollback |
| Build fails 2x | **Medium** | 15 minutes | Revert static generation |
| LCP regression >1s | **Low** | Next deploy | Investigate, fix forward |
| Index not used | **High** | 30 minutes | Check migration, revert if needed |
| Memory errors in ISR | **Critical** | Immediate | Disable ISR, use client rendering |

---

## Contact & Escalation

**Monitoring Access:**
- Sentry: https://sentry.io/organizations/heypsych
- Vercel: https://vercel.com/heypsych/analytics
- Supabase: https://app.supabase.com/project/[project-id]

**On-Call Escalation:**
1. Check Sentry dashboard first
2. Review recent deployments (Vercel)
3. Check database health (Supabase)
4. If critical, execute rollback procedure
5. Post-incident: Document in `docs/incidents/`

---

**Document Version:** 1.0
**Last Updated:** 2025-11-15
**Owner:** Engineering Team
