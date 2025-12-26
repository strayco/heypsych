# Database Cleanup Plan - Duplicate Resources

## Issue
Multiple resources exist in the database with different slugs but identical names, causing duplicates in the A-Z directory.

## Duplicates Found

### 1. 988 Suicide & Crisis Lifeline (2 entries)

**Entry to KEEP:**
- ID: `b8aaf908-d455-47d8-a4ba-364bb1cfa3b5`
- Slug: `988-suicide-crisis-lifeline`
- Title: "988 Suicide & Crisis Lifeline"
- **Reason**: More descriptive slug

**Entry to DELETE:**
- ID: `62875dfe-2eaa-4b6c-9911-ae2f80b0fa3e`
- Slug: `988-lifeline`
- Title: "988 Suicide & Crisis Lifeline"

### 2. Alcoholics Anonymous (2 entries)

**Entry to KEEP:**
- ID: `f5ab282d-6256-4c62-9348-8a52925b37c1`
- Slug: `alcoholics-anonymous`
- Title: "Alcoholics Anonymous (AA)"
- **Reason**: More descriptive slug

**Entry to DELETE:**
- ID: `f8af0a62-f134-43f1-b205-a326f5f265a6`
- Slug: `aa`
- Title: "Alcoholics Anonymous (AA)"

## SQL Commands to Remove Duplicates

```sql
-- Delete duplicate 988 entry
DELETE FROM entities
WHERE id = '62875dfe-2eaa-4b6c-9911-ae2f80b0fa3e'
  AND slug = '988-lifeline';

-- Delete duplicate AA entry
DELETE FROM entities
WHERE id = 'f8af0a62-f134-43f1-b205-a326f5f265a6'
  AND slug = 'aa';
```

## Implementation Status

✅ **Code Fix Applied**: Added deduplication logic to `getResourcesServer()` in [server-queries.ts](src/lib/data/server-queries.ts#L217-L258)
- Deduplicates by resource name (title)
- Prefers entries with longer, more descriptive slugs
- Reduces resource count from 99 to 96

⚠️ **Database Cleanup**: Pending - Need to execute SQL commands above to permanently remove duplicate entries

## Notes

- The deduplication logic in code prevents duplicates from appearing even if they exist in the database
- Removing the database entries is recommended to keep data clean and prevent confusion
- Before deleting, verify no other tables reference these entity IDs
