import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outlined" | "filled" | "gradient" | "glow" | "glass";
  size?: "sm" | "md" | "lg" | "xl";
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", variant = "default", size = "md", interactive = false, ...props }, ref) => {
    const baseClasses = "rounded-2xl border transition-all duration-200";

    const variantClasses = {
      default: "bg-white border-neutral-200 hover:shadow-lg",
      outlined: "bg-transparent border-neutral-300 hover:border-neutral-400",
      filled: "bg-white border-neutral-200 hover:bg-neutral-50",
      gradient: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100",
      glow: "bg-white border-blue-200 shadow-lg hover:shadow-xl",
      glass: "bg-white/95 backdrop-blur-sm border-neutral-200",
    };

    const sizeClasses = {
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
      xl: "p-10",
    };

    const interactiveClasses = interactive
      ? "cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
      : "";

    return (
      <div
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${interactiveClasses} ${className}`}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={`flex flex-col space-y-1.5 ${className}`} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = "", ...props }, ref) => (
  <h3 ref={ref} className={`text-xl font-semibold text-neutral-900 ${className}`} {...props} />
));
CardTitle.displayName = "CardTitle";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => (
    <div ref={ref} className={`pt-4 ${className}`} {...props} />
  )
);
CardContent.displayName = "CardContent";
