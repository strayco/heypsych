/**
 * Admin Authentication Utilities
 *
 * Provides secure authentication for administrative API endpoints
 * and the admin dashboard UI.
 *
 * All admin endpoints MUST use these utilities to ensure:
 * - Explicit secret configuration required in production
 * - Fail-closed behavior when misconfigured
 * - Timing-safe secret comparison
 * - Authorization header-based authentication
 * - No secrets exposed in responses or logs
 *
 * Dashboard authentication uses:
 * - Password stored in ADMIN_PASSWORD env var
 * - HttpOnly session cookie
 * - Timing-safe password comparison
 */

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { timingSafeEqual, randomBytes, createHmac } from "crypto";

// Session configuration
const SESSION_COOKIE_NAME = "admin_session";
const SESSION_MAX_AGE = 60 * 60 * 24; // 24 hours in seconds

// Site URL for URL validation
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://heypsych.com";
const SITE_HOST = new URL(SITE_URL).hostname;

/**
 * Result of authentication check
 */
interface AuthResult {
  authenticated: boolean;
  error?: string;
  statusCode?: number;
}

/**
 * Configuration for admin endpoint
 */
interface AdminEndpointConfig {
  /** Name of the environment variable containing the secret */
  secretEnvVar: string;
  /** Whether this endpoint is allowed in development without secret */
  allowDevBypass?: boolean;
  /** Maximum request body size in bytes (default: 64KB) */
  maxBodySize?: number;
}

/**
 * Performs timing-safe comparison of two strings
 * Prevents timing attacks on secret comparison
 */
function timingSafeCompare(a: string, b: string): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");

  // If lengths differ, pad the shorter one (still takes constant time)
  if (aBuffer.length !== bBuffer.length) {
    // Compare against self to take same time, then return false
    timingSafeEqual(aBuffer, aBuffer);
    return false;
  }

  return timingSafeEqual(aBuffer, bBuffer);
}

/**
 * Extracts Bearer token from Authorization header
 */
function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;

  const match = authHeader.match(/^Bearer\s+(\S+)$/i);
  return match ? match[1] : null;
}

/**
 * Validates admin endpoint authentication
 *
 * IMPORTANT: This function FAILS CLOSED - if the secret is not configured
 * in production, all requests are rejected.
 */
export function validateAdminAuth(
  request: NextRequest,
  config: AdminEndpointConfig
): AuthResult {
  const secret = process.env[config.secretEnvVar];
  const isProduction = process.env.NODE_ENV === "production";

  // FAIL CLOSED: In production, secret MUST be configured
  if (isProduction && !secret) {
    console.error(
      `SECURITY: Admin endpoint blocked - ${config.secretEnvVar} not configured`
    );
    return {
      authenticated: false,
      error: "Endpoint not configured",
      statusCode: 503,
    };
  }

  // In development, optionally allow bypass (for local testing)
  if (!isProduction && config.allowDevBypass && !secret) {
    console.warn(
      `DEV: Admin endpoint ${config.secretEnvVar} bypass enabled - configure secret for production`
    );
    return { authenticated: true };
  }

  // If secret is configured, require authentication
  if (secret) {
    const token = extractBearerToken(request);

    if (!token) {
      return {
        authenticated: false,
        error: "Authorization required",
        statusCode: 401,
      };
    }

    if (!timingSafeCompare(token, secret)) {
      return {
        authenticated: false,
        error: "Invalid credentials",
        statusCode: 403,
      };
    }
  }

  return { authenticated: true };
}

/**
 * Creates an error response for failed authentication
 */
export function createAuthErrorResponse(result: AuthResult): NextResponse {
  return NextResponse.json(
    { error: result.error || "Unauthorized" },
    { status: result.statusCode || 401 }
  );
}

/**
 * Validates that a URL belongs to the configured site origin
 */
export function validateSiteUrl(url: string): boolean {
  try {
    // Handle relative URLs
    if (url.startsWith("/")) {
      return true;
    }

    // Handle absolute URLs - must match site host
    const parsed = new URL(url);
    return parsed.hostname === SITE_HOST;
  } catch {
    return false;
  }
}

/**
 * Validates an array of URLs, returning only valid site URLs
 */
export function filterValidSiteUrls(urls: unknown): string[] {
  if (!Array.isArray(urls)) return [];

  return urls
    .filter((url): url is string => typeof url === "string")
    .filter((url) => validateSiteUrl(url))
    .slice(0, 10000); // Cap at IndexNow limit
}

/**
 * Validates request body size
 */
