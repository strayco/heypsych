import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { MainLayout } from "@/components/layout/main-layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.heypsych.com"
  ),
  title: "HeyPsych - Mental Health Treatment Education & Resources",
  description:
    "Comprehensive mental health treatment information. Compare medications, therapies, and interventions for depression, anxiety, ADHD, and other conditions.",
  keywords:
    "mental health, treatments, medications, therapy, depression, anxiety, ADHD, brain stimulation, supplements",
  authors: [{ name: "HeyPsych Team" }],
  openGraph: {
    title: "HeyPsych - Mental Health Treatment Education & Resources",
    description:
      "Compare 500+ mental health treatments, medications, and therapies for depression, anxiety, ADHD, and more. Evidence-based, clinically reviewed information.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/android-chrome-512x512.png",
        width: 512,
        height: 512,
        alt: "HeyPsych Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "HeyPsych - Mental Health Treatment Education & Resources",
    description:
      "Compare 500+ mental health treatments, medications, and therapies for depression, anxiety, ADHD, and more. Evidence-based, clinically reviewed.",
    images: ["/android-chrome-512x512.png"],
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      // Google Search prioritizes the first icon for search results
      // 48x48 PNG is optimal for Google Search display
      { url: "/favicon-48x48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/logo-mark.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <QueryProvider>
          <MainLayout>{children}</MainLayout>
        </QueryProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
