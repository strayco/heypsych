/**
 * Best Software for [Specialty] Landing Page
 *
 * SEO-optimized pages targeting high-volume search keywords like:
 * - "best ehr for therapists"
 * - "best ehr for psychiatrists"
 * - "best ai scribe for psychiatrists"
 * - "best software for psychologists"
 *
 * URL: /tools/best-for/[specialty]
 */

import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Stethoscope,
  Brain,
  Heart,
  Users,
  HandHeart,
  CheckCircle2,
  Sparkles,
  Star,
  Shield,
  Bot,
} from "lucide-react";
import { siteConfig } from "@/lib/config/site";
import { ClinicianToolService } from "@/lib/tools/clinician-tool-service";
import { SCHEMA_TO_TAXONOMY_CATEGORY } from "@/lib/schemas/clinician-tool-v4";
import { ClinicianToolCard } from "@/components/tools/clinician";
import { ContextualArchitectCTA } from "@/components/architect/ContextualArchitectCTA";
import type { ClinicianToolV4 } from "@/lib/tools/clinician-tool-service";

interface PageProps {
  params: Promise<{ specialty: string }>;
}

// ============================================================================
// SPECIALTY CONFIGURATIONS
// ============================================================================

/**
 * Specialty configuration type
 */
interface SpecialtyConfig {
  name: string;
  namePlural: string;
  headline: string;
  description: string;
  icon: typeof Stethoscope;
  color: "treatment" | "accent";
  seoTitle: string;
  seoDescription: string;
  /** Clinician roles from the schema that map to this specialty */
  clinicianRoles: Array<
    | "psychiatrist"
    | "psychologist"
    | "therapist-lcsw-lmft"
    | "psychiatric-np-pa"
    | "practice-administrator"
    | "billing-specialist"
    | "care-coordinator"
    | "medical-director"
  >;
  /** Key capabilities/features to highlight for this specialty */
  keyFeatures: string[];
  /** Selection criteria / what to look for */
  selectionCriteria: string[];
  /** Primary search keywords this page targets */
  targetKeywords: string[];
  /** Recommended product categories */
  recommendedCategories: string[];
}

/**
 * Specialty configurations for each URL slug
 *
 * Maps URL slugs to specialty data including:
 * - SEO metadata targeting search keywords
 * - Clinician role mappings for filtering products
 * - Feature highlights and selection criteria
 */
