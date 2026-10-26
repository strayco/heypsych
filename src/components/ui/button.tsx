import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "success" | "tinted";
  size?: "sm" | "md" | "lg" | "icon";
  /**
   * @deprecated All buttons are capsules in the HeyPsych system. Kept so
   * existing call sites compile; it no longer changes the shape.
   */
  capsule?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ className = "", variant = "primary", size = "md", capsule: _capsule, ...props }, ref) => {
    const baseClasses = cn(
      "inline-flex items-center justify-center gap-2 font-medium transition-all duration-150",
      "focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
      "disabled:opacity-50 disabled:pointer-events-none",
      "active:scale-[0.98] motion-reduce:active:scale-100",
      "rounded-full"
    );

    const variantClasses = {
      // Primary - graphite capsule that warms to the accent on hover. The same
      // treatment as the homepage world actions, so a primary action looks the
      // same everywhere.
      primary: cn(
        "bg-label-primary text-white",
        "hover:bg-accent",
        "active:bg-accent-pressed"
      ),
      // Secondary - Subtle filled button
      secondary: cn(
        "bg-fill-secondary text-label-primary",
        "hover:bg-fill-primary",
        "active:bg-fill-primary"
      ),
      // Outline - Bordered button
      outline: cn(
        "border border-separator-opaque bg-surface text-label-primary",
        "hover:border-label-primary",
        "active:bg-fill-tertiary"
      ),
      // Ghost - Text only button
      ghost: cn(
        "text-label-secondary bg-transparent",
        "hover:text-label-primary hover:bg-fill-quaternary",
        "active:bg-fill-tertiary"
      ),
      // Danger - Red for destructive actions
      danger: cn(
        "bg-negative text-white shadow-soft",
        "hover:bg-negative-600",
        "active:bg-negative-700"
      ),
      // Success - Green for positive actions
      success: cn(
        "bg-positive text-white shadow-soft",
        "hover:bg-positive-600",
        "active:bg-positive-700"
      ),
      // Tinted - Subtle accent background
      tinted: cn(
        "bg-accent-tint text-accent",
        "hover:bg-accent-tint-hover",
        "active:bg-accent/20"
      ),
    };

    const sizeClasses = {
      sm: "h-9 px-3.5 text-sm",
      md: "h-11 px-5 text-sm",
      lg: "h-12 px-7 text-base",
      icon: "h-10 w-10",
    };

    return (
      <button
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
