/**
 * Admin Login Layout
 *
 * Minimal layout for the login page - no auth check needed here.
 * This overrides the parent admin layout to prevent redirect loops.
 */

import { Metadata } from "next";
import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/auth/admin-auth";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // If already authenticated, redirect to admin dashboard
  const isAuthenticated = await isAdminAuthenticated();
  if (isAuthenticated) {
    redirect("/hp-ctrl-8k3m9x");
  }

  return <>{children}</>;
}
