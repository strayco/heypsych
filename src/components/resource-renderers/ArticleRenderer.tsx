// src/components/resource-renderers/ArticleRenderer.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Clock, User, ExternalLink } from "lucide-react";
import { SEOMeta, SectionList, ReferencesTable, AutoFields } from "./shared";
import { ParsedContent } from "@/components/ui/parsed-content";
import type { ResourceRendererProps } from "./index";

export function ArticleRenderer({ resource }: ResourceRendererProps) {
  const data = resource as any;
  const bodyBlocks = Array.isArray(data.body)
    ? data.body
    : Array.isArray(data.content?.body)
    ? data.content.body
    : undefined;

  const sections = data.sections || data.content?.sections;
  const introduction = data.introduction || data.content?.introduction;
  const conclusion = data.conclusion || data.content?.conclusion;

  const renderBodyBlock = (block: any, index: number) => {
    if (!block) return null;
    const type = String(block.type || "").toLowerCase();
    const text = block.text || block.content;
    if (!text) return null;

    if (type === "h1" || type === "h2" || type === "heading") {
      return (
        <h2 key={index} className="text-xl font-semibold text-slate-900">
          {text}
        </h2>
      );
    }

    if (type === "h3") {
      return (
        <h3 key={index} className="text-lg font-semibold text-slate-900">
          {text}
        </h3>
      );
    }

    if (type === "blockquote") {
      return (
        <blockquote
          key={index}
          className="border-l-4 border-purple-300 bg-purple-50/60 px-4 py-2 italic text-slate-700"
        >
          {text}
        </blockquote>
      );
    }

    return (
      <p key={index} className="text-slate-700">
        <ParsedContent content={text} />
      </p>
    );
  };

  return (
    <>
      <SEOMeta seo={data.seo} />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-green-600" />
            <CardTitle>Article</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.author && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <User className="h-4 w-4" />
              <span>By {data.author}</span>
            </div>
          )}
          {data.reading_time && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{data.reading_time} read</span>
            </div>
          )}
          {data.tags && (
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag: string, i: number) => (
                <Badge key={i} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
          {data.external_url && (
            <Button variant="outline">
              <a
                href={data.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center"
              >
                Read Full Article <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
        </CardContent>
      </Card>

      {bodyBlocks && bodyBlocks.length > 0 ? (
        <Card>
          <CardContent className="space-y-4">
            {bodyBlocks.map((block: any, index: number) => renderBodyBlock(block, index))}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-6">
            {introduction && (
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-slate-900">Overview</h2>
                <ParsedContent content={introduction} className="text-slate-700" />
              </div>
            )}

            {Array.isArray(sections) &&
              sections.map((section: any, index: number) => (
                <div key={index} className="space-y-2">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {section.heading || section.title || `Section ${index + 1}`}
                  </h3>
                  <ParsedContent
                    content={section.content || section.text || ""}
                    className="text-slate-700"
                  />
                </div>
              ))}

            {conclusion && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900">Conclusion</h3>
                <ParsedContent content={conclusion} className="text-slate-700" />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {data.excerpt && (
        <Card>
          <CardHeader>
            <CardTitle>Excerpt</CardTitle>
          </CardHeader>
          <CardContent>
            <ParsedContent content={data.excerpt} />
          </CardContent>
        </Card>
      )}

      <SectionList sections={sections} />

      {data.related_topics && (
        <AutoFields data={data} title="Related Topics" only={["related_topics"]} />
      )}

      <ReferencesTable refs={data.references} />
    </>
  );
}
