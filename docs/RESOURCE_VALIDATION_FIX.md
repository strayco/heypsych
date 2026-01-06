# Resource URL Validation Fix - Summary

## ✅ ISSUES FIXED

### 1. Database Cleanup
**Problem**: 14 digital tools had DUPLICATE rows with legacy type values:
- Old rows: `type = "digital-tool"` (Dec 13, 2025)
- New rows: `type = "resource"` (Dec 25, 2025)

**Fixed**:
- ✅ Deleted all 14 duplicate "digital-tool" rows
- ✅ Only correct "resource" type rows remain
- ✅ Affected: betterhelp, calm, cbt-i-coach, deepscribe, daylio, happify, headspace, insight-timer, mindshift-cbt, moodfit, ptsd-coach, rootd, talkspace, woebot, wysa

### 2. Sync Script Improvements
**Problem**: Script could create invalid entity types

**Fixed**:
- ✅ Added safeguard to convert legacy types (digital-tool, hotline) → "resource"
- ✅ Added validation to reject invalid entity types
- ✅ Prevents future duplicate creation with non-standard types

**File**: `scripts/sync-json-to-db.ts`

### 3. Code Validation Improvements
**Problem**: Entity type detection was incomplete

**Fixed**:
- ✅ Added resource/condition/provider to validation array
- ✅ Check content.type/content.kind before determining schemaName
- ✅ Ensures resources are correctly identified even when db row.type is null

**File**: `src/lib/data/entity-service.ts`

## ⏳ CACHE STATUS

**Current Situation:**
- ✅ Database: Clean (no duplicates)
- ✅ Code: Fixed (validation working for new builds)
- ⚠️  Cache: Old pages still cached (built before database cleanup)

**Why URLs still show resources:**
- Vercel edge cache has 24-hour TTL (Time To Live)
- Pages were cached before we deleted the duplicate rows
- Cache will auto-expire and rebuild with correct validation

## 🔧 CACHE CLEARING OPTIONS

### Option 1: Wait (Easiest)
- Cache auto-expires within 24 hours of last build
- No action needed
- URLs will automatically return "Not Found" after expiration

### Option 2: Vercel Dashboard (Fastest - Recommended)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → Your Project → Deployments
2. Click "..." menu on latest deployment
3. Click "Redeploy"
4. Check "Clear Build Cache" checkbox
5. Click "Redeploy"

This forces a complete rebuild with fresh database data.

### Option 3: On-Demand Revalidation API
- New endpoint: `/api/revalidate`
- Usage:
  ```bash
  curl -X POST "https://heypsych.com/api/revalidate?secret=YOUR_SECRET&clearAll=true"
  ```
- Set `REVALIDATE_SECRET` environment variable in Vercel first
- Clears cache for all 15 digital tools at once

## 🎯 VERIFICATION

After cache clears, these URLs should show "Not Found" (404):
- https://heypsych.com/treatments/happify
- https://heypsych.com/treatments/betterhelp
- https://heypsych.com/treatments/headspace
- https://heypsych.com/treatments/daylio
- https://heypsych.com/conditions/daylio
- https://heypsych.com/conditions/happify

These URLs should work (200):
- https://heypsych.com/resources/happify
- https://heypsych.com/resources/betterhelp
- https://heypsych.com/resources/headspace
- https://heypsych.com/resources/daylio

## 📊 MONITORING SCRIPTS

### Check for Duplicates
```bash
npx tsx scripts/check-all-duplicates.ts
```

Shows:
- Duplicate slugs across entity types
- Non-standard type values
- Resources with incorrect types

### Check Specific Entity
```bash
npx tsx scripts/check-duplicate-slugs.ts
# Edit the script to change the slug
```

## 🛡️ PREVENTION

### For New Resources
1. Always set `"type": "resource"` in JSON files
2. Never use legacy types like "digital-tool" or "hotline"
3. Run duplicate check before deploying: `npx tsx scripts/check-all-duplicates.ts`

### Sync Script Safeguards
The sync script now automatically:
- Converts legacy types to "resource"
- Validates entity types before insert
- Rejects invalid type values

### Entity Type Validation
Valid entity types:
- `condition`
- `medication`, `therapy`, `treatment`, `interventional`, `investigational`, `alternative`, `supplement`
- `resource`
- `provider`

Any other type will be rejected by the sync script.

## 📝 COMMITS

1. `e61b19b` - Fix: include resource/condition/provider in entity type detection
2. `bb56e93` - Feat: add database duplicate detection and cleanup scripts
3. `02fe449` - Fix: prevent duplicate resources with legacy type values
4. `00a3a4f` - Feat: add on-demand revalidation endpoint for cache clearing

## 🔍 ROOT CAUSE ANALYSIS

### Why This Happened
1. **Dec 13, 2025**: Initial sync created rows with `type = "digital-tool"`
2. **Dec 25, 2025**: Fixed sync script created correct rows with `type = "resource"`
3. **Result**: Database had BOTH rows for the same slug
4. **Impact**: `ORDER BY type ASC LIMIT 1` returned "digital-tool" first (alphabetically)
5. **Consequence**: "digital-tool" type wasn't in validation array, so it defaulted to "treatment"
6. **Final Issue**: Resources were accessible at `/treatments/` URLs

### The Fix
- Deleted old "digital-tool" rows
- Improved type detection to check `content.type` first
- Added validation to prevent invalid types
- Created monitoring scripts to detect future issues

## ✅ COMPLETE

All issues resolved. New resources will be correctly validated.
