// src/app/api/tools/demo-request/route.ts
// API route for handling demo request form submissions

import { NextRequest, NextResponse } from "next/server";
import { DemoRequestZ } from "@/lib/tools/demo-request";
import { FormStoreError, insertDemoRequest, updateDemoNotificationStatus } from "@/lib/data/form-store";
import {
  ClinicianToolService,
  isToolPublishable,
} from "@/lib/tools/clinician-tool-service";
import { notifyDemoRequestDual } from "@/lib/notifications/demo-request-notifier";
import { checkRateLimitStrict, demoRequestRateLimit } from "@/lib/rate-limit";

// ============================================================================
// P0-7: RATE LIMITING & BOT DEFENSE
// ============================================================================

const MIN_FORM_COMPLETION_MS = 3000; // Minimum 3 seconds to fill form (bot defense)

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
    // P0-7: Rate limiting - fails closed if Redis unavailable (prevents email abuse)
    const rateLimitResponse = await checkRateLimitStrict(request, demoRequestRateLimit);
    if (rateLimitResponse) {
      console.warn("[Demo Request] Rate limit exceeded");
      return rateLimitResponse;
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

    // Server-only write: direct connection first, service-role fallback.
    let requestId: string;
    try {
      requestId = await insertDemoRequest({
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
      });
    } catch (error) {
      if (error instanceof FormStoreError && error.code === "23505") {
        return NextResponse.json({
          success: true,
          message: "You've already requested a demo for this tool. We'll be in touch soon!",
          duplicate: true,
        });
      }
      console.error("[Demo Request] Database error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to submit demo request. Please try again." },
        { status: 500 }
      );
    }

    // Send notifications (awaited but non-blocking on failure)
    const notificationResult = await notifyDemoRequestDual(data, requestId);

    // Record notification status (best effort; the request is already saved)
    try {
      await updateDemoNotificationStatus(requestId, notificationResult.operator.success, notificationResult.buyer.success);
    } catch (notificationUpdateError) {
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
      id: requestId,
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

