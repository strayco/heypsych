/**
 * Rate limiting utilities using Upstash Redis
 *
 * Configure in Vercel:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 *
 * Get free tier at: https://console.upstash.com/
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

// Lazy initialization - Redis client created on first use
let redis: Redis | null = null;
let isRateLimitEnabled = false;
let rateLimitInitialized = false;
let rateLimitHealthy = true;

/**
 * Initialize Redis client lazily to avoid blocking module load
 * and to allow health checks before enabling rate limiting
 */
function initializeRedis(): Redis | null {
  if (rateLimitInitialized) {
    return rateLimitHealthy ? redis : null;
  }
  rateLimitInitialized = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    redis = new Redis({ url, token });
    isRateLimitEnabled = true;
    return redis;
  } catch (error) {
    console.error("[rate-limit] Failed to initialize Redis client:", error);
    rateLimitHealthy = false;
    return null;
  }
}

/**
 * Mark rate limiting as unhealthy after connection failures
 * This prevents repeated connection attempts to a broken instance
 */
function markRateLimitUnhealthy() {
  rateLimitHealthy = false;
  isRateLimitEnabled = false;
}

/**
 * Create rate limiters lazily on first use
 * If Redis is not configured or unhealthy, returns null
 */

// Cache for rate limiters - created on first use
const rateLimiters: Record<string, Ratelimit | null> = {};

function getRateLimiter(
  name: string,
  windowRequests: number,
  windowDuration: string
): Ratelimit | null {
  if (!rateLimitHealthy) return null;

  if (!(name in rateLimiters)) {
    const redisClient = initializeRedis();
    if (!redisClient) {
      rateLimiters[name] = null;
    } else {
      rateLimiters[name] = new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(windowRequests, windowDuration as any),
        analytics: true,
        prefix: `ratelimit:${name}`,
      });
    }
  }
  return rateLimiters[name];
}

// Newsletter: Very restrictive to prevent spam (5 requests per hour per IP)
export const newsletterRateLimit = { get: () => getRateLimiter("newsletter", 5, "1 h") };

// Provider search: Moderate to prevent database overload (60 requests per minute)
export const searchRateLimit = { get: () => getRateLimiter("search", 60, "1 m") };

// General API: Generous but prevents abuse (100 requests per minute)
export const apiRateLimit = { get: () => getRateLimiter("api", 100, "1 m") };

// Admin login: Very strict to prevent brute force (5 attempts per 15 minutes)
export const loginRateLimit = { get: () => getRateLimiter("login", 5, "15 m") };

// Demo requests: Restrictive to prevent email spam (5 per hour per IP)
export const demoRequestRateLimit = { get: () => getRateLimiter("demo", 5, "1 h") };

// Lead capture: Moderate restriction (10 per hour per IP)
export const leadCaptureRateLimit = { get: () => getRateLimiter("leads", 10, "1 h") };

/**
 * Get client IP from request headers
 */
export function getClientIp(req: NextRequest): string {
  // Try multiple headers as different proxies use different ones
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  // Fallback for unknown IP
  return "unknown";
}

/** Rate limiter getter type */
type RateLimiterGetter = { get: () => Ratelimit | null };

/**
 * Apply rate limit to API route
 * Returns null if request is allowed, or NextResponse with 429 if rate limited
 *
 * IMPORTANT: For admin endpoints, use checkRateLimitStrict() which fails closed
 * in production when rate limiting is not configured.
 */
export async function checkRateLimit(
  req: NextRequest,
  limiterGetter: RateLimiterGetter
): Promise<NextResponse | null> {
  // Get limiter lazily - may return null if Redis is not configured or unhealthy
  const limiter = limiterGetter.get();

  // If rate limiting is not available, allow all requests
  if (!limiter) {
    if (process.env.NODE_ENV === "development") {
      console.log("⚠️  Rate limiting disabled - configure Upstash Redis for production");
    }
    return null; // Allow request
  }

  const ip = getClientIp(req);

  try {
    const { success, limit, reset } = await limiter.limit(ip);

    if (!success) {
      const retryAfter = Math.ceil((reset - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: "Too many requests",
          message: "You have exceeded the rate limit. Please try again later.",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(reset).toISOString(),
            "Retry-After": retryAfter.toString(),
          },
        }
      );
    }
  } catch (error) {
    // Fail open: if rate limiter is unreachable (DNS, network, etc.), allow request
    // Mark as unhealthy to avoid repeated connection attempts
    console.error("[rate-limit] Redis connection failed, disabling rate limiting:",
      error instanceof Error ? error.message : error);
    markRateLimitUnhealthy();
    return null;
  }

  // Request allowed
  return null;
}

/**
 * Apply rate limit with FAIL CLOSED behavior for admin endpoints
 *
 * In production:
 * - If rate limiting is not configured, returns 503 (Service Unavailable)
 * - Admin endpoints MUST have rate limiting to prevent abuse
 *
 * In development:
 * - Allows requests without rate limiting (for local testing)
 * - Logs a warning about missing configuration
 *
 * @returns null if allowed, NextResponse if blocked (429 or 503)
 */
export async function checkRateLimitStrict(
  req: NextRequest,
  limiterGetter: RateLimiterGetter
): Promise<NextResponse | null> {
  const isProduction = process.env.NODE_ENV === "production";
  const limiter = limiterGetter.get();

  // FAIL CLOSED: In production, rate limiting MUST be enabled
  if (!limiter) {
    if (isProduction) {
      console.error("SECURITY: Rate limiting not configured - blocking admin request");
      return NextResponse.json(
        { error: "Service not properly configured" },
        { status: 503 }
      );
    }
    // Development: allow but warn
    console.log("⚠️  Rate limiting disabled - configure Upstash Redis for production");
    return null;
  }

  // Apply standard rate limiting
  return checkRateLimit(req, limiterGetter);
}

/**
 * Check if rate limiting is enabled
 */
export function isRateLimitingEnabled(): boolean {
  return isRateLimitEnabled;
}
