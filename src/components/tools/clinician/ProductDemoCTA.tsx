"use client";

// Product Page Demo Request CTA
// Shows a CTA card that opens a modal with the demo request form
// Auto-opens when URL contains #demo anchor (from matcher flow)

import { useState, useEffect } from "react";
import { X, Calendar } from "lucide-react";
import { DemoRequestForm } from "./DemoRequestForm";

interface ProductDemoCTAProps {
  toolSlug: string;
  toolName: string;
}

export function ProductDemoCTA({ toolSlug, toolName }: ProductDemoCTAProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Auto-open modal when URL has #demo hash (from matcher flow)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash === "#demo") {
      setIsModalOpen(true);
      // FIX 5: Clear the hash but preserve query parameters (UTMs, source, etc.)
      const url = new URL(window.location.href);
      url.hash = "";
      window.history.replaceState(null, "", url.toString());
    }
  }, []);

  return (
    <>
      {/* CTA Card */}
      <div id="demo" className="rounded-xl border border-treatment/20 bg-treatment/5 p-4 scroll-mt-24">
        <h3 className="flex items-center gap-2 font-semibold text-label-primary mb-2">
          <Calendar className="h-4 w-4 text-treatment" />
          Get a Demo
        </h3>
        <p className="text-sm text-label-secondary mb-3">
          See how {toolName} can work for your practice.
        </p>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full rounded-lg bg-treatment px-4 py-2.5 text-sm font-medium text-white hover:bg-treatment-600 transition-colors"
        >
          Request Demo
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-surface shadow-xl">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-separator bg-surface px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-label-primary">
                  Request a Demo
                </h2>
                <p className="text-sm text-label-secondary">
                  {toolName}
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-2 text-label-tertiary hover:bg-canvas hover:text-label-primary transition-colors"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6">
              <DemoRequestForm
                toolSlug={toolSlug}
                toolName={toolName}
                onSuccess={() => {
                  // Keep modal open to show success message
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
