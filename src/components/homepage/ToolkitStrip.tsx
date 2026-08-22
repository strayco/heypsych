import Link from "next/link";
import { ClipboardList, Phone, BookText } from "lucide-react";

/**
 * Toolkit Strip - Optional but Preferred
 *
 * Purpose: Reinforce that HeyPsych offers actionable tools
 *
 * Spec Requirements:
 * - Items: Symptom Checker, Crisis Resources, Glossary
 * - Simple icon + label row
 * - Use existing icon + text patterns
 * - Lightweight, unobtrusive footer-style strip
 */

const toolkitItems = [
  {
    label: "Symptom Checker",
    href: "/resources/assessments-screeners",
    icon: ClipboardList,
  },
  {
    label: "Crisis Resources",
    href: "/resources/crisis-helplines",
    icon: Phone,
  },
  {
    label: "Glossary",
    href: "/resources", // Can be updated when glossary page exists
    icon: BookText,
  },
];

export function ToolkitStrip() {
  return (
    <section className="border-t border-separator bg-white px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
          {toolkitItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-center gap-3 text-label-tertiary transition-colors hover:text-accent active:scale-95"
              >
                <IconComponent className="h-6 w-6 transition-transform group-hover:scale-110 sm:h-5 sm:w-5" />
                <span className="text-base font-medium sm:text-sm lg:text-base">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
