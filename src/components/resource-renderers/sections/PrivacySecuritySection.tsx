// Phase 2.2: Privacy & Security Section for Digital Tools V2
//
// Displays privacy rating, data collection practices, and compliance

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface PrivacySecuritySectionProps {
  privacy_rating?: {
    grade: string;
    data_collected: string[];
    data_shared: string[];
    data_sold: boolean;
    encryption: boolean;
    gdpr_compliant: boolean;
    ccpa_compliant: boolean;
    certification?: string;
  };
  summary?: string;
  items?: string[];
  concerns?: string[];
  hipaa_note?: string;
}

export function PrivacySecuritySection({
  privacy_rating,
  summary,
  items,
  concerns,
  hipaa_note
}: PrivacySecuritySectionProps) {
  // Get grade color
  const getGradeColor = (grade: string) => {
    const letter = grade.charAt(0).toUpperCase();
    switch (letter) {
      case 'A': return 'text-positive-700 bg-positive-tint border-positive-border';
      case 'B': return 'text-accent-700 bg-accent-tint-hover border-accent-border';
      case 'C': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'D': return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'F': return 'text-negative-700 bg-negative-tint border-negative-border';
      default: return 'text-label-primary bg-fill-tertiary border-separator';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-accent" />
            <CardTitle className="text-lg">Privacy & Data Security</CardTitle>
          </div>
          {privacy_rating && (
            <div className={`px-4 py-2 rounded-lg border-2 font-bold text-2xl ${getGradeColor(privacy_rating.grade)}`}>
              {privacy_rating.grade}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary */}
        {summary && (
          <p className="text-sm text-label-primary">{summary}</p>
        )}

        {/* Privacy Rating Details */}
        {privacy_rating && (
          <div className="space-y-3">
            {/* Data Collected */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-label-primary">
                Data Collected
              </h4>
              <ul className="space-y-1">
                {privacy_rating.data_collected.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-label-primary">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-label-tertiary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Data Shared */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-label-primary">
                Data Shared
              </h4>
              <ul className="space-y-1">
                {privacy_rating.data_shared.length === 0 || privacy_rating.data_shared.includes('none') ? (
                  <li className="flex items-start gap-2 text-sm text-positive-700">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    No data shared with third parties
                  </li>
                ) : (
                  privacy_rating.data_shared.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-label-primary">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-label-tertiary" />
                      {item}
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Key Privacy Features */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`flex items-center gap-2 rounded-lg border p-3 ${privacy_rating.data_sold ? 'border-negative-border bg-negative-tint' : 'border-positive-border bg-positive-tint'}`}>
                {privacy_rating.data_sold ? (
                  <>
                    <XCircle className="h-4 w-4 text-negative" />
                    <span className="text-xs font-medium text-negative-700">Data Sold</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-positive-700">No Data Sales</span>
                  </>
                )}
              </div>

              <div className={`flex items-center gap-2 rounded-lg border p-3 ${privacy_rating.encryption ? 'border-positive-border bg-positive-tint' : 'border-yellow-200 bg-yellow-50'}`}>
                {privacy_rating.encryption ? (
                  <>
                    <Lock className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-positive-700">Encrypted</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-xs font-medium text-yellow-700">Not Encrypted</span>
                  </>
                )}
              </div>

              {privacy_rating.gdpr_compliant && (
                <div className="flex items-center gap-2 rounded-lg border border-accent-border bg-accent-tint p-3">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  <span className="text-xs font-medium text-accent-700">GDPR Compliant</span>
                </div>
              )}

              {privacy_rating.ccpa_compliant && (
                <div className="flex items-center gap-2 rounded-lg border border-accent-border bg-accent-tint p-3">
                  <CheckCircle className="h-4 w-4 text-accent" />
                  <span className="text-xs font-medium text-accent-700">CCPA Compliant</span>
                </div>
              )}
            </div>

            {/* Certification */}
            {privacy_rating.certification && (
              <div className="rounded-lg border border-accent-border bg-accent-tint p-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-accent-700" />
                  <span className="text-sm font-medium text-accent-700">
                    {privacy_rating.certification}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* General Items */}
        {items && items.length > 0 && (
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-label-primary">
                <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-green-600" />
                {item}
              </li>
            ))}
          </ul>
        )}

        {/* Concerns */}
        {concerns && concerns.length > 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <h4 className="mb-2 text-sm font-semibold text-yellow-900">
              Privacy Considerations
            </h4>
            <ul className="space-y-2">
              {concerns.map((concern, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-yellow-800">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* HIPAA Note */}
        {hipaa_note && (
          <div className="rounded-lg border border-negative-border bg-negative-tint p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-negative-700" />
              <div>
                <h4 className="mb-1 text-sm font-semibold text-negative-700">
                  HIPAA Compliance
                </h4>
                <p className="text-sm text-negative-700">{hipaa_note}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
