"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Send error to Sentry for tracking and alerting
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-100 p-2">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl">Something went wrong</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            We encountered an unexpected error. This has been logged and we will look into it.
          </p>

          {process.env.NODE_ENV === "development" && (
            <div className="rounded-lg bg-gray-100 p-4">
              <p className="font-mono text-sm break-all text-gray-800">{error.message}</p>
              {error.digest && (
                <p className="mt-2 text-xs text-gray-500">Error ID: {error.digest}</p>
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

          <p className="text-center text-sm text-gray-500">
            If the problem persists, please contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
