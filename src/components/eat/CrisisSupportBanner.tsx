"use client";

/**
 * Crisis Support Banner Component
 *
 * Displays crisis helpline information prominently on sensitive content.
 * Required for E-A-T compliance and user safety on mental health content.
 */

import React from "react";
import { Phone, MessageCircle, Globe, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface CrisisResource {
  name: string;
  phone?: string;
  text?: string;
  url?: string;
  hours?: string;
}

interface CrisisSupportBannerProps {
  /** Show prominent banner style */
  prominent?: boolean;

  /** Additional crisis resources (optional) */
  customResources?: CrisisResource[];

  /** Trigger-specific message */
  customMessage?: string;
}

const DEFAULT_RESOURCES: CrisisResource[] = [
  {
    name: "988 Suicide & Crisis Lifeline",
    phone: "988",
    text: "988",
    hours: "24/7",
  },
  {
    name: "Crisis Text Line",
    text: "HOME to 741741",
    hours: "24/7",
  },
  {
    name: "SAMHSA National Helpline",
    phone: "1-800-662-4357",
    hours: "24/7",
  },
];

export function CrisisSupportBanner({
  prominent = true,
  customResources,
  customMessage,
}: CrisisSupportBannerProps) {
  const resources = customResources || DEFAULT_RESOURCES;

  const defaultMessage = "If you or someone you know is in crisis or having thoughts of suicide, help is available right now.";
  const message = customMessage || defaultMessage;

  if (prominent) {
    return (
      <Card className="border-red-300 bg-gradient-to-r from-red-50 via-rose-50 to-red-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-bold text-red-900">Need Immediate Help?</h3>
                <p className="mt-1 text-sm text-red-800">{message}</p>
              </div>

              <div className="space-y-3">
                {resources.map((resource, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-white p-3"
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-neutral-900">{resource.name}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-700">
                        {resource.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5" />
                            <span className="font-mono">{resource.phone}</span>
                          </div>
                        )}
                        {resource.text && (
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span className="font-mono">{resource.text}</span>
                          </div>
                        )}
                        {resource.hours && (
                          <span className="text-neutral-600">• {resource.hours}</span>
                        )}
                      </div>
                    </div>
                    {resource.url && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-300 hover:bg-red-50"
                        onClick={() => window.open(resource.url, '_blank')}
                      >
                        <Globe className="mr-1 h-3.5 w-3.5" />
                        Visit Website
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-xs text-red-700">
                <strong>International?</strong> Find crisis resources in your country at{' '}
                <a
                  href="https://findahelpline.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-red-900"
                >
                  findahelpline.com
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-semibold text-red-900">Crisis Support Available 24/7</p>
          <p className="text-sm text-red-800">{message}</p>
          <div className="flex flex-wrap gap-3 text-sm">
            {resources.slice(0, 2).map((resource, index) => (
              <div key={index} className="flex items-center gap-1.5 text-red-900">
                {resource.phone && (
                  <>
                    <Phone className="h-3.5 w-3.5" />
                    <span className="font-semibold">{resource.name}:</span>
                    <span className="font-mono">{resource.phone}</span>
                  </>
                )}
                {!resource.phone && resource.text && (
                  <>
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span className="font-semibold">{resource.name}:</span>
                    <span className="font-mono">{resource.text}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
