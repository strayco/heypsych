/**
 * Clinician tool experience model
 *
 * Turns a V4 clinician tool record into what the interactive profile page
 * shows. Pure, and limited to the record. Compliance and capability claims
 * are vendor-reported unless the record carries provenance; nothing here
 * upgrades a claim. EPCS in particular is always shown as requiring
 * verification, with the same sentence every other surface uses.
 */

import type { ClinicianToolV4, PositioningSegment } from "@/lib/schemas/clinician-tool-v4";
import { getOrgSizeLabel, getRoleLabel, getSettingLabel } from "@/lib/schemas/clinician-tool-v4";
import { SEGMENT_LABELS } from "@/lib/tools/alternatives";
import { EPCS_UNVERIFIED_DETAIL, EPCS_UNVERIFIED_HEADLINE } from "@/domains/architect/engines/eligibility-engine";

export interface FitSegment {
  id: PositioningSegment;
  label: string;
  note: string;
}

export interface PriceOption {
  id: string;
  name: string;
  price: string | null;
  /** Monthly cents per provider, when the record states one. */
  perProviderCents: number | null;
  /** Flat monthly cents, when the record states one. */
  flatCents: number | null;
  description: string | null;
}

export interface ComplianceItem {
  id: "hipaa" | "baa" | "soc2" | "hitrust";
  label: string;
  state: "yes" | "no" | "unknown" | "na";
  /** "SOC 2 Type 2" style detail, when known. */
  detail: string | null;
  source: { url: string; date: string | null; status: string | null } | null;
}

export interface CapabilityGroup {
  id: string;
  label: string;
  items: string[];
}

export interface ClinicianToolExperience {
  name: string;
  company: string | null;
  oneLiner: string | null;
  categoryLabel: string | null;
  facts: string[];
  glance: { id: string; label: string; value: string; href: string; tone: "neutral" | "caution" }[];
  fit: FitSegment[];
  bestFor: string[];
  notFor: string[];
  audience: { roles: string[]; settings: string[]; sizes: string[] };
  pricing: {
    display: string | null;
    model: string | null;
    perProvider: boolean;
    options: PriceOption[];
    addOns: { id: string; label: string; price: string | null; description: string | null }[];
    fees: { label: string; value: string }[];
    freeTier: boolean;
    trialDays: number;
    quoteRequired: boolean;
    notes: string | null;
    lastVerified: string | null;
    url: string | null;
  };
  capabilities: CapabilityGroup[];
  compliance: ComplianceItem[];
  epcs: { claimed: boolean; headline: string; detail: string } | null;
  integrations: { name: string; type: string | null; verified: boolean; notes: string | null }[];
}

// ---------------------------------------------------------------------------

const MODEL_LABELS: Record<string, string> = {
  free: "Free",
  freemium: "Free plan + paid tiers",
  "per-provider-month": "Per provider, monthly",
  "per-provider-year": "Per provider, yearly",
  "per-patient": "Per patient",
  "per-encounter": "Per session",
  "flat-monthly": "Flat monthly",
  "flat-annual": "Flat yearly",
  "enterprise-custom": "Quote",
  "usage-based": "Pay as you go",
  "revenue-share": "Share of revenue",
};

const CAPABILITY_LABELS: Record<string, string> = {
  "clinical-notes": "Clinical notes",
  "treatment-planning": "Treatment plans",
  "document-management": "Documents",
  "lab-integration": "Lab results",
  "appointment-scheduling": "Scheduling",
  "patient-portal": "Client portal",
  "secure-messaging": "Secure messaging",
  "calendar-sync": "Calendar sync",
  "waiting-room": "Virtual waiting room",
  "mobile-app": "Mobile app",
  "claims-submission": "Insurance claims",
  "eligibility-verification": "Eligibility checks",
  "prior-authorization": "Prior authorization",
  "payment-processing": "Card payments",
  "denial-management": "Denial follow-up",
  "coding-assistance": "Coding help",
  "patient-financing": "Payment plans",
  "billing-rcm": "Billing / revenue cycle",
  coding: "Coding",
  accounting: "Bookkeeping",
  "payroll-compensation": "Payroll",
  "video-sessions": "Video sessions",
  "async-video": "Async video",
  telehealth: "Telehealth",
  "ambient-listening": "Ambient listening",
  "note-generation": "AI note drafting",
  "clinical-summarization": "Session summaries",
  "voice-transcription": "Dictation",
  "ai-suggestions": "AI suggestions",
  "outcome-tracking": "Outcome tracking",
  "phq9-gad7": "PHQ-9 / GAD-7",
  "custom-assessments": "Custom assessments",
  "progress-monitoring": "Progress monitoring",
  "reporting-dashboards": "Reports",
  "analytics-bi": "Analytics",
  "e-prescribing": "E-prescribing",
  "epcs-controlled": "Controlled-substance e-prescribing (EPCS)",
  "pdmp-integration": "PDMP checks",
  "drug-interaction-check": "Interaction checks",
  "medication-history": "Medication history",
  "ehr-integration": "EHR integration",
  "api-access": "API",
  "hl7-fhir": "HL7 / FHIR",
  "zapier-integration": "Zapier",
  "hipaa-compliant": "HIPAA support (vendor-stated)",
  "baa-available": "BAA offered (vendor-stated)",
  "audit-logging": "Audit log",
  "consent-management": "Consent forms",
  "sso-authentication": "Single sign-on",
  "compliance-security": "Security tools",
  "patient-acquisition": "Client acquisition",
  "reputation-reviews": "Reviews",
  "referral-management": "Referrals",
  "crm-lead-management": "Lead management",
  "clinical-supervision": "Supervision",
  "quality-assurance": "Quality assurance",
  "workforce-management": "Staff management",
};

