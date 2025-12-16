# Search & Snippet Extraction Fix

**Date**: November 26, 2025
**Issue**: Search snippets showing JSON syntax, inconsistent results, missing snippets for some matches
**Status**: ✅ Resolved

## Problem Summary

The global search had multiple issues:
1. **Missing snippets**: Some search results showed no snippet text
2. **JSON artifacts in snippets**: Snippets displayed raw JSON syntax like `"approaches": {"medications":`
3. **Inconsistent results**: Searching "adderall" showed 6 results with legacy search, 3 with database search
4. **Overly complex search**: Matching on deeply nested JSON fields users couldn't see

## Root Causes

### 1. Frontend Filtering Out Valid Snippets
**File**: `src/app/search/page.tsx:192-194`

```typescript
// OLD - Too restrictive
const validSnippets = snippets.filter(s =>
  s.snippet && s.snippet.toLowerCase().includes(s.term.toLowerCase())
);
```

**Problem**: Frontend filtered out snippets that didn't contain the exact search term. When searching "adderall" matched articles via "ADHD", snippets were hidden.

**Fix**: Remove term requirement, show all non-empty snippets:
```typescript
// NEW - Show all snippets with content
const validSnippets = snippets.filter(s => s.snippet && s.snippet.trim().length > 0);
```

### 2. Database Connection Using Wrong URL
**File**: `.env.local`

**Problem**: API tried connecting to `db.ceqfyvzexvjlmqusscid.supabase.co` which failed DNS resolution, falling back to legacy file-based search.

**Fix**: Use connection pooler URL that works:
```bash
# OLD
SUPABASE_DB_URL=postgresql://postgres:xxx@db.ceqfyvzexvjlmqusscid.supabase.co:5432/postgres

# NEW
SUPABASE_DB_URL=postgresql://postgres.ceqfyvzexvjlmqusscid:xxx@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

### 3. Snippet Extraction Using Raw JSON Conversion
**File**: `supabase/migrations/015_add_search_snippets.sql` (initial version)

**Problem**: Used `content::text` which converted entire JSONB to string, including all JSON syntax:
```sql
-- PROBLEM
ts_headline('english', COALESCE(e.content::text, e.title || ' ' || e.description))
```

Result: `approaches": {"medications": ["Stimulants: Methylphenidate...`

**Fix**: Extract only meaningful text fields from structured content:
```sql
-- SOLUTION (migration 023)
ts_headline(
  'english',
  COALESCE(e.description, '') || ' ' ||
  COALESCE(e.title, '') || ' ' ||
  -- Extract clean text from specific fields
  COALESCE(
    (SELECT string_agg(value::text, ' ')
     FROM jsonb_array_elements_text(e.content->'tags')), ''
  ) || ' ' ||
  COALESCE(e.content->>'summary', '') || ' ' ||
  -- Article sections (plain text)
  COALESCE(
    (SELECT string_agg(section->>'content', ' ')
     FROM jsonb_array_elements(e.content->'sections') AS section), ''
  ) || ' ' ||
  -- Medication lists (plain text)
  COALESCE(
    (SELECT string_agg(value::text, ' ')
     FROM jsonb_array_elements_text(e.content->'treatment_approaches'->'medications')), ''
  )
)
```

### 4. Double-Nested Content Structure
**File**: `supabase/migrations/024_fix_nested_content_snippet_extraction.sql`

**Problem**: The sync script stores the entire JSON file as `content`, including any nested `content` field. For resources, sections were stored at `content->content->sections` but snippet extraction looked for `content->sections`.

**Example**:
```json
// JSON file structure
{
  "slug": "adhd-medication-shortage",
  "content": {
    "sections": [{"content": "...mentions Intuniv..."}]
  }
}

