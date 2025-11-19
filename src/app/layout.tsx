import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { QueryProvider } from "@/components/providers/query-provider";
import { MainLayout } from "@/components/layout/main-layout";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HeyPsych - Mental Health Treatment Education",
  description:
    "Beautiful, comprehensive mental health treatment information and comparison platform",
  keywords:
    "mental health, treatments, medications, therapy, depression, anxiety, ADHD, brain stimulation, supplements",
  authors: [{ name: "HeyPsych Team" }],
  openGraph: {
    title: "HeyPsych - Mental Health Treatment Education",
    description:
      "Discover, compare, and understand mental health treatments with our evidence-based platform",
    type: "website",
    locale: "en_US",
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/logo-mark.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
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
