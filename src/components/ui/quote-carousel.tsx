"use client";

/**
 * QuoteCarousel Component
 *
 * Apple-style carousel for patient experience quotes
 * Auto-rotates through quotes with smooth animations
 */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { getColorClasses, UIHints } from "@/lib/ui/apple-design-system";
import { ParsedContent } from "./parsed-content";

interface Quote {
  text: string;
  category?: string;
}

interface QuoteCarouselProps {
  quotes: Quote[];
  intro?: string;
  uiHints?: UIHints;
  autoRotate?: boolean;
  rotateInterval?: number;
}

export function QuoteCarousel({
  quotes,
  intro,
  uiHints,
  autoRotate = true,
  rotateInterval = 5000
}: QuoteCarouselProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const colors = getColorClasses(uiHints?.color || '#007AFF');

  // Auto-rotate quotes
  React.useEffect(() => {
    if (!autoRotate || quotes.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % quotes.length);
    }, rotateInterval);

    return () => clearInterval(interval);
  }, [autoRotate, quotes.length, rotateInterval]);

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + quotes.length) % quotes.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % quotes.length);
  };

  if (quotes.length === 0) return null;

  const currentQuote = quotes[currentIndex];

  return (
    <div className="space-y-4">
      {intro && (
        <p className="text-neutral-800 mb-4">
          <ParsedContent content={intro} />
        </p>
      )}

      <div className="relative rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 p-8 shadow-lg min-h-[200px] flex items-center">
        {/* Quote Icon */}
        <div className={`absolute top-6 left-6 ${colors.text} opacity-20`}>
          <MessageCircle className="h-12 w-12" strokeWidth={1.5} />
        </div>

        {/* Navigation Buttons */}
        {quotes.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all hover:scale-110"
              aria-label="Previous quote"
            >
              <ChevronLeft className="h-5 w-5 text-blue-700" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-md transition-all hover:scale-110"
              aria-label="Next quote"
            >
              <ChevronRight className="h-5 w-5 text-blue-700" />
            </button>
          </>
        )}

        {/* Quote Content */}
        <div className="flex-1 px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              {currentQuote.category && (
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-700 mb-3">
                  {currentQuote.category}
                </p>
              )}
              <blockquote className="text-lg sm:text-xl text-neutral-800 italic leading-relaxed">
                "{currentQuote.text}"
              </blockquote>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Pagination Dots */}
        {quotes.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {quotes.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`
                  h-2 rounded-full transition-all
                  ${index === currentIndex
                    ? 'w-8 bg-blue-600'
                    : 'w-2 bg-blue-300 hover:bg-blue-400'
                  }
                `}
                aria-label={`Go to quote ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
