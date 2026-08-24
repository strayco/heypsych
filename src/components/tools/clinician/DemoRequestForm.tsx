"use client";

// Demo Request Form Component
// Collects lead information for EHR demo requests

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Send, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { behavioralFingerprint } from "@/lib/fingerprint/behavioral-fingerprint";
import {
  DemoRequestZ,
  type DemoRequest,
  PRACTICE_SIZE_LABELS,
  PRACTICE_SETTING_LABELS,
  ROLE_LABELS,
  TIMELINE_LABELS,
} from "@/lib/tools/demo-request";

interface DemoRequestFormProps {
  toolSlug: string;
  toolName: string;
  onSuccess?: () => void;
}

export function DemoRequestForm({
  toolSlug,
  toolName,
  onSuccess,
}: DemoRequestFormProps) {
  const searchParams = useSearchParams();

  // P0-7: Capture form load time for bot defense
  const [formLoadedAt] = useState(() => Date.now());

  const [formData, setFormData] = useState<Partial<DemoRequest>>({
    toolSlug,
    toolName,
    agreedToTerms: false,
    marketingConsent: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  // Capture UTM parameters and behavioral fingerprint
  useEffect(() => {
    // Track demo form view in fingerprint
    behavioralFingerprint.trackDemoRequest(toolSlug);

    // Get fingerprint context for prefill and analytics
    const fp = behavioralFingerprint.get();

    setFormData((prev) => ({
      ...prev,
      utmSource: searchParams.get("utm_source") || undefined,
      utmMedium: searchParams.get("utm_medium") || undefined,
      utmCampaign: searchParams.get("utm_campaign") || undefined,
      matcherSource: searchParams.get("from") === "matcher",
      // Add fingerprint context (will be sent with request for analytics)
      fingerprintId: fp.sessionId,
      productsViewed: fp.productsViewed.slice(0, 10).map(p => p.slug),
      productsCompared: fp.productsCompared.slice(0, 5),
      switchingFrom: fp.inferred.switchingFrom,
      buyerUrgency: fp.inferred.urgency,
    }));
  }, [searchParams, toolSlug]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when field is edited
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    // Construct complete payload including bot-defense timing
    const payload = {
      ...formData,
      formLoadedAt, // Required for bot defense
    };

    // Validate complete payload
    const result = DemoRequestZ.safeParse(payload);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/tools/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitStatus("success");
        setSubmitMessage(data.message);
        onSuccess?.();
      } else {
        setSubmitStatus("error");
        setSubmitMessage(data.error || "Something went wrong");

        if (data.details) {
          const fieldErrors: Record<string, string> = {};
          for (const detail of data.details) {
            fieldErrors[detail.field] = detail.message;
          }
          setErrors(fieldErrors);
        }
      }
    } catch {
      setSubmitStatus("error");
      setSubmitMessage("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (submitStatus === "success") {
    return (
      <div className="rounded-xl border border-positive/30 bg-positive/5 p-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-positive/10">
          <CheckCircle className="h-6 w-6 text-positive" />
        </div>
        <h3 className="text-lg font-semibold text-label-primary">
          Demo Request Submitted!
        </h3>
        <p className="mt-2 text-label-secondary">{submitMessage}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact Info */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="firstName"
            className="block text-sm font-medium text-label-primary"
          >
            First Name *
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName || ""}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 text-label-primary placeholder:text-label-quaternary focus:outline-none focus:ring-2 ${
              errors.firstName
                ? "border-negative focus:ring-negative/50"
                : "border-separator focus:ring-accent"
            }`}
            placeholder="Jane"
          />
          {errors.firstName && (
            <p className="mt-1 text-sm text-negative">{errors.firstName}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="lastName"
            className="block text-sm font-medium text-label-primary"
          >
            Last Name *
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName || ""}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 text-label-primary placeholder:text-label-quaternary focus:outline-none focus:ring-2 ${
              errors.lastName
                ? "border-negative focus:ring-negative/50"
                : "border-separator focus:ring-accent"
            }`}
            placeholder="Smith"
          />
          {errors.lastName && (
            <p className="mt-1 text-sm text-negative">{errors.lastName}</p>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-label-primary"
        >
          Work Email *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email || ""}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-lg border px-3 py-2 text-label-primary placeholder:text-label-quaternary focus:outline-none focus:ring-2 ${
            errors.email
              ? "border-negative focus:ring-negative/50"
              : "border-separator focus:ring-accent"
          }`}
          placeholder="jane@practice.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-negative">{errors.email}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-label-primary"
        >
          Phone (Optional)
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone || ""}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-separator px-3 py-2 text-label-primary placeholder:text-label-quaternary focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="(555) 123-4567"
        />
      </div>

      {/* Practice Info */}
      <div className="border-t border-separator pt-6">
        <h4 className="mb-4 font-medium text-label-primary">
          About Your Practice
        </h4>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-label-primary"
            >
              Your Role *
            </label>
            <select
              id="role"
              name="role"
              value={formData.role || ""}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 text-label-primary focus:outline-none focus:ring-2 ${
                errors.role
                  ? "border-negative focus:ring-negative/50"
                  : "border-separator focus:ring-accent"
              }`}
            >
              <option value="">Select your role</option>
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-negative">{errors.role}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="practiceSize"
              className="block text-sm font-medium text-label-primary"
            >
              Practice Size *
            </label>
            <select
              id="practiceSize"
              name="practiceSize"
              value={formData.practiceSize || ""}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-lg border px-3 py-2 text-label-primary focus:outline-none focus:ring-2 ${
                errors.practiceSize
                  ? "border-negative focus:ring-negative/50"
                  : "border-separator focus:ring-accent"
              }`}
            >
              <option value="">Select size</option>
              {Object.entries(PRACTICE_SIZE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {errors.practiceSize && (
              <p className="mt-1 text-sm text-negative">{errors.practiceSize}</p>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="practiceSetting"
            className="block text-sm font-medium text-label-primary"
          >
            Practice Setting *
          </label>
          <select
            id="practiceSetting"
            name="practiceSetting"
            value={formData.practiceSetting || ""}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-lg border px-3 py-2 text-label-primary focus:outline-none focus:ring-2 ${
              errors.practiceSetting
                ? "border-negative focus:ring-negative/50"
                : "border-separator focus:ring-accent"
            }`}
          >
            <option value="">Select setting</option>
            {Object.entries(PRACTICE_SETTING_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {errors.practiceSetting && (
            <p className="mt-1 text-sm text-negative">
              {errors.practiceSetting}
            </p>
          )}
        </div>

        <div className="mt-4">
          <label
            htmlFor="timeline"
            className="block text-sm font-medium text-label-primary"
          >
            When are you looking to implement?
          </label>
          <select
            id="timeline"
            name="timeline"
            value={formData.timeline || ""}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-separator px-3 py-2 text-label-primary focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">Select timeline</option>
            {Object.entries(TIMELINE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-label-primary"
        >
          Anything specific you&apos;re looking for? (Optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          value={formData.message || ""}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-separator px-3 py-2 text-label-primary placeholder:text-label-quaternary focus:outline-none focus:ring-2 focus:ring-accent"
          placeholder="E.g., specific integrations, compliance needs, migration concerns..."
        />
      </div>

      {/* P0-7: Honeypot field - hidden from real users, bots will fill it */}
      <div className="absolute -left-[9999px] opacity-0" aria-hidden="true">
        <label htmlFor="website">Website</label>
        <input
          type="text"
          id="website"
          name="website"
          value={formData.website || ""}
          onChange={handleChange}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Consent */}
      <div className="space-y-3">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="agreedToTerms"
            checked={Boolean(formData.agreedToTerms)}
            onChange={handleChange}
            className="mt-1 h-4 w-4 rounded border-separator text-accent focus:ring-accent"
          />
          <span className="text-sm text-label-secondary">
            I agree to the{" "}
            <a
              href="/terms"
              target="_blank"
              className="text-accent hover:underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="/privacy"
              target="_blank"
              className="text-accent hover:underline"
            >
              Privacy Policy
            </a>{" "}
            *
          </span>
        </label>
        {errors.agreedToTerms && (
          <p className="text-sm text-negative">{errors.agreedToTerms}</p>
        )}

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="marketingConsent"
            checked={formData.marketingConsent || false}
            onChange={handleChange}
            className="mt-1 h-4 w-4 rounded border-separator text-accent focus:ring-accent"
          />
          <span className="text-sm text-label-secondary">
            I&apos;d like to receive updates about mental health practice tools and
            resources
          </span>
        </label>
      </div>

      {/* Error Message */}
      {submitStatus === "error" && (
        <div className="flex items-start gap-3 rounded-lg border border-negative/30 bg-negative/5 p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-negative" />
          <p className="text-sm text-negative">{submitMessage}</p>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 font-medium text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            Request Demo
          </>
        )}
      </button>

      <p className="text-center text-xs text-label-tertiary">
        We&apos;ll connect you directly with {toolName}. No spam, ever.
      </p>
    </form>
  );
}
