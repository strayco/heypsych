"use client";

import { Info, ExternalLink } from "lucide-react";
import {
  CommercialStatus,
  getDisclosureText,
  needsDisclosure,
  type CommercialMetadata,
} from "@/lib/schemas/commercial";

interface AffiliateDisclosureProps {
  /** Commercial metadata for the tool */
  commercial?: CommercialMetadata;
  /** Explicit commercial status (alternative to full metadata) */
  status?: CommercialStatus;
  /** Display variant */
  variant?: "inline" | "block" | "tooltip";
  /** Additional class names */
  className?: string;
}

/**
 * AffiliateDisclosure Component
 *
 * Phase 6: Truthful commercial attribution.
 * Displays disclosure when a link/action involves compensation.
 *
 * USAGE:
 * - Place near affiliate CTAs or "Visit Website" buttons
 * - Use "inline" variant for subtle disclosure in text
 * - Use "block" variant for prominent disclosure in cards
 * - Use "tooltip" variant for hover disclosure on icons
 */
export function AffiliateDisclosure({
  commercial,
  status,
  variant = "inline",
  className = "",
}: AffiliateDisclosureProps) {
  const effectiveStatus = status ?? commercial?.status ?? "unknown";

  // Don't render if no disclosure needed
  if (!needsDisclosure(commercial) && !isCompensatedStatus(effectiveStatus)) {
    return null;
  }

  const disclosureText = getDisclosureText(effectiveStatus, "medium");

  if (variant === "inline") {
    return (
      <span
        className={`inline-flex items-center gap-1 text-xs text-label-tertiary ${className}`}
        title={getDisclosureText(effectiveStatus, "long")}
      >
        <Info className="h-3 w-3" />
        <span>{getDisclosureText(effectiveStatus, "short")}</span>
      </span>
    );
  }

  if (variant === "tooltip") {
    return (
      <span
        className={`inline-flex items-center cursor-help ${className}`}
        title={disclosureText}
      >
        <Info className="h-3.5 w-3.5 text-label-tertiary hover:text-label-secondary" />
      </span>
    );
  }

  // Block variant
  return (
    <div
      className={`flex items-start gap-2 p-3 bg-canvas-inset border border-separator rounded-lg text-xs text-label-secondary ${className}`}
    >
      <Info className="h-4 w-4 text-label-tertiary flex-shrink-0 mt-0.5" />
      <span>{disclosureText}</span>
    </div>
  );
}

/**
 * AffiliateLink Component
 *
 * Wraps an affiliate link with proper disclosure and rel attributes.
 */
interface AffiliateLinkProps {
  /** The affiliate URL */
  href: string;
  /** Commercial metadata */
  commercial?: CommercialMetadata;
  /** Link text or children */
  children: React.ReactNode;
  /** Show inline disclosure */
  showDisclosure?: boolean;
  /** Additional class names */
  className?: string;
}

export function AffiliateLink({
  href,
  commercial,
  children,
  showDisclosure = true,
  className = "",
}: AffiliateLinkProps) {
  const isCompensated = needsDisclosure(commercial) ||
    (commercial?.status && isCompensatedStatus(commercial.status));

  // Build rel attribute - always noopener, add sponsored for compensated links
  const relValue = isCompensated
    ? "noopener nofollow sponsored"
    : "noopener";

  return (
    <span className="inline-flex items-center gap-1.5">
      <a
        href={href}
        target="_blank"
        rel={relValue}
        className={`inline-flex items-center gap-1 hover:underline ${className}`}
      >
        {children}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
      {showDisclosure && isCompensated && (
        <AffiliateDisclosure
          commercial={commercial}
          variant="tooltip"
        />
      )}
    </span>
  );
}

/**
 * PageAffiliateDisclosure Component
 *
 * Full-width disclosure banner for pages with affiliate content.
 * Use at the top of tool detail pages or comparison pages.
 */
interface PageAffiliateDisclosureProps {
  /** Whether the page contains affiliate links */
  hasAffiliateLinks: boolean;
  /** Additional class names */
  className?: string;
}

export function PageAffiliateDisclosure({
  hasAffiliateLinks,
  className = "",
}: PageAffiliateDisclosureProps) {
  if (!hasAffiliateLinks) {
    return null;
  }

  return (
    <div
      className={`py-2 px-4 bg-canvas-inset border-b border-separator text-xs text-label-tertiary text-center ${className}`}
    >
      <Info className="inline h-3 w-3 mr-1 -mt-0.5" />
      Some links on this page may earn us a commission at no extra cost to you.
      Our recommendations are independent of commercial relationships.
    </div>
  );
}

// Helper to check status without full metadata
function isCompensatedStatus(status: CommercialStatus): boolean {
  return status === "active_affiliate" || status === "sponsored";
}

export default AffiliateDisclosure;
