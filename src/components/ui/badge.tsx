import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "primary"
    | "success"
    | "warning"
    | "error"
    | "outline"
    | "treatment"
    | "tools"
    | "medication"
    | "supplement"
    | "therapy"
    | "investigational"
    | "interventional"
    | "alternative";
  size?: "sm" | "md" | "lg";
}

export const Badge: React.FC<BadgeProps> = ({
  className = "",
  variant = "default",
  size = "sm",
  ...props
}) => {
  const baseClasses = "inline-flex items-center rounded-full font-medium transition-colors";

  const variantClasses = {
    // Default - Subtle gray
    default: "bg-fill-secondary text-label-primary",
    // Primary - Blue accent
    primary: "bg-accent-tint text-accent border border-accent-border",
    // Success - Green
    success: "bg-positive-tint text-positive-700 border border-positive-border",
    // Warning - Orange
    warning: "bg-caution-tint text-caution-700 border border-caution-border",
    // Error - Red
    error: "bg-negative-tint text-negative-700 border border-negative-border",
    // Outline - Bordered
    outline: "border border-separator text-label-secondary hover:bg-fill-quaternary",
    // Treatment - Indigo (clinical)
    treatment: "bg-treatment-tint text-treatment-700 border border-treatment-border",
    // Tools - Teal (technology)
    tools: "bg-tools-tint text-tools-700 border border-tools-border",
    // Medication specific
    medication: "bg-accent-tint text-accent-700 border border-accent-border",
    // Supplement specific
    supplement: "bg-positive-50 text-positive-700 border border-positive-200",
    // Therapy specific
    therapy: "bg-orange-50 text-orange-700 border border-orange-200",
    // Investigational
    investigational: "bg-tools-50 text-tools-700 border border-tools-200",
    // Interventional procedures
    interventional: "bg-treatment-tint text-treatment-700 border border-treatment-border",
    // Alternative treatments
    alternative: "bg-positive-tint text-positive-700 border border-positive-border",
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-sm",
  };

  return (
    <div
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    />
  );
};
