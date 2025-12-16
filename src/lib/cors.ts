/**
 * Minimal CORS helper for Next.js API routes.
 *
 * If you don't need cross-origin calls, you can skip using this helper.
 * Only apply CORS to API routes that genuinely need cross-origin access.
 */

// Production domain - update this when deploying
export const allowOrigin = process.env.NEXT_PUBLIC_BASE_URL || "https://heypsych.com";

/**
 * Apply CORS headers to a Next.js response object.
 * Works with both App Router (NextResponse) and Pages Router (NextApiResponse).
 */
export function applyCors(res: any) {
  res.headers?.set("Vary", "Origin");
  res.headers?.set("Access-Control-Allow-Credentials", "true");
  res.headers?.set("Access-Control-Allow-Origin", allowOrigin);
  res.headers?.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.headers?.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  // Fallback for Pages Router API routes
  if (res.setHeader && !res.headers) {
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Origin", allowOrigin);
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
  }
}
