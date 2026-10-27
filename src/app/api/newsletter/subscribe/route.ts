import { NextRequest, NextResponse } from "next/server";
import { subscribeNewsletter } from "@/lib/data/form-store";
import { logger } from "@/lib/utils/logger";
import { checkRateLimit, newsletterRateLimit } from "@/lib/rate-limit";
import { validateBody } from "@/lib/validation";
import { newsletterSubscribeSchema } from "@/lib/schemas/api";

export async function POST(req: NextRequest) {
  // Rate limiting - FIRST line of defense
  const rateLimitResponse = await checkRateLimit(req, newsletterRateLimit);
  if (rateLimitResponse) return rateLimitResponse;

  // Input validation - SECOND line of defense
  const { data, error } = await validateBody(req, newsletterSubscribeSchema);
  if (error) return error;

  const { email } = data!;

  try {
    // Direct database connection first (works even when Supabase's API is
    // restricted); service-role fallback. Never the public key.
    const result = await subscribeNewsletter(email);
    if (result === "already") {
      return NextResponse.json({ error: "This email is already subscribed" }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      message: result === "resubscribed" ? "Successfully resubscribed!" : "Successfully subscribed!",
    });
  } catch (error: any) {
    logger.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again later." },
      { status: 500 }
    );
  }
}
