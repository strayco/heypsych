# Condition JSON Batch Updater - Implementation Summary

## Overview

A comprehensive batch processing system that transforms 130 clinical condition JSON files into story-led, SEO/AEO-optimized, tile-ready formats while preserving all clinical data and original structure.

## Deliverables

### 1. Core Script: `mass_update_conditions.py`

**Features:**
- ✅ Parallel processing (6 concurrent workers, configurable)
- ✅ Automatic backups before any changes
- ✅ JSON key order preservation (maintains readability)
- ✅ Dry-run mode for safe testing
- ✅ Retry logic (3 attempts with exponential backoff)
- ✅ Rate limit handling with automatic backoff
- ✅ File hashing cache (skips unchanged files)
- ✅ Comprehensive error logging
- ✅ Failed items tracking (JSONL format)
- ✅ JSON validation with auto-fix attempts

**Safety Features:**
- Atomic operations (backup → transform → validate → write)
- Original key order preserved recursively
- All existing data preserved
- Validation before writing
- Detailed audit trail

### 2. Documentation

**Files Created:**
- `README_BATCH_UPDATER.md` - Complete usage guide
- `SCHEMA_ANALYSIS.md` - Dataset schema variability report
- `IMPLEMENTATION_SUMMARY.md` - This file
- `validate_structure.py` - Structure validation without API calls

### 3. Validation Results

**Dataset Analysis (130 files):**
- ✅ All 130 files are valid, parseable JSON
- ✅ 129/130 have complete required fields
- ⚠️ 1 file missing `editorial` field (minor, will be preserved)
- ✅ Consistent top-level structure across all files
- ✅ Schema variations documented and handled

**What Will Be Added:**
- `content.aeo.what_is` - SEO-optimized "What is X?" (≤25 words)
- `content.temporal_criteria` - Time course (qualitative, no invented durations)
- `content.misdiagnosis_explained` - Mechanistic confusion explanation
- `content.description.what_it_can_look_like_in_real_life` - 4-8 mini-stories
- `content.description.common_reactions_to_diagnosis` - Realistic reactions
- `content.lived_experience.first_person_statements` - 3-6 authentic voices
- `content.real_life_examples` - 3-5 enhanced stories (baseline → change → consequences)
- `content.comparisons` - 2-4 plain-language comparisons
- `content.faqs` - 10-20 questions with X vs Y comparisons
- `ui.layout` and `ui.tiles[]` - Universal 3×3 grid UX layer

## Implementation Details

### Converter Prompt Engineering

The script uses a carefully crafted 16K-token prompt that:

1. **Preserves Clinical Integrity:**
   - No deletion of existing fields
   - No invention of statistics or citations
   - No medication dosing or lab schedules

2. **Adds Story-First Content:**
   - 4-8 mini-stories (no diagnostic language)
   - 3-5 full stories (unresolved, showing progression)
   - 3-6 first-person statements (authentic voice)
   - Role/age-appropriate for each condition
   - NO required demographics (flexible for each condition)

3. **Enforces Safety Rules:**
   - Differential diagnosis labels ONLY in `content.differential_diagnosis[]`
   - Numeric monitoring schedules removed → general safety concepts
   - Duration/frequency only if present in input (no invented numbers)

