"use client";

/**
 * Assessment CTA Section
 *
 * Renders assessment/screening tool links with prominent CTA styling.
 * Takes structured link data, no embedded linking logic.
 */

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardCheck, ArrowRight, Award } from 'lucide-react';
import type { CandidateLink } from '@/lib/linking/types';

interface AssessmentCTASectionProps {
  /** Assessment links */
  links: CandidateLink[];

  /** Section title (optional, defaults to "Screening Tools") */
  title?: string;

  /** Section description */
  description?: string;

  /** Maximum assessments to display */
  maxDisplay?: number;

  /** Use prominent CTA style */
  prominent?: boolean;
}

export function AssessmentCTASection({
  links,
  title = 'Screening Tools',
  description = 'Take a validated assessment to better understand your symptoms',
  maxDisplay = 5,
  prominent = true,
}: AssessmentCTASectionProps) {
  // Filter to only assessment links
  const assessmentLinks = links.filter(
    (link) =>
      link.linkType === 'condition_to_assessment' ||
      link.linkType === 'assessment_to_condition' ||
      link.metadata?.category === 'assessments-screeners'
  );

  const displayLinks = assessmentLinks.slice(0, maxDisplay);

  // Nothing to render
  if (displayLinks.length === 0) {
    return null;
  }

  if (prominent && displayLinks.length === 1) {
    return renderProminentSingle(displayLinks[0], title, description);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={prominent ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className={`h-5 w-5 ${prominent ? 'text-blue-600' : 'text-neutral-600'}`} />
            {title}
          </CardTitle>
          {description && <p className="text-sm text-neutral-700">{description}</p>}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {displayLinks.map((link, index) => (
              <Link
                key={`${link.targetSlug}-${index}`}
                href={`/resources/${link.targetSlug}`}
                className="group block"
              >
                <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-4 transition-all hover:border-blue-400 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                      <ClipboardCheck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-neutral-900 group-hover:text-blue-700">
                        {link.anchorOptions[0]}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-600">
                        <Award className="h-3 w-3" />
                        <span>Validated Assessment</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-blue-600 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function renderProminentSingle(link: CandidateLink, title: string, description: string) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 via-cyan-50 to-blue-50">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <ClipboardCheck className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="mb-2 text-2xl font-bold text-neutral-900">{title}</h3>
          <p className="mx-auto mb-6 max-w-2xl text-neutral-700">{description}</p>
          <Link href={`/resources/${link.targetSlug}`}>
            <Button size="lg" className="group">
              Take the {link.anchorOptions[0]}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-neutral-600">
            <Award className="h-3 w-3" />
            <span>Free • Validated • Instant Results</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
