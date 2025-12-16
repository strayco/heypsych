# Sentry Monitoring Configuration

**Last Updated:** 2025-11-15
**Status:** Production Ready
**Sentry Project:** javascript-nextjs
**Organization:** strayco

## Overview

This document describes the Sentry monitoring setup for HeyPsych, including alert rules, dashboard configuration, and performance thresholds aligned with the [Deployment Runbook](./DEPLOYMENT_RUNBOOK.md).

## Quick Links

- **Sentry Dashboard:** https://sentry.io/organizations/strayco/projects/javascript-nextjs/
- **Performance:** https://sentry.io/organizations/strayco/performance/
- **Alerts:** https://sentry.io/organizations/strayco/alerts/rules/

---

## Alert Rules Configuration

### Critical Alerts (Immediate Action Required)

These alerts trigger immediate notifications and may require rollback.

#### 1. Search API Performance - Rollback Threshold

**Name:** `[CRITICAL] Search API p95 > 400ms - Rollback Required`

**Condition:**
```
When the p95 of search.duration for api.search
exceeds 400ms over 5 minutes
```

**Actions:**
- Email: Engineering team
- Slack: #alerts-critical
- PagerDuty: On-call engineer

**Rollback Procedure:**
```bash
./scripts/rollback-phase1.sh
vercel --prod
```