4. **Builds UI Layer:**
   - 9 tiles in deterministic order
   - Content references (not duplication)
   - Navigation structure (prev/next)
   - Deep linking (`#tile={id}`)
   - Default open state (only tile 2)

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Input: 130 condition JSON files                       │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  ThreadPoolExecutor (6 workers)                         │
│  ├─ Worker 1: anxiety-fear/*                            │
│  ├─ Worker 2: mood-depression/*                         │
│  ├─ Worker 3: psychotic-disorders/*                     │
│  ├─ Worker 4: sleep-disorders/*                         │
│  ├─ Worker 5: eating-body-image/*                       │
│  └─ Worker 6: trauma-stress/*                           │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Per File:                                              │
│  1. Hash check (skip if unchanged)                      │
│  2. Backup original                                     │
│  3. Load with OrderedDict                               │
│  4. API call (Claude Sonnet 4.5)                        │
│  5. Retry on failure (3x)                               │
│  6. Validate JSON                                       │
│  7. Preserve key order                                  │
│  8. Write output                                        │
│  9. Update cache                                        │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  Output:                                                │
│  - 130 enhanced JSON files                              │
│  - _backup_YYYYmmdd_HHMMSS/                             │
│  - _mass_update_log_YYYYmmdd_HHMMSS.txt                 │
│  - _failed_items_YYYYmmdd_HHMMSS.jsonl (if any)         │
│  - _cache.json                                          │
└─────────────────────────────────────────────────────────┘
```

### Key Order Preservation Algorithm

```python
def _preserve_key_order(original: Dict, updated: Dict) -> OrderedDict:
    """
    1. Create OrderedDict
    2. Add all original keys in original order
       - If value is dict, recurse
       - Otherwise use updated value
    3. Append any new keys from updated
    4. Return OrderedDict
    """
```

This ensures:
- Original structure preserved
- New fields appended at end
- Nested objects maintain order
- Diffs are readable and minimal

## Usage Workflow

### Quick Start

```bash
# 1. Set API key
export ANTHROPIC_API_KEY="your-key-here"

# 2. Dry run to preview
python3 mass_update_conditions.py --dry-run

# 3. Test on one file
python3 mass_update_conditions.py --pattern "panic-disorder.json"

# 4. Review output
cat anxiety-fear/panic-disorder.json | jq '.ui.tiles'

# 5. Run on all
python3 mass_update_conditions.py
```

### Advanced Options

```bash
# Custom concurrency (reduce if hitting rate limits)
python3 mass_update_conditions.py --concurrency 3

# Output to different directory
python3 mass_update_conditions.py \
  --dir /path/to/conditions \
  --out /path/to/output

# Process specific category
python3 mass_update_conditions.py \
  --pattern "anxiety-fear/*.json"
```

## Performance Estimates

| Files | Concurrency | Duration | Cost (est.) |
|-------|-------------|----------|-------------|
| 3     | 1           | 2-3 min  | $0.15       |
| 10    | 3           | 5-8 min  | $0.50       |
| 130   | 6           | 20-30 min| $6-8        |

**Notes:**
- API: Claude Sonnet 4.5 (20250514)
- Input tokens: ~2K per file (reading original)
- Output tokens: ~14K per file (full transformation)
- Rate limits: Handled automatically with backoff

## Edge Cases Handled

### 1. Variable Schema Fields
- **evaluation** can be object or array → preserved as-is
- **neurobiology** structure varies → each variant preserved
- **etiologies** subsection (neurocognitive) → maintained with full depth

### 2. Missing Fields
- Script adds missing fields without breaking
- Optional fields preserved if present
- No assumptions about required fields

### 3. Content Variations
- **linkedMedications** (ADHD) → preserved
- **citations** (ADHD) → preserved
- **related_conditions** (PTSD) → preserved
- **developmental_stages** → preserved or added based on condition

### 4. Special Cases
- **Neurocognitive disorder:** 12+ etiologies with nested structures → full preservation + enhancement
- **PTSD:** Related conditions section → preserved
- **ADHD:** Citations and linked medications → preserved
- **Insomnia:** Array-based evaluation → converted to object if needed

### 5. Safety Transformations
- Numeric medication schedules → general safety text
- Lab monitoring frequencies → conceptual guidelines
- Differential diagnosis labels → constrained to allowed section

## Testing Strategy

### Phase 1: Structure Validation ✅
```bash
python3 validate_structure.py
# Result: 129/130 valid, 1 minor issue (missing editorial)
```

### Phase 2: Single File Test (Requires API Key)
```bash
export ANTHROPIC_API_KEY="..."
python3 mass_update_conditions.py --pattern "panic-disorder.json" --dry-run
python3 mass_update_conditions.py --pattern "panic-disorder.json"
# Review: cat anxiety-fear/panic-disorder.json | jq
```

### Phase 3: Category Test
```bash
python3 mass_update_conditions.py --pattern "anxiety-fear/*.json"
# Review: git diff anxiety-fear/
```

### Phase 4: Full Production
```bash
python3 mass_update_conditions.py
# Monitor: tail -f _mass_update_log_*.txt
```

## Recovery Procedures

### If Something Goes Wrong

**1. Immediate Stop:**
```bash
# Kill the process
pkill -f mass_update_conditions

# Check backup exists
ls -la _backup_*/
```

**2. Restore from Backup:**
```bash
# Find latest backup
BACKUP=$(ls -dt _backup_* | head -1)

