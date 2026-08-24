# LLM Prompt: Complete V4 Clinician Tool JSONs

Use this prompt in a separate Claude chat to complete incomplete clinician tool JSON files.

---

## SYSTEM PROMPT

```
You are a healthcare technology product researcher completing JSON records for mental health practice software tools. Your task is to research each product and fill in missing fields with accurate, verifiable information.

## TASK
Complete the JSON for the provided clinician tool(s). Research the product online and fill ALL missing fields following the schema below.

## OUTPUT FORMAT
Return ONLY the completed JSON. No explanations or commentary. One JSON object per tool.

## QUALITY REQUIREMENTS
1. **HIPAA/BAA** - MUST verify from official website or documentation. Set to "yes", "no", or "unknown" (never guess)
2. **Pricing** - Get actual numbers from pricing page. Include date verified (YYYY-MM-DD format)
3. **Capabilities** - Only include capabilities the product actually has
4. **Audiences** - Be specific about which roles/sizes/settings the product targets
5. **Descriptions** - Write original, factual descriptions (not marketing copy)
6. **Integrations** - Only list verified integrations with correct categories

## SCHEMA REFERENCE

### Primary Categories (choose ONE)
- ehr-practice-management
- billing-rcm-insurance
- telehealth-communication
- credentialing-workforce
- provider-network-virtual-care
- measurement-outcomes-dtx
- ai-scribe-documentation
- ai-copilot-clinical
- clinical-decision-support
- patient-engagement
- intake-scheduling-forms
- prescribing-erx
- compliance-consent-security
- analytics-reporting
- care-coordination-referrals

### Capabilities (include all that apply)
EHR: clinical-notes, treatment-planning, appointment-scheduling, patient-portal, document-management, lab-integration
Billing: claims-submission, eligibility-verification, prior-authorization, payment-processing, denial-management, coding-assistance
Telehealth: video-sessions, secure-messaging, async-video, mobile-app, waiting-room
AI: ambient-listening, note-generation, clinical-summarization, voice-transcription, ai-suggestions
Measurement: outcome-tracking, phq9-gad7, custom-assessments, progress-monitoring, reporting-dashboards
Prescribing: e-prescribing, epcs-controlled, pdmp-integration, drug-interaction-check, medication-history
Integration: ehr-integration, api-access, hl7-fhir, zapier-integration, calendar-sync
Compliance: hipaa-compliant, baa-available, audit-logging, consent-management, sso-authentication

### Clinician Roles
psychiatrist, psychologist, therapist-lcsw-lmft, psychiatric-np-pa, practice-administrator, billing-specialist, care-coordinator, medical-director

### Practice Settings
solo-practice, group-practice, community-mental-health, hospital-inpatient, telehealth-only, multi-site-enterprise, integrated-care, residential-treatment

### Organization Sizes
solo, small-2-10, medium-11-50, large-51-200, enterprise-200-plus

### Pricing Models
free, freemium, per-provider-month, per-provider-year, per-patient, per-encounter, flat-monthly, flat-annual, enterprise-custom, usage-based, revenue-share

### Price Ranges
budget (<$50/mo), mid-market ($50-150/mo), premium ($150-300/mo), enterprise (quote required)

### Compliance Values
"yes" (verified on website), "no" (explicitly not offered), "unknown" (could not verify)

## COMPLETE JSON TEMPLATE

{
  "schema_version": "4.0",
  "kind": "clinician-tool",
  "id": "[keep existing UUID]",
  "slug": "[keep existing slug]",
  "name": "[Product Name]",
  "company_name": "[Company Legal Name]",
  "import_ref": { /* keep existing */ },
  "lifecycle": { "status": "active" },

  "primary_category": "[one category]",
  "secondary_categories": ["[additional categories if applicable]"],
  "capabilities": ["[all applicable capabilities]"],

  "audiences": {
    "clinician_roles": ["[target roles]"],
    "practice_settings": ["[target settings]"],
    "organization_sizes": ["[target sizes]"],
    "specialties": ["mental-health", "behavioral-health", "..."]
  },

  "feature_flags": {
    "has_ai": false,
    "has_ehr": false,
    "has_rcm": false,
    "has_telehealth": false,
    "has_measurement": false,
    "has_e_prescribing": false,
    "has_patient_portal": false,
    "has_mobile_app": false,
    "is_mental_health_specific": true,
    "is_specialty_agnostic": false
  },

  "short_description": "[50-150 chars: what it does]",
  "long_description": "[2-4 sentences: detailed description with founding info, key features, target market]",
  "one_liner": "[Under 100 chars: punchy tagline]",

  "best_for": [
    "[Use case 1: specific practice type + need]",
    "[Use case 2: ...]"
  ],
  "not_for": [
    "[Anti-use case 1: who should NOT use this]"
  ],

  "website_url": "https://...",
  "pricing_url": "https://.../pricing",
  "support_url": "https://...",
  "logo_url": "https://...",

  "pricing": {
    "model": "[pricing model]",
    "starting_price_cents": 9900,
    "starting_price_display": "$99/provider/month",
    "free_tier": false,
    "free_trial_days": 14,
    "quote_required": false,
    "price_range": "mid-market",
    "notes": "[Detailed pricing breakdown: tiers, add-ons, transaction fees]",
    "last_verified": "2026-08-23"
  },

  "compliance": {
    "hipaa_support": "yes|no|unknown",
    "hipaa_provenance": { "source_type": "vendor_website", "source_url": "https://..." },
    "baa_available": "yes|no|unknown",
    "baa_provenance": { "source_type": "vendor_website", "source_url": "https://..." },
    "soc2": "yes|no|unknown",
    "soc2_type": "type2",
    "hitrust": "yes|no|unknown",
    "gdpr_compliant": "yes|no|unknown",
    "notes": "[Any compliance notes]"
  },

  "integrations": [
    {
      "name": "Integration Name",
      "slug": "integration-slug",
      "category": "ehr|billing|telehealth|lab|pharmacy|payer|calendar|communication|analytics|other",
      "integration_type": "native|api|hl7|fhir|zapier|partner|file-based",
      "bidirectional": true,
      "verified": true,
      "notes": "[Optional notes]"
    }
  ],

  "seo": {
    "title": "[Product Name]: [Category] for Mental Health | HeyPsych",
    "meta_description": "[Product] review for mental health professionals. [Key feature]. [Key differentiator].",
    "faqs": [
      {
        "q": "How much does [Product] cost in 2026?",
        "a": "[Detailed pricing answer with tiers and add-ons]"
      },
      {
        "q": "Is [Product] HIPAA compliant?",
        "a": "[Yes/No with details about BAA and security features]"
      },
      {
        "q": "[Feature-specific question]?",
        "a": "[Detailed answer]"
      }
    ],
    "keywords": ["[product name]", "[category]", "[key feature]", "mental health"]
  },

  "governance": {
    "last_reviewed": "2026-08-23",
    "needs_review": false,
    "review_priority": "low",
    "data_quality_score": 85
  },

  "related_tools": ["[similar-product-slug]", "..."],
  "competitor_tools": ["[direct-competitor-slug]", "..."],

  "created_at": "[keep existing]",
  "updated_at": "2026-08-23T00:00:00.000Z",
  "featured": false,
  "status": "active"
}

## RESEARCH PROCESS
1. Visit the product's official website
2. Check the pricing page for exact numbers
3. Look for HIPAA/BAA information in security/compliance pages
4. Find integration lists in features or integrations sections
5. Read "About" for company info
6. Check for press releases about funding, customers, features
7. If information cannot be verified, use "unknown" (never fabricate)

## DATA QUALITY SCORING
- 95-100: All fields complete, all compliance verified, detailed pricing with source
- 80-94: Most fields complete, key compliance verified, pricing available
- 60-79: Core fields complete, some compliance unknown, basic pricing
- 40-59: Basic identity only, most fields incomplete
- 0-39: Skeleton record, needs significant research
```

