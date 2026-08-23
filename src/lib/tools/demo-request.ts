// src/lib/tools/demo-request.ts
// Demo Request types and validation

import { z } from "zod";

// ============================================================================
// DEMO REQUEST SCHEMA
// ============================================================================

export const DemoRequestZ = z.object({
  // Contact Info
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  phone: z.string().optional(),

  // Practice Info
  practiceName: z.string().optional(),
  practiceSize: z.enum(
    [
      "solo",
      "small-2-10",
      "medium-11-50",
      "large-51-200",
      "enterprise-200-plus",
    ],
    { error: "Please select your practice size" }
  ),
  practiceSetting: z.enum(
    [
      "solo-practice",
      "group-practice",
      "community-mental-health",
      "hospital-inpatient",
      "telehealth-only",
      "multi-site-enterprise",
      "integrated-care",
      "residential-treatment",
    ],
    { error: "Please select your practice setting" }
  ),
  role: z.enum(
    [
      "psychiatrist",
      "psychologist",
      "therapist-lcsw-lmft",
      "psychiatric-np-pa",
      "practice-administrator",
      "billing-specialist",
      "care-coordinator",
      "medical-director",
      "other",
    ],
    { error: "Please select your role" }
  ),

  // Intent
  toolSlug: z.string().min(1, "Tool is required"),
  toolName: z.string().min(1, "Tool name is required"),
  message: z.string().max(1000).optional(),
  timeline: z.enum([
    "asap",
    "1-3-months",
    "3-6-months",
    "exploring",
  ]).optional(),

  // Attribution
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  matcherSource: z.boolean().optional(), // Came from EHR matcher

  // Consent
  agreedToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms",
  }),
  marketingConsent: z.boolean().optional(),

  // Security / Bot Defense (P0-7)
  // Honeypot field - should be empty for real users, bots fill it
  // Schema allows any value so API can detect and silently reject
  website: z.string().optional(),
  // Form load timestamp - required for timing defense
  formLoadedAt: z.number(),
});

export type DemoRequest = z.infer<typeof DemoRequestZ>;

// ============================================================================
// DATABASE ROW TYPE
// ============================================================================

export interface DemoRequestRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  practice_name: string | null;
  practice_size: string;
  practice_setting: string;
  role: string;
  tool_slug: string;
  tool_name: string;
  message: string | null;
  timeline: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  matcher_source: boolean;
  agreed_to_terms: boolean;
  marketing_consent: boolean;
  status: "new" | "contacted" | "qualified" | "converted" | "closed";
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DISPLAY LABELS
// ============================================================================

export const PRACTICE_SIZE_LABELS: Record<DemoRequest["practiceSize"], string> = {
  solo: "Solo (1 provider)",
  "small-2-10": "Small (2-10 providers)",
  "medium-11-50": "Medium (11-50 providers)",
  "large-51-200": "Large (51-200 providers)",
  "enterprise-200-plus": "Enterprise (200+)",
};

export const PRACTICE_SETTING_LABELS: Record<DemoRequest["practiceSetting"], string> = {
  "solo-practice": "Private Practice",
  "group-practice": "Group Practice",
  "community-mental-health": "Community Mental Health",
  "hospital-inpatient": "Hospital / Inpatient",
  "telehealth-only": "Telehealth Only",
  "multi-site-enterprise": "Multi-Site Enterprise",
  "integrated-care": "Integrated Care",
  "residential-treatment": "Residential Treatment",
};

export const ROLE_LABELS: Record<DemoRequest["role"], string> = {
  psychiatrist: "Psychiatrist",
  psychologist: "Psychologist",
  "therapist-lcsw-lmft": "Therapist (LCSW/LMFT)",
  "psychiatric-np-pa": "Psychiatric NP/PA",
  "practice-administrator": "Practice Administrator",
  "billing-specialist": "Billing Specialist",
  "care-coordinator": "Care Coordinator",
  "medical-director": "Medical Director",
  other: "Other",
};

export const TIMELINE_LABELS: Record<NonNullable<DemoRequest["timeline"]>, string> = {
  asap: "As soon as possible",
  "1-3-months": "1-3 months",
  "3-6-months": "3-6 months",
  exploring: "Just exploring",
};
