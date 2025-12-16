// src/components/resource-renderers/sections/PlatformComparisonSection.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Smartphone, Monitor, Star, ExternalLink } from "lucide-react";

interface Platform {
  name: string;
  features: string;
  download?: string;
  url?: string;
  rating?: string;
}

interface PlatformComparisonSectionProps {
  heading?: string;
  platforms: Platform[];
}

export function PlatformComparisonSection({
  heading,
  platforms
}: PlatformComparisonSectionProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Smartphone className="h-5 w-5 text-indigo-600" />
          <CardTitle className="text-lg">{heading || "Platform Availability"}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {platforms.map((platform, i) => (
            <div
              key={i}
              className="rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {platform.name.toLowerCase().includes("web") ? (
                    <Monitor className="h-5 w-5 text-indigo-600" />
                  ) : (
                    <Smartphone className="h-5 w-5 text-indigo-600" />
                  )}
                  <h4 className="font-semibold text-gray-900">{platform.name}</h4>
                </div>
                {platform.rating && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current text-yellow-500" />
                    {platform.rating}
                  </Badge>
                )}
              </div>
              <p className="mb-3 text-sm text-gray-700">{platform.features}</p>
              {(platform.download || platform.url) && (
                <a
                  href={platform.download || platform.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button size="sm" variant="outline">
                    {platform.download ? "Download" : "Visit"}
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </a>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
