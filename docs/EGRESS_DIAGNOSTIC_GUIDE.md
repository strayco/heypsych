# Supabase Egress Diagnostic Guide

**Goal:** Identify the actual sources of egress before optimizing

---

## 1. Check Supabase Dashboard Metrics

### Navigate to Supabase Dashboard
1. Go to your project dashboard: https://supabase.com/dashboard/project/ceqfyvzexvjlmqusscid
2. Click **Reports** → **Database** → **Database Egress**
3. Look for:
   - **Peak usage times** - When does egress spike?
   - **Total daily/weekly egress** - What's the actual cost?
   - **Growth trends** - Is it increasing?

### Key Questions
- What's your current egress usage? (MB/day or GB/day)
- What's your Supabase plan limit?
- Are you seeing spikes or steady usage?

---

## 2. Analyze Query Patterns with pg_stat_statements

Supabase has PostgreSQL's `pg_stat_statements` extension enabled. Run these queries to see what's actually executing:

### Query 1: Most Frequent Queries (Last 24 Hours)

```sql
-- See most frequently executed queries
SELECT
  calls,
  mean_exec_time::numeric(10,2) as avg_ms,
  total_exec_time::numeric(10,2) as total_ms,
  rows,
  LEFT(query, 100) as query_preview
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
  AND query LIKE '%entities%'
ORDER BY calls DESC
LIMIT 20;
```

**Look for:**
- High `calls` count = frequent queries
- Queries with `SELECT *` or `SELECT content`
- Queries without `LIMIT`

---

### Query 2: Largest Data Transfer Queries

```sql
-- See queries returning the most rows (proxy for egress)
SELECT
  calls,
  rows,
  (calls * rows) as total_rows_transferred,
  mean_exec_time::numeric(10,2) as avg_ms,
  LEFT(query, 100) as query_preview
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat%'
  AND query LIKE '%entities%'
ORDER BY (calls * rows) DESC
LIMIT 20;
```

**Look for:**
- High `total_rows_transferred` = major egress source
- Queries fetching many rows repeatedly

---

### Query 3: Provider-Specific Queries

```sql
-- See provider query patterns
SELECT
  calls,
  rows,
  mean_exec_time::numeric(10,2) as avg_ms,
  query
FROM pg_stat_statements
WHERE query LIKE '%type%provider%'
  OR query LIKE '%psychiatrist%'
ORDER BY calls DESC
LIMIT 10;
```

**Look for:**
- `/api/providers/search` query frequency
- Any unbounded provider queries

---

## 3. Estimate Egress by Endpoint

Based on our code analysis, here's the **theoretical** egress per query:

| Endpoint/Query | Rows | Avg Row Size | Per Query | Est. Volume | Daily Egress* |
|----------------|------|--------------|-----------|-------------|---------------|
| **Provider search** | 50 | ~850 bytes | **42.5 KB** | 100-1000/day | 4-42 MB/day |
| **Medication listings (client)** | 145 | ~5 KB | **725 KB** | 50-200/day | 36-145 MB/day |
| **Condition listings (client)** | 130 | ~3 KB | **390 KB** | 50-200/day | 19-78 MB/day |
| **Treatment detail (SSR)** | 1 | ~5 KB | **5 KB** | 100-500/day | 0.5-2.5 MB/day |
| **Provider detail (client)** | 1 | ~850 bytes | **850 bytes** | 50-200/day | 0.04-0.17 MB/day |
| **Build-time (ISR)** | Varies | Varies | Varies | Unknown | **Unknown** |

*Assumes indicated volume - actual may vary significantly

---

## 4. Check for Client-Side Query Issues

### The Hidden Culprit: Client-Side Hooks

Remember, queries from `use-entities.ts` run **in the browser** = egress for every user:

```typescript
// src/lib/hooks/use-entities.ts
export function useMedications() {
  return useQuery({
    queryFn: async () => {
      const { data } = await supabase
        .from("entities")
        .select("*")  // ← Downloads full content to browser
        .eq("type", "medication")
        // ...
    }
  });
}
```

**Every user visiting `/treatments/medications` = 725 KB egress**

### Check Which Pages Use These Hooks

```bash
# Search for hook usage
grep -r "useMedications\|useConditions\|useSupplements" src/app --include="*.tsx"
```

---

## 5. Analyze Server Logs (Vercel)

If you have Vercel Pro, check:
1. Go to Vercel Dashboard → Your Project → Analytics
2. Look at **Function Invocations**:
   - Which API routes get the most traffic?
   - Any routes being hit by crawlers excessively?

