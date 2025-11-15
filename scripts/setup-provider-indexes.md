# Provider Database Indexes Setup

## Problem
Provider queries are timing out (3-4 seconds) due to missing database indexes. This causes:
- "0 results" on first attempt
- Multiple retries needed
- Poor user experience

## Solution
Add database indexes to the `entities` table for provider queries.

## Expected Improvement
- Before: 3000ms+ (often timeout)
- After: <100ms ✅

## Instructions

### Option 1: Via Supabase Dashboard (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your project

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Paste SQL**
   - Open the file: `add-provider-indexes.sql` (in project root)
   - Copy ALL contents
   - Paste into SQL Editor

4. **Execute SQL**
   - Click "Run" or press Cmd/Ctrl + Enter
   - Wait for success message

5. **Verify Indexes**
   - Go to: Database → Tables → entities → Indexes tab
   - You should see 7 new indexes starting with `idx_entities_provider_*`

### Option 2: Via SQL (Manual)

Run this SQL in Supabase SQL Editor:

```sql
-- Index for provider type filtering
CREATE INDEX IF NOT EXISTS idx_entities_provider_type
ON entities(type)
WHERE type = 'provider';

-- Index for state filtering (MOST IMPORTANT for your use case!)
CREATE INDEX IF NOT EXISTS idx_entities_provider_state
ON entities((content->'address'->>'state'))
WHERE type = 'provider';

-- Index for city filtering
CREATE INDEX IF NOT EXISTS idx_entities_provider_city
ON entities((content->'address'->>'city'))
WHERE type = 'provider';

-- Index for zip code filtering
CREATE INDEX IF NOT EXISTS idx_entities_provider_zip
ON entities((content->'address'->>'zip'))
WHERE type = 'provider';

-- GIN index for specialty filtering (array contains)
CREATE INDEX IF NOT EXISTS idx_entities_provider_specialties
ON entities USING GIN ((content->'specialties'))
WHERE type = 'provider';

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_entities_provider_slug
ON entities(slug)
WHERE type = 'provider';

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_entities_provider_state_type
ON entities(type, (content->'address'->>'state'))
WHERE type = 'provider';
```

## What These Indexes Do

1. **idx_entities_provider_type** - Filters all providers quickly
2. **idx_entities_provider_state** - STATE FILTERING (fixes your timeout issue!)
3. **idx_entities_provider_city** - City-based searches
4. **idx_entities_provider_zip** - Zip code searches
5. **idx_entities_provider_specialties** - Specialty filtering
6. **idx_entities_provider_slug** - Individual provider lookups
7. **idx_entities_provider_state_type** - Combined state+type queries

## Testing

After creating indexes, test in your browser:

1. Go to: http://localhost:3000/providers
2. Select a state (e.g., "California")
3. Click "Apply Filters"
4. Should load instantly on FIRST try! ✅

Check the terminal logs - you should see:
```
Found 50 providers, total count: 10033
GET /api/providers/search?state=CA 200 in 100ms
```

Instead of:
```
Supabase query error: { code: '57014', message: 'statement timeout' }
```

## Troubleshooting

If indexes fail to create:
- Check you have database write permissions
- Verify you're using a Supabase service role key
- Check your Supabase project isn't paused
- Contact Supabase support if needed

## Index Maintenance

These indexes are permanent and don't need recreation unless you:
- Drop the entities table
- Reset the database
- Migrate to a new Supabase project
