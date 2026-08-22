"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { siteConfig } from "@/lib/config/site";
import {
  Menu,
  X,
  Search,
  HeartPulse,
  Pill,
  Smartphone,
  MapPin,
  Stethoscope,
  BookOpen,
  Info,
  Compass,
  Users,
  ChevronRight,
} from "lucide-react";

// Icon mapping for navigation items
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "heart-pulse": HeartPulse,
  pill: Pill,
  smartphone: Smartphone,
  "map-pin": MapPin,
  stethoscope: Stethoscope,
  "book-open": BookOpen,
  info: Info,
  compass: Compass,
  users: Users,
};

export function Header() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll position for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  return (
    <header
      className={`
        sticky top-0 z-50 w-full transition-all duration-200
        ${isScrolled
          ? "hp-material border-b border-separator shadow-subtle"
          : "bg-canvas/80 backdrop-blur-md border-b border-transparent"
        }
      `}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group transition-transform group-hover:scale-[1.02]">
            <img
              src="/logo.svg"
              alt={siteConfig.name}
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {siteConfig.navigation.map((item) => {
              const IconComponent = iconMap[item.icon];

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="
                    flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium
                    text-label-secondary transition-all duration-150
                    hover:bg-fill-secondary hover:text-label-primary
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
                  "
                >
                  {IconComponent && <IconComponent className="h-4 w-4" />}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Search and Actions */}
          <div className="flex items-center gap-3">
            {/* Desktop Search */}
            <div className="relative hidden sm:flex">
              <form onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="
                    w-44 rounded-xl border border-separator bg-surface/80 px-3.5 py-2 pl-9
                    text-sm text-label-primary placeholder:text-label-tertiary
                    transition-all duration-200
                    hover:border-separator-opaque
                    focus:w-56 focus:border-accent focus:bg-surface focus:shadow-soft
                    focus:outline-none focus:ring-2 focus:ring-accent/20
                  "
                />
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-label-tertiary" />
              </form>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={toggleMobileMenu}
              className="
                flex h-10 w-10 items-center justify-center rounded-xl
                text-label-secondary transition-all duration-150
                hover:bg-fill-secondary hover:text-label-primary
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
                md:hidden
              "
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="border-t border-separator md:hidden overflow-hidden"
            >
              <nav className="py-4 space-y-1">
                {/* Mobile Search */}
                <div className="relative mb-4 px-1">
                  <form
                    onSubmit={(e) => {
                      handleSearchSubmit(e);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Search conditions, treatments, tools..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="
                        w-full rounded-xl border border-separator bg-surface px-4 py-3 pl-10
                        text-sm text-label-primary placeholder:text-label-tertiary
                        focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20
                      "
                    />
                    <Search className="absolute left-4 top-3.5 h-4 w-4 text-label-tertiary" />
                  </form>
                </div>

                {/* Mobile Navigation Links */}
                {siteConfig.navigation.map((item) => {
                  const IconComponent = iconMap[item.icon];

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="
                        flex items-center justify-between rounded-xl px-3 py-3
                        text-sm font-medium text-label-primary
                        transition-colors duration-150
                        hover:bg-fill-quaternary
                        active:bg-fill-tertiary
                      "
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <div className="flex items-center gap-3">
                        {IconComponent && (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fill-quaternary">
                            <IconComponent className="h-4 w-4 text-label-secondary" />
                          </div>
                        )}
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-label-quaternary" />
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
