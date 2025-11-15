/**
 * Minimal JSON env loader for Vercel.
 *
 * Set APP_CONFIG_JSON in Vercel Project Settings -> Environment Variables.
 *
 * Example JSON shape (adjust to your needs):
 * {
 *   "dbUrl": "postgres://...",
 *   "jwtSecret": "....",
 *   "publicBaseUrl": "https://YOUR_DOMAIN_HERE"
 * }
 *
 * Usage:
 * import { getConfig } from "@/lib/env";
 * const config = getConfig();
 * console.log(config.publicBaseUrl);
 */

type AppConfig = {
  dbUrl?: string;
  jwtSecret?: string;
  publicBaseUrl?: string;
  [k: string]: unknown;
};

let cached: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cached) return cached;

  const raw = process.env.APP_CONFIG_JSON;
  if (!raw) {
    throw new Error("APP_CONFIG_JSON is missing (set JSON in Vercel env).");
  }

  try {
    const parsed = JSON.parse(raw);

    // Minimal validation without leaking values
    if (typeof parsed !== "object" || parsed === null) {
      throw new Error("APP_CONFIG_JSON must be a JSON object.");
    }

    // Optional: check a couple of expected keys (edit as needed)
    // Uncomment and adjust based on your required keys:
    // if (!("publicBaseUrl" in parsed)) {
    //   throw new Error("APP_CONFIG_JSON missing required key: publicBaseUrl");
    // }

    cached = parsed as AppConfig;
    return cached;
  } catch (e) {
    // Do not echo secrets. Keep error generic.
    if (e instanceof Error && e.message.includes("APP_CONFIG_JSON")) {
      throw e; // Re-throw our own validation errors
    }
    throw new Error("Failed to parse APP_CONFIG_JSON. Verify valid JSON/object.");
  }
}
