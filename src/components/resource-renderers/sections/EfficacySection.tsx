// Phase 2.2: Efficacy Section for Digital Tools V2
//
// Renders clinical trial data with citations and patient-friendly explanations
// Similar to medication efficacy sections but adapted for apps

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, ExternalLink } from 'lucide-react';

interface EfficacySectionProps {
  metric: string;
  value: string;
  comparison?: string;
  text: string;
  patient_text?: string;
  citation?: {
    authors: string;
    title: string;
    journal: string;
    year: number;
    doi?: string;
    pmid?: string;
    url?: string;
  };
}

export function EfficacySection({
  metric,
  value,
  comparison,
  text,
  patient_text,
  citation
}: EfficacySectionProps) {
  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader>
        <div className="flex items-center gap-3">
          <TrendingUp className="h-5 w-5 text-green-700" />
          <CardTitle className="text-lg">How Well Does It Work?</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Big Number Display */}
        <div className="flex items-baseline gap-4 rounded-lg bg-white p-4">
          <div className="text-5xl font-bold text-green-700">{value}</div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900">{metric}</div>
            {comparison && (
              <div className="text-sm text-gray-600">
                vs. {comparison}
              </div>
            )}
          </div>
        </div>

        {/* Patient-Friendly Explanation */}
        {patient_text && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-blue-900">
              In Plain Terms
            </h4>
            <p className="text-sm text-blue-800">{patient_text}</p>
          </div>
        )}

        {/* Clinical Explanation */}
        <div className="text-sm text-gray-700">
          {text}
        </div>

        {/* Citation */}
        {citation && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <div className="text-xs font-semibold text-gray-700 mb-1">Source:</div>
            <div className="text-xs text-gray-600">
              {citation.authors} ({citation.year}). {citation.title}.{' '}
              <em>{citation.journal}</em>.
              {citation.url && (
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  View Study <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