const SPECIALTY_CONFIGS: Record<string, SpecialtyConfig> = {
  therapists: {
    name: "Therapist",
    namePlural: "Therapists",
    headline: "Best EHR & Software for Therapists",
    description:
      "Find the best EHR, practice management, and documentation software designed for therapists, LCSWs, and LMFTs. Compare features, pricing, and telehealth capabilities to streamline your therapy practice.",
    icon: Heart,
    color: "treatment",
    seoTitle: "Best EHR Software for Therapists (2026) | Top Practice Management Tools",
    seoDescription:
      "Compare the best EHR and practice management software for therapists, LCSWs, and LMFTs. Expert reviews of SimplePractice, TherapyNotes, and more. Find your perfect match.",
    clinicianRoles: ["therapist-lcsw-lmft"],
    keyFeatures: [
      "Progress notes & treatment plans",
      "HIPAA-compliant telehealth",
      "Client scheduling & reminders",
      "Insurance billing & claims",
      "Secure client portal",
      "Mobile app access",
    ],
    selectionCriteria: [
      "Look for therapy-specific note templates (SOAP, DAP, BIRP)",
      "Ensure built-in HIPAA-compliant video for teletherapy",
      "Check insurance billing support for your panels",
      "Consider ease of use—you shouldn't need IT support",
      "Verify client portal features for intake and messaging",
    ],
    targetKeywords: [
      "best ehr for therapists",
      "best software for therapists",
      "therapy practice management software",
      "ehr for lcsw",
      "ehr for lmft",
    ],
    recommendedCategories: ["ehr-practice-management", "telehealth-communication", "ai-scribe-documentation"],
  },

  psychiatrists: {
    name: "Psychiatrist",
    namePlural: "Psychiatrists",
    headline: "Best EHR & Software for Psychiatrists",
    description:
      "Discover top-rated EHR, e-prescribing, and AI scribe solutions built for psychiatric practice. Compare platforms with EPCS certification, medication management, and clinical decision support.",
    icon: Stethoscope,
    color: "treatment",
    seoTitle: "Best EHR Software for Psychiatrists (2026) | e-Prescribing & AI Scribes",
    seoDescription:
      "Find the best EHR software for psychiatrists with e-prescribing, EPCS, and AI documentation. Compare Valant, SimplePractice, and leading psychiatric EHRs.",
    clinicianRoles: ["psychiatrist", "psychiatric-np-pa"],
    keyFeatures: [
      "E-prescribing with EPCS",
      "Medication management & tracking",
      "Lab integration",
      "Psychiatric-specific templates",
      "AI clinical documentation",
      "Prior authorization support",
    ],
    selectionCriteria: [
      "Verify EPCS certification for controlled substance prescribing",
      "Check state-specific e-prescribing compliance",
      "Look for medication interaction checking",
      "Consider AI scribe integration for efficient documentation",
      "Evaluate lab ordering and results integration",
    ],
    targetKeywords: [
      "best ehr for psychiatrists",
      "best ai scribe for psychiatrists",
      "psychiatry ehr software",
      "psychiatric practice management",
      "ehr with epcs",
    ],
    recommendedCategories: ["ehr-practice-management", "prescribing-erx", "ai-scribe-documentation"],
  },

  psychologists: {
    name: "Psychologist",
    namePlural: "Psychologists",
    headline: "Best EHR & Software for Psychologists",
    description:
      "Find EHR and practice management software tailored for psychologists. Compare platforms with psychological testing integration, outcome measurement, and comprehensive documentation tools.",
    icon: Brain,
    color: "accent",
    seoTitle: "Best EHR Software for Psychologists (2026) | Testing & Documentation",
    seoDescription:
      "Compare the best EHR software for psychologists with assessment tools, outcome tracking, and report generation. Find the right platform for your psychology practice.",
    clinicianRoles: ["psychologist"],
    keyFeatures: [
      "Psychological testing integration",
      "Outcome measurement tools",
      "Treatment planning",
      "Report generation",
      "HIPAA-compliant telehealth",
      "Insurance billing support",
    ],
    selectionCriteria: [
      "Check integration with psychological assessment platforms",
      "Look for customizable report templates",
      "Ensure outcome measurement and progress tracking",
      "Consider documentation efficiency features",
      "Verify insurance and superbill capabilities",
    ],
    targetKeywords: [
      "best ehr for psychologists",
      "psychology practice management software",
      "ehr for psychologists",
      "psychological testing software",
    ],
    recommendedCategories: ["ehr-practice-management", "measurement-outcomes", "ai-scribe-documentation"],
  },

  counselors: {
    name: "Counselor",
    namePlural: "Counselors",
    headline: "Best EHR & Software for Counselors",
    description:
      "Explore EHR and practice management solutions designed for professional counselors. Compare user-friendly platforms with progress notes, scheduling, and affordable pricing for counseling practices.",
    icon: Users,
    color: "accent",
    seoTitle: "Best EHR Software for Counselors (2026) | Affordable Practice Management",
    seoDescription:
      "Find the best EHR and practice management software for counselors. Compare affordable, easy-to-use platforms like SimplePractice and TherapyNotes for your counseling practice.",
    clinicianRoles: ["therapist-lcsw-lmft"],
    keyFeatures: [
      "Progress note templates",
      "Client scheduling",
      "Secure messaging",
      "Telehealth integration",
      "Treatment planning",
      "Affordable pricing",
    ],
    selectionCriteria: [
      "Prioritize ease of use and quick setup",
      "Look for affordable pricing tiers for solo practice",
      "Ensure HIPAA compliance is included, not an add-on",
      "Check for free trial to test before committing",
      "Consider client portal features for engagement",
    ],
    targetKeywords: [
      "best ehr for counselors",
      "counseling practice management software",
      "ehr for mental health counselors",
      "affordable therapy software",
    ],
    recommendedCategories: ["ehr-practice-management", "telehealth-communication", "patient-engagement"],
  },

  "social-workers": {
    name: "Social Worker",
    namePlural: "Social Workers",
    headline: "Best EHR & Software for Social Workers",
    description:
      "Discover EHR and documentation software built for clinical social workers. Compare platforms with case management features, care coordination tools, and community mental health support.",
    icon: HandHeart,
    color: "treatment",
    seoTitle: "Best EHR Software for Social Workers (2026) | Case Management & Documentation",
    seoDescription:
      "Compare the best EHR and practice management software for social workers (LCSW). Find platforms with case management, care coordination, and clinical documentation tools.",
    clinicianRoles: ["therapist-lcsw-lmft", "care-coordinator"],
    keyFeatures: [
      "Case management tools",
      "Care coordination features",
      "Progress documentation",
      "Referral tracking",
      "Community resource integration",
      "Team collaboration",
    ],
    selectionCriteria: [
      "Look for robust case management capabilities",
      "Consider care coordination and referral features",
      "Check for team collaboration tools if in group setting",
      "Ensure clinical documentation meets state requirements",
      "Evaluate community mental health center features if applicable",
    ],
    targetKeywords: [
      "best ehr for social workers",
      "ehr for lcsw",
      "social work case management software",
      "clinical social worker software",
    ],
    recommendedCategories: ["ehr-practice-management", "care-coordination", "telehealth-communication"],
  },

  "pmhnps": {
    name: "PMHNP",
    namePlural: "PMHNPs",
    headline: "Best EHR & Software for PMHNPs",
    description:
      "Find EHR, e-prescribing, and practice management software built for Psychiatric Mental Health Nurse Practitioners. Compare platforms with EPCS certification, medication management, and solo practice workflows optimized for independent PMHNPs.",
    icon: Stethoscope,
    color: "treatment",
    seoTitle: "Best EHR Software for PMHNPs (2026) | e-Prescribing & Practice Management",
    seoDescription:
      "Compare the best EHR software for PMHNPs with EPCS, e-prescribing, and medication management. Find affordable platforms for independent psychiatric nurse practitioners.",
    clinicianRoles: ["psychiatric-np-pa"],
    keyFeatures: [
      "E-prescribing with EPCS",
      "Medication management & tracking",
      "Psychiatric note templates",
      "HIPAA-compliant telehealth",
      "Insurance billing & claims",
      "Affordable solo pricing",
    ],
    selectionCriteria: [
      "Verify EPCS certification for controlled substance prescribing",
      "Check multi-state e-prescribing compliance if practicing across state lines",
      "Look for affordable solo practitioner pricing tiers",
      "Consider built-in telehealth for hybrid or virtual-first practices",
      "Evaluate medication interaction checking and PDMP integration",
      "Ensure psychiatric-specific documentation templates are included",
    ],
    targetKeywords: [
      "best ehr for pmhnp",
      "best ehr for psychiatric nurse practitioners",
      "pmhnp practice management software",
      "ehr for psychiatric np",
      "pmhnp e-prescribing software",
    ],
    recommendedCategories: ["ehr-practice-management", "prescribing-erx", "ai-scribe-documentation"],
  },

  "solo-practice": {
    name: "Solo Practitioner",
    namePlural: "Solo Practitioners",
    headline: "Best EHR & Software for Solo Therapists",
    description:
      "Find affordable, easy-to-use EHR and practice management software designed for solo mental health practitioners. Compare all-in-one platforms that handle scheduling, documentation, billing, and telehealth without requiring an IT team.",
    icon: Users,
    color: "accent",
    seoTitle: "Best EHR Software for Solo Therapists (2026) | Affordable Practice Management",
    seoDescription:
      "Compare the best EHR and practice management software for solo therapists. Find affordable all-in-one platforms with scheduling, telehealth, and billing. SimplePractice, TherapyNotes, and more.",
    clinicianRoles: ["therapist-lcsw-lmft", "psychologist", "psychiatric-np-pa"],
    keyFeatures: [
      "All-in-one platform",
      "Simple setup & onboarding",
      "Affordable solo pricing",
      "Built-in HIPAA-compliant telehealth",
      "Integrated billing & payment processing",
      "Mobile app for on-the-go access",
    ],
    selectionCriteria: [
      "Prioritize ease of use—you shouldn't need IT support",
      "Look for all-in-one pricing without hidden per-feature add-ons",
      "Verify telehealth is included at the price tier you need",
      "Check that insurance billing works for your specific panels",
      "Consider total monthly cost including payment processing fees",
      "Ensure data export is available if you need to switch later",
    ],
    targetKeywords: [
      "best ehr for solo therapists",
      "best ehr for solo practice",
      "solo therapist practice management",
      "ehr for independent therapist",
      "affordable therapy ehr",
    ],
    recommendedCategories: ["ehr-practice-management", "telehealth-communication", "billing-rcm"],
  },

  "group-practice": {
    name: "Group Practice",
    namePlural: "Group Practices",
    headline: "Best EHR & Software for Group Practices",
    description:
      "Find EHR and practice management software built for multi-clinician mental health practices. Compare platforms with clinician scheduling, permission controls, centralized billing, supervision workflows, and practice-wide reporting.",
    icon: Users,
    color: "accent",
    seoTitle: "Best EHR Software for Group Practices (2026) | Multi-Clinician Practice Management",
    seoDescription:
      "Compare the best EHR and practice management software for mental health group practices. Find platforms with multi-clinician scheduling, centralized billing, and practice-wide reporting.",
    clinicianRoles: ["practice-administrator", "medical-director", "therapist-lcsw-lmft", "psychiatrist"],
    keyFeatures: [
      "Multi-clinician scheduling",
      "Role-based permissions",
      "Centralized billing & reporting",
      "Supervision workflows",
      "Staff management",
      "Per-clinician pricing that scales",
    ],
    selectionCriteria: [
      "Evaluate per-clinician pricing as you scale—some platforms get expensive quickly",
      "Check role-based permissions for clinical vs admin staff",
      "Look for supervision documentation workflows if you have trainees",
      "Consider centralized billing with individual clinician reporting",
      "Ensure practice-wide analytics for revenue and utilization tracking",
      "Verify onboarding support for migrating multiple clinicians",
    ],
    targetKeywords: [
      "best ehr for group practice",
      "group therapy practice ehr",
      "multi-clinician ehr",
      "ehr for mental health group practice",
      "group practice management software",
    ],
    recommendedCategories: ["ehr-practice-management", "billing-rcm", "credentialing-workforce"],
  },

  "insurance-based": {
    name: "Insurance-Based Practice",
    namePlural: "Insurance-Based Practices",
    headline: "Best EHR for Insurance-Based Practices",
    description:
      "Find EHR and practice management software optimized for insurance billing. Compare platforms with electronic claims submission, ERA/EOB processing, eligibility verification, and denial management for practices that accept insurance.",
    icon: Shield,
    color: "treatment",
    seoTitle: "Best EHR for Insurance-Based Practices (2026) | Claims & Billing",
    seoDescription:
      "Compare the best EHR software for insurance-based mental health practices. Find platforms with claims submission, eligibility verification, and denial management.",
    clinicianRoles: ["therapist-lcsw-lmft", "psychiatrist", "psychologist", "psychiatric-np-pa"],
    keyFeatures: [
      "Electronic claims submission",
      "Real-time eligibility verification",
      "ERA/EOB auto-posting",
      "Denial management workflow",
      "Secondary insurance billing",
      "Clearinghouse integration",
    ],
    selectionCriteria: [
      "Verify clearinghouse integration with your payers",
      "Check real-time eligibility verification accuracy",
      "Look for automated ERA posting to reduce manual entry",
      "Evaluate denial management and resubmission workflows",
      "Consider secondary insurance billing capabilities",
      "Ensure reporting shows clean claim rates and days in AR",
    ],
    targetKeywords: [
      "best ehr for insurance billing",
      "mental health ehr with claims",
      "ehr for insurance-based practice",
      "therapy ehr with billing",
      "ehr with clearinghouse integration",
    ],
    recommendedCategories: ["ehr-practice-management", "billing-rcm", "telehealth-communication"],
  },

  "cash-pay": {
    name: "Cash-Pay Practice",
    namePlural: "Cash-Pay Practices",
    headline: "Best EHR for Cash-Pay Practices",
    description:
      "Find streamlined EHR and practice management software for private-pay and cash-based mental health practices. Compare affordable platforms focused on scheduling, documentation, and payment processing without complex insurance billing.",
    icon: Heart,
    color: "accent",
    seoTitle: "Best EHR for Cash-Pay Practices (2026) | Private Pay & Self-Pay",
    seoDescription:
      "Compare the best EHR software for cash-pay and private-pay mental health practices. Find affordable platforms with simple billing, scheduling, and documentation.",
    clinicianRoles: ["therapist-lcsw-lmft", "psychiatrist", "psychologist", "psychiatric-np-pa"],
    keyFeatures: [
      "Simple payment processing",
      "Superbill generation",
      "Autopay & payment plans",
      "No complex billing overhead",
      "Credit card on file",
      "Clean, simple workflows",
    ],
    selectionCriteria: [
      "Prioritize simplicity over insurance billing features you won't use",
      "Compare payment processing fees—they vary significantly",
      "Look for automatic superbill generation for out-of-network reimbursement",
      "Consider autopay and payment plan capabilities",
      "Check if simpler tiers exclude billing features you don't need",
      "Evaluate total cost without insurance billing add-ons",
    ],
    targetKeywords: [
      "best ehr for cash pay practice",
      "ehr for private pay therapist",
      "self pay therapy software",
      "cash based practice ehr",
      "ehr without insurance billing",
    ],
    recommendedCategories: ["ehr-practice-management", "telehealth-communication", "patient-engagement"],
  },

  "ai-scribe-therapists": {
    name: "Therapist",
    namePlural: "Therapists",
    headline: "Best AI Scribe for Therapists",
    description:
      "Find AI-powered documentation tools designed for therapy sessions. Compare ambient scribes that generate progress notes, treatment plans, and session summaries while you focus on your client.",
    icon: Bot,
    color: "accent",
    seoTitle: "Best AI Scribe for Therapists (2026) | AI Note Taking for Therapy",
    seoDescription:
      "Compare the best AI scribes for therapists. Find HIPAA-compliant ambient documentation tools that generate therapy notes, progress notes, and treatment plans automatically.",
    clinicianRoles: ["therapist-lcsw-lmft", "psychologist"],
    keyFeatures: [
      "Ambient session listening",
      "Therapy note generation",
      "Progress note templates (SOAP, DAP, BIRP)",
      "Treatment plan assistance",
      "HIPAA-compliant processing",
      "EHR integration",
    ],
    selectionCriteria: [
      "Verify HIPAA compliance and BAA availability",
      "Check therapy-specific note formats (SOAP, DAP, BIRP, narrative)",
      "Look for EHR integration with your current platform",
      "Evaluate accuracy with mental health terminology",
      "Consider whether it captures therapeutic interventions appropriately",
      "Test with actual sessions during free trial",
    ],
    targetKeywords: [
      "best ai scribe for therapists",
      "ai note taking for therapy",
      "therapy ai documentation",
      "ai progress notes therapy",
      "ambient scribe for therapists",
    ],
    recommendedCategories: ["ai-scribe-documentation", "ehr-practice-management", "telehealth-communication"],
  },

  "ai-scribe-psychiatrists": {
    name: "Psychiatrist",
    namePlural: "Psychiatrists",
    headline: "Best AI Scribe for Psychiatrists",
    description:
      "Find AI-powered clinical documentation tools optimized for psychiatric evaluations and medication management visits. Compare ambient scribes that capture diagnoses, medication changes, and clinical reasoning.",
    icon: Bot,
    color: "accent",
    seoTitle: "Best AI Scribe for Psychiatrists (2026) | AI Documentation for Psychiatry",
    seoDescription:
      "Compare the best AI scribes for psychiatrists. Find tools that document psychiatric evaluations, medication management, and clinical decision-making automatically.",
    clinicianRoles: ["psychiatrist", "psychiatric-np-pa"],
    keyFeatures: [
      "Psychiatric evaluation documentation",
      "Medication management notes",
      "Clinical reasoning capture",
      "Diagnosis and differential support",
      "HIPAA-compliant processing",
      "E-prescribing integration",
    ],
    selectionCriteria: [
      "Verify accurate capture of medication names, dosages, and changes",
      "Check psychiatric-specific note formats and terminology",
      "Look for integration with e-prescribing workflows",
      "Evaluate capture of clinical reasoning and risk assessments",
      "Consider whether it handles brief med check visits efficiently",
      "Test accuracy with psychiatric terminology during trial",
    ],
    targetKeywords: [
      "best ai scribe for psychiatrists",
      "ai documentation psychiatry",
      "psychiatric ai scribe",
      "ai notes for psychiatry",
      "ambient scribe psychiatrist",
    ],
    recommendedCategories: ["ai-scribe-documentation", "ehr-practice-management", "prescribing-erx"],
  },

  "ai-scribe-pmhnps": {
    name: "PMHNP",
    namePlural: "PMHNPs",
    headline: "Best AI Scribe for PMHNPs",
    description:
      "Find AI-powered documentation tools for psychiatric nurse practitioners. Compare ambient scribes that handle both therapy and medication management visits with affordable solo practitioner pricing.",
    icon: Bot,
    color: "accent",
    seoTitle: "Best AI Scribe for PMHNPs (2026) | AI Documentation for Psychiatric NPs",
    seoDescription:
      "Compare the best AI scribes for PMHNPs. Find affordable AI documentation tools for psychiatric nurse practitioners with medication management and therapy note support.",
    clinicianRoles: ["psychiatric-np-pa"],
    keyFeatures: [
      "Combined therapy & med management",
      "Medication documentation",
      "Affordable solo pricing",
      "HIPAA-compliant processing",
      "Multiple note formats",
      "EHR integration",
    ],
    selectionCriteria: [
      "Look for flexibility between therapy and med management note formats",
      "Verify accurate medication and dosage capture",
      "Check solo practitioner pricing tiers",
      "Ensure HIPAA compliance with signed BAA",
      "Consider workflow for mixed therapy/prescribing visits",
      "Evaluate EHR integration with your platform",
    ],
    targetKeywords: [
      "best ai scribe for pmhnp",
      "ai documentation psychiatric np",
      "pmhnp ai notes",
      "ai scribe nurse practitioner",
      "ambient scribe pmhnp",
    ],
    recommendedCategories: ["ai-scribe-documentation", "ehr-practice-management", "prescribing-erx"],
  },

  "with-epcs": {
    name: "EPCS Practice",
    namePlural: "Prescribers",
    headline: "Best Mental Health EHR With EPCS",
    description:
      "Find EHR platforms with certified EPCS (Electronic Prescribing for Controlled Substances) for prescribing Schedule II-V medications. Compare platforms that meet DEA requirements for identity proofing and two-factor authentication.",
    icon: Shield,
    color: "treatment",
    seoTitle: "Best Mental Health EHR With EPCS (2026) | Controlled Substance Prescribing",
    seoDescription:
      "Compare mental health EHRs with EPCS certification for controlled substance prescribing. Find platforms with DEA-compliant e-prescribing for Schedule II-V medications.",
    clinicianRoles: ["psychiatrist", "psychiatric-np-pa"],
    keyFeatures: [
      "EPCS certification (DEA-compliant)",
      "Two-factor authentication",
      "PDMP integration",
      "Medication interaction checking",
      "State-specific compliance",
      "Audit trail for controlled substances",
    ],
    selectionCriteria: [
      "Verify EPCS certification meets current DEA requirements",
      "Check state-specific e-prescribing mandates for your license states",
      "Look for PDMP integration to check patient prescription history",
      "Evaluate identity proofing process and authentication options",
      "Consider medication interaction checking capabilities",
      "Ensure audit trail meets compliance requirements",
    ],
    targetKeywords: [
      "ehr with epcs",
      "mental health ehr epcs",
      "e-prescribing controlled substances",
      "psychiatry ehr with epcs",
      "epcs certified ehr",
    ],
    recommendedCategories: ["ehr-practice-management", "prescribing-erx", "compliance-security"],
  },

  "with-telehealth": {
    name: "Telehealth Practice",
    namePlural: "Telehealth Practices",
    headline: "Best Mental Health EHR With Telehealth",
    description:
      "Find EHR platforms with built-in HIPAA-compliant telehealth for virtual therapy and telepsychiatry. Compare video quality, waiting room features, screen sharing, and integration with your documentation workflow.",
    icon: Users,
    color: "accent",
    seoTitle: "Best Mental Health EHR With Telehealth (2026) | Video Therapy Platforms",
    seoDescription:
      "Compare mental health EHRs with built-in telehealth. Find platforms with HIPAA-compliant video, virtual waiting rooms, and integrated documentation for teletherapy.",
    clinicianRoles: ["therapist-lcsw-lmft", "psychiatrist", "psychologist", "psychiatric-np-pa"],
    keyFeatures: [
      "HIPAA-compliant video",
      "Virtual waiting room",
      "Screen sharing",
      "Session recording (optional)",
      "No downloads for clients",
      "Integrated scheduling",
    ],
    selectionCriteria: [
      "Test video quality and reliability with actual sessions",
      "Verify HIPAA compliance is not an add-on tier",
      "Check client experience—no downloads or complex setup",
      "Look for virtual waiting room and custom branding",
      "Consider bandwidth requirements for your connection",
      "Evaluate mobile app support for sessions on the go",
    ],
    targetKeywords: [
      "ehr with telehealth",
      "teletherapy ehr",
      "mental health ehr video",
      "hipaa compliant telehealth ehr",
      "ehr for virtual therapy",
    ],
    recommendedCategories: ["ehr-practice-management", "telehealth-communication", "patient-engagement"],
  },

  "with-ai-notes": {
    name: "AI-Enabled Practice",
    namePlural: "AI-Enabled Practices",
    headline: "Best Mental Health EHR With AI Notes",
    description:
      "Find EHR platforms with integrated AI documentation features. Compare built-in AI scribes, note generation, and documentation assistance that reduce time spent on clinical notes.",
    icon: Sparkles,
    color: "accent",
    seoTitle: "Best Mental Health EHR With AI Notes (2026) | AI Documentation",
    seoDescription:
      "Compare mental health EHRs with built-in AI documentation. Find platforms with AI-powered note generation, ambient scribes, and documentation assistance.",
    clinicianRoles: ["therapist-lcsw-lmft", "psychiatrist", "psychologist", "psychiatric-np-pa"],
    keyFeatures: [
      "AI note generation",
      "Ambient documentation",
      "Template suggestions",
      "Clinical summarization",
      "HIPAA-compliant AI",
      "Integrated workflow",
    ],
    selectionCriteria: [
      "Distinguish built-in AI from third-party integrations",
      "Verify HIPAA compliance of AI features specifically",
      "Check accuracy with mental health terminology and interventions",
      "Look for customizable note formats and templates",
      "Consider whether AI is included or an add-on cost",
      "Evaluate time savings in actual documentation workflow",
    ],
    targetKeywords: [
      "ehr with ai notes",
      "mental health ehr ai",
      "ai therapy documentation",
      "ehr with ai scribe",
      "ai powered ehr mental health",
    ],
    recommendedCategories: ["ehr-practice-management", "ai-scribe-documentation", "telehealth-communication"],
  },

  "insurance-billing": {
    name: "Insurance Billing Focus",
    namePlural: "Insurance Billing",
    headline: "Best Mental Health EHR for Insurance Billing",
    description:
      "Find EHR platforms with robust insurance billing capabilities specifically designed for mental health claims. Compare clearinghouse integrations, claim scrubbing, ERA posting, and denial management workflows.",
    icon: Shield,
    color: "treatment",
    seoTitle: "Best Mental Health EHR for Insurance Billing (2026) | Claims Management",
    seoDescription:
      "Compare mental health EHRs with the best insurance billing features. Find platforms with claims submission, eligibility verification, and denial management for therapists and psychiatrists.",
    clinicianRoles: ["therapist-lcsw-lmft", "psychiatrist", "psychologist", "psychiatric-np-pa", "billing-specialist"],
    keyFeatures: [
      "Integrated clearinghouse",
      "Claim scrubbing",
      "ERA auto-posting",
      "Denial management",
      "Eligibility verification",
      "Aging reports",
    ],
    selectionCriteria: [
      "Compare clearinghouse options and per-claim fees",
      "Check claim scrubbing accuracy before submission",
      "Look for automated ERA posting to reduce manual work",
      "Evaluate denial tracking and resubmission workflows",
      "Consider eligibility verification accuracy and speed",
      "Review reporting on clean claim rates and days in AR",
    ],
    targetKeywords: [
      "best ehr for insurance billing",
      "mental health billing software",
      "therapy ehr billing",
      "ehr with claims submission",
      "mental health claims software",
    ],
    recommendedCategories: ["ehr-practice-management", "billing-rcm", "compliance-security"],
  },

  "medication-management": {
    name: "Medication Management",
    namePlural: "Prescribers",
    headline: "Best EHR for Medication Management",
    description:
      "Find EHR platforms optimized for psychiatric medication management workflows. Compare e-prescribing, drug interaction checking, prior authorization support, and medication tracking features for prescribers.",
    icon: Stethoscope,
    color: "treatment",
    seoTitle: "Best EHR for Medication Management (2026) | Prescriber Workflows",
    seoDescription:
      "Compare EHRs optimized for psychiatric medication management. Find platforms with e-prescribing, drug interactions, prior auth, and medication tracking for psychiatrists and PMHNPs.",
    clinicianRoles: ["psychiatrist", "psychiatric-np-pa"],
    keyFeatures: [
      "E-prescribing (EPCS included)",
      "Drug interaction checking",
      "Prior authorization workflow",
      "Medication history tracking",
      "Refill management",
      "Lab integration",
    ],
    selectionCriteria: [
      "Verify EPCS certification for controlled substances",
      "Check drug interaction database comprehensiveness",
      "Look for prior authorization workflow support",
      "Evaluate medication history and adherence tracking",
      "Consider lab ordering and results integration",
      "Ensure efficient workflow for brief med check visits",
    ],
    targetKeywords: [
      "ehr for medication management",
      "psychiatry ehr prescribing",
      "medication management software",
      "ehr for prescribers",
      "psychiatric prescribing ehr",
    ],
    recommendedCategories: ["ehr-practice-management", "prescribing-erx", "clinical-decision-support"],
  },

  "solo-psychiatrists": {
    name: "Solo Psychiatrist",
    namePlural: "Solo Psychiatrists",
    headline: "Best EHR for Solo Psychiatrists",
    description:
      "Find EHR and practice management software designed for independent psychiatrists. Compare platforms with e-prescribing, EPCS, medication management, and affordable solo practitioner pricing without enterprise complexity.",
    icon: Stethoscope,
    color: "treatment",
    seoTitle: "Best EHR for Solo Psychiatrists (2026) | Independent Practice Software",
    seoDescription:
      "Compare the best EHR software for solo psychiatrists. Find platforms with e-prescribing, EPCS, and medication management at affordable solo practice pricing.",
    clinicianRoles: ["psychiatrist"],
    keyFeatures: [
      "E-prescribing with EPCS",
      "Medication management",
      "Affordable solo pricing",
      "Psychiatric note templates",
      "Built-in telehealth",
      "Simple billing workflow",
    ],
    selectionCriteria: [
      "Verify EPCS certification for controlled substances",
      "Look for solo practitioner pricing without enterprise overhead",
      "Check psychiatric-specific documentation templates",
      "Consider built-in telehealth for hybrid practices",
      "Evaluate medication tracking and interaction checking",
      "Ensure billing workflow fits your payer mix",
    ],
    targetKeywords: [
      "best ehr for solo psychiatrist",
      "solo psychiatry practice software",
      "independent psychiatrist ehr",
      "ehr for solo psychiatric practice",
      "affordable psychiatry ehr",
    ],
    recommendedCategories: ["ehr-practice-management", "prescribing-erx", "ai-scribe-documentation"],
  },

  "hipaa-ai-scribe": {
    name: "HIPAA-Compliant AI Scribe",
    namePlural: "Mental Health Clinicians",
    headline: "Best HIPAA-Compliant AI Scribe for Mental Health",
    description:
      "Find AI documentation tools with verified HIPAA compliance for mental health practices. Compare ambient scribes with signed BAAs, encrypted processing, and compliant data handling for therapy and psychiatry sessions.",
    icon: Shield,
    color: "treatment",
    seoTitle: "Best HIPAA-Compliant AI Scribe for Mental Health (2026)",
    seoDescription:
      "Compare HIPAA-compliant AI scribes for mental health. Find AI documentation tools with signed BAAs, encrypted processing, and compliant data handling for therapists and psychiatrists.",
    clinicianRoles: ["therapist-lcsw-lmft", "psychiatrist", "psychologist", "psychiatric-np-pa"],
    keyFeatures: [
      "Signed BAA available",
      "HIPAA-compliant processing",
      "Encrypted audio/data",
      "No third-party data sharing",
      "Audit trail capabilities",
      "SOC 2 certification",
    ],
    selectionCriteria: [
      "Verify BAA is available and request a copy before use",
      "Check where audio is processed and stored",
      "Look for SOC 2 Type II certification",
      "Ensure data is not used to train AI models",
      "Consider whether audio is stored or immediately deleted",
      "Review their security documentation and incident history",
    ],
    targetKeywords: [
      "hipaa compliant ai scribe",
      "hipaa ai documentation therapy",
      "secure ai scribe mental health",
      "baa ai scribe",
      "compliant ai notes therapy",
    ],
    recommendedCategories: ["ai-scribe-documentation", "ehr-practice-management", "compliance-security"],
  },

  "ai-therapy-notes": {
    name: "AI Therapy Notes",
    namePlural: "Therapists",
    headline: "Best AI Note Taker for Therapy",
    description:
      "Find AI-powered note-taking tools that generate therapy documentation automatically. Compare ambient listeners, dictation assistants, and AI note generators that create progress notes, SOAP notes, and treatment plans.",
    icon: Bot,
    color: "accent",
    seoTitle: "Best AI Note Taker for Therapy (2026) | Automated Therapy Notes",
    seoDescription:
      "Compare AI note takers for therapy sessions. Find tools that automatically generate progress notes, SOAP notes, and treatment plans from your sessions.",
    clinicianRoles: ["therapist-lcsw-lmft", "psychologist"],
    keyFeatures: [
      "Automatic note generation",
      "Multiple note formats",
      "Session summarization",
      "Treatment plan assistance",
      "HIPAA compliance",
      "EHR export/integration",
    ],
    selectionCriteria: [
      "Compare ambient listening vs. dictation-based approaches",
      "Check supported note formats (SOAP, DAP, BIRP, narrative)",
      "Verify accuracy with therapy-specific terminology",
      "Look for customizable templates and output",
      "Consider integration with your existing EHR",
      "Test with actual sessions during free trial",
    ],
    targetKeywords: [
      "ai note taker therapy",
      "automatic therapy notes",
      "ai therapy documentation",
      "therapy note generator",
      "ai progress notes for therapists",
    ],
    recommendedCategories: ["ai-scribe-documentation", "ehr-practice-management", "telehealth-communication"],
  },
};

