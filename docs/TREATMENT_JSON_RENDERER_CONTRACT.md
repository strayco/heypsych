# Treatment JSON Renderer Contract

This document defines the contract between treatment JSON files and the treatment page renderer (`src/app/treatments/[slug]/client-wrapper.tsx`). This ensures that content updates can be made to JSON files without requiring frontend code changes.

## Section Structure

Every section in the `sections` array should have:

```typescript
{
  type: string;              // Required: Section type identifier
  heading?: string;          // Optional: Custom heading (overrides auto-generated from type)
  ux_display?: string;       // Optional: Controls what's shown by default
  collapsible?: boolean;     // Optional: Controls whether section can be collapsed
  // ... section-specific fields
}
```

## Section Types & Required Fields

### `patient_experience`
**Purpose**: Shows patient quotes and experiences organized by category

**Required Fields**:
- `items` (array): Array of objects with:
  - `category` (string): Category name
  - `quotes` (array of strings): Patient quotes
  - `note` (string, optional): Explanatory note

**Optional Fields**:
- `intro` (string): Introduction text shown before items
- `ux_display`: Supports `fully_visible`
- `collapsible`: Default `false`

**Example**:
```json
{
  "type": "patient_experience",
  "heading": "What Xanax Feels Like",
  "intro": "People usually want to know...",
  "items": [
    {
      "category": "The Intended Calm",
      "quotes": ["\"Within an hour...\""],
      "note": "This quick sense of relief..."
    }
  ],
  "ux_display": "fully_visible",
  "collapsible": false
}
```

### `onset_duration`
**Purpose**: Describes how fast the treatment works and how long effects last

**Required Fields**:
- `text` (string): Main description
- `key_points` (array of strings): Bullet points

**Optional Fields**:
- `ux_display`: Supports `fully_visible` (default)
- `collapsible`: Boolean, controls collapse behavior

**Example**:
```json
{
  "type": "onset_duration",
  "heading": "How Fast Xanax Works",
  "text": "Most people take Xanax because...",
  "key_points": [
    "Onset: 30-60 minutes",
    "IR: Lasts 4-6 hours"
  ],
  "ux_display": "fully_visible",
  "collapsible": false
}
```

### `adverse_effects`
**Purpose**: Lists side effects with incidence rates

**Required Fields**:
- `common` (array): Array of objects with:
  - `symptom` (string): Symptom name
  - `incidence` (string): Incidence rate (e.g., "Very common")
  - `patient_note` (string, optional): Patient-friendly explanation

**Optional Fields**:
- `summary` (string): Overview text
- `plain_language_list` (array of strings): Simple list of common effects
- `serious` (array of strings): Serious side effects
- `patient_text` (string): Patient-friendly summary
- `ux_display`: Supports `fully_visible`, `top_two_visible`, `symptom_only`
- `collapsible`: Boolean, works with `top_two_visible` to show only first 2 effects

**UX Display Modes**:
- `fully_visible`: Shows all effects with full details
- `top_two_visible`: Shows only first 2 common effects, rest collapsed
- `symptom_only`: Shows only symptom names, no details

**Example**:
```json
{
  "type": "adverse_effects",
  "heading": "Side Effects",
  "summary": "Most common things people notice...",
  "plain_language_list": ["Feeling sleepy", "Slower thinking"],
  "common": [
    {
      "symptom": "Drowsiness",
      "incidence": "Very common",
      "patient_note": "Feeling sleepy is expected..."
    }
  ],
  "serious": ["Respiratory depression"],
  "ux_display": "top_two_visible",
  "collapsible": true
}
```

### `warnings`
**Purpose**: Critical safety warnings and patient counseling

**Required Fields**: None (at least one of the following should be present)

**Optional Fields**:
- `highlight` (string): Prominent warning highlight
- `black_box` (string): Black box warning text
- `other` (array of strings): Clinical warnings list
- `patient_counseling` (array of strings): Key counseling points
- `ux_display`: Supports `fully_visible`, `top_two_visible`
- `collapsible`: Boolean, works with `top_two_visible`

