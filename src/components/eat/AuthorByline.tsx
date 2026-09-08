"use client";

/**
 * Author Byline Component
 *
 * Displays author information for E-A-T (Expertise, Authoritativeness, Trustworthiness).
 * Wired to Entity.metadata.author and Entity.metadata.medical_reviewer.
 *
 * Review claims are now GATED: only shown when hasReview is true or medicalReviewer is provided.
 * When no review evidence exists, links to review methodology for transparency.
 */

import React from "react";
import { User, CheckCircle, Shield, Info } from "lucide-react";
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

  /**
   * Whether this content has been reviewed.
   * When true, shows Medical Review Board claim.
   * When false/undefined, shows link to review methodology instead.
   */
  hasReview?: boolean;
}

export function AuthorByline({
  author,
  medicalReviewer,
  publishedDate,
  lastUpdated,
  lastReviewed,
  compact = false,
  hasReview,
}: AuthorBylineProps) {
  // Review date should ONLY be the explicit lastReviewed date
  // Do not fall back to lastUpdated or publishedDate - those are not reviews
  const reviewDate = lastReviewed;

  // Check if author is anonymous (Knowledge Hub articles use "anonymous" for contributor content)
  const isAnonymousAuthor = !author ||
    (typeof author === 'string' && (author as string).toLowerCase() === 'anonymous') ||
    (typeof author === 'object' && author.name?.toLowerCase() === 'anonymous');

  // Determine if we should show review claims:
  // - If medicalReviewer is provided, always show
  // - If hasReview is explicitly true, show board claim
  // - If lastReviewed date is provided, infer review happened
  const shouldShowReviewClaim = Boolean(medicalReviewer || hasReview || lastReviewed);

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
        {/* Show review claim only when we have evidence of review */}
        {shouldShowReviewClaim ? (
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
        ) : (
          <div className="flex items-center gap-1">
            <Info className="h-3.5 w-3.5 text-label-tertiary" />
            <Link href="/about/review-methodology" className="text-label-tertiary hover:underline">
              About our review process
            </Link>
          </div>
        )}
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
              {/* Only show review claim if we have evidence of review */}
              {shouldShowReviewClaim ? (
                <div className="mt-1 text-sm text-label-tertiary">
                  Reviewed by the{" "}
                  <Link href="/about/medical-review-board" className="font-medium text-positive-700 hover:text-positive-700 hover:underline">
                    HeyPsych Medical Review Board
                  </Link>
                </div>
              ) : (
                <div className="mt-1 text-sm text-label-tertiary">
                  <Link href="/about/review-methodology" className="hover:underline">
                    About our review process
                  </Link>
                </div>
              )}
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
          ) : shouldShowReviewClaim ? (
            // Show Medical Review Board when hasReview is true but no individual reviewer
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
          ) : (
            // No review evidence - link to review methodology
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-fill-tertiary">
                <Info className="h-6 w-6 text-label-tertiary" />
              </div>
              <div className="flex-1">
                <div className="text-sm text-label-tertiary">
                  <Link href="/about/review-methodology" className="hover:underline">
                    Learn about our clinical review process
                  </Link>
                </div>
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
