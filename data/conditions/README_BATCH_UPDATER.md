# Condition JSON Batch Updater

Transforms clinical condition JSON files into story-led, SEO/AEO-optimized, tile-ready formats while preserving all clinical data.

## Requirements

```bash
pip install anthropic
```

Set your Anthropic API key:
```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

## Usage

### Dry Run (Recommended First Step)

Test the updater without making any changes:

```bash
python3 mass_update_conditions.py --dry-run
```

This will:
- Analyze all JSON files
- Show what would be changed
- Not modify any files
- Not create backups
- Generate a log file with planned changes

### Test on Specific Files

Test on a subset by using a pattern:

```bash
# Test on panic disorder only
python3 mass_update_conditions.py \
  --pattern "panic-disorder.json" \
  --dry-run

# Test on all anxiety conditions
python3 mass_update_conditions.py \
  --pattern "anxiety-fear/*.json" \
  --dry-run
```

### Production Run

Process all files:

```bash
python3 mass_update_conditions.py
```

Process with custom settings:

```bash
python3 mass_update_conditions.py \
  --dir /path/to/conditions \
  --concurrency 8 \
  --pattern "*.json"
```

### Output to Different Directory

To preserve originals and write to a new location:

```bash
python3 mass_update_conditions.py \
  --dir /Users/jack/heypsych/data/conditions \
  --out /Users/jack/heypsych/data/conditions_v2
```

## Command-Line Options

| Option | Default | Description |
|--------|---------|-------------|
| `--dir` | `/Users/jack/heypsych/data/conditions` | Input directory |
| `--out` | Same as `--dir` | Output directory (overwrites in place if not specified) |
| `--pattern` | `*.json` | File glob pattern to match |
| `--concurrency` | `6` | Number of parallel workers |
| `--dry-run` | `false` | Run without making changes |
| `--api-key` | `$ANTHROPIC_API_KEY` | Anthropic API key |

## What It Does

### Preserves
- All existing clinical data and fields
- Original key order in JSON
- File metadata (through backups)

### Adds
- `content.aeo.what_is` - Concise "What is X?" answer (≤25 words)
- `content.temporal_criteria` - Plain-language time course
- `content.misdiagnosis_explained` - Why confusion happens and how to clarify
- `content.description.what_it_can_look_like_in_real_life` - 4-8 mini-stories
- `content.description.common_reactions_to_diagnosis` - Realistic reactions
- `content.lived_experience.first_person_statements` - 3-6 authentic "I" statements
- `content.real_life_examples` - 3-5 full unresolved stories (enhanced if existing)
- `content.comparisons` - 2-4 plain-language comparisons
- `content.faqs` - 10-20 questions including comparison questions
- `ui.layout` and `ui.tiles[]` - 3x3 grid UX layer with content references

### Cleans
- Removes medication dosing schedules
- Removes numeric lab monitoring schedules
- Rewrites as general safety concepts in `content.treatment_approaches.medication_safety_considerations`
- Restricts differential diagnosis labels to `content.differential_diagnosis[]` only

## Output Files

### Automatic Backups
Before any changes, creates:
```
_backup_YYYYmmdd_HHMMSS/
  ├── condition1.json
  ├── condition2.json
  └── ...
```

### Log Files
```
_mass_update_log_YYYYmmdd_HHMMSS.txt  # Detailed processing log
_failed_items_YYYYmmdd_HHMMSS.jsonl   # Failed items (if any)
_cache.json                            # Processing cache (speeds up re-runs)
```

## Recovery

If something goes wrong:

1. **Restore from backup:**
   ```bash
   # Find your backup directory
   ls -d _backup_*

   # Copy files back
   cp _backup_20260127_143022/*.json .
   ```

2. **Check the log file:**
   ```bash
   cat _mass_update_log_20260127_143022.txt
   ```

3. **Review failed items:**
   ```bash
   cat _failed_items_20260127_143022.jsonl | jq
   ```

## Performance

- **Concurrency:** 6 workers by default (API rate limit safe)
- **Caching:** Skips unchanged files on re-run (based on file hash)
- **Retry logic:** 3 attempts per file with exponential backoff
- **Rate limiting:** Automatic backoff on API rate limits

## Expected Duration

- **130 files** at **6 concurrent workers**: ~20-30 minutes
- **Dry run**: ~2-3 minutes (no API calls, just analysis)

## Troubleshooting

### "No API key found"
Set environment variable:
```bash
export ANTHROPIC_API_KEY="your-key"
```

### "Rate limit exceeded"
Reduce concurrency:
```bash
python3 mass_update_conditions.py --concurrency 3
```

### "JSON validation failed"
Check the log file for the specific error. The script will automatically retry with a JSON-fixing prompt.

### Files not found
Check your pattern:
```bash
# List files that will be processed
ls /Users/jack/heypsych/data/conditions/*.json
```

## Safety Features

1. **Automatic backups** before any changes
2. **Dry-run mode** to preview changes
3. **JSON validation** before writing
4. **Retry mechanism** for transient failures
5. **Key order preservation** maintains readability
6. **Detailed logging** for audit trail
7. **Cache system** prevents duplicate work

## Testing Workflow

```bash
# 1. Test on one file first
python3 mass_update_conditions.py \
  --pattern "panic-disorder.json" \
  --dry-run

# 2. Run on that one file for real
python3 mass_update_conditions.py \
  --pattern "panic-disorder.json"

# 3. Review the output
cat panic-disorder.json | jq '.ui.tiles[] | .id'
cat panic-disorder.json | jq '.content.aeo'

# 4. If good, run on all files
python3 mass_update_conditions.py
```

## Schema Documentation

See [SCHEMA_ANALYSIS.md](SCHEMA_ANALYSIS.md) for detailed information about:
- Input schema variations
- Output schema structure
- Field mappings
- Edge cases handled
