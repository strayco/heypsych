# Global Search Optimization - Analysis & Solution

## Problem Summary
Global search was extremely slow (5-11 seconds per request), making the feature unusable.

## Root Cause Analysis

### 1. Current Implementation
- **3 parallel RPC calls** to `search_entities` function (one for conditions, treatments, resources)
- Each call uses `COUNT(*) OVER()` window function
- Each call computes `websearch_to_tsquery()` and `ts_rank()` multiple times
- HTTP/PostgREST overhead per RPC call

### 2. Database Performance (Direct psql)
When testing queries directly against Postgres:
```
anxiety:    ~130ms (606 matches)
depression: ~120ms (728 matches)
therapy:    ~140ms (561 matches)
zoloft:     ~20ms  (1 match)
```

The database queries are FAST! The index (`idx_entities_search_vector_active`) is working correctly.

### 3. The Real Bottleneck
**HTTP/PostgREST/Supabase overhead:** Each RPC call via Supabase JS client adds ~1-2 seconds of latency, even though the underlying SQL executes in <200ms.

- Direct psql: 130ms
- Via Supabase RPC: 1000-4000ms
- 3 parallel calls: 3000-10000ms total (bottlenecked by slowest)

## Solutions Attempted

### ❌ Attempt 1: Grouped Single-Call Function
Created `search_entities_grouped()` to return all 3 types in one call.

**Result:** Even slower! The function scans ALL matching rows (600+) and applies window functions over the entire set before limiting. This caused timeouts.

### ✅ Attempt 2: Optimized Individual Function
Removed `COUNT(*) OVER()` window function overhead by doing separate COUNT query.

**Result:** Marginally better, but still bottlenecked by Supabase HTTP overhead.

## Recommended Solution

The core issue is **Supabase PostgREST latency**, not the SQL query itself. Here are the options:

### Option A: Direct Database Connection (BEST)
Use `pg` library instead of Supabase client for search queries:

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Single query that's actually fast
const result = await pool.query(`
  SELECT * FROM search_entities($1, $2, $3, $4)
`, [searchTerm, limit, 0, type_filter]);
```

**Pros:**
- Eliminates PostgREST overhead
- ~200ms total vs 5000ms+
- Still uses indexed FTS

**Cons:**
- Bypasses Supabase RLS (not an issue for public search)
- Need to manage connection pool

### Option B: Single Optimized Query (MEDIUM)
Rewrite as a single SQL function that filters and limits efficiently:

```sql
CREATE FUNCTION search_all_types(query_text text, limit_count int)
RETURNS TABLE(...)
AS $$
  WITH ranked AS (
    SELECT *,
      ROW_NUMBER() OVER (
        PARTITION BY CASE
          WHEN type = 'condition' THEN 1
          WHEN type = 'resource' THEN 2
          ELSE 3
        END
        ORDER BY ts_rank(search_vector, query) DESC
      ) as rn
    FROM entities
    WHERE status = 'active'
      AND type <> 'provider'
      AND search_vector @@ websearch_to_tsquery('english', query_text)
  )
  SELECT * FROM ranked WHERE rn <= limit_count;
$$;
```

Call once via Supabase RPC instead of 3 times.

**Pros:**
- Only 1 RPC call = 1/3 the HTTP overhead
- Still uses Supabase client

**Cons:**
- Still has ~1-2s PostgREST latency
- More complex SQL

### Option C: Server-Side Caching (FALLBACK)
Cache search results for 5 minutes since content rarely changes:

```typescript
import { LRUCache } from 'lru-cache';

const searchCache = new LRUCache({
  max: 1000,
  ttl: 5 * 60 * 1000 // 5 minutes
});
```

**Pros:**
- Works with existing code
- Instant for cached queries

**Cons:**
- First query still slow
- Stale results possible

## Migrations Created

1. `009_optimize_search_performance.sql` - Initial optimization attempt (grouped function)
2. `010_fix_search_optimization.sql` - Fixed individual function (removed window function)

## Performance Targets

✅ Database query: <200ms (ACHIEVED)
❌ End-to-end API: <300ms (NOT ACHIEVED - PostgREST bottleneck)

## Next Steps

**Recommend Option A** (direct `pg` connection) for best performance:

1. Install `pg`: `npm install pg`
2. Update `/api/search/route.ts` to use direct connection
3. Keep FTS function as-is (it's already optimized)
4. Achieve <300ms search consistently

Would you like me to implement Option A?
