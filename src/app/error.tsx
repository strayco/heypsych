"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console
    console.error("Error boundary caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-lg rounded-xl border border-separator bg-surface-grouped p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-negative-tint border border-negative-700/30 p-2">
            <AlertTriangle className="h-6 w-6 text-negative" />
          </div>
          <h1 className="text-xl font-semibold text-label-primary">Something went wrong</h1>
        </div>

        <div className="space-y-4">
          <p className="text-label-tertiary">
            We encountered an unexpected error. This has been logged and we will look into it.
          </p>

          {process.env.NODE_ENV === "development" && (
            <div className="rounded-lg bg-surface border border-separator p-4">
              <p className="font-mono text-sm break-all text-label-secondary">{error.message}</p>
              {error.digest && (
                <p className="mt-2 text-xs text-label-primary0">Error ID: {error.digest}</p>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={reset} variant="primary" className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
              className="flex-1"
            >
              <Home className="mr-2 h-4 w-4" />
              Go home
            </Button>
          </div>

          <p className="text-center text-sm text-label-primary0">
            If the problem persists, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
