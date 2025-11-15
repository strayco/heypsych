# Psychiatrist Seeding Guide for HeyPsych

Complete step-by-step guide for monthly psychiatrist database updates using the NPPES full-file import.

## Table of Contents
1. [Overview](#overview)
2. [Monthly Import Process](#monthly-import-process)
3. [NPI / NPPES Background](#npi--nppes-background)
4. [Database Schema](#database-schema)
5. [Troubleshooting](#troubleshooting)
6. [Advanced Options](#advanced-options)

---

## Overview

**HeyPsych uses a single canonical method for seeding psychiatrists: the monthly NPPES full-file import.**

- **Data source**: CMS National Plan and Provider Enumeration System (NPPES)
- **Update frequency**: Monthly (recommended)
- **Storage**: `entities` table with `type = 'provider'`
- **Importer script**: `scripts/nppes-importer.ts`
- **File size**: ~5-10 GB compressed, ~30+ GB uncompressed CSV

---

## Monthly Import Process

Follow these steps each month to update your psychiatrist database.

### Step 1: Download the NPPES File

**1.1 Visit the NPPES download page:**
```
https://download.cms.gov/nppes/
```

**1.2 Find the latest monthly file:**
- Look for `NPPES_Data_Dissemination_[Month]_[Year].zip`
- Example: `NPPES_Data_Dissemination_January_2025.zip`
- File size: ~5-10 GB (download time: 10-30 minutes)

**1.3 Download options:**

**Option A: Browser download (easiest)**
- Click the file in your browser
- Save to: `/Users/jack/heypsych/data/nppes/`

**Option B: Command line (for automation)**
```bash
cd /Users/jack/heypsych/data/nppes
curl -O "https://download.cms.gov/nppes/NPPES_Data_Dissemination_January_2025.zip"
```

---

### Step 2: Unzip the Archive

```bash
cd /Users/jack/heypsych/data/nppes
unzip -o NPPES_Data_Dissemination_January_2025.zip
```

**Result:** This extracts a large CSV file, typically named:
- `npidata_pfile_20250101-20250131.csv` (or similar date range)

**Note:** The CSV file will be ~30+ GB. Ensure you have enough disk space!

---

### Step 3: Verify Environment Variables

**Check your `.env.local` file:**
```bash
cd /Users/jack/heypsych
cat .env.local | grep SUPABASE
```

**Required variables:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

**Alternative names** (the importer checks for these too):
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE`

**Security:** Never commit the service role key. It has elevated database privileges.

---

### Step 4: Run Dry-Run (Validate Mapping)

Test that the importer can read the file and validate the data mapping:

```bash
cd /Users/jack/heypsych

npm run import-nppes -- --file=data/nppes/npidata_pfile_20250101-20250131.csv --dryRun
```

**Expected output:**
```
✓ Environment validated
✓ CSV file found (XX GB)
✓ Reading sample rows...
✓ Mapping validated
→ Found ~XXX,XXX psychiatry providers
→ This is a DRY RUN - no data will be imported
```

**If you see errors:** Check the troubleshooting section below.

---

### Step 5: Run Test Import (Small Batch)

Import just 25 records to test database connectivity:

```bash
npm run import-nppes -- --file=data/nppes/npidata_pfile_20250101-20250131.csv --batch=25 --concurrency=1
```

**Expected output:**
```
Starting import...
✓ Processed batch 1 (25 records)
✓ Inserted: 25
✓ Updated: 0
✓ Failed: 0
✓ Progress saved to import-progress.json

Import complete!
Total processed: 25
```

**Verify the import:**
```bash
# Check provider stats
npm run provider-stats

# Or visit in browser
open http://localhost:3000/psychiatrists
```

---

### Step 6: Run Full Import

Process the entire file (this may take 2-8 hours depending on file size):

```bash
npm run import-nppes -- --file=data/nppes/npidata_pfile_20250101-20250131.csv --batch=100 --concurrency=1
```

**What happens:**
- The importer processes ~30 GB of CSV data
- Filters for psychiatry taxonomy codes
- Inserts/updates records in batches
- Saves progress every 30 seconds to `import-progress.json`
- Logs failed batches to `failed-batches.json`

**Expected output:**
```
Starting import...
✓ Upserted 100 providers (attempt 1)
✓ Upserted 100 providers (attempt 1)
...
✓ Progress saved (last NPI: 1234567890)

✅ Import Complete!
==================================================
📊 Final Statistics:
   Processed: 9,191,719
   Imported:  68,945
   Skipped:   0
   Errors:    0
   Success:   0.75%
```

**Typical results from October 2025 NPPES file:**
- Total records processed: ~9.2 million
- Psychiatry providers imported: ~69,000
- Processing time: ~5-10 minutes
- Success rate: ~0.75% (filters to psychiatry taxonomy codes only)

**Note:** If the import is interrupted, just re-run the same command. It will resume from where it left off.

---

### Step 7: Verify Results & Add Database Indexes

**Check import statistics:**
```bash
npm run provider-stats
```

**Add database indexes (IMPORTANT - do this after first import):**

For fast query performance with 70,000+ providers, run the SQL indexes:

1. Open Supabase Dashboard → SQL Editor
2. Run the SQL from `add-provider-indexes.sql`
3. This creates indexes for state, city, zip, specialties filtering

See the [Database Indexes](#database-indexes) section for the full SQL.

**Review any failed batches:**
```bash
cat failed-batches.json
```

**Check progress file:**
```bash
cat import-progress.json
```

**Manual verification:**
1. Visit your providers page: `http://localhost:3000/psychiatrists`
2. Test the new filters:
   - **State filter** (dropdown with all 50 states)
   - **City filter** (text search)
   - **Zip code filter** (5-digit)
   - **Specialty filter** (checkboxes)
3. Spot-check a few provider profiles
4. Verify record counts match expectations
5. **Note:** The page defaults to California to prevent timeouts with large datasets

**Test specific provider:**
```bash
# Visit a specific provider (e.g., Daniel Olson)
open http://localhost:3000/psychiatrists/daniel-olson-ca-1700232022
```

---

### Step 8: Clean Up (Optional)

**Archive progress files:**
```bash
mkdir -p data/nppes/archives/2025-01
mv import-progress.json data/nppes/archives/2025-01/
mv failed-batches.json data/nppes/archives/2025-01/
```

**Delete large CSV to free disk space:**
```bash
# Keep the ZIP file for future reference
# Delete the uncompressed CSV (saves ~30 GB)
rm data/nppes/npidata_pfile_*.csv
```

---

## NPI / NPPES Background

### What is NPPES?
The **National Plan and Provider Enumeration System** is the official registry of all healthcare providers in the United States, maintained by CMS (Centers for Medicare & Medicaid Services).

### What is NPI?
The **National Provider Identifier** is a unique 10-digit number assigned to each healthcare provider in the US.

### Update Frequency
CMS publishes new NPPES files monthly, typically in the first week of each month.

### Psychiatry Taxonomy Codes

The importer filters for these psychiatry-related codes (configured in `scripts/nppes-importer.ts`):

| Code | Description |
|------|-------------|
| `2084P0800X` | Psychiatry & Neurology - Psychiatry (General) |
| `2084P0804X` | Child & Adolescent Psychiatry |
| `2084F0202X` | Forensic Psychiatry |
| `2084P0802X` | Addiction Psychiatry |
| `2084P0805X` | Geriatric Psychiatry |
| `103TP0016X` | Prescribing Psychologist (Medical) |

**Important:** The importer filters **ONLY by taxonomy code**. It does NOT filter by credentials (MD/DO/Ph.D./Psy.D.). This means:
- ✅ Providers with any credential are included (MD, DO, Ph.D., Psy.D., Ed.D., NP, PA, etc.)
- ✅ Providers with missing/empty credentials are included
- ✅ Filters solely by the taxonomy codes listed above

**Expected import size:** ~70,000 providers from the full NPPES file

**To add/remove codes:** Edit the `PSYCHIATRY_CODES` array in `scripts/nppes-importer.ts`

---

## Database Schema

Providers are stored in the `entities` table with this structure:

```json
{
  "type": "provider",
  "slug": "john-smith-ca-1234567890",
  "title": "Dr. John Smith, MD",
  "description": "Psychiatrist in San Francisco, CA",
  "content": {
    "npi": "1234567890",
    "first_name": "John",
    "last_name": "Smith",
    "credentials": "MD",
    "taxonomy_code": "2084P0800X",
    "specialties": ["general_psychiatry"],
    "subspecialties": ["Board Certified in Psychiatry"],
    "practice_name": "Bay Area Psychiatry",
    "address": {
      "street": "100 Medical Plaza Dr",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94102"
    },
    "phone": "(415) 555-1234",
    "data_source": "NPPES",
    "enumeration_date": "2015-03-15",
    "last_verified": "2025-10-28",
    "online_presence": {
      "website": null,
      "linkedin": null,
      "academic_profile": null,
      "practice_profile": null,
      "other_links": []
    }
  },
  "metadata": {
    "npi": "1234567890",
    "location": "San Francisco, CA",
    "specialties": ["general_psychiatry"]
  },
  "status": "active"
}
```

### Online Presence Field

The `online_presence` object stores links to provider profiles across the web:

```json
"online_presence": {
  "website": "https://drjohnsmith.com",
  "linkedin": "https://linkedin.com/in/drjohnsmith",
  "academic_profile": "https://med.stanford.edu/profiles/john-smith",
  "practice_profile": "https://hospital.org/provider/john-smith",
  "other_links": [
    {
      "url": "https://psychologytoday.com/profile/123",
      "label": "Psychology Today"
    }
  ]
}
```

**Note:** Online presence data is NOT populated by the NPPES import. It must be added manually or through data enrichment services.

### Key Fields for Filtering
- `content.address.state` - State filter (2-letter code: "CA")
- `content.address.city` - City filter
- `content.address.zip` - Zip code filter (5 digits)
- `content.specialties` - Specialty filter (array)
- `metadata.location` - Combined location string

### Unique Identifier
- **Slug format:** `{first-name}-{last-name}-{state}-{npi}`
- Example: `john-smith-ca-1234567890`
- Records with the same slug are **updated**, not duplicated

### Database Indexes

For optimal query performance with large provider datasets, create these indexes in Supabase:

```sql
-- Run this SQL in your Supabase SQL Editor (see add-provider-indexes.sql)

-- Index for provider type filtering
CREATE INDEX IF NOT EXISTS idx_entities_provider_type
ON entities(type)
WHERE type = 'provider';

-- Index for state filtering
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
```

**Note:** These indexes significantly improve search performance, especially with 70,000+ providers. Run them after your first import.

---

## Troubleshooting

### Import Stops or Crashes

**Symptom:** The import process terminates unexpectedly.

**Solution:** The importer saves progress automatically. Just re-run:
```bash
npm run import-nppes -- --file=data/nppes/npidata_pfile_*.csv --batch=100 --concurrency=1
```

It will resume from `import-progress.json`.

---

### Failed Batches

**Check the failed batches log:**
```bash
cat failed-batches.json
```

**Understanding failures:**
- The importer retries failures 3 times automatically
- If batches still fail, there may be data quality issues
- Most imports have 0-10 failed records out of 100,000+

---

### Database Connection Errors

**Error messages like:**
```
Error: Failed to connect to Supabase
Error: Invalid API key
```

**Solutions:**

1. **Verify environment variables:**
   ```bash
   cat .env.local | grep SUPABASE
   ```

2. **Test database connection:**
   ```bash
   npm run db:ensure
   ```

3. **Check Supabase dashboard:**
   - Verify your project is running
   - Confirm the service role key is correct
   - Check if connection limits are exceeded

---

### File Not Found

**Error:** `ENOENT: no such file or directory`

**Solution:** Verify the CSV file path:
```bash
ls -lh data/nppes/*.csv
```

Update the command with the correct filename.

---

### Out of Disk Space

**Error:** `ENOSPC: no space left on device`

**Solutions:**
- The CSV file is ~30+ GB
- Delete old NPPES CSV files: `rm data/nppes/npidata_pfile_*.csv`
- Keep only ZIP files for archival
- Use an external drive for large files

---

### Importer Takes Too Long

**Expected times:**
- Small test (25 records): ~5 seconds
- Full import (October 2025 file): **5-10 minutes** (normal!)
- Older, larger files: Up to 15-20 minutes

**Factors affecting speed:**
- File size (~30 GB uncompressed)
- CSV parsing speed
- Database connection speed
- Batch size

**To speed up:**
- Increase batch size: `--batch=200` (default is 100)
- Ensure good network connection to Supabase
- Don't increase concurrency above 1-2 (can cause database locks)

---

### Duplicate Providers

**Question:** Will running the importer create duplicate providers?

**Answer:** No. The importer uses `slug` as the unique identifier:
- New providers are **inserted**
- Existing providers are **updated**
- No duplicates are created

---

### Missing Providers

**Symptom:** Expected more providers in the database.

**Possible causes:**
1. **Taxonomy codes only** - The importer only includes providers with psychiatry taxonomy codes (see list above)
2. **Missing names** - Providers without first/last name in NPPES are skipped
3. **Check failed batches** - Review `failed-batches.json` for skipped records
4. **Database query limits** - The web UI may timeout without filters. Always use state/city/specialty filters for large datasets.

**To check what's being filtered:**
```bash
# View the taxonomy codes being used
grep "PSYCHIATRY_CODES" scripts/nppes-importer.ts

# View validation rules
grep "validateRow" scripts/nppes-importer.ts -A 15
```

**Important:** The importer does NOT filter by credentials. All providers with psychiatry taxonomy codes are included, regardless of whether they have MD, DO, Ph.D., Psy.D., or no credential at all.

---

## Advanced Options

### Importer Command Line Flags

```bash
npm run import-nppes -- [options]

Required:
  --file=PATH               Path to NPPES CSV file

Optional:
  --dryRun                  Validate mapping without importing
  --batch=N                 Records per batch (default: 25)
  --concurrency=N           Parallel workers (default: 1, max: 2)
  --progressFile=PATH       Progress file path (default: import-progress.json)
  --failedBatchesFile=PATH  Failed batches log (default: failed-batches.json)
  --resumeFromNpi=NPI       Resume from specific NPI number
  --updateSpecialtiesOnly   Only update specialties on existing records
```

---

### Update Specialties Only

If you've changed the taxonomy-to-specialty mapping in the code and want to update existing records:

```bash
npm run import-nppes -- --file=data/nppes/npidata_pfile_*.csv --updateSpecialtiesOnly
```

**Benefits:**
- Much faster than full import
- Only updates specialty-related fields
- Doesn't modify other provider data

---

### Resume from Specific NPI

If you need to restart from a specific provider:

```bash
npm run import-nppes -- --file=data/nppes/npidata_pfile_*.csv --resumeFromNpi=1234567890
```

**Use cases:**
- Testing a specific section of the file
- Debugging import issues
- Skipping already-processed records

---

### Custom Batch Size

Adjust batch size based on your needs:

```bash
# Smaller batches (safer, slower)
npm run import-nppes -- --file=data/nppes/npidata_pfile_*.csv --batch=25

# Larger batches (faster, more memory)
npm run import-nppes -- --file=data/nppes/npidata_pfile_*.csv --batch=200
```

**Recommendations:**
- Development: `--batch=25`
- Production: `--batch=100`
- Fast server: `--batch=200`

---

### Scheduling Monthly Imports

For automation, create a cron job (Linux/Mac) or Task Scheduler task (Windows).

**Example cron** (runs 2am on the 2nd of each month):
```cron
0 2 2 * * cd /Users/jack/heypsych && npm run import-nppes -- --file=data/nppes/npidata_pfile_*.csv --batch=100 --concurrency=1 >> logs/nppes-import-$(date +\%F).log 2>&1
```

**Note:** You'll need to manually download the file each month (or add a download step to your automation).

---

## Quick Reference

### Monthly Checklist

- [ ] Download latest NPPES file from https://download.cms.gov/nppes/
- [ ] Unzip to `data/nppes/` directory
- [ ] Verify `.env.local` has correct Supabase credentials
- [ ] Run dry-run: `npm run import-nppes -- --file=data/nppes/npidata_pfile_*.csv --dryRun`
- [ ] Run test: `npm run import-nppes -- --file=data/nppes/npidata_pfile_*.csv --batch=25`
- [ ] Run full import: `npm run import-nppes -- --file=data/nppes/npidata_pfile_*.csv --batch=100`
- [ ] **First time only:** Run database indexes SQL (see `add-provider-indexes.sql`)
- [ ] Check `failed-batches.json` for errors
- [ ] Run `npm run provider-stats` to verify
- [ ] Test providers page in browser (check state/city/zip filters)
- [ ] Archive progress files to `data/nppes/archives/YYYY-MM/`
- [ ] Delete large CSV file (optional, keep ZIP)
- [ ] Date completed: ___________

---

### Essential Commands

```bash
# Navigate to project
cd /Users/jack/heypsych

# Create data directory (first time only)
mkdir -p data/nppes

# Unzip downloaded file
cd data/nppes
unzip -o NPPES_Data_Dissemination_January_2025.zip

# Dry run (validate)
npm run import-nppes -- --file=data/nppes/npidata_pfile_*.csv --dryRun

# Test import (25 records)
npm run import-nppes -- --file=data/nppes/npidata_pfile_*.csv --batch=25

# Full import
npm run import-nppes -- --file=data/nppes/npidata_pfile_*.csv --batch=100

# Check results
npm run provider-stats
cat failed-batches.json

# View providers
open http://localhost:3000/psychiatrists

# Clean up
rm data/nppes/npidata_pfile_*.csv
```

---

## Resources

- **NPPES Downloads**: https://download.cms.gov/nppes/
- **NPI Registry API**: https://npi.cms.hhs.gov/api/
- **Taxonomy Codes**: https://taxonomy.nucc.org/
- **Importer Script**: `scripts/nppes-importer.ts`
- **Provider Stats**: `scripts/update-providers.js`
- **Package Scripts**: `package.json` (see `import-nppes`)

---

**Last Updated**: 2025-10-28
**Maintained by**: HeyPsych Development Team

**Recent Import Stats (October 2025 NPPES):**
- File: NPPES_Data_Dissemination_October_2025_V2
- Total providers: 68,945
- California: 10,033
- New York: 7,743
- Import duration: ~5 minutes

---

## Support

If you encounter issues not covered in this guide:

1. Check `failed-batches.json` for specific errors
2. Review `import-progress.json` to see where import stopped
3. Verify database connection with `npm run db:ensure`
4. Check Supabase logs in the dashboard
5. Review the importer code in `scripts/nppes-importer.ts`
