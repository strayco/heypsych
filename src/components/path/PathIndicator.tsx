"use client";

/**
 * The header's "Your path" link. Shown only once the visitor has kept
 * something, so first-time visitors see the site as it was. Renders nothing
 * on the server and on the first client render, so hydration always matches.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { pathWorkspaceEnabled } from "@/lib/config/feature-flags";
import { trackPathEvent } from "./analytics";
import { usePath } from "./store";

export function PathIndicator({ variant = "bar", onNavigate }: { variant?: "bar" | "menu"; onNavigate?: () => void }) {
  const { count, ready } = usePath();
  const pathname = usePathname();
  if (!pathWorkspaceEnabled() || !ready || count === 0) return null;
  const current = pathname === "/my-path";

  const icon = (
    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M4 2.5h8a.5.5 0 0 1 .5.5v10.6a.3.3 0 0 1-.48.24L8 10.8l-4.02 3.04a.3.3 0 0 1-.48-.24V3a.5.5 0 0 1 .5-.5Z" strokeLinejoin="round" />
    </svg>
  );

  if (variant === "menu") {
    return (
      <Link
        href="/my-path"
        onClick={() => {
          trackPathEvent("path_opened", { surface: "header" });
          onNavigate?.();
        }}
        aria-current={current ? "page" : undefined}
        className="hover:bg-fill-quaternary active:bg-fill-tertiary text-label-primary flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium"
      >
        <span className="flex items-center gap-3">
          <span className="bg-accent-tint text-accent flex h-8 w-8 items-center justify-center rounded-lg">{icon}</span>
          Your path
        </span>
        <span className="bg-accent rounded-full px-2 py-0.5 text-[12px] font-semibold text-white tabular-nums">{count}</span>
      </Link>
    );
  }

  return (
    <Link
      href="/my-path"
      onClick={() => trackPathEvent("path_opened", { surface: "header" })}
      aria-current={current ? "page" : undefined}
      aria-label={`Your path, ${count} ${count === 1 ? "item" : "items"}`}
      className="border-separator bg-surface text-label-primary hover:border-accent hover:text-accent focus-visible:ring-accent aria-[current=page]:border-accent inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      {icon}
      <span className="hidden lg:inline">Your path</span>
      <span className="bg-accent min-w-5 rounded-full px-1.5 text-center text-[12px] leading-5 font-semibold text-white tabular-nums">{count}</span>
    </Link>
  );
}
