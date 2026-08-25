/**
 * Admin Layout
 *
 * Protected admin area for vendor management, lead qualification,
 * and content moderation.
 *
 * Access: Requires ADMIN_PASSWORD authentication via session cookie
 */

import { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Building2,
  Users,
  FileText,
  BarChart3,
  Settings,
  Home,
  Shield,
} from "lucide-react";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";
import { AdminLogoutButton } from "./_components/AdminLogoutButton";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

const NAV_ITEMS = [
  { href: "/hp-ctrl-8k3m9x", label: "Dashboard", icon: Home },
  { href: "/hp-ctrl-8k3m9x/vendors", label: "Vendors", icon: Building2 },
  { href: "/hp-ctrl-8k3m9x/leads", label: "Leads", icon: Users },
  { href: "/hp-ctrl-8k3m9x/content", label: "Content", icon: FileText }, // TODO: Build page
  { href: "/hp-ctrl-8k3m9x/analytics", label: "Analytics", icon: BarChart3 }, // TODO: Build page
  { href: "/hp-ctrl-8k3m9x/settings", label: "Settings", icon: Settings }, // TODO: Build page
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Check authentication - redirect to login if not authenticated
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    redirect("/hp-ctrl-8k3m9x/login");
  }

  return (
    <div className="min-h-screen bg-canvas">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b border-separator bg-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link href="/hp-ctrl-8k3m9x" className="flex items-center gap-2">
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
            <AdminLogoutButton />
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
