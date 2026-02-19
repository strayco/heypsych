// src/components/ui/parsed-content.tsx
import React from "react";
import Link from "next/link";
import { parseLinks, getLinkPath } from "@/lib/utils/link-parser";

interface ParsedContentProps {
  content: string;
  className?: string;
  linkClassName?: string;
}

/**
 * Component that parses text with link tokens and renders clickable links
 * Usage: <ParsedContent content="{link:condition:major-depressive-disorder} is treated with {link:treatment:cognitive-behavioral-therapy}" />
 */
export function ParsedContent({ content, className = "", linkClassName = "" }: ParsedContentProps) {
  const parts = parseLinks(content);

  const renderTextWithLineBreaks = (text: string, keyPrefix: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIndex) => (
      <React.Fragment key={`${keyPrefix}-line-${lineIndex}`}>
        {line}
        {lineIndex < lines.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === "link" && part.slug && part.linkType) {
          return (
            <Link
              key={index}
              href={getLinkPath(part.linkType, part.slug)}
              className={`text-blue-600 transition-colors hover:text-blue-800 hover:underline ${linkClassName}`}
            >
              {part.content}
            </Link>
          );
        }

        return <span key={index}>{renderTextWithLineBreaks(part.content, `part-${index}`)}</span>;
      })}
    </span>
  );
}

/**
 * Component specifically for rendering lists of links
 * Usage: <ParsedLinkList items={["{link:condition:depression}", "{link:treatment:prozac}"]} />
 */
interface ParsedLinkListProps {
  items: string[];
  className?: string;
  itemClassName?: string;
  linkClassName?: string;
  separator?: string;
}

export function ParsedLinkList({
  items,
  className = "",
  itemClassName = "",
  linkClassName = "",
  separator = ", ",
}: ParsedLinkListProps) {
  return (
    <div className={className}>
      {items.map((item, index) => (
        <span key={index}>
          <ParsedContent content={item} className={itemClassName} linkClassName={linkClassName} />
          {index < items.length - 1 && separator}
        </span>
      ))}
    </div>
  );
}

/**
 * Component for rendering indications section specifically
 */
interface IndicationsProps {
  indications?: string[];
  className?: string;
}

export function Indications({ indications, className = "" }: IndicationsProps) {
  // Guard against undefined/null/empty indications
  if (!indications || !Array.isArray(indications) || indications.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="mb-2 font-semibold text-slate-900">Primary Indications</h3>
      <div className="flex flex-wrap gap-2">
        {indications.map((indication, index) => {
          const parts = parseLinks(indication);
          return (
            <span
              key={index}
              className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 transition-colors hover:bg-blue-100"
            >
              {parts.map((part, partIndex) => {
                if (part.type === "link" && part.slug && part.linkType) {
                  return (
                    <Link
                      key={partIndex}
                      href={getLinkPath(part.linkType, part.slug)}
                      className="hover:underline"
                    >
                      {part.content}
                    </Link>
                  );
                }
                return <span key={partIndex}>{part.content}</span>;
              })}
            </span>
          );
        })}
      </div>
    </div>
  );
}
