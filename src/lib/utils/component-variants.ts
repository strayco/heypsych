import { cva, type VariantProps } from "class-variance-authority";

// Card variants (easily extendable)
export const cardVariants = cva(
  // Base styles
  "rounded-2xl border transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-white border-gray-200 hover:shadow-medium",
        outlined: "bg-transparent border-gray-300 hover:border-gray-400",
        filled: "bg-gray-50 border-gray-100 hover:bg-gray-100",
        gradient: "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100",
        glow: "bg-white border-blue-200 shadow-glow hover:shadow-large",
        glass: "glass border-white/20",
      },
      size: {
        sm: "p-4",
        md: "p-6",
        lg: "p-8",
        xl: "p-10",
      },
      interactive: {
        true: "cursor-pointer hover:scale-[1.02] active:scale-[0.98]",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      interactive: false,
    },
  }
);

// Button variants
export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-primary-500 text-white hover:bg-primary-600 shadow-medium hover:shadow-large",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200",
        outline: "border border-gray-300 bg-white hover:bg-gray-50",
        ghost: "hover:bg-gray-100",
        danger: "bg-red-500 text-white hover:bg-red-600",
        success: "bg-green-500 text-white hover:bg-green-600",
      },
      size: {
        sm: "h-9 px-3 text-sm",
        md: "h-11 px-6 text-base",
        lg: "h-14 px-8 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

// Badge variants (for treatment categories)
export const badgeVariants = cva("inline-flex items-center rounded-full font-medium", {
  variants: {
    variant: {
      default: "bg-gray-100 text-gray-800",
      medication: "bg-blue-100 text-blue-800",
      supplement: "bg-green-100 text-green-800",
      interventional: "bg-purple-100 text-purple-800",
      therapy: "bg-orange-100 text-orange-800",
      primary: "bg-primary-100 text-primary-800",
      success: "bg-green-100 text-green-800",
      warning: "bg-yellow-100 text-yellow-800",
      error: "bg-red-100 text-red-800",
    },
    size: {
      sm: "px-2 py-1 text-xs",
      md: "px-3 py-1 text-sm",
      lg: "px-4 py-2 text-base",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "sm",
  },
});

export type CardVariants = VariantProps<typeof cardVariants>;
export type ButtonVariants = VariantProps<typeof buttonVariants>;
export type BadgeVariants = VariantProps<typeof badgeVariants>;
