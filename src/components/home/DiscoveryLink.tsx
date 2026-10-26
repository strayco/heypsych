"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackHomepageDiscoveryClick } from "@/lib/analytics/product-events";

/** A plain link that records which discovery pathway was used. */
export function DiscoveryLink({
  href,
  navItem,
  className,
  children,
}: {
  href: string;
  navItem: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={className} onClick={() => trackHomepageDiscoveryClick(navItem)}>
      {children}
    </Link>
  );
}
