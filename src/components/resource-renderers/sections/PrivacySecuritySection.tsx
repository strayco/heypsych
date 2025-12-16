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
      case 'A': return 'text-green-700 bg-green-100 border-green-300';
      case 'B': return 'text-blue-700 bg-blue-100 border-blue-300';
      case 'C': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'D': return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'F': return 'text-red-700 bg-red-100 border-red-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-blue-600" />
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
          <p className="text-sm text-gray-700">{summary}</p>
        )}

        {/* Privacy Rating Details */}
        {privacy_rating && (
          <div className="space-y-3">
            {/* Data Collected */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-900">
                Data Collected
              </h4>
              <ul className="space-y-1">
                {privacy_rating.data_collected.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-gray-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Data Shared */}
            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-900">
                Data Shared
              </h4>
              <ul className="space-y-1">
                {privacy_rating.data_shared.length === 0 || privacy_rating.data_shared.includes('none') ? (
                  <li className="flex items-start gap-2 text-sm text-green-700">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    No data shared with third parties
                  </li>
                ) : (
                  privacy_rating.data_shared.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-gray-400" />
                      {item}
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Key Privacy Features */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`flex items-center gap-2 rounded-lg border p-3 ${privacy_rating.data_sold ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
                {privacy_rating.data_sold ? (
                  <>
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-medium text-red-700">Data Sold</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700">No Data Sales</span>
                  </>
                )}
              </div>

              <div className={`flex items-center gap-2 rounded-lg border p-3 ${privacy_rating.encryption ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
                {privacy_rating.encryption ? (
                  <>
                    <Lock className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700">Encrypted</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-xs font-medium text-yellow-700">Not Encrypted</span>
                  </>
                )}
              </div>

              {privacy_rating.gdpr_compliant && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">GDPR Compliant</span>
                </div>
              )}

              {privacy_rating.ccpa_compliant && (
                <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <CheckCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-medium text-blue-700">CCPA Compliant</span>
                </div>
              )}
            </div>

            {/* Certification */}
            {privacy_rating.certification && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-700" />
                  <span className="text-sm font-medium text-blue-900">
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
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
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
          <div className="rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-700" />
              <div>
                <h4 className="mb-1 text-sm font-semibold text-red-900">
                  HIPAA Compliance
                </h4>
                <p className="text-sm text-red-800">{hipaa_note}</p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