export async function validateBodySize(
  request: NextRequest,
  maxBytes: number = 65536
): Promise<boolean> {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (!isNaN(size) && size > maxBytes) {
      return false;
    }
  }
  return true;
}

/**
 * Rate limiting status check for admin endpoints
 * Admin endpoints should fail closed if rate limiting is unavailable
 */
export function requireRateLimitingInProduction(): AuthResult | null {
  const isProduction = process.env.NODE_ENV === "production";
  const hasRateLimiting = !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );

  if (isProduction && !hasRateLimiting) {
    console.error(
      "SECURITY: Admin endpoint blocked - rate limiting not configured"
    );
    return {
      authenticated: false,
      error: "Endpoint not configured",
      statusCode: 503,
    };
  }

  return null; // Proceed
}

/**
 * Middleware wrapper for admin endpoints
 * Applies authentication, rate limiting check, and body size validation
 */
export async function withAdminAuth(
  request: NextRequest,
  config: AdminEndpointConfig,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Check rate limiting availability
  const rateLimitCheck = requireRateLimitingInProduction();
  if (rateLimitCheck) {
    return createAuthErrorResponse(rateLimitCheck);
  }

  // Validate body size
  const maxBodySize = config.maxBodySize ?? 65536;
  if (!(await validateBodySize(request, maxBodySize))) {
    return NextResponse.json(
      { error: "Request body too large" },
      { status: 413 }
    );
  }

  // Validate authentication
  const authResult = validateAdminAuth(request, config);
  if (!authResult.authenticated) {
    return createAuthErrorResponse(authResult);
  }

  // Call the handler
  return handler(request);
}

/**
 * Safe status response that doesn't expose secrets
 */
export function createSafeStatusResponse(
  data: Record<string, unknown>
): NextResponse {
  // Ensure no secret values are included
  const safeData = { ...data };

  // Remove any fields that might contain secrets
  const sensitiveFields = [
    "secret",
    "key",
    "token",
    "password",
    "credential",
    "auth",
  ];
  for (const field of Object.keys(safeData)) {
    const lower = field.toLowerCase();
    if (sensitiveFields.some((s) => lower.includes(s))) {
      delete safeData[field];
    }
  }

  return NextResponse.json(safeData);
}

// ============================================================================
// Dashboard Session Authentication
// ============================================================================

/**
 * Creates a signed session token
 * Token format: timestamp.randomBytes.signature
 */
function createSessionToken(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD not configured");

  const timestamp = Date.now().toString();
  const random = randomBytes(32).toString("hex");
  const data = `${timestamp}.${random}`;

  const signature = createHmac("sha256", secret).update(data).digest("hex");

  return `${data}.${signature}`;
}

/**
 * Verifies a session token is valid and not expired
 */
function verifySessionToken(token: string): boolean {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [timestamp, random, signature] = parts;
  const data = `${timestamp}.${random}`;

  // Verify signature
  const expectedSignature = createHmac("sha256", secret)
    .update(data)
    .digest("hex");

  if (!timingSafeCompare(signature, expectedSignature)) {
    return false;
  }

  // Check expiration
  const tokenTime = parseInt(timestamp, 10);
  if (isNaN(tokenTime)) return false;

  const age = Date.now() - tokenTime;
  if (age > SESSION_MAX_AGE * 1000) {
    return false;
  }

  return true;
}

/**
 * Verifies the admin password
 * FAILS CLOSED: Returns false if password not configured in production
 */
export function verifyAdminPassword(password: string): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const isProduction = process.env.NODE_ENV === "production";

  // FAIL CLOSED: In production, password MUST be configured
  if (!adminPassword) {
    if (isProduction) {
      console.error("SECURITY: Admin login blocked - ADMIN_PASSWORD not configured");
    }
    return false;
  }

  return timingSafeCompare(password, adminPassword);
}

/**
 * Creates a session and sets the cookie
 * Call this after successful password verification
 */
export async function createAdminSession(): Promise<void> {
  const token = createSessionToken();
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

/**
 * Destroys the admin session
 */
export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete({ name: SESSION_COOKIE_NAME, path: "/" });
}

/**
 * Checks if the current request has a valid admin session
 * Use this in Server Components and Server Actions
 */
export async function isAdminAuthenticated(): Promise<boolean> {
  const adminPassword = process.env.ADMIN_PASSWORD;

  // FAIL CLOSED: No password configured = no access
  if (!adminPassword) {
    if (process.env.NODE_ENV === "production") {
      console.error("SECURITY: Admin access blocked - ADMIN_PASSWORD not configured");
    }
    return false;
  }

  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

  if (!sessionCookie?.value) {
    return false;
  }

  return verifySessionToken(sessionCookie.value);
}