// ============================================================================
// STATIC PARAMS
// ============================================================================

/**
 * Generate static params for all specialty pages
 */
export function generateStaticParams() {
  return Object.keys(SPECIALTY_CONFIGS).map((specialty) => ({ specialty }));
}

// ============================================================================
// METADATA
// ============================================================================

/**
 * Generate SEO metadata for specialty pages
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { specialty } = await params;
  const config = SPECIALTY_CONFIGS[specialty];

  if (!config) {
    return { title: "Best Software" };
  }

  return {
    title: config.seoTitle,
    description: config.seoDescription,
    alternates: {
      canonical: `${siteConfig.url}/tools/best-for/${specialty}/`,
    },
    openGraph: {
      title: config.seoTitle,
      description: config.seoDescription,
      url: `${siteConfig.url}/tools/best-for/${specialty}/`,
      type: "website",
    },
    keywords: config.targetKeywords,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Filter tools by clinician roles
 * Tools with empty clinician_roles arrays are considered suitable for all roles
 */
function filterToolsByRoles(
  tools: ClinicianToolV4[],
  roles: SpecialtyConfig["clinicianRoles"]
): ClinicianToolV4[] {
  return tools.filter((tool) => {
    const toolRoles = tool.audiences?.clinician_roles || [];
    // If tool has no specified roles, it's suitable for all
    if (toolRoles.length === 0) return true;
    // Otherwise, check if any of the specialty's roles match
    return roles.some((role) => toolRoles.includes(role));
  });
}

