# PRODUCTION AUDIT - REQUIRED PATCHES

## MAJOR RISK #1: Unbounded Queries in Client Hooks

### Problem
Client hooks fetch ALL treatments/conditions without limits:
- `useAllTreatments()`: 568 rows
- `useConditions()`: 130 rows
- `useMedications()`, `useSupplements()`, etc.: No limits

### Impact
- 2-5MB initial data transfer
- 200-500ms query times
- Poor UX with large lists

### Fix Option A: Add Default Limits (Quick Fix - Recommended for Launch)

**File:** `src/lib/hooks/use-entities.ts`

```typescript
// Lines 299-314: Add .limit(100) to useConditions
export function useConditions() {
  return useQuery({
    queryKey: ["conditions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entities")
        .select("*")
        .eq("type", "condition")
        .eq("status", "active")
        .order("title")
        .limit(100);  // ← ADD THIS LINE

      if (error) throw error;
      return data?.map(mapRowToEntityShape) || [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Similar changes for:
// - useMedications() (line 89-114)
// - useInterventionalTreatments() (line 117-133)
// - useSupplements() (line 136-152)
// - useTherapies() (line 155-171)
// - useAlternativeTreatments() (line 175-191)
// - useInvestigationalTreatments() (line 194-210)
// - useProviders() (line 444-460)
```

### Fix Option B: Implement Proper Pagination (Better Long-Term)

Create paginated versions of hooks:

```typescript
export function useConditionsPaginated(page = 1, pageSize = 50) {
  return useQuery({
    queryKey: ["conditions", "paginated", page, pageSize],
    queryFn: async () => {
      const offset = (page - 1) * pageSize;
      const { data, error, count } = await supabase
        .from("entities")
        .select("*", { count: "exact" })
        .eq("type", "condition")
        .eq("status", "active")
        .order("title")
        .range(offset, offset + pageSize - 1);

      if (error) throw error;
      return {
        items: data?.map(mapRowToEntityShape) || [],
        total: count || 0,
        page,
        pageSize,
        hasMore: (count || 0) > offset + pageSize
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
```

### Recommendation
**Apply Option A immediately before launch** (5 minute fix)
**Implement Option B post-launch** for better UX

---

## MAJOR RISK #2: EntityService.getAllTreatments() Unbounded

**File:** `src/lib/data/entity-service.ts`

```typescript
// Lines 332-352: No limit on getAllTreatments
static async getAllTreatments(): Promise<Entity[]> {
  const treatmentTypes = [
    "medication", "therapy", "interventional",
    "supplement", "treatment", "alternative", "investigational",
  ];

  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .in("type", treatmentTypes)
    .eq("status", "active")
    .order("title");  // ← NO LIMIT - fetches all 568 rows!

  if (error) throw error;
  return normalizeEntities(data || []);
}
```

**Fix:**
```typescript
static async getAllTreatments(limit = 100): Promise<Entity[]> {
  const treatmentTypes = [
    "medication", "therapy", "interventional",
    "supplement", "treatment", "alternative", "investigational",
  ];

  const { data, error } = await supabase
    .from("entities")
    .select("*")
    .in("type", treatmentTypes)
    .eq("status", "active")
    .order("title")
    .limit(limit);  // ← ADD THIS

  if (error) throw error;
  return normalizeEntities(data || []);
}
```

---

## MINOR ISSUE #1: Dynamic Sitemap Routes Commented Out

**File:** `src/app/sitemap.ts`
**Lines:** 264-328

**Impact:** Missing 778 individual page URLs from sitemap (SEO)

**Fix:** Uncomment the dynamic routes section after verifying DB is populated:

```typescript
// TODO: Add dynamic routes from database
// Uncomment when ready to fetch from Supabase:
try {
  const { supabase } = await import("@/lib/config/database");

  // ... fetch and add dynamic pages ...
} catch (error) {
  console.error("Error fetching dynamic routes for sitemap:", error);
}
```

---

## VERIFICATION STEPS

1. **Apply pagination fixes**
2. **Run build:** `npm run build`
3. **Test in dev:** Verify list pages load with limits
4. **Check bundle size:** Should remain similar
5. **Deploy to preview:** Test performance
6. **Monitor:** Check Supabase query stats for .limit() usage

---

## ESTIMATED EFFORT

- **Option A (Quick Fix):** 5-10 minutes
- **Option B (Pagination):** 2-3 hours
- **Sitemap Fix:** 5 minutes
- **Testing:** 30 minutes

**Total for launch-critical fixes: ~15 minutes**
