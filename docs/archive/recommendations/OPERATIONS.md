# HeyPsych Operations Guide
## The Single Source of Truth for Deployment & Operations

**Version:** 2.0
**Last Updated:** 2025-11-15
**Status:** Production (Active)
**Maintainer:** Engineering Team

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture & Data Model](#architecture--data-model)
3. [JSON → Database Sync](#json--database-sync)
4. [Full-Text Search System](#full-text-search-system)
5. [Local Development](#local-development)
6. [Deployment Workflows](#deployment-workflows)
7. [Monitoring & Observability](#monitoring--observability)
8. [Troubleshooting](#troubleshooting)
9. [Rollback Procedures](#rollback-procedures)

---

## System Overview

### Technology Stack

- **Framework:** Next.js 15.5.6 (App Router)
- **Database:** Supabase PostgreSQL
- **Deployment:** Vercel
- **Monitoring:** Sentry
- **Language:** TypeScript

### Core Principles

1. **JSON as Canonical Source**: All content (treatments, conditions, resources) is authored in JSON files under `data/`. The database is a runtime mirror.
2. **Database as Runtime Mirror**: The app reads exclusively from the database (`entities` table) for performance. JSON files are never read directly in production.
3. **Provider Separation**: Provider/psychiatrist data (~69,000 rows) is stored in the same `entities` table but explicitly excluded from global search.
4. **Static Generation**: Treatment and condition pages use SSG/ISR for instant load times.

---

## Architecture & Data Model

### Database Schema

**Table:** `public.entities`

```sql
Column        | Type            | Notes
--------------+-----------------+------------------------------------
id            | uuid            | PK, default gen_random_uuid()
type          | varchar(50)     | medication, condition, provider, etc.
slug          | varchar(255)    | unique with (type)
title         | varchar(500)    | Display name
description   | text            | Summary
content       | jsonb           | Full JSON content (canonical data)
metadata      | jsonb           | Auxiliary metadata
status        | varchar(20)     | active, draft, archived
created_at    | timestamptz     | Auto-generated
updated_at    | timestamptz     | Auto-generated
category      | text            | Optional category
subcategory   | text            | Optional subcategory
search_vector | tsvector        | Full-text search (auto-populated)
```

**Key Indexes:**

```sql
-- Primary key
entities_pkey (id)

-- Unique constraint for type + slug
entities_type_slug_idx UNIQUE (type, slug)

-- Full-text search (EXCLUDES providers)
idx_entities_search_vector GIN (search_vector)
  WHERE type <> 'provider'

-- Performance indexes
idx_entities_type_status (type, status)
idx_entities_type (type)
idx_entities_slug (slug)
```

### Entity Type Distribution

Current production counts (as of 2025-11-15):

```
provider:         ~69,000  (separate search UX)
medication:          249
condition:           130
therapy:              91
supplement:           90
alternative:          77
resource:             43
+ various subtypes
```

### Important Schema Notes

1. **Column Names**: Uses `content` (NOT `data`) and `title` (NOT `name`)
2. **Conflict Resolution**: Upsert on `(type, slug)` composite key
3. **Provider Exclusion**: Providers are filtered out of global search via `WHERE type <> 'provider'`

---

## JSON → Database Sync

### Philosophy

- **JSON is authoritative**: All edits happen in `data/` directory
- **Database is derived**: Auto-synced from JSON during build
- **Sync is idempotent**: Safe to run multiple times

### Sync Script

**Location:** `scripts/sync-json-to-db.ts`

**Usage:**

```bash
# Full sync (all types)
npm run sync:content

# Dry run (preview changes)
npm run sync:content:dry

# Sync specific type
npm run sync:content -- --type=treatments

# Verbose output
npm run sync:content -- --verbose
```

### How Sync Works

1. **Read** JSON files recursively from `data/{treatments,conditions,resources}/`
2. **Normalize** to entity format:
   - Extract `type` from directory structure or content
   - Map `name`/`title` → `title` column
   - Store full JSON in `content` column
   - Build `metadata` from file path, category, codes
3. **Batch Upsert** (50 per batch, 5 concurrent):
   - Conflict resolution on `(type, slug)`
   - Uses `ignoreDuplicates: false` to update existing rows
4. **Report** statistics

### Expected Output

```
🔄 JSON → Database Sync
========================

📦 Syncing treatments...
   Found 568 files
   Processing 12 batches (50 per batch)...
   ✅ Completed: 568 synced, 0 errors

📦 Syncing conditions...
   Found 130 files
   ✅ Completed: 130 synced, 0 errors

📦 Syncing resources...
   Found 80 files
   ✅ Completed: 80 synced, 0 errors

📊 SYNC SUMMARY
===============
TREATMENTS: 568 synced, 0 errors
CONDITIONS: 130 synced, 0 errors
RESOURCES:  80 synced, 0 errors

⏱️  Total time: 7.96s
✅ Successfully synced: 778
❌ Errors: 0
```

### Integration with Build Process

**File:** `package.json`

```json
{
  "scripts": {
    "prebuild": "npm run sync:content && npm run build:index",
    "sync:content": "tsx scripts/sync-json-to-db.ts",
    "build:index": "node scripts/build-resource-index.cjs",
    "build": "next build"
  }
}
```

**Flow:**
1. Vercel triggers `npm run build`
2. `prebuild` hook runs automatically
3. Syncs JSON → DB
4. Builds resource index
5. Next.js build proceeds

### Environment Variables Required

```bash
NEXT_PUBLIC_SUPABASE_URL=https://ceqfyvzexvjlmqusscid.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-key>
```

---

## Full-Text Search System

### Overview

Global search uses PostgreSQL full-text search with GIN index. Providers are explicitly excluded and have their own search endpoint.

### Database Components

**1. search_vector Column**

Auto-populated via trigger on INSERT/UPDATE:

```sql
search_vector =
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(slug, '')), 'C') ||
  setweight(to_tsvector('english', coalesce(content::text, '')), 'D') ||
  setweight(to_tsvector('english', coalesce(metadata::text, '')), 'D')
```

**2. Partial GIN Index** (excludes providers):

```sql
CREATE INDEX idx_entities_search_vector
ON entities USING GIN (search_vector)
WHERE type <> 'provider';
```

**3. search_entities Function**

```sql
CREATE OR REPLACE FUNCTION search_entities(
  query_text text,
  limit_count int DEFAULT 50,
  offset_count int DEFAULT 0
)
RETURNS SETOF entities
LANGUAGE sql STABLE
AS $$
  SELECT *
  FROM entities
  WHERE type <> 'provider'
    AND status = 'active'
    AND search_vector @@ websearch_to_tsquery('english', query_text)
  ORDER BY ts_rank(search_vector, websearch_to_tsquery('english', query_text)) DESC
  LIMIT limit_count
  OFFSET offset_count;
$$;
```

### Search API Route

**Location:** `src/app/api/search/route.ts`

**Usage:**

```bash
# Basic search
curl "http://localhost:3000/api/search?q=anxiety"

# With pagination
curl "http://localhost:3000/api/search?q=anxiety&limit=20&offset=0"

# Filter by type
curl "http://localhost:3000/api/search?q=therapy&type=therapy"
```

**Response:**

```json
{
  "results": [...],
  "totalCount": 42,
  "hasMore": true,
  "nextOffset": 50,
  "loadTimeMs": 23
}
```

**Performance Targets:**

- p50: <50ms
- p95: <100ms (target), <250ms (warning), >400ms (critical/rollback)
- Index usage: Bitmap Index Scan on `idx_entities_search_vector`

### Provider Search (Separate)

**Endpoint:** `/api/providers/search`

**Why Separate:**
- ~69,000 providers would pollute global search results
- Different search UX (location-based, specialty filters)
- Dedicated indexes for provider-specific queries

**Key Difference:**
- Global search: `WHERE type <> 'provider'` (excludes)
- Provider search: `WHERE type = 'provider'` (includes only)

### Performance Verification

**Script:** `scripts/verify-search-performance.sh`

```bash
# Run performance tests
export DATABASE_URL="postgresql://..."
chmod +x scripts/verify-search-performance.sh
./scripts/verify-search-performance.sh
```

**Expected Output:**

```
Test 1: Single-term search (anxiety)
  Execution time: 12.345 ms
  ✅ Using Bitmap Index Scan on idx_entities_search_vector

Test 2: Multi-term search
  Execution time: 23.456 ms
  ✅ Using index

Index Health:
  idx_entities_search_vector | 2.5 MB | 1234 scans | ✅ Healthy
```

### Populating search_vector for Existing Data

If search_vector is NULL for any rows:

```bash
psql "$DATABASE_URL" < scripts/populate-search-vector.sql
```

This script:
- Finds rows with `search_vector IS NULL`
- Processes in batches of 500
- Skips providers (separate search)
- Reports progress

---

## Local Development

### Prerequisites

```bash
# Required tools
node --version    # v18+
npm --version     # v9+
psql --version    # PostgreSQL client
vercel --version  # Vercel CLI
```

### Environment Setup

**File:** `.env.local`

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=https://ceqfyvzexvjlmqusscid.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-key>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>

# Sentry (optional for local)
SENTRY_DSN=<your-sentry-dsn>
SENTRY_AUTH_TOKEN=<your-auth-token>
SENTRY_ORG=strayco
SENTRY_PROJECT=javascript-nextjs

# Direct database access (for scripts)
DATABASE_URL=postgresql://postgres:<password>@db.ceqfyvzexvjlmqusscid.supabase.co:5432/postgres
```

### First-Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Ensure database has latest schema
psql "$DATABASE_URL" < supabase/migrations/001_create_entities_table.sql
psql "$DATABASE_URL" < supabase/migrations/002_add_fulltext_search.sql

# 3. Populate search_vector if needed
psql "$DATABASE_URL" < scripts/populate-search-vector.sql

# 4. Sync JSON to database
npm run sync:content

# 5. Build resource index
npm run build:index

# 6. Start dev server
npm run dev
```

### Development Workflow

```bash
# Run development server
npm run dev

# Build locally (includes prebuild hook)
npm run build

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Format code
npm run format
```

### Testing Changes

```bash
# 1. Make changes to JSON files in data/

# 2. Sync to local database
npm run sync:content:dry  # Preview
npm run sync:content      # Apply

# 3. Test locally
npm run dev

# 4. Verify search works
curl "http://localhost:3000/api/search?q=test"

# 5. Build to verify SSG
npm run build
```

---

## Deployment Workflows

### Preview Deployment

**When to use:** Feature branches, testing changes before production

```bash
# Ensure changes are committed
git add .
git commit -m "feat: your changes"
git push origin feature-branch

# Deploy to preview
vercel

# Or specify preview explicitly
vercel --preview
```

**Vercel will:**
1. Run `prebuild` hook (sync + index)
2. Execute `next build`
3. Deploy to preview URL

**Verify deployment:**

```bash
# Check build logs
vercel inspect <deployment-url> --logs

# Test preview
curl https://preview-url.vercel.app/api/search?q=anxiety

# Monitor in Sentry
# Check for errors in preview environment
```

### Production Deployment

**Prerequisites:**
- ✅ Preview deployed and tested
- ✅ All tests passing
- ✅ Type checks passing
- ✅ Sentry shows no new errors
- ✅ Changes committed to `main` branch

**Commands:**

```bash
# Method 1: Deploy current directory to production
vercel --prod

# Method 2: Promote a preview deployment
vercel promote <deployment-url>

# Method 3: Via Git (automatic on push to main if configured)
git push origin main
```

**Post-Deployment Checklist:**

```bash
# 1. Verify deployment status
vercel inspect <deployment-url>

# 2. Smoke test critical endpoints
curl https://heypsych.com/api/search?q=anxiety
curl https://heypsych.com/treatments/sertraline
curl https://heypsych.com/api/providers/search?state=TX&limit=10

# 3. Check build output
vercel inspect <deployment-url> --logs | grep "Generating static pages"

# Expected: "✓ Generating static pages (54/54)"

# 4. Monitor Sentry for first 30 minutes
# - Watch for error spikes
# - Check p95 response times
# - Verify metrics flowing
```

### CI/CD Flow (Automatic)

When code is pushed to `main`:

1. **Vercel Build Trigger**
   - Clones repository
   - Installs dependencies
   - Sets environment variables

2. **Pre-build Hook** (`prebuild` script)
   ```bash
   npm run sync:content    # Sync JSON → DB
   npm run build:index     # Build resource index
   ```

3. **Next.js Build**
   ```bash
   next build
   ```
   - Generates static pages (SSG)
   - Compiles serverless functions
   - Optimizes bundles

4. **Deployment**
   - Uploads static assets
   - Deploys serverless functions
   - Updates production URLs

5. **Post-Deploy**
   - Sentry source maps uploaded
   - Release created in Sentry
   - Deployment marked as ready

**Build Time:** ~2-3 minutes
**Expected Outputs:**
- 54 static pages generated
- Bundle size: 148-232kB first load
- 0 type errors
- 0 build errors

---

## Monitoring & Observability

### Sentry Integration

**Project:** https://sentry.io/organizations/strayco/projects/javascript-nextjs/

**Key Metrics Tracked:**

1. **Search API Performance**
   - Metric: `search.duration` (distribution)
   - Tags: `query_length`, `result_count`, `has_type_filter`
   - Alerts: p95 > 400ms (critical), p95 > 250ms (warning)

2. **Provider Search Performance**
   - Metric: `provider_search.duration` (distribution)
   - Tags: `has_state`, `has_city`, `has_specialization`
   - Alerts: p95 > 250ms (warning)

3. **Error Tracking**
   - All API routes instrumented
   - Automatic error capture
   - Session replay enabled (10% sample rate)

**Alert Rules:**

See [SENTRY_MONITORING.md](./SENTRY_MONITORING.md) for complete configuration.

**Critical alerts:**
- Search API p95 > 400ms for 5 minutes → **Rollback trigger**
- Error rate > 2% for 2 minutes → **Investigate immediately**
- Database query failures → **Engineering + DBA notification**

### Performance Targets

| Metric | Target | Warning | Critical | Rollback |
|--------|--------|---------|----------|----------|
| Search p95 | <100ms | >250ms | >400ms | >400ms (5min) |
| Provider Search p95 | <100ms | >250ms | >500ms | Manual review |
| Error Rate | <0.1% | >1% | >2% | >2% (2min) |
| Page TTFB (static) | <50ms | >100ms | >200ms | N/A |
| Build Time | <5min | >8min | >10min | >10min (2x fail) |

### Database Health Checks

```bash
# Check entity counts by type
psql "$DATABASE_URL" -c "
SELECT type, COUNT(*)
FROM entities
WHERE status = 'active'
GROUP BY type
ORDER BY COUNT(*) DESC;
"

# Check search_vector population
psql "$DATABASE_URL" -c "
SELECT
  COUNT(*) as total,
  COUNT(search_vector) as with_search_vector,
  COUNT(*) - COUNT(search_vector) as missing
FROM entities
WHERE type <> 'provider';
"

# Check index usage
psql "$DATABASE_URL" -c "
SELECT
  indexname,
  idx_scan as scans,
  pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes
WHERE tablename = 'entities'
ORDER BY idx_scan DESC;
"
```

---

## Troubleshooting

### Sync Fails with "Could not find 'data' column"

**Symptom:**
```
❌ Batch upsert failed: Could not find the 'data' column of 'entities'
```

**Cause:** Outdated sync script or Supabase schema cache issue

**Fix:**
```bash
# 1. Verify sync script uses correct column names
grep -n "content:" scripts/sync-json-to-db.ts  # Should see "content: content"
grep -n "title:" scripts/sync-json-to-db.ts    # Should see "title: content.name || content.title"

# 2. Clear Supabase schema cache (if using Supabase client)
# - Wait 5 minutes for cache to refresh
# - Or restart Supabase instance

# 3. Re-run sync
npm run sync:content
```

### Search Returns No Results

**Symptom:** API returns `{ results: [], totalCount: 0 }`

**Debug:**

```bash
# 1. Check if search_vector is populated
psql "$DATABASE_URL" -c "
SELECT COUNT(*) FROM entities
WHERE search_vector IS NOT NULL
AND type <> 'provider';
"

# 2. Test search function directly
psql "$DATABASE_URL" -c "
SELECT * FROM search_entities('anxiety', 10, 0);
"

# 3. Check if data exists
psql "$DATABASE_URL" -c "
SELECT type, COUNT(*) FROM entities
WHERE status = 'active'
GROUP BY type;
"

# 4. If search_vector is NULL, populate it
psql "$DATABASE_URL" < scripts/populate-search-vector.sql
```

### Build Fails in Vercel

**Common causes:**

1. **Sync timeout** (large dataset)
   ```
   Solution: Increase batch size or add timeout handling
   ```

2. **Missing environment variables**
   ```bash
   # Verify in Vercel dashboard:
   NEXT_PUBLIC_SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Database connection refused**
   ```
   Solution: Check Supabase IP whitelist, verify credentials
   ```

4. **Type errors**
   ```bash
   # Run locally first
   npm run typecheck
   ```

### Slow Search Performance

**Symptom:** Search API p95 > 250ms

**Investigation:**

```bash
# 1. Run performance verification
./scripts/verify-search-performance.sh

# 2. Check if index is being used
psql "$DATABASE_URL" -c "
EXPLAIN ANALYZE
SELECT * FROM search_entities('test query', 50, 0);
"

# Look for: "Bitmap Index Scan on idx_entities_search_vector"
# Avoid: "Seq Scan on entities"

# 3. Check index bloat
psql "$DATABASE_URL" -c "
SELECT
  indexname,
  pg_size_pretty(pg_relation_size(indexrelid)) as size,
  idx_scan as scans
FROM pg_stat_user_indexes
WHERE tablename = 'entities' AND indexname LIKE '%search%';
"

# 4. Rebuild index if bloated
psql "$DATABASE_URL" -c "
REINDEX INDEX CONCURRENTLY idx_entities_search_vector;
"
```

---

## Rollback Procedures

### When to Rollback

**Immediate rollback triggers:**
- Search API p95 > 400ms for 5+ minutes
- Error rate > 2% for 2+ minutes
- Build fails 2+ consecutive times
- Database query timeouts

**Discretionary rollback:**
- Search API p95 > 250ms for 15+ minutes
- Unusual Sentry error patterns
- User-reported critical bugs

### Rollback Methods

#### Method 1: Promote Previous Deployment (Fastest)

```bash
# 1. List recent deployments
vercel list

# 2. Find last known-good deployment
# Look for deployment before the issue started

# 3. Promote to production
vercel promote <previous-deployment-url>

# Time to execute: ~30 seconds
```

#### Method 2: Revert Git Commit

```bash
# 1. Identify problematic commit
git log --oneline -n 10

# 2. Revert the commit
git revert <bad-commit-hash>

# 3. Push to main (triggers auto-deploy)
git push origin main

# Time to execute: ~3-5 minutes (includes rebuild)
```

#### Method 3: Restore from Backup (Database Issues)

```bash
# 1. Connect to Supabase dashboard
# 2. Navigate to Database → Backups
# 3. Restore from point-in-time backup
# 4. Re-run sync if needed

# Time to execute: 5-15 minutes
```

### Post-Rollback Actions

```bash
# 1. Verify rollback success
curl https://heypsych.com/api/search?q=test

# 2. Check Sentry metrics normalize
# - Error rate should drop to <1%
# - p95 should return to <100ms

# 3. Create incident report
# - Document what failed
# - Include Sentry errors
# - Note time to resolution
# - Action items for prevention

# 4. Communicate to team
# - Post in Slack #engineering
# - Update status page if public-facing
```

---

## Quick Reference

### Essential Commands

```bash
# Local Development
npm run dev                          # Start dev server
npm run sync:content                 # Sync JSON → DB
npm run build                        # Full build (includes sync)

# Deployment
vercel                               # Deploy preview
vercel --prod                        # Deploy production
vercel inspect <url> --logs          # View deployment logs

# Database
psql "$DATABASE_URL" < file.sql      # Run SQL script
./scripts/verify-search-performance.sh  # Test search performance
npm run sync:content:dry             # Preview sync changes

# Monitoring
vercel logs                          # Stream production logs
```

### Key File Locations

```
heypsych/
├── data/                            # JSON source files (canonical)
│   ├── treatments/                  # 568 treatment files
│   ├── conditions/                  # 130 condition files
│   └── resources/                   # 80 resource files
├── scripts/
│   ├── sync-json-to-db.ts          # JSON → DB sync (CRITICAL)
│   ├── populate-search-vector.sql  # Populate missing search data
│   └── verify-search-performance.sh # Test search performance
├── supabase/migrations/
│   ├── 001_create_entities_table.sql
│   └── 002_add_fulltext_search.sql
├── src/
│   ├── app/api/search/route.ts     # Global search API
│   ├── app/api/providers/search/   # Provider search (separate)
│   ├── lib/data/
│   │   ├── entity-service.ts       # Database queries
│   │   └── resource-service.ts     # Resource loading
└── docs/
    ├── OPERATIONS.md               # This file (source of truth)
    ├── SENTRY_MONITORING.md        # Alert configuration
    └── DEPLOYMENT_RUNBOOK.md       # Legacy (superseded by this doc)
```

### Support Contacts

**Engineering Lead:** [Your Name]
**Database Admin:** [DBA Name]
**DevOps:** [DevOps Name]
**On-Call:** PagerDuty rotation

**Escalation Path:**
1. Check Sentry for errors
2. Review deployment logs in Vercel
3. Consult this operations guide
4. Contact on-call engineer if critical

---

## Changelog

### Version 2.0 (2025-11-15)
- **MAJOR UPDATE:** Complete rewrite based on actual production state
- Fixed schema alignment (content/title vs data/name)
- Documented provider exclusion from global search
- Added search_vector auto-population via trigger
- Consolidated deployment procedures
- Added troubleshooting section
- Supersedes DEPLOYMENT_RUNBOOK.md and DEPLOY_NOW.md

### Version 1.0 (2025-11-10)
- Initial deployment runbook (now legacy)

---

**Document Status:** AUTHORITATIVE
**Supersedes:** DEPLOYMENT_RUNBOOK.md, DEPLOY_NOW.md, DEPLOYMENT.md
**Next Review:** After major architecture changes or quarterly

---

**End of Operations Guide**