**UX Display Modes**:
- `fully_visible`: Shows all warnings
- `top_two_visible`: Shows only first 2 items from `other` array

**Example**:
```json
{
  "type": "warnings",
  "heading": "Key Warnings",
  "highlight": "Xanax has two major safety issues...",
  "black_box": "Combining benzodiazepines with opioids...",
  "other": ["Abuse and Addiction", "Dependence and Withdrawal"],
  "patient_counseling": ["Never mix with alcohol"],
  "ux_display": "top_two_visible",
  "collapsible": true
}
```

### `tapering`
**Purpose**: Information about safely stopping the treatment

**Required Fields**:
- `text` (string): Clinical description
- `patient_text` (string): Patient-friendly explanation

**Optional Fields**:
- `key_points` (array of strings): Important points
- `ux_display`: Supports `patient_text_only`
- `collapsible`: Boolean

**UX Display Modes**:
- `patient_text_only`: Shows patient text first, clinical details in collapsible

**Example**:
```json
{
  "type": "tapering",
  "heading": "Stopping Xanax Safely",
  "text": "Because Xanax is short-acting...",
  "patient_text": "If you've been taking Xanax regularly...",
  "key_points": ["Stopping suddenly can be dangerous"],
  "ux_display": "patient_text_only",
  "collapsible": true
}
```

### `indications`
**Purpose**: What the treatment is used for

**Required Fields**:
- `items` (array of strings): Primary indications (supports `{link:condition:slug:label}` syntax)

**Optional Fields**:
- `off_label` (array of strings): Off-label uses
- `patient_text` (string): Patient-friendly explanation
- `ux_display`: Supports `fully_visible`
- `collapsible`: Boolean

**Example**:
```json
{
  "type": "indications",
  "heading": "What Xanax Is Used For",
  "items": [
    "{link:condition:generalized-anxiety-disorder:GAD}"
  ],
  "off_label": ["{link:condition:agoraphobia:Agoraphobia}"],
  "patient_text": "Xanax is prescribed mainly for...",
  "ux_display": "fully_visible",
  "collapsible": true
}
```

### `dosing`
**Purpose**: Dosage information and adjustments

**Required Fields**: None (at least one field should be present)

**Optional Fields**:
- `adult.start` (string): Starting dose
- `adult.max` (string): Maximum dose
- `adult.notes` (string): Dosing notes
- `renal_adjustments.condition` (string): Condition name
- `renal_adjustments.dose` (string): Adjusted dose
- `renal_adjustments.patient_note` (string): Patient explanation
- `hepatic_adjustments` (object): Same structure as renal
- `patient_text` (string): Patient-friendly explanation
- `simple_explanation` (string): Simple explanation
- `ux_display`: Supports `fully_visible`, `patient_text_only`
- `collapsible`: Boolean

**UX Display Modes**:
- `fully_visible`: Shows all dosing details
- `patient_text_only`: Shows patient text first, clinical details in collapsible

**Example**:
```json
{
  "type": "dosing",
  "heading": "Typical Dosing",
  "adult": {
    "start": "0.25-0.5 mg",
    "max": "4 mg/day",
    "notes": "Usually taken 2-3 times per day"
  },
  "patient_text": "For most adults, Xanax is started at...",
  "ux_display": "patient_text_only",
  "collapsible": true
}
```

### `interactions`
**Purpose**: Drug interactions

**Required Fields**:
- `items` (array): Array of objects with:
  - `with` (string): Interacting substance
  - `risk` (string): Risk description
  - `action` (string): Recommended action

**Optional Fields**:
- `intro` (string): Introduction text
- `ux_display`: Supports `fully_visible`, `top_two_visible`
- `collapsible`: Boolean

**UX Display Modes**:
- `fully_visible`: Shows all interactions
- `top_two_visible`: Shows only first 2 interactions

**Example**:
```json
{
  "type": "interactions",
  "heading": "Important Interactions",
  "intro": "Xanax interacts with many substances...",
  "items": [
    {
      "with": "Opioids",
      "risk": "Profound sedation",
      "action": "Avoid whenever possible"
    }
  ],
  "ux_display": "top_two_visible",
  "collapsible": true
}
```

