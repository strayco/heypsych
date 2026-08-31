# Phase 2: Strategic Architecture Plan

**Project:** HeyPsych SEO + Internal Linking + Architecture Optimization
**Date:** November 18, 2025
**Status:** Ready for Implementation
**Phase 1 Audit:** [PHASE_1_COMPREHENSIVE_AUDIT.md](./PHASE_1_COMPREHENSIVE_AUDIT.md)

---

## Executive Summary

This strategic plan provides a **complete, scalable, rules-based architecture** for optimizing HeyPsych's SEO across 863 pages. The system is designed to be:

- ✅ **Fully automated** — Metadata and links generated from existing JSON
- ✅ **YMYL/E-A-T compliant** — Meets Google medical content standards
- ✅ **Scalable** — Handles growth from 783 to 5,000+ entities without code changes
- ✅ **Resilient** — Adapts to JSON structure changes automatically
- ✅ **Medical-specific** — Leverages ICD-10, DSM-5, drug classes, clinical data

### Architecture Pillars:

1. **YMYL + E-A-T Compliance Framework** — Medical content authority system
2. **Dynamic Metadata Engine** — Rules-based title/description/schema generation
3. **Automated Internal Linking Engine** — 50+ links per page from JSON relationships
4. **Content Clustering System** — Hub-and-spoke mental health topic architecture
5. **Sitemap & Indexing Strategy** — Dynamic generation with prioritization
6. **Scalability Framework** — Future-proof for unlimited growth

---

## 1. YMYL + E-A-T Compliance Framework

### 1.1 Overview

Google's Your Money or Your Life (YMYL) guidelines require **exceptional E-A-T** (Expertise, Authoritativeness, Trustworthiness) for medical content. This framework ensures HeyPsych meets and exceeds these standards.

### 1.2 E-A-T Component System

#### Layer 1: Individual Expertise (Author)

**Implementation:**
```typescript
// Add to all entity JSON files
{
  "editorial": {
    "author": {
      "name": "Sarah Mitchell",
      "credentials": "BA Psychology, Health Writer",
      "bio": "Sarah specializes in mental health content with 8+ years experience...",
      "profileUrl": "/about/authors/sarah-mitchell",
      "expertise": ["depression", "anxiety", "mood disorders"]
    }
  }
}
```

**Display on Page:**
```html
<div class="author-byline">
  <span class="author-label">Written by:</span>
  <a href="/about/authors/sarah-mitchell">
    Sarah Mitchell, BA Psychology
  </a>
</div>
```

**Schema.org:**
```json
{
  "author": {
    "@type": "Person",
    "name": "Sarah Mitchell",
    "jobTitle": "Health Writer",
    "credentials": "BA Psychology",
    "knowsAbout": ["Mental Health", "Psychology", "Psychiatry"],
    "url": "https://heypsych.com/about/authors/sarah-mitchell"
  }
}
```

#### Layer 2: Medical Authority (Reviewer)

**Implementation:**
```typescript
// Add medical reviewer to entity JSON
{
  "editorial": {
    "medicalReviewer": {
      "name": "Dr. Jennifer Chen",
      "credentials": "MD, Board-Certified Psychiatrist",
      "specialty": "Mood and Anxiety Disorders",
      "affiliation": "American Psychiatric Association",
      "licenseNumber": "CA-A12345",
      "bio": "Dr. Chen is a board-certified psychiatrist with 15+ years...",
      "profileUrl": "/about/medical-review-board/dr-jennifer-chen"
    }
  }
}
```

**Display Requirements:**
- Prominent "Medically Reviewed By" badge
- Higher credentials than author (MD/PhD > BA/MA)
- Specialty area relevant to content
- Professional affiliations
- License verification (where applicable)

**Visual Display:**
```html
<div class="medical-review-badge">
  <svg class="verified-icon">...</svg>
  <div>
    <span class="review-label">Medically Reviewed By:</span>
    <a href="/about/medical-review-board/dr-jennifer-chen">
      Dr. Jennifer Chen, MD
    </a>
    <span class="specialty">Board-Certified Psychiatrist</span>
    <span class="affiliation">American Psychiatric Association</span>
  </div>
</div>
```

#### Layer 3: Temporal Trust (Timestamps)

**Three Required Timestamps:**

1. **Published Date** — Original publication
2. **Last Updated** — Most recent content revision
3. **Last Medically Reviewed** — Most recent expert review

**Implementation:**
```typescript
{
  "editorial": {
    "dates": {
      "published": "2024-01-15",
      "lastUpdated": "2025-11-18",
      "lastMedicallyReviewed": "2025-11-01",
      "nextReviewDue": "2026-11-01"
    }
  }
}
```

**Display:**
```html
<div class="content-dates">
  <span>Published: <time datetime="2024-01-15">January 15, 2024</time></span>
  <span>Updated: <time datetime="2025-11-18">November 18, 2025</time></span>
  <span>Medically Reviewed: <time datetime="2025-11-01">November 1, 2025</time></span>
</div>
```

**Schema:**
```json
{
  "datePublished": "2024-01-15",
  "dateModified": "2025-11-18",
  "reviewedBy": {
    "@type": "Person",
    "name": "Dr. Jennifer Chen"
  }
}
```

#### Layer 4: Institutional Authority

**HeyPsych Organization Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "MedicalOrganization",
  "name": "HeyPsych",
  "url": "https://heypsych.com",
  "logo": "https://heypsych.com/logo.svg",
  "description": "Evidence-based mental health treatment information",
  "medicalSpecialty": "Psychiatry",
  "memberOf": {
    "@type": "Organization",
    "name": "Mental Health America"
  },
  "sameAs": [
    "https://twitter.com/heypsych",
    "https://linkedin.com/company/heypsych"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Editorial",
    "email": "editorial@heypsych.com"
  }
}
```

**Trust Pages (Required):**
- `/about/editorial-process` — How content is created and reviewed
- `/about/medical-review-board` — Credentials of all reviewers
- `/about/editorial-standards` — Quality assurance process
- `/about/update-policy` — How and when content is updated
- `/about/accuracy-commitment` — Fact-checking and source verification

### 1.3 Medical Review Process

**Content Review Workflow:**

```
1. Content Creation
   ├─ Health writer researches and drafts (with citations)
   ├─ Includes primary sources (journals, clinical guidelines)
   └─ Formats according to template

2. Editorial Review
   ├─ Copy editor checks grammar, clarity, accessibility
   ├─ Fact-checker verifies all claims against sources
   └─ SEO editor optimizes for search intent

3. Medical Review
   ├─ Board-certified psychiatrist/psychologist reviews clinical accuracy
   ├─ Verifies diagnosis criteria (DSM-5/ICD-10 compliance)
   ├─ Confirms treatment recommendations are evidence-based
   ├─ Checks for safety warnings and contraindications
   └─ Signs off with credentials

4. Publication
   ├─ Publish with all attribution and timestamps
   ├─ Add to review calendar (annual review)
   └─ Monitor for user feedback

5. Ongoing Maintenance
   ├─ Annual medical review (minimum)
   ├─ Immediate updates for new clinical guidelines
   └─ Revision tracking with update reasons
```

**Documentation in JSON:**
```json
{
  "editorial": {
    "reviewHistory": [
      {
        "date": "2025-11-01",
        "reviewer": "Dr. Jennifer Chen, MD",
        "changes": "Updated medication dosing based on 2025 APA guidelines",
        "sources": ["doi:10.1001/jamapsychiatry.2025.xxx"]
      },
      {
        "date": "2024-06-15",
        "reviewer": "Dr. Michael Torres, PhD",
        "changes": "Added new CBT research findings",
        "sources": ["doi:10.1037/ccp0000xxx"]
      }
    ]
  }
}
```

### 1.4 Citation & Reference System

**Required Elements:**

**In-Text Citations:**
```
"Studies show that CBT is effective for treating GAD, with response
rates of 50-75% [1, 2]."
```

**Reference Section:**
```html
<section class="references">
  <h2>Medical References</h2>
  <ol>
    <li id="ref-1">
      <span class="citation">
        Hofmann SG, Smits JA. Cognitive-behavioral therapy for adult
        anxiety disorders: a meta-analysis. <em>J Clin Psychiatry</em>.
        2008;69(4):621-632.
      </span>
      <a href="https://doi.org/10.4088/JCP.v69n0415" target="_blank">
        DOI: 10.4088/JCP.v69n0415
      </a>
    </li>
    <li id="ref-2">...</li>
  </ol>
