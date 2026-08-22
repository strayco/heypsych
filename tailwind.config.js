// tailwind.config.js - HeyPsych Design System
// Apple-Inspired Light-First Foundation
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // =======================================================================
      // HeyPsych Color System - Light-First, Semantically Named
      // =======================================================================
      colors: {
        // Canvas & Surface - Light neutral foundation
        canvas: {
          DEFAULT: "#F5F5F7",
          elevated: "#FBFBFD",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          grouped: "#F2F2F7",
          control: "rgba(255, 255, 255, 0.88)",
        },

        // Label colors - Opacity-based hierarchy
        label: {
          primary: "rgba(0, 0, 0, 0.88)",
          secondary: "rgba(60, 60, 67, 0.72)",
          tertiary: "rgba(60, 60, 67, 0.52)",
          quaternary: "rgba(60, 60, 67, 0.36)",
        },

        // Separator colors
        separator: {
          DEFAULT: "rgba(60, 60, 67, 0.18)",
          opaque: "#C6C6C8",
        },

        // Fill colors for controls
        fill: {
          primary: "rgba(120, 120, 128, 0.2)",
          secondary: "rgba(120, 120, 128, 0.16)",
          tertiary: "rgba(120, 120, 128, 0.12)",
          quaternary: "rgba(120, 120, 128, 0.08)",
        },

        // Primary accent - Apple-inspired blue
        accent: {
          DEFAULT: "#007AFF",
          hover: "#0062CC",
          pressed: "#004999",
          tint: "rgba(0, 122, 255, 0.12)",
          "tint-hover": "rgba(0, 122, 255, 0.18)",
          border: "rgba(0, 122, 255, 0.3)",
          foreground: "#FFFFFF",
        },

        // Semantic: Positive / Success / Available
        positive: {
          DEFAULT: "#34C759",
          50: "#F0FDF4",
          100: "#DCFCE7",
          200: "#BBF7D0",
          300: "#86EFAC",
          400: "#4ADE80",
          500: "#34C759",
          600: "#16A34A",
          700: "#15803D",
          800: "#166534",
          900: "#14532D",
          tint: "rgba(52, 199, 89, 0.12)",
          border: "rgba(52, 199, 89, 0.3)",
        },

        // Semantic: Caution / Warning
        caution: {
          DEFAULT: "#FF9500",
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#FF9500",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
          tint: "rgba(255, 149, 0, 0.12)",
          border: "rgba(255, 149, 0, 0.3)",
        },

        // Semantic: Critical / Error / Danger
        negative: {
          DEFAULT: "#FF3B30",
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#FF3B30",
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
          tint: "rgba(255, 59, 48, 0.12)",
          border: "rgba(255, 59, 48, 0.3)",
        },

        // Semantic: Treatment / Clinical (indigo)
        treatment: {
          DEFAULT: "#5856D6",
          50: "#EEF2FF",
          100: "#E0E7FF",
          200: "#C7D2FE",
          300: "#A5B4FC",
          400: "#818CF8",
          500: "#5856D6",
          600: "#4F46E5",
          700: "#4338CA",
          800: "#3730A3",
          900: "#312E81",
          tint: "rgba(88, 86, 214, 0.12)",
          border: "rgba(88, 86, 214, 0.3)",
        },

        // Semantic: Tools / Technology (teal)
        tools: {
          DEFAULT: "#30B0C7",
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#30B0C7",
          600: "#0891B2",
          700: "#0E7490",
          800: "#155E75",
          900: "#164E63",
          tint: "rgba(48, 176, 199, 0.12)",
          border: "rgba(48, 176, 199, 0.3)",
        },

        // =======================================================================
        // Legacy Graphite Compatibility (maps to light values)
        // Will be deprecated - use semantic names instead
        // =======================================================================
        graphite: {
          950: "#F5F5F7", // Maps to canvas
          900: "#F5F5F7", // Maps to canvas
          850: "#FBFBFD", // Maps to canvas-elevated
          800: "#FFFFFF", // Maps to surface
          750: "#F2F2F7", // Maps to surface-grouped
          700: "#E5E5EA", // Light separator
          600: "#C6C6C8", // Separator opaque
          500: "rgba(60, 60, 67, 0.36)",
          400: "rgba(60, 60, 67, 0.52)",
          300: "rgba(60, 60, 67, 0.72)",
          200: "rgba(0, 0, 0, 0.72)",
          100: "rgba(0, 0, 0, 0.84)",
          50: "rgba(0, 0, 0, 0.88)",
        },
      },

      // =======================================================================
      // Typography - System font stack
      // =======================================================================
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        display: [
          "ui-sans-serif",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          '"SF Mono"',
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },

      // Font sizes with appropriate line heights
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem", letterSpacing: "0.01em" }],
        xs: ["0.75rem", { lineHeight: "1.125rem", letterSpacing: "0.01em" }],
        sm: ["0.875rem", { lineHeight: "1.375rem", letterSpacing: "0.005em" }],
        base: ["1rem", { lineHeight: "1.625rem", letterSpacing: "0" }],
        lg: ["1.125rem", { lineHeight: "1.75rem", letterSpacing: "-0.005em" }],
        xl: ["1.25rem", { lineHeight: "1.875rem", letterSpacing: "-0.01em" }],
        "2xl": ["1.5rem", { lineHeight: "2rem", letterSpacing: "-0.015em" }],
        "3xl": ["1.875rem", { lineHeight: "2.375rem", letterSpacing: "-0.02em" }],
        "4xl": ["2.25rem", { lineHeight: "2.75rem", letterSpacing: "-0.025em" }],
        "5xl": ["3rem", { lineHeight: "3.5rem", letterSpacing: "-0.025em" }],
        "6xl": ["3.75rem", { lineHeight: "1.1", letterSpacing: "-0.03em" }],
      },

      // =======================================================================
      // Spacing
      // =======================================================================
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        88: "22rem",
      },

      // =======================================================================
      // Animation - Subtle, purposeful
      // =======================================================================
      animation: {
        "fade-in": "fadeIn 0.2s ease-out",
        "fade-in-up": "fadeInUp 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        "slide-down": "slideDown 0.3s ease-out",
        "scale-in": "scaleIn 0.15s ease-out",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },

      // =======================================================================
      // Shadows - Soft, structural
      // =======================================================================
      boxShadow: {
        subtle: "0 1px 2px rgba(0, 0, 0, 0.04)",
        soft: "0 2px 8px rgba(0, 0, 0, 0.06)",
        control: "0 2px 8px rgba(0, 0, 0, 0.06)",
        medium: "0 4px 16px rgba(0, 0, 0, 0.08)",
        elevated: "0 10px 30px rgba(0, 0, 0, 0.08)",
        floating: "0 18px 50px rgba(0, 0, 0, 0.10)",
        // Card elevation system
        "card-1": "0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)",
        "card-2": "0 3px 10px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)",
        "card-3": "0 6px 20px rgba(0, 0, 0, 0.10), 0 2px 6px rgba(0, 0, 0, 0.06)",
      },

      // =======================================================================
      // Border Radius - Soft, coherent family
      // =======================================================================
      borderRadius: {
        xs: "0.25rem",   // 4px
        sm: "0.375rem",  // 6px
        md: "0.5rem",    // 8px
        DEFAULT: "0.75rem", // 12px - control default
        lg: "0.75rem",   // 12px
        xl: "1rem",      // 16px - card default
        "2xl": "1.25rem", // 20px
        "3xl": "1.5rem", // 24px - panel default
        "4xl": "2rem",   // 32px
      },

      // =======================================================================
      // Backdrop Blur
      // =======================================================================
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },

      // =======================================================================
      // Grid System
      // =======================================================================
      gridTemplateColumns: {
        "auto-fit-xs": "repeat(auto-fit, minmax(16rem, 1fr))",
        "auto-fit-sm": "repeat(auto-fit, minmax(20rem, 1fr))",
        "auto-fit-md": "repeat(auto-fit, minmax(24rem, 1fr))",
        "auto-fit-lg": "repeat(auto-fit, minmax(32rem, 1fr))",
      },

      // =======================================================================
      // Max Widths
      // =======================================================================
      maxWidth: {
        "prose-narrow": "55ch",
        "prose-normal": "65ch",
        "prose-wide": "75ch",
        shell: "1280px",
        content: "1120px",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("tailwindcss-animate"),

    // Custom utilities
    function ({ addUtilities }) {
      addUtilities({
        // Material (glass) effect - for navigation layer only
        ".hp-material": {
          background: "rgba(255, 255, 255, 0.82)",
          "backdrop-filter": "saturate(180%) blur(20px)",
          "-webkit-backdrop-filter": "saturate(180%) blur(20px)",
        },
        ".hp-material-solid": {
          background: "rgba(255, 255, 255, 0.95)",
        },
        // Focus ring
        ".focus-ring": {
          outline: "none",
          "box-shadow": "0 0 0 3px rgba(0, 122, 255, 0.4)",
        },
        // Scrollbar styling
        ".scrollbar-thin": {
          "scrollbar-width": "thin",
          "scrollbar-color": "#C6C6C8 transparent",
        },
        // Tabular numerals
        ".tabular-nums": {
          "font-variant-numeric": "tabular-nums",
        },
      });
    },
  ],
};
