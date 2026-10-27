import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { MainLayout } from "@/components/layout/main-layout";
import { displayFont, interfaceFont } from "@/components/brand/fonts";

// Viewport configuration for Lighthouse SEO 100/100
// Next.js 14+ requires viewport in separate export from metadata
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  // Browser chrome (mobile address bar, PWA title bar) takes the paper tone.
  themeColor: '#FAF9F6',
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://heypsych.com"
  ),
  title: {
    default: "HeyPsych | Make Better Mental Health Decisions",
    template: "%s | HeyPsych",
  },
  description:
    "Make better mental health decisions. For patients: find the right care, apps, and treatments. For clinicians: build the right practice stack with transparent pricing.",
  keywords:
    "mental health, psychiatry, therapy, EHR, practice management, mental health apps, find psychiatrist, compare treatments",
  authors: [{ name: "HeyPsych Team" }],
  openGraph: {
    images: [
      {
        url: "/images/og/heypsych.png",
        width: 1200,
        height: 630,
        alt: "HeyPsych: A little clarity changes everything. Two illustrated rooms: a calm reading room for finding support, and a private practice office for building a practice.",
      },
    ],
    title: "HeyPsych | Make Better Mental Health Decisions",
    description:
      "Make better mental health decisions. Find the right care, compare treatments, or build your practice stack with transparent pricing.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    images: [
      {
        url: "/images/og/heypsych.png",
        width: 1200,
        height: 630,
        alt: "HeyPsych: A little clarity changes everything. Two illustrated rooms: a calm reading room for finding support, and a private practice office for building a practice.",
      },
    ],
    card: "summary_large_image",
    title: "HeyPsych | Make Better Mental Health Decisions",
    description:
      "Make better mental health decisions. For patients and clinicians.",
  },
  // Icons. Every file is rendered from the one brand mark
  // (src/components/brand/Wordmark.tsx), so whichever one a browser or Google
  // picks, it is the same cube. Google Search requires a square icon at a
  // multiple of 48px: the 48/96/192 PNGs satisfy that; the SVG keeps tabs
  // crisp on high-density screens; the .ico is the legacy fallback.
  // Version tag forces browsers to drop a cached old icon after a rebrand;
  // bump it whenever the icon files change.
  icons: {
    icon: [
      { url: "/favicon.ico?v=20261027", sizes: "48x48" },
      { url: "/favicon.svg?v=20261027", type: "image/svg+xml" },
      { url: "/favicon-48x48.png?v=20261027", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96x96.png?v=20261027", sizes: "96x96", type: "image/png" },
      { url: "/favicon-192x192.png?v=20261027", sizes: "192x192", type: "image/png" },
    ],
    apple: { url: "/apple-touch-icon.png?v=20261027", sizes: "180x180" },
    shortcut: "/favicon.ico?v=20261027",
  },
  manifest: "/site.webmanifest?v=20261027",
  applicationName: "HeyPsych",
  appleWebApp: { title: "HeyPsych", statusBarStyle: "default" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${interfaceFont.variable}`}>
      <body className={interfaceFont.className} suppressHydrationWarning>
        <QueryProvider>
          <MainLayout>{children}</MainLayout>
        </QueryProvider>
        <Analytics />
        {/* Speed Insights is billed per data point; a 25% sample is still
            plenty to see Core Web Vitals trends. */}
        <SpeedInsights sampleRate={0.25} />
      </body>
    </html>
  );
}