**Runbook Reference:** [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md#phase-1-rollback-search-api)

---

#### 2. High Error Rate

**Name:** `[CRITICAL] Error Rate > 2%`

**Condition:**
```
When error rate for any endpoint
exceeds 2% over 2 minutes
```

**Actions:**
- Email: Engineering team
- Slack: #alerts-critical
- PagerDuty: On-call engineer

**Investigation Steps:**
1. Check Sentry Issues tab for stack traces
2. Review recent deployments
3. Check database connectivity
4. Verify environment variables in Vercel

---

#### 3. Database Query Failures

**Name:** `[CRITICAL] Database Query Failures`

**Condition:**
```
When Database search failed or
Supabase query error occurs
> 5 times in 2 minutes
```

**Actions:**
- Email: Engineering team + DBA
- Slack: #alerts-critical

**Common Causes:**
- Database connection pool exhausted
- Migration issues
- Row-level security (RLS) policy errors
- Query timeout (>15s)

---

### Warning Alerts (Business Hours Response)

These alerts indicate potential issues that should be investigated during business hours.

#### 4. Search API Performance - Warning

**Name:** `[WARNING] Search API p95 > 250ms`

**Condition:**
```
When the p95 of search.duration for api.search
exceeds 250ms over 15 minutes
```

**Actions:**
- Email: Engineering team
- Slack: #alerts-monitoring

**Investigation Steps:**
1. Check database index usage: `EXPLAIN ANALYZE`
2. Review query plans in Supabase dashboard
3. Check for missing indexes
4. Verify search_vector column is being used

---

#### 5. Provider Search Performance

**Name:** `[WARNING] Provider Search > 250ms`

**Condition:**
```
When the p95 of provider_search.duration
exceeds 250ms over 15 minutes
```

**Actions:**
- Email: Engineering team
- Slack: #alerts-monitoring

**Investigation Steps:**
1. Check for unoptimized filters (ILIKE without index)
2. Review query complexity (multiple JSONB filters)
3. Verify state/city indexes are being used
4. Consider adding covering indexes for common filter combinations

---

#### 6. Build Time Alert

**Name:** `[WARNING] Build Time > 8 Minutes`

**Condition:**
```
Manual check via Vercel build logs
or GitHub Actions timeout warnings
```

**Actions:**
- Create GitHub issue
- Slack: #engineering

**Common Causes:**
- Large number of static pages being generated
- Slow database sync during prebuild
- Node modules bloat
- Missing build cache

---

#### 7. Slow ISR Regeneration

**Name:** `[WARNING] ISR Regeneration > 5s Average`

**Condition:**
```
When static page regeneration
exceeds 5s average over 1 hour
```

**Setup:** Custom metric tracking in `getStaticProps`

**Actions:**
- Email: Engineering team
- Slack: #alerts-monitoring

---

## Custom Metrics & Instrumentation

### Search API Metrics

**Metric:** `search.duration`
**Type:** Distribution (milliseconds)
**Tags:**
- `query_length`: Length of search query
- `result_count`: Number of results returned
- `has_type_filter`: Boolean

**Tracked In:** `src/app/api/search/route.ts:80-87`

**Usage:**
```typescript
Sentry.metrics.distribution("search.duration", loadTime, {
  unit: "millisecond",
  tags: {
    query_length: searchTerm.length,
    result_count: filteredResults.length,
    has_type_filter: !!type,
  },
});
```

---

### Provider Search Metrics

**Metric:** `provider_search.duration`
**Type:** Distribution (milliseconds)
**Tags:**
- `has_state`: Boolean
- `has_city`: Boolean
- `has_specialization`: Boolean
- `result_count`: Number of results returned

**Tracked In:** `src/app/api/providers/search/route.ts:144-152`

**Usage:**
```typescript
Sentry.metrics.distribution("provider_search.duration", loadTime, {
  unit: "millisecond",
  tags: {
    has_state: !!qParams.state,
    has_city: !!qParams.city,
    has_specialization: !!qParams.specialization,
    result_count: data?.length || 0,
  },
});
```

---

## Custom Sentry Dashboard

### Creating the Dashboard

1. Navigate to: **Dashboards** → **Create Dashboard**
2. Name: `HeyPsych Production Monitoring`
3. Add the following widgets:

### Widget 1: Search API Performance (p50/p95/p99)

**Type:** Line Chart
**Metric:** `search.duration`
**Aggregation:**
- p50 (median)
- p95 (95th percentile)
- p99 (99th percentile)

**Y-Axis:** Milliseconds
**Time Range:** Last 24 hours
**Interval:** 5 minutes

**Target Lines:**
- Green: p95 < 100ms (Target)
- Yellow: p95 100-250ms (Warning)
- Red: p95 > 400ms (Critical/Rollback)

---

### Widget 2: Provider Search Performance

**Type:** Line Chart
**Metric:** `provider_search.duration`
**Aggregation:** p50, p95, p99
**Y-Axis:** Milliseconds
**Time Range:** Last 24 hours
**Interval:** 5 minutes

**Target Lines:**
- Green: p95 < 100ms
- Yellow: p95 100-250ms (Warning)
- Red: p95 > 500ms

---

### Widget 3: Error Rate by Endpoint

**Type:** Table
**Metric:** Errors
**Group By:** Transaction (endpoint)
**Columns:**
- Endpoint
- Error Count
- Error Rate %
- p95 Duration

**Sort By:** Error Count (DESC)
**Time Range:** Last 4 hours

---

### Widget 4: Search Query Distribution

**Type:** Bar Chart
**Metric:** `search.duration`
**Group By:** `query_length` bucket
- 0-5 chars
- 6-10 chars
- 11-20 chars
- 20+ chars

**Y-Axis:** Count
**Time Range:** Last 24 hours

---

### Widget 5: Database Query Performance

**Type:** Line Chart
**Custom Query:** Filter by `tags.api:search` and `tags.api:provider_search`
**Metric:** Duration
**Y-Axis:** Milliseconds
**Time Range:** Last 24 hours

**Alert Line:** 5000ms (5s warning for database queries)

---

### Widget 6: Top Slow Transactions

**Type:** Table
**Data Source:** Performance → Transactions
**Columns:**
- Transaction Name
- p95 Duration
- Throughput (req/min)
- Error Rate

**Filter:** Duration > 500ms
**Sort By:** p95 Duration (DESC)
**Limit:** Top 10

---

## Setting Up Alerts (Step-by-Step)

### In Sentry UI:

1. **Navigate to Alerts:**
   - Organization Settings → Alerts → Alert Rules
   - Click "Create Alert Rule"

2. **Choose Alert Type:**
   - Select "Issue Alert" for errors
   - Select "Metric Alert" for performance thresholds

3. **Configure Conditions:**
   - Use the conditions defined above
   - Set appropriate time windows (2min, 5min, 15min)

4. **Set Actions:**
   - Add notification channels (Email, Slack, PagerDuty)
   - Configure rate limiting to avoid alert fatigue

5. **Test Alert:**
   - Use "Send Test Notification" button
   - Verify all channels receive the alert

6. **Enable Alert:**
   - Switch to "Active" status
   - Monitor for false positives

---

## Key Performance Targets

Based on [DEPLOYMENT_RUNBOOK.md](./DEPLOYMENT_RUNBOOK.md#monitoring--alerts):

| Metric | Target | Warning | Critical | Rollback |
|--------|--------|---------|----------|----------|
| **Search p95** | <100ms | >250ms | >400ms | >400ms for 5min |
| **Page TTFB (static)** | <50ms | >100ms | >200ms | N/A |
| **Error Rate** | <0.1% | >1% | >2% | >2% for 2min |
| **Build Time** | <5min | >8min | >10min | >10min (2x fail) |
| **Provider Search p95** | <100ms | >250ms | >500ms | Manual review |
| **Database Query** | <1s | >3s | >5s | Investigate |

---

## Transaction Tracking

### Tracked Transactions

All transactions are automatically tracked via Sentry's Next.js integration:

**API Routes:**
- `api.search` - Search API (optimized)
- `api.providers.search` - Provider search
- `api.treatments.[slug]` - Treatment detail API
- `api.conditions.[slug]` - Condition detail API

**Pages:**
- `/treatments/[slug]` - Treatment detail pages
- `/conditions/[slug]` - Condition detail pages
- `/resources` - Resources listing
- `/providers` - Provider search page

**Custom Transactions:**
Manually started for critical operations:
```typescript
const transaction = Sentry.startTransaction({
  op: "api.search",
  name: "Search API (Optimized)",
});
```

---

## Release Tracking

Sentry automatically tracks releases via the build process:

**Release Format:** Git commit SHA
**Example:** `8eae3e934070733d008486922deaa913d3a1930c`

**Viewing Release Performance:**
1. Navigate to: **Releases** → Select release
2. View metrics:
   - Crash-free sessions
   - Adoption rate
   - Error count
   - Performance improvements vs. previous release

**Release Annotations:**
- Created automatically on each Vercel deployment
- Source maps uploaded during build
- Environment tagged (production/preview)

---

## Session Replay

**Status:** Enabled
**Sample Rate:** 10% (configurable in `sentry.client.config.ts`)

**Use Cases:**
- Debugging user-reported issues
- Understanding error context
- Analyzing UX friction points

**Privacy:**
- Sensitive data automatically masked
- User identifiers hashed
- No PII captured without consent

---

## Monitoring Best Practices

### Daily Checks (Automated)

- Review critical alert status
- Check error rate trends
- Monitor p95 performance for key endpoints
- Verify build success rate

### Weekly Reviews

- Analyze performance trends
- Review slow transaction reports
- Check for memory leaks
- Update alert thresholds if needed

### Post-Deployment

**First Hour:**
- Monitor Sentry for new error patterns
- Check p95 response times
- Verify Core Web Vitals

**First Day:**
- Review performance trends vs. previous deployment
- Check database query performance
- Validate static page count

**First Week:**
- Analyze bundle size changes
- Review ISR regeneration performance
- Check SEO impact (if applicable)

---

## Troubleshooting

### High Alert Volume

**Symptom:** Receiving too many alerts

**Solutions:**
1. Increase threshold values
2. Add longer time windows
3. Use rate limiting on alert rules
4. Group related alerts

### Missing Metrics

**Symptom:** Custom metrics not appearing in Sentry

**Check:**
1. Verify Sentry SDK version (>= 8.0.0)
2. Confirm `Sentry.metrics.distribution()` is being called
3. Check browser console for Sentry errors
4. Verify DSN is correct in environment variables

### Slow Dashboard Load

**Symptom:** Dashboard takes >10s to load

**Solutions:**
1. Reduce time range (24h → 6h)
2. Limit number of widgets
3. Use lower-resolution intervals
4. Consider splitting into multiple dashboards

---

## Environment Variables

Required in Vercel:

```bash
SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=sntrys_...
SENTRY_ORG=strayco
SENTRY_PROJECT=javascript-nextjs
```

**Note:** These are already configured in Vercel production environment.

---

## Additional Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Deployment Runbook](./DEPLOYMENT_RUNBOOK.md)
- [Observability Guide](./OBSERVABILITY.md)
- [Code Structure](./CODE_STRUCTURE.md)

---

## Support Contacts

**Engineering Lead:** [Your Name]
**DevOps:** [DevOps Name]
**On-Call:** PagerDuty rotation

**Emergency Rollback:** Execute rollback script and notify team immediately.

---

**Document Version:** 1.0
**Next Review:** After first week of production monitoring
