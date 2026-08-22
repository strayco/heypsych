"use client";

/**
 * Content Timestamps Component
 *
 * Displays publication and update timestamps for E-A-T compliance.
 * Shows content freshness and maintenance.
 */

import React from "react";
import { Calendar, RefreshCw, Clock } from "lucide-react";

export interface TimestampInfo {
  published_date?: string;
  last_updated?: string;
  last_reviewed?: string;
  created_at?: string;
  updated_at?: string;
}

interface ContentTimestampsProps {
  /** Timestamp information */
  timestamps?: TimestampInfo;

  /** Show relative time (e.g., "2 days ago") */
  showRelative?: boolean;

  /** Vertical layout */
  vertical?: boolean;
}

export function ContentTimestamps({
  timestamps,
  showRelative = false,
  vertical = false,
}: ContentTimestampsProps) {
  if (!timestamps) {
    return null;
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const publishDate = timestamps.published_date || timestamps.created_at;
  const updateDate = timestamps.last_updated || timestamps.updated_at;
  const reviewDate = timestamps.last_reviewed;

  const containerClass = vertical
    ? "space-y-2"
    : "flex flex-wrap items-center gap-x-4 gap-y-2";

  return (
    <div className={containerClass}>
      {publishDate && (
        <div className="flex items-center gap-1.5 text-sm text-label-tertiary">
          <Calendar className="h-4 w-4 text-label-primary0" />
          <span className="font-medium">Published:</span>
          <span>
            {formatDate(publishDate)}
            {showRelative && (
              <span className="ml-1 text-label-tertiary">
                ({getRelativeTime(publishDate)})
              </span>
            )}
          </span>
        </div>
      )}

      {updateDate && updateDate !== publishDate && (
        <div className="flex items-center gap-1.5 text-sm text-label-tertiary">
          <RefreshCw className="h-4 w-4 text-label-primary0" />
          <span className="font-medium">Updated:</span>
          <span>
            {formatDate(updateDate)}
            {showRelative && (
              <span className="ml-1 text-label-tertiary">
                ({getRelativeTime(updateDate)})
              </span>
            )}
          </span>
        </div>
      )}

      {reviewDate && (
        <div className="flex items-center gap-1.5 text-sm text-label-tertiary">
          <Clock className="h-4 w-4 text-positive-600" />
          <span className="font-medium text-positive-700">Reviewed:</span>
          <span className="text-positive-700">
            {formatDate(reviewDate)}
            {showRelative && (
              <span className="ml-1 text-label-tertiary">
                ({getRelativeTime(reviewDate)})
              </span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
