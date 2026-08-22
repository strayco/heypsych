"use client";

/**
 * Medical Disclaimer Component
 *
 * Displays medical disclaimer for E-A-T compliance and legal protection.
 * Required on all clinical content pages.
 */

import React from "react";
import { AlertTriangle, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface DisclaimerConfig {
  /** Custom disclaimer text (optional, uses default if not provided) */
  custom_text?: string;

  /** Entity type for context-specific disclaimers */
  entity_type?: 'condition' | 'medication' | 'therapy' | 'treatment' | 'assessment' | 'resource';

  /** Show prominent warning style */
  prominent?: boolean;

  /** Include crisis helpline */
  include_crisis_line?: boolean;
}

interface MedicalDisclaimerProps {
  /** Disclaimer configuration */
  config?: DisclaimerConfig;

  /** Compact mode (less padding) */
  compact?: boolean;
}

const DEFAULT_DISCLAIMER = `This information is for educational purposes only and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of something you have read on this website.`;

const ENTITY_DISCLAIMERS: Record<string, string> = {
  condition: `This information about mental health conditions is for educational purposes only. If you believe you may be experiencing symptoms of a mental health condition, please consult with a qualified healthcare professional for proper evaluation and diagnosis.`,
  medication: `This medication information is for educational purposes only and is not a substitute for professional medical advice. Always consult your healthcare provider before starting, stopping, or changing any medication. Never take medication without a prescription from a licensed healthcare provider.`,
  therapy: `This information about therapy approaches is for educational purposes only. Therapy should be conducted by licensed mental health professionals. The effectiveness of therapy varies by individual and condition. Consult with a qualified therapist to determine the best approach for your needs.`,
  treatment: `This treatment information is for educational purposes only. Treatment decisions should be made in consultation with qualified healthcare professionals based on individual circumstances, symptoms, and medical history. Do not attempt treatment without professional guidance.`,
  assessment: `This assessment tool is for educational and informational purposes only. It is not a diagnostic tool and cannot replace a professional clinical evaluation. If you are concerned about your mental health, please consult with a qualified healthcare provider for a comprehensive assessment.`,
  resource: `The resources and information provided are for educational purposes only. They are not a substitute for professional medical or mental health advice, diagnosis, or treatment. Always seek the guidance of qualified health professionals with questions about your health.`,
};

const CRISIS_LINE_TEXT = `If you or someone you know is in crisis or experiencing thoughts of suicide, please contact the 988 Suicide & Crisis Lifeline by calling or texting 988, available 24/7.`;

export function MedicalDisclaimer({
  config,
  compact = false,
}: MedicalDisclaimerProps) {
  const disclaimerText = config?.custom_text
    || (config?.entity_type && ENTITY_DISCLAIMERS[config.entity_type])
    || DEFAULT_DISCLAIMER;

  if (config?.prominent) {
    return (
      <Card className="border-caution-500/30 bg-linear-to-r from-caution-900/20 to-surface-grouped">
        <CardContent className={compact ? "p-4" : "p-6"}>
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-caution-tint">
              <AlertTriangle className="h-5 w-5 text-caution" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-caution-700">Important Medical Disclaimer</h3>
              <p className="text-sm leading-relaxed text-label-secondary">{disclaimerText}</p>
              {config?.include_crisis_line && (
                <div className="mt-3 rounded-lg border border-negative-500/30 bg-negative-tint p-3">
                  <p className="text-sm font-medium text-negative-700">{CRISIS_LINE_TEXT}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`rounded-lg border border-separator bg-surface-grouped ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-label-tertiary" />
        <div className="flex-1 space-y-2">
          <p className="text-xs leading-relaxed text-label-secondary">{disclaimerText}</p>
          {config?.include_crisis_line && (
            <div className="mt-2 rounded border border-negative-500/30 bg-negative-tint p-2">
              <p className="text-xs font-medium text-negative-700">{CRISIS_LINE_TEXT}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
