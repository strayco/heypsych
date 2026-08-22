"use client";

/**
 * Author Byline Component
 *
 * Displays author information for E-A-T (Expertise, Authoritativeness, Trustworthiness).
 * Wired to Entity.metadata.author and Entity.metadata.medical_reviewer.
 *
 * CRITICAL: Always displays "Reviewed by the HeyPsych Medical Review Board" when no individual reviewer specified.
 * This ensures YMYL (Your Money Your Life) medical content E-A-T compliance.
 */

import React from "react";
import { User, CheckCircle, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export interface AuthorInfo {
  name: string;
  credentials?: string;
  role?: string;
  verified?: boolean;
  bio?: string;
  image_url?: string;
}

interface AuthorBylineProps {
  /** Primary author information */
  author?: AuthorInfo;

  /** Medical reviewer information */
  medicalReviewer?: AuthorInfo;

  /** Publication date */
  publishedDate?: string;

  /** Last updated date */
  lastUpdated?: string;

  /** Last medically reviewed date */
  lastReviewed?: string;

  /** Compact mode (single line) */
  compact?: boolean;
}

export function AuthorByline({
  author,
  medicalReviewer,
  publishedDate,
  lastUpdated,
  lastReviewed,
  compact = false,
}: AuthorBylineProps) {
  // Determine review date with fallback priority:
  // 1. lastReviewed (explicit medical review date)
  // 2. lastUpdated (content update date)
  // 3. publishedDate (original publication)
  const reviewDate = lastReviewed || lastUpdated || publishedDate;

  // Check if author is anonymous (Knowledge Hub articles use "anonymous" for contributor content)
  const isAnonymousAuthor = !author || 
    (typeof author === 'string' && (author as string).toLowerCase() === 'anonymous') ||
    (typeof author === 'object' && author.name?.toLowerCase() === 'anonymous');

  // CRITICAL: Never return null - always show Medical Review Board for E-A-T compliance

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm text-label-tertiary">
        {isAnonymousAuthor ? (
          <div className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            <span>By HeyPsych Contributor</span>
          </div>
        ) : author && (
          <div className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            <span>
              {author.name}
              {author.credentials && <span className="ml-1 text-label-tertiary">{author.credentials}</span>}
            </span>
            {author.verified && <CheckCircle className="h-3.5 w-3.5 text-positive-600" />}
          </div>
        )}
        {/* Always show Medical Review Board in compact mode */}
        <div className="flex items-center gap-1">
          <Shield className="h-3.5 w-3.5 text-positive-600" />
          <span>
            {medicalReviewer ? (
              <>Reviewed by {medicalReviewer.name}</>
            ) : (
              <Link href="/about/medical-review-board" className="text-positive-700 hover:underline">
                Reviewed by the HeyPsych Medical Review Board
              </Link>
            )}
          </span>
        </div>
        {reviewDate && (
          <span className="text-label-tertiary">
            • Last reviewed {new Date(reviewDate).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-separator bg-surface p-4">
      <div className="space-y-3">
        {/* Author - Show "HeyPsych Contributor" for anonymous authors */}
        {isAnonymousAuthor ? (
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fill-tertiary">
              <User className="h-6 w-6 text-label-primary0" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-label-primary">By HeyPsych Contributor</div>
              <div className="mt-1 text-sm text-label-tertiary">
                Reviewed by the{" "}
                <Link href="/about/medical-review-board" className="font-medium text-positive-700 hover:text-positive-700 hover:underline">
                  HeyPsych Medical Review Board
                </Link>
              </div>
            </div>
          </div>
        ) : author && (
          <div className="flex items-start gap-3">
            {author.image_url ? (
              <img
                src={author.image_url}
                alt={author.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fill-tertiary">
                <User className="h-6 w-6 text-label-primary0" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="font-semibold text-label-primary">{author.name}</div>
                {author.verified && (
                  <CheckCircle className="h-4 w-4 text-positive-600" aria-label="Verified professional" />
                )}
              </div>
              {author.credentials && (
                <div className="text-sm text-label-tertiary">{author.credentials}</div>
              )}
              {author.role && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {author.role}
                </Badge>
              )}
              {author.bio && <p className="mt-1 text-sm text-label-tertiary">{author.bio}</p>}
            </div>
          </div>
        )}

        {/* Medical Reviewer - ALWAYS SHOW (either individual or board) - Skip for anonymous authors (already shown above) */}
        <div className={`flex items-start gap-3 ${(author || isAnonymousAuthor) ? 'border-t border-separator pt-3' : ''} ${isAnonymousAuthor && !medicalReviewer ? 'hidden' : ''}`}>
          {medicalReviewer ? (
            <>
              {medicalReviewer.image_url ? (
                <img
                  src={medicalReviewer.image_url}
                  alt={medicalReviewer.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-tint">
                  <CheckCircle className="h-6 w-6 text-accent" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-label-primary">{medicalReviewer.name}</div>
                  {medicalReviewer.verified && (
                    <CheckCircle className="h-4 w-4 text-positive-600" aria-label="Verified professional" />
                  )}
                </div>
                {medicalReviewer.credentials && (
                  <div className="text-sm text-label-tertiary">{medicalReviewer.credentials}</div>
                )}
                <Badge variant="outline" className="mt-1 bg-accent-tint text-xs text-accent-700">
                  Medical Reviewer
                </Badge>
                {medicalReviewer.bio && (
                  <p className="mt-1 text-sm text-label-tertiary">{medicalReviewer.bio}</p>
                )}
              </div>
            </>
          ) : (
            // Fallback: Show Medical Review Board when no individual reviewer
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-positive-tint">
                <Shield className="h-6 w-6 text-positive-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-label-primary">
                  <Link href="/about/medical-review-board" className="text-positive-700 hover:underline">
                    Reviewed by the HeyPsych Medical Review Board
                  </Link>
                </div>
                <div className="text-sm text-label-tertiary">
                  Board-certified psychiatrists and mental health professionals
                </div>
                <Badge variant="outline" className="mt-1 bg-positive-tint text-xs text-positive-700">
                  Medical Review Board
                </Badge>
              </div>
            </>
          )}
        </div>

        {/* Dates - Always show review date */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-separator pt-2 text-xs text-label-tertiary">
          {publishedDate && (
            <div>
              Published: {new Date(publishedDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          )}
          {lastUpdated && lastUpdated !== publishedDate && (
            <div>
              Last Updated: {new Date(lastUpdated).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          )}
          {reviewDate && (
            <div className="font-semibold text-positive-700">
              Last Reviewed: {new Date(reviewDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
