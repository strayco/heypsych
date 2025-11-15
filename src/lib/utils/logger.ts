/**
 * Production-safe logging utility
 * - Gates debug logs behind NODE_ENV
 * - Throttles production errors to prevent log spam
 * - Sends errors to Sentry in production
 * - Provides structured logging for analytics
 */

import * as Sentry from "@sentry/nextjs";

const isDev = process.env.NODE_ENV === "development";

// Throttle production errors to max 1 per minute per error type
const errorThrottle = new Map<string, number>();
const THROTTLE_MS = 60000; // 1 minute

/**
 * Debug logging - only in development
 */
export const logger = {
  debug: (...args: any[]) => {
    if (isDev) {
      console.log(...args);
    }
  },

  info: (...args: any[]) => {
    if (isDev) {
      console.info(...args);
    }
  },

  warn: (...args: any[]) => {
    console.warn(...args);
  },

  /**
   * Error logging with Sentry integration and throttling in production
   */
  error: (message: string, error?: any, context?: Record<string, any>) => {
    const errorKey = `${message}-${error?.message || ""}`;
    const now = Date.now();
    const lastLogged = errorThrottle.get(errorKey);

    // In production, throttle similar errors
    if (!isDev && lastLogged && now - lastLogged < THROTTLE_MS) {
      return; // Skip logging this error
    }

    errorThrottle.set(errorKey, now);

    if (isDev) {
      console.error(message, error, context);
    } else {
      // In production, send to Sentry
      Sentry.captureException(error || new Error(message), {
        extra: context,
        tags: { source: "logger" },
        level: "error",
      });

      // Still log minimal info to console for Vercel logs
      console.error(message, error?.message || error);
    }
  },
};

/**
 * Analytics event tracking
 * Lightweight tracking for key user actions
 */
export const analytics = {
  /**
   * Track provider search events
   */
  trackSearch: (params: {
    filters: Record<string, any>;
    resultsCount: number;
    loadTimeMs: number;
  }) => {
    if (!isDev) {
      // In production, you could send to analytics service
      // For now, just console in a structured way
      const event = {
        event: "provider_search",
        timestamp: new Date().toISOString(),
        ...params,
      };

      // Send to your analytics service here
      // e.g., gtag, mixpanel, etc.
      logger.debug("Analytics:", event);
    }
  },

  /**
   * Track provider profile views
   */
  trackProfileView: (providerId: string) => {
    if (!isDev) {
      const event = {
        event: "provider_profile_view",
        timestamp: new Date().toISOString(),
        providerId,
      };
      logger.debug("Analytics:", event);
    }
  },

  /**
   * Track provider contact attempts
   */
  trackContact: (providerId: string, method: "phone" | "profile") => {
    if (!isDev) {
      const event = {
        event: "provider_contact",
        timestamp: new Date().toISOString(),
        providerId,
        method,
      };
      logger.debug("Analytics:", event);
    }
  },

  /**
   * Track filter usage to understand what users search for
   */
  trackFilterUsage: (filterType: string, filterValue: string) => {
    if (!isDev) {
      const event = {
        event: "filter_usage",
        timestamp: new Date().toISOString(),
        filterType,
        filterValue,
      };
      logger.debug("Analytics:", event);
    }
  },
};