</section>
```

**Sources Priority Order:**
1. **Primary:** Peer-reviewed medical journals
2. **Clinical Guidelines:** APA, NICE, WHO guidelines
3. **Government:** NIMH, SAMHSA resources
4. **Professional:** Medical textbooks, expert consensus

**Schema for Citations:**
```json
{
  "citation": [
    {
      "@type": "MedicalScholarlyArticle",
      "headline": "Cognitive-behavioral therapy for adult anxiety disorders",
      "author": "Hofmann SG, Smits JA",
      "datePublished": "2008",
      "publisher": "J Clin Psychiatry",
      "doi": "10.4088/JCP.v69n0415"
    }
  ]
}
```

### 1.5 Medical Disclaimers

**Required on All Clinical Pages:**

```html
<aside class="medical-disclaimer">
  <h4>⚕️ Medical Disclaimer</h4>
  <p>
    This content is for informational and educational purposes only.
    It is not intended to be a substitute for professional medical
    advice, diagnosis, or treatment. Always seek the advice of your
    physician or other qualified health provider with any questions
    you may have regarding a medical condition.
  </p>
  <p>
    <strong>If you are experiencing a mental health crisis or emergency,
    please call 988 (Suicide & Crisis Lifeline) or go to your nearest
    emergency room.</strong>
  </p>
</aside>
```

**Condition-Specific Warnings:**
- Suicidal ideation → Immediate crisis resources
- Medication pages → "Never stop medication without medical supervision"
- Pregnancy/pediatric → "Consult specialized medical provider"

### 1.6 Accessibility & Plain Language

**Medical Content Standards:**
- Reading level: 8th-10th grade (Flesch-Kincaid)
- Define medical terms on first use
- Use analogies for complex concepts
- Avoid jargon where possible
- Include glossary for technical terms

**Example:**
```
❌ "GAD is characterized by excessive and persistent worry accompanied
    by psychomotor agitation."

✅ "Generalized Anxiety Disorder (GAD) involves constant, hard-to-control
    worry about everyday things, often accompanied by physical tension
    and restlessness."
```

---

## 2. Metadata Architecture (Rules-Based System)

### 2.1 Dynamic Metadata Generation

All metadata generated automatically from JSON using **deterministic rules**. Zero hardcoding.

### 2.2 Title Generation Rules

#### Condition Pages

**Formula:**
```
{Condition Name}: Symptoms, Causes, Treatment & Support | HeyPsych
```

**Examples:**
- Generalized Anxiety Disorder: Symptoms, Causes, Treatment & Support | HeyPsych
- Major Depressive Disorder: Symptoms, Causes, Treatment & Support | HeyPsych
- ADHD: Symptoms, Causes, Treatment & Support | HeyPsych

**Implementation:**
```typescript
function generateConditionTitle(condition: Condition): string {
  const name = condition.name;
  const suffix = "Symptoms, Causes, Treatment & Support | HeyPsych";

  // Use custom title if provided
  if (condition.seo?.title) {
    return condition.seo.title;
  }

  // Max 60 characters for SEO
  const title = `${name}: ${suffix}`;
  return title.length <= 60 ? title : `${name} | HeyPsych`;
}
```

#### Treatment Pages (Medications)

**Formula:**
```
{Medication Name} ({Brand}): Uses, Side Effects, Dosage | HeyPsych
```

**Examples:**
- Sertraline (Zoloft): Uses, Side Effects, Dosage | HeyPsych
- Escitalopram (Lexapro): Uses, Side Effects, Dosage | HeyPsych

**Implementation:**
```typescript
function generateMedicationTitle(medication: Treatment): string {
  const name = medication.name;
  const brand = medication.metadata?.brand_names?.[0];

  if (medication.seo?.title) return medication.seo.title;

  const brandSuffix = brand ? ` (${brand})` : '';
  const title = `${name}${brandSuffix}: Uses, Side Effects, Dosage | HeyPsych`;

  return title.length <= 60 ? title : `${name}: Uses & Dosage | HeyPsych`;
}
```

#### Treatment Pages (Therapy)

**Formula:**
```
{Therapy Name}: What It Is, How It Works, Effectiveness | HeyPsych
```

**Examples:**
- Cognitive Behavioral Therapy: What It Is, How It Works, Effectiveness | HeyPsych
- EMDR Therapy: What It Is, How It Works, Effectiveness | HeyPsych

#### Assessment Pages

**Formula:**
```
{Assessment Name}: Free Online {Type} Tool & Scoring Guide | HeyPsych
```

**Examples:**
- GAD-7: Free Online Anxiety Screening Tool & Scoring Guide | HeyPsych
- PHQ-9: Free Online Depression Screening Tool & Scoring Guide | HeyPsych

### 2.3 Meta Description Rules

**Length:** 155-160 characters (strict)
**Structure:** Problem → Solution → Action/Outcome

#### Condition Pages

**Formula:**
```
Learn about {condition} symptoms, causes, risk factors, and evidence-based
treatments. Discover when to seek help and how to manage {condition} effectively.
```

**Implementation:**
```typescript
function generateConditionDescription(condition: Condition): string {
  if (condition.seo?.description) return condition.seo.description;

  const name = condition.name;
  const shortName = name.replace(/Disorder|Syndrome/gi, '').trim();

  const desc = `Learn about ${name} symptoms, causes, risk factors, and ` +
               `evidence-based treatments. Discover when to seek help and ` +
               `how to manage ${shortName} effectively.`;

  return truncateToCharLimit(desc, 160);
}
```

#### Medication Pages

**Formula:**
```
{Name} ({Brand}) is used to treat {condition}. Learn about dosing, side effects,
interactions, and what to expect from this {drug class} medication.
```

**Example:**
```
Sertraline (Zoloft) is used to treat depression and anxiety. Learn about dosing,
side effects, interactions, and what to expect from this SSRI medication.
```

**Implementation:**
```typescript
function generateMedicationDescription(med: Treatment): string {
  if (med.seo?.description) return med.seo.description;

  const name = med.name;
  const brand = med.metadata?.brand_names?.[0] || '';
  const brandText = brand ? ` (${brand})` : '';
  const primaryUse = med.clinical_metadata?.primary_indications?.[0] || 'mental health conditions';
  const drugClass = med.metadata?.drug_classes?.[0] || 'medication';

  const desc = `${name}${brandText} is used to treat ${primaryUse.toLowerCase()}. ` +
               `Learn about dosing, side effects, interactions, and what to expect ` +
               `from this ${drugClass} medication.`;

  return truncateToCharLimit(desc, 160);
}
```

### 2.4 Keywords Generation

**Extract from JSON:**
```typescript
function generateKeywords(entity: Entity): string[] {
  const keywords = new Set<string>();

  // Base keywords
  keywords.add(entity.name);
  keywords.add(entity.slug);

  // From tags
  entity.tags?.forEach(tag => keywords.add(tag));

  // Type-specific
  if (entity.type === 'condition') {
    keywords.add(`${entity.name} symptoms`);
    keywords.add(`${entity.name} treatment`);
    keywords.add(`${entity.name} causes`);
    entity.content?.symptoms?.core?.forEach(s => {
      keywords.add(extractKeyPhrase(s));
    });
  }

  if (entity.type === 'medication') {
    entity.metadata?.drug_classes?.forEach(dc => keywords.add(dc));
    entity.metadata?.brand_names?.forEach(bn => keywords.add(bn));
    entity.clinical_metadata?.conditions_treated?.forEach(c => keywords.add(c));
  }

  // From SEO object
  entity.seo?.keywords?.forEach(kw => keywords.add(kw));

  // Limit to top 15 most relevant
  return Array.from(keywords).slice(0, 15);
}
```

### 2.5 OpenGraph & Twitter Cards

**Standard Template:**
```typescript
function generateOpenGraph(entity: Entity, metadata: Metadata) {
  return {
    title: metadata.title,
    description: metadata.description,
    url: `https://heypsych.com${getEntityPath(entity)}`,
    type: entity.type === 'condition' ? 'article' : 'website',
    siteName: 'HeyPsych',
    locale: 'en_US',
    images: [
      {
        url: generateOGImage(entity), // Dynamic OG image generation
        width: 1200,
        height: 630,
        alt: `${entity.name} - HeyPsych`
      }
    ]
  };
}

