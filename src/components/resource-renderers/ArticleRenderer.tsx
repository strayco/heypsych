// src/components/resource-renderers/ArticleRenderer.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, ImageIcon, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { SEOMeta, ReferencesTable, AutoFields } from "./shared";
import { ParsedContent } from "@/components/ui/parsed-content";
import type { ResourceRendererProps } from "./index";

export function ArticleRenderer({ resource }: ResourceRendererProps) {
  const data = resource as any;
  const [showInfographic, setShowInfographic] = useState(false);

  const coverImage = data.coverImage || data.content?.coverImage || data.image_url;

  const bodyBlocks = Array.isArray(data.body)
    ? data.body
    : Array.isArray(data.content?.body)
    ? data.content.body
    : undefined;

  const allSections = data.sections || data.content?.sections;
  // Filter out References section - we'll render it separately
  const sections = Array.isArray(allSections)
    ? allSections.filter((s: any) => s.heading?.toLowerCase() !== 'references')
    : allSections;
  // Extract references section content
  const referencesSection = Array.isArray(allSections)
    ? allSections.find((s: any) => s.heading?.toLowerCase() === 'references')
    : null;

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
          className="border-l-4 border-purple-300 bg-purple-50/60 px-4 py-2 italic text-slate-900"
        >
          {text}
        </blockquote>
      );
    }

    return (
      <p key={index} className="text-slate-900">
        <ParsedContent content={text} />
      </p>
    );
  };

  return (
    <>
      <SEOMeta seo={data.seo} />

      {coverImage && (
        <Card>
          <CardHeader className="pb-2">
            <button
              onClick={() => setShowInfographic(!showInfographic)}
              className="flex w-full items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-base">View Infographic</CardTitle>
              </div>
              {showInfographic ? (
                <ChevronUp className="h-5 w-5 text-slate-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-500" />
              )}
            </button>
          </CardHeader>
          {showInfographic && (
            <CardContent className="pt-0">
              <div className="relative w-full overflow-hidden rounded-lg border">
                <Image
                  src={coverImage}
                  alt={data.name || "Article infographic"}
                  width={1200}
                  height={800}
                  className="w-full h-auto object-contain"
                  priority
                />
              </div>
            </CardContent>
          )}
        </Card>
      )}

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
                <ParsedContent content={introduction} className="text-slate-900" />
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
                    className="text-slate-900"
                  />
                </div>
              ))}

            {conclusion && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-slate-900">Conclusion</h3>
                <ParsedContent content={conclusion} className="text-slate-900" />
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

      {data.related_topics && (
        <AutoFields data={data} title="Related Topics" only={["related_topics"]} />
      )}

      {/* Render references from section or data.references */}
      {referencesSection?.content && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-slate-600" />
              <CardTitle>References</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-3 text-sm text-slate-700">
              {referencesSection.content.split('\n').filter((line: string) => line.trim()).map((ref: string, idx: number) => {
                // Remove leading number and period (e.g., "1. " or "2. ")
                const cleanRef = ref.replace(/^\d+\.\s*/, '').trim();
                // Extract title for search (text before the year in parentheses)
                const titleMatch = cleanRef.match(/^(.+?)\s*\(\d{4}\)/);
                const searchQuery = titleMatch ? titleMatch[1].replace(/,?\s*et al\.?/i, '').trim() : cleanRef;
                const scholarUrl = `https://scholar.google.com/scholar?q=${encodeURIComponent(searchQuery)}`;

                return (
                  <li key={idx} className="leading-relaxed">
                    <a
                      href={scholarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-700 hover:text-purple-900 hover:underline"
                    >
                      {cleanRef}
                      <ExternalLink className="ml-1 inline h-3 w-3" />
                    </a>
                  </li>
                );
              })}
            </ol>
          </CardContent>
        </Card>
      )}

      <ReferencesTable refs={data.references} />
    </>
  );
}
