import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "outlined" | "grouped" | "tinted" | "accent" | "glass" | "subtle";
  size?: "sm" | "md" | "lg" | "xl";
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", variant = "default", size = "md", interactive = false, ...props }, ref) => {
    const baseClasses = "rounded-2xl transition-all duration-200";

    const variantClasses = {
      // Default - White surface with subtle border
      default: "bg-surface border border-separator",
      // Elevated - White surface with shadow
      elevated: "bg-surface border border-separator shadow-card-1",
      // Outlined - Transparent with visible border
      outlined: "bg-transparent border border-separator hover:border-separator-opaque",
      // Grouped - Subtle grouped surface
      grouped: "bg-surface-grouped border border-transparent",
      // Tinted - Accent tinted background
      tinted: "bg-accent-tint border border-accent-border",
      // Accent - Prominent accent-tinted card
      accent: "bg-accent-tint border border-accent-border shadow-subtle",
      // Glass - Translucent material effect
      glass: "bg-surface/80 backdrop-blur-lg border border-separator/50",
      // Subtle - Very minimal styling
      subtle: "bg-fill-quaternary border border-transparent",
    };

    const sizeClasses = {
      sm: "p-4",
      md: "p-5",
      lg: "p-6",
      xl: "p-8",
    };

    const interactiveClasses = interactive
      ? cn(
          "cursor-pointer",
          "hover:shadow-card-2 hover:border-accent-border",
          "active:scale-[0.99]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
        )
      : "";

    return (
      <div
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], sizeClasses[size], interactiveClasses, className)}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? "button" : undefined}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5", className)} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = "", ...props }, ref) => (
  <h3 ref={ref} className={cn("text-lg font-semibold text-label-primary", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = "", ...props }, ref) => (
  <p ref={ref} className={cn("text-sm text-label-secondary", className)} {...props} />
));
CardDescription.displayName = "CardDescription";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={cn("pt-4", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center pt-4", className)} {...props} />
  )
);
CardFooter.displayName = "CardFooter";