function generateTwitterCard(entity: Entity, metadata: Metadata) {
  return {
    card: 'summary_large_image',
    title: metadata.title,
    description: metadata.description,
    site: '@heypsych',
    creator: metadata.author?.twitter || '@heypsych',
    images: [generateOGImage(entity)]
  };
}
```

### 2.6 Canonical URL Rules

**Simple Rule:** Canonical = current page URL (no parameters)

```typescript
function generateCanonical(entity: Entity): string {
  const baseUrl = 'https://heypsych.com';
  const path = getEntityPath(entity);
  return `${baseUrl}${path}`;
}

function getEntityPath(entity: Entity): string {
  switch(entity.kind || entity.type) {
    case 'condition':
      return `/conditions/${entity.slug}`;
    case 'medication':
    case 'therapy':
    case 'treatment':
    case 'alternative':
    case 'supplement':
    case 'interventional':
    case 'investigational':
      return `/treatments/${entity.slug}`;
    case 'resource':
      const category = entity.metadata?.category || 'resources';
      if (category === 'assessments-screeners') {
        return `/resources/assessments-screeners/${entity.slug}`;
      }
      return `/resources/${entity.slug}`;
    default:
      return `/${entity.slug}`;
  }
}
```

---

## 3. JSON-LD Structured Data System

### 3.1 Schema Generation Architecture

**Multi-Schema Approach:** Each page has 3-5 schemas

**Standard Schema Stack:**
1. Primary schema (MedicalCondition, Drug, MedicalTherapy)
2. MedicalWebPage (all pages)
3. BreadcrumbList (navigation)
4. Person (author + reviewer)
5. FAQPage (if FAQ section exists)

### 3.2 MedicalCondition Schema

**Template:**
```json
{
  "@context": "https://schema.org",
  "@type": "MedicalCondition",
  "name": "{condition.name}",
  "alternateName": ["{abbreviations}"],
  "code": [
    {
      "@type": "MedicalCode",
      "code": "{condition.metadata.icd10_code}",
      "codingSystem": "ICD-10"
    },
    {
      "@type": "MedicalCode",
      "code": "{condition.metadata.dsm5_code}",
      "codingSystem": "DSM-5"
    }
  ],
  "description": "{condition.content.description}",
  "signOrSymptom": [
    {
      "@type": "MedicalSymptom",
      "name": "{symptom}"
    }
  ],
  "riskFactor": [
    {
      "@type": "MedicalRiskFactor",
      "name": "{factor}",
      "increasesRiskOf": "{condition.name}"
    }
  ],
  "possibleTreatment": [
    {
      "@type": "MedicalTherapy",
      "name": "{treatment}"
    }
  ],
  "associatedAnatomy": {
    "@type": "BrainStructure",
    "name": "{brain region}"
  },
  "epidemiology": "{condition.content.prevalence}",
  "typicalTest": [
    {
      "@type": "MedicalTest",
      "name": "{assessment}"
    }
  ]
}
```

**Implementation Function:**
```typescript
function generateMedicalConditionSchema(condition: Condition): object {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalCondition",
    "name": condition.name,
    "alternateName": extractAlternateNames(condition),
    "code": [
      ...(condition.metadata?.icd10_code ? [{
        "@type": "MedicalCode",
        "code": condition.metadata.icd10_code,
        "codingSystem": "ICD-10"
      }] : []),
      ...(condition.metadata?.dsm5_code ? [{
        "@type": "MedicalCode",
        "code": condition.metadata.dsm5_code,
        "codingSystem": "DSM-5"
      }] : [])
    ],
    "description": condition.content?.description,
    "signOrSymptom": condition.content?.symptoms?.core?.map(symptom => ({
      "@type": "MedicalSymptom",
      "name": cleanLinkSyntax(symptom)
    })) || [],
    "riskFactor": extractRiskFactors(condition),
    "possibleTreatment": extractPossibleTreatments(condition),
    "associatedAnatomy": extractBrainRegions(condition),
    "epidemiology": condition.content?.prevalence,
    "typicalTest": extractAssessments(condition)
  };
}
```

### 3.3 Drug Schema

**Template:**
```json
{
  "@context": "https://schema.org",
  "@type": "Drug",
  "name": "{medication.name}",
  "alternateName": ["{brand names}"],
  "activeIngredient": "{active ingredient}",
  "drugClass": ["{drug classes}"],
  "administrationRoute": "{routes}",
  "availableStrength": [
    {
      "@type": "DrugStrength",
      "strengthValue": "{value}",
      "strengthUnit": "{unit}"
    }
  ],
  "dosageForm": ["{forms}"],
  "prescriptionStatus": "PrescriptionOnly",
  "isAvailableGenerically": true,
  "legalStatus": {
    "@type": "DrugLegalStatus",
    "applicableLocation": "US"
  },
  "indication": [
    {
      "@type": "MedicalIndication",
      "name": "{condition}"
    }
  ],
  "contraindication": ["{contraindications}"],
  "warning": ["{warnings}"],
  "adverseOutcome": [
    {
      "@type": "MedicalEntity",
      "name": "{side effect}"
    }
  ],
  "interactingDrug": [
    {
      "@type": "Drug",
      "name": "{interacting drug}"
    }
  ]
}
```

**Implementation:**
```typescript
function generateDrugSchema(medication: Treatment): object {
  const sections = parseSections(medication.sections);

  return {
    "@context": "https://schema.org",
    "@type": "Drug",
    "name": medication.name,
    "alternateName": medication.metadata?.brand_names || [],
    "activeIngredient": extractActiveIngredient(medication),
    "drugClass": medication.metadata?.drug_classes || [],
    "administrationRoute": medication.metadata?.administration_routes?.[0] || "Oral",
    "availableStrength": extractDosageStrengths(sections.dosage_forms),
    "dosageForm": extractDosageForms(sections.dosage_forms),
    "prescriptionStatus": medication.metadata?.prescription_status === "Prescription Required"
      ? "PrescriptionOnly"
      : "OTC",
    "isAvailableGenerically": medication.metadata?.generic_available || false,
    "legalStatus": medication.metadata?.dea_schedule ? {
      "@type": "DrugLegalStatus",
      "applicableLocation": "US",
      "schedule": medication.metadata.dea_schedule
    } : undefined,
    "indication": medication.clinical_metadata?.conditions_treated?.map(c => ({
      "@type": "MedicalIndication",
      "name": cleanLinkSyntax(c)
    })) || [],
    "contraindication": medication.clinical_metadata?.contraindications || [],
    "warning": extractWarnings(sections),
    "adverseOutcome": extractAdverseEffects(sections),
    "interactingDrug": extractInteractions(sections)
  };
}
```

### 3.4 MedicalWebPage Schema

**Applied to ALL pages:**
```json
{
  "@context": "https://schema.org",
  "@type": "MedicalWebPage",
  "name": "{page title}",
  "url": "{canonical URL}",
  "description": "{meta description}",
  "inLanguage": "en-US",
  "isPartOf": {
    "@type": "MedicalWebsite",
    "name": "HeyPsych",
    "url": "https://heypsych.com"
  },
  "about": {
    "@type": "MedicalCondition",
    "@id": "{canonical URL}#condition"
  },
  "audience": {
    "@type": "MedicalAudience",
    "audienceType": "Patient"
  },
  "reviewedBy": {
    "@type": "Person",
    "name": "{reviewer name}",
    "credentials": "{credentials}",
    "jobTitle": "{specialty}"
  },
  "datePublished": "{published date}",
  "dateModified": "{last updated}",
  "lastReviewed": "{last medical review}",
  "mainContentOfPage": {
    "@type": "WebPageElement",
    "cssSelector": "main"
  },
  "specialty": "Psychiatry"
}
```

### 3.5 Person Schema (Author & Reviewer)

**Author Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "{author.name}",
  "jobTitle": "{author.jobTitle}",
  "credentials": "{author.credentials}",
  "description": "{author.bio}",
  "url": "https://heypsych.com/about/authors/{slug}",
  "knowsAbout": ["{expertise areas}"],
  "alumniOf": {
    "@type": "EducationalOrganization",
    "name": "{university}"
  }
}
```

