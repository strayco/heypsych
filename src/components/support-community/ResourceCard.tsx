import React from "react";
import { ExternalLink, Phone, MessageSquare, Globe } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Resource } from "@/lib/types/support-community";

interface Props {
  resource: Resource;
  variant?: "default" | "crisis";
}

export function ResourceCard({ resource, variant = "default" }: Props) {
  const hasPhone = resource.phones && resource.phones.length > 0;
  const hasText = resource.access.includes("text");
  const hasChat = resource.access.includes("chat");
  const is247 = resource.tags.includes("24/7");

  const handleClick = () => {
    // Analytics
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "resource_click", {
        event_category: "support_community",
        event_label: resource.name,
        resource_id: resource.id,
        resource_category: resource.category,
      });
    }
  };

  if (variant === "crisis") {
    // Large crisis card format
    return (
      <Card className="border-red-200 bg-gradient-to-br from-white to-red-50">
        <CardContent className="p-6">
          <div className="mb-4">
            <h3 className="mb-2 text-xl font-bold text-slate-900">{resource.name}</h3>
            {resource.organization && (
              <p className="mb-2 text-sm text-slate-600">{resource.organization}</p>
            )}
            <p className="text-sm text-slate-700">{resource.description}</p>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {is247 && (
              <Badge variant="error" size="sm">
                24/7
              </Badge>
            )}
            {resource.tags.filter((tag) => tag !== "24/7").map((tag) => (
              <Badge key={tag} variant="outline" size="sm">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            {hasPhone && resource.access.includes("hotline") && (
              <a
                href={`tel:${resource.phones![0].number}`}
                onClick={handleClick}
                className="flex-1"
              >
                <Button className="w-full bg-red-600 hover:bg-red-700">
                  <Phone className="mr-2 h-4 w-4" />
                  {resource.phones![0].label}: {resource.phones![0].number}
                </Button>
              </a>
            )}
            {hasText && hasPhone && (
              <a
                href={`sms:${resource.phones![0].number}`}
                onClick={handleClick}
                className="flex-1"
              >
                <Button variant="outline" className="w-full border-red-300 hover:bg-red-50">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Text: {resource.phones![0].number}
                </Button>
              </a>
            )}
            {hasChat && (
              <a href={resource.url} target="_blank" rel="noopener noreferrer" onClick={handleClick}>
                <Button variant="outline" className="border-red-300 hover:bg-red-50">
                  <Globe className="mr-2 h-4 w-4" />
                  Chat Online
                </Button>
              </a>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default card format
  return (
    <Card className="group transition-all hover:shadow-lg">
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <div className="flex-1">
            <h3 className="mb-1 text-lg font-bold text-slate-900 group-hover:text-blue-600">
              {resource.name}
            </h3>
            {resource.organization && (
              <p className="mb-2 text-sm text-slate-500">{resource.organization}</p>
            )}
          </div>
        </div>

        <p className="mb-3 text-sm text-slate-700">{resource.description}</p>

        <div className="mb-3 flex flex-wrap gap-2">
          {resource.cost.includes("free") && (
            <Badge variant="success" size="sm">
              Free
            </Badge>
          )}
          {resource.tags.map((tag) => (
            <Badge key={tag} variant="outline" size="sm">
              {tag}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full">
              <ExternalLink className="mr-2 h-4 w-4" />
              Visit Site
            </Button>
          </a>
          {hasPhone && resource.access.includes("hotline") && (
            <a href={`tel:${resource.phones![0].number}`} onClick={handleClick}>
              <Button size="sm">
                <Phone className="mr-2 h-4 w-4" />
                Call
              </Button>
            </a>
          )}
          {hasText && hasPhone && (
            <a href={`sms:${resource.phones![0].number}`} onClick={handleClick}>
              <Button size="sm" variant="outline">
                <MessageSquare className="mr-2 h-4 w-4" />
                Text
              </Button>
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
