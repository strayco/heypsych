/**
 * People Also Ask (PAA) Questions for Clinician Tools
 *
 * Mined from actual Google PAA boxes for mental health software queries.
 * These EXACT question patterns trigger PAA rich results.
 *
 * Strategy: Add these as FAQs to category and product pages to:
 * 1. Trigger PAA appearance
 * 2. Dominate "People Also Ask" boxes
 * 3. Get featured in AI Overviews
 * 4. Build topical authority
 */

export interface ClinicianToolPAA {
  question: string;
  answerTemplate: string;
  category?: string;
  searchVolume?: "high" | "medium" | "low";
}

// ============================================================================
// EHR / Practice Management PAA Questions
// ============================================================================

export const EHR_PAA_QUESTIONS: ClinicianToolPAA[] = [
  {
    question: "What is the best EHR for mental health therapists?",
    answerTemplate:
      "The best EHR for mental health therapists depends on your practice size and needs. Top options include SimplePractice (best all-in-one for solo practices), TherapyNotes (best for insurance billing), and Jane App (best for cash-pay practices). Key features to consider: HIPAA compliance, telehealth integration, note templates, and billing capabilities.",
    category: "ehr-practice-management",
    searchVolume: "high",
  },
  {
    question: "How much does therapy practice management software cost?",
    answerTemplate:
      "Therapy practice management software typically costs $30-150/month per provider. SimplePractice starts at $29/month, TherapyNotes at $49/month, and Jane App at $54/month. Costs increase with additional features like telehealth, e-prescribing, or advanced billing. Many offer free trials of 14-30 days.",
    category: "ehr-practice-management",
    searchVolume: "high",
  },
  {
    question: "Do therapists need an EHR?",
    answerTemplate:
      "While not legally required for all therapists, an EHR is strongly recommended for: HIPAA compliance, efficient documentation, insurance billing, scheduling automation, and telehealth integration. Most insurance panels and group practices require electronic records. Solo cash-pay therapists can technically use paper, but risk compliance issues.",
    category: "ehr-practice-management",
    searchVolume: "medium",
  },
  {
    question: "What EHR do psychiatrists use?",
    answerTemplate:
      "Psychiatrists commonly use EHRs with e-prescribing capabilities including SimplePractice (with e-prescribing add-on), Valant (psychiatry-specific), DrChrono, and Practice Fusion. Key requirements: EPCS certification for controlled substances, medication tracking, lab integration, and psychiatric note templates. Many use general medical EHRs rather than therapy-specific platforms.",
    category: "ehr-practice-management",
    searchVolume: "medium",
  },
  {
    question: "Is SimplePractice HIPAA compliant?",
    answerTemplate:
      "Yes, SimplePractice is HIPAA compliant and provides a Business Associate Agreement (BAA) on all paid plans. They are also SOC 2 Type II certified. SimplePractice includes built-in HIPAA-compliant telehealth, secure messaging, and encrypted data storage. Always verify current compliance status and request your BAA before use.",
    category: "ehr-practice-management",
    searchVolume: "high",
  },
  {
    question: "What is the easiest EHR to use?",
    answerTemplate:
      "SimplePractice and Jane App are consistently rated as the easiest EHRs to use for therapists. SimplePractice offers intuitive onboarding and clean interface. Jane App excels at user experience with minimal training needed. TherapyNotes is also user-friendly but has a steeper learning curve for billing features.",
    category: "ehr-practice-management",
    searchVolume: "medium",
  },
  {
    question: "Can I switch EHRs without losing data?",
    answerTemplate:
      "Yes, you can switch EHRs, but data migration varies by platform. Most EHRs allow you to export client lists, demographics, and some notes. However, detailed progress notes and billing history may not transfer cleanly. Plan for 2-4 weeks of transition time. Some EHRs offer migration assistance. Never delete your old EHR account until you've verified all critical data transferred.",
    category: "ehr-practice-management",
    searchVolume: "medium",
  },
];