const CAPABILITY_GROUPS: { id: string; label: string; members: string[] }[] = [
  { id: "clinical", label: "Clinical work", members: ["clinical-notes", "treatment-planning", "document-management", "lab-integration", "clinical-supervision", "quality-assurance"] },
  { id: "clients", label: "Clients & scheduling", members: ["appointment-scheduling", "patient-portal", "secure-messaging", "calendar-sync", "waiting-room", "mobile-app", "consent-management"] },
  { id: "billing", label: "Billing & money", members: ["claims-submission", "eligibility-verification", "prior-authorization", "payment-processing", "denial-management", "coding-assistance", "patient-financing", "billing-rcm", "coding", "accounting", "payroll-compensation"] },
  { id: "telehealth", label: "Telehealth", members: ["video-sessions", "async-video", "telehealth"] },
  { id: "ai", label: "AI documentation", members: ["ambient-listening", "note-generation", "clinical-summarization", "voice-transcription", "ai-suggestions"] },
  { id: "measurement", label: "Measurement", members: ["outcome-tracking", "phq9-gad7", "custom-assessments", "progress-monitoring", "reporting-dashboards", "analytics-bi"] },
  { id: "prescribing", label: "Prescribing", members: ["e-prescribing", "epcs-controlled", "pdmp-integration", "drug-interaction-check", "medication-history"] },
  { id: "connect", label: "Connections", members: ["ehr-integration", "api-access", "hl7-fhir", "zapier-integration"] },
  { id: "security", label: "Security", members: ["hipaa-compliant", "baa-available", "audit-logging", "sso-authentication", "compliance-security"] },
  { id: "growth", label: "Growing the practice", members: ["patient-acquisition", "reputation-reviews", "referral-management", "crm-lead-management", "workforce-management"] },
];

const ADD_ON_LABELS: Record<string, string> = {
  e_prescribing: "E-prescribing",
  care_aide_ai: "AI notes",
  wiley_treatment_planners: "Wiley treatment planners",
  ai_scribe: "AI notes",
  ai_notes: "AI notes",
  ai_assist: "AI assist",
  telehealth: "Telehealth",
};

const FEE_LABELS: Record<string, string> = {
  payment_processing: "Card payments",
  credit_card: "Card payments",
  electronic_claims: "Insurance claims",
  paper_claims: "Paper claims",
  eligibility_checks: "Eligibility checks",
  appointment_reminders: "Reminders",
  client_portal: "Client portal",
  document_storage: "Storage",
  monthly_fee: "Monthly fee",
  setup_fee: "Setup",
  cancellation_fee: "Cancellation",
};

