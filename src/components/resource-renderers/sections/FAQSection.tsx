// src/components/resource-renderers/sections/FAQSection.tsx
"use client";
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, HelpCircle } from "lucide-react";

interface FAQ {
  q: string;
  a: string;
}

interface FAQSectionProps {
  faqs: FAQ[];
  entityName: string;
  entityUrl: string;
}

export function FAQSection({ faqs, entityName, entityUrl }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Generate FAQPage schema.org structured data
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a
      }
    }))
  };

  return (
    <>
      {/* Schema.org structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 bg-white"
              >
                <button
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                  className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50"
                >
                  <span className="font-medium text-gray-900">{faq.q}</span>
                  {openIndex === i ? (
                    <ChevronUp className="h-5 w-5 flex-shrink-0 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 flex-shrink-0 text-gray-500" />
                  )}
                </button>
                {openIndex === i && (
                  <div className="border-t border-gray-200 px-4 pb-4 pt-3">
                    <p className="text-sm text-gray-700">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
