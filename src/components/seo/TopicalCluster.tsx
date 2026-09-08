/**
 * Topical Cluster - Hub-and-Spoke Internal Linking
 *
 * INSIDER SEO TACTIC: Google's algorithm heavily rewards topical authority.
 * By creating explicit hub-and-spoke link structures, we signal to Google
 * that we are THE authority on a topic cluster.
 *
 * Structure:
 * - Hub page (pillar content) links to all spoke pages
 * - Each spoke page links back to hub
 * - Spokes link to related spokes
 * - Creates semantic relationships Google can understand
 *
 * This component renders the link structure with SEO-optimized anchor text.
 */
"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, Compass } from "lucide-react";

interface TopicalLink {
  href: string;
  title: string;
  description?: string;
  isHub?: boolean;
}

interface TopicalClusterProps {
  hubTitle: string;
  hubHref: string;
  hubDescription?: string;
  spokes: TopicalLink[];
  currentPage?: string;
  variant?: "compact" | "expanded" | "sidebar";
}

/**
 * Renders hub-and-spoke internal links for topical authority.
 */
export function TopicalCluster({
  hubTitle,
  hubHref,
  hubDescription,
  spokes,
  currentPage,
  variant = "compact",
}: TopicalClusterProps) {
  const filteredSpokes = spokes.filter((s) => s.href !== currentPage);

  if (variant === "sidebar") {
    return (
      <nav
        className="rounded-xl border border-separator bg-surface p-5"
        aria-label={`${hubTitle} topic cluster`}
      >
        {/* Hub Link */}
        <Link
          href={hubHref}
          className="flex items-center gap-2 text-sm font-semibold text-accent hover:underline mb-4"
        >
          <Compass className="h-4 w-4" />
          {hubTitle}
        </Link>

        {/* Spoke Links */}
        <div className="space-y-2">
          {filteredSpokes.slice(0, 8).map((spoke) => (
            <Link
              key={spoke.href}
              href={spoke.href}
              className={`block text-sm hover:text-accent transition-colors ${
                spoke.href === currentPage
                  ? "text-accent font-medium"
                  : "text-label-secondary"
              }`}
            >
              {spoke.title}
            </Link>
          ))}
        </div>

        {filteredSpokes.length > 8 && (
          <Link
            href={hubHref}
            className="mt-4 flex items-center gap-1 text-xs text-accent hover:underline"
          >
            View all {filteredSpokes.length} topics
            <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </nav>
    );
  }

  if (variant === "expanded") {
    return (
      <section
        className="border-t border-separator bg-surface px-4 py-10 sm:px-6 lg:px-8"
        aria-labelledby="topical-cluster-heading"
      >
        <div className="mx-auto max-w-6xl">
          {/* Hub Link with description */}
          <div className="mb-8">
            <h2
              id="topical-cluster-heading"
              className="text-xl font-semibold text-label-primary mb-2"
            >
              Explore {hubTitle}
            </h2>
            {hubDescription && (
              <p className="text-label-secondary">{hubDescription}</p>
            )}
            <Link
              href={hubHref}
              className="mt-3 inline-flex items-center gap-2 text-accent hover:underline font-medium"
            >
              View complete {hubTitle.toLowerCase()} guide
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Spoke Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSpokes.map((spoke) => (
              <Link
                key={spoke.href}
                href={spoke.href}
                className="group rounded-lg border border-separator bg-canvas p-4 hover:border-accent/30 transition-colors"
              >
                <p className="font-medium text-label-primary group-hover:text-accent transition-colors">
                  {spoke.title}
                </p>
                {spoke.description && (
                  <p className="mt-1 text-sm text-label-tertiary line-clamp-2">
                    {spoke.description}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Compact variant (default)
  return (
    <nav
      className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
      aria-label={`Related ${hubTitle} topics`}
    >
      <Link
        href={hubHref}
        className="font-medium text-accent hover:underline"
      >
        {hubTitle}
      </Link>
      <span className="text-label-quaternary">|</span>
      {filteredSpokes.slice(0, 5).map((spoke, i) => (
        <span key={spoke.href}>
          <Link
            href={spoke.href}
            className="text-label-secondary hover:text-accent transition-colors"
          >
            {spoke.title}
          </Link>
          {i < Math.min(filteredSpokes.length, 5) - 1 && (
            <span className="text-label-quaternary ml-4">·</span>
          )}
        </span>
      ))}
      {filteredSpokes.length > 5 && (
        <Link
          href={hubHref}
          className="text-accent hover:underline"
        >
          +{filteredSpokes.length - 5} more
        </Link>
      )}
    </nav>
  );
}

/**
 * Breadcrumb-style topical trail for SEO
 */
interface TopicalTrailProps {
  trail: Array<{ href: string; label: string }>;
}

export function TopicalTrail({ trail }: TopicalTrailProps) {
  return (
    <nav className="flex items-center gap-2 text-sm" aria-label="Breadcrumb">
      {trail.map((item, i) => (
        <span key={item.href} className="flex items-center gap-2">
          {i > 0 && <span className="text-label-quaternary">/</span>}
          {i === trail.length - 1 ? (
            <span className="text-label-primary font-medium">{item.label}</span>
          ) : (
            <Link
              href={item.href}
              className="text-label-secondary hover:text-accent transition-colors"
            >
              {item.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

/**
 * Related Topics Footer - Maximum internal linking
 */
interface RelatedTopicsFooterProps {
  topics: Array<{
    category: string;
    links: Array<{ href: string; label: string }>;
  }>;
}

export function RelatedTopicsFooter({ topics }: RelatedTopicsFooterProps) {
  return (
    <section className="border-t border-separator bg-canvas px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-lg font-semibold text-label-primary mb-6">
          Explore More Topics
        </h2>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {topics.map((topic) => (
            <div key={topic.category}>
              <h3 className="text-sm font-medium text-label-primary mb-3">
                {topic.category}
              </h3>
              <ul className="space-y-2">
                {topic.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-label-secondary hover:text-accent transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TopicalCluster;
