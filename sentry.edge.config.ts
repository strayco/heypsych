import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",

  // Adjust this value in production
  tracesSampleRate: 0.1, // 10% of transactions

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Edge runtime configuration
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",

  // Add edge context
  initialScope: {
    tags: {
      runtime: "edge",
    },
  },
});
