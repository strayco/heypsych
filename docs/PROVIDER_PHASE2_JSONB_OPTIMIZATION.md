# Provider Phase 2: JSONB Field Selection Optimization

**Status:** 🟡 PREPARED (Not yet implemented - implement only if Phase 1 caching insufficient)

---

## When to Implement Phase 2

Only proceed if **after 48 hours** of Phase 1 monitoring you see:

1. **High Supabase egress** still exceeding limits
2. **Low cache hit rate** (<50% of searches are cached hits)
3. **High unique search volume** (>500-1000 unique queries/day)

**Expected additional savings:** 50% reduction on top of Phase 1 caching

---

## Overview

### Current (Phase 1)

```typescript
// Line 82-84 in route.ts
.select("slug, content", { count: "exact" })
```

- Transfers full `content` JSONB from database
- Size: ~850 bytes per provider
- 50 providers = **42.5 KB per query**

### Optimized (Phase 2)

```typescript
.select(`
  slug,
  content->>'npi' as npi,
  content->>'first_name' as first_name,
  content->>'last_name' as last_name,
  content->>'suffix' as suffix,
  content->>'credentials' as credentials,
  content->>'taxonomy_code' as taxonomy_code,
  content->'specialties' as specialties,
  content->'address' as address,
  content->>'phone' as phone
`, { count: "exact" })
```

- Transfers only needed fields
- Size: ~400 bytes per provider
- 50 providers = **~20 KB per query** (53% reduction)

**Excludes (not needed for listings):**
- `bio` (~200 bytes)
- `treatment_philosophy` (~200 bytes)
- `research_interests` (~100 bytes)
- `medical_school`, `residency`, `fellowship` (~100 bytes)
- `hospital_affiliations`, `subspecialties`, etc.

---

## Implementation Steps

### Step 1: Backup Current Route

```bash
cp src/app/api/providers/search/route.ts src/app/api/providers/search/route.ts.backup
```

### Step 2: Update Query (Line 82-84)

**BEFORE:**
```typescript
let query = supabaseAdmin
  .from("entities")
  .select("slug, content", { count: "exact" })
  .eq("type", "provider")
  .not("content", "is", null)
  .order("slug");
```

**AFTER:**
```typescript
let query = supabaseAdmin
  .from("entities")
  .select(`
    slug,
    content->>'npi' as npi,
    content->>'first_name' as first_name,
    content->>'last_name' as last_name,
    content->>'suffix' as suffix,
    content->>'credentials' as credentials,
    content->>'taxonomy_code' as taxonomy_code,
    content->'specialties' as specialties,
    content->'address' as address,
    content->>'phone' as phone
  `, { count: "exact" })
  .eq("type", "provider")
  .not("content", "is", null)
  .order("slug");
```

### Step 3: Update Mapping Code (Lines 240-290)

The returned data structure will be different. Instead of:
```typescript
{
  slug: "...",
  content: { npi: "...", first_name: "...", ... }
}
```

You'll get:
```typescript
{
  slug: "...",
  npi: "...",
  first_name: "...",
  // ... (flattened)
}
```

**Update mapping:**

**BEFORE:**
```typescript
const providers = (data ?? []).map((row: any) => {
  const content = row.content || {};

  const firstName = content.first_name || "";
  const lastName = content.last_name || "";
  const specialties = Array.isArray(content.specialties)
    ? content.specialties
    : ["general_psychiatry"];

  return {
    npi: content.npi || row.id,
    slug: row.slug || `provider-${row.id}`,
    name: {
      first: firstName,
      last: lastName,
      suffix: content.suffix || null,
      credential: content.credentials || null,
    },
    // ...
  };
});
```

**AFTER:**
```typescript
const providers = (data ?? []).map((row: any) => {
  // Data is now flattened at row level
  const firstName = row.first_name || "";
  const lastName = row.last_name || "";
  const specialties = Array.isArray(row.specialties)
    ? row.specialties
    : ["general_psychiatry"];

  return {
    npi: row.npi || row.id,
    slug: row.slug || `provider-${row.id}`,
    name: {
      first: firstName,
      last: lastName,
      suffix: row.suffix || null,
      credential: row.credentials || null,
    },
    taxonomy: {
      primary: {
        code: row.taxonomy_code || null,
        specialization: specialties[0] || "General Psychiatry",
      },
    },
    specialties: specialties,
    business: {
      practiceAddress: {
        city: row.address?.city || "",
        state: row.address?.state || "",
      },
      phone: row.phone || null,
    },
  };
});
```

### Step 4: Update Filter Queries (Lines 74-126)

Some filters access nested content fields. These need updating:

**Name search (Line 76):**
```typescript
// BEFORE
query = query.ilike("content->>full_name", searchTerm);

// AFTER - No change needed (full_name not selected, still accessible)
query = query.ilike("content->>full_name", searchTerm);
```

**State filter (Line 80):**
```typescript
// No change needed - same syntax works
query = query.eq("content->address->>state", qParams.state.toUpperCase());
```

**All other filters remain the same** - they access `content` in the WHERE clause, not the SELECT clause.

### Step 5: Update Field Validation (Lines 244-257)

**BEFORE:**
```typescript
const content = row.content || {};
if (!content.first_name) missingFields.push('first_name');
if (!content.last_name) missingFields.push('last_name');
// ...
```

**AFTER:**
```typescript
// Data is flattened now
if (!row.first_name) missingFields.push('first_name');
if (!row.last_name) missingFields.push('last_name');
if (!row.credentials) missingFields.push('credentials');
if (!row.address?.city || !row.address?.state) missingFields.push('address');
if (!Array.isArray(row.specialties) || row.specialties.length === 0) {
  missingFields.push('specialties');
}
```