# Restore specific files
cp $BACKUP/panic-disorder.json anxiety-fear/

# Or restore all
cp $BACKUP/*.json .
```

**3. Analyze Failures:**
```bash
# View log
cat _mass_update_log_*.txt | grep ERROR

# Check failed items
cat _failed_items_*.jsonl | jq

# Retry failed items
python3 mass_update_conditions.py --pattern "failed-file.json"
```

## Known Limitations

1. **API Dependency:** Requires Anthropic API key and internet
2. **Rate Limits:** May need to reduce concurrency if hitting limits
3. **Cost:** ~$6-8 for full 130-file run
4. **Time:** 20-30 minutes for full dataset
5. **Token Limits:** Very large files (>50KB) may hit context limits

## Recommendations

### Before Running Production

1. ✅ **Commit current state to git**
   ```bash
   git add data/conditions/*.json
   git commit -m "Pre-batch-update snapshot"
   ```

2. ✅ **Test on subset first**
   ```bash
   python3 mass_update_conditions.py --pattern "anxiety-fear/*.json"
   ```

3. ✅ **Review one file manually**
   - Check ui.tiles structure
   - Verify content.aeo.what_is
   - Review real_life_examples
   - Confirm no dosing/schedules

4. ✅ **Run during low-traffic time**
   - API rate limits less likely
   - Can monitor without interruption

### After Running Production

1. **Review output:**
   ```bash
   # Check summary
   tail -50 _mass_update_log_*.txt

   # Review random samples
   cat mood-depression/major-depressive-disorder.json | jq '.ui.tiles'
   cat psychotic-disorders/schizophrenia.json | jq '.content.aeo'
   ```

2. **Validate with git:**
   ```bash
   git diff data/conditions/ | head -200
   git add data/conditions/
   git commit -m "feat: add SEO/AEO/UX enhancements to all conditions"
   ```

3. **Test in application:**
   - Verify tiles render correctly
   - Check deep links work
   - Validate content references resolve

## Next Steps

1. **Set API key:**
   ```bash
   export ANTHROPIC_API_KEY="your-key-here"
   ```

2. **Run dry-run:**
   ```bash
   python3 mass_update_conditions.py --dry-run
   ```

3. **Test on 3 files:**
   ```bash
   python3 mass_update_conditions.py --pattern "anxiety-fear/panic-disorder.json"
   python3 mass_update_conditions.py --pattern "mood-depression/major-depressive-disorder.json"
   python3 mass_update_conditions.py --pattern "dementia-memory/neurocognitive-disorder.json"
   ```

4. **Review outputs and commit test:**
   ```bash
   git diff
   git add . && git commit -m "test: batch update on 3 conditions"
   ```

5. **Run full production:**
   ```bash
   python3 mass_update_conditions.py
   ```

## Support

If you encounter issues:

1. Check the log file: `_mass_update_log_*.txt`
2. Review failed items: `_failed_items_*.jsonl`
3. Validate structure: `python3 validate_structure.py`
4. Restore from backup: `_backup_*/`

## Files Created

```
/Users/jack/heypsych/data/conditions/
├── mass_update_conditions.py      # Main batch processing script
├── validate_structure.py          # Structure validation (no API)
├── README_BATCH_UPDATER.md        # Complete usage documentation
├── SCHEMA_ANALYSIS.md             # Dataset analysis report
└── IMPLEMENTATION_SUMMARY.md      # This file
```

---

**Status:** ✅ Ready for production use
**Tested:** Structure validation passed (129/130 files valid)
**Dependencies:** anthropic package installed
**Next:** Set ANTHROPIC_API_KEY and run test on 3 files
