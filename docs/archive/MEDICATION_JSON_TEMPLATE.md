# Medication JSON Template

> **Purpose**: Flexible JSON schema for all medication files. Fields are rendered dynamically—include only what applies to each medication.
> 
> **Canonical Examples**: 
> - Standard medication: `data/treatments/medications/alprazolam-Xanax.json`
> - Addiction treatment: `data/treatments/medications/acamprosate-Campral.json`
> - Atypical antidepressant: `data/treatments/medications/agomelatine-Valdoxan.json`
> - Atypical antipsychotic: `data/treatments/medications/amisulpride-Solian.json`

---

## Table of Contents

1. [Complete Template](#complete-template)
2. [Field Reference](#field-reference)
3. [Section Types](#section-types)
4. [Dynamic Field Patterns](#dynamic-field-patterns)
5. [SEO Guidelines](#seo-guidelines)
6. [Editorial & Schema Injection](#editorial--schema-injection)
7. [Pre-Submission Checklist](#pre-submission-checklist)

---

## Complete Template

This template shows ALL possible fields. **Only include fields that apply to the specific medication.** Optional fields are marked with comments.

```json
{
  "kind": "treatment",
  "slug": "generic-name-brand",
  "type": "medication",
  "name": "Generic Name (Brand Name)",
  
  "summary": "Clinical one-liner describing the medication's primary use and class.",
  "description": "2-3 sentence clinical description including mechanism and key applications.",
  "patient_summary": "Plain-language explanation. No jargon. What it does, who it helps, and key safety concerns.",
  
  "category": "medications/drug-class",
  
  "tags": ["optional", "array", "for", "categorization"],
  
  "metadata": {
    "drug_classes": ["Primary Class", "Secondary Class"],
    "brand_names": ["Brand1", "Brand2"],
    "administration_routes": ["Oral"],
    "prescription_status": "Prescription Required",
    "generic_available": true,
    "fda_approval_year": 1981,
    "pharmacologic_category": "Primary Category",
    
    "therapeutic_categories": ["Optional", "Category List"],
    "mechanism_categories": ["GABA", "Serotonin"],
    "controlled_substance": true,
    "dea_schedule": "IV",
    "fda_pregnancy_category": "D",
    "age_groups": ["Adult", "Geriatric"],
    "treatment_duration": ["Short-term", "Long-term"],
    "specialty_areas": ["Psychiatry", "Primary Care"]
  },
  
  "clinical_metadata": {
    "primary_indications": [
      "Primary Indication 1",
      "Primary Indication 2"
    ],
    "off_label_uses": [
      "Off-label use 1"
    ],
    "linked_conditions": [
      {
        "slug": "condition-slug",
        "relationship": "primary_treatment",
        "context": "Brief description of treatment relationship"
      }
    ],
    "contraindications": [
      "Contraindication 1 with specifics"
    ],
    "monitoring_required": [
      "Parameter 1",
      "Parameter 2"
    ],
    "efficacy_response": {
      "metric": "Primary outcome measure (Study Type)",
      "percentage_value": "XX%",
      "comparison_data": "XX% for placebo",
      "patient_text": "Plain language efficacy statement.",
      "citation_tag": "PMIDXXXXXXX"
    },
    "efficacy_rating": {
      "depression": 3,
      "anxiety": 4,
      "overall-tolerability": 2
    },
    "pharmacokinetics": {
      "metabolism": "Hepatic (CYP enzyme)",
      "excretion": "Urine/Feces",
      "half_life": "X to X hours",
      "bioavailability": "X% or description",
      "protein_binding": "Low (16%)"
    }
  },
  
  "search_metadata": {
    "searchable_terms": ["generic", "brand", "class"],
    "synonyms": ["alternate name"],
    "common_misspellings": ["misspeling"]
  },
  
  "sections": [],
  
  "faqs": [],
  
  "seo": {},
  
  "editorial": {},
  
  "schema_injection": {}
}
```

---

## Field Reference

### Root Level Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `kind` | string | ✅ | Always `"treatment"` |
| `slug` | string | ✅ | URL-friendly identifier: `generic-name-brand` (lowercase, hyphens) |
| `type` | string | ✅ | Usually `"medication"`, but can be `"antidepressant"`, `"combination-medication"`, etc. |
| `name` | string | ✅ | Display name: `"Generic Name (Brand Name)"` |
| `summary` | string | ✅ | One clinical sentence |
| `description` | string | ✅ | 2-3 sentence clinical description |
| `patient_summary` | string | ⚪ | Plain-language explanation (omit for minimal entries) |
| `category` | string | ✅ | Format: `"medications/drug-class"` |
| `tags` | array | ⚪ | Optional categorization tags |

### metadata Object

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `drug_classes` | array | ✅ | `["Benzodiazepine", "Anxiolytic"]` |
| `brand_names` | array | ✅ | `["Xanax", "Xanax XR"]` |
| `administration_routes` | array | ✅ | `["Oral"]`, `["Injectable"]`, `["Oral", "Intramuscular (IM)"]` |
| `prescription_status` | string | ✅ | `"Prescription Required"` |
| `generic_available` | boolean | ✅ | `true` or `false` |
| `fda_approval_year` | number/string | ✅ | `1981` or `"Introduced in the 1990s (Not Available in USA)"` |
| `pharmacologic_category` | string | ✅ | Primary category, may include ATC code |
| `therapeutic_categories` | array | ⚪ | `["Depression", "Anxiety Disorders"]` |
| `mechanism_categories` | array | ⚪ | `["GABA", "Serotonin"]` |
| `controlled_substance` | boolean | ⚪ | Include if true |
| `dea_schedule` | string | ⚪ | `"II"`, `"III"`, `"IV"`, `"V"` |
| `fda_pregnancy_category` | string | ⚪ | `"C"`, `"D"`, `"X"` |
| `age_groups` | array | ⚪ | `["Adult", "Pediatric", "Geriatric"]` |
| `treatment_duration` | array | ⚪ | `["Short-term", "Long-term"]` |
| `specialty_areas` | array | ⚪ | `["Psychiatry", "Primary Care"]` |

### clinical_metadata Object

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `primary_indications` | array | ✅ | FDA-approved uses |
| `off_label_uses` | array | ⚪ | Alternative to `off_label` in indications section |
| `linked_conditions` | array | ✅ | For internal linking (see below) |
| `contraindications` | array | ✅ | Absolute contraindications |
| `monitoring_required` | array | ⚪ | Key monitoring parameters |
| `efficacy_response` | object | ⚪ | Primary efficacy data with citation (use for quantitative data) |
| `efficacy_rating` | object | ⚪ | Numeric ratings by indication (use for qualitative assessment) |
| `pharmacokinetics` | object | ✅ | Uses underscore keys: `half_life` NOT `half-life` |

### linked_conditions Array Format

```json
{
  "slug": "exact-condition-slug",
  "relationship": "primary_treatment|off_label|adjunctive",
  "context": "Brief description of treatment relationship"
}
```

### efficacy_response Object

The `percentage_value` can be `null` when efficacy is qualitative rather than quantitative:

```json
{
  "metric": "Improvement of secondary negative symptoms",
  "percentage_value": null,
  "comparison_data": "Significantly greater than haloperidol",
  "patient_text": "Studies show this medicine is particularly effective...",
  "citation_tag": "SmPC"
}
```

### pharmacokinetics Object

**IMPORTANT**: Always use underscore format, not hyphens.

```json
{
  "metabolism": "Hepatic (CYP3A4)",
  "excretion": "Urine (as metabolites)",
  "half_life": "6 to 27 hours",
  "bioavailability": "Rapidly absorbed",
  "protein_binding": "Low (16%)"
}
```

### search_metadata Object (Optional)

```json
{
  "searchable_terms": ["amitriptyline", "chlordiazepoxide", "limbitrol"],
  "synonyms": ["amitriptyline and chlordiazepoxide"],
  "common_misspellings": ["limbitral"]
}
```

---

## Section Types

### Section Overview

Sections are rendered dynamically. Include only sections that apply to the medication. Minimal entries may have sections with just `type` and essential content.

| Section Type | Typical Fields | When to Include |
|--------------|----------------|-----------------|
| `efficacy` | `heading`, `metric`, `value`, `comparison`, `text`, `patient_text`, `citation` | Has quantitative efficacy data |
| `indications` | `heading`, `items[]`, `off_label[]`, `patient_text` | Always |
| `mechanism` | `heading`, `text`, `image`, `patient_text` | Always |
| `dosing` | `heading`, `adult`, `patient_text`, adjustments | Always |
| `dosage_forms` | `items[]` | Always |
| `onset_duration` | `text` | When relevant |
| `adverse_effects` | `heading`, `common[]`, `less_common[]`, `serious[]`, `patient_text` | Always |
| `warnings` | `heading`, `black_box`, `other[]`, `patient_counseling[]` | Always |
| `interactions` | `heading`, `items[]` | Always |
| `monitoring` | `heading`, `items[]` | Always |
| `special_populations` | `pregnancy`, `lactation`, `pediatrics`, `geriatrics` | Always |
| `tapering` | `text`, `patient_text` | If discontinuation guidance needed |
| `clinical_notes` | `heading`, `items[]` | For clinical pearls |
| `availability` | `heading`, `text` | For medications with special regulatory status |
| `references` | `items[]` | Always |

### Minimal Section Format

For simpler medications, sections can be minimal:

```json
{
  "type": "indications",
  "items": [
    "Major Depressive Disorder with anxiety",
    "Depression with agitation or tension"
  ]
}
```

### Full Section Format

For comprehensive medications:

```json
{
  "type": "indications",
  "heading": "Primary Uses",
  "items": [
    "{link:condition:generalized-anxiety-disorder:Generalized Anxiety Disorder (GAD)}",
    "{link:condition:panic-disorder:Panic Disorder}"
  ],
  "off_label": [
    "{link:condition:agoraphobia:Agoraphobia} (with panic disorder)"
  ],
  "patient_text": "This medicine is for GAD and Panic Disorder..."
}
```

---

## Dynamic Field Patterns

### dosing Section Variants

The dosing section structure adapts to the medication's complexity.

**Standard Format:**

```json
{
  "type": "dosing",
  "heading": "Dosing & Administration",
  "adult": {
    "start": "0.25–0.5 mg two to three times daily",
    "max": "10 mg/day",
    "notes": "Lower doses for elderly."
  },
  "patient_text": "The starting dose is usually...",
  "renal_adjustments": {
    "condition": "CrCl <10 mL/min",
    "dose": "No adjustment necessary",
    "patient_note": "Kidney function usually doesn't change the dose."
  },
  "hepatic_adjustments": {
    "condition": "Advanced liver disease",
    "dose": "0.25 mg 2 to 3 times daily",
    "patient_note": "If you have severe liver disease, your dose must be lowered."
  }
}
```

**With Titration (antidepressants):**

```json
{
  "type": "dosing",
  "adult": {
    "start": "25 mg once daily at bedtime",
    "titrate": "May increase to 50 mg daily after 2 weeks",
    "max": "50 mg/day",
    "notes": "Take at bedtime to optimize circadian rhythm effects."
  }
}
```

**With Dose-Dependent Indications (atypical antipsychotics):**

```json
{
  "type": "dosing",
  "adult": {
    "start": "Highly variable based on symptoms.",
    "predominantly_negative": "50 to 300 mg/day (optimum ~100 mg/day).",
    "mixed_or_acute_psychotic": "400 to 800 mg/day (Max: 1,200 mg/day).",
    "notes": "Daily doses ≤ 400 mg given once daily."
  }
}
```

**Multiple Renal Tiers (as array):**

```json
{
  "type": "dosing",
  "renal_adjustments": [
    {
      "condition": "Moderate (CrCl 30-50 mL/min)",
      "dose": "333 mg TID",
      "patient_note": "Your doctor will give you a lower dose."
    },
    {
      "condition": "Severe (CrCl 30 mL/min or less)",
      "dose": "Contraindicated",
      "patient_note": "You cannot take this drug."
    }
  ]
}
```

**Null Adjustments:**

When adjustments don't apply, use `null`:

```json
{
  "renal_adjustments": null,
  "hepatic_adjustments": {
    "condition": "All degrees",
    "dose": "Contraindicated",
    "patient_note": "You cannot take this drug if you have liver disease."
  }
}
```

**Simple String Format (minimal entries):**

```json
{
  "type": "dosing",
  "adult": {
    "start": "1–2 tablets/day",
    "titrate": "Increase gradually as tolerated",
    "usual_range": "2–4 tablets/day in divided doses",
    "max": "6 tablets/day"
  },
  "geriatric": "Start at the lowest dose; increased risk of sedation and falls",
  "hepatic_impairment": "Use with caution; avoid in severe impairment",
  "renal_impairment": "No adjustment in mild/moderate; caution in severe"
}
```

### adverse_effects Section Variants

**Full Format with Incidence:**

```json
{
  "type": "adverse_effects",
  "heading": "Side Effects",
  "common": [
    {
      "symptom": "Drowsiness",
      "incidence": "41% to 77%",
      "patient_note": "Very common, especially at start."
    },
    {
      "symptom": "Fatigue",
      "incidence": "49%"
    },
    {
      "symptom": "Headache"
    }
  ],
  "serious": [
    "Respiratory Depression",
    "Severe dependence"
  ],
  "patient_text": "The most common side effects are..."
}
```

**Simple String Array (minimal entries):**

```json
{
  "type": "adverse_effects",
  "common": ["dry mouth", "constipation", "blurred vision", "sedation"],
  "less_common": ["urinary retention", "confusion"],
  "serious": ["dependence/withdrawal", "cardiac arrhythmias"]
}
```

### warnings Section

The `black_box` field should be:
- Full warning text if applicable
- `null` if no black box warning
- Explanatory string if not FDA-approved: `"Not applicable (Not FDA approved), but key warnings are: ..."`

```json
{
  "type": "warnings",
  "heading": "Warnings & Precautions ⚠️",
  "black_box": null,
  "other": ["Warning 1", "Warning 2"],
  "patient_counseling": ["Plain language point 1"]
}
```

### New Section: availability

For medications with special regulatory status:

```json
{
  "type": "availability",
  "heading": "Availability and Regulatory Status",
  "text": "This medication is not currently approved for use in the United States. It is available in other countries..."
}
```

---

## Section Heading Conventions

Use these standard emojis in headings (optional but encouraged):
- Mechanism: `"How It Works 🧠"`
- Efficacy: `"How Well Does It Work?"` or `"How Well Does It Work? 🎯"`
- Warnings: `"Warnings & Precautions ⚠️"`
- Clinical Notes: `"Clinical Pearls ✨"`

For minimal entries, headings can be omitted entirely.

---

## Internal Linking Syntax

Use this syntax in `items` arrays to create internal links:

```
{link:condition:condition-slug:Display Text}
```

**Example:**
```json
"items": [
  "{link:condition:generalized-anxiety-disorder:Generalized Anxiety Disorder (GAD)}",
  "Treatment of acute or chronic {link:condition:schizophrenia:Schizophrenia}."
]
```

---

## SEO Guidelines

### seo Object Format

```json
{
  "title": "Generic (Brand): XX% Key Stat, Feature & Expert Guide",
  "description": "Complete guide to [Drug]: XX% efficacy, dosing (XX mg), side effects (XX%), and prescribing information.",
  "canonical": "https://heypsych.com/treatment/slug-here",
  "no_index": false
}
```

### Title Formula

```
{Generic} ({Brand}): {XX%} {Key Metric}, {Feature} & Expert Guide
```

**Examples:**
- `Alprazolam (Xanax): Dosing, Black Box Warnings, Dependence & Safety Guide`
- `Campral (Acamprosate): 36% Abstinence Rate, Dosing & Expert Guide`
- `Valdoxan (Agomelatine): Dosing, Side Effects & Liver Monitoring Guide`
- `Amisulpride (Solian): Dosing, Warnings, and Schizophrenia Treatment Guide`

### Numbers for Rich Snippets

Include specific numbers where available:
- Efficacy: `50% panic-free`, `54% response rate`, `36% abstinence rate`
- Side effects: `41% drowsiness`, `25% nausea`
- Dosing: `0.25–0.5 mg`, `50 mg daily`, `666 mg TID`
- Duration: `6–27 hour half-life`

---

## Editorial & Schema Injection

### editorial Object

```json
{
  "medicalReviewerIds": ["john-lee-md"],
  "reviewBoard": "HeyPsych Medical Review Board",
  "lastReviewed": "2025-11-28",
  "lastUpdated": "2025-11-28",
  "citations": [
    "https://www.accessdata.fda.gov/drugsatfda_docs/...",
    "https://pubmed.ncbi.nlm.nih.gov/..."
  ],
  "reviewStatement": "This content has been medically reviewed by board-certified psychiatrists..."
}
```

**Field Notes:**
- `reviewBoard`: Can be `"official"` or `"HeyPsych Medical Review Board"`
- `reviewStatement`: Can be `null` for minimal entries
- `citations`: Can be array of URL strings or omitted

### schema_injection Object

The `schema_injection` object provides structured data for Google rich results.

**Key Points:**
1. Always include the `Person` object for the reviewer
2. Use `@type` array: `["MedicalWebPage", "Drug"]`
3. Include all FAQ items in `mainEntity` array
4. Match `lastReviewed` date with `editorial.lastReviewed`
5. Replace `SLUG` placeholders with actual medication slug

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://heypsych.com/about/medical-review-board#john-lee-md",
      "name": "John Lee, MD",
      "jobTitle": "Board Certified Psychiatrist",
      "url": "https://heypsych.com/about/medical-review-board"
    },
    {
      "@type": ["MedicalWebPage", "Drug"],
      "@id": "https://heypsych.com/treatment/SLUG#webpage",
      "url": "https://heypsych.com/treatment/SLUG",
      "name": "SEO Title Here",
      "description": "SEO Description Here",
      "drugClass": "Drug Class",
      "administrationRoute": "Oral",
      "dosageForm": "Tablet, Oral",
      "author": {
        "@id": "https://heypsych.com/about/medical-review-board#john-lee-md"
      },
      "reviewedBy": {
        "@id": "https://heypsych.com/about/medical-review-board#john-lee-md"
      },
      "lastReviewed": "YYYY-MM-DD",
      "mainEntity": []
    }
  ]
}
```

---

## Pre-Submission Checklist

### Content Quality
- [ ] `patient_summary` uses plain language (no medical jargon) if included
- [ ] All `patient_text` fields are clear and simple
- [ ] No asterisks (`**`) anywhere in the content (renders incorrectly)
- [ ] Emojis used correctly in section headings (🧠, ⚠️, ✨) if using full format

### Clinical Accuracy
- [ ] `efficacy` section has study data with `citation` object (if included)
- [ ] `citation.label` uses academic format: `Author A, et al. Title. Journal. Year.`
- [ ] `citation.url` points to PubMed, FDA, or authoritative source
- [ ] `adverse_effects.common` includes incidence percentages where available
- [ ] `black_box` warning matches FDA label (or is `null` if none)

### Technical Accuracy
- [ ] `slug` matches filename pattern: `generic-name-Brand.json`
- [ ] `pharmacokinetics` uses `half_life` (underscore, NOT hyphen)
- [ ] `linked_conditions` uses exact condition slugs from `/data/conditions/`
- [ ] `renal_adjustments` format is consistent (object OR array, not mixed)
- [ ] Internal links use syntax: `{link:condition:slug:Display Text}`

### SEO & Schema
- [ ] `seo.title` includes specific number/percentage where possible
- [ ] `seo.description` includes multiple specific data points
- [ ] `seo.canonical` uses correct URL format
- [ ] `schema_injection` reviewer URLs point to `/about/medical-review-board`
- [ ] `schema_injection.mainEntity` includes all FAQs (if faqs present)

### FAQs
- [ ] Contains 3-5 relevant questions (if included)
- [ ] Answers are patient-friendly and complete
- [ ] FAQs cover: what it's for, how long to take, side effects, interactions, stopping

### Editorial
- [ ] `lastReviewed` and `lastUpdated` dates are current
- [ ] `medicalReviewerIds` array is populated

---

## File Naming Convention

```
generic-name-Brand.json
```

**Examples:**
- `alprazolam-Xanax.json`
- `acamprosate-Campral.json`
- `agomelatine-Valdoxan.json`
- `amisulpride-Solian.json`
- `amitriptyline-chlordiazepoxide-Limbitrol.json` (combination drugs)

---

## Common Mistakes to Avoid

1. **Using hyphens in pharmacokinetics keys**
   - ❌ `"half-life": "6 hours"`
   - ✅ `"half_life": "6 hours"`

2. **Mixing renal_adjustments formats**
   - Pick either **object** (single tier) or **array** (multiple tiers), don't mix

3. **Missing null for inapplicable fields**
   - ✅ `"renal_adjustments": null` when kidneys don't affect dosing
   - ✅ `"black_box": null` when no black box warning

4. **Asterisks in text fields**
   - ❌ `"This is **important** information"`
   - ✅ `"This is important information"`

5. **Incorrect internal link syntax**
   - ❌ `"[Anxiety](condition:anxiety)"`
   - ✅ `"{link:condition:anxiety:Anxiety}"`

6. **Overly rigid adherence to template**
   - The template shows ALL possible fields
   - Only include fields that apply to the specific medication
   - Minimal entries can skip headings, patient_text, and optional sections

---

*Last Updated: November 30, 2025*
*Canonical Examples: See top of document*
