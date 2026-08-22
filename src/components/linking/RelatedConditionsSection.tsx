"use client";

/**
 * Related Conditions Section
 *
 * Renders related condition and comorbidity links.
 * Takes structured link data, no embedded linking logic.
 */

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertCircle } from 'lucide-react';
import type { CandidateLink } from '@/lib/linking/types';

interface RelatedConditionsSectionProps {
  /** Related condition links */
  links: CandidateLink[];

  /** Section title (optional, defaults to "Related Conditions") */
  title?: string;

  /** Show link type badges */
  showBadges?: boolean;

  /** Maximum links to display */
  maxDisplay?: number;
}

export function RelatedConditionsSection({
  links,
  title = 'Related Conditions',
  showBadges = false,
  maxDisplay,
}: RelatedConditionsSectionProps) {
  // Filter to only condition-related links
  const conditionLinks = links.filter(
    (link) =>
      link.linkType === 'condition_to_related_condition' ||
      link.linkType === 'condition_to_comorbidity' ||
      link.targetType === 'condition'
  );

  // Apply max display limit if specified
  const displayLinks = maxDisplay
    ? conditionLinks.slice(0, maxDisplay)
    : conditionLinks;

  // Nothing to render
  if (displayLinks.length === 0) {
    return null;
  }

  // Separate comorbidities from related conditions
  const comorbidities = displayLinks.filter(
    (link) => link.linkType === 'condition_to_comorbidity'
  );
  const related = displayLinks.filter(
    (link) => link.linkType !== 'condition_to_comorbidity'
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {comorbidities.length > 0 && (
            <div className="mb-6">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-label-primary">
                <AlertCircle className="h-4 w-4 text-caution-500" />
                Common Comorbidities
              </h4>
              <div className="flex flex-wrap gap-2">
                {comorbidities.map((link, index) => (
                  <Link
                    key={`comorbid-${link.targetSlug}-${index}`}
                    href={`/conditions/${link.targetSlug}`}
                    className="group"
                  >
                    <Badge
                      variant="outline"
                      className="cursor-pointer border-caution-border bg-caution-tint text-caution-700 transition-colors hover:border-caution-500 hover:bg-caution-900/40"
                    >
                      {link.anchorOptions[0]}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {related.length > 0 && (
            <div>
              {comorbidities.length > 0 && (
                <h4 className="mb-3 text-sm font-semibold text-label-primary">
                  Related Conditions
                </h4>
              )}
              <div className="space-y-2">
                {related.map((link, index) => (
                  <Link
                    key={`related-${link.targetSlug}-${index}`}
                    href={`/conditions/${link.targetSlug}`}
                    className="group block rounded-lg border border-separator bg-surface-grouped p-3 transition-all hover:border-accent-border hover:bg-fill-secondary"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-label-primary group-hover:text-accent">
                        {link.anchorOptions[0]}
                      </span>
                      {showBadges && (
                        <Badge variant="outline" className="text-xs">
                          {link.priority}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
