// src/components/resource-renderers/GenericRenderer.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOMeta, SectionList, ReferencesTable, AutoFields } from "./shared";
import { ParsedContent } from "@/components/ui/parsed-content";
import type { ResourceRendererProps } from "./index";

export function GenericRenderer({ resource }: ResourceRendererProps) {
  const data = resource as any;

  return (
    <>
      <SEOMeta seo={data.seo} />

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{String(resource.name ?? "")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {resource.description && (
            <ParsedContent content={String(resource.description)} className="text-gray-700" />
          )}
          {data.summary && (
            <ParsedContent content={String(data.summary)} className="text-gray-700" />
          )}
        </CardContent>
      </Card>

      <AutoFields
        title="Details"
        data={data}
        only={["full_name", "purpose", "duration", "tags", "languages", "validated", "free"]}
      />

      <SectionList sections={data.sections} />
      <ReferencesTable refs={data.references} />
    </>
  );
}
