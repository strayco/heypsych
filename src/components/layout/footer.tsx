"use client";

import React from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/config/site";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, ExternalLink } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Treatments",
      links: [
        { name: "Medications", href: "/treatments/medications" },
        { name: "Interventional", href: "/treatments/interventional" },
        { name: "Investigational", href: "/treatments/investigational" },
        { name: "Alternative", href: "/treatments/alternative" },
        { name: "Therapy", href: "/treatments/therapy" },
        { name: "Supplements", href: "/treatments/supplements" },
      ],
    },
    {
      title: "Conditions",
      links: [
        { name: "Depression", href: "/conditions/major-depressive-disorder" },
        { name: "Anxiety", href: "/conditions/generalized-anxiety-disorder" },
        { name: "ADHD", href: "/conditions/attention-deficit-hyperactivity-disorder" },
        { name: "Bipolar", href: "/conditions/bipolar-i-disorder" },
        { name: "All Conditions", href: "/conditions" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Assessments & Screeners", href: "/resources/assessments-screeners" },
        { name: "Support & Community", href: "/resources/support-community" },
        { name: "Digital Tools", href: "/resources/digital-tools" },
        { name: "Knowledge Hub", href: "/resources/knowledge-hub" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About Us", href: "/about" },
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Service", href: "/terms" },
        { name: "Contact", href: "mailto:hello@heypsych.com" },
      ],
    },
  ];

  const socialLinks: any[] = [];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Newsletter Section */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h3 className="mb-4 text-2xl font-bold">Stay updated on mental health treatments</h3>
            <p className="mx-auto mb-6 max-w-2xl text-gray-400">
              Get the latest research, treatment updates, and evidence-based insights delivered to
              your inbox. No spam, just valuable mental health information.
            </p>
            <div className="mx-auto flex max-w-md flex-col gap-4 sm:flex-row opacity-60">
              <input
                type="email"
                placeholder="Enter your email"
                disabled
                className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-4 py-3 text-white placeholder-gray-400 cursor-not-allowed opacity-50"
              />
              <Button
                size="lg"
                className="px-8"
                disabled
              >
                Subscribe
              </Button>
            </div>
            <p className="mt-3 text-sm text-yellow-400">
              Coming Soon
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Newsletter subscription will be available soon.
            </p>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
                <span className="text-lg font-bold text-white">H</span>
              </div>
              <span className="text-xl font-bold">{siteConfig.name}</span>
            </div>
            <p className="mb-6 max-w-sm text-gray-400">
              Evidence-based mental health treatment education platform. Helping you make informed
              decisions about your mental health journey.
            </p>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social) => {
                const IconComponent = social.icon;
                return (
                  <Link
                    key={social.name}
                    href={social.href}
                    className="text-gray-400 transition-colors hover:text-white"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconComponent className="h-5 w-5" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-4 text-lg font-semibold">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="flex items-center text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      {link.name}
                      {link.href.startsWith("http") && <ExternalLink className="ml-1 h-3 w-3" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <p className="text-sm text-gray-400">
              © {currentYear} {siteConfig.name}. All rights reserved.
            </p>
            <Badge variant="outline" className="border-gray-600 text-gray-400">
              Made with <Heart className="mx-1 h-3 w-3 text-red-500" /> for better mental health
            </Badge>
          </div>
        </div>
      </div>
    </footer>
  );
}
