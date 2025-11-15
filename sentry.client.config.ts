import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 0.1, // 10% of transactions

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  replaysOnErrorSampleRate: 1.0, // 100% of errors get session replay
  replaysSessionSampleRate: 0.01, // 1% of sessions get replay

  // Error filtering - don't send known harmless errors
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Filter out ResizeObserver loop errors (common, harmless browser quirk)
    if (error && error.toString().includes("ResizeObserver loop")) {
      return null;
    }

    // Filter out network errors that are user-caused
    if (error && error.toString().includes("Failed to fetch")) {
      return null;
    }

    return event;
  },

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and block all media to protect user privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    "top.GLOBALS",
    // Random plugins/extensions
    "originalCreateNotification",
    "canvas.contentDocument",
    "MyApp_RemoveAllHighlights",
    // Facebook borked
    "fb_xd_fragment",
    // Network errors
    "NetworkError",
    "Network request failed",
  ],

  // Ignore specific URLs
  denyUrls: [
    // Browser extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^chrome-extension:\/\//i,
  ],
});