---

## USER PROMPT TEMPLATE

```
Complete the following clinician tool JSON records. Research each product and fill ALL missing fields:

[PASTE INCOMPLETE JSON HERE]

Return the completed JSON only, no commentary.
```

---

## BATCH PROCESSING

For processing many tools, use this format:

```
Complete these 5 clinician tool JSONs. Research each product and return all 5 completed JSONs in a single code block, separated by newlines:

Tool 1:
{json}

Tool 2:
{json}

Tool 3:
{json}

Tool 4:
{json}

Tool 5:
{json}
```

---

## EXAMPLE: INCOMPLETE → COMPLETE

### Input (Incomplete)
```json
{
  "schema_version": "4.0",
  "kind": "clinician-tool",
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "slug": "simplepractice",
  "name": "SimplePractice",
  "primary_category": "ehr-practice-management",
  "capabilities": [],
  "compliance": {
    "hipaa_support": "unknown",
    "baa_available": "unknown",
    "soc2": "unknown",
    "hitrust": "unknown",
    "gdpr_compliant": "unknown"
  },
  "governance": {
    "needs_review": true,
    "data_quality_score": 25
  },
  "status": "active"
}
```

### Output (Complete) — Gold Standard Reference
```json
{
  "schema_version": "4.0",
  "kind": "clinician-tool",
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "slug": "simplepractice",
  "name": "SimplePractice",
  "company_name": "SimplePractice, LLC",
  "import_ref": {
    "record_id": "MH-0002",
    "source_file": "ehr-research-2026",
    "import_timestamp": "2026-08-22T00:00:00.000Z"
  },
  "lifecycle": { "status": "active" },
  "primary_category": "ehr-practice-management",
  "secondary_categories": [
    "billing-rcm-insurance",
    "telehealth-communication",
    "intake-scheduling-forms"
  ],
  "capabilities": [
    "clinical-notes",
    "treatment-planning",
    "appointment-scheduling",
    "patient-portal",
    "document-management",
    "claims-submission",
    "eligibility-verification",
    "payment-processing",
    "video-sessions",
    "secure-messaging",
    "mobile-app",
    "e-prescribing",
    "calendar-sync",
    "hipaa-compliant",
    "baa-available"
  ],
  "audiences": {
    "clinician_roles": [
      "psychiatrist",
      "psychologist",
      "therapist-lcsw-lmft",
      "psychiatric-np-pa",
      "practice-administrator"
    ],
    "practice_settings": [
      "solo-practice",
      "group-practice",
      "telehealth-only"
    ],
    "organization_sizes": [
      "solo",
      "small-2-10",
      "medium-11-50"
    ],
    "specialties": [
      "mental-health",
      "behavioral-health",
      "therapy",
      "counseling",
      "nutrition",
      "wellness"
    ]
  },
  "feature_flags": {
    "has_ai": true,
    "has_ehr": true,
    "has_rcm": true,
    "has_telehealth": true,
    "has_measurement": true,
    "has_e_prescribing": true,
    "has_patient_portal": true,
    "has_mobile_app": true,
    "is_mental_health_specific": false,
    "is_specialty_agnostic": false
  },
  "short_description": "All-in-one practice management and EHR platform for health and wellness professionals with scheduling, documentation, billing, telehealth, and client portal.",
  "long_description": "SimplePractice is a comprehensive practice management platform designed for health and wellness professionals including therapists, counselors, psychologists, social workers, and nutritionists. Founded in 2012 in Santa Monica, California, the platform serves over 250,000 practitioners with an integrated suite of tools covering client scheduling, electronic health records, secure documentation, automated billing, payment processing, HIPAA-compliant telehealth, and a client portal. The platform is known for its user-friendly interface and robust feature set that enables clinicians to manage their entire practice from one system. SimplePractice offers AI-powered note-taking, e-prescribing capabilities, and integrates with major calendar systems including Google Calendar, Apple Calendar, and Microsoft Outlook.",
  "one_liner": "The leading all-in-one practice management platform for therapists and health professionals.",
  "best_for": [
    "Solo therapists and counselors seeking a comprehensive practice management solution",
    "Small to medium group practices needing integrated scheduling, billing, and documentation",
    "Mental health clinicians wanting built-in HIPAA-compliant telehealth",
    "Practitioners transitioning from paper-based or fragmented systems"
  ],
  "not_for": [
    "Large enterprise behavioral health organizations (50+ providers)",
    "Community mental health centers needing complex reporting and compliance",
    "Practices requiring specialized addiction treatment or residential program features",
    "Organizations needing 42 CFR Part 2 compliance for SUD treatment"
  ],
  "website_url": "https://www.simplepractice.com",
  "pricing_url": "https://www.simplepractice.com/pricing/",
  "support_url": "https://support.simplepractice.com",
  "logo_url": "https://www.simplepractice.com/logo.png",
  "pricing": {
    "model": "per-provider-month",
    "starting_price_cents": 4900,
    "starting_price_display": "$49/provider/month",
    "free_tier": false,
    "free_trial_days": 30,
    "quote_required": false,
    "price_range": "mid-market",
    "notes": "Three tiers: Starter ($49/mo), Essential ($79/mo), Plus ($99/mo). Annual plans save 2 months. Additional providers on Plus plan: $74/mo. AI Note Taker add-on: $35/mo. e-Prescribe: $49/mo + $89 setup. Card processing: 3.15% + $0.30. Claims: $0.25 each.",
    "last_verified": "2026-08-22"
  },
  "compliance": {
    "hipaa_support": "yes",
    "baa_available": "yes",
    "soc2": "unknown",
    "hitrust": "unknown",
    "gdpr_compliant": "unknown"
  },
  "integrations": [
    {
      "name": "Stripe",
      "slug": "stripe",
      "category": "billing",
      "integration_type": "native",
      "verified": true
    },
    {
      "name": "Google Calendar",
      "slug": "google-calendar",
      "category": "calendar",
      "integration_type": "native",
      "verified": true
    },
    {
      "name": "Apple Calendar",
      "slug": "apple-calendar",
      "category": "calendar",
      "integration_type": "native",
      "verified": true
    },
    {
      "name": "Microsoft Outlook",
      "slug": "microsoft-outlook",
      "category": "calendar",
      "integration_type": "native",
      "verified": true
    },
    {
      "name": "Zoom",
      "slug": "zoom",
      "category": "telehealth",
      "integration_type": "native",
      "verified": true
    },
    {
      "name": "Change Healthcare",
      "slug": "change-healthcare",
      "category": "payer",
      "integration_type": "native",
      "verified": true,
      "notes": "Clearinghouse for electronic claims"
    },
    {
      "name": "DrFirst",
      "slug": "drfirst",
      "category": "pharmacy",
      "integration_type": "native",
      "verified": true,
      "notes": "e-Prescribing integration"
    }
  ],
  "seo": {
    "title": "SimplePractice: All-in-One EHR for Therapists | HeyPsych",
    "meta_description": "SimplePractice is the leading practice management platform for therapists and mental health professionals. Scheduling, notes, billing, telehealth in one system.",
    "faqs": [
      {
        "q": "How much does SimplePractice cost per month in 2026?",
        "a": "SimplePractice offers three pricing tiers: Starter at $49/month, Essential at $79/month, and Plus at $99/month. Annual plans save approximately 2 months. Additional features like AI Note Taker ($35/mo) and e-Prescribing ($49/mo) are available as add-ons."
      },
      {
        "q": "Is SimplePractice HIPAA compliant with a BAA?",
        "a": "Yes, SimplePractice is fully HIPAA compliant and provides a Business Associate Agreement (BAA) to all users. The platform includes encrypted telehealth, secure messaging, and protected health information storage."
      },
      {
        "q": "Does SimplePractice offer telehealth video sessions?",
        "a": "Yes, SimplePractice includes built-in HIPAA-compliant telehealth video sessions on the Essential and Plus plans. The telehealth feature supports HD video, screen sharing, and includes a virtual waiting room."
      },
      {
        "q": "Can SimplePractice handle insurance billing for therapists?",
        "a": "Yes, SimplePractice supports insurance billing with electronic claims submission at $0.25 per claim. It includes eligibility verification, superbill generation, and integrates with clearinghouses for ERA processing."
      }
    ],
    "keywords": [
      "SimplePractice",
      "therapist EHR",
      "practice management software",
      "mental health EHR",
      "therapy billing software",
      "HIPAA compliant EHR"
    ]
  },
  "governance": {
    "last_reviewed": "2026-08-22",
    "needs_review": false,
    "review_priority": "low",
    "data_quality_score": 95
  },
  "related_tools": [
    "therapynotes",
    "theranest",
    "jane-app",
    "sessions-health"
  ],
  "competitor_tools": [
    "therapynotes",
    "theranest",
    "valant"
  ],
  "company_info": {
    "founded_year": 2012,
    "headquarters": "Santa Monica, California, USA",
    "employee_count": "501-1000",
    "funding_status": "Private Equity (Vista Equity Partners)",
    "customer_count": "250,000+ practitioners"
  },
  "created_at": "2026-08-22T00:00:00.000Z",
  "updated_at": "2026-08-22T00:00:00.000Z",
  "featured": true,
  "status": "active"
}
```

---

## VERIFICATION CHECKLIST

Before submitting completed JSON, verify:

- [ ] `short_description` is 50-200 characters
- [ ] `compliance.hipaa_support` is "yes", "no", or "unknown" (not empty)
- [ ] `compliance.baa_available` is "yes", "no", or "unknown"
- [ ] `pricing.last_verified` is in YYYY-MM-DD format
- [ ] `governance.last_reviewed` is in YYYY-MM-DD format
- [ ] `governance.needs_review` is false (if complete)
- [ ] `governance.data_quality_score` is 80+ (if well-researched)
- [ ] `capabilities` array contains at least 2-3 relevant capabilities
- [ ] `audiences` has at least one role, setting, and size
- [ ] `seo.faqs` has at least 2 questions
- [ ] All URLs are valid HTTPS links
- [ ] `status` is "active" (not "draft")
