"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SearchX, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="w-full max-w-lg rounded-xl border border-separator bg-surface-grouped p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="rounded-lg bg-accent-tint border border-accent-700/30 p-2">
            <SearchX className="h-6 w-6 text-accent" />
          </div>
          <h1 className="text-xl font-semibold text-label-primary">Page Not Found</h1>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <p className="mb-4 text-6xl font-bold text-label-tertiary">404</p>
            <p className="text-label-tertiary">
              The page you are looking for does not exist or has been moved.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-label-secondary">You might want to:</p>
            <div className="grid gap-2">
              <Link href="/">
                <Button variant="primary" className="w-full justify-start">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Home
                </Button>
              </Link>
              <Link href="/conditions">
                <Button variant="outline" className="w-full justify-start">
                  Browse Conditions
                </Button>
              </Link>
              <Link href="/treatments">
                <Button variant="outline" className="w-full justify-start">
                  Browse Treatments
                </Button>
              </Link>
              <Link href="/resources">
                <Button variant="outline" className="w-full justify-start">
                  Browse Resources
                </Button>
              </Link>
              <Link href="/psychiatrists">
                <Button variant="outline" className="w-full justify-start">
                  Find Providers
                </Button>
              </Link>
              <Button
                variant="ghost"
                onClick={() => window.history.back()}
                className="w-full justify-start"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