### Step 6: Update Egress Estimation (Line 191)

```typescript
// BEFORE
const estimatedEgressBytes = (data?.length || 0) * 850;

// AFTER - Reflect new smaller size
const estimatedEgressBytes = (data?.length || 0) * 400;
const estimatedEgressKB = (estimatedEgressBytes / 1024).toFixed(2);
```

---

## Testing Checklist

### 1. Test API Response Shape

```bash
# Local test
curl "http://localhost:3000/api/providers/search?state=CA&limit=5" | jq .

# Verify response structure:
# - providers[].npi exists
# - providers[].name.first exists
# - providers[].business.practiceAddress.city exists
```

### 2. Test All Filters

```bash
# State filter
curl "http://localhost:3000/api/providers/search?state=NY&limit=5"

# City filter
curl "http://localhost:3000/api/providers/search?state=NY&city=New%20York&limit=5"

# Specialization filter
curl "http://localhost:3000/api/providers/search?specialization=child_adolescent&limit=5"

# Combined filters
curl "http://localhost:3000/api/providers/search?state=CA&city=Los%20Angeles&specialization=forensic&limit=5"
```

### 3. Test Provider Card Rendering

1. Go to `/psychiatrists` in browser
2. Search for providers
3. Verify cards display correctly:
   - ✅ Name + credentials
   - ✅ Location (city, state)
   - ✅ Specialties badges
   - ✅ Practice info
   - ✅ No missing data warnings

### 4. Test Provider Detail Page

1. Click "View Profile" on a provider card
2. Verify detail page loads correctly
3. **Note:** Detail page uses separate query (`.select("*")`) so it still gets full content

### 5. Check Logs for Reduced Egress

```bash
vercel logs --follow | grep "estimatedEgressKB"
```

**Before Phase 2:**
```
estimatedEgressKB: "41.50"  // 850 bytes × 50 providers
```

**After Phase 2:**
```
estimatedEgressKB: "19.50"  // 400 bytes × 50 providers ✅
```

---

## Risks & Mitigation

### Risk 1: Missing Fields in Provider Card

**Symptom:** Provider cards show blank name, missing address, etc.

**Mitigation:**
- Field validation (already implemented) will log warnings
- Graceful fallbacks in mapping code (already present)
- Test with multiple providers before deploying

**Rollback:**
```bash
git revert HEAD
git push origin main
# Or restore from backup:
cp src/app/api/providers/search/route.ts.backup src/app/api/providers/search/route.ts
```

### Risk 2: Filter Queries Break

**Symptom:** Searches return no results or throw errors

**Mitigation:**
- Filters access `content` in WHERE clause (not affected by SELECT)
- Test all filter combinations before deploying
- Monitor error logs after deployment

### Risk 3: Monthly Import Script Changes Schema

**Symptom:** New fields added to provider data, not included in SELECT

**Mitigation:**
- Field validation logs warnings for missing required fields
- Review import script before monthly updates
- Add new fields to SELECT if they become required

---

## Deployment

Same process as Phase 1:

```bash
# Commit changes
git add src/app/api/providers/search/route.ts
git commit -m "feat(providers): optimize query with JSONB field selection (Phase 2)

- Select only needed fields from content JSONB
- Reduce per-provider payload from ~850 to ~400 bytes (53% reduction)
- Update mapping code to handle flattened response structure
- Maintain backward compatibility with provider cards

Expected impact: Additional 50% egress reduction on top of Phase 1 caching"

# Deploy
git push origin main
```

---

## Expected Results (Combined Phases 1+2)

| Metric | Baseline | After Phase 1 | After Phase 2 | Total Improvement |
|--------|----------|---------------|---------------|-------------------|
| **Per-query egress (cached)** | 42.5 KB | ~0 KB | ~0 KB | **100%** |
| **Per-query egress (unique)** | 42.5 KB | 42.5 KB | **20 KB** | **53%** |
| **Daily egress (1000 searches)** | 40-50 MB | 8-20 MB | **4-10 MB** | **75-90%** |

**Assumptions:**
- 1000 searches/day
- 80% are cached hits (Phase 1)
- 20% are unique queries (Phase 2 optimizes these)

---

## Monitoring Post-Deployment

1. **Check logs for reduced egress:**
   ```bash
   vercel logs --follow | grep "estimatedEgressKB"
   ```
   Should see **~19-20 KB** instead of **~41-42 KB**

2. **Verify no errors:**
   ```bash
   vercel logs --follow | grep "error\|Error"
   ```

3. **Check Supabase dashboard** (48 hours later):
   - Reports → Database → Egress
   - Should see further reduction from Phase 1 baseline

4. **Test provider directory:**
   - Visit `/psychiatrists`
   - Search with various filters
   - Click into provider detail pages
   - Verify no UI regressions

---

## Rollback Plan

If issues arise:

```bash
# Option 1: Revert commit
git revert HEAD
git push origin main

# Option 2: Restore from backup
cp src/app/api/providers/search/route.ts.backup src/app/api/providers/search/route.ts
git add src/app/api/providers/search/route.ts
git commit -m "revert: restore provider API to Phase 1 state"
git push origin main
```

---

## Status: READY BUT NOT DEPLOYED

**This optimization is PREPARED but NOT IMPLEMENTED.**

**Next actions:**
1. ✅ Deploy Phase 1 (diagnostics + caching)
2. ⏳ Monitor for 48 hours
3. 📊 Analyze egress metrics
4. 🎯 If still high, implement Phase 2 using this guide

---

**Questions?** Refer to Phase 1 implementation first, then revisit this guide if additional optimization is needed.