**Medical Reviewer Schema:**
```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "{reviewer.name}",
  "credentials": "{reviewer.credentials}",
  "jobTitle": "{reviewer.specialty}",
  "memberOf": {
    "@type": "MedicalOrganization",
    "name": "{professional association}"
  },
  "hasCredential": {
    "@type": "EducationalOccupationalCredential",
    "credentialCategory": "Board Certification",
    "recognizedBy": {
      "@type": "Organization",
      "name": "American Board of Psychiatry and Neurology"
    }
  }
}
```

### 3.6 BreadcrumbList Schema

**Dynamic Generation:**
```typescript
function generateBreadcrumbSchema(entity: Entity): object {
  const breadcrumbs = buildBreadcrumbPath(entity);

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": `https://heypsych.com${crumb.path}`
    }))
  };
}

function buildBreadcrumbPath(entity: Entity): Breadcrumb[] {
  const path: Breadcrumb[] = [
    { name: "Home", path: "/" }
  ];

  if (entity.type === 'condition') {
    path.push({ name: "Conditions", path: "/conditions" });
    const category = entity.metadata?.category;
    if (category) {
      path.push({
        name: formatCategoryName(category),
        path: `/conditions/${category}`
      });
    }
  } else if (['medication', 'therapy', 'treatment'].includes(entity.type)) {
    path.push({ name: "Treatments", path: "/treatments" });
    const category = entity.category?.split('/')[1];
    if (category) {
      path.push({
        name: formatCategoryName(category),
        path: `/treatments/${category}`
      });
    }
  }

  path.push({
    name: entity.name,
    path: getEntityPath(entity)
  });

  return path;
}
```

### 3.7 FAQPage Schema

**Generate from FAQ sections:**
```typescript
function generateFAQSchema(faqs: FAQ[]): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

// Auto-generate FAQs for conditions
function generateConditionFAQs(condition: Condition): FAQ[] {
  return [
    {
      question: `What is ${condition.name}?`,
      answer: condition.content?.description || ''
    },
    {
      question: `What causes ${condition.name}?`,
      answer: formatRiskFactors(condition.content?.risk_factors)
    },
    {
      question: `What are the symptoms of ${condition.name}?`,
      answer: formatSymptoms(condition.content?.symptoms)
    },
    {
      question: `How is ${condition.name} diagnosed?`,
      answer: formatEvaluation(condition.content?.evaluation)
    },
    {
      question: `What treatments are available for ${condition.name}?`,
      answer: formatTreatments(condition.content?.treatment_approaches)
    },
    {
      question: `Can ${condition.name} be cured?`,
      answer: condition.content?.prognosis || ''
    }
  ];
}
```

---

## 4. Automated Internal Linking Engine

### 4.1 Linking Philosophy

**Goals:**
- 50-75 internal links per page minimum
- Contextual relevance (not link spam)
- Bidirectional linking (conditions ↔ treatments)
- Progressive patient journey (symptoms → diagnosis → treatment → support)

### 4.2 Link Extraction Rules

#### Conditions → Treatments

**Auto-link from treatment_approaches:**
```typescript
function extractConditionToTreatmentLinks(condition: Condition): Link[] {
  const links: Link[] = [];
  const approaches = condition.content?.treatment_approaches;

  // Medications
  approaches?.medications?.forEach((med: string) => {
    const slug = extractTreatmentSlug(med);
    if (slug) {
      links.push({
        text: med,
        url: `/treatments/${slug}`,
        context: 'treatment_approaches.medications'
      });
    }
  });

  // Psychotherapy
  approaches?.psychotherapy?.forEach((therapy: string) => {
    const slug = extractTreatmentSlug(therapy);
    if (slug) {
      links.push({
        text: therapy,
        url: `/treatments/${slug}`,
        context: 'treatment_approaches.psychotherapy'
      });
    }
  });

  return links;
}

// Extract treatment slug from text
function extractTreatmentSlug(text: string): string | null {
  // Check for {link:treatment:slug} syntax
  const linkMatch = text.match(/\{link:treatment:([^}]+)\}/);
  if (linkMatch) return linkMatch[1];

  // Fuzzy match against treatment database
  return findTreatmentByName(cleanLinkSyntax(text));
}
```

#### Conditions → Assessments

**Auto-link from screeners_rating_scales:**
```typescript
function extractConditionToAssessmentLinks(condition: Condition): Link[] {
  const links: Link[] = [];
  const screeners = condition.content?.evaluation?.screeners_rating_scales;

  screeners?.forEach((screener: string) => {
    const slug = findAssessmentByName(screener);
    if (slug) {
      links.push({
        text: screener,
        url: `/resources/assessments-screeners/${slug}`,
        context: 'evaluation.screeners_rating_scales'
      });
    }
  });

  return links;
}

// Assessment name matching
function findAssessmentByName(name: string): string | null {
  const assessments = {
    'GAD-7': 'gad-7',
    'Generalized Anxiety Disorder 7-item scale': 'gad-7',
    'PHQ-9': 'phq-9',
    'Patient Health Questionnaire-9': 'phq-9',
    'ASRS-v1-1': 'asrs-v1-1',
    'Adult ADHD Self-Report Scale': 'asrs-v1-1',
    'ASSIST-v3': 'assist-v3'
  };

  return assessments[name] || null;
}
```

#### Conditions → Related Conditions

**Auto-link from comorbidities:**
```typescript
function extractRelatedConditionLinks(condition: Condition): Link[] {
  const links: Link[] = [];
  const comorbidities = condition.content?.comorbidities;

  comorbidities?.forEach((comorbid: string) => {
    const slug = findConditionByName(comorbid);
    if (slug) {
      links.push({
        text: comorbid,
        url: `/conditions/${slug}`,
        context: 'comorbidities'
      });
    }
  });

  return links;
}
```

#### Treatments → Conditions

**Auto-link from indications:**
```typescript
function extractTreatmentToConditionLinks(treatment: Treatment): Link[] {
  const links: Link[] = [];

  // From sections.indications
  const indications = treatment.sections?.find(s => s.type === 'indications');
  indications?.items?.forEach((indication: string) => {
    if (indication.startsWith('{link:condition:')) {
      const slug = indication.match(/\{link:condition:([^}]+)\}/)?.[1];
      if (slug) {
        links.push({
          text: formatConditionName(slug),
          url: `/conditions/${slug}`,
          context: 'indications'
        });
      }
    }
  });

  // From clinical_metadata.conditions_treated
  treatment.clinical_metadata?.conditions_treated?.forEach((condition: string) => {
    const slug = findConditionByName(condition);
    if (slug) {
      links.push({
        text: condition,
        url: `/conditions/${slug}`,
        context: 'conditions_treated'
      });
    }
  });

  return links;
}
```

#### Treatments → Related Treatments

**Same drug class:**
```typescript
function extractRelatedTreatmentLinks(treatment: Treatment): Link[] {
  const links: Link[] = [];

  // For medications: same drug class
  if (treatment.type === 'medication') {
    const drugClass = treatment.metadata?.drug_classes?.[0];
    if (drugClass) {
      const sameDrugClass = findTreatmentsByDrugClass(drugClass)
        .filter(t => t.slug !== treatment.slug)
        .slice(0, 5); // Top 5 related

      sameDrugClass.forEach(related => {
        links.push({
          text: related.name,
          url: `/treatments/${related.slug}`,
          context: 'same_drug_class'
        });
      });
    }
  }

  // For therapies: same category
  if (treatment.type === 'therapy') {
    const category = treatment.category;
    const sameCategory = findTreatmentsByCategory(category)
      .filter(t => t.slug !== treatment.slug)
      .slice(0, 5);

    sameCategory.forEach(related => {
      links.push({
        text: related.name,
        url: `/treatments/${related.slug}`,
        context: 'same_category'
      });
    });
  }

  return links;
}
```

### 4.3 Link Placement Strategy

**Body Content Links (25-40 links):**
1. **Inline contextual** — Within paragraphs, naturally integrated
2. **Treatment sections** — Dedicated "Treatment Options" section with links
3. **Related conditions** — "Related Conditions" section
4. **Assessment tools** — "Screening Tools" section
5. **FAQ answers** — Links within FAQ responses

**Sidebar Links (8-12 links):**
- "Related Articles"
- "Common Questions"
- "Treatment Finder"
- "Assessment Tools"

**Navigation Links (10-12 links):**
- Breadcrumbs
- Category navigation
- Header menu

**Footer Links (60-100 links):**
- All condition categories
- All treatment categories
- Resources
- About/Legal

**Example Placement (Condition Page):**
```html
<article>
  <!-- Breadcrumbs (3-4 links) -->
  <nav>Home > Conditions > Anxiety > GAD</nav>

  <!-- Body Content (25-40 links) -->
  <section>
    <p>
      GAD often requires <a href="/treatments/cognitive-behavioral-therapy">
      cognitive behavioral therapy</a> and may benefit from
      <a href="/treatments/sertraline">SSRIs like sertraline</a>.
    </p>
  </section>

  <!-- Treatment Options Section (8-12 links) -->
  <section class="treatment-options">
    <h2>Treatment Options for GAD</h2>
    <div class="treatment-grid">
      <a href="/treatments/escitalopram">Escitalopram</a>
      <a href="/treatments/paroxetine">Paroxetine</a>
      <a href="/treatments/cognitive-behavioral-therapy">CBT</a>
      <a href="/treatments/acceptance-commitment-therapy">ACT</a>
      ...
    </div>
  </section>

  <!-- Related Conditions (4-6 links) -->
  <aside class="related-conditions">
    <h3>Related Conditions</h3>
    <ul>
      <li><a href="/conditions/panic-disorder">Panic Disorder</a></li>
      <li><a href="/conditions/major-depressive-disorder">Depression</a></li>
      ...
    </ul>
  </aside>

  <!-- Assessment Tools (1-2 links) -->
  <aside class="assessment-cta">
    <a href="/resources/assessments-screeners/gad-7">
      Take the GAD-7 Screening Quiz
    </a>
  </aside>

  <!-- FAQ Section (6-10 links in answers) -->
  <section class="faq">
    <div class="faq-item">
      <h3>What treatments work for GAD?</h3>
      <p>
        <a href="/treatments/cognitive-behavioral-therapy">CBT</a> is the
        gold standard, often combined with <a href="/treatments/sertraline">
        SSRIs</a>...
      </p>
    </div>
  </section>
