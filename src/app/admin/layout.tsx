/**
 * Admin Layout
 *
 * Protected admin area for vendor management, lead qualification,
 * and content moderation.
 *
 * Access: Requires admin authentication (TODO: implement auth check)
 */

import { Metadata } from "next";
import Link from "next/link";
import {
  Building2,
  Users,
  FileText,
  BarChart3,
  Settings,
  Home,
  Shield,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Admin Dashboard | HeyPsych",
  robots: {
    index: false,
    follow: false,
  },
};

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/vendors", label: "Vendors", icon: Building2 },
  { href: "/admin/leads", label: "Leads", icon: Users },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO: Add authentication check
  // const session = await getSession();
  // if (!session?.user?.isAdmin) redirect("/");

  return (
    <div className="min-h-screen bg-canvas">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b border-separator bg-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-accent" />
              <span className="font-semibold text-label-primary">
                HeyPsych Admin
              </span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-label-secondary hover:text-label-primary"
            >
              View Site →
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl flex">
        {/* Sidebar */}
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-56 shrink-0 border-r border-separator bg-surface lg:block">
          <nav className="flex flex-col gap-1 p-4">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-label-secondary transition-colors hover:bg-fill-secondary hover:text-label-primary"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