### `special_populations`
**Purpose**: Use in pregnancy, breastfeeding, pediatrics, geriatrics

**Required Fields**: None (at least one field should be present)

**Optional Fields**:
- `pregnancy` (string): Pregnancy information
- `lactation` (string): Breastfeeding information
- `pediatrics` (string): Pediatric use
- `geriatrics` (string): Geriatric use
- `patient_text` (string): Patient-friendly summary
- `ux_display`: Supports `fully_visible`, `patient_text_only`
- `collapsible`: Boolean

**UX Display Modes**:
- `patient_text_only`: Shows patient text first, details in collapsible

**Example**:
```json
{
  "type": "special_populations",
  "heading": "Use in Pregnancy, Breastfeeding, and Older Adults",
  "pregnancy": "Alprazolam is generally considered higher risk...",
  "patient_text": "During pregnancy, breastfeeding, and older age...",
  "ux_display": "patient_text_only",
  "collapsible": true
}
```

### `clinical_notes`
**Purpose**: Clinical pearls and practical notes

**Required Fields**:
- `items` (array of strings): List of clinical notes

**Optional Fields**:
- `ux_display`: Supports `fully_visible`
- `collapsible`: Boolean

**Example**:
```json
{
  "type": "clinical_notes",
  "heading": "Clinical Notes & Practical Pearls",
  "items": [
    "Short-term use is preferred...",
    "Extended-release formulations can be useful..."
  ],
  "ux_display": "fully_visible",
  "collapsible": true
}
```

### `monitoring`
**Purpose**: What clinicians monitor over time

**Required Fields**:
- `items` (array of strings): List of monitoring items

**Optional Fields**:
- `ux_display`: Supports `fully_visible`
- `collapsible`: Boolean

**Example**:
```json
{
  "type": "monitoring",
  "heading": "What Clinicians May Monitor",
  "items": [
    "Signs of misuse or loss of control...",
    "Daytime sedation and alertness..."
  ],
  "ux_display": "fully_visible",
  "collapsible": true
}
```

### `dosage_forms`
**Purpose**: Available forms of the medication

**Required Fields**:
- `items` (array of strings): List of dosage forms

**Optional Fields**:
- `patient_note` (string): Patient-friendly note
- `ux_display`: Supports `fully_visible`
- `collapsible`: Boolean

**Example**:
```json
{
  "type": "dosage_forms",
  "heading": "Available Forms",
  "items": [
    "Immediate-release (IR) tablets",
    "Extended-release (XR) tablets"
  ],
  "patient_note": "Different forms allow clinicians to match...",
  "ux_display": "fully_visible",
  "collapsible": true
}
```

### `efficacy`
**Purpose**: Evidence of how well the treatment works

**Required Fields**:
- `metric` (string): Efficacy metric name
- `value` (string): Efficacy value (e.g., "50%")
- `comparison` (string): Comparison data (e.g., "28% for placebo")

**Optional Fields**:
- `text` (string): Clinical description
- `patient_text` (string): Patient-friendly explanation
- `citation` (object): Citation with `label` and `url`
- `ux_display`: Supports `fully_visible`, `patient_text_only`
- `collapsible`: Boolean

**UX Display Modes**:
- `fully_visible`: Shows all efficacy information
- `patient_text_only`: Shows patient text first, clinical details in collapsible

**Example**:
```json
{
  "type": "efficacy",
  "heading": "How Well Xanax Works",
  "metric": "Patients free of panic attacks at 4 weeks",
  "value": "50%",
  "comparison": "28% for placebo",
  "text": "In a key multicenter study...",
  "patient_text": "In studies of people with panic disorder...",
  "citation": {
    "label": "Ballenger JC, et al.",
    "url": "https://pubmed.ncbi.nlm.nih.gov/3282478/"
  },
  "ux_display": "fully_visible",
  "collapsible": true
}
```

### `mechanism`
**Purpose**: How the treatment works

**Required Fields**:
- `text` (string): Clinical mechanism description