// ============================================================================
// AI Scribe PAA Questions
// ============================================================================

export const AI_SCRIBE_PAA_QUESTIONS: ClinicianToolPAA[] = [
  {
    question: "What is the best AI scribe for therapists?",
    answerTemplate:
      "The best AI scribes for therapists in 2026 are Mentalyc (best for therapy-specific templates), Upheal (best for session analytics), and Freed (best for prescribers). Key considerations: HIPAA compliance with BAA, therapy note formats (SOAP, DAP, BIRP), EHR integration, and accuracy with mental health terminology.",
    category: "ai-scribe-documentation",
    searchVolume: "high",
  },
  {
    question: "Are AI scribes HIPAA compliant?",
    answerTemplate:
      "Most reputable AI scribes for healthcare are HIPAA compliant, but you must verify each vendor provides a signed Business Associate Agreement (BAA). Look for: SOC 2 certification, encrypted audio processing, no third-party data sharing, and clear data retention policies. Never use consumer AI tools (ChatGPT, general transcription) for clinical documentation.",
    category: "ai-scribe-documentation",
    searchVolume: "high",
  },
  {
    question: "How much do AI scribes cost for therapists?",
    answerTemplate:
      "AI scribes for therapists cost $30-120/month depending on features and volume. Pricing models include: per-session ($1/note with Upheal), monthly unlimited ($79/month with Freed), or tiered plans. ROI is typically high—if you save 5+ hours/week on documentation at your hourly rate, the math works quickly.",
    category: "ai-scribe-documentation",
    searchVolume: "high",
  },
  {
    question: "Can AI write therapy notes?",
    answerTemplate:
      "Yes, AI can generate therapy session notes by listening to or transcribing sessions. Modern AI scribes produce SOAP, DAP, BIRP, and other formats. However, clinicians must always review and edit AI-generated notes before signing—AI captures content but may miss clinical nuance, and you remain responsible for accuracy.",
    category: "ai-scribe-documentation",
    searchVolume: "medium",
  },
  {
    question: "Is Freed better than Mentalyc?",
    answerTemplate:
      "Freed and Mentalyc serve different needs. Freed is better for psychiatrists and prescribers doing medication management—it excels at HPI generation. Mentalyc is better for therapists doing talk therapy—it offers deeper therapy-specific templates and Alliance Genie relationship tracking. Choose based on your clinical role.",
    category: "ai-scribe-documentation",
    searchVolume: "medium",
  },
  {
    question: "Do AI scribes record therapy sessions?",
    answerTemplate:
      "Yes, AI scribes record or process audio from therapy sessions to generate notes. Most use 'ambient listening' during sessions, then delete audio after processing. Check each vendor's data retention policy. You must inform clients about AI documentation per your state's recording consent laws (one-party vs two-party consent).",
    category: "ai-scribe-documentation",
    searchVolume: "medium",
  },
];

// ============================================================================
// Telehealth PAA Questions
// ============================================================================