3. Check **Edge Network** logs:
   - Look for unusual traffic patterns
   - Identify crawler traffic (User-Agent)

---

## 6. Quick Diagnostic SQL Script

Run this in Supabase SQL Editor to get a comprehensive view:

```sql
-- Comprehensive egress diagnostic
WITH query_stats AS (
  SELECT
    calls,
    total_exec_time,
    mean_exec_time,
    rows,
    (calls * rows) as total_rows,
    query
  FROM pg_stat_statements
  WHERE query LIKE '%entities%'
    AND query NOT LIKE '%pg_stat%'
)
SELECT
  calls as "Times Called",
  rows as "Avg Rows/Call",
  total_rows as "Total Rows Transferred",
  CASE
    WHEN total_rows > 1000000 THEN '🔴 HIGH EGRESS'
    WHEN total_rows > 100000 THEN '🟡 MEDIUM EGRESS'
    ELSE '🟢 LOW EGRESS'
  END as "Egress Level",
  mean_exec_time::numeric(10,2) as "Avg Time (ms)",
  LEFT(query, 150) as "Query Preview"
FROM query_stats
ORDER BY total_rows DESC
LIMIT 25;
```

---

## 7. Check for Build-Time Egress

### ISR Regeneration

Your pages use ISR (Incremental Static Regeneration). Check:

```typescript
// src/app/treatments/[slug]/page.tsx
export const revalidate = 3600; // 1 hour
```

**Every ISR regeneration = database query = egress**

Estimate:
- 500 treatment pages × revalidated every 1 hour × 24 hours = **12,000 queries/day**
- If each query fetches 1 row × 5 KB = **60 MB/day just from ISR**

### Check Build Logs

```bash
# During build, check what gets fetched
npm run build 2>&1 | grep -i "fetch\|query\|entities"
```

---

## 8. Crawler Detection

Crawlers can cause massive egress. Check if you're being crawled excessively:

### Common Culprits
- **Google Bot** - Crawls frequently for SEO
- **Bing Bot** - Less frequent but still significant
- **AI Crawlers** - GPTBot, Claude-Web, etc.
- **SEO Tools** - Ahrefs, SEMrush, Moz

### Check Vercel Logs for Crawler Activity

Look for User-Agents like:
- `Googlebot`
- `Bingbot`
- `GPTBot`
- `AhrefsBot`

---

## 9. Action Items - Start Here

### Step 1: Check Supabase Dashboard (5 minutes)
- [ ] Go to Reports → Database → Egress
- [ ] Note current usage (MB/day or GB/day)
- [ ] Screenshot peak times

### Step 2: Run Diagnostic SQL (5 minutes)
- [ ] Copy the "Comprehensive egress diagnostic" query above
- [ ] Run in Supabase SQL Editor
- [ ] Share results

### Step 3: Check pg_stat_statements (5 minutes)
- [ ] Run "Most Frequent Queries" query
- [ ] Run "Largest Data Transfer Queries" query
- [ ] Identify top 3 egress sources

### Step 4: Analyze Findings
Based on results, determine if egress is from:
- [ ] **Provider searches** → Optimize provider API
- [ ] **Treatment/medication listings** → Move to server-side
- [ ] **Build/ISR regenerations** → Reduce revalidation frequency
- [ ] **Crawlers** → Add robots.txt restrictions
- [ ] **Something else** → Investigate further

---

## 10. Expected Results & Next Steps

### If Provider Searches Are the Issue (>50% of egress)
→ Implement provider API optimization (Option 1 from previous analysis)
→ Expected savings: 50% reduction in provider egress

### If Client-Side Hooks Are the Issue (medications/conditions)
→ Move to server-side API routes with caching
→ Expected savings: 80-90% reduction

### If ISR/Build Is the Issue
→ Increase revalidation intervals
→ Use on-demand revalidation instead of time-based
→ Expected savings: 50-70% reduction

### If Crawlers Are the Issue
→ Add rate limiting
→ Update robots.txt
→ Use Vercel's bot protection
→ Expected savings: Varies (could be 50%+)

---

## Need Help Interpreting Results?

Once you run the diagnostic queries, share:
1. Supabase egress metrics (current usage)
2. Top 10 results from "Comprehensive egress diagnostic"
3. Top 5 results from "Most Frequent Queries"

I'll help you identify the exact source and prioritize optimizations.

---

**Next:** Run the diagnostics above and report back with findings!
