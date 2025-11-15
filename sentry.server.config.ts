import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only send errors in production
  enabled: process.env.NODE_ENV === "production",

  // Adjust this value in production
  tracesSampleRate: 0.1, // 10% of transactions

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  // Server-specific configuration
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",

  // Add server context
  initialScope: {
    tags: {
      runtime: "node",
    },
  },

  // Filter out database integrations (we don't use Prisma or raw Postgres)
  // We use Supabase client which doesn't need these instrumentations
  // This prevents "Critical dependency" warnings from OpenTelemetry instrumentation
  integrations: (integrations) => {
    return integrations.filter((integration) => {
      const name = integration.name;
      return !["Prisma", "Postgres", "Mysql", "Mongo"].includes(name);
    });
  },
});
