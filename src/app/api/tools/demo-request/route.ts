// src/app/api/tools/demo-request/route.ts
// API route for handling demo request form submissions

import { NextRequest, NextResponse } from "next/server";
import { DemoRequestZ } from "@/lib/tools/demo-request";
import { supabaseServiceRole, SUPABASE_UNAVAILABLE } from "@/lib/config/database";
import {
  ClinicianToolService,
  isToolPublishable,
} from "@/lib/tools/clinician-tool-service";
import { notifyDemoRequestDual } from "@/lib/notifications/demo-request-notifier";

// ============================================================================
// P0-7: RATE LIMITING & BOT DEFENSE
// ============================================================================

// Simple in-memory rate limit store (resets on deploy/restart)
// For production scale, use Redis or a dedicated rate limiting service
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Rate limit config
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX_REQUESTS = 5; // 5 requests per hour per IP
const MIN_FORM_COMPLETION_MS = 3000; // Minimum 3 seconds to fill form (bot defense)

function getRateLimitKey(request: NextRequest): string {
  // Use X-Forwarded-For in production (behind proxy), fallback to request IP
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
  return `demo-request:${ip}`;
}

function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  // Clean up expired records
  if (record && record.resetAt < now) {
    rateLimitStore.delete(key);
  }

  const current = rateLimitStore.get(key);

  if (!current) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 };
  }

  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  current.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - current.count };
}

