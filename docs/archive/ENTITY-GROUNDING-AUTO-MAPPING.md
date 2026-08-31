# Automatic Entity Grounding & Wikidata Mapping

## Overview

The system now supports **automatic Wikidata QID mapping** for mental health entities. New entities automatically get mapped to Wikidata without manual intervention.

## How It Works

### 3-Tier Priority System

When generating Schema.org `sameAs` links, the system checks sources in this order:

1. **Entity Metadata** (highest priority)
   - Checks `metadata.wikidata_qid` in the entity JSON file
   - Most flexible - can be edited per entity

2. **Hardcoded Mapping** (second priority)
   - Checks `knowledge-graph-mapper.ts` static mappings
   - Fast, reliable, version-controlled
   - Currently covers 531/774 entities (68.6%)

3. **Automatic Lookup** (third priority, optional)
   - Uses Wikidata Search API to find QIDs automatically
   - Caches results in memory
   - Enabled via `ENABLE_AUTO_WIKIDATA_MAPPING=true`

## Adding Wikidata QIDs to New Entities

### Option 1: Add to JSON Metadata (Recommended)

When creating a new entity JSON file, include the Wikidata QID:

```json
{
  "name": "Social Anxiety Disorder",
  "description": "...",
  "metadata": {
    "wikidata_qid": "Q204175",
    "icd10_code": "F40.1",
    "snomed_ct": "23946007"
  }
}
```

### Option 2: Run Auto-Mapping Script

Automatically search Wikidata and update all unmapped entities:

```bash
# Preview changes (dry run)
npm run map:wikidata:dry

# Map all unmapped entities
npm run map:wikidata

# Map only specific types
npm run map:wikidata:conditions
npm run map:wikidata:treatments
```

The script will:
- Search Wikidata for each unmapped entity
- Use fuzzy matching with context-aware queries
- Update JSON files with `wikidata_qid` in metadata
- Respect API rate limits (1 req/sec)

### Option 3: Add to Hardcoded Mapper

For frequently-accessed entities, add to `src/lib/seo/knowledge-graph-mapper.ts`:

```typescript
const CONDITION_WIKIDATA_MAP: Record<string, string> = {
  'social-anxiety-disorder': 'Q204175',
  // ... more mappings
};
```

## Usage Examples

### Mapping Workflow for New Entities

1. **Create entity JSON file:**
   ```json
   {
     "name": "New Treatment",
     "description": "...",
     "metadata": {}
   }
   ```

2. **Run auto-mapping:**
   ```bash
   npm run map:wikidata:dry  # Preview
   npm run map:wikidata       # Apply
   ```

3. **Verify mapping:**
   ```bash
   cat data/treatments/new-treatment.json
   # Should now have: "wikidata_qid": "Q12345"
   ```

4. **Sync to database:**
   ```bash
   npm run sync:content
   ```

### Runtime Auto-Lookup (Development)

Enable automatic Wikidata lookups in development:

```bash
# .env.local
ENABLE_AUTO_WIKIDATA_MAPPING=true
```

Now unmapped entities will automatically search Wikidata at runtime (cached for performance).

## API Reference

### `searchWikidataQID(entityName, entityType)`

Search Wikidata for an entity and return the best QID match.

```typescript
import { searchWikidataQID } from '@/lib/seo/auto-entity-mapper';

const qid = await searchWikidataQID('Major Depressive Disorder', 'condition');
// Returns: 'Q42844'
```

### `getWikidataQID(entity, hardcodedMap, entityType)`

Get QID with automatic fallback priority.

```typescript
import { getWikidataQID } from '@/lib/seo/auto-entity-mapper';
import { CONDITION_WIKIDATA_MAP } from '@/lib/seo/knowledge-graph-mapper';

const qid = await getWikidataQID(entity, CONDITION_WIKIDATA_MAP, 'condition');
```

## Coverage Statistics

Current mapping coverage:

```
Conditions:  130/130 (100%) ✅
Treatments:  369/548 (67%)  ⏳
Resources:    32/96  (33%)  ⏳
Total:       531/774 (68.6%)
```

View coverage:
```typescript
import { getKnowledgeGraphCoverage } from '@/lib/seo/knowledge-graph-mapper';

const stats = getKnowledgeGraphCoverage();
console.log(stats);
// { conditions: 130, treatments: 369, resources: 32, total: 531 }
```

## Best Practices

### When to Use Each Method

| Method | Use Case | Pros | Cons |
|--------|----------|------|------|
| **JSON Metadata** | New entities, one-off additions | Flexible, per-entity control | Requires manual lookup |
| **Auto-Script** | Batch processing, bulk imports | Fast, automatic | May have false matches |
| **Hardcoded Map** | High-traffic entities, core conditions | Fastest, most reliable | Requires code changes |

### Recommendations

1. **For core entities** (top 100 conditions/treatments):
   - Use hardcoded mappings for performance
   - Most reliable, version-controlled

2. **For new entities:**
   - Run auto-mapping script first
   - Review and verify QIDs
   - Add to hardcoded map if frequently accessed

3. **For bulk imports:**
   - Use auto-mapping script
   - Run in dry-run mode first
   - Verify results before committing

## Troubleshooting

### "No QID found for entity"

The Wikidata search couldn't find a match. Manual steps:

1. Search manually: https://www.wikidata.org/
2. Find the correct QID
3. Add to entity JSON:
   ```json
   {
     "metadata": {
       "wikidata_qid": "Q12345"
     }
   }
   ```

### "Rate limit exceeded"

The script respects Wikidata's rate limits (1 req/sec). If you hit limits:

```bash
# Process in batches
npm run map:wikidata:conditions  # First batch
# Wait 5 minutes
npm run map:wikidata:treatments  # Second batch
```

### "Wrong QID assigned"

The auto-mapping may occasionally make mistakes. To fix:

1. Manually correct in JSON file:
   ```json
   {
     "metadata": {
       "wikidata_qid": "Q_CORRECT_ID"
     }
   }
   ```

2. Or add to hardcoded mapping override

## Future Enhancements

- [ ] Machine learning model for better QID matching
- [ ] Integration with other knowledge graphs (DBpedia, SNOMED CT)
- [ ] Automatic ICD-10/SNOMED CT code lookup
- [ ] Bulk verification tool for QID accuracy
- [ ] Web UI for reviewing and approving auto-mappings

## Contributing

To improve auto-mapping accuracy:

1. Review auto-mapped QIDs
2. Report false matches
3. Suggest better search heuristics
4. Add domain-specific keywords to `buildSearchQuery()`
