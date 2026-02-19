"use client";

/**
 * Citation List Component
 *
 * Displays scientific references and citations for E-A-T compliance.
 * Shows sources and evidence for clinical claims.
 */

import React from "react";
import { BookOpen, ExternalLink, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface Citation {
  /** Citation title (or use 'text' for full citation string) */
  title?: string;

  /** Full citation text (alternative to title/authors/publication format) */
  text?: string;

  /** Citation ID */
  id?: string;

  /** Author(s) */
  authors?: string;

  /** Publication/journal name */
  publication?: string;

  /** Publication year */
  year?: number | string;

  /** DOI (Digital Object Identifier) */
  doi?: string;

  /** PubMed ID */
  pmid?: string;

  /** URL to full text */
  url?: string;

  /** Citation type (study, review, guideline, etc.) */
  type?: 'study' | 'review' | 'meta-analysis' | 'guideline' | 'book' | 'other';

  /** Additional notes */
  note?: string;
}

interface CitationListProps {
  /** Array of citations */
  citations: Citation[];

  /** Section title */
  title?: string;

  /** Show as numbered list */
  numbered?: boolean;

  /** Show citation type badges */
  showTypes?: boolean;

  /** Compact mode (less spacing) */
  compact?: boolean;
}

export function CitationList({
  citations,
  title = "References",
  numbered = true,
  showTypes = true,
  compact = false,
}: CitationListProps) {
  if (!citations || citations.length === 0) {
    return null;
  }

  const getCitationTypeLabel = (type?: string): string => {
    if (!type) return '';
    const labels: Record<string, string> = {
      study: 'Study',
      review: 'Review',
      'meta-analysis': 'Meta-Analysis',
      guideline: 'Guideline',
      book: 'Book',
      other: 'Reference',
    };
    return labels[type] || 'Reference';
  };

  const getCitationTypeColor = (type?: string): string => {
    const colors: Record<string, string> = {
      study: 'bg-blue-100 text-blue-700',
      review: 'bg-purple-100 text-purple-700',
      'meta-analysis': 'bg-indigo-100 text-indigo-700',
      guideline: 'bg-green-100 text-green-700',
      book: 'bg-amber-100 text-amber-700',
      other: 'bg-neutral-100 text-neutral-700',
    };
    return colors[type || 'other'] || colors.other;
  };

  const formatCitation = (citation: Citation, index: number): string => {
    // If citation has 'text' field (new format), use it directly
    if (citation.text) {
      return citation.text;
    }

    // Otherwise build from structured fields (legacy format)
    let formatted = '';

    if (citation.authors) {
      formatted += `${citation.authors}. `;
    }

    if (citation.year) {
      formatted += `(${citation.year}). `;
    }

    if (citation.title) {
      formatted += citation.title;
    }

    if (citation.publication) {
      formatted += `. ${citation.publication}`;
    }

    return formatted || 'Citation';
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className={`space-y-${compact ? '3' : '4'} ${!numbered && 'list-none'}`}>
          {citations.map((citation, index) => (
            <li key={index} className="text-sm">
              <div className="space-y-2">
                {/* Citation type badge */}
                {showTypes && citation.type && (
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${getCitationTypeColor(citation.type)}`}
                    >
                      <FileText className="h-3 w-3" />
                      {getCitationTypeLabel(citation.type)}
                    </span>
                  </div>
                )}

                {/* Citation text */}
                <p className="text-neutral-800 leading-relaxed">
                  {numbered && <span className="font-semibold mr-2">{index + 1}.</span>}
                  {formatCitation(citation, index)}
                </p>

                {/* DOI, PMID, and links */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {citation.doi && (
                    <a
                      href={`https://doi.org/${citation.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <span className="font-mono">DOI: {citation.doi}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  {citation.pmid && (
                    <a
                      href={`https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <span className="font-mono">PMID: {citation.pmid}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}

                  {citation.url && !citation.doi && !citation.pmid && (
                    <a
                      href={citation.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      <span>View Source</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {/* Note */}
                {citation.note && (
                  <p className="text-xs italic text-neutral-600">{citation.note}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
