"use client";

import React from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import { ScrollToTop } from "@/components/ui/scroll-to-top";

interface MainLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
}

export function MainLayout({
  children,
  showHeader = true,
  showFooter = true,
  className = "",
}: MainLayoutProps) {
  return (
    <div className={`flex min-h-screen flex-col ${className}`}>
      {/* Skip link: the first focusable element on every page. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-label-primary focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-accent"
      >
        Skip to content
      </a>

      {showHeader && <Header />}

      <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>

      {showFooter && <Footer />}

      <ScrollToTop />
    </div>
  );
}
