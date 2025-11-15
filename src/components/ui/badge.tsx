import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "medication"
    | "supplement"
    | "interventional"
    | "therapy"
    | "alternative"
    | "investigational"
    | "intervention"
    | "primary"
    | "success"
    | "warning"
    | "error"
    | "outline";
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
    default: "bg-neutral-100 text-neutral-900 hover:bg-neutral-200",
    medication: "bg-blue-100 text-blue-900 hover:bg-blue-200",
    supplement: "bg-green-100 text-green-900 hover:bg-green-200",
    interventional: "bg-purple-100 text-purple-900 hover:bg-purple-200",
    intervention: "bg-purple-100 text-purple-900 hover:bg-purple-200",
    therapy: "bg-orange-100 text-orange-900 hover:bg-orange-200",
    alternative: "bg-amber-100 text-amber-900 hover:bg-amber-200",
    investigational: "bg-teal-100 text-teal-900 hover:bg-teal-200",
    primary: "bg-blue-100 text-blue-900 hover:bg-blue-200",
    success: "bg-green-100 text-green-900 hover:bg-green-200",
    warning: "bg-yellow-100 text-yellow-900 hover:bg-yellow-200",
    error: "bg-red-100 text-red-900 hover:bg-red-200",
    outline: "border border-neutral-300 text-neutral-900 hover:bg-neutral-50",
  };

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-2 text-base",
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    />
  );
};
