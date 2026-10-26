"use client";

/**
 * Route error boundary.
 *
 * Calm, specific, and recoverable: say what happened in plain words, offer to
 * try again, and keep a way home and to crisis help. No alarm iconography.
 */

import { useEffect } from "react";
import Link from "next/link";
import { DISCOVERY_OBJECTS } from "@/components/home/worlds/DiscoveryObjects";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error boundary caught:", error);
  }, [error]);

  const Armchair = DISCOVERY_OBJECTS.armchair;

  return (
    <div className="bg-canvas px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
      <div className="mx-auto grid max-w-5xl items-center gap-10 lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-16">
        <div>
          <h1 className="font-display text-label-primary text-[36px] leading-[1.08] font-normal tracking-[-0.02em] sm:text-[48px]">
            This page didn&apos;t load properly.
          </h1>
          <p className="text-label-secondary mt-4 max-w-xl text-[17px] leading-relaxed">
            Something went wrong on our side, not yours. Trying again usually works. If it
            doesn&apos;t, the rest of HeyPsych is still here.
          </p>

          {process.env.NODE_ENV === "development" && (
            <div className="border-separator bg-surface mt-6 max-w-xl rounded-2xl border p-4">
              <p className="text-label-secondary font-mono text-[13px] break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-label-tertiary mt-2 text-[12px]">Error ID: {error.digest}</p>
              )}
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={reset}
              className="bg-label-primary hover:bg-accent focus-visible:ring-accent inline-flex items-center gap-2 rounded-full px-5 py-3 text-[15px] font-medium text-white transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              Try again
            </button>
            <Link
              href="/"
              className="border-separator-opaque bg-surface text-label-primary hover:border-label-primary focus-visible:ring-accent inline-flex items-center gap-2 rounded-full border px-5 py-3 text-[15px] font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
            >
              Go home
            </Link>
          </div>

          <p className="text-label-secondary mt-10 text-[14px] leading-relaxed">
            Need help right now?{" "}
            <a
              href="tel:988"
              className="text-label-primary font-medium underline underline-offset-4"
            >
              Call or text 988
            </a>{" "}
            in the US, any time.
          </p>
        </div>

        <div aria-hidden="true" className="mx-auto h-[200px] w-[240px] lg:h-[260px] lg:w-[280px]">
          <Armchair />
        </div>
      </div>
    </div>
  );
}
