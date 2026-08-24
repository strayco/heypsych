"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { FAQ } from "@/lib/schemas/digital-tool-v3";

interface ToolFAQProps {
  faqs: FAQ[];
  toolName?: string;
}

/**
 * ToolFAQ Component
 *
 * Renders FAQ section with expandable accordion.
 * FAQs are critical for AEO - minimum 3 required per tool.
 */
export function ToolFAQ({ faqs, toolName }: ToolFAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!faqs || faqs.length === 0) {
    return null;
  }

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="border-t border-separator bg-surface py-10">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-medium uppercase tracking-wider text-label-secondary">
          FAQ
        </p>
        <h2 className="mt-1 text-xl font-semibold text-label-primary">
          {toolName ? `About ${toolName}` : "Frequently Asked Questions"}
        </h2>

        <div className="mt-6 space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border border-separator bg-canvas overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-fill-secondary transition-colors"
                aria-expanded={openIndex === index}
              >
                <span className="font-medium text-label-primary pr-4">
                  {faq.q}
                </span>
                {openIndex === index ? (
                  <ChevronUp className="h-4 w-4 text-label-tertiary shrink-0" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-label-tertiary shrink-0" />
                )}
              </button>

              {openIndex === index && (
                <div className="px-5 pb-4 text-label-secondary leading-relaxed border-t border-separator">
                  <p className="pt-3">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ToolFAQ;
