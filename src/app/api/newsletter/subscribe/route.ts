import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/config/database";
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
    // Check if email already exists
    const { data: existing, error: checkError } = await supabase
      .from("newsletter_subscribers")
      .select("email, subscribed")
      .eq("email", email)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "not found" which is fine
      logger.error("Error checking existing subscriber:", checkError);
      throw checkError;
    }

    // If already subscribed
    if (existing && existing.subscribed) {
      return NextResponse.json(
        { error: "This email is already subscribed" },
        { status: 400 }
      );
    }

    // If previously unsubscribed, resubscribe
    if (existing && !existing.subscribed) {
      const { error: updateError } = await supabase
        .from("newsletter_subscribers")
        .update({
          subscribed: true,
          subscribed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("email", email);

      if (updateError) {
        logger.error("Error resubscribing:", updateError);
        throw updateError;
      }

      return NextResponse.json({
        success: true,
        message: "Successfully resubscribed!",
      });
    }

    // New subscriber
    const { error: insertError } = await supabase
      .from("newsletter_subscribers")
      .insert({
        email,
        subscribed: true,
        subscribed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      logger.error("Error inserting subscriber:", insertError);
      throw insertError;
    }

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed!",
    });
  } catch (error: any) {
    logger.error("Newsletter subscription error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe. Please try again later." },
      { status: 500 }
    );
  }
}
