"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config/site";
import { Menu, X, Search, Pill, Brain, BookOpen, Users, Info } from "lucide-react";

const iconMap = {
  pill: Pill,
  brain: Brain,
  "book-open": BookOpen,
  users: Users,
  info: Info,
};

export function Header() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <motion.div
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-2"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                  <span className="text-lg font-bold text-white">H</span>
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent">
                  {siteConfig.name}
                </span>
              </motion.div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-8 md:flex">
            {siteConfig.navigation.map((item) => {
              const IconComponent = iconMap[item.icon as keyof typeof iconMap];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-1 text-sm font-medium text-neutral-900 transition-colors hover:text-neutral-700"
                >
                  {IconComponent && <IconComponent className="h-4 w-4" />}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Search and Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden sm:flex">
              <form onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  placeholder="Search treatments, conditions, resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 rounded-lg border border-gray-300 px-4 py-2 pl-10 text-sm text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
              </form>
            </div>

            {/* Mobile menu button */}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={toggleMobileMenu}>
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t md:hidden"
          >
            <nav className="space-y-2 py-4">
              {/* Mobile Search */}
              <div className="relative mb-4">
                <form
                  onSubmit={(e) => {
                    handleSearchSubmit(e);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  <input
                    type="text"
                    placeholder="Search treatments, conditions, resources..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 pl-10 text-sm text-neutral-900 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <Search className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
                </form>
              </div>

              {/* Mobile Navigation Links */}
              {siteConfig.navigation.map((item) => {
                const IconComponent = iconMap[item.icon as keyof typeof iconMap];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50 hover:text-neutral-700"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {IconComponent && <IconComponent className="h-5 w-5" />}
                    <span>{item.name}</span>
                  </Link>
                );
              })}

              {/* Mobile Action Buttons */}
              <div className="border-t pt-4">
                <div className="flex space-x-2">
                  <Button size="sm" className="flex-1">
                    Sign In
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    Sign Up
                  </Button>
                </div>
              </div>
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
}
