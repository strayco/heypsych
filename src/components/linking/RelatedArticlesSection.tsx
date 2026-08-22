"use client";

/**
 * Related Articles Section
 *
 * Renders resource and article links.
 * Takes structured link data, no embedded linking logic.
 */

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, FileText, ArrowRight } from 'lucide-react';
import type { CandidateLink } from '@/lib/linking/types';

interface RelatedArticlesSectionProps {
  /** Resource/article links */
  links: CandidateLink[];

  /** Section title (optional, defaults to "Related Resources") */
  title?: string;

  /** Maximum articles to display */
  maxDisplay?: number;

  /** Show link type badges */
  showBadges?: boolean;
}

export function RelatedArticlesSection({
  links,
  title = 'Related Resources',
  maxDisplay = 8,
  showBadges = false,
}: RelatedArticlesSectionProps) {
  // Filter to only resource-related links
  const resourceLinks = links.filter(
    (link) =>
      link.linkType === 'resource_to_condition' ||
      link.linkType === 'resource_to_treatment' ||
      link.linkType === 'related_content' ||
      link.targetType === 'resource'
  );

  const displayLinks = resourceLinks.slice(0, maxDisplay);

  // Nothing to render
  if (displayLinks.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-accent" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {displayLinks.map((link, index) => (
              <Link
                key={`${link.targetSlug}-${index}`}
                href={`/resources/${link.targetSlug}`}
                className="group block"
              >
                <div className="flex items-center gap-3 rounded-lg border border-separator bg-surface-grouped p-4 transition-all hover:border-accent-border hover:bg-fill-secondary">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-tint">
                    <FileText className="h-5 w-5 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-label-primary group-hover:text-accent">
                      {link.anchorOptions[0]}
                    </div>
                    {showBadges && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {link.linkType}
                      </Badge>
                    )}
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-label-tertiary transition-transform group-hover:translate-x-1 group-hover:text-accent" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
