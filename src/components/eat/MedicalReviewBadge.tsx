"use client";

/**
 * Medical Review Badge Component
 *
 * Displays medical review status for E-A-T compliance.
 * Shows verification badge when content has been medically reviewed.
 */

import React from "react";
import { Shield, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface MedicalReviewInfo {
  reviewed: boolean;
  reviewer_name?: string;
  reviewer_credentials?: string;
  review_date?: string;
  next_review_date?: string;
}

interface MedicalReviewBadgeProps {
  /** Medical review information */
  reviewInfo?: MedicalReviewInfo;

  /** Show as prominent badge vs inline */
  prominent?: boolean;

  /** Compact mode (icon only) */
  compact?: boolean;
}

export function MedicalReviewBadge({
  reviewInfo,
  prominent = false,
  compact = false,
}: MedicalReviewBadgeProps) {
  if (!reviewInfo?.reviewed) {
    return null;
  }

  if (compact) {
    return (
      <div
        className="flex items-center gap-1 text-green-700"
        title={`Medically reviewed${reviewInfo.reviewer_name ? ` by ${reviewInfo.reviewer_name}` : ''}`}
      >
        <Shield className="h-4 w-4" />
        <CheckCircle className="h-3 w-3" />
      </div>
    );
  }

  if (prominent) {
    return (
      <div className="rounded-lg border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-green-900">Medically Reviewed</h3>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            {reviewInfo.reviewer_name && (
              <p className="mt-1 text-sm text-green-800">
                Reviewed by {reviewInfo.reviewer_name}
                {reviewInfo.reviewer_credentials && `, ${reviewInfo.reviewer_credentials}`}
              </p>
            )}
            {reviewInfo.review_date && (
              <p className="mt-1 text-xs text-green-700">
                Review Date: {new Date(reviewInfo.review_date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            )}
            {reviewInfo.next_review_date && (
              <div className="mt-2 flex items-center gap-1 text-xs text-green-700">
                <Clock className="h-3 w-3" />
                <span>
                  Next Review: {new Date(reviewInfo.next_review_date).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
      <Shield className="mr-1 h-3 w-3" />
      Medically Reviewed
      {reviewInfo.reviewer_name && ` by ${reviewInfo.reviewer_name}`}
    </Badge>
  );
}