export const TELEHEALTH_PAA_QUESTIONS: ClinicianToolPAA[] = [
  {
    question: "What is the best telehealth platform for therapists?",
    answerTemplate:
      "The best telehealth platforms for therapists include: SimplePractice (best integrated with EHR), Doxy.me (best free option), and Zoom for Healthcare (best video quality). Key requirements: HIPAA compliance with BAA, virtual waiting room, no client downloads, and reliable connection quality.",
    category: "telehealth-communication",
    searchVolume: "high",
  },
  {
    question: "Is Zoom HIPAA compliant for therapy?",
    answerTemplate:
      "Standard Zoom is NOT HIPAA compliant for therapy. You need Zoom for Healthcare (Zoom One Pro + Healthcare add-on at $200+/year) which includes a BAA, enhanced encryption, and disabled cloud recording by default. Never use personal Zoom accounts for client sessions.",
    category: "telehealth-communication",
    searchVolume: "high",
  },
  {
    question: "Do I need separate telehealth if I have an EHR?",
    answerTemplate:
      "Most modern therapy EHRs include built-in telehealth (SimplePractice, TherapyNotes, Jane App). Separate telehealth is only needed if: your EHR doesn't include it, you need higher video quality, or you want features like screen sharing. Using your EHR's built-in telehealth simplifies workflows and documentation.",
    category: "telehealth-communication",
    searchVolume: "medium",
  },
  {
    question: "Is Doxy.me free and HIPAA compliant?",
    answerTemplate:
      "Yes, Doxy.me offers a free tier that is HIPAA compliant with a BAA available. The free version includes unlimited sessions with basic features. Paid plans ($35-50/month) add custom branding, virtual waiting room customization, and group sessions. Doxy.me is one of the most popular free options for solo therapists.",
    category: "telehealth-communication",
    searchVolume: "medium",
  },
];

// ============================================================================
// Billing / RCM PAA Questions
// ============================================================================

export const BILLING_PAA_QUESTIONS: ClinicianToolPAA[] = [
  {
    question: "How do therapists bill insurance?",
    answerTemplate:
      "Therapists bill insurance by: 1) Getting credentialed with insurance panels, 2) Verifying client eligibility before sessions, 3) Using correct CPT codes (90834, 90837 for therapy), 4) Submitting claims electronically via clearinghouse, 5) Processing ERA payments and managing denials. Most EHRs automate steps 3-5.",
    category: "billing-rcm",
    searchVolume: "high",
  },
  {
    question: "What CPT codes do therapists use?",
    answerTemplate:
      "Common therapy CPT codes: 90791 (psychiatric evaluation), 90832 (16-37 min therapy), 90834 (38-52 min therapy), 90837 (53+ min therapy), 90847 (family therapy with patient), 90846 (family therapy without patient). Add-on codes like 90785 (interactive complexity) can increase reimbursement. Always verify codes with current CPT guidelines.",
    category: "billing-rcm",
    searchVolume: "high",
  },
  {
    question: "Should I use a billing service for my therapy practice?",
    answerTemplate:
      "Consider a billing service if: you take multiple insurance panels, your claim denial rate exceeds 10%, billing takes more than 5 hours/week, or you're losing revenue to aging claims. Billing services charge 5-10% of collections but often increase revenue by 10-20% through better follow-up. Solo cash-pay practices usually don't need one.",
    category: "billing-rcm",
    searchVolume: "medium",
  },
];

// ============================================================================
// PMHNP / Prescriber PAA Questions
// ============================================================================

export const PRESCRIBER_PAA_QUESTIONS: ClinicianToolPAA[] = [
  {
    question: "What EHR do PMHNPs use?",
    answerTemplate:
      "PMHNPs commonly use EHRs with e-prescribing including SimplePractice (with e-prescribing add-on), Valant, or general medical EHRs like DrChrono. Key requirements: EPCS certification for controlled substances, medication tracking, affordable solo pricing. Many PMHNPs need both therapy and prescribing features.",
    category: "ehr-practice-management",
    searchVolume: "medium",
  },
  {
    question: "What is EPCS and do I need it?",
    answerTemplate:
      "EPCS (Electronic Prescribing for Controlled Substances) is DEA-mandated electronic prescribing for Schedule II-V medications. If you prescribe controlled substances (stimulants, benzodiazepines, etc.), you need EPCS-certified software. Most states now mandate EPCS. Your EHR must have EPCS certification—it's not automatic with regular e-prescribing.",
    category: "prescribing-erx",
    searchVolume: "medium",
  },
  {
    question: "How much does e-prescribing cost?",
    answerTemplate:
      "E-prescribing costs $20-50/month as an add-on to most EHRs. SimplePractice charges $39/month for e-prescribing including EPCS. Some EHRs include basic e-prescribing free but charge extra for EPCS. Medical EHRs often include e-prescribing in base pricing. Always verify EPCS certification before purchasing.",
    category: "prescribing-erx",
    searchVolume: "medium",
  },
];

