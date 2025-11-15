// src/components/resource-renderers/EducationRenderer.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, ExternalLink } from "lucide-react";
import { SEOMeta, SectionList, ReferencesTable, AutoFields } from "./shared";
import type { ResourceRendererProps } from "./index";

export function EducationRenderer({ resource }: ResourceRendererProps) {
  const data = resource as any;

  return (
    <>
      <SEOMeta seo={data.seo} />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BookOpen className="h-6 w-6 text-purple-600" />
            <CardTitle>Educational Resource</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.learning_objectives && (
            <div>
              <h4 className="mb-2 font-semibold text-gray-900">Learning Objectives</h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                {data.learning_objectives.map((objective: string, i: number) => (
                  <li key={i}>{objective}</li>
                ))}
              </ul>
            </div>
          )}

          {data.difficulty_level && (
            <Badge
              variant={
                data.difficulty_level === "Beginner"
                  ? "success"
                  : data.difficulty_level === "Intermediate"
                    ? "default"
                    : "error"
              }
            >
              {data.difficulty_level}
            </Badge>
          )}

          {data.downloadable && (
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download Resource
            </Button>
          )}

          {data.external_url && (
            <Button variant="outline">
              <a
                href={data.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                Access Course <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      <AutoFields
        data={data}
        title="Course Details"
        only={["format", "prerequisites", "certification", "continuing_education"]}
      />

      <SectionList sections={data.sections} />
      <ReferencesTable refs={data.references} />
    </>
  );
}
