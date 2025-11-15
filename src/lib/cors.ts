/**
 * Minimal CORS helper for Next.js API routes.
 *
 * TODO: Replace YOUR_DOMAIN_HERE with your actual production domain.
 * Example: "https://heypsych.com"
 *
 * If you don't need cross-origin calls, you can skip using this helper.
 * Only apply CORS to API routes that genuinely need cross-origin access.
 */

// TODO: Replace with your actual production domain
export const allowOrigin = "https://YOUR_DOMAIN_HERE";

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
