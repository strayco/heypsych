import React, { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

interface Props {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  placeholder?: string;
}

export function CrisisSearchInput({
  value,
  onChange,
  resultCount,
  placeholder = "Search crisis resources (e.g., 'veterans', 'LGBTQ', 'postpartum')...",
}: Props) {
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // Update ARIA live region when results change
  useEffect(() => {
    if (liveRegionRef.current && value.trim()) {
      const message =
        resultCount === 0
          ? "No results found"
          : resultCount === 1
          ? "1 result found"
          : `${resultCount} results found`;

      // Small delay to ensure screen readers announce the message
      setTimeout(() => {
        if (liveRegionRef.current) {
          liveRegionRef.current.textContent = message;
        }
      }, 100);
    }
  }, [resultCount, value]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="relative">
          <label htmlFor="crisis-search-input" className="sr-only">
            Search specialized crisis hotlines
          </label>
          <Search
            className="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <Input
            id="crisis-search-input"
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-10"
            aria-describedby="crisis-search-live-region"
            aria-autocomplete="list"
          />
        </div>
        {/* ARIA live region for screen reader announcements */}
        <div
          ref={liveRegionRef}
          id="crisis-search-live-region"
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
      </CardContent>
    </Card>
  );
}
