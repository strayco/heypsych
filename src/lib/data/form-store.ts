/**
 * Server-side writes for the site's forms (newsletter, leads, demo requests).
 *
 * Uses the direct Postgres connection (db-pool) first. That path does not go
 * through Supabase's API gateway, so forms keep working when the REST API is
 * unavailable (e.g. the project is restricted for exceeding a quota). Falls
 * back to the service-role REST client if the direct connection fails.
 *
 * Both paths bypass RLS by design: these tables have RLS with no public
 * policies (migrations 040, 044, 045), so only the server can touch them.
 * Server-only module.
 */

import { queryWithRetry } from "@/lib/config/db-pool";
import { supabaseServiceRole } from "@/lib/config/database";

const RETRIES = 1;
const TIMEOUT_MS = 8000;

async function direct<T = Record<string, unknown>>(sql: string, params: unknown[]) {
  return queryWithRetry<T>(sql, params as never[], RETRIES, TIMEOUT_MS);
}

function rest() {
  const db = supabaseServiceRole();
  if (!db) throw new Error("No database connection available");
  return db;
}

// ---------------------------------------------------------------------------
// Newsletter

export type SubscribeResult = "subscribed" | "resubscribed" | "already";

export async function subscribeNewsletter(email: string): Promise<SubscribeResult> {
  try {
    const { rows } = await direct<{ subscribed: boolean }>(
      "select subscribed from newsletter_subscribers where email = $1 limit 1",
      [email]
    );
    if (rows[0]?.subscribed) return "already";
    if (rows[0]) {
      await direct("update newsletter_subscribers set subscribed = true where email = $1", [email]);
      return "resubscribed";
    }
    await direct("insert into newsletter_subscribers (email, subscribed) values ($1, true)", [email]);
    return "subscribed";
  } catch (directError) {
    console.warn("[form-store] direct newsletter write failed, trying REST:", (directError as Error).message);
    const db = rest();
    const { data: existing, error: checkError } = await db
      .from("newsletter_subscribers")
      .select("email, subscribed")
      .eq("email", email)
      .maybeSingle();
    if (checkError) throw checkError;
    if (existing?.subscribed) return "already";
    if (existing) {
      const { error } = await db.from("newsletter_subscribers").update({ subscribed: true }).eq("email", email);
      if (error) throw error;
      return "resubscribed";
    }
    const { error } = await db.from("newsletter_subscribers").insert({ email, subscribed: true });
    if (error) throw error;
    return "subscribed";
  }
}

// ---------------------------------------------------------------------------
// Leads

export interface LeadRow {
  email: string;
  intent: string;
  product_slugs: string[] | null;
  category_slug: string | null;
  switching_from: string | null;
  source_path: string | null;
  referrer: string | null;
  score: number;
  tier: string;
}

export async function insertLead(lead: LeadRow): Promise<void> {
  try {
    await direct(
      `insert into leads (email, intent, product_slugs, category_slug, switching_from, source_path, referrer, score, tier)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [lead.email, lead.intent, lead.product_slugs, lead.category_slug, lead.switching_from, lead.source_path, lead.referrer, lead.score, lead.tier]
    );
  } catch (directError) {
    console.warn("[form-store] direct lead write failed, trying REST:", (directError as Error).message);
    const { error } = await rest().from("leads").insert(lead);
    if (error) throw error;
  }
}

// ---------------------------------------------------------------------------
// Demo requests

export interface DemoRequestRow {
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
  status: string;
}

/** Error with a Postgres code (e.g. "23505" for a duplicate). */
export class FormStoreError extends Error {
  constructor(message: string, readonly code?: string) {
    super(message);
  }
}

const DEMO_COLUMNS: (keyof DemoRequestRow)[] = [
  "email", "first_name", "last_name", "phone", "practice_name", "practice_size", "practice_setting", "role",
  "tool_slug", "tool_name", "message", "timeline", "utm_source", "utm_medium", "utm_campaign",
  "matcher_source", "agreed_to_terms", "marketing_consent", "status",
];

export async function insertDemoRequest(row: DemoRequestRow): Promise<string> {
  try {
    const placeholders = DEMO_COLUMNS.map((_, i) => `$${i + 1}`).join(", ");
    const { rows } = await direct<{ id: string }>(
      `insert into demo_requests (${DEMO_COLUMNS.join(", ")}) values (${placeholders}) returning id`,
      DEMO_COLUMNS.map((c) => row[c])
    );
    return rows[0]?.id ?? `unknown-${Date.now()}`;
  } catch (directError) {
    const code = (directError as { code?: string }).code;
    if (code === "23505") throw new FormStoreError("duplicate", code);
    console.warn("[form-store] direct demo request write failed, trying REST:", (directError as Error).message);
    const { data, error } = await rest().from("demo_requests").insert(row).select("id").single();
    if (error) throw new FormStoreError(error.message, error.code);
    return data?.id ?? `unknown-${Date.now()}`;
  }
}

export async function updateDemoNotificationStatus(
  id: string,
  operatorSent: boolean,
  buyerSent: boolean
): Promise<void> {
  const values = {
    notification_status_operator: operatorSent ? "sent" : "failed",
    notification_status_buyer: buyerSent ? "sent" : "failed",
    notification_sent_at: new Date().toISOString(),
  };
  try {
    await direct(
      `update demo_requests set notification_status_operator = $2, notification_status_buyer = $3, notification_sent_at = $4 where id = $1`,
      [id, values.notification_status_operator, values.notification_status_buyer, values.notification_sent_at]
    );
  } catch {
    const { error } = await rest().from("demo_requests").update(values).eq("id", id);
    if (error) throw error;
  }
}
