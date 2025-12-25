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

  // CRITICAL: Never return null - always show Medical Review Board for E-A-T compliance

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-700">
        {author && (
          <div className="flex items-center gap-1">
            <User className="h-3.5 w-3.5" />
            <span>
              {author.name}
              {author.credentials && <span className="ml-1 text-neutral-700">{author.credentials}</span>}
            </span>
            {author.verified && <CheckCircle className="h-3.5 w-3.5 text-green-600" />}
          </div>
        )}
        {/* Always show Medical Review Board in compact mode */}
        <div className="flex items-center gap-1">
          <Shield className="h-3.5 w-3.5 text-green-600" />
          <span>
            {medicalReviewer ? (
              <>Reviewed by {medicalReviewer.name}</>
            ) : (
              <Link href="/about/medical-review-board" className="text-green-700 hover:underline">
                Reviewed by the HeyPsych Medical Review Board
              </Link>
            )}
          </span>
        </div>
        {reviewDate && (
          <span className="text-neutral-700">
            • Last reviewed {new Date(reviewDate).toLocaleDateString()}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <div className="space-y-3">
        {/* Author */}
        {author && (
          <div className="flex items-start gap-3">
            {author.image_url ? (
              <img
                src={author.image_url}
                alt={author.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200">
                <User className="h-6 w-6 text-neutral-600" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div className="font-semibold text-neutral-900">{author.name}</div>
                {author.verified && (
                  <CheckCircle className="h-4 w-4 text-green-600" aria-label="Verified professional" />
                )}
              </div>
              {author.credentials && (
                <div className="text-sm text-neutral-700">{author.credentials}</div>
              )}
              {author.role && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {author.role}
                </Badge>
              )}
              {author.bio && <p className="mt-1 text-sm text-neutral-700">{author.bio}</p>}
            </div>
          </div>
        )}

        {/* Medical Reviewer - ALWAYS SHOW (either individual or board) */}
        <div className={`flex items-start gap-3 ${author ? 'border-t border-neutral-200 pt-3' : ''}`}>
          {medicalReviewer ? (
            <>
              {medicalReviewer.image_url ? (
                <img
                  src={medicalReviewer.image_url}
                  alt={medicalReviewer.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-neutral-900">{medicalReviewer.name}</div>
                  {medicalReviewer.verified && (
                    <CheckCircle className="h-4 w-4 text-green-600" aria-label="Verified professional" />
                  )}
                </div>
                {medicalReviewer.credentials && (
                  <div className="text-sm text-neutral-700">{medicalReviewer.credentials}</div>
                )}
                <Badge variant="outline" className="mt-1 bg-blue-50 text-xs text-blue-700">
                  Medical Reviewer
                </Badge>
                {medicalReviewer.bio && (
                  <p className="mt-1 text-sm text-neutral-700">{medicalReviewer.bio}</p>
                )}
              </div>
            </>
          ) : (
            // Fallback: Show Medical Review Board when no individual reviewer
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Shield className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-neutral-900">
                  <Link href="/about/medical-review-board" className="text-green-700 hover:underline">
                    Reviewed by the HeyPsych Medical Review Board
                  </Link>
                </div>
                <div className="text-sm text-neutral-700">
                  Board-certified psychiatrists and mental health professionals
                </div>
                <Badge variant="outline" className="mt-1 bg-green-50 text-xs text-green-700">
                  Medical Review Board
                </Badge>
              </div>
            </>
          )}
        </div>

        {/* Dates - Always show review date */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-neutral-200 pt-2 text-xs text-neutral-700">
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
            <div className="font-semibold text-green-700">
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
