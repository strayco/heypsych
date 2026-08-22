/**
 * LLM Referral Detector
 *
 * Detects referrals from LLM platforms based on headers and referrer.
 * Privacy-safe: only tracks platform, not user identities.
 *
 * @see Phase J of Wave 3 directive
 */

import type { LLMPlatform, LLMReferralEvent } from "./types";

/**
 * Referrer patterns for known LLM platforms
 */
const LLM_REFERRER_PATTERNS: Array<{
  platform: LLMPlatform;
  patterns: RegExp[];
}> = [
  {
    platform: "chatgpt",
    patterns: [
      /chat\.openai\.com/i,
      /chatgpt\.com/i,
      /openai\.com\/chat/i,
    ],
  },
  {
    platform: "perplexity",
    patterns: [
      /perplexity\.ai/i,
      /pplx\.ai/i,
    ],
  },
  {
    platform: "claude",
    patterns: [
      /claude\.ai/i,
      /anthropic\.com/i,
    ],
  },
  {
    platform: "copilot",
    patterns: [
      /copilot\.microsoft\.com/i,
      /bing\.com\/chat/i,
    ],
  },
  {
    platform: "gemini",
    patterns: [
      /gemini\.google\.com/i,
      /bard\.google\.com/i,
    ],
  },
  {
    platform: "you",
    patterns: [
      /you\.com/i,
    ],
  },
  {
    platform: "phind",
    patterns: [
      /phind\.com/i,
    ],
  },
];

/**
 * User-agent patterns that indicate LLM crawlers/bots
 */
const LLM_USER_AGENT_PATTERNS: Array<{
  platform: LLMPlatform;
  patterns: RegExp[];
}> = [
  {
    platform: "chatgpt",
    patterns: [
      /ChatGPT-User/i,
      /GPTBot/i,
    ],
  },
  {
    platform: "perplexity",
    patterns: [
      /PerplexityBot/i,
    ],
  },
  {
    platform: "claude",
    patterns: [
      /ClaudeBot/i,
      /anthropic-ai/i,
    ],
  },
  {
    platform: "copilot",
    patterns: [
      /bingbot.*chat/i,
    ],
  },
  {
    platform: "gemini",
    patterns: [
      /Google-Extended/i,
    ],
  },
];

/**
 * Detect LLM platform from referrer URL
 */
export function detectFromReferrer(referrer: string | null | undefined): LLMPlatform | null {
  if (!referrer) return null;

  for (const { platform, patterns } of LLM_REFERRER_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(referrer))) {
      return platform;
    }
  }

  // Check for generic AI patterns
  if (/ai\.|\.ai\/|artificial.*intelligence|language.*model/i.test(referrer)) {
    return "other_ai";
  }

  return null;
}

/**
 * Detect LLM platform from user agent
 */
export function detectFromUserAgent(userAgent: string | null | undefined): LLMPlatform | null {
  if (!userAgent) return null;

  for (const { platform, patterns } of LLM_USER_AGENT_PATTERNS) {
    if (patterns.some((pattern) => pattern.test(userAgent))) {
      return platform;
    }
  }

  return null;
}

/**
 * Detect LLM platform from headers
 *
 * Checks both referrer and user-agent.
 * Prioritizes referrer over user-agent.
 */
export function detectLLMPlatform(headers: {
  referer?: string | null;
  referrer?: string | null;
  "user-agent"?: string | null;
}): LLMPlatform | null {
  // Try referrer first (both spellings)
  const referrer = headers.referer || headers.referrer;
  const fromReferrer = detectFromReferrer(referrer);
  if (fromReferrer) return fromReferrer;

  // Try user-agent
  const userAgent = headers["user-agent"];
  const fromUA = detectFromUserAgent(userAgent);
  if (fromUA) return fromUA;

  return null;
}

/**
 * Create an LLM referral event
 *
 * Privacy-safe: only records date (not time), platform, and page.
 * No user identifiers, IP addresses, or session data.
 */
export function createReferralEvent(
  platform: LLMPlatform,
  pagePath: string,
  entitySlug?: string,
  entityType?: string
): LLMReferralEvent {
  return {
    platform,
    pagePath,
    entitySlug,
    entityType,
    date: new Date().toISOString().split("T")[0], // Date only, no time
  };
}

/**
 * Check if a request is from an LLM crawler (bot)
 */
export function isLLMCrawler(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;

  return LLM_USER_AGENT_PATTERNS.some(({ patterns }) =>
    patterns.some((pattern) => pattern.test(userAgent))
  );
}

/**
 * Get all known LLM platform names
 */
export function getKnownPlatforms(): LLMPlatform[] {
  return [
    "chatgpt",
    "perplexity",
    "claude",
    "copilot",
    "gemini",
    "you",
    "phind",
    "other_ai",
  ];
}