</article>

<!-- Sidebar (8-12 links) -->
<aside class="sidebar">
  <div class="related-articles">
    <h3>Related Articles</h3>
    <ul>
      <li><a href="/resources/knowledge-hub/managing-anxiety">Managing Anxiety</a></li>
      ...
    </ul>
  </div>
</aside>

<!-- Footer (60-100 links) -->
<footer>
  <div class="footer-section">
    <h4>Conditions</h4>
    <ul>
      <li><a href="/conditions/anxiety-fear">Anxiety & Fear</a></li>
      <li><a href="/conditions/mood-depression">Depression</a></li>
      ...
    </ul>
  </div>
  <div class="footer-section">
    <h4>Treatments</h4>
    <ul>
      <li><a href="/treatments/medications">Medications</a></li>
      <li><a href="/treatments/therapy">Therapy</a></li>
      ...
    </ul>
  </div>
</footer>
```

### 4.4 Link Quality Rules

**Avoid:**
- ❌ Link spam (excessive links to same page)
- ❌ Irrelevant links
- ❌ Links in disclaimers/boilerplate
- ❌ Over-optimized anchor text

**Best Practices:**
- ✅ Natural anchor text
- ✅ Varied linking to same page (different anchor texts)
- ✅ Contextually relevant
- ✅ Value-added for user
- ✅ Nofollow for external untrusted links

**Anchor Text Variation:**
```
❌ Same anchor:
"Learn about GAD" → /conditions/gad
"Learn about GAD" → /conditions/gad
"Learn about GAD" → /conditions/gad

✅ Varied anchors:
"generalized anxiety disorder" → /conditions/gad
"GAD" → /conditions/gad
"excessive worry and anxiety" → /conditions/gad
"anxiety disorder treatment" → /conditions/gad
```

### 4.5 Bidirectional Linking

**Enforce reciprocal links:**
```typescript
function ensureBidirectionalLinks() {
  // If Condition A links to Treatment B,
  // Treatment B MUST link back to Condition A

  const conditionLinks = extractConditionToTreatmentLinks(condition);

  conditionLinks.forEach(link => {
    const treatment = getTreatmentBySlug(link.slug);
    const backlinks = extractTreatmentToConditionLinks(treatment);

    if (!backlinks.find(bl => bl.slug === condition.slug)) {
      // Add reciprocal link
      addReciprocalLink(treatment, condition);
    }
  });
}
```

---

## 5. Content Clustering & Site Architecture

### 5.1 Hub-and-Spoke Model

**Primary Hubs:**
1. Conditions Hub (`/conditions`)
2. Treatments Hub (`/treatments`)
3. Resources Hub (`/resources`)

**Secondary Hubs (Condition Categories):**
- Anxiety & Fear Disorders (`/conditions/anxiety-fear`)
- Mood & Depression (`/conditions/mood-depression`)
- Attention & Learning (`/conditions/attention-learning`)
- Trauma & Stress (`/conditions/trauma-stress`)
- Substance Use Disorders (`/conditions/substance-use-disorders`)
- (etc., 14 total category hubs)

**Tertiary Hubs (Treatment Categories):**
- Medications (`/treatments/medications`)
  - Antidepressants (`/treatments/medications/antidepressants`)
  - Antipsychotics (`/treatments/medications/antipsychotics`)
  - Anxiolytics (`/treatments/medications/anxiolytics`)
  - Stimulants (`/treatments/medications/stimulants`)
- Therapy (`/treatments/therapy`)
- Alternative Treatments (`/treatments/alternative`)
- Supplements (`/treatments/supplements`)
- Interventional (`/treatments/interventional`)
- Investigational (`/treatments/investigational`)

### 5.2 Category Hub Pages

**Purpose:**
- Overview of category
- Links to all entities in category
- SEO target for category keywords
- Navigation aid

**Template:**
```tsx
// app/conditions/anxiety-fear/page.tsx
export default async function AnxietyFearHub() {
  const conditions = await getConditionsByCategory('anxiety-fear');

  return (
    <>
      <h1>Anxiety & Fear Disorders</h1>
      <p>
        Anxiety disorders are the most common mental health conditions,
        affecting millions of people worldwide. Learn about different
        types of anxiety disorders, their symptoms, and evidence-based
        treatments.
      </p>

      <div class="condition-grid">
        {conditions.map(condition => (
          <ConditionCard key={condition.slug} condition={condition} />
        ))}
      </div>

      <section class="category-faq">
        <h2>Common Questions About Anxiety Disorders</h2>
        ...
      </section>

      <section class="category-treatments">
        <h2>Treatments for Anxiety Disorders</h2>
        <TreatmentGrid treatments={getAnxietyTreatments()} />
      </section>
    </>
  );
}
```

**Metadata:**
```typescript
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Anxiety & Fear Disorders: Types, Symptoms, Treatment | HeyPsych",
    description: "Explore anxiety disorders including GAD, panic disorder, social anxiety, phobias, and more. Learn about symptoms, causes, and evidence-based treatments.",
    // ... JSON-LD for category hub
  };
}
```

### 5.3 Cluster Relationships

**Example: GAD Cluster**

```
Central Hub: Generalized Anxiety Disorder
├─ Related Conditions
│  ├─ Panic Disorder
│  ├─ Social Anxiety Disorder
│  ├─ Major Depressive Disorder
│  └─ OCD
├─ Treatments
│  ├─ Medications
│  │  ├─ Escitalopram
│  │  ├─ Sertraline
│  │  ├─ Venlafaxine
│  │  └─ Buspirone
│  └─ Therapy
│     ├─ Cognitive Behavioral Therapy
│     ├─ Acceptance & Commitment Therapy
│     └─ Mindfulness-Based Therapy
├─ Assessments
│  └─ GAD-7 Screening Tool
├─ Resources
│  ├─ Managing Anxiety (article)
│  ├─ Anxiety Crisis Support
│  └─ Headspace (digital tool)
└─ Category Hub
   └─ Anxiety & Fear Disorders
