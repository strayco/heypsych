"use client";

import React from "react";
import Link from "next/link";
import { siteConfig } from "@/lib/config/site";
import { Phone } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: "Explore",
      links: [
        { name: "Conditions", href: "/conditions" },
        { name: "Treatments", href: "/treatments" },
        { name: "Tools", href: "/tools" },
        { name: "Find Care", href: "/psychiatrists" },
      ],
    },
    {
      title: "Resources",
      links: [
        { name: "Knowledge Hub", href: "/resources/knowledge-hub" },
        { name: "Assessments", href: "/resources/assessments-screeners" },
        { name: "For Clinicians", href: "/tools/for-clinicians" },
      ],
    },
    {
      title: "Company",
      links: [
        { name: "About", href: "/about" },
        { name: "Privacy", href: "/privacy" },
        { name: "Terms", href: "/terms" },
        { name: "Contact", href: "mailto:hello@heypsych.com" },
      ],
    },
  ];

  return (
    <footer id="site-footer" className="border-t border-separator bg-surface">
      {/* Crisis Support Banner */}
      <div className="bg-negative-tint border-b border-negative-border">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-negative text-white">
                <Phone className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium text-negative-700">
                If you&apos;re in crisis, help is available 24/7
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="tel:988"
                className="text-sm font-semibold text-negative hover:underline"
              >
                Call or text 988
              </a>
              <span className="text-negative-border">|</span>
              <Link
                href="/resources/support-community/immediate-crisis"
                className="text-sm font-medium text-negative-600 hover:text-negative hover:underline"
              >
                More resources
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          {/* Brand Section */}
          <div className="col-span-2 lg:col-span-2">
            <div className="mb-4">
              <img
                src="/logo.svg"
                alt={siteConfig.name}
                className="h-10 w-auto"
              />
            </div>
            <p className="mb-6 max-w-xs text-sm leading-relaxed text-label-secondary">
              Better mental health starts with better decisions.
            </p>
            <p className="text-xs text-label-tertiary">
              Decision-support reviewed by mental health professionals.
            </p>
          </div>

          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-4 text-sm font-semibold text-label-primary">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-label-secondary transition-colors hover:text-accent"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-separator">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-label-tertiary">
              © {currentYear} {siteConfig.name}. All rights reserved.
            </p>
            <p className="text-xs text-label-quaternary">
              HeyPsych provides decision-support information. Not a substitute for professional medical advice.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