// Sanitize string input (basic XSS prevention)
function sanitizeString(input: string | undefined): string | undefined {
  if (!input) return input;
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    // P0-7: Rate limiting check
    const rateLimitKey = getRateLimitKey(request);
    const rateLimit = checkRateLimit(rateLimitKey);

    if (!rateLimit.allowed) {
      console.warn("[Demo Request] Rate limit exceeded:", rateLimitKey);
      return NextResponse.json(
        {
          success: false,
          error: "Too many requests. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": "3600",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = DemoRequestZ.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: parseResult.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // P0-7: Bot defense - honeypot check
    // The "website" field is a honeypot - real users won't fill it
    if (data.website && data.website.length > 0) {
      console.warn("[Demo Request] Honeypot triggered - likely bot");
      // Return success to not tip off bots, but don't process
      return NextResponse.json({
        success: true,
        message: "Demo request submitted successfully!",
        id: `hp-${Date.now()}`,
      });
    }

    // P0-7: Bot defense - timing validation
    const now = Date.now();
    const MAX_FORM_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours max

    // Validate formLoadedAt is sensible
    if (
      data.formLoadedAt <= 0 ||
      data.formLoadedAt > now || // Future timestamp
      data.formLoadedAt < now - MAX_FORM_AGE_MS // Implausibly old
    ) {
      console.warn("[Demo Request] Invalid formLoadedAt:", data.formLoadedAt);
      // Return fake success to not tip off bots
      return NextResponse.json({
        success: true,
        message: "Demo request submitted successfully!",
        id: `iv-${Date.now()}`, // iv = invalid
      });
    }

    // Check minimum time taken
    const timeTaken = now - data.formLoadedAt;
    if (timeTaken < MIN_FORM_COMPLETION_MS) {
      console.warn("[Demo Request] Form submitted too fast:", timeTaken, "ms");
      // Return success to not tip off bots, but don't process
      return NextResponse.json({
        success: true,
        message: "Demo request submitted successfully!",
        id: `tm-${Date.now()}`,
      });
    }

    // P0-7: Sanitize user input strings
    data.firstName = sanitizeString(data.firstName) || data.firstName;
    data.lastName = sanitizeString(data.lastName) || data.lastName;
    // Mission REPAIR: Normalize email (trim + lowercase) for idempotency
    data.email = data.email.trim().toLowerCase();
    data.email = sanitizeString(data.email) || data.email;
    data.phone = sanitizeString(data.phone);
    data.practiceName = sanitizeString(data.practiceName);
    data.message = sanitizeString(data.message);

    // P0-5 FIX: Validate tool slug against canonical records
    // This prevents demo requests for non-existent or unpublished tools
    const tool = await ClinicianToolService.getBySlug(data.toolSlug);

    if (!tool) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid tool selected",
          details: [{ field: "toolSlug", message: "Tool not found" }],
        },
        { status: 400 }
      );
    }

    if (!isToolPublishable(tool)) {
      return NextResponse.json(
        {
          success: false,
          error: "This tool is not currently available for demo requests",
          details: [{ field: "toolSlug", message: "Tool not available" }],
        },
        { status: 400 }
      );
    }

    // Verify tool name matches (prevent spoofing)
    if (tool.name !== data.toolName) {
      console.warn("[Demo Request] Tool name mismatch:", {
        providedName: data.toolName,
        actualName: tool.name,
        slug: data.toolSlug,
      });
      // Silently fix the name to canonical value
      data.toolName = tool.name;
    }

    // P0-8 FIX: Use service role client for server-only writes
    // This bypasses RLS and ensures only the server can write to demo_requests
    const db = supabaseServiceRole();

    if (!db || SUPABASE_UNAVAILABLE) {
      // P0-6 FIX: Return proper 503 error instead of fake success
      console.error("[Demo Request] Database unavailable, cannot process request");

      return NextResponse.json(
        {
          success: false,
          error: "Our demo request system is temporarily unavailable. Please try again later or contact us directly.",
        },
        { status: 503 }
      );
    }

    // Insert into database
    const { data: insertedRow, error } = await db
      .from("demo_requests")
      .insert({
        email: data.email,
        first_name: data.firstName,
        last_name: data.lastName,
        phone: data.phone || null,
        practice_name: data.practiceName || null,
        practice_size: data.practiceSize,
        practice_setting: data.practiceSetting,
        role: data.role,
        tool_slug: data.toolSlug,
        tool_name: data.toolName,
        message: data.message || null,
        timeline: data.timeline || null,
        utm_source: data.utmSource || null,
        utm_medium: data.utmMedium || null,
        utm_campaign: data.utmCampaign || null,
        matcher_source: data.matcherSource || false,
        agreed_to_terms: data.agreedToTerms,
        marketing_consent: data.marketingConsent || false,
        status: "new",
      })
      .select("id")
      .single();

    if (error) {
      console.error("[Demo Request] Database error:", error);

      // Handle duplicate email for same tool
      if (error.code === "23505") {
        return NextResponse.json({
          success: true,
          message: "You've already requested a demo for this tool. We'll be in touch soon!",
          duplicate: true,
        });
      }

      return NextResponse.json(
        {
          success: false,
          error: "Failed to submit demo request. Please try again.",
        },
        { status: 500 }
      );
    }

    // Send notifications (awaited but non-blocking on failure)
    const requestId = insertedRow?.id || `unknown-${Date.now()}`;

    // Await notifications so we can track their status
    const notificationResult = await notifyDemoRequestDual(data, requestId);

    // Update database with notification status (best effort, don't fail the request)
    // IMPORTANT: Supabase doesn't throw on query errors - must check error in response
    const { error: notificationUpdateError } = await db
      .from("demo_requests")
      .update({
        notification_status_operator: notificationResult.operator.success ? "sent" : "failed",
        notification_status_buyer: notificationResult.buyer.success ? "sent" : "failed",
        notification_sent_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (notificationUpdateError) {
      // Log but don't fail - the demo request was already saved
      console.error("[Demo Request] Failed to update notification status:", notificationUpdateError);
    }

    // Log any notification failures for monitoring
    if (!notificationResult.operator.success) {
      console.error("[Demo Request] Operator notification failed:", notificationResult.operator.error);
    }
    if (!notificationResult.buyer.success) {
      console.error("[Demo Request] Buyer confirmation failed:", notificationResult.buyer.error);
    }

    return NextResponse.json({
      success: true,
      message: "Demo request submitted successfully! We'll be in touch within 1 business day.",
      id: insertedRow?.id,
    });
  } catch (error) {
    console.error("[Demo Request] Unexpected error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}

