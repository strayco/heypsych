"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ConditionsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Conditions page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-md rounded-xl border border-separator bg-surface-grouped p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="rounded-lg bg-negative-tint border border-negative-700/30 p-2">
            <AlertTriangle className="h-6 w-6 text-negative" />
          </div>
          <h1 className="text-lg font-semibold text-label-primary">Error Loading Conditions</h1>
        </div>
        <div className="space-y-4">
          <p className="text-sm text-label-tertiary">
            We encountered an error while loading the conditions. Please try again.
          </p>
          <Button onClick={reset} variant="primary" className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
