import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackToResourcesButtonProps {
  className?: string;
  href?: string;
  label?: string;
}

export function BackToResourcesButton({
  className = "",
  href = "/resources",
  label = "Back"
}: BackToResourcesButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5
                 text-sm font-medium text-label-primary
                 bg-surface hover:bg-surface
                 border border-separator
                 shadow-sm
                 transition-all duration-200
                 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2
                 group ${className}`}
    >
      <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}
