# Treatment JSON Validation Guide

## Overview

All treatment JSON files must conform to the **dual-layer architecture schema**:
- **User-facing layer**: Clean, minimal content for UI display
- **SEO layer**: Comprehensive SEO metadata in `seo_extensions`

## Validation

### Using the Validator Script

**Validate a single file:**
```bash
npx tsx scripts/validate-treatment-json.ts data/treatments/medications/alprazolam-Xanax.json
```

**Validate all treatment files:**
```bash
npx tsx scripts/validate-treatment-json.ts --all
```

**Programmatic validation:**
```typescript
import { validateTreatmentJSON } from '@/lib/schemas/treatment';
import { readFileSync } from 'fs';

const jsonData = JSON.parse(readFileSync('path/to/file.json', 'utf-8'));
const result = validateTreatmentJSON(jsonData);

if (result.valid) {
  console.log('✅ Valid!');
} else {
  console.error('❌ Validation errors:', result.errors);
}
```

## Schema Structure

### Required Fields

```typescript
{
  slug: string;              // Unique identifier (kebab-case)
  type: string;              // "medication", "therapy", etc.
  name: string;              // Display name
  sections: Section[];       // Array of content sections
}
```

### User-Facing Layer

**Core fields:**
- `name`: Treatment name
- `summary`: Short description
- `description`: Full description
- `patient_summary`: Patient-friendly summary (shown in "In Plain Terms" box)
- `sections[]`: Content sections (see below)

**Optional fields:**
- `category`: Treatment category
- `metadata`: Drug/metadata information
- `clinical_metadata`: Clinical information
- `faqs[]`: FAQ items
- `editorial`: Editorial metadata

### SEO Layer (`seo_extensions`)

All SEO fields are **optional** but recommended:

```typescript
{
  seo_extensions?: {
    keywords?: string[];                    // Primary & secondary keywords
    search_intent_phrases?: string[];       // PAA/semantic variation phrases
    search_intent_clusters?: {              // Topic coverage clusters
      [clusterName: string]: string[];
    };
    schema_org?: Record<string, any>;       // Custom Schema.org JSON-LD
  }
}
```

## Section Types

### Supported Section Types

1. **`indications`** - What the treatment is used for
2. **`patient_experience`** - Patient testimonials/experiences
3. **`onset_duration`** - How fast it works & duration
4. **`efficacy`** - How well it works (with stats)
5. **`adverse_effects`** - Side effects
6. **`warnings`** - Safety warnings
7. **`tapering`** - Stopping safely
8. **`interactions`** - Drug interactions
9. **`dosing`** - Typical dosing
10. **`special_populations`** - Pregnancy, breastfeeding, etc.
11. **`clinical_notes`** - Clinical pearls
12. **`monitoring`** - What to monitor
13. **`dosage_forms`** - Available forms
14. **`mechanism`** - How it works
15. **`references`** - References

### Section Structure

All sections must include:
```typescript
{
  type: SectionType;           // Required
  heading?: string;            // Optional custom heading
  ux_display?: UxDisplayMode;  // Optional UX mode
  collapsible?: boolean;       // Optional collapse flag
}
```

**UX Display Modes:**
- `fully_visible`: All content visible by default
- `top_two_visible`: Show first 2 items, rest collapsed
- `patient_text_only`: Show patient text, hide clinical details
- `symptom_only`: Ultra-short mode (adverse effects only)

## Validation Rules

### Schema Validation

The Zod schema validates:

1. **Required fields**: `slug`, `type`, `name`, `sections`
2. **Type safety**: Section types must match enum values
3. **URL validation**: Canonical URLs must be valid
4. **Structure**: Sections must match their type-specific structure

### Common Validation Errors

**Missing required fields:**
```
- slug: Required
- name: Required
- sections: Required
```

**Invalid section type:**
```
- sections[0].type: Invalid enum value. Expected 'indications' | 'patient_experience' | ...
```

**Invalid URL:**
```
- seo.canonical: Invalid url
```

## Custom Schema.org Support

### Using Custom Schema.org

If `seo_extensions.schema_org` is provided, it will be used instead of auto-generated schema:

```json
{
  "seo_extensions": {
    "schema_org": {
      "@context": "https://schema.org",
      "@type": "Drug",
      "name": "Xanax (alprazolam)",
      "description": "...",
      "activeIngredient": "alprazolam",
      "indication": ["Generalized Anxiety Disorder", "Panic Disorder"]
    }
  }
}
```

**Requirements:**
- Must have `@type` field
- Must have `name` or `description`
- `@context` will be added automatically if missing

**Fallback behavior:**
- If custom schema is invalid, auto-generated schema is used
- Warning is logged to console

## Example Valid JSON

See `data/treatments/medications/alprazolam-Xanax.json` for a complete example.

## CI/CD Integration

**Add to pre-commit hook:**
```bash
npx tsx scripts/validate-treatment-json.ts --all
```

**Add to CI pipeline:**
```yaml
- name: Validate Treatment JSON
  run: npx tsx scripts/validate-treatment-json.ts --all
```

## Troubleshooting

### Schema Validation Fails

1. Check required fields are present
2. Verify section types match enum values
3. Ensure URLs are valid
4. Check JSON syntax is correct

### Custom Schema.org Not Used

1. Verify `seo_extensions.schema_org` exists
2. Check it has `@type` and `name`/`description`
3. Check console for warnings

### Section Not Rendering

1. Verify section type is in enum
2. Check section has required fields for its type
3. Verify `heading` or `type` can generate heading

---

**Schema File**: `src/lib/schemas/treatment.ts`  
**Validator Script**: `scripts/validate-treatment-json.ts`  
**Last Updated**: 2025-01-XX













