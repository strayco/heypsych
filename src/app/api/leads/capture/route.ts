/**
 * Lead Capture API
 *
 * Captures email leads with intent signals and context.
 * Stores in Supabase for lead qualification and CRM sync.
 *
 * POST /api/leads/capture
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, leadCaptureRateLimit } from "@/lib/rate-limit";
import { supabaseServiceRole, supabaseOptional } from "@/lib/config/database";

// ============================================================================
// VALIDATION
// ============================================================================

const LeadCaptureSchema = z.object({
  email: z.string().email("Invalid email address"),
  intent: z.enum([
    "newsletter",
    "product-interest",
    "comparison-interest",
    "demo-request",
    "pricing-interest",
    "switching",
    "content-download",
    "architect-save",
  ]),
  productSlugs: z.array(z.string()).optional(),
  categorySlug: z.string().optional(),
  switchingFrom: z.string().optional(),
  source: z.string().optional(),
  referrer: z.string().optional(),
});

type LeadCapture = z.infer<typeof LeadCaptureSchema>;

// ============================================================================
// LEAD SCORING
// ============================================================================

function calculateLeadScore(lead: LeadCapture): number {
  let score = 0;

  // Intent scoring (0-40 points)
  const intentScores: Record<LeadCapture["intent"], number> = {
    newsletter: 10,
    "content-download": 15,
    "product-interest": 25,
    "comparison-interest": 30,
    "pricing-interest": 35,
    "architect-save": 35,
    switching: 40,
    "demo-request": 40,
  };
  score += intentScores[lead.intent];

  // Product specificity (0-20 points)
  if (lead.productSlugs && lead.productSlugs.length > 0) {
    score += Math.min(20, lead.productSlugs.length * 10);
  }

  // Category context (0-10 points)
  if (lead.categorySlug) {
    score += 10;
  }

  // Switching intent (0-20 points)
  if (lead.switchingFrom) {
    score += 20;
  }

  // Source quality (0-10 points)
  if (lead.source?.includes("/tools/for-clinicians")) {
    score += 10;
  } else if (lead.source?.includes("/architect")) {
    score += 10;
  } else if (lead.source?.includes("/tools/compare")) {
    score += 8;
  }

  return Math.min(100, score);
}

function getLeadTier(score: number): "hot" | "warm" | "cold" {
  if (score >= 60) return "hot";
  if (score >= 30) return "warm";
  return "cold";
}

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = await checkRateLimit(request, leadCaptureRateLimit);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();

    // Validate input
    const result = LeadCaptureSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid input",
          details: result.error.issues.map((i) => ({
            field: i.path.join("."),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const lead = result.data;

    // Calculate lead score
    const score = calculateLeadScore(lead);
    const tier = getLeadTier(score);

    // Store in database (Supabase)
    // Use service role to bypass RLS, fall back to anon client
    const db = supabaseServiceRole() || supabaseOptional();

    if (!db) {
      console.error("[Lead Capture] No database connection available");
      return NextResponse.json(
        { success: false, error: "Service temporarily unavailable. Please try again." },
        { status: 503 }
      );
    }

    const { error: dbError } = await db.from("leads").insert({
      email: lead.email,
      intent: lead.intent,
      product_slugs: lead.productSlugs || null,
      category_slug: lead.categorySlug || null,
      switching_from: lead.switchingFrom || null,
      source_path: lead.source || null,
      referrer: lead.referrer || null,
      score,
      tier,
    });

    if (dbError) {
      console.error("[Lead Capture] Database error:", dbError.message);
      return NextResponse.json(
        { success: false, error: "Failed to save your information. Please try again." },
        { status: 500 }
      );
    }

    // Trigger appropriate follow-up based on intent
    if (lead.intent === "demo-request") {
      // Queue for immediate vendor notification
      console.log("[Lead Capture] Demo request - queue vendor notification");
    } else if (tier === "hot") {
      // Queue for sales outreach
      console.log("[Lead Capture] Hot lead - queue sales follow-up");
    }

    return NextResponse.json({
      success: true,
      message: getSuccessMessage(lead.intent),
      score,
      tier,
    });
  } catch (error) {
    console.error("[Lead Capture] Error:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}

function getSuccessMessage(intent: LeadCapture["intent"]): string {
  switch (intent) {
    case "newsletter":
      return "You're subscribed! Check your inbox for a confirmation.";
    case "demo-request":
      return "Demo request received! We'll connect you with the vendor shortly.";
    case "switching":
      return "Got it! Check your email for the migration guide.";
    case "architect-save":
      return "Stack saved! We've sent a link to your email.";
    case "comparison-interest":
      return "Comparison saved! Check your inbox.";
    case "pricing-interest":
      return "We'll send you pricing details shortly.";
    case "content-download":
      return "Download link sent to your email!";
    default:
      return "Thanks! We'll be in touch.";
  }
}
