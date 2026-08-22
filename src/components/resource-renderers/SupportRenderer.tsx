// src/components/resource-renderers/SupportRenderer.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, MapPin, Clock, ExternalLink } from "lucide-react";
import { SEOMeta, SectionList, ReferencesTable, AutoFields } from "./shared";
import type { ResourceRendererProps } from "./index";

export function SupportRenderer({ resource }: ResourceRendererProps) {
  const data = resource as any;

  return (
    <>
      <SEOMeta seo={data.seo} />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-label-secondary" />
            <CardTitle>Support & Community</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.meeting_times && (
            <div className="flex items-center gap-2 text-sm text-label-secondary">
              <Clock className="h-4 w-4 text-label-tertiary" />
              <span>{data.meeting_times}</span>
            </div>
          )}
          {data.location && (
            <div className="flex items-center gap-2 text-sm text-label-secondary">
              <MapPin className="h-4 w-4 text-label-tertiary" />
              <span>{data.location}</span>
            </div>
          )}
          {data.website && (
            <Button variant="secondary">
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
        </CardContent>
      </Card>

      <AutoFields
        data={data}
        title="Group Details"
        only={["group_type", "cost", "registration_required", "accessibility"]}
      />

      <SectionList sections={data.sections} />
      <ReferencesTable refs={data.references} />
    </>
  );
}