/**
 * Score and rank tools for a specialty
 * Considers: data quality, compliance, feature flags, and category relevance
 */
function rankToolsForSpecialty(
  tools: ClinicianToolV4[],
  config: SpecialtyConfig
): ClinicianToolV4[] {
  return tools
    .map((tool) => {
      let score = tool.governance?.data_quality_score || 0;

      // Compliance bonuses
      if (tool.compliance?.hipaa_support === "yes") score += 15;
      if (tool.compliance?.baa_available === "yes") score += 10;

      // Category relevance bonus
      if (config.recommendedCategories.includes(tool.primary_category)) {
        score += 20;
      }

      // Feature bonuses based on specialty
      if (config.clinicianRoles.includes("psychiatrist") || config.clinicianRoles.includes("psychiatric-np-pa")) {
        if (tool.feature_flags.has_e_prescribing) score += 15;
        if (tool.feature_flags.has_ai) score += 10;
      }

      if (tool.feature_flags.has_telehealth) score += 5;
      if (tool.feature_flags.has_ai) score += 5;

      // Featured bonus
      if (tool.featured) score += 10;

      return { tool, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(({ tool }) => tool);
}

// ============================================================================
// PAGE COMPONENT
// ============================================================================

export default async function BestForSpecialtyPage({ params }: PageProps) {
  const { specialty } = await params;
  const config = SPECIALTY_CONFIGS[specialty];

  if (!config) {
    notFound();
  }

  // Load and filter tools
  const allTools = await ClinicianToolService.loadClinicianTools();
  const filteredTools = filterToolsByRoles(allTools, config.clinicianRoles);
  const rankedTools = rankToolsForSpecialty(filteredTools, config);

  // Get top recommended tools (limit to 9 for 3x3 grid)
  const topTools = rankedTools.slice(0, 9);

  // Get EHR-specific tools for the "Best EHRs" section
  const ehrTools = rankedTools
    .filter((t) => t.primary_category === "ehr-practice-management")
    .slice(0, 6);

  // Get AI scribe tools for psychiatrists
  const aiScribeTools =
    config.clinicianRoles.includes("psychiatrist") || config.clinicianRoles.includes("psychiatric-np-pa")
      ? rankedTools.filter((t) => t.primary_category === "ai-scribe-documentation").slice(0, 3)
      : [];

  const Icon = config.icon;
  const colorClasses =
    config.color === "treatment"
      ? "bg-treatment/10 text-treatment border-treatment/20"
      : "bg-accent/10 text-accent border-accent/20";

  // ============================================================================
  // STRUCTURED DATA
  // ============================================================================

  const structuredData = [
    // BreadcrumbList
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Tools",
          item: `${siteConfig.url}/tools/`,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Best For",
          item: `${siteConfig.url}/tools/best-for/`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: config.namePlural,
          item: `${siteConfig.url}/tools/best-for/${specialty}/`,
        },
      ],
    },
    // WebPage
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: config.seoTitle,
      description: config.seoDescription,
      url: `${siteConfig.url}/tools/best-for/${specialty}/`,
      isPartOf: {
        "@type": "WebSite",
        name: siteConfig.name,
        url: siteConfig.url,
      },
      about: {
        "@type": "Thing",
        name: `Software for ${config.namePlural}`,
        description: config.description,
      },
    },
    // ItemList for top tools
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Best Software for ${config.namePlural}`,
      description: `Top-rated EHR and practice management software recommended for ${config.namePlural.toLowerCase()}`,
      numberOfItems: topTools.length,
      itemListElement: topTools.slice(0, 10).map((tool, idx) => ({
        "@type": "ListItem",
        position: idx + 1,
        item: {
          "@type": "SoftwareApplication",
          name: tool.name,
          applicationCategory: "HealthApplication",
          description: tool.short_description || tool.one_liner,
          url: `${siteConfig.url}/tools/for-clinicians/${SCHEMA_TO_TAXONOMY_CATEGORY[tool.primary_category] || tool.primary_category}/${tool.slug}/`,
          ...(tool.pricing?.starting_price_display && {
            offers: {
              "@type": "Offer",
              price: tool.pricing.starting_price_display,
              priceCurrency: "USD",
            },
          }),
        },
      })),
    },
  ];

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <>
      {/* Structured Data */}
      {structuredData.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="min-h-screen bg-canvas">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-separator bg-surface">
          <div className="absolute inset-0 bg-gradient-to-br from-treatment/[0.03] via-transparent to-accent/[0.02]" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-6 flex items-center gap-2 text-sm">
              <Link href="/tools/" className="text-label-secondary hover:text-treatment">
                Tools
              </Link>
              <span className="text-label-quaternary">/</span>
              <Link href="/tools/for-clinicians/" className="text-label-secondary hover:text-treatment">
                For Clinicians
              </Link>
              <span className="text-label-quaternary">/</span>
              <span className="text-label-primary font-medium">Best for {config.namePlural}</span>
            </nav>

            {/* Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${colorClasses}`}>
                <Icon className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-label-primary sm:text-3xl lg:text-4xl">
                  {config.headline}
                </h1>
                <p className="mt-1 text-sm text-label-tertiary">
                  {topTools.length} tools recommended for {config.namePlural.toLowerCase()}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="mt-4 rounded-xl border border-treatment/20 bg-treatment/5 p-5">
              <p className="text-lg text-label-primary leading-relaxed">{config.description}</p>
            </div>

            {/* Target Keywords (for SEO, visually subtle) */}
            <div className="mt-4 flex flex-wrap gap-2">
              {config.targetKeywords.slice(0, 3).map((keyword) => (
                <span
                  key={keyword}
                  className="rounded-full bg-canvas px-3 py-1 text-xs text-label-tertiary border border-separator"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="border-b border-separator bg-canvas px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-lg font-semibold text-label-primary mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 text-treatment" />
              Key Features for {config.namePlural}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {config.keyFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 rounded-lg bg-surface border border-separator px-4 py-3"
                >
                  <CheckCircle2 className="h-4 w-4 text-positive shrink-0" />
                  <span className="text-sm text-label-secondary">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Practice Architect CTA */}
        <section className="border-b border-separator bg-surface px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <ContextualArchitectCTA
              context={{
                source: "category",
                categorySlug: config.recommendedCategories[0],
                utmSource: `best-for-${specialty}`,
              }}
              variant="banner"
            />
          </div>
        </section>

        {/* Top Recommended Tools */}
        <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-label-primary">
                  Top Recommended for {config.namePlural}
                </h2>
                <p className="mt-1 text-sm text-label-secondary">
                  Software that best matches {config.name.toLowerCase()} workflows and requirements
                </p>
              </div>
              <Link
                href="/tools/for-clinicians/"
                className="hidden sm:flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
              >
                View all tools
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {topTools.map((tool, idx) => (
                <div key={tool.slug} className="relative">
                  {idx < 3 && (
                    <div className="absolute -top-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-treatment text-white text-xs font-bold">
                      {idx + 1}
                    </div>
                  )}
                  <ClinicianToolCard tool={tool} showCategory />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Best EHRs Section */}
        {ehrTools.length > 0 && (
          <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="flex items-center gap-2 mb-6">
                <Shield className="h-5 w-5 text-treatment" />
                <h2 className="text-xl font-semibold text-label-primary">
                  Best EHRs for {config.namePlural}
                </h2>
              </div>
              <p className="text-sm text-label-secondary mb-6">
                HIPAA-compliant electronic health record systems with features designed for {config.namePlural.toLowerCase()}
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {ehrTools.map((tool) => (
                  <ClinicianToolCard key={tool.slug} tool={tool} />
                ))}
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/tools/for-clinicians/ehr-practice-management/"
                  className="inline-flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
                >
                  See all EHR options
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* AI Scribes Section (for psychiatrists) */}
        {aiScribeTools.length > 0 && (
          <section className="border-b border-separator bg-canvas px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <div className="flex items-center gap-2 mb-6">
                <Bot className="h-5 w-5 text-purple-600" />
                <h2 className="text-xl font-semibold text-label-primary">
                  Best AI Scribes for {config.namePlural}
                </h2>
              </div>
              <p className="text-sm text-label-secondary mb-6">
                AI-powered clinical documentation tools that streamline note-taking for {config.namePlural.toLowerCase()}
              </p>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {aiScribeTools.map((tool) => (
                  <ClinicianToolCard key={tool.slug} tool={tool} />
                ))}
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/tools/for-clinicians/ai-scribe-documentation/"
                  className="inline-flex items-center gap-1 text-sm font-medium text-treatment hover:underline"
                >
                  See all AI scribes
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Selection Criteria */}
        <section className="border-b border-separator bg-surface px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-semibold text-label-primary mb-2">
              How to Choose Software as a {config.name}
            </h2>
            <p className="text-sm text-label-secondary mb-6">
              Key factors to consider when selecting practice technology
            </p>

            <div className="space-y-4">
              {config.selectionCriteria.map((criterion, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-separator bg-canvas p-4"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-treatment/10 text-treatment text-sm font-medium">
                    {idx + 1}
                  </div>
                  <p className="text-label-secondary">{criterion}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Get Personalized Recommendations CTA */}
        <section className="bg-gradient-to-br from-treatment/5 via-canvas to-accent/5 px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-treatment/10 mb-4">
              <Sparkles className="h-6 w-6 text-treatment" />
            </div>
            <h2 className="text-2xl font-bold text-label-primary mb-3">
              Get Personalized Recommendations
            </h2>
            <p className="text-label-secondary mb-6 max-w-2xl mx-auto">
              Answer a few questions about your practice and get a customized software stack
              recommendation from Practice Architect.
            </p>
            <Link
              href={`/architect/build?mode=build-for-me&utm_source=best-for-${specialty}&utm_medium=cta`}
              className="inline-flex items-center gap-2 rounded-lg bg-treatment px-6 py-3 text-sm font-medium text-white transition-all hover:bg-treatment-600"
            >
              Start Practice Architect
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Browse Other Specialties */}
        <section className="bg-canvas px-4 py-8 sm:px-6 lg:px-8 border-t border-separator">
          <div className="mx-auto max-w-6xl">
            <h3 className="text-sm font-medium text-label-tertiary uppercase tracking-wider mb-4">
              Software for Other Specialties
            </h3>
            <div className="flex flex-wrap gap-3">
              {Object.entries(SPECIALTY_CONFIGS)
                .filter(([slug]) => slug !== specialty)
                .map(([slug, cfg]) => (
                  <Link
                    key={slug}
                    href={`/tools/best-for/${slug}/`}
                    className="flex items-center gap-2 rounded-lg border border-separator bg-surface px-4 py-2 text-sm text-label-secondary hover:border-treatment/30 hover:text-treatment transition-colors"
                  >
                    {cfg.namePlural}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export const revalidate = 3600; // Revalidate every hour
