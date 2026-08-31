// src/app/architect/demo/page.tsx
// Practice Architect - Demo Experience
// Visual practice builder with fictional products for exploration

import { Metadata } from "next";
import { Suspense } from "react";
import { MyPractice } from "../../_components/MyPractice";
import { ArchitectLoading } from "../../_components/ArchitectLoading";
import { siteConfig } from "@/lib/config/site";

const canonicalUrl = `${siteConfig.url}/architect/demo`;

export const metadata: Metadata = {
  title: "Demo | Practice Architect™",
  description:
    "Try Practice Architect with fictional products. See how easy it is to build your mental health practice technology stack.",
  alternates: {
    canonical: canonicalUrl,
  },
  robots: {
    index: false, // Demo page, not for indexing
    follow: true,
  },
};

export default function DemoPage() {
  return (
    <Suspense fallback={<ArchitectLoading />}>
      <MyPractice isDemo />
    </Suspense>
  );
}
