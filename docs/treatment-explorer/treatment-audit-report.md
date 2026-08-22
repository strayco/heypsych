# Treatment Content Audit Report
Generated: 2026-08-20T19:20:11.864Z

## Summary

- **Total Files**: 654
- **Files with Errors**: 0

### Files by Modality

- medication: 329
- therapy: 95
- supplement: 92
- alternative: 77
- interventional: 37
- investigational: 24

### Files by Schema Version

- v2: 654

## Top-Level Keys

| Key | Count | Types |
|-----|-------|-------|
| kind | 654 | string |
| slug | 654 | string |
| type | 654 | string |
| name | 654 | string |
| summary | 654 | string |
| description | 654 | string |
| category | 654 | string |
| metadata | 654 | object |
| clinical_metadata | 654 | object |
| sections | 654 | array |
| seo | 654 | object |
| editorial | 652 | object |
| tags | 489 | array |
| search_metadata | 357 | object |
| patient_summary | 165 | string |
| faqs | 165 | array |

## Section Types

| Type | Count | Modalities |
|------|-------|------------|
| indications | 654 | alternative, interventional, investigational, medication, supplement, therapy |
| mechanism | 653 | alternative, interventional, investigational, medication, supplement, therapy |
| special_populations | 561 | interventional, investigational, medication, supplement, therapy |
| references | 543 | alternative, interventional, investigational, medication, supplement, therapy |
| clinical_notes | 475 | alternative, interventional, investigational, medication, supplement, therapy |
| warnings | 422 | investigational, medication, supplement |
| monitoring | 422 | investigational, medication, supplement |
| adverse_effects | 421 | medication, supplement |
| interactions | 421 | medication, supplement |
| dosing | 421 | medication, supplement |
| dosage_forms | 421 | medication, supplement |
| onset_duration | 420 | medication, supplement |
| tapering | 409 | medication, supplement |
| protocol | 233 | alternative, interventional, investigational, therapy |
| expected_outcomes | 233 | alternative, interventional, investigational, therapy |
| side_effects | 233 | alternative, interventional, investigational, therapy |
| cost_considerations | 230 | alternative, interventional, investigational, therapy |
| integration_support | 229 | alternative, interventional, investigational, therapy |
| contraindications | 219 | alternative, interventional, investigational, therapy |
| patient_selection | 213 | alternative, interventional, investigational, therapy |
| patient_experience | 162 | medication, therapy |
| clinical_context | 159 | medication |
| research_evidence | 153 | interventional, investigational, therapy |
| efficacy | 144 | medication |
| training_requirements | 129 | interventional, investigational, therapy |
| session_structure | 126 | interventional, investigational, therapy |
| treatment_variants | 75 | alternative |
| equipment | 56 | interventional, investigational, therapy |
| faqs | 9 | medication, therapy |
| seo | 5 | medication |
| editorial | 5 | medication |
| who_its_for | 4 | therapy |
| who_its_not_for | 4 | therapy |
| quick_steps | 4 | therapy |
| what_to_expect | 4 | therapy |
| common_mistakes | 4 | therapy |
| compared_to | 4 | therapy |
| targets_and_pathways | 2 | investigational |
| availability | 2 | medication |
| administration | 2 | medication |
| black_box | 1 | medication |
| fda_safety_update | 1 | medication |
| forms | 1 | supplement |

## Metadata Keys

| Key | Count | Types |
|-----|-------|-------|
| treatment_duration | 496 | array, string |
| age_groups | 496 | array |
| specialty_areas | 496 | array |
| wikidata_qid | 479 | string |
| administration_routes | 422 | array |
| prescription_status | 422 | string |
| generic_available | 422 | boolean, string |
| brand_names | 422 | array |
| controlled_substance | 420 | boolean, string, null |
| drug_classes | 332 | array |
| fda_approval_year | 325 | number, string, null |
| therapeutic_categories | 264 | array |
| mechanism_categories | 264 | array |
| delivery_methods | 232 | array |
| session_duration | 232 | string |
| training_required | 232 | string, boolean |
| invasiveness_level | 228 | string |
| dea_schedule | 179 | null, string |
| pharmacologic_category | 162 | string |
| medical_review | 162 | object |
| published_date | 161 | string |
| last_updated | 161 | string |
| intervention_types | 155 | array |
| treatment_types | 155 | array |
| categories | 155 | array |
| equipment_required | 155 | boolean, string, array |
| regulatory_status | 99 | string |
| fda_pregnancy_category | 94 | string, null |
| compound_type | 90 | string |
| natural_source | 90 | string |
| fda_status | 90 | string |
| practice_styles | 77 | array |
| treatment_variants | 77 | array |
| setting | 77 | array |
| trial_phase | 22 | string |
| controlled_schedule | 3 | string |
| first_marketed_year | 2 | number |
| notes | 2 | array |
| compound | 1 | string |
| reported_use | 1 | string |
| product_availability | 1 | string |
| controlled_substance_schedule_us | 1 | string |
| age_range | 1 | string |
| controlled_schedule_us | 1 | string |

## Clinical Metadata Keys

| Key | Count | Types |
|-----|-------|-------|
| primary_indications | 654 | array |
| contraindications | 654 | array |
| off_label_uses | 495 | array |
| efficacy_rating | 488 | object |
| monitoring_required | 265 | array |
| conditions_treated | 233 | array |
| safety_profile | 232 | string |
| evidence_level | 232 | string |
| linked_conditions | 165 | array |
| pharmacokinetics | 165 | object |
| efficacy_response | 158 | object |
| research_support | 155 | string |
| invasiveness | 130 | string |
| metabolism_transport | 1 | object |

## Editorial Coverage

- Has review info: 652
- Has review date: 651
- Has reviewer IDs: 651
- Missing editorial: 2 files

## Source Coverage

- Has references section: 543
- Has citations: 7
- Missing sources: 111 files

## Representative Fixtures


### Detailed Files (>15KB or >10 sections)
- alternative/4-7-8-breathing.json
- alternative/acupuncture.json
- alternative/adventure-therapy.json
- alternative/alexander-technique.json
- alternative/alternate-nostril-breathing.json

### Sparse Files (<2KB or <3 sections)