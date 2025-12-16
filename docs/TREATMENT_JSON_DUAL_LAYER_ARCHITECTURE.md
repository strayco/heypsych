# Treatment JSON Dual-Layer Architecture

## Overview

The treatment JSON architecture uses a **dual-layer content model** that maintains:
- **Apple-level simplicity** in all user-facing fields
- **Full SEO optimization** via an invisible `seo_extensions` block

This allows us to keep the UI clean while giving Google everything it needs for topic authority, long-tail coverage, and intent clustering.

---

## Architecture Layers

### 1. User-Facing Layer (Visible in UI)

**Location**: Root level of JSON  
**Purpose**: All content displayed to users  
**Principle**: Minimal, clean, Apple-like simplicity

```json
{
  "name": "Xanax (alprazolam)",
  "summary": "A fast-acting benzodiazepine...",
  "description": "...",
  "patient_summary": "...",
  "sections": [
    {
      "type": "indications",
      "heading": "What Xanax Is Used For",
      ...
    }
  ],
  "faqs": [...]
}
```

**What the renderer uses**:
- `sections[]` - All visible content sections
- `patient_summary` - "In Plain Terms" box
- `summary` / `description` - Hero text
- `faqs[]` - FAQ section

**What the renderer ignores**:
- `seo_extensions` - Never displayed in UI
- All SEO metadata fields

---

### 2. SEO Layer (Backend-Only)

**Location**: `seo_extensions` block  
**Purpose**: SEO optimization, not visible to users  
**Principle**: Comprehensive coverage for search engines

```json
{
  "seo_extensions": {
    "keywords": [
      "Xanax",
      "alprazolam",
      "Xanax uses",
      "Xanax side effects",
      ...
    ],
    "search_intent_phrases": [
      "What is Xanax used for?",
      "How long does Xanax take to work?",
      ...
    ],
    "search_intent_clusters": {
      "informational": [...],
      "condition_specific": [...],
      "side_effects_safety": [...],
      "interactions": [...],
      "dosing_usage": [...],
      "withdrawal_tapering": [...],
      "legal_logistics": [...]
    },
    "schema_org": {
      "@context": "https://schema.org",
      "@type": "Drug",
      ...
    }
  }
}
```

---

## Implementation Details

### API Response

The API route (`/api/treatments/[slug]`) returns the **entire JSON**, including `seo_extensions`:

```typescript
// src/app/api/treatments/[slug]/route.ts
const entityData = {
  data: treatmentData, // Entire JSON including seo_extensions
  ...
};
return NextResponse.json(entityData);
```

This ensures:
- ✅ SEO data is available for metadata generation
- ✅ Search engines can access structured data
- ✅ SEO fields are never filtered out

### UI Renderer

The client wrapper (`client-wrapper.tsx`) **only reads user-facing fields**:

```typescript
const data = (entity.data || {}) as {
  name?: string;
  summary?: string;
  description?: string;
  patient_summary?: string;
  sections?: DynamicSection[];
  // ❌ NO seo_extensions in type definition
};
```

**Result**: SEO fields are completely invisible to the UI renderer.

### Metadata Generation

Current metadata generation (`MetadataFactory`) uses:
- `entity.seo.title` / `entity.seo.description` if present
- Falls back to auto-generated metadata

**Future Enhancement**: Could optionally use `seo_extensions.schema_org` if present:

```typescript
// Potential enhancement
const customSchema = entity.data?.seo_extensions?.schema_org;
if (customSchema) {
  // Use custom schema instead of auto-generated
}
```

---

## SEO Coverage

The `search_intent_clusters` provide comprehensive coverage for:

1. **Informational Intent**
   - "what is Xanax"
   - "how does Xanax work"
   - "what type of drug is Xanax"

2. **Condition-Specific Intent**
   - "Xanax for anxiety"
   - "Xanax for panic disorder"
   - "does Xanax help panic attacks"

3. **Side Effects / Safety Intent**
   - "Xanax side effects"
   - "is Xanax dangerous"
   - "can you overdose on Xanax"

4. **Interactions Intent**
   - "can you take Xanax with alcohol"
   - "Xanax and opioids"
   - "Xanax and antidepressants"

5. **Dosing / Usage Intent**
   - "Xanax dosage for anxiety"
   - "how much Xanax should I take"
   - "Xanax XR vs Xanax IR"

6. **Withdrawal / Tapering Intent**
   - "how to taper off Xanax"
   - "Xanax withdrawal symptoms"
   - "Xanax dependence"

7. **Legal / Logistics Intent**
   - "is Xanax a controlled substance"
   - "do you need a prescription for Xanax"
   - "Xanax schedule drug class"

---

## Benefits

### For Users
- ✅ Clean, minimal UI
- ✅ No redundant content
- ✅ Fast, focused reading experience
- ✅ Apple-like simplicity

### For SEO
- ✅ Comprehensive keyword coverage
- ✅ Intent clustering for topic authority
- ✅ Structured data for Knowledge Graph
- ✅ Long-tail query coverage
- ✅ Semantic variation for PAA boxes

### For Content Team
- ✅ Clear separation of concerns
- ✅ Easy to update UI content independently
- ✅ Easy to expand SEO coverage
- ✅ No UI changes needed for SEO updates

---

## Best Practices

### ✅ DO

- Keep user-facing fields minimal and focused
- Use `seo_extensions` for all SEO-related data
- Include comprehensive intent clusters
- Maintain structured schema.org data
- Update both layers independently

### ❌ DON'T

- Surface SEO fields in the UI renderer
- Mix SEO keywords into visible content
- Duplicate content between layers unnecessarily
- Remove SEO extensions from API responses

---

## File Structure

```
data/treatments/
  medications/
    alprazolam-Xanax.json  # Contains both layers
    ...
```

Each JSON file contains:
- Root-level: User-facing content
- `seo_extensions`: SEO-only data

---

## Verification

Current Xanax JSON verified:
- ✅ Has `seo_extensions` block
- ✅ 12 keywords defined
- ✅ 7 intent clusters (100+ phrases)
- ✅ Schema.org structured data
- ✅ 14 user-facing sections
- ✅ Renderer ignores SEO fields
- ✅ API includes all data

---

## Future Enhancements

1. **Metadata Integration**: Use `seo_extensions.schema_org` in metadata generation
2. **Keyword Extraction**: Auto-generate keywords from content if missing
3. **Intent Analysis**: Analyze search trends to suggest new intent clusters
4. **Schema Validation**: Validate `seo_extensions` structure on save

---

**Status**: ✅ Fully implemented and working  
**Last Updated**: 2025-01-XX