function plain(key: string): string {
  const words = key.replace(/[_-]+/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

function complianceState(value: unknown): ComplianceItem["state"] {
  if (value === true || value === "yes") return "yes";
  if (value === false || value === "no") return "no";
  if (value === "not_applicable") return "na";
  return "unknown";
}

function provenance(value: unknown): ComplianceItem["source"] {
  if (!value || typeof value !== "object") return null;
  const p = value as { source_url?: string; verified_date?: string; status?: string };
  return p.source_url ? { url: p.source_url, date: p.verified_date ?? null, status: p.status ?? null } : null;
}

const STATUS_WORDS: Record<string, string> = {
  verified: "Verified",
  vendor_provided: "Vendor states",
  public_source: "Public source",
  unverified: "Unverified",
};
export function provenanceLabel(status: string | null): string {
  return (status && STATUS_WORDS[status]) || "Source";
}

// ---------------------------------------------------------------------------

export function buildClinicianToolExperience(
  tool: ClinicianToolV4,
  categoryLabel: string | null = null
): ClinicianToolExperience {
  const p = tool.pricing;
  const c = tool.compliance;
  const perProvider = p?.model === "per-provider-month";

  const options: PriceOption[] = (p?.tiers ?? []).map((tier, i) => {
    const cents = typeof tier.price_cents === "number" && tier.price_cents > 0 ? tier.price_cents : null;
    const isMonthly = /\/\s*mo|month/i.test(tier.price ?? "") || perProvider;
    return {
      id: `tier-${i}`,
      name: tier.name,
      price: tier.price ?? null,
      perProviderCents: perProvider && cents ? cents : null,
      flatCents: !perProvider && cents && isMonthly ? cents : null,
      description: tier.description ?? null,
    };
  });

  const epcsClaimed = tool.capabilities.includes("epcs-controlled");
  const capabilities = CAPABILITY_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    items: g.members.filter((m) => tool.capabilities.includes(m as never)).map((m) => CAPABILITY_LABELS[m] ?? plain(m)),
  })).filter((g) => g.items.length > 0);
  const grouped = new Set(CAPABILITY_GROUPS.flatMap((g) => g.members));
  const others = tool.capabilities.filter((cap) => !grouped.has(cap)).map((cap) => CAPABILITY_LABELS[cap] ?? plain(cap));
  if (others.length > 0) capabilities.push({ id: "other", label: "Other", items: others });

  const compliance: ComplianceItem[] = [
    { id: "hipaa", label: "HIPAA support", state: complianceState(c?.hipaa_support), detail: null, source: provenance(c?.hipaa_provenance) },
    { id: "baa", label: "Signs a BAA", state: complianceState(c?.baa_available), detail: null, source: provenance(c?.baa_provenance) },
    {
      id: "soc2",
      label: "SOC 2",
      state: complianceState(c?.soc2),
      detail: c?.soc2_type === "type2" ? "Type 2" : c?.soc2_type === "type1" ? "Type 1" : null,
      source: provenance(c?.soc2_provenance),
    },
    { id: "hitrust", label: "HITRUST", state: complianceState(c?.hitrust), detail: null, source: provenance(c?.hitrust_provenance) },
  ];

  const segments = tool.positioning?.segments ?? [];
  const fit = segments
    .map((id) => ({ id, label: SEGMENT_LABELS[id]?.label ?? plain(id), note: tool.positioning?.notes?.[id] ?? "" }))
    .filter((s) => s.note);

  const facts = [
    p?.starting_price_display ? `From ${p.starting_price_display}` : p?.quote_required ? "Pricing by quote" : null,
    p?.model ? MODEL_LABELS[p.model] ?? plain(p.model) : null,
    (p?.free_trial_days ?? 0) > 0 ? `${p!.free_trial_days}-day trial` : p?.free_tier ? "Free plan" : null,
    c?.baa_available === "yes" ? "Signs a BAA" : c?.baa_available === "no" ? "No BAA" : null,
    epcsClaimed ? EPCS_UNVERIFIED_HEADLINE : null,
  ].filter((f): f is string => Boolean(f));

  const firstFit = fit[0];
  const glance: ClinicianToolExperience["glance"] = [];
  if (firstFit) glance.push({ id: "fit", label: firstFit.label, value: firstFit.note, href: "#fit", tone: "neutral" });
  if (p?.starting_price_display || p?.quote_required) {
    glance.push({
      id: "price",
      label: "What it costs",
      value: [p?.starting_price_display ?? "By quote", (p?.free_trial_days ?? 0) > 0 ? `${p!.free_trial_days}-day trial` : null].filter(Boolean).join(" · "),
      href: "#pricing",
      tone: "neutral",
    });
  }
  if (tool.not_for?.[0]) {
    glance.push({ id: "not", label: "Probably not for", value: tool.not_for[0], href: "#fit", tone: "caution" });
  }

  return {
    name: tool.name,
    company: tool.company_name ?? null,
    oneLiner: tool.one_liner ?? tool.short_description ?? null,
    categoryLabel,
    facts,
    glance,
    fit,
    bestFor: tool.best_for ?? [],
    notFor: tool.not_for ?? [],
    audience: {
      roles: (tool.audiences?.clinician_roles ?? []).map(getRoleLabel),
      settings: (tool.audiences?.practice_settings ?? []).map(getSettingLabel),
      sizes: (tool.audiences?.organization_sizes ?? []).map(getOrgSizeLabel),
    },
    pricing: {
      display: p?.starting_price_display ?? null,
      model: p?.model ? MODEL_LABELS[p.model] ?? plain(p.model) : null,
      perProvider,
      options,
      addOns: Object.entries(p?.add_ons ?? {}).map(([id, a]) => ({
        id,
        label: ADD_ON_LABELS[id] ?? plain(id),
        price: a.price_display ?? null,
        description: a.description ?? null,
      })),
      fees: Object.entries(p?.transaction_fees ?? {})
        .filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0)
        .map(([key, value]) => ({ label: FEE_LABELS[key] ?? plain(key), value })),
      freeTier: Boolean(p?.free_tier),
      trialDays: p?.free_trial_days ?? 0,
      quoteRequired: Boolean(p?.quote_required),
      notes: p?.notes ?? null,
      lastVerified: p?.last_verified ?? null,
      url: tool.pricing_url ?? null,
    },
    capabilities,
    compliance,
    epcs: epcsClaimed ? { claimed: true, headline: EPCS_UNVERIFIED_HEADLINE, detail: EPCS_UNVERIFIED_DETAIL } : null,
    integrations: (tool.integrations ?? []).map((i) => ({
      name: i.name,
      type: i.integration_type ?? null,
      verified: Boolean(i.verified),
      notes: i.notes ?? null,
    })),
  };
}

/** "$1,234" from cents, no decimals unless needed. */
export function formatCents(cents: number): string {
  const dollars = cents / 100;
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(dollars) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
