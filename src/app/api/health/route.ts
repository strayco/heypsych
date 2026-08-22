import { NextResponse } from "next/server";
import { logger } from "@/lib/utils/logger";

/**
 * Health check endpoint for monitoring and uptime checks.
 * Returns basic service health status.
 */

export const runtime = "edge";

export async function GET() {
  try {
    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: "1.0.0",
    });
  } catch (error) {
    // Generic error without leaking details
    logger.error("Health check failed:", error);
    return NextResponse.json(
      { ok: false, error: "Service unavailable" },
      { status: 500 }
    );
  }
}
