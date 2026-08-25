/**
 * Admin Logout API Route
 *
 * POST /api/admin/logout
 * Destroys the session cookie
 */

import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/auth/admin-auth";

export async function POST() {
  try {
    await destroyAdminSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin logout error:", error);
    return NextResponse.json(
      { error: "Logout failed" },
      { status: 500 }
    );
  }
}
