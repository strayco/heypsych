import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Use threads pool instead of forks to avoid undici/jsdom compatibility issues
    // See: https://github.com/vitest-dev/vitest/issues/4540
    pool: "threads",

    // Default test environment - jsdom for React tests
    environment: "jsdom",

    // Setup file for jest-dom matchers
    setupFiles: ["./tests/setup.ts"],

    // Include patterns for unit tests
    include: [
      "src/**/__tests__/**/*.test.ts",
      "src/**/__tests__/**/*.test.tsx",
      "tests/unit/**/*.test.ts",
      "tests/unit/**/*.test.tsx",
    ],

    // Exclude patterns - exclude integration tests that need database
    exclude: [
      "node_modules/**",
      "tests/e2e/**",
      ".next/**",
      "playwright-report/**",
      "**/*.integration.test.ts",
      "**/entity-service.test.ts",
    ],

    // Environment options for jsdom
    environmentOptions: {
      jsdom: {
        url: "http://localhost:3000",
      },
    },

    // Global test timeout
    testTimeout: 10000,

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        ".next/**",
        "**/*.d.ts",
        "**/__tests__/**",
        "**/test/**",
      ],
    },

    // Globals for test utilities
    globals: true,
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
