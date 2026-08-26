/**
 * Admin Login API Route
 *
 * POST /api/admin/login
 * Verifies password and creates session cookie
 */

import { NextRequest, NextResponse } from "next/server";
import {
  verifyAdminPassword,
  createAdminSession,
} from "@/lib/auth/admin-auth";
import { checkRateLimitStrict, loginRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Strict rate limiting - fails closed in production if Redis unavailable
    const rateLimitResponse = await checkRateLimitStrict(request, loginRateLimit);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json(
        { error: "Password required" },
        { status: 400 }
      );
    }

    if (!verifyAdminPassword(password)) {
      // Don't reveal whether password is wrong vs not configured
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      );
    }

    await createAdminSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
