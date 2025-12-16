# Cross-Linking System Reference

**Single source of truth for HeyPsych cross-linking.**

---

## How It Works (30 Seconds)

1. **JSON files** contain entity references (medications, conditions, therapies)
2. **Content enhancer** parses these references and validates they exist in the database
3. **Link syntax** `{link:type:slug:displayText}` is injected into content
4. **Renderer** converts link syntax to clickable links on pages
5. **Invalid links** (non-existent entities) are converted to plain text automatically

**Key principle**: Add entity names to JSON fields → system handles everything else.

---

## Link Syntax

### Full Format (Recommended)
```
{link:type:slug:displayText}
```

**Examples:**
```
{link:condition:major-depressive-disorder:MDD}
{link:medication:sertraline-zoloft:sertraline}
{link:therapy:cognitive-behavioral-therapy:CBT}
```

### Simple Format (Auto-detected)
```
{link:slug}
```
- Defaults to `condition` type
- Use full format for non-conditions

### URL Routes
| Type | Route | Example |
|------|-------|---------|
| `condition` | `/conditions/[slug]` | `/conditions/generalized-anxiety-disorder` |
| `medication`, `antidepressant`, `anxiolytic`, etc. | `/treatments/[slug]` | `/treatments/sertraline-zoloft` |
| `therapy` | `/treatments/[slug]` | `/treatments/cognitive-behavioral-therapy` |

---

## Where to Add Cross-Links

### Condition Files (`data/conditions/[category]/[slug].json`)

| Field | Links To | Example |
|-------|----------|---------|
| `content.treatment_approaches.medications` | Medications | `"SSRIs (sertraline, escitalopram)"` |
| `content.treatment_approaches.psychotherapy` | Therapies | `"Cognitive Behavioral Therapy"` |
| `content.comorbidities` | Conditions | `"Panic Disorder"` |
| `content.related_conditions` | Conditions | `"Social Anxiety Disorder"` |

### Treatment Files (`data/treatments/[type]/[slug].json`)

| Field | Links To | Example |
|-------|----------|---------|
| `sections[type=indications].items` | Conditions | `"{link:condition:generalized-anxiety-disorder}"` |
| `clinical_metadata.primary_indications` | Conditions | `"Generalized Anxiety Disorder (GAD)"` |

---

## Entity Name Formats (Auto-Matched)

The system handles these formats automatically:

| Format | Example | What Gets Linked |
|--------|---------|------------------|
| Plain name | `"sertraline"` | → `sertraline-zoloft` |
| With brand | `"Fluoxetine (Prozac)"` | → Both linked to `fluoxetine-prozac` |
| Abbreviation | `"CBT"` | → `cognitive-behavioral-therapy` |
| With prefix | `"First-line: Sertraline"` | → `sertraline-zoloft` |
| Multiple in parens | `"SSRIs (sertraline, escitalopram)"` | → Both medications linked |
| Drug class with list | `"Stimulants: Concerta, Adderall"` | → Both brand names linked |

### What Gets Extracted

```
"Stimulants: Methylphenidate ER (Concerta), Mixed Amphetamine Salts (Adderall)"
```
**Extracted**: `Concerta`, `Adderall` (brand names)  
**Not linked**: `Methylphenidate ER`, `Mixed Amphetamine Salts` (formulation names)

```
"Atomoxetine (Strattera), Guanfacine, Clonidine"
```
**Extracted & linked**: `Atomoxetine`, `Strattera`, `Guanfacine`, `Clonidine`

---

## Validation Strategies

When validating entity names, the system tries (in order):

1. **Exact slug match**: `sertraline` → `sertraline-zoloft` ✓
2. **Prefix match**: `fluoxetine` → `fluoxetine-prozac` ✓
3. **Suffix match**: `prozac` → `fluoxetine-prozac` ✓
4. **Abbreviation map**: `PTSD` → `posttraumatic-stress-disorder` ✓
5. **Normalized match**: `post-traumatic` = `posttraumatic` ✓

### Medication Subtype Handling

Medications have subtypes (`antidepressant`, `anxiolytic`, `antipsychotic`, etc.).  
The system tries multiple subtypes automatically:

```javascript
// For "fluoxetine", system tries:
validateEntityExists("fluoxetine", "medication")      // fails
validateEntityExists("fluoxetine", "antidepressant")  // finds fluoxetine-prozac ✓
```

