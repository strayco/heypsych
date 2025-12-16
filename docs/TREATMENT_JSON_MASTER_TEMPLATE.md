# HeyPsych Treatment JSON Master Template

> **Purpose**: SEO-optimized JSON schema for all treatment types. Every treatment should include real efficacy data with citations, patient-friendly explanations, and specific numbers for rich snippets.

---

## Table of Contents

1. [Core Structure (All Categories)](#1-core-structure-all-categories)
2. [Medications](#2-medications)
3. [Interventional](#3-interventional)
4. [Investigational](#4-investigational)
5. [Therapy](#5-therapy)
6. [Alternative](#6-alternative)
7. [Supplements](#7-supplements)
8. [Section Types Reference](#8-section-types-reference)
9. [SEO Guidelines](#9-seo-guidelines)

---

## 1. Core Structure (All Categories)

Every treatment JSON must include these fields:

```json
{
  "kind": "treatment",
  "slug": "treatment-name-lowercase",
  "type": "medication|interventional|investigational|therapy|alternative|supplement",
  "name": "Treatment Name (Brand Name)",
  
  "summary": "Clinical one-liner for professionals.",
  "description": "2-3 sentence clinical description.",
  "patient_summary": "Plain-language explanation. No jargon. What it does and who it helps.",
  
  "category": "type/subcategory",
  
  "metadata": { },
  "clinical_metadata": { },
  "sections": [ ],
  
  "seo": {
    "title": "Brand (Generic): XX% Key Stat, Key Feature & Expert Guide",
    "description": "Complete guide with specific numbers for rich snippets."
  },
  
  "editorial": {
    "medicalReviewerIds": ["reviewer-id"],
    "reviewBoard": "official",
    "lastReviewed": "YYYY-MM-DD",
    "lastUpdated": "YYYY-MM-DD",
    "citations": ["https://source-url.com"]
  }
}
```

### Key Rules

- **No asterisks** (`**bold**`) in any text — renders as literal asterisks
- **No numbered ratings** — use real study data with citations instead
- **Patient text** on every applicable section
- **Specific numbers** in SEO title and description
- **Academic citations** with proper author format

---

## 2. MEDICATIONS

**Type**: `"type": "medication"`

```json
{
  "kind": "treatment",
  "slug": "generic-name-brand",
  "type": "medication",
  "name": "Generic Name (Brand Name)",
  
  "summary": "Clinical summary of the medication's primary use.",
  "description": "2-3 sentence clinical description including mechanism and key applications.",
  "patient_summary": "This medication helps [target condition] by [simple mechanism]. It is typically prescribed for [who benefits].",
  
  "category": "medications/drug-class",
  
  "metadata": {
    "drug_classes": ["Class 1", "Class 2"],
    "brand_names": ["Brand1", "Brand2"],
    "administration_routes": ["Oral", "Injectable"],
    "prescription_status": "Prescription Required",
    "generic_available": true,
    "fda_approval_year": 2004,
    "pharmacologic_category": "Primary Category"
  },
  
  "clinical_metadata": {
    "primary_indications": ["Primary Indication 1", "Primary Indication 2"],
    "linked_conditions": [
      {
        "slug": "condition-slug",
        "relationship": "primary_treatment|off_label|adjunctive",
        "context": "Brief description of the treatment relationship"
      }
    ],
    "contraindications": [
      "Contraindication 1 (with specifics)",
      "Contraindication 2"
    ],
    "efficacy_response": {
      "metric": "Primary outcome measure (Study Type)",
      "percentage_value": "XX%",
      "comparison_data": "XX% for placebo",
      "patient_text": "In studies, XX% of patients experienced [outcome], compared to XX% taking a placebo.",
      "citation_tag": "PMCXXXXXXX"
    },
    "pharmacokinetics": {
      "metabolism": "Hepatic (CYP enzyme) or Not metabolized",
      "excretion": "Urine/Feces",
      "half_life": "X-X hours",
      "bioavailability": "X%"
    }
  },
  
  "sections": [
    {
      "type": "efficacy",
      "heading": "How Well Does It Work?",
      "metric": "Primary outcome measure",
      "value": "XX%",
      "comparison": "XX% for placebo",
      "text": "Clinical description of efficacy data from the study.",
      "patient_text": "In studies, XX% of patients saw [benefit], compared to XX% of those taking a sugar pill.",
      "citation": {
        "label": "Author A, et al. Study Title. Journal. Year",
        "url": "https://pubmed.ncbi.nlm.nih.gov/XXXXXXXX/"
      }
    },
    {
      "type": "indications",
      "items": ["Primary indication with {link:condition:slug:display text}"],
      "off_label": ["Off-label use with {link:condition:slug:display text}"],
      "patient_text": "This medicine is used for [conditions]. It may also be used off-label for [other conditions]."
    },
    {
      "type": "mechanism",
      "text": "Clinical mechanism of action description.",
      "patient_text": "This medication works by [simple explanation of how it helps]."
    },
    {
      "type": "dosing",
      "adult": {
        "start": "XX mg once/twice daily",
        "max": "XX mg/day",
        "notes": "Additional dosing instructions."
      },
      "patient_text": "Most people start at XX mg per day. Your doctor may adjust based on how you respond.",
      "renal_adjustments": [
        {"condition": "Moderate impairment", "dose": "XX mg", "patient_note": "Lower dose for kidney problems."},
        {"condition": "Severe impairment", "dose": "Contraindicated", "patient_note": "Not recommended with severe kidney disease."}
      ],
      "hepatic_adjustments": {
        "condition": "Mild to moderate",
        "dose": "Adjustment details."
      }
    },
    {
      "type": "dosage_forms",
      "items": ["Tablets: XX mg", "Capsules: XX mg"]
    },
    {
      "type": "onset_duration",
      "text": "Expected timeline for therapeutic effect."
    },
    {
      "type": "adverse_effects",
      "common": [
        {"symptom": "Side Effect 1", "incidence": "XX%", "patient_note": "Most common side effect."},
        {"symptom": "Side Effect 2", "incidence": "XX%"},
        {"symptom": "Side Effect 3", "incidence": "XX%"}
      ],
      "serious": [
        "Serious effect 1 (monitoring required)",
        "Serious effect 2"
      ]
    },
    {
      "type": "warnings",
      "black_box": "Black box warning text if applicable, otherwise null.",
      "other": [
        "Warning 1",
        "Warning 2"
      ],
      "patient_counseling": [
        "Key counseling point 1 in plain language.",
        "Key counseling point 2.",
        "When to seek immediate medical attention."
      ]
    },
    {
      "type": "interactions",
      "items": [
        {"with": "Drug/Class", "risk": "Risk description", "action": "Recommended action"},
        {"with": "Drug/Class 2", "risk": "Risk description", "action": "Recommended action"}
      ]
    },
    {
      "type": "monitoring",
      "items": ["Lab/parameter 1", "Lab/parameter 2"]
    },
    {
      "type": "special_populations",
      "pregnancy": "Pregnancy considerations.",
      "lactation": "Breastfeeding considerations.",
      "pediatrics": "Pediatric use information.",
      "geriatrics": "Geriatric considerations."
    },
    {
      "type": "tapering",
      "text": "Discontinuation guidance."
    },
    {
      "type": "clinical_notes",
      "items": [
        "Clinical pearl 1",
        "Clinical pearl 2"
      ]
    },
    {
      "type": "references",
      "items": [
        {"label": "FDA Prescribing Information", "url": "https://www.accessdata.fda.gov/..."},
        {"label": "Author A, et al. Title. Journal. Year", "url": "https://pubmed.ncbi.nlm.nih.gov/..."}
      ]
    }
  ],

  "faqs": [
    {
      "q": "Common question about the treatment?",
      "a": "Clear, concise answer. Keep answers focused and patient-friendly."
    },
    {
      "q": "Another frequently asked question?",
      "a": "Detailed answer addressing the question directly."
    }
  ],
  
  "seo": {
    "title": "Brand (Generic): XX% Response Rate, Dosing & Expert Guide",
    "description": "Complete guide to [Drug]: XX% efficacy rate, dosing (XX mg), side effects (XX% nausea), and expert prescribing information."
  },
  
  "editorial": {
    "medicalReviewerIds": ["john-lee-md"],
    "reviewBoard": "official",
    "lastReviewed": "2025-11-28",
    "lastUpdated": "2025-11-28",
    "citations": [
      "https://www.accessdata.fda.gov/...",
      "https://pubmed.ncbi.nlm.nih.gov/..."
    ]
  }
}
```

---

## 3. INTERVENTIONAL

**Type**: `"type": "interventional"`

```json
{
  "kind": "treatment",
  "slug": "procedure-name",
  "type": "interventional",
  "name": "Procedure Name (Abbreviation)",
  
  "summary": "Clinical summary of the procedure.",
  "description": "2-3 sentence description of the procedure and its applications.",
  "patient_summary": "This procedure helps treat [condition] by [simple mechanism]. It is typically used when other treatments have not worked.",
  
  "category": "interventional/subcategory",
  
  "metadata": {
    "intervention_types": ["Type 1"],
    "treatment_types": ["Neurostimulation", "Medical procedure"],
    "delivery_methods": ["Inpatient", "Outpatient"],
    "invasiveness_level": "Minimally invasive (requires anesthesia)",
    "equipment_required": true,
    "training_required": true,
    "session_duration": "XX–XX minutes",
    "treatment_duration": ["X–X sessions", "X–X weeks"]
  },
  
  "clinical_metadata": {
    "primary_indications": ["Indication 1", "Indication 2"],
    "conditions_treated": ["Condition 1", "Condition 2"],
    "contraindications": ["Contraindication 1", "Contraindication 2"],
    "efficacy_response": {
      "metric": "Remission rate (Meta-Analysis)",
      "percentage_value": "XX%",
      "comparison_data": "XX% for sham/comparison",
      "patient_text": "In studies, XX% of patients achieved remission with this procedure.",
      "citation_tag": "PMCXXXXXXX"
    },
    "safety_profile": "Safety description.",
    "evidence_level": "High/Moderate/Low with context."
  },
  
  "sections": [
    {
      "type": "efficacy",
      "heading": "How Well Does It Work?",
      "metric": "Primary outcome measure",
      "value": "XX%",
      "comparison": "XX% for control",
      "text": "Clinical efficacy description with study context.",
      "patient_text": "About XX% of patients experience significant improvement.",
      "citation": {
        "label": "Author A, et al. Study Title. Journal. Year",
        "url": "https://pubmed.ncbi.nlm.nih.gov/..."
      }
    },
    {
      "type": "indications",
      "items": ["Indication 1", "Indication 2"],
      "patient_text": "This procedure is used for people with [conditions], especially when other treatments have not helped."
    },
    {
      "type": "mechanism",
      "text": "How the procedure works clinically.",
      "patient_text": "The procedure works by [simple explanation of mechanism]."
    },
    {
      "type": "protocol",
      "preparation": "Pre-procedure requirements.",
      "procedure": [
        "Step 1",
        "Step 2",
        "Step 3"
      ],
      "frequency": "How often sessions occur.",
      "duration": "Length of treatment course.",
      "total_treatment_time": "Total number of sessions."
    },
    {
      "type": "expected_outcomes",
      "immediate": ["Immediate outcome 1"],
      "short_term": ["Short-term outcome 1"],
      "long_term": ["Long-term outcome 1"],
      "patient_text": "Most people notice improvement within [timeframe]."
    },
    {
      "type": "side_effects",
      "common": [
        {"symptom": "Side effect 1", "incidence": "XX%", "patient_note": "Usually mild and temporary."},
        {"symptom": "Side effect 2", "incidence": "XX%"}
      ],
      "serious": ["Serious effect 1"]
    },
    {
      "type": "contraindications",
      "absolute": ["Absolute contraindication 1"],
      "relative": ["Relative contraindication 1"]
    },
    {
      "type": "patient_selection",
      "ideal_candidates": ["Candidate criteria 1"],
      "screening_required": ["Screening item 1"]
    },
    {
      "type": "cost_considerations",
      "typical_session_cost": "$XXX–$XXX",
      "total_treatment_cost": "$X,XXX–$X,XXX",
      "insurance_coverage": "Coverage information.",
      "patient_text": "A full course typically costs between $X,XXX and $X,XXX."
    },
    {
      "type": "references",
      "items": [
        {"label": "Author A, et al. Title. Journal. Year", "url": "https://..."}
      ]
    }
  ],
  
  "seo": {
    "title": "Procedure Name: XX% Remission Rate, Protocol & Expert Guide",
    "description": "Complete guide to [Procedure]: XX% remission rate, protocol details, side effects, and who qualifies for treatment."
  },
  
  "editorial": {
    "medicalReviewerIds": ["john-lee-md"],
    "reviewBoard": "official",
    "lastReviewed": "2025-11-28",
    "lastUpdated": "2025-11-28",
    "citations": ["https://pubmed.ncbi.nlm.nih.gov/..."]
  }
}
```

---

## 4. INVESTIGATIONAL

**Type**: `"type": "investigational"`

```json
{
  "kind": "treatment",
  "slug": "treatment-name",
  "type": "investigational",
  "name": "Treatment Name",
  
  "summary": "Clinical summary of the investigational treatment.",
  "description": "Description including current research status.",
  "patient_summary": "This experimental treatment is being studied for [conditions]. It shows promise but is not yet approved for general use.",
  
  "category": "investigational/subcategory",
  
  "metadata": {
    "intervention_types": ["Type 1"],
    "treatment_types": ["Pharmacological", "Psychotherapy-assisted"],
    "delivery_methods": ["Supervised clinical setting"],
    "session_duration": "X–X hours",
    "treatment_duration": "X–X sessions",
    "trial_phase": "Phase II/III clinical trials",
    "regulatory_status": "Schedule I (investigational only) / FDA Breakthrough Therapy"
  },
  
  "clinical_metadata": {
    "primary_indications": ["Indication 1", "Indication 2"],
    "conditions_treated": ["Condition 1", "Condition 2"],
    "contraindications": ["Contraindication 1", "Contraindication 2"],
    "efficacy_response": {
      "metric": "Response rate (Phase X Trial)",
      "percentage_value": "XX%",
      "comparison_data": "XX% for placebo",
      "patient_text": "In clinical trials, XX% of participants showed significant improvement.",
      "citation_tag": "PMCXXXXXXX"
    },
    "safety_profile": "Safety profile description.",
    "evidence_level": "Current evidence strength.",
    "research_support": "Key research institutions studying this treatment."
  },
  
  "sections": [
    {
      "type": "efficacy",
      "heading": "What Does the Research Show?",
      "metric": "Primary trial outcome",
      "value": "XX%",
      "comparison": "XX% for placebo",
      "text": "Description of trial results.",
      "patient_text": "In clinical trials, XX% of participants experienced [outcome].",
      "citation": {
        "label": "Author A, et al. Trial Name. Journal. Year",
        "url": "https://pubmed.ncbi.nlm.nih.gov/..."
      }
    },
    {
      "type": "indications",
      "items": ["Investigated indication 1", "Investigated indication 2"],
      "patient_text": "This treatment is being studied for [conditions]. It is not yet available outside of clinical trials."
    },
    {
      "type": "mechanism",
      "text": "Scientific mechanism of action.",
      "patient_text": "This treatment works by [simple mechanism explanation]."
    },
    {
      "type": "protocol",
      "preparation": "Pre-treatment preparation.",
      "procedure": ["Step 1", "Step 2"],
      "frequency": "Session frequency.",
      "duration": "Session duration."
    },
    {
      "type": "expected_outcomes",
      "immediate": ["Immediate effect 1"],
      "short_term": ["Short-term outcome 1"],
      "long_term": ["Long-term outcome 1"]
    },
    {
      "type": "side_effects",
      "common": [
        {"symptom": "Effect 1", "incidence": "XX%"}
      ],
      "serious": ["Serious risk 1"]
    },
    {
      "type": "contraindications",
      "absolute": ["Absolute contraindication 1"],
      "relative": ["Relative contraindication 1"],
      "special_considerations": ["Special consideration 1"]
    },
    {
      "type": "research_evidence",
      "studies": [
        "Author A, et al. Study description. Journal. Year."
      ],
      "limitations": "Current limitations of the research."
    },
    {
      "type": "references",
      "items": [
        {"label": "Author A, et al. Title. Journal. Year", "url": "https://..."}
      ]
    }
  ],
  
  "seo": {
    "title": "Treatment Name: XX% Response in Trials, Research & Safety",
    "description": "Current research on [Treatment]: XX% response rate in Phase X trials, mechanism, side effects, and when it may become available."
  },
  
  "editorial": {
    "medicalReviewerIds": ["john-lee-md"],
    "reviewBoard": "official",
    "lastReviewed": "2025-11-28",
    "lastUpdated": "2025-11-28",
    "citations": ["https://pubmed.ncbi.nlm.nih.gov/..."]
  }
}
```

---

## 5. THERAPY

**Type**: `"type": "therapy"`

```json
{
  "kind": "treatment",
  "slug": "therapy-name",
  "type": "therapy",
  "name": "Therapy Name (Abbreviation)",
  
  "summary": "Clinical summary of the therapy approach.",
  "description": "Description of the therapy and its evidence base.",
  "patient_summary": "This type of therapy helps you [benefit] by working with a trained therapist to [approach]. It is effective for [conditions].",
  
  "category": "therapy/individual|group|family",
  
  "metadata": {
    "intervention_types": ["Psychotherapy", "Skills Training"],
    "treatment_types": ["Cognitive", "Behavioral", "Talk Therapy"],
    "delivery_methods": ["In-person", "Telehealth", "Group", "Self-guided"],
    "session_duration": "XX–XX minutes",
    "treatment_duration": ["XX–XX sessions", "XX weeks/months"]
  },
  
  "clinical_metadata": {
    "primary_indications": ["Indication 1", "Indication 2"],
    "conditions_treated": ["Condition 1", "Condition 2", "Condition 3"],
    "contraindications": ["Contraindication 1"],
    "efficacy_response": {
      "metric": "Symptom reduction (Meta-Analysis)",
      "percentage_value": "XX%",
      "comparison_data": "Effect size d = X.XX",
      "patient_text": "Research shows XX% of people improve significantly with this therapy.",
      "citation_tag": "PMCXXXXXXX"
    },
    "safety_profile": "Safety and tolerability information.",
    "evidence_level": "Strong—evidence description."
  },
  
  "sections": [
    {
      "type": "efficacy",
      "heading": "How Well Does It Work?",
      "metric": "Response/remission rate",
      "value": "XX%",
      "comparison": "XX% for control/waitlist",
      "text": "Clinical description of efficacy evidence.",
      "patient_text": "About XX% of people feel significantly better after completing this therapy.",
      "citation": {
        "label": "Author A, et al. Meta-analysis Title. Journal. Year",
        "url": "https://pubmed.ncbi.nlm.nih.gov/..."
      }
    },
    {
      "type": "indications",
      "items": ["Indication 1", "Indication 2"],
      "patient_text": "This therapy is used for [conditions]. It works well for people who [criteria]."
    },
    {
      "type": "mechanism",
      "text": "How the therapy works clinically.",
      "patient_text": "This therapy helps by teaching you to [skill/approach] so you can [benefit]."
    },
    {
      "type": "protocol",
      "preparation": "Initial assessment process.",
      "procedure": [
        "Session component 1",
        "Session component 2",
        "Homework and practice"
      ],
      "frequency": "Weekly sessions typical.",
      "duration": "XX–XX sessions on average.",
      "total_treatment_time": "XX hours over XX weeks."
    },
    {
      "type": "session_structure",
      "pre_session": "Before session activities.",
      "treatment_phase": "During session activities.",
      "post_session": "After session activities and homework."
    },
    {
      "type": "expected_outcomes",
      "immediate": ["Immediate benefit 1"],
      "short_term": ["Short-term outcome 1"],
      "long_term": ["Long-term outcome 1"],
      "patient_text": "Most people start noticing improvement after X–X sessions."
    },
    {
      "type": "side_effects",
      "common": [
        {"symptom": "Initial anxiety increase", "patient_note": "Temporary while learning new skills."}
      ],
      "rare": ["Rare effect 1"]
    },
    {
      "type": "contraindications",
      "absolute": ["Absolute contraindication 1"],
      "relative": ["Relative contraindication 1"]
    },
    {
      "type": "patient_selection",
      "ideal_candidates": ["Candidate criteria 1"],
      "screening_required": ["Screening item 1"]
    },
    {
      "type": "cost_considerations",
      "typical_session_cost": "$XXX–$XXX per session",
      "total_treatment_cost": "$X,XXX–$X,XXX for full course",
      "insurance_coverage": "Often covered under mental health benefits.",
      "patient_text": "A typical course of therapy costs between $X,XXX and $X,XXX."
    },
    {
      "type": "references",
      "items": [
        {"label": "Author A, et al. Title. Journal. Year", "url": "https://..."}
      ]
    }
  ],
  
  "seo": {
    "title": "Therapy Name (Abbrev): XX% Response Rate, Techniques & Expert Guide",
    "description": "Complete guide to [Therapy]: XX% response rate, session structure, techniques, duration, and what to expect in treatment."
  },
  
  "editorial": {
    "medicalReviewerIds": ["john-lee-md"],
    "reviewBoard": "official",
    "lastReviewed": "2025-11-28",
    "lastUpdated": "2025-11-28",
    "citations": ["https://pubmed.ncbi.nlm.nih.gov/..."]
  }
}
```

---

## 6. ALTERNATIVE

**Type**: `"type": "alternative"`

```json
{
  "kind": "treatment",
  "slug": "practice-name",
  "type": "alternative",
  "name": "Practice Name",
  
  "summary": "Clinical summary of the practice.",
  "description": "Description of the practice and evidence base.",
  "patient_summary": "This practice helps with [benefits] by [simple mechanism]. Many people use it for [common uses].",
  
  "category": "alternative/mind-body|bodywork|traditional-medicine",
  
  "metadata": {
    "practice_styles": ["Style 1", "Style 2"],
    "treatment_variants": ["Variant 1", "Variant 2"],
    "delivery_methods": ["Instructor-led", "Self-guided", "Apps"],
    "session_duration": "XX–XX minutes",
    "treatment_duration": ["Daily practice", "XX-week programs"],
    "training_required": "None for personal use; certification for clinical use",
    "regulatory_status": "Unregulated / Evidence-based programs standardized"
  },
  
  "clinical_metadata": {
    "primary_indications": ["Stress management", "Indication 2"],
    "conditions_treated": ["Anxiety", "Depression (adjunctive)", "Chronic pain"],
    "contraindications": ["Relative: Condition requiring adapted approach"],
    "efficacy_response": {
      "metric": "Stress reduction (Meta-Analysis)",
      "percentage_value": "XX%",
      "comparison_data": "Effect size g = X.XX",
      "patient_text": "Research shows this practice can reduce stress by approximately XX%.",
      "citation_tag": "PMCXXXXXXX"
    },
    "safety_profile": "Generally safe; some may experience [mild effects].",
    "evidence_level": "Strong for [indication]; moderate for [indication]."
  },
  
  "sections": [
    {
      "type": "efficacy",
      "heading": "What Does the Research Show?",
      "metric": "Primary outcome measure",
      "value": "XX% improvement",
      "comparison": "vs control group",
      "text": "Description of research findings.",
      "patient_text": "Studies show this practice can help reduce [symptom] by about XX%.",
      "citation": {
        "label": "Author A, et al. Meta-analysis Title. Journal. Year",
        "url": "https://pubmed.ncbi.nlm.nih.gov/..."
      }
    },
    {
      "type": "indications",
      "items": ["Use 1", "Use 2"],
      "patient_text": "This practice is commonly used for [conditions/goals]."
    },
    {
      "type": "mechanism",
      "text": "How the practice works physiologically/psychologically.",
      "patient_text": "This practice works by helping your [body/mind] to [simple mechanism]."
    },
    {
      "type": "protocol",
      "preparation": "What you need to start.",
      "procedure": [
        "Step 1",
        "Step 2"
      ],
      "frequency": "Daily or near-daily practice recommended.",
      "duration": "XX minutes per session."
    },
    {
      "type": "treatment_variants",
      "items": ["Variant 1 - description", "Variant 2 - description"]
    },
    {
      "type": "expected_outcomes",
      "immediate": ["Immediate benefit"],
      "short_term": ["Short-term benefit"],
      "long_term": ["Long-term benefit"],
      "patient_text": "Many people notice [benefit] within [timeframe]."
    },
    {
      "type": "side_effects",
      "common": [
        {"symptom": "Mild effect 1", "patient_note": "Usually temporary."}
      ],
      "rare": ["Rare effect 1"]
    },
    {
      "type": "contraindications",
      "absolute": [],
      "relative": ["Condition requiring modification"],
      "special_considerations": ["When to use adapted approach"]
    },
    {
      "type": "cost_considerations",
      "typical_session_cost": "Free (self-practice) to $XX–$XXX (classes/courses)",
      "total_treatment_cost": "Low to moderate",
      "patient_text": "You can practice for free on your own, or take structured courses for $XX–$XXX."
    },
    {
      "type": "references",
      "items": [
        {"label": "Author A, et al. Title. Journal. Year", "url": "https://..."}
      ]
    }
  ],
  
  "seo": {
    "title": "Practice Name: XX% Stress Reduction, Techniques & Evidence-Based Guide",
    "description": "Complete guide to [Practice]: XX% improvement in studies, techniques, how to start, and evidence-based benefits for stress, anxiety, and wellbeing."
  },
  
  "editorial": {
    "medicalReviewerIds": ["john-lee-md"],
    "reviewBoard": "official",
    "lastReviewed": "2025-11-28",
    "lastUpdated": "2025-11-28",
    "citations": ["https://pubmed.ncbi.nlm.nih.gov/..."]
  }
}
```

---

## 7. SUPPLEMENTS

**Type**: `"type": "supplement"`

```json
{
  "kind": "treatment",
  "slug": "supplement-name",
  "type": "supplement",
  "name": "Supplement Name (Common Names)",
  
  "summary": "Clinical summary of the supplement.",
  "description": "Description including primary uses and mechanism.",
  "patient_summary": "This supplement may help with [benefits]. It is commonly used for [uses] and is generally well-tolerated.",
  
  "category": "supplements/vitamin|mineral|amino-acid|herbal|probiotic",
  
  "metadata": {
    "compound_type": "Vitamin/Mineral/Amino acid/Herbal",
    "natural_source": "Natural sources of the compound",
    "therapeutic_categories": ["Category 1", "Category 2"],
    "administration_routes": ["Oral"],
    "prescription_status": "OTC / Prescription (high dose)",
    "brand_names": ["Brand 1", "Brand 2"],
    "fda_status": "Dietary supplement / Approved for [condition]"
  },
  
  "clinical_metadata": {
    "primary_indications": ["Deficiency prevention", "Indication 2"],
    "off_label_uses": ["Off-label use 1", "Off-label use 2"],
    "contraindications": ["Contraindication 1"],
    "efficacy_response": {
      "metric": "Primary outcome (Meta-Analysis)",
      "percentage_value": "XX%",
      "comparison_data": "vs placebo",
      "patient_text": "Research suggests this supplement may help [outcome] by approximately XX%.",
      "citation_tag": "PMCXXXXXXX"
    },
    "monitoring_required": ["Lab test 1", "Lab test 2"]
  },
  
  "sections": [
    {
      "type": "efficacy",
      "heading": "What Does the Research Show?",
      "metric": "Primary outcome measure",
      "value": "XX%",
      "comparison": "vs placebo",
      "text": "Description of research findings and evidence quality.",
      "patient_text": "Studies suggest this supplement may help with [outcome], though more research is needed.",
      "citation": {
        "label": "Author A, et al. Review Title. Journal. Year",
        "url": "https://pubmed.ncbi.nlm.nih.gov/..."
      }
    },
    {
      "type": "indications",
      "items": ["Indication 1", "Indication 2"],
      "patient_text": "This supplement is used for [conditions/deficiencies]."
    },
    {
      "type": "mechanism",
      "text": "How the supplement works in the body.",
      "patient_text": "This supplement works by [simple mechanism]."
    },
    {
      "type": "dosing",
      "adult": {
        "RDA": "XX mg/day (if applicable)",
        "therapeutic": "XX–XX mg/day",
        "upper_limit": "XX mg/day"
      },
      "patient_text": "Most adults take XX–XX mg per day. Do not exceed XX mg without medical supervision.",
      "pediatric": "Pediatric dosing information."
    },
    {
      "type": "dosage_forms",
      "items": ["Tablets", "Capsules", "Liquid", "Gummies"]
    },
    {
      "type": "onset_duration",
      "text": "Timeline for effects."
    },
    {
      "type": "adverse_effects",
      "common": [
        {"symptom": "Effect 1", "incidence": "XX%", "patient_note": "Usually mild."}
      ],
      "serious": ["Serious effect at high doses"]
    },
    {
      "type": "warnings",
      "other": ["Warning 1", "Warning 2"],
      "patient_counseling": [
        "Counseling point 1",
        "When to consult a doctor"
      ]
    },
    {
      "type": "interactions",
      "items": [
        {"with": "Drug/Supplement", "risk": "Risk description", "action": "Recommended action"}
      ]
    },
    {
      "type": "monitoring",
      "items": ["Lab test 1 if on long-term high dose"]
    },
    {
      "type": "special_populations",
      "pregnancy": "Pregnancy considerations.",
      "lactation": "Breastfeeding considerations.",
      "pediatrics": "Pediatric use.",
      "geriatrics": "Geriatric considerations."
    },
    {
      "type": "references",
      "items": [
        {"label": "NIH Office of Dietary Supplements", "url": "https://ods.od.nih.gov/..."},
        {"label": "Author A, et al. Title. Journal. Year", "url": "https://..."}
      ]
    }
  ],
  
  "seo": {
    "title": "Supplement Name: XX% Efficacy for [Use], Dosing & Safety Guide",
    "description": "Complete guide to [Supplement]: XX% efficacy in studies, recommended dosing (XX mg), interactions, and evidence-based uses."
  },
  
  "editorial": {
    "medicalReviewerIds": ["john-lee-md"],
    "reviewBoard": "official",
    "lastReviewed": "2025-11-28",
    "lastUpdated": "2025-11-28",
    "citations": ["https://ods.od.nih.gov/...", "https://pubmed.ncbi.nlm.nih.gov/..."]
  }
}
```

---

## 8. Section Types Reference

### Universal Sections (All Categories)

| Section | Required | Fields |
|---------|----------|--------|
| `efficacy` | ✅ | `metric`, `value`, `comparison`, `text`, `patient_text`, `citation` |
| `indications` | ✅ | `items[]`, `patient_text` |
| `mechanism` | ✅ | `text`, `patient_text` |
| `references` | ✅ | `items[{label, url}]` |

### Category-Specific Sections

| Section | Meds | Interv | Invest | Therapy | Alt | Suppl |
|---------|:----:|:------:|:------:|:-------:|:---:|:-----:|
| `dosing` | ✅ | — | — | — | — | ✅ |
| `dosage_forms` | ✅ | — | — | — | — | ✅ |
| `adverse_effects` | ✅ | — | — | — | — | ✅ |
| `warnings` | ✅ | — | — | — | — | ✅ |
| `interactions` | ✅ | — | — | — | — | ✅ |
| `monitoring` | ✅ | — | — | — | — | ✅ |
| `tapering` | ✅ | — | — | — | — | — |
| `protocol` | — | ✅ | ✅ | ✅ | ✅ | — |
| `expected_outcomes` | — | ✅ | ✅ | ✅ | ✅ | — |
| `side_effects` | — | ✅ | ✅ | ✅ | ✅ | — |
| `contraindications` | — | ✅ | ✅ | ✅ | ✅ | — |
| `patient_selection` | — | ✅ | — | ✅ | — | — |
| `session_structure` | — | ✅ | — | ✅ | — | — |
| `treatment_variants` | — | — | — | — | ✅ | — |
| `research_evidence` | — | ✅ | ✅ | — | — | — |
| `cost_considerations` | — | ✅ | ✅ | ✅ | ✅ | — |
| `special_populations` | ✅ | ✅ | — | ✅ | — | ✅ |
| `clinical_notes` | ✅ | ✅ | — | ✅ | ✅ | ✅ |

---

## 9. SEO Guidelines

### Title Formula

```
{Brand} ({Generic}): {XX%} {Key Metric}, {Feature} & Expert Guide
```

**Examples**:
- `Zoloft (Sertraline): 54% Response Rate, Dosing & Expert Guide`
- `ECT: 80% Remission Rate, Protocol & Safety Guide`
- `CBT: 60% Symptom Reduction, Techniques & Evidence-Based Guide`
- `Meditation: 31% Stress Reduction, Techniques & How to Start`

### Description Formula

```
Complete guide to {Treatment}: {XX% metric}, {specific data point}, {another data point}, and {patient-relevant info}.
```

**Examples**:
- `Complete guide to Sertraline: 54% response rate, dosing (50-200mg), side effects (nausea 25%), and prescribing tips.`
- `ECT for treatment-resistant depression: 80% remission rate, procedure details, side effects, and who qualifies.`

### Numbers for Rich Snippets

Always include specific numbers:
- Efficacy: `36% abstinence rate`, `54% response rate`
- Side effects: `17% diarrhea`, `25% nausea`
- Dosing: `50 mg daily`, `666 mg TID`
- Duration: `8 weeks to effect`, `12-20 sessions`
- Cost: `$100-$250 per session`

### Keyword Sprinkling (Light Touch)

Add target keyword phrases naturally in 1-2 places. Do not overdo it.

**Where to add:**
- `summary` — e.g., "An atypical antipsychotic **medication**..."
- `seo.description` — e.g., "...an atypical antipsychotic **medication** for schizophrenia..."

**Common keyword patterns by category:**
- Medications: `[drug class] medication`, `[condition] medication`, `prescription medication`
- Therapy: `[therapy type] therapy`, `mental health treatment`
- Supplements: `[supplement] for [condition]`, `natural supplement`

**Avoid:** Keyword stuffing, unnatural phrasing, repeating the same phrase more than twice.

---

## 10. Consistency Standards

### Pharmacokinetic Keys

Always use underscore format for `pharmacokinetics` object keys:
- ✅ `half_life` (correct)
- ❌ `half-life` (incorrect)

All pharmacokinetic keys should be lowercase with underscores:
```json
"pharmacokinetics": {
  "metabolism": "...",
  "excretion": "...",
  "half_life": "...",
  "bioavailability": "...",
  "protein_binding": "..."
}
```

### Reviewer URLs

Medical reviewer references in `schema_injection` should point to the review board page:
```json
{
  "@type": "Person",
  "@id": "https://heypsych.com/about/medical-review-board#reviewer-id",
  "url": "https://heypsych.com/about/medical-review-board"
}
```

### Cross-Linking with `linked_conditions`

For reliable internal linking to condition pages, use `linked_conditions` in `clinical_metadata`:
```json
"linked_conditions": [
  {
    "slug": "schizophrenia",
    "relationship": "primary_treatment",
    "context": "First-line treatment for positive and negative symptoms"
  },
  {
    "slug": "schizoaffective-disorder",
    "relationship": "off_label",
    "context": "May be used for psychotic symptoms"
  }
]
```

**Relationship types:**
- `primary_treatment` — FDA-approved or primary indication (high priority link)
- `off_label` — Off-label but clinically used (medium priority link)
- `adjunctive` — Used alongside other treatments (medium priority link)

**Note:** `linked_conditions` uses exact slug matching, which is more reliable than text matching from `primary_indications`.

---

## Pre-Submission Checklist

- [ ] `patient_summary` is plain language (no jargon)
- [ ] All `patient_text` fields are clear and simple
- [ ] No asterisks (`**`) anywhere in the content
- [ ] `efficacy` section has real study data with `citation`
- [ ] `adverse_effects` includes incidence percentages where available
- [ ] `seo.title` includes a specific number/percentage
- [ ] `seo.description` includes multiple specific data points
- [ ] Light keyword sprinkling in `summary` and/or `seo.description`
- [ ] `pharmacokinetics` uses `half_life` (underscore, not hyphen)
- [ ] `linked_conditions` uses exact condition slugs for cross-linking
- [ ] `faqs` contains 3-5 relevant questions with patient-friendly answers
- [ ] `schema_injection` reviewer URLs point to `/about/medical-review-board`
- [ ] `editorial.citations` includes all PubMed/source URLs
- [ ] All reference labels use academic format: `Author A, et al. Title. Journal. Year`

---

*Last Updated: November 29, 2025*
