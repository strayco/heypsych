# Search Function Flow Trace

## Complete Search Flow from Start to Finish

### 1. CLIENT SIDE - Search Page (`src/app/search/page.tsx`)

**Entry Point:** User visits `/search?q=cbt`

**Component:** `SearchPageContent` (client component)

**Flow:**
1. `useSearchParams()` extracts `q` parameter
2. `useEffect` hook triggers when `query` changes
3. Calls `fetch('/api/search?q=cbt&limit=5')` with 30-second timeout
4. Receives response and sets `groupedResults` state
5. Renders results grouped by type (conditions, treatments, resources)

**Key Code:**
```typescript
useEffect(() => {
  if (!query) return;
  
  const fetchResults = async () => {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
    const data = await response.json();
    setGroupedResults({
      conditions: data.conditions?.results || [],
      treatments: data.treatments?.results || [],
      resources: data.resources?.results || [],
      // ... totals
    });
  };
  fetchResults();
}, [query]);
```

---

### 2. API ROUTE - Search Endpoint (`src/app/api/search/route.ts`)

**Route:** `GET /api/search`

**Handler:** `export async function GET(req: NextRequest)`

**Flow:**

#### Step 2.1: Request Validation
- Extract `q`, `limit`, `type` from query params
- Validate query length (min 2 chars)
- Normalize search phrase and extract search terms

#### Step 2.2: Try Direct Database Query (PRIMARY PATH)
```typescript
try {
  // Option A: Type-specific search
  if (type) {
    const result = await queryWithRetry(
      'SELECT * FROM search_entities($1, $2, $3, $4)',
      [searchTerm, limit, 0, type]
    );
  }
  
  // Option B: Grouped search (default)
  const result = await queryWithRetry(
    'SELECT * FROM search_entities_grouped($1, $2)',
    [searchTerm, limit]
  );
  
  // Process results, normalize, return
} catch (dbError) {
  // Fall back to legacy search (see Step 2.3)
}
```

#### Step 2.3: Fallback to Legacy Search
```typescript
catch (dbError) {
  const fallback = await runLegacySearch(...);
  // Returns same structure but uses EntityService (Supabase)
}
```

---

### 3. DATABASE POOL - Connection Management (`src/lib/config/db-pool.ts`)

**Function:** `queryWithRetry(queryText, params)`

**Flow:**

#### Step 3.1: Ensure Connection Ready
```typescript
await ensureConnectionReady();
```

**Function:** `ensureConnectionReady()`

**Flow:**
1. Get pool: `const pool = getDbPool()`
2. Check if idle connections exist: `if (pool.idleCount > 0) return`
3. Check if connection establishment in progress: `if (connectionReadyPromise) await it`
4. **NEW CONNECTION PATH:**
   - Create `connectionReadyPromise` (singleton pattern)
   - Call `pool.connect()` to explicitly get a client
   - Test connection: `await client.query('SELECT 1')`
   - Release client back to pool: `client.release()`
   - Connection stays alive in pool for reuse

#### Step 3.2: Execute Query with Retry
```typescript
for (attempt = 0; attempt <= maxRetries; attempt++) {
  try {
    const result = await pool.query(queryText, params);
    return { rows, rowCount };
  } catch (error) {
    // Check if retryable connection error
    // Exponential backoff and retry
  }
}
```

---

### 4. DATABASE FUNCTIONS

**PostgreSQL Functions:**
- `search_entities(query_text, limit_count, offset_count, type)` - Type-specific search
- `search_entities_grouped(query_text, limit_count)` - All types grouped

**Implementation:** Uses `websearch_to_tsquery()` and `ts_rank()` on `search_vector` column

---

### 5. LEGACY SEARCH FALLBACK (`runLegacySearch`)

**Location:** `src/app/api/search/route.ts`

**Flow:**
```typescript
const [treatments, conditions, resources] = await Promise.all([
  EntityService.getAllTreatments(),
  EntityService.getByEntityType("condition"),
  EntityService.getByEntityType("resource"),
]);
// In-memory filtering and ranking
```

**Uses:** `EntityService` → Supabase client (slower, but works if DB connection fails)

---

## OTHER SEARCH IMPLEMENTATIONS

### 1. Provider Search (`/api/providers/search`)
- **Separate endpoint** for provider search
- Uses Supabase client directly (not direct DB connection)
- Different use case (location-based, specialty filters)
- Excluded from global search

### 2. Client-Side Utilities
- `src/lib/utils/search.ts` - Utility functions (not actively used in search flow)
- `src/lib/hooks/useFuzzySearch.ts` - Client-side fuzzy search hook (not used for main search)

---

## CONNECTION ESTABLISHMENT ISSUE

**Current Problem:** Direct DB connection failing → falls back to legacy search

**Root Cause Investigation:**
- `ensureConnectionReady()` is called before query
- It should establish connection using `pool.connect()`
- But connection might be failing silently
- Error is caught and falls back to legacy search

**Next Steps:**
- Check logs to see if connection establishment is failing
- Verify `pool.connect()` error messages
- Check if connection timeout is the issue