```

**Implementation:**
```typescript
function buildContentCluster(condition: Condition): Cluster {
  return {
    center: condition,
    relatedConditions: findRelatedConditions(condition),
    treatments: extractTreatments(condition),
    assessments: findRelevantAssessments(condition),
    resources: findRelatedResources(condition),
    categoryHub: getCategoryHub(condition.metadata.category)
  };
}
```

### 5.4 Navigation Depth

**Optimize for 3-click rule:**
- Homepage → Category Hub → Entity (2 clicks)
- Homepage → Entity (1 click for top entities)
- Homepage → Search → Entity (2 clicks)

**Breadcrumb Paths:**
```
Home > Conditions > Anxiety > GAD (4 levels max)
Home > Treatments > Medications > Sertraline (4 levels)
Home > Resources > Assessments > GAD-7 (4 levels)
```

---

## 6. Sitemap & Indexing Strategy

### 6.1 Dynamic Sitemap Generation

**File:** `app/sitemap.ts`

```typescript
import { MetadataRoute } from 'next';
import { getAllConditions, getAllTreatments, getAllResources } from '@/lib/data/entity-service';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://heypsych.com';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0
    },
    {
      url: `${baseUrl}/conditions`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9
    },
    {
      url: `${baseUrl}/treatments`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9
    },
    {
      url: `${baseUrl}/resources`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9
    }
  ];

  // Conditions
  const conditions = await getAllConditions();
  const conditionPages: MetadataRoute.Sitemap = conditions.map(condition => ({
    url: `${baseUrl}/conditions/${condition.slug}`,
    lastModified: condition.updated_at || new Date(),
    changeFrequency: 'monthly',
    priority: 0.8
  }));

  // Treatments
  const treatments = await getAllTreatments();
  const treatmentPages: MetadataRoute.Sitemap = treatments.map(treatment => ({
    url: `${baseUrl}/treatments/${treatment.slug}`,
    lastModified: treatment.updated_at || new Date(),
    changeFrequency: 'monthly',
    priority: 0.7
  }));

  // Resources
  const resources = await getAllResources();
  const resourcePages: MetadataRoute.Sitemap = resources.map(resource => {
    const category = resource.metadata?.category;
    const path = category === 'assessments-screeners'
      ? `/resources/assessments-screeners/${resource.slug}`
      : `/resources/${resource.slug}`;

    return {
      url: `${baseUrl}${path}`,
      lastModified: resource.updated_at || new Date(),
      changeFrequency: 'weekly',
      priority: 0.9
    };
  });

  return [
    ...staticPages,
    ...conditionPages,
    ...treatmentPages,
    ...resourcePages
  ];
}
```

### 6.2 Priority Assignment

**Priority Hierarchy:**

| Content Type | Priority | Change Frequency | Rationale |
|--------------|----------|------------------|-----------|
| Homepage | 1.0 | Daily | Entry point |
| Category Hubs | 0.9 | Weekly | High-level navigation |
| Assessments | 0.9 | Weekly | High user value |
| Conditions | 0.8 | Monthly | Core content |
| Therapies | 0.75 | Monthly | Key treatments |
| Medications | 0.7 | Monthly | Clinical content |
| Resources | 0.7 | Weekly | Supporting content |
| Static Pages | 0.5 | Yearly | Low priority |

### 6.3 Multi-Sitemap Strategy

For 2,000+ pages, split into category sitemaps:

**File:** `app/sitemap-index.xml.ts`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://heypsych.com/sitemap-conditions.xml</loc>
    <lastmod>2025-11-18</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://heypsych.com/sitemap-treatments.xml</loc>
    <lastmod>2025-11-18</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://heypsych.com/sitemap-resources.xml</loc>
    <lastmod>2025-11-18</lastmod>
  </sitemap>
  <sitemap>
    <loc>https://heypsych.com/sitemap-static.xml</loc>
    <lastmod>2025-11-18</lastmod>
  </sitemap>
</sitemapindex>
```

### 6.4 Indexing Rules

**Include in Sitemap:**
- ✅ All condition pages
- ✅ All treatment pages
- ✅ All resource pages
- ✅ Category hub pages
- ✅ Main navigation pages

