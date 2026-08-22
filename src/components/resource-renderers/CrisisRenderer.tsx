// src/components/resource-renderers/CrisisRenderer.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Phone, MessageCircle, Clock, MapPin } from "lucide-react";
import { SEOMeta, SectionList, AutoFields } from "./shared";
import type { ResourceRendererProps } from "./index";

export function CrisisRenderer({ resource }: ResourceRendererProps) {
  const data = resource as any;

  return (
    <>
      <SEOMeta seo={data.seo} />

      <Card className="border-negative-border bg-negative-tint">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-negative" />
            <CardTitle className="text-negative-700">Crisis Support</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-medium text-negative-700">
            If you are in immediate danger, call 911 or go to your nearest emergency room.
          </p>

          {data.phone && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-negative">
                <Phone className="h-4 w-4" />
                <span className="font-medium">Crisis Hotline</span>
              </div>
              <Button className="bg-negative-600 text-white hover:bg-negative-500" size="lg">
                <a href={`tel:${data.phone}`}>{data.phone}</a>
              </Button>
            </div>
          )}

          {data.text_number && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-negative">
                <MessageCircle className="h-4 w-4" />
                <span className="font-medium">Text Support</span>
              </div>
              <Button variant="secondary" className="border-negative-border text-negative-700 hover:bg-negative-tint">
                <a href={`sms:${data.text_number}`}>Text {data.text_number}</a>
              </Button>
            </div>
          )}

          {data.hours && (
            <div className="flex items-center gap-2 text-negative">
              <Clock className="h-4 w-4" />
              <span>{data.hours}</span>
            </div>
          )}

          {data.coverage_area && (
            <div className="flex items-center gap-2 text-negative">
              <MapPin className="h-4 w-4" />
              <span>{data.coverage_area}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <AutoFields
        data={data}
        title="Service Details"
        only={["languages", "specialties", "training_required"]}
      />

      <SectionList sections={data.sections} />
    </>
  );
}
