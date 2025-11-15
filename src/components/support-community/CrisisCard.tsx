import React from "react";
import { ExternalLink, Phone, MessageSquare, Globe, Shield } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Hotline {
  id: string;
  name: string;
  summary: string;
  categories?: string[];
  labels: {
    free?: boolean;
    availability?: string;
    focus?: string[];
    verified?: boolean;
  };
  org: {
    name: string;
    url?: string | null;
  };
  contacts: Array<{
    region: string;
    channels: {
      call?: Array<{ label: string; value: string | null }>;
      text?: Array<{ label: string; value: string | null }>;
      chat?: Array<{ label: string; value: string | null }>;
      tty?: Array<{ label: string; value: string | null }>;
    };
  }>;
  actions: {
    site_url?: string | null;
    chat_url?: string | null;
    text?: string | null;
    tty?: string | null;
    whatsapp?: string | null;
  };
}

interface Props {
  hotline: Hotline;
}

export function CrisisCard({ hotline }: Props) {
  const handleClick = (action: string) => {
    // Analytics
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "crisis_hotline_action", {
        event_category: "crisis",
        event_label: hotline.name,
        hotline_id: hotline.id,
        action_type: action,
      });
    }
  };

  // Extract contact information
  const usContact = hotline.contacts.find((c) => c.region === "US" || c.region === "INTL");
  const callNumbers = usContact?.channels.call?.filter((c) => c.value) || [];
  const textNumbers = usContact?.channels.text?.filter((c) => c.value) || [];
  const hasChat = hotline.actions.chat_url || usContact?.channels.chat?.some((c) => c.value);

  return (
    <Card className="group transition-all hover:shadow-lg">
      <CardContent className="p-6">
        {/* Header */}
        <div className="mb-4">
          <h3 className="mb-2 text-xl font-bold text-slate-900 group-hover:text-blue-600">
            {hotline.name}
          </h3>
          {hotline.org.name && hotline.org.name !== hotline.name && (
            <p className="mb-2 text-sm text-slate-600">{hotline.org.name}</p>
          )}
          <p className="text-sm leading-relaxed text-slate-700">{hotline.summary}</p>
        </div>

        {/* Details Bar */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          {hotline.labels.free && (
            <Badge variant="success" size="sm">
              Free
            </Badge>
          )}
          {hotline.labels.availability && (
            <Badge variant="outline" size="sm">
              {hotline.labels.availability}
            </Badge>
          )}
          {hotline.labels.focus?.map((focus) => (
            <Badge key={focus} variant="outline" size="sm">
              {focus}
            </Badge>
          ))}
          {hotline.labels.verified && (
            <Badge variant="default" size="sm" className="bg-blue-100 text-blue-700">
              <Shield className="mr-1 h-3 w-3" />
              Verified
            </Badge>
          )}
        </div>

        {/* Actions Row */}
        <div className="flex flex-wrap gap-2">
          {/* Visit Site */}
          {hotline.actions.site_url && (
            <a
              href={hotline.actions.site_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleClick("visit_site")}
              className="flex-1 min-w-[140px]"
            >
              <Button variant="outline" size="sm" className="w-full">
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit Site
              </Button>
            </a>
          )}

          {/* Call Button(s) */}
          {callNumbers.map((call, index) => {
            const phoneNumber = call.value;
            const telLink = phoneNumber ? `tel:${phoneNumber.replace(/\s+/g, "")}` : "#";

            return (
              <a
                key={`call-${index}`}
                href={telLink}
                onClick={() => handleClick("call")}
                aria-label={`Call ${hotline.name} hotline at ${phoneNumber}`}
              >
                <Button size="sm" className="bg-red-600 hover:bg-red-700">
                  <Phone className="mr-2 h-4 w-4" />
                  {call.label}
                  {phoneNumber && phoneNumber !== "1" && `: ${phoneNumber}`}
                </Button>
              </a>
            );
          })}

          {/* Text Button(s) */}
          {textNumbers.map((text, index) => {
            const textNumber = text.value;
            const smsLink = textNumber ? `sms:${textNumber.replace(/\s+/g, "")}` : "#";

            return (
              <a
                key={`text-${index}`}
                href={smsLink}
                onClick={() => handleClick("text")}
                aria-label={`Text ${hotline.name} at ${textNumber}`}
              >
                <Button size="sm" variant="outline" className="border-red-300 hover:bg-red-50">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {text.label}
                  {textNumber && !text.label.includes("to") && `: ${textNumber}`}
                </Button>
              </a>
            );
          })}

          {/* Chat Button */}
          {hasChat && hotline.actions.chat_url && (
            <a
              href={hotline.actions.chat_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleClick("chat")}
              aria-label={`Chat with ${hotline.name} online`}
            >
              <Button size="sm" variant="outline" className="border-red-300 hover:bg-red-50">
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
