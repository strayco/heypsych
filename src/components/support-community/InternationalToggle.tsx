import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Globe2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { CrisisCard } from "./CrisisCard";

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
  hotlines: Hotline[];
}

export function InternationalToggle({ hotlines }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);

    // Analytics
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "international_toggle", {
        event_category: "crisis",
        event_label: isExpanded ? "collapse" : "expand",
      });
    }
  };

  if (hotlines.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card
        className="cursor-pointer transition-all hover:shadow-md"
        onClick={toggleExpanded}
      >
        <CardContent className="p-6">
          <button
            className="flex w-full items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
            aria-expanded={isExpanded}
            aria-controls="international-content"
          >
            <div className="flex items-center gap-3">
              <Globe2 className="h-6 w-6 text-blue-600" aria-hidden="true" />
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Outside the U.S.? International Crisis Support
                </h3>
                <p className="text-sm text-slate-600">
                  Find crisis hotlines and resources in other countries
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </motion.div>
          </button>
        </CardContent>
      </Card>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id="international-content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="space-y-4">
              {hotlines.map((hotline) => (
                <CrisisCard key={hotline.id} hotline={hotline} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
