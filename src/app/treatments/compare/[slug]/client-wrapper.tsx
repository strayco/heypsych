"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Scale, ChevronDown, ChevronUp, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ComparisonData } from "./page";

interface ComparisonClientWrapperProps {
  data: ComparisonData;
}

export function ComparisonClientWrapper({ data }: ComparisonClientWrapperProps) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <main className="min-h-screen bg-white" itemScope itemType="https://schema.org/MedicalWebPage">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <motion.nav
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-sm text-neutral-500"
        >
          <Link href="/" className="hover:text-neutral-700 transition-colors">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/treatments" className="hover:text-neutral-700 transition-colors">
            Treatments
          </Link>
          <span className="mx-2">/</span>
          <Link href="/treatments/compare" className="hover:text-neutral-700 transition-colors">
            Compare
          </Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-900">{data.name}</span>
        </motion.nav>

        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link href="/treatments/compare">
            <Button variant="ghost" className="group">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              All Comparisons
            </Button>
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="space-y-4">
            <div className="mb-3 flex flex-wrap gap-2">
              <Badge variant="primary" size="md" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                <Scale className="mr-1.5 h-3.5 w-3.5" />
                Treatment Comparison
              </Badge>
              {data.metadata.drug_class && (
                <Badge variant="outline" size="md">
                  {data.metadata.drug_class}
                </Badge>
              )}
            </div>
            <h1 className="text-4xl font-bold text-neutral-900" itemProp="name headline">
              {data.title}
            </h1>
            <p className="text-lg text-neutral-600 leading-relaxed max-w-3xl">
              {data.description}
            </p>
          </div>
        </motion.div>

        {/* Bottom Line Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500">
                  <Check className="h-4 w-4 text-white" />
                </div>
                Bottom Line
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="bottom-line text-blue-800 leading-relaxed" itemProp="abstract">
                {data.summary.bottom_line}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Links to Both Treatments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10"
        >
          <Link
            href={`/treatments/${data.entities.entity_a.slug}`}
            className="group block"
          >
            <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-blue-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-neutral-900 group-hover:text-blue-600 transition-colors">
                      {data.entities.entity_a.name}
                    </div>
                    {data.entities.entity_a.generic_name && (
                      <div className="text-sm text-neutral-500">
                        ({data.entities.entity_a.generic_name})
                      </div>
                    )}
                  </div>
                  <ArrowRight className="h-5 w-5 text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link
            href={`/treatments/${data.entities.entity_b.slug}`}
            className="group block"
          >
            <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-purple-300">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-semibold text-neutral-900 group-hover:text-purple-600 transition-colors">
                      {data.entities.entity_b.name}
                    </div>
                    {data.entities.entity_b.generic_name && (
                      <div className="text-sm text-neutral-500">
                        ({data.entities.entity_b.generic_name})
                      </div>
                    )}
                  </div>
                  <ArrowRight className="h-5 w-5 text-neutral-400 transition-transform group-hover:translate-x-1 group-hover:text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Side-by-Side Comparison</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="comparison-table w-full">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      {data.comparison_table.headers.map((header, i) => (
                        <th
                          key={i}
                          className={`text-left p-4 font-semibold text-neutral-900 ${
                            i === 1 ? "bg-blue-50/50" : i === 2 ? "bg-purple-50/50" : ""
                          }`}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.comparison_table.rows.map((row, i) => (
                      <tr
                        key={i}
                        className="border-b border-neutral-100 hover:bg-neutral-50/50 transition-colors"
                      >
                        <td className="p-4 font-medium text-neutral-900">
                          {row.feature}
                        </td>
                        <td className="p-4 text-neutral-700 bg-blue-50/30">
                          {row.entity_a}
                        </td>
                        <td className="p-4 text-neutral-700 bg-purple-50/30">
                          {row.entity_b}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-8 mb-12">
          {data.sections.map((section, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + index * 0.05 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">{section.heading}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {section.content && (
                    <p className="text-neutral-700 leading-relaxed">
                      {section.content}
                    </p>
                  )}

                  {section.items && (
                    <ul className="space-y-2">
                      {section.items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-neutral-700">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-neutral-400 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}

                  {section.subsections && section.subsections.map((sub, i) => (
                    <div key={i} className="mt-4 pl-4 border-l-2 border-neutral-200">
                      <h4 className="font-semibold text-neutral-800 mb-2">
                        {sub.heading}
                      </h4>
                      {sub.content && (
                        <p className="text-neutral-700 leading-relaxed">
                          {sub.content}
                        </p>
                      )}
                      {sub.items && (
                        <ul className="mt-2 space-y-1">
                          {sub.items.map((item, j) => (
                            <li key={j} className="flex items-start gap-2 text-neutral-600 text-sm">
                              <span className="mt-1.5 h-1 w-1 rounded-full bg-neutral-400 shrink-0" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}

                  {section.recommendations && (
                    <div className="grid gap-3 mt-4">
                      {section.recommendations.map((rec, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-4 p-4 rounded-lg bg-gradient-to-r from-neutral-50 to-white border border-neutral-100"
                        >
                          <Badge variant="primary" className="shrink-0 mt-0.5">
                            {rec.choose}
                          </Badge>
                          <span className="text-neutral-700">{rec.when}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FAQs */}
        {data.faqs && data.faqs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-12"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-neutral-100">
                  {data.faqs.map((faq, index) => (
                    <div key={index} className="group">
                      <button
                        onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                        className="flex w-full items-center justify-between p-5 text-left hover:bg-neutral-50 transition-colors"
                      >
                        <span className="font-semibold text-neutral-900 pr-4">
                          {faq.q}
                        </span>
                        {expandedFaq === index ? (
                          <ChevronUp className="h-5 w-5 text-neutral-400 shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-neutral-400 shrink-0" />
                        )}
                      </button>
                      <AnimatePresence>
                        {expandedFaq === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <p className="faq-answer px-5 pb-5 text-neutral-600 leading-relaxed">
                              {faq.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Related Comparisons */}
        {data.related_comparisons && data.related_comparisons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mb-12"
          >
            <h2 className="text-xl font-bold text-neutral-900 mb-4">
              Related Comparisons
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.related_comparisons.map((related) => (
                <Link
                  key={related}
                  href={`/treatments/compare/${related}`}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 rounded-full text-sm text-neutral-700 transition-colors group"
                >
                  <Scale className="h-3.5 w-3.5 text-neutral-500" />
                  {related
                    .split("-")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                  <ArrowRight className="h-3.5 w-3.5 text-neutral-400 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Medical Disclaimer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 pt-8 border-t border-neutral-200"
        >
          <div className="bg-neutral-50 rounded-lg p-6">
            <p className="text-sm text-neutral-600 leading-relaxed">
              <strong className="text-neutral-700">Medical Disclaimer:</strong> This comparison is for
              informational purposes only and does not constitute medical advice.
              Always consult with a healthcare provider before starting,
              stopping, or changing any medication.
            </p>
            <p className="text-sm text-neutral-500 mt-3">
              Last reviewed: {data.editorial.lastReviewed} by HeyPsych Medical Review Board
            </p>
          </div>
        </motion.footer>
      </div>
    </main>
  );
}