**Exclude from Sitemap:**
- ❌ /api/* (API routes)
- ❌ /debug (debug pages)
- ❌ /_next/* (Next.js internals)
- ❌ /psychiatry/* (separate team)
- ❌ Duplicate content
- ❌ Paginated archives (unless canonical)

### 6.5 Robots.txt Updates

**Current:** Already properly configured
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /debug
Disallow: /test-env
Disallow: /_next/

Sitemap: https://heypsych.com/sitemap.xml
```

**Add sitemap index (when implementing multi-sitemap):**
```
Sitemap: https://heypsych.com/sitemap-index.xml
```

---

## 7. Scalability Framework

### 7.1 Design Principles

1. **Zero Hardcoding** — All logic driven by data
2. **Automatic Adaptation** — New fields don't break system
3. **Performance at Scale** — Efficient with 5,000+ pages
4. **Maintainability** — Minimal code changes for content growth

### 7.2 Scalable Architecture Patterns

#### Metadata Generation

**Current Approach:** ❌ Manual metadata per page
**Scalable Approach:** ✅ Rule-based metadata factory

```typescript
// Single factory handles all entity types
class MetadataFactory {
  static generate(entity: Entity): Metadata {
    const generator = this.getGenerator(entity.type);
    return generator.generate(entity);
  }

  private static getGenerator(type: string): MetadataGenerator {
    switch(type) {
      case 'condition': return new ConditionMetadataGenerator();
      case 'medication': return new MedicationMetadataGenerator();
      case 'therapy': return new TherapyMetadataGenerator();
      default: return new DefaultMetadataGenerator();
    }
  }
}

// Add new entity type? Just add new generator class
class NewEntityTypeMetadataGenerator extends MetadataGenerator {
  generate(entity: Entity): Metadata {
    // Entity-specific logic
  }
}
```

#### Schema Generation

**Scalable Pattern:**
```typescript
// Schema builder with chainable methods
const schema = new SchemaBuilder()
  .addType('MedicalCondition')
  .addProperty('name', entity.name)
  .addPropertyIfExists('code', extractMedicalCodes(entity))
  .addPropertyIfExists('signOrSymptom', extractSymptoms(entity))
  .addPropertyIfExists('riskFactor', extractRiskFactors(entity))
  .build();
```

#### Link Generation

**Scalable Pattern:**
```typescript
// Registry-based link extractors
class LinkExtractorRegistry {
  private extractors: Map<string, LinkExtractor[]> = new Map();

  register(entityType: string, extractor: LinkExtractor) {
    if (!this.extractors.has(entityType)) {
      this.extractors.set(entityType, []);
    }
    this.extractors.get(entityType)!.push(extractor);
  }

  extract(entity: Entity): Link[] {
    const extractors = this.extractors.get(entity.type) || [];
    return extractors.flatMap(e => e.extract(entity));
  }
}

// Register extractors at startup
registry.register('condition', new TreatmentLinkExtractor());
registry.register('condition', new AssessmentLinkExtractor());
registry.register('condition', new RelatedConditionExtractor());
registry.register('medication', new IndicationLinkExtractor());
// ... etc.

// Extract all links for any entity
const links = registry.extract(entity);
```

### 7.3 Caching Strategy

**Multi-Level Caching:**

**Level 1: Build-time Static Generation**
```typescript
// Pre-generate top entities at build time
export async function generateStaticParams() {
  const topEntities = await getTopEntities(500); // Top 500
  return topEntities.map(e => ({ slug: e.slug }));
}
```

**Level 2: ISR (Incremental Static Regeneration)**
```typescript
// Revalidate pages every 24 hours
export const revalidate = 86400;
```

**Level 3: CDN Caching**
```typescript
// Set cache headers
export async function GET(request: Request) {
  return new Response(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}
```

**Level 4: In-Memory Caching**
```typescript
// Cache frequently accessed data
const cache = new Map<string, { data: any; expires: number }>();

function getCachedEntity(slug: string): Entity | null {
  const cached = cache.get(slug);
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  return null;
}
```

### 7.4 Performance Optimization

**For 5,000+ Pages:**

1. **Parallel Generation**
```typescript
// Generate metadata for all pages in parallel
const metadataPromises = entities.map(e =>
  generateMetadata(e)
);
const allMetadata = await Promise.all(metadataPromises);
```

2. **Lazy Loading**
```typescript
// Load heavy schemas only when needed
const schema = await import('./schemas/medical-condition');
```

3. **Database Indexing**
```sql
-- Index for fast slug lookups
CREATE INDEX idx_entities_slug ON entities(slug);
CREATE INDEX idx_entities_type_status ON entities(type, status);
CREATE INDEX idx_entities_category ON entities((data->>'category'));
```

4. **Query Optimization**
```typescript
// Select only needed fields
const entities = await supabase
  .from('entities')
  .select('slug, name, type, data->description')
  .eq('status', 'active');
```

### 7.5 Monitoring & Analytics

**Track Scalability Metrics:**

```typescript
// Monitor build times
console.time('metadata-generation');
await generateAllMetadata();
console.timeEnd('metadata-generation');

// Monitor page generation
const pageGenerationMetrics = {
  totalPages: 863,
  staticPages: 500,
  dynamicPages: 363,
  avgGenerationTime: '120ms',
  buildTime: '3.2 minutes'
};

// Alert if metrics degrade
if (pageGenerationMetrics.buildTime > threshold) {
  sendAlert('Build time exceeded threshold');
}
```

---

## 8. Implementation Checklist

### Phase 1: Foundation (Weeks 1-2)

**E-A-T Infrastructure:**
- [ ] Create author JSON schema
- [ ] Create medical reviewer JSON schema
- [ ] Create timestamp schema
- [ ] Add editorial fields to all entity types
- [ ] Build author profile pages (`/about/authors/{slug}`)
- [ ] Build medical review board page (`/about/medical-review-board`)
- [ ] Create editorial process page (`/about/editorial-process`)

**Metadata System:**
- [ ] Build `MetadataFactory` class
- [ ] Implement `ConditionMetadataGenerator`
- [ ] Implement `MedicationMetadataGenerator`
- [ ] Implement `TherapyMetadataGenerator`
- [ ] Implement `ResourceMetadataGenerator`
- [ ] Add `generateMetadata()` to all page types
- [ ] Convert condition pages to server components

### Phase 2: Structured Data (Weeks 3-4)

**Schema Generators:**
- [ ] Build `SchemaBuilder` utility class
- [ ] Implement `MedicalCondition` schema generator
- [ ] Implement `Drug` schema generator
- [ ] Implement `MedicalTherapy` schema generator
- [ ] Implement `MedicalWebPage` schema generator
- [ ] Implement `Person` schema generator (author/reviewer)
- [ ] Implement `BreadcrumbList` schema generator
- [ ] Implement `FAQPage` schema generator

**Schema Integration:**
- [ ] Add schema rendering component
- [ ] Inject schemas into all page templates
- [ ] Test with Google Rich Results Test
- [ ] Fix validation errors

### Phase 3: Internal Linking (Weeks 5-6)

**Link Extraction:**
- [ ] Build `LinkExtractorRegistry`
- [ ] Implement `TreatmentLinkExtractor` (conditions → treatments)
- [ ] Implement `AssessmentLinkExtractor` (conditions → assessments)
- [ ] Implement `RelatedConditionExtractor` (conditions → conditions)
- [ ] Implement `IndicationLinkExtractor` (treatments → conditions)
- [ ] Implement `RelatedTreatmentExtractor` (treatments → treatments)

**Link Rendering:**
- [ ] Build link rendering components
- [ ] Add "Related Conditions" section to condition pages
- [ ] Add "Treatment Options" section to condition pages
- [ ] Add "Treats These Conditions" section to treatment pages
- [ ] Add "Related Treatments" section to treatment pages
- [ ] Add "Screening Tools" section to condition pages
- [ ] Implement sidebar "Related Articles" component
- [ ] Build comprehensive footer with category links

**Link Quality:**
- [ ] Implement bidirectional link verification
- [ ] Add link deduplication
- [ ] Implement anchor text variation
- [ ] Test link density (target: 50+ per page)

### Phase 4: Content Clustering (Weeks 7-8)

**Hub Pages:**
- [ ] Create condition category hub pages (14 hubs)
- [ ] Create treatment category hub pages (6 hubs)
- [ ] Create resource category hub pages (4 hubs)
- [ ] Add metadata to all hub pages
- [ ] Add schemas to all hub pages
- [ ] Build category grid components

**Navigation:**
- [ ] Implement breadcrumb component
- [ ] Add breadcrumbs to all pages
- [ ] Update header navigation with category dropdowns
- [ ] Build sitemap links in footer

### Phase 5: Technical SEO (Weeks 9-10)

**Sitemap:**
- [ ] Implement dynamic sitemap generation (`app/sitemap.ts`)
- [ ] Test sitemap generation
- [ ] Submit to Google Search Console
- [ ] Implement multi-sitemap strategy (if >1000 pages)

**Page Elements:**
- [ ] Add table of contents to condition pages
- [ ] Add crisis support banner to all mental health pages
- [ ] Add medical disclaimer to all clinical pages
- [ ] Add references section to condition/treatment pages
- [ ] Implement FAQ sections (auto-generate 6-10 per page)

**Performance:**
- [ ] Audit Core Web Vitals
- [ ] Optimize image loading
- [ ] Implement proper caching headers
- [ ] Test build performance with full dataset

### Phase 6: Quality Assurance (Week 11)

**Testing:**
- [ ] Google Rich Results Test (all page types)
- [ ] Schema Markup Validator
- [ ] Lighthouse SEO audit (score >95)
- [ ] Mobile usability test
- [ ] Accessibility audit (WCAG AA)
- [ ] Internal link checker (broken links)
- [ ] Metadata completeness check (100% coverage)

**Validation:**
- [ ] Review 10 condition pages manually
- [ ] Review 10 treatment pages manually
- [ ] Review 5 resource pages manually
- [ ] Verify E-A-T signals displayed correctly
- [ ] Verify schemas render correctly
- [ ] Verify links work correctly
- [ ] Check mobile rendering

### Phase 7: Launch & Monitor (Week 12)

**Pre-Launch:**
- [ ] Final QA review
- [ ] Stakeholder approval
- [ ] Staging deployment
- [ ] Production deployment

**Post-Launch:**
- [ ] Submit updated sitemap to Google
- [ ] Monitor Search Console for errors
- [ ] Track indexing progress
- [ ] Monitor rankings for key terms
- [ ] Track engagement metrics

---

## 9. Success Metrics & KPIs

### Technical SEO Metrics

**Immediate (Month 1):**
- [ ] 100% metadata coverage (863/863 pages)
- [ ] 100% JSON-LD coverage (863/863 pages)
- [ ] 0 schema validation errors
- [ ] 863 pages in sitemap
- [ ] Lighthouse SEO score >95

**Short-term (Months 2-3):**
- [ ] 90%+ indexed pages
- [ ] 50+ avg internal links per page
- [ ] 100+ rich results in SERP
- [ ] 20+ featured snippets

**Long-term (Months 4-6):**
- [ ] Top 10 rankings for 100+ keywords
- [ ] 50+ featured snippets
- [ ] 200+ rich results
- [ ] 95%+ indexed pages

### User Engagement Metrics

**Target Improvements (vs. baseline):**
- [ ] +50% pageviews per session
- [ ] +40% avg session duration
- [ ] +60% pages per session
- [ ] -30% bounce rate
- [ ] +35% return visitor rate

### Business Impact Metrics

- [ ] +100% organic traffic
- [ ] +150% keyword rankings (top 10)
- [ ] +200% impressions in Search Console
- [ ] +10 points domain authority

---

## 10. Maintenance Plan

### Ongoing Content Updates

**Quarterly Reviews:**
- Medical review of all clinical content
- Update treatment guidelines per latest research
- Refresh statistics and prevalence data
- Review and update references

**Annual Reviews:**
- Full editorial review of all pages
- Update all timestamps
- Refresh metadata based on search trends
- Review and optimize internal linking

### Schema Maintenance

**Monthly:**
- Check for schema validation errors
- Review Google Search Console structured data report
- Fix any rich result warnings

**Quarterly:**
- Review schema.org updates
- Evaluate new schema types for implementation
- Optimize existing schemas based on performance

### Link Maintenance

**Monthly:**
- Run broken link checker
- Fix broken internal links
- Review link density metrics
- Add links to new content

**Quarterly:**
- Review bidirectional linking compliance
- Optimize anchor text variation
- Identify linking gaps

### Performance Monitoring

**Weekly:**
- Monitor build times
- Check page load speeds
- Review Core Web Vitals

**Monthly:**
- Full Lighthouse audit
- Review caching effectiveness
- Optimize slow pages

---

## Appendix: Code Templates

### A. Metadata Generator Template

```typescript
// lib/seo/metadata-factory.ts
import { Metadata } from 'next';
import { Entity } from '@/types';

export abstract class MetadataGenerator {
  abstract generate(entity: Entity): Promise<Metadata>;

  protected truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  protected generateCanonical(entity: Entity): string {
    return `https://heypsych.com${this.getPath(entity)}`;
  }

  protected abstract getPath(entity: Entity): string;
}

export class ConditionMetadataGenerator extends MetadataGenerator {
  async generate(entity: Entity): Promise<Metadata> {
    const title = this.generateTitle(entity);
    const description = this.generateDescription(entity);
    const canonical = this.generateCanonical(entity);
    const keywords = this.extractKeywords(entity);

    return {
      title,
      description,
      keywords: keywords.join(', '),
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        type: 'article',
        siteName: 'HeyPsych'
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description
      }
    };
  }

  private generateTitle(entity: Entity): string {
    if (entity.seo?.title) return entity.seo.title;
    return `${entity.name}: Symptoms, Causes, Treatment & Support | HeyPsych`;
  }

  private generateDescription(entity: Entity): string {
    if (entity.seo?.description) return entity.seo.description;
    const desc = `Learn about ${entity.name} symptoms, causes, risk factors, and evidence-based treatments. Discover when to seek help and how to manage ${entity.name} effectively.`;
    return this.truncate(desc, 160);
  }

  private extractKeywords(entity: Entity): string[] {
    const keywords = new Set<string>();
    keywords.add(entity.name);
    keywords.add(`${entity.name} symptoms`);
    keywords.add(`${entity.name} treatment`);
    keywords.add(`${entity.name} causes`);
    entity.tags?.forEach(tag => keywords.add(tag));
    entity.seo?.keywords?.forEach(kw => keywords.add(kw));
    return Array.from(keywords).slice(0, 15);
  }

  protected getPath(entity: Entity): string {
    return `/conditions/${entity.slug}`;
  }
}

// Usage in page
import { MetadataFactory } from '@/lib/seo/metadata-factory';

export async function generateMetadata({ params }): Promise<Metadata> {
  const entity = await getEntity(params.slug);
  return MetadataFactory.generate(entity);
}
```

### B. Schema Generator Template

```typescript
// lib/seo/schema-factory.ts

export class SchemaFactory {
  static generateAll(entity: Entity): object[] {
    const schemas: object[] = [];

    // Primary schema
    schemas.push(this.generatePrimarySchema(entity));

    // MedicalWebPage
    schemas.push(this.generateMedicalWebPageSchema(entity));

    // BreadcrumbList
    schemas.push(this.generateBreadcrumbSchema(entity));

    // Person schemas (author + reviewer)
    if (entity.editorial?.author) {
      schemas.push(this.generateAuthorSchema(entity.editorial.author));
    }
    if (entity.editorial?.medicalReviewer) {
      schemas.push(this.generateReviewerSchema(entity.editorial.medicalReviewer));
    }

    // FAQPage (if FAQs exist)
    if (entity.faqs?.length) {
      schemas.push(this.generateFAQSchema(entity.faqs));
    }

    return schemas;
  }

  private static generatePrimarySchema(entity: Entity): object {
    switch(entity.type) {
      case 'condition':
        return this.generateMedicalConditionSchema(entity);
      case 'medication':
        return this.generateDrugSchema(entity);
      case 'therapy':
        return this.generateMedicalTherapySchema(entity);
      default:
        return this.generateArticleSchema(entity);
    }
  }

  private static generateMedicalConditionSchema(entity: Entity): object {
    return {
      "@context": "https://schema.org",
      "@type": "MedicalCondition",
      "@id": `https://heypsych.com/conditions/${entity.slug}#condition`,
      "name": entity.name,
      "alternateName": this.extractAlternateNames(entity),
      "code": this.extractMedicalCodes(entity),
      "description": entity.content?.description,
      "signOrSymptom": entity.content?.symptoms?.core?.map(s => ({
        "@type": "MedicalSymptom",
        "name": this.cleanLinkSyntax(s)
      })) || [],
      "riskFactor": this.extractRiskFactors(entity),
      "possibleTreatment": this.extractPossibleTreatments(entity),
      "associatedAnatomy": this.extractBrainRegions(entity),
      "epidemiology": entity.content?.prevalence,
      "typicalTest": this.extractAssessments(entity)
    };
  }

  // ... additional schema methods
}

// Usage in page component
export default async function ConditionPage({ params }) {
  const entity = await getEntity(params.slug);
  const schemas = SchemaFactory.generateAll(entity);

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      {/* Page content */}
    </>
  );
}
```

### C. Link Extractor Template

```typescript
// lib/seo/link-extractor.ts

