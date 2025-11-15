// src/components/resource-renderers/DigitalToolRenderer.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Smartphone, Star, Download, ExternalLink, Shield } from "lucide-react";
import { SEOMeta, SectionList, ReferencesTable, AutoFields } from "./shared";
import type { ResourceRendererProps } from "./index";

export function DigitalToolRenderer({ resource }: ResourceRendererProps) {
  const data = resource as any;

  return (
    <>
      <SEOMeta seo={data.seo} />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Smartphone className="h-6 w-6 text-indigo-600" />
            <CardTitle>Digital Tool</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.app_rating && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 fill-current text-yellow-500" />
              <span className="font-medium">{data.app_rating}</span>
              {data.total_reviews && (
                <span className="text-sm text-gray-600">({data.total_reviews} reviews)</span>
              )}
            </div>
          )}

          {data.platforms && (
            <div>
              <h4 className="mb-2 font-semibold text-gray-900">Available On</h4>
              <div className="flex flex-wrap gap-2">
                {data.platforms.map((platform: string, i: number) => (
                  <Badge key={i} variant="outline">
                    {platform}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {data.privacy_certified && (
            <div className="flex items-center gap-2 text-green-700">
              <Shield className="h-4 w-4" />
              <span className="text-sm font-medium">Privacy Certified</span>
            </div>
          )}

          <div className="flex gap-3">
            {data.app_store_url && (
              <Button>
                <a
                  href={data.app_store_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download App
                </a>
              </Button>
            )}

            {data.website && (
              <Button variant="outline">
                <a
                  href={data.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  Visit Website <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AutoFields
        data={data}
        title="Technical Details"
        only={["system_requirements", "offline_access", "subscription_model", "data_export"]}
      />

      <SectionList sections={data.sections} />
      <ReferencesTable refs={data.references} />
    </>
  );
}
