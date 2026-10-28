// src/components/resource-renderers/GenericRenderer.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOMeta, SectionList, ReferencesTable, AutoFields } from "./shared";
import { ParsedContent } from "@/components/ui/parsed-content";
import type { ResourceRendererProps } from "./index";

export function GenericRenderer({ resource }: ResourceRendererProps) {
  const data = resource as any;
  // summary is usually a string, but comparison records store an object
  // ({ bottom_line, winner_for }); String() on it rendered "[object Object]".
  const summaryText: string | null =
    typeof data.summary === "string"
      ? data.summary
      : typeof data.summary?.bottom_line === "string"
        ? data.summary.bottom_line
        : null;

  return (
    <>
      <SEOMeta seo={data.seo} />

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{String(resource.name ?? "")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {resource.description && (
            <ParsedContent content={String(resource.description)} className="text-label-secondary" />
          )}
          {summaryText && (
            <ParsedContent content={summaryText} className="text-label-secondary" />
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