export interface Link {
  text: string;
  url: string;
  context: string;
}

export abstract class LinkExtractor {
  abstract extract(entity: Entity): Link[];

  protected cleanLinkSyntax(text: string): string {
    return text.replace(/\{link:[^:]+:([^}]+)\}/g, '$1');
  }

  protected findEntityByName(name: string, type: string): string | null {
    // Fuzzy match against entity database
    return EntityMatcher.findSlug(name, type);
  }
}

export class TreatmentLinkExtractor extends LinkExtractor {
  extract(entity: Entity): Link[] {
    if (entity.type !== 'condition') return [];

    const links: Link[] = [];
    const approaches = entity.content?.treatment_approaches;

    // Extract medication links
    approaches?.medications?.forEach((med: string) => {
      const slug = this.findEntityByName(
        this.cleanLinkSyntax(med),
        'medication'
      );
      if (slug) {
        links.push({
          text: this.cleanLinkSyntax(med),
          url: `/treatments/${slug}`,
          context: 'treatment_approaches.medications'
        });
      }
    });

    // Extract psychotherapy links
    approaches?.psychotherapy?.forEach((therapy: string) => {
      const slug = this.findEntityByName(
        this.cleanLinkSyntax(therapy),
        'therapy'
      );
      if (slug) {
        links.push({
          text: this.cleanLinkSyntax(therapy),
          url: `/treatments/${slug}`,
          context: 'treatment_approaches.psychotherapy'
        });
      }
    });

    return links;
  }
}

// Registry
export class LinkExtractorRegistry {
  private extractors = new Map<string, LinkExtractor[]>();

  register(entityType: string, extractor: LinkExtractor) {
    if (!this.extractors.has(entityType)) {
      this.extractors.set(entityType, []);
    }
    this.extractors.get(entityType)!.push(extractor);
  }

  extractAll(entity: Entity): Link[] {
    const extractors = this.extractors.get(entity.type) || [];
    return extractors.flatMap(e => e.extract(entity));
  }
}

// Initialize
const registry = new LinkExtractorRegistry();
registry.register('condition', new TreatmentLinkExtractor());
registry.register('condition', new AssessmentLinkExtractor());
registry.register('condition', new RelatedConditionExtractor());
```

---

**End of Phase 2 Strategic Architecture Plan**

**Next Steps:**
1. Review and approve strategic plan
2. Clarify any implementation questions
3. Begin Phase 3: Implementation

---

**Document Version:** 1.0
**Last Updated:** November 18, 2025
**Ready for Implementation:** ✅
