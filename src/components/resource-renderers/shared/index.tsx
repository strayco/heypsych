// src/components/resource-renderers/shared/index.tsx
import React from "react";
import Head from "next/head";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParsedContent } from "@/components/ui/parsed-content";
import { ExternalLink, Clock, Info, AlertTriangle } from "lucide-react";

/* ========= Types ========= */
export type Section = {
  type?: string;
  title?: string;
  heading?: string;
  text?: string;
  content?: string;
  [key: string]: unknown;
};

export type Reference = {
  title?: string;
  authors?: string;
  journal?: string;
  year?: number | string;
  volume?: string | number;
  pages?: string;
  doi?: string;
};

/* ========= Common Components ========= */

export function SEOMeta({ seo }: { seo?: any }) {
  if (!seo) return null;
  const { title, description, keywords } = seo;
  return (
    <Head>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      {Array.isArray(keywords) && keywords.length > 0 && (
        <meta name="keywords" content={keywords.join(", ")} />
      )}
    </Head>
  );
}

export function SectionList({ sections = [] }: { sections?: Section[] }) {
  if (!Array.isArray(sections) || sections.length === 0) return null;
  return (
    <div className="space-y-6">
      {sections.map((section: Section, index: number) => (
        <Card key={`${String(section?.title ?? section?.type ?? "section")}-${index}`}>
          <CardHeader>
            <CardTitle className="text-lg">
              {String(section?.title ?? section?.heading ?? section?.type ?? "Section")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ParsedContent
              content={
                typeof section?.text === "string"
                  ? section.text
                  : typeof section?.content === "string"
                  ? section.content
                  : JSON.stringify(section)
              }
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ReferencesTable({ refs = [] }: { refs?: Reference[] }) {
  if (!Array.isArray(refs) || refs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">References</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {refs.map((ref, i) => {
            if (!ref) return null;

            const bits: string[] = [];
            if (ref.authors) bits.push(ref.authors);
            if (ref.year != null) bits.push(String(ref.year));
            if (ref.journal) bits.push(ref.journal);
            if (ref.volume) bits.push(String(ref.volume));
            if (ref.pages) bits.push(String(ref.pages));

            const citationText = ref.title
              ? `${ref.title}${bits.length ? ` (${bits.join(", ")})` : ""}`
              : bits.join(", ") || "Untitled";

            return (
              <div key={i}>
                {ref.doi ? (
                  <a
                    className="inline-flex items-center gap-2 text-sm leading-relaxed text-sky-600 hover:text-sky-800 hover:underline"
                    href={`https://doi.org/${encodeURIComponent(ref.doi)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {citationText}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                ) : (
                  <span className="text-sm leading-relaxed text-slate-700">{citationText}</span>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export function AutoFields({
  data,
  title = "Details",
  exclude = [],
  only,
  collapsible = false,
  defaultOpen = true,
}: {
  data?: Record<string, any> | null;
  title?: string;
  exclude?: string[];
  only?: string[];
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState<boolean>(defaultOpen);
  if (!data || typeof data !== "object") return null;

  const labelMap: Record<string, string> = {
    full_name: "Full name",
    assessment_type: "Assessment type",
    age_range: "Age range",
    target_populations: "Target populations",
    psychometric_properties: "Psychometric properties",
    clinical_use: "Clinical use",
    clinical_alerts: "Clinical alerts",
    functional_question: "Functional question",
    downloadable_pdf: "Downloadable PDF",
    interactive_version: "Interactive version",
    primary_care: "Primary Care",
    specialty_care: "Specialty Care",
    outcome_measurement: "Outcome Measurement",
    population_screening: "Population Screening",
    research: "Research",
  };

  const hardExclude = new Set([
    "kind",
    "slug",
    "name",
    "summary",
    "description",
    "metadata",
    "sections",
    "questions",
    "response_options",
    "scoring",
    "seo",
    "references",
  ]);

  let keys = Object.keys(data).filter((k) => !hardExclude.has(k) && !exclude.includes(k));
  if (only && only.length) keys = only.filter((k) => keys.includes(k));
  if (keys.length === 0) return null;

  const humanLabel = (k: string) =>
    labelMap[k] ?? k.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

  const renderValue = (value: any): React.ReactNode => {
    if (value == null) return "—";

    if (typeof value === "boolean") {
      return (
        <span
          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
            value
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-slate-200 bg-slate-50 text-slate-700"
          }`}
        >
          {value ? "Yes" : "No"}
        </span>
      );
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return "—";
      return (
        <div className="flex flex-wrap gap-1">
          {value.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
            >
              {String(item)}
            </span>
          ))}
        </div>
      );
    }

    if (typeof value === "object") {
      const entries = Object.entries(value);
      if (entries.length === 0) return "—";

      const allBooleans = entries.every(([_, v]) => typeof v === "boolean");
      if (allBooleans) {
        const trueItems = entries.filter(([_, v]) => v === true).map(([k, _]) => humanLabel(k));

        if (trueItems.length === 0) return "—";

        return (
          <div className="flex flex-wrap gap-1">
            {trueItems.map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
              >
                {item}
              </span>
            ))}
          </div>
        );
      }

      return (
        <div className="space-y-1 text-sm">
          {entries.map(([k, v]) => (
            <div key={k}>
              <span className="font-medium">{humanLabel(k)}:</span> {String(v)}
            </div>
          ))}
        </div>
      );
    }

    return String(value);
  };

  const Body = (
    <div className="space-y-4">
      {keys.map((key) => (
        <div key={key} className="flex flex-col gap-2 sm:flex-row sm:items-start">
          <div className="min-w-[140px] text-sm font-semibold text-slate-800">
            {humanLabel(key)}
          </div>
          <div className="flex-1 text-sm text-slate-700">{renderValue(data[key])}</div>
        </div>
      ))}
    </div>
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        {collapsible && (
          <button
            type="button"
            className="text-sm text-slate-500 hover:text-slate-700"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? "Hide" : "Show"}
          </button>
        )}
      </CardHeader>
      {(!collapsible || open) && <CardContent>{Body}</CardContent>}
    </Card>
  );
}

export function MedicalDisclaimer() {
  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-lg text-amber-800">Important Notice</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-amber-800">
        <p>
          This assessment is for <strong>educational and informational purposes only</strong> and is
          not intended to provide medical advice, diagnosis, or treatment.
        </p>
        <p>
          Results should not replace professional medical consultation. If you are experiencing
          mental health concerns or thoughts of self-harm, please consult with a qualified
          healthcare provider or contact a mental health crisis line immediately.
        </p>
      </CardContent>
    </Card>
  );
}