// Stored in database as entity.content = entire JSON
// So sections are at: entity.content->'content'->'sections'
// But SQL looked for: entity.content->'sections' (wrong!)
```

**Fix**: Check both nesting levels with COALESCE:
```sql
COALESCE(
  (SELECT string_agg(section->>'content', ' ')
   FROM jsonb_array_elements(e.content->'sections') AS section),
  (SELECT string_agg(section->>'content', ' ')
   FROM jsonb_array_elements(e.content->'content'->'sections') AS section),
  ''
)
```

### 5. Search Vector Too Simplified (Then Fixed)
**Evolution**:
1. **Initial**: Searched everything including deep JSON → too many irrelevant matches
2. **Migration 019**: Removed content entirely → missed valid matches (resources with "adderall" in body)
3. **Migration 021** (final): Include content at lowest priority (weight D)

```sql
-- Final search_vector configuration
NEW.search_vector :=
  setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||        -- Highest priority
  setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B') ||  -- High priority
  setweight(to_tsvector('english', content_tags), 'C') ||                   -- Medium priority
  setweight(to_tsvector('english', coalesce(NEW.slug, '')), 'D') ||        -- Low priority
  setweight(to_tsvector('english', coalesce(NEW.content::text, '')), 'D'); -- Low priority (catch-all)
```

## Solution Implementation

### Migration Timeline

1. **013-015**: Initial snippet implementation (had JSON artifact issues)
2. **016**: Simplified to description-only (broke matches on content)
3. **017-018**: Attempted medication extraction (complex, still had issues)
4. **019**: Removed content from search entirely (too simplified)
5. **020**: Attempted to match snippet extraction to simplified search
6. **021**: Added content back to search at low priority ✅
7. **022**: Added content back to snippet extraction (but raw JSON)
8. **023**: Extract meaningful fields only
9. **024**: Fix nested content paths (content->sections vs content->content->sections) - **FINAL WORKING VERSION** ✅

### Final Architecture

#### Search Vector (what gets indexed)
```
Priority A: title
Priority B: description
Priority C: tags
Priority D: slug, full content (catch-all)
```

#### Snippet Extraction (what gets displayed)
```
Sources:
- description (always clean)
- title (always clean)
- tags (text array, clean)
- summary (text field, clean)
- sections[].content (article body text)
- treatment_approaches.medications[] (medication lists)
- real_life_examples[] (example text)

