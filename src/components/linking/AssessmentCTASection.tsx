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
      <Card className={prominent ? 'border-accent-500/30 bg-linear-to-r from-accent-900/20 to-surface-grouped' : ''}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className={`h-5 w-5 ${prominent ? 'text-accent' : 'text-label-tertiary'}`} />
            {title}
          </CardTitle>
          {description && <p className="text-sm text-label-secondary">{description}</p>}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {displayLinks.map((link, index) => (
              <Link
                key={`${link.targetSlug}-${index}`}
                href={`/resources/${link.targetSlug}`}
                className="group block"
              >
                <div className="flex items-center justify-between rounded-lg border border-separator bg-surface-grouped p-4 transition-all hover:border-accent-border hover:shadow-card-1">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-tint">
                      <ClipboardCheck className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <div className="font-semibold text-label-primary group-hover:text-accent">
                        {link.anchorOptions[0]}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-label-tertiary">
                        <Award className="h-3 w-3" />
                        <span>Validated Assessment</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-accent transition-transform group-hover:translate-x-1" />
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
      <Card className="border-accent-500/30 bg-linear-to-r from-accent-900/20 via-surface to-accent-900/20 shadow-card-1">
        <CardContent className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-tint">
            <ClipboardCheck className="h-8 w-8 text-accent" />
          </div>
          <h3 className="mb-2 text-2xl font-bold text-label-primary">{title}</h3>
          <p className="mx-auto mb-6 max-w-2xl text-label-secondary">{description}</p>
          <Link href={`/resources/${link.targetSlug}`}>
            <Button size="lg" className="group">
              Take the {link.anchorOptions[0]}
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-label-tertiary">
            <Award className="h-3 w-3" />
            <span>Free • Validated • Instant Results</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