### Blacklisted Terms (Never Linked)

Single generic words that are too vague:
- `anxiety`, `depression`, `therapy`, `medication`, `treatment`, `disorder`

Drug formulations (only brand names linked):
- `Mixed Amphetamine Salts`, `Methylphenidate ER`

---

## Debugging Workflow

### Step 1: Check Entity Exists
```sql
SELECT slug, type, status FROM entities 
WHERE slug LIKE '%entity-name%' OR title ILIKE '%entity-name%';
```

### Step 2: Check Entity Status
Must be `active`:
```sql
SELECT slug, status FROM entities WHERE slug = 'entity-slug';
```

### Step 3: Check Entity Type
Note medication subtypes:
```sql
SELECT slug, type FROM entities WHERE slug = 'sertraline-zoloft';
-- Result: type = 'medication' or 'antidepressant'
```

### Step 4: Clear Cache & Rebuild
```bash
rm -rf .next && npm run dev
```

---

## Common Issues & Fixes

### Issue: Entity not linking

**Causes:**
1. Entity doesn't exist in database
2. Entity status is not `active`
3. Type mismatch (medication vs antidepressant)
4. Parsing doesn't extract the name

**Fix**: Check entity exists and is active, system handles type mismatches automatically.

### Issue: Link goes to 404

**Causes:**
1. Entity slug doesn't match database
2. Simple `{link:slug}` format for non-condition

**Fix**: Use full format `{link:type:slug}` or verify slug exists:
```sql
SELECT slug FROM entities WHERE slug = 'the-slug';
```

### Issue: Wrong entity linked

**Fix**: Use explicit link syntax:
```json
"{link:medication:sertraline-zoloft:Zoloft}"
```

### Issue: Duplicate links appear

**Cause**: Same entity mentioned multiple times in different formats.

**Fix**: System deduplicates automatically. If still appearing, check source JSON.

---

## Bulk Validation

### Validate All Cross-Links

```bash
# Run the validation script
node scripts/validate-final2.mjs
```

This checks all JSON files for broken `{link:}` syntax.

### Fix Broken Links in Bulk

```bash
# Run the fix script (removes invalid links)
node scripts/fix-broken-links.mjs
```

---

## File Locations

| Purpose | File |
|---------|------|
| Parse entity names from text | `src/lib/linking/utils.ts` → `parseEntityNames()` |
| Validate entity exists | `src/lib/linking/utils.ts` → `validateEntityExists()` |
| Enhance content with links | `src/lib/linking/content-enhancer.ts` |
| Parse link syntax | `src/lib/linking/utils.ts` → `parseLinkSyntax()` |
| Render links | `src/components/ui/parsed-content.tsx` |

---

## Quick Reference

### Add Link to Condition's Medications
```json
// data/conditions/anxiety-fear/generalized-anxiety-disorder.json
{
  "content": {
    "treatment_approaches": {
      "medications": [
        "SSRIs (sertraline, escitalopram, paroxetine)",
        "Buspirone"
      ]
    }
  }
}
```

### Add Link to Treatment's Indications
```json
// data/treatments/therapy/cognitive-behavioral-therapy.json
{
  "sections": [
    {
      "type": "indications",
      "items": [
        "{link:condition:generalized-anxiety-disorder:GAD}",
        "{link:condition:major-depressive-disorder:MDD}",
        "Chronic pain"  // No page exists, will render as plain text
      ]
    }
  ]
}
```

### Force Link to Specific Entity
```json
"{link:medication:sertraline-zoloft:Zoloft}"
```

### Database Queries
```sql
-- Find entity by partial name
SELECT slug, type, title FROM entities WHERE title ILIKE '%anxiety%';

-- Check if slug exists
SELECT slug, type, status FROM entities WHERE slug = 'generalized-anxiety-disorder';

-- List all conditions
SELECT slug, title FROM entities WHERE type = 'condition' AND status = 'active';
```

---

## Summary

1. **Add entity names** to JSON linkable fields (plain text or link syntax)
2. **System validates** entity exists in database
3. **Valid entities** get `{link:type:slug:name}` syntax injected
4. **Invalid entities** render as plain text (no 404s)
5. **Pages render** links as clickable navigation

**Zero 404s guaranteed** - if entity doesn't exist, it's plain text.