NOT INCLUDED:
- Raw content::text (contains JSON syntax)
- Metadata fields
- Nested object structures
```

#### API Cleaning (belt and suspenders)
Even though snippets are now clean from the database, API still has cleaning regex for safety:
```typescript
const cleanedSnippet = item.snippet
  .replace(/<b>/g, '')
  .replace(/<\/b>/g, '')
  .replace(/"\w+"\s*:\s*"/g, '')  // "field": "
  .replace(/\w+"\s*:\s*"/g, '')   // field": "
  .replace(/"\s*,\s*"/g, ', ')    // ", "
  .replace(/"\s*,/g, ',')         // ",
  .replace(/,\s*"/g, ',')         // ,"
  .replace(/[{}\[\]]/g, '')       // Brackets
  .replace(/^["'\s:,]+|["'\s:,]+$/g, '') // Trim junk
  .replace(/\s+/g, ' ')
  .trim();
```

## Results

### Before
- ❌ Search "adderall" → 6 results (inconsistent)
- ❌ Snippets missing for resources
- ❌ Snippets showing: `approaches": {"medications": ["Stimulants...`
- ❌ Database connection failing, using legacy search

### After
- ✅ Search "adderall" → 6 results (consistent)
- ✅ All results have clean, readable snippets
- ✅ Snippets show: `Stimulants: Methylphenidate ER (Concerta), Mixed Amphetamine Salts (Adderall)...`
- ✅ Database search working, no fallback needed

### Example Output

**Query**: "adderall"

**Results with clean snippets**:
1. **ADHD Condition**: `Stimulants: Methylphenidate ER (Concerta), Mixed Amphetamine Salts (Adderall) Non-stimulants: Atomoxetine (Strattera)...`
2. **Stimulant Condition**: `A college student abusing Adderall during finals and experiencing paranoia...`
3. **ADHD Article 1**: `One woman's story of finally understanding her lifelong struggles`
4. **ADHD Article 2**: `Practical advice for managing ADHD when your usual medication is`
5. **Treatment 1**: `Mixed Amphetamine Salts (Adderall) adhd stimulant amphetamine narcolepsy A central nervous system stimulant...`
6. **Treatment 2**: (duplicate entry, data issue to fix separately)

## Key Learnings

### 1. Don't Convert Complex JSON to Text
Converting `content::text` seems simple but creates unmaintainable snippet text full of JSON syntax. Instead, explicitly extract the fields you want.

### 2. Match Snippet Sources to Search Sources
If searching content, snippets must also search content to show WHERE the match occurred. Otherwise you get matches with no visible explanation.

### 3. Search Vector Weights Matter
Use weights to prioritize visible user-facing fields (title, description) over catch-all content matching:
- **Weight A/B**: Title, description (what users expect to match)
- **Weight C**: Tags, keywords
- **Weight D**: Content, metadata (catch-all for body text matches)

### 4. Handle Nested Content Structures
When syncing JSON files that have a `content` field to a database `content` column, the content becomes double-nested. Always check both levels:
- `entity.content->sections` (flat structure)
- `entity.content->content->sections` (nested structure)

Use COALESCE to gracefully handle both patterns.

### 5. Frontend Should Trust Backend Snippets
Don't filter snippets based on whether they contain the exact search term. Show all snippets from the database - they're there for a reason (related term matches, synonyms, etc).

### 6. Connection Pooler for Reliability
Direct database URLs can have DNS issues. Use connection pooler URLs for better reliability:
- Direct: `db.{project}.supabase.co:5432` ❌
- Pooler: `aws-0-us-west-1.pooler.supabase.com:6543` ✅

## Testing Search Changes

### Test Queries
```sql
-- Check what's being searched
SELECT title,
       ts_rank(search_vector, websearch_to_tsquery('english', 'adderall')) as rank
FROM entities
WHERE search_vector @@ websearch_to_tsquery('english', 'adderall')
ORDER BY rank DESC;

-- Check snippet quality
SELECT title, snippet
FROM search_entities_grouped('adderall', 10);

-- Verify no JSON artifacts
SELECT title, snippet
FROM search_entities_grouped('adderall', 10)
WHERE snippet LIKE '%":%' OR snippet LIKE '%{%' OR snippet LIKE '%[%';
-- Should return 0 rows
```

### After Changing search_vector Logic
Always rebuild search vectors:
```bash
psql $DB_URL -f supabase/scripts/rebuild-search-vectors.sql
```

### After Changing snippet extraction
Just reload the function:
```bash
psql $DB_URL -f supabase/migrations/023_extract_meaningful_content_for_snippets.sql
```

## Files Changed

### Database Migrations
- `supabase/migrations/021_add_content_back_to_search.sql` - Search vector configuration
- `supabase/migrations/023_extract_meaningful_content_for_snippets.sql` - Snippet extraction logic
- `supabase/migrations/024_fix_nested_content_snippet_extraction.sql` - Fix for double-nested content paths

### Application Code
- `src/app/search/page.tsx` - Frontend snippet filtering logic
- `.env.local` - Database connection URL

### Scripts
- `supabase/scripts/rebuild-search-vectors.sql` - Batch rebuild utility (unchanged, just used)

## Future Improvements

1. ~~**Deduplicate treatments**: Fix duplicate "Mixed Amphetamine Salts (Adderall)" entries in database~~ ✅ Fixed Nov 28, 2025
2. **Highlight search terms**: Consider keeping `<b>` tags and styling them instead of removing
3. **Relevance tuning**: Adjust weight priorities based on user feedback
4. **Snippet length**: Make `MaxWords` parameter configurable per entity type
5. **Multi-term queries**: Better handling of phrase searches vs individual terms

## Related Issues
- ASSIST assessment cross-link fix (substance-use-disorders slug)
- Database connection fallback to legacy search
- JSON artifact cleaning in API route

---

## Update: Entity Type Normalization & Duplicate Cleanup

**Date**: November 28, 2025
**Issue**: Duplicate entities and inconsistent entity types breaking search
**Status**: ✅ Resolved

### Problem Summary

Search was missing results because:
1. **Duplicate entities**: 205+ entities had multiple database entries (e.g., same slug with `type: medication` AND `type: antidepressant`)
2. **Specific entity types**: JSON files had specific types (`antidepressant`, `anxiolytic`, `antipsychotic`) but search only queried broad types (`medication`, `therapy`, etc.)
3. **Sync script bug**: `sync-json-to-db.ts` used `content.type` from JSON files instead of directory structure

### Root Cause

**File**: `scripts/sync-json-to-db.ts:114-118`

```typescript
// OLD - Used content.type which had specific subtypes
function determineEntityType(filePath: string, content: any): string {
  if (content.type) {
    return content.type;  // Returns "antidepressant", "anxiolytic", etc.
  }
  // ... fallback to directory
}
```

**Problem**: JSON files have `"type": "antidepressant"` but search queries for `type IN ('medication', 'therapy', ...)`. Entities with specific types were invisible to search.

**Example**:
- `alprazolam-Xanax.json` has `"type": "medication"` ✅
- `escitalopram-Lexapro.json` had `"type": "antidepressant"` ❌ (not in search filter)

### Solution

#### 1. Fixed Sync Script

**File**: `scripts/sync-json-to-db.ts`

```typescript
// NEW - Use directory structure for treatments (enables search)
function determineEntityType(filePath: string, content: any): string {
  // For treatments, use directory structure for broad types
  if (filePath.includes("/treatments/medications/")) return "medication";
  if (filePath.includes("/treatments/therapy/")) return "therapy";
  if (filePath.includes("/treatments/interventional/")) return "interventional";
  if (filePath.includes("/treatments/investigational/")) return "investigational";
  if (filePath.includes("/treatments/alternative/")) return "alternative";
  if (filePath.includes("/treatments/supplements/")) return "supplement";
  if (filePath.includes("/treatments/")) return "treatment";
  
  // For non-treatments, use content.type or infer from path
  if (filePath.includes("/conditions/")) return "condition";
  if (filePath.includes("/resources/")) return "resource";
  
  if (content.type) return content.type;
  return "unknown";
}
```

#### 2. Cleaned Up Database

```javascript
// Deleted 205 duplicate entries
// Normalized 161 specific types → "medication"
// Final state: 0 duplicates, 8 clean types
```

#### 3. Verified Search Works

```bash
# Before fix
curl "/api/search?q=xanax" → 0 results (alprazolam-xanax had type "anxiolytic")

# After fix  
curl "/api/search?q=xanax" → 1 result (alprazolam-xanax has type "medication")
```

### Valid Entity Types

After cleanup, only these types exist in database:

| Type | Count | Searchable |
|------|-------|------------|
| `medication` | 248 | ✅ treatments |
| `therapy` | 91 | ✅ treatments |
| `investigational` | 27 | ✅ treatments |
| `alternative` | 74 | ✅ treatments |
| `interventional` | 37 | ✅ treatments |
| `condition` | 130 | ✅ conditions |
| `resource` | 15 | ✅ resources |
| `hotline` | 8 | ✅ resources |
| `directory` | 5 | ✅ resources |
| `provider` | 455 | ✅ providers |

**Total**: ~1000 entities, all searchable

### Prevention

The sync script now enforces broad types based on directory structure. JSON files can have any `type` value for display purposes, but the database will always use the correct broad type for search.

### Commands

```bash
# Sync treatments (uses fixed script)
npm run sync:treatments

# Full sync
npm run sync:content

# Audit for duplicates (should return 0)
node -e "..." # See audit script in codebase
```

### Files Changed

- `scripts/sync-json-to-db.ts` - Fixed `determineEntityType()` to use directory structure
- Database: Cleaned 205 duplicates, normalized 161 specific types
