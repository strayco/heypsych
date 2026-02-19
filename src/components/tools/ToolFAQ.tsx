"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";
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
    <section className="py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-neutral-900 mb-6 flex items-center gap-2">
          <HelpCircle className="h-6 w-6 text-indigo-600" />
          {toolName ? `${toolName} FAQ` : "Frequently Asked Questions"}
        </h2>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-lg border border-neutral-200 overflow-hidden"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-neutral-50 transition-colors"
                aria-expanded={openIndex === index}
              >
                <span className="font-medium text-neutral-900 pr-4">
                  {faq.q}
                </span>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-neutral-500 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-neutral-500 flex-shrink-0" />
                )}
              </button>

              {openIndex === index && (
                <div className="px-5 pb-4 text-neutral-700 leading-relaxed border-t border-neutral-100">
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