// ============================================================================
// Generic Mental Health Software PAA Questions
// ============================================================================

export const GENERIC_SOFTWARE_PAA_QUESTIONS: ClinicianToolPAA[] = [
  {
    question: "What software do therapists need to start a practice?",
    answerTemplate:
      "Essential software for starting a therapy practice: 1) EHR/practice management (SimplePractice, TherapyNotes), 2) HIPAA-compliant telehealth (often included in EHR), 3) Secure email/messaging, 4) Optional: AI scribe for documentation, billing service for insurance. Start with an all-in-one EHR to minimize complexity.",
    searchVolume: "high",
  },
  {
    question: "How much should a therapist spend on software?",
    answerTemplate:
      "Most solo therapists spend $50-150/month on practice software: EHR ($30-80), telehealth ($0-50 if not included), AI scribe ($30-80 optional). Group practices multiply per-provider costs. Total software cost should be 2-5% of revenue. Start simple—you can add tools as you grow.",
    searchVolume: "medium",
  },
  {
    question: "What is the difference between SimplePractice and TherapyNotes?",
    answerTemplate:
      "SimplePractice offers a modern, all-in-one platform with built-in telehealth and intuitive interface—best for solo practitioners. TherapyNotes has stronger insurance billing features with better claim scrubbing and denial management—best for practices heavily reliant on insurance. Both are HIPAA compliant. SimplePractice is easier to learn; TherapyNotes has more billing depth.",
    searchVolume: "high",
  },
  {
    question: "Do I need HIPAA compliance for my private practice?",
    answerTemplate:
      "Yes, all mental health providers who transmit health information electronically must comply with HIPAA. This includes: using HIPAA-compliant EHR, telehealth, and email; having signed BAAs with all vendors handling PHI; implementing security policies; and training on privacy practices. Violations can result in fines from $100 to $50,000+ per incident.",
    searchVolume: "medium",
  },
];

// ============================================================================
// AGGREGATED EXPORTS
// ============================================================================

export const ALL_CLINICIAN_TOOL_PAA = [
  ...EHR_PAA_QUESTIONS,
  ...AI_SCRIBE_PAA_QUESTIONS,
  ...TELEHEALTH_PAA_QUESTIONS,
  ...BILLING_PAA_QUESTIONS,
  ...PRESCRIBER_PAA_QUESTIONS,
  ...GENERIC_SOFTWARE_PAA_QUESTIONS,
];

/**
 * Get PAA questions for a specific category
 */
export function getPAAForCategory(categorySlug: string): ClinicianToolPAA[] {
  const categoryMap: Record<string, ClinicianToolPAA[]> = {
    "ehr-practice-management": EHR_PAA_QUESTIONS,
    "ai-scribe-documentation": AI_SCRIBE_PAA_QUESTIONS,
    "ai-scribes-documentation": AI_SCRIBE_PAA_QUESTIONS,
    "telehealth-communication": TELEHEALTH_PAA_QUESTIONS,
    "billing-rcm": BILLING_PAA_QUESTIONS,
    "prescribing-erx": PRESCRIBER_PAA_QUESTIONS,
  };

  return categoryMap[categorySlug] || GENERIC_SOFTWARE_PAA_QUESTIONS;
}

/**
 * Get high-volume PAA questions (prioritize these)
 */
export function getHighVolumePAA(): ClinicianToolPAA[] {
  return ALL_CLINICIAN_TOOL_PAA.filter((paa) => paa.searchVolume === "high");
}

/**
 * Format PAA for FAQ schema
 */
export function formatPAAForSchema(
  questions: ClinicianToolPAA[]
): { q: string; a: string }[] {
  return questions.map((paa) => ({
    q: paa.question,
    a: paa.answerTemplate,
  }));
}
