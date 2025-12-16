# URL Generation Fix - Canonical Routes + Complete Coverage

## Critical Bugs Fixed

### 1. ✅ Broken URL Generation (FIXED)

**Problem:**
- Generated: `{link:medication:sertraline-zoloft:sertraline}` (3 parts)
- Parser expected: `{link:X:Y}` (2 parts)
- Result: Browser requested `/sertraline-zoloft:sertraline` (malformed URL with `:sertraline` appended)

**Fix:**
- Updated regex to parse 3-part syntax: `{link:type:slug:displayText}`
- New regex: `/{link:([^:}]+):([^:}]+)(?::([^}]+))?}/g`
- Now correctly extracts: type="medication", slug="sertraline-zoloft", displayText="sertraline"

### 2. ✅ Entity Type → Route Mapping (FIXED)

**Problem:**
- `medication` → `/medications/` (doesn't exist!)
- `therapy` → `/therapys/` (doesn't exist!)
- Canonical route is: `/treatments/` for ALL treatment types

**Fix - Centralized Route Mapping:**
```typescript
function normalizeEntityTypeToRouteType(entityType: string) {
  switch (entityType) {
    case "medication":
    case "therapy":
    case "treatment":
    case "interventional":
    case "alternative":
    case "supplement":
    case "investigational":
      return "treatment"; // → /treatments/

    case "condition":
      return "condition"; // → /conditions/

    case "resource":
      return "resource"; // → /resources/

    default:
      return "treatment";
  }
}
```

**Result:**
- `{link:medication:sertraline-zoloft}` → `/treatments/sertraline-zoloft` ✅
- `{link:therapy:cognitive-behavioral-therapy}` → `/treatments/cognitive-behavioral-therapy` ✅
- `{link:condition:panic-disorder}` → `/conditions/panic-disorder` ✅

### 3. ✅ Missing Crosslinks on Treatments/Resources (FIXED)

**Problem:**
- Only conditions had inline links
- Treatments and resources showed NO crosslinks

**Fix - Expanded LINKABLE_FIELDS:**

**Before (4 fields):**
```typescript
const LINKABLE_FIELDS = {
  'data.comorbidities': ['condition'],
  'data.indications': ['condition'],
  'data.related_therapies': ['therapy'],
  'data.related_medications': ['medication'],
};
```

**After (16 fields covering all entity types):**
```typescript
const LINKABLE_FIELDS = {
  // CONDITION FIELDS
  'data.treatment_approaches.medications': ['medication'],
  'data.treatment_approaches.psychotherapy': ['therapy'],
  'data.treatment_approaches.interventional': ['treatment'],
  'data.treatment_approaches.alternative': ['treatment'],
  'data.treatment_approaches.supplements': ['supplement'],
  'data.comorbidities': ['condition'],
  'data.differential_diagnosis': ['condition'],

  // TREATMENT FIELDS (Medications)
  'data.indications': ['condition'],
  'data.sections.indications.items': ['condition'],
  'data.related_medications': ['medication'],
  'data.alternative_medications': ['medication'],
  'data.combination_therapies': ['medication', 'therapy'],

  // TREATMENT FIELDS (Therapy)
  'data.conditions_treated': ['condition'],
  'data.related_therapies': ['therapy'],
  'data.integration_with': ['therapy', 'medication'],
  'data.modalities': ['therapy'],

  // ASSESSMENT/RESOURCE FIELDS
  'data.screens_for': ['condition'],
  'data.assesses': ['condition'],
  'data.related_conditions': ['condition'],
  'data.related_assessments': ['resource'],
  'data.recommended_followup': ['resource'],
  'data.treatment_options': ['medication', 'therapy'],
};
```

## Complete Flow (End-to-End)

### Server-Side (Content Enhancement):
1. **Parse entity names** from content text
2. **Validate** each entity exists in database
3. **Create link syntax**: `{link:medication:sertraline-zoloft:sertraline}`
4. **Log canonical URL**: `✅ Validated link: "sertraline" → /treatments/sertraline-zoloft`

### Client-Side (Rendering):
1. **Parse link syntax** with 3-part regex
2. **Extract parts**: type="medication", slug="sertraline-zoloft", text="sertraline"
3. **Normalize type** to route: `medication` → `treatment`
4. **Generate URL**: `getLinkPath("treatment", "sertraline-zoloft")` → `/treatments/sertraline-zoloft`
5. **Render link**: `<Link href="/treatments/sertraline-zoloft">sertraline</Link>`

## Files Modified

1. **src/lib/utils/link-parser.ts**
   - Updated regex to parse 3-part link syntax
   - Added `normalizeEntityTypeToRouteType()` function
   - All entity types now map to canonical routes
   - Single source of truth for URL generation

2. **src/lib/linking/content-enhancer.ts**
   - Expanded `LINKABLE_FIELDS` from 4 to 16 fields
   - Added `getCanonicalRoute()` for logging
   - Now covers: conditions, treatments (meds + therapy), resources/assessments
   - Logs show canonical URLs that will actually be used

## Expected Behavior

### ✅ Conditions Page
- **Field**: `data.treatment_approaches.medications: "SSRIs (sertraline, escitalopram)"`
- **Generated**: `{link:medication:sertraline-zoloft:sertraline}`, `{link:medication:escitalopram-lexapro:escitalopram}`
- **URLs**: `/treatments/sertraline-zoloft`, `/treatments/escitalopram-lexapro`

### ✅ Treatment Pages
- **Field**: `data.indications: ["major depressive disorder", "generalized anxiety disorder"]`
- **Generated**: `{link:condition:major-depressive-disorder:major depressive disorder}`
- **URL**: `/conditions/major-depressive-disorder`

### ✅ Resource/Assessment Pages
- **Field**: `data.screens_for: ["depression", "anxiety"]`
- **Generated**: `{link:condition:major-depressive-disorder:depression}`, `{link:condition:generalized-anxiety-disorder:anxiety}`
- **URLs**: `/conditions/major-depressive-disorder`, `/conditions/generalized-anxiety-disorder`

## Verification Checklist

Test these pages and click all inline links:
- [ ] `/conditions/major-depressive-disorder` → should have links to treatments
- [ ] `/treatments/sertraline-zoloft` → should have links to conditions
- [ ] `/treatments/cognitive-behavioral-therapy` → should have links to conditions
- [ ] `/resources/assessments-screeners/phq-9` → should have links to conditions
- [ ] `/resources/assessments-screeners/gad-7` → should have links to conditions

**Expected Results:**
- ✅ All URLs start with `/conditions/`, `/treatments/`, or `/resources/`
- ✅ No `/medications/`, `/therapys/`, or other invalid routes
- ✅ No `:<text>` patterns in URLs
- ✅ Zero 404s on valid entity links
- ✅ Crosslinks appear across ALL entity types (not just conditions)

**Logs should show:**
```
✅ Validated link: "sertraline" → /treatments/sertraline-zoloft
✅ Validated link: "CBT" → /treatments/cognitive-behavioral-therapy
✅ Validated link: "panic disorder" → /conditions/panic-disorder
⚠️  Skipping "fake-entity" (medication): validation failed
```

**No more:**
- ❌ `/medications/sertraline-zoloft`
- ❌ `/therapys/cognitive-behavioral-therapy`
- ❌ `/sertraline-zoloft:sertraline`
- ❌ Missing crosslinks on treatments