**Optional Fields**:
- `patient_text` (string): Patient-friendly explanation
- `ux_display`: Supports `fully_visible`, `patient_text_only`
- `collapsible`: Boolean

**UX Display Modes**:
- `fully_visible`: Shows both clinical and patient text
- `patient_text_only`: Shows patient text first, clinical details in collapsible

**Example**:
```json
{
  "type": "mechanism",
  "heading": "How Xanax Works in the Brain",
  "text": "Alprazolam binds to the benzodiazepine site...",
  "patient_text": "Xanax works by boosting the effect of GABA...",
  "ux_display": "patient_text_only",
  "collapsible": true
}
```

### `references`
**Purpose**: Citations and references

**Required Fields**:
- `items` (array): Array of objects with:
  - `label` (string): Reference label
  - `url` (string): Reference URL

**Optional Fields**:
- `ux_display`: Supports `fully_visible`
- `collapsible`: Boolean

**Example**:
```json
{
  "type": "references",
  "heading": "References & Further Reading",
  "items": [
    {
      "label": "FDA Prescribing Information",
      "url": "https://example.com"
    }
  ],
  "ux_display": "fully_visible",
  "collapsible": true
}
```

## UX Display Modes

### `fully_visible`
- **Behavior**: Shows all content immediately
- **Use Case**: Key sections that should always be visible (e.g., patient experience, how fast it works)
- **Collapsible**: Can still use `collapsible: true` for optional collapse

### `top_two_visible`
- **Behavior**: Shows only first 2 items from a list, with "Show more" button
- **Use Case**: Long lists where showing everything initially would create scroll fatigue
- **Works With**: `adverse_effects.common`, `interactions.items`, `warnings.other`
- **Collapsible**: Requires `collapsible: true` to enable the expand/collapse behavior

### `patient_text_only`
- **Behavior**: Shows patient-friendly text first, clinical details in a collapsible section
- **Use Case**: Sections with both patient and clinical content, prioritizing patient-friendliness
- **Works With**: `efficacy`, `dosing`, `mechanism`, `tapering`, `special_populations`

### `symptom_only`
- **Behavior**: Shows only symptom names, no incidence rates or detailed notes
- **Use Case**: Simplified view of side effects
- **Works With**: `adverse_effects`

## Collapsible Flag

The `collapsible` flag controls whether a section can be collapsed:

- `collapsible: false`: Section always fully expanded (ignores `ux_display` collapsing behavior)
- `collapsible: true`: Section respects `ux_display` mode collapsing behavior
- `collapsible: undefined`: Defaults to allowing collapse based on `ux_display` mode

## Custom Headings

Every section supports a custom `heading` field:

- If `heading` is provided, it's used as the section title
- If `heading` is omitted, the title is auto-generated from the `type` field (e.g., "adverse_effects" → "Adverse Effects")

## Link Syntax

Sections that support links use the `{link:type:slug:label}` syntax:

- `{link:condition:generalized-anxiety-disorder:GAD}` → Links to condition page
- `{link:treatment:alprazolam-xanax:Xanax}` → Links to treatment page
- Links are automatically parsed and rendered by `ParsedContent` component

## Best Practices

1. **Key sections should be `fully_visible`**: Patient experience, onset/duration, main side effects overview
2. **Long lists should use `top_two_visible`**: Side effects, interactions, warnings
3. **Clinical details should use `patient_text_only`**: Mechanism, dosing, special populations
4. **Always provide `patient_text`** for patient-friendly explanations when available
5. **Use `collapsible: false`** for critical information that must always be visible
6. **Provide custom `heading`** for better UX when auto-generated titles aren't clear

## Migration Guide

When updating treatment JSON files:

1. Add `heading` fields to use custom section titles
2. Add `ux_display` to control what's shown by default
3. Add `collapsible: true` for sections that can be collapsed
4. Ensure required fields for each section type are present
5. Test the page to verify rendering matches expectations

## Notes

- The renderer falls back gracefully if fields are missing
- Unknown section types are rendered as generic JSON (fallback)
- All text fields support the `{link:}` syntax for inline linking
- Patient-friendly text is automatically styled with a special box when `patient_text` is provided











