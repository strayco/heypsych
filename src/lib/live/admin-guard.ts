/**
 * HeyPsych Admin API guard, shared by the live-update routes.
 *
 * Reads need the existing admin session (signed HttpOnly cookie; fails closed
 * without ADMIN_PASSWORD). Writes also need a same-origin request (CSRF) and
 * a body under MAX_BODY. Responses are never cached.
 */

import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";

export const MAX_BODY = 256 * 1024;

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });
}

export async function guard(request: NextRequest, write: boolean): Promise<NextResponse | null> {
  if (!(await isAdminAuthenticated())) return json({ error: "Not signed in" }, 401);
  if (write) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (!origin || !host || new URL(origin).host !== host) return json({ error: "Cross-site request refused" }, 403);
    const length = Number(request.headers.get("content-length") ?? 0);
    if (length > MAX_BODY) return json({ error: "Request too large" }, 413);
  }
  return null;
}

export function dbConfigured() {
  return Boolean(process.env.SUPABASE_DB_URL || process.env.DATABASE_URL);
}
