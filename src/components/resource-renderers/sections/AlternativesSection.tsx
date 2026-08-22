// src/components/resource-renderers/sections/AlternativesSection.tsx
import React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ExternalLink } from "lucide-react";

interface Alternative {
  slug?: string;
  name?: string;
  comparison: string;
  url?: string;
}

interface AlternativesSectionProps {
  heading?: string;
  items: Alternative[];
}

export function AlternativesSection({
  heading,
  items
}: AlternativesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{heading || "Similar Apps to Consider"}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.map((alt, i) => (
            <div
              key={i}
              className="rounded-lg border border-separator bg-fill-quaternary p-4"
            >
              <div className="mb-2 flex items-start justify-between">
                <h4 className="font-semibold text-label-primary">
                  {alt.name || alt.slug?.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                </h4>
                {alt.slug && (
                  <Link
                    href={`/resources/${alt.slug}`}
                    className="flex items-center gap-1 text-sm text-accent hover:text-accent-700"
                  >
                    View
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
                {!alt.slug && alt.url && (
                  <a
                    href={alt.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-accent hover:text-accent-700"
                  >
                    Visit
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <p className="text-sm text-label-primary">{alt.comparison}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
