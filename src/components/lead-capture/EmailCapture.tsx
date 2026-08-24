/**
 * Email Capture Component
 *
 * Lightweight email capture for various funnel stages.
 * Tracks context and intent signals for lead qualification.
 */

"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle, Loader2, Mail, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type LeadIntent =
  | "newsletter"           // General newsletter signup
  | "product-interest"     // Interested in specific product(s)
  | "comparison-interest"  // Comparing products
  | "demo-request"         // Wants a demo
  | "pricing-interest"     // Looking at pricing
  | "switching"            // Switching from another product
  | "content-download"     // Downloading a resource
  | "architect-save";      // Saving an Architect stack

export interface EmailCaptureProps {
  intent: LeadIntent;
  productSlugs?: string[];        // Products user is interested in
  categorySlug?: string;          // Category context
  switchingFrom?: string;         // Product being replaced
  headline?: string;              // Custom headline
  subtext?: string;               // Custom subtext
  buttonText?: string;            // Custom button text
  variant?: "inline" | "card" | "banner" | "minimal";
  className?: string;
  onSuccess?: (email: string) => void;
}

// ============================================================================
// DEFAULT COPY BY INTENT
// ============================================================================

const INTENT_COPY: Record<LeadIntent, { headline: string; subtext: string; button: string }> = {
  newsletter: {
    headline: "Stay in the loop",
    subtext: "Get weekly insights on mental health practice technology.",
    button: "Subscribe",
  },
  "product-interest": {
    headline: "Get notified",
    subtext: "We'll email you when there are updates to this product.",
    button: "Notify Me",
  },
  "comparison-interest": {
    headline: "Save this comparison",
    subtext: "Get a copy of this comparison sent to your inbox.",
    button: "Send to Email",
  },
  "demo-request": {
    headline: "Request a demo",
    subtext: "We'll connect you with the vendor for a personalized demo.",
    button: "Request Demo",
  },
  "pricing-interest": {
    headline: "Get pricing details",
    subtext: "We'll send you the latest pricing information.",
    button: "Get Pricing",
  },
  switching: {
    headline: "Planning to switch?",
    subtext: "Get our migration guide and vendor comparison sent to your inbox.",
    button: "Get Guide",
  },
  "content-download": {
    headline: "Download this resource",
    subtext: "Enter your email to receive the download link.",
    button: "Download",
  },
  "architect-save": {
    headline: "Save your stack",
    subtext: "Get a link to your Practice Architect™ configuration.",
    button: "Save Stack",
  },
};

// ============================================================================
// COMPONENT
// ============================================================================

export function EmailCapture({
  intent,
  productSlugs,
  categorySlug,
  switchingFrom,
  headline,
  subtext,
  buttonText,
  variant = "card",
  className,
  onSuccess,
}: EmailCaptureProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const copy = INTENT_COPY[intent];
  const displayHeadline = headline || copy.headline;
  const displaySubtext = subtext || copy.subtext;
  const displayButton = buttonText || copy.button;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          intent,
          productSlugs,
          categorySlug,
          switchingFrom,
          source: typeof window !== "undefined" ? window.location.pathname : undefined,
          referrer: typeof document !== "undefined" ? document.referrer : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        onSuccess?.(email);
      } else {
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  };

  // Success state
  if (status === "success") {
    return (
      <div className={cn(
        "flex items-center gap-3 rounded-xl border border-positive/30 bg-positive/5 p-4",
        className
      )}>
        <CheckCircle className="h-5 w-5 text-positive flex-shrink-0" />
        <p className="text-sm text-label-primary">
          {intent === "newsletter"
            ? "You're subscribed! Check your inbox."
            : intent === "architect-save"
            ? "Stack saved! Check your email for the link."
            : "Got it! We'll be in touch soon."}
        </p>
      </div>
    );
  }

  // Render variants
  if (variant === "minimal") {
    return (
      <form onSubmit={handleSubmit} className={cn("flex items-center gap-2", className)}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="flex-1 rounded-lg border border-separator bg-surface px-3 py-2 text-sm text-label-primary placeholder:text-label-quaternary focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : displayButton}
        </button>
      </form>
    );
  }

  if (variant === "inline") {
    return (
      <div className={cn("flex flex-col sm:flex-row items-start sm:items-center gap-4", className)}>
        <div className="flex-1">
          <p className="font-medium text-label-primary">{displayHeadline}</p>
          <p className="text-sm text-label-secondary">{displaySubtext}</p>
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-48 rounded-lg border border-separator bg-surface px-3 py-2 text-sm text-label-primary placeholder:text-label-quaternary focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {status === "loading" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {displayButton}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
        {status === "error" && (
          <p className="text-sm text-negative">{errorMessage}</p>
        )}
      </div>
    );
  }

  if (variant === "banner") {
    return (
      <div className={cn(
        "rounded-xl border border-accent/20 bg-accent/5 p-5",
        className
      )}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
              <Mail className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-label-primary">{displayHeadline}</p>
              <p className="text-sm text-label-secondary">{displaySubtext}</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-56 rounded-lg border border-separator bg-surface px-3 py-2 text-sm text-label-primary placeholder:text-label-quaternary focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50 whitespace-nowrap"
            >
              {status === "loading" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {displayButton}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
        {status === "error" && (
          <p className="mt-2 text-sm text-negative">{errorMessage}</p>
        )}
      </div>
    );
  }

  // Default: card variant
  return (
    <div className={cn(
      "rounded-2xl border border-separator bg-surface p-6",
      className
    )}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 mb-4">
        <Sparkles className="h-6 w-6 text-accent" />
      </div>
      <h3 className="text-lg font-semibold text-label-primary">{displayHeadline}</h3>
      <p className="mt-2 text-sm text-label-secondary">{displaySubtext}</p>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-separator bg-canvas px-3 py-2.5 text-sm text-label-primary placeholder:text-label-quaternary focus:outline-none focus:ring-2 focus:ring-accent"
        />
        {status === "error" && (
          <p className="text-sm text-negative">{errorMessage}</p>
        )}
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {displayButton}
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-3 text-center text-xs text-label-tertiary">
        No spam. Unsubscribe anytime.
      </p>
    </div>
  );
}
