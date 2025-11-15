"use client";

import React from "react";
import { Header } from "./header";
import { Footer } from "./footer";

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
      {showHeader && <Header />}

      <main className="flex-1">{children}</main>

      {showFooter && <Footer />}
    </div>
  );
}
