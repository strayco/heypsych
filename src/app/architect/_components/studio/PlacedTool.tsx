/**
 * PlacedTool Component
 *
 * Visual representation of a tool that has been placed on the canvas.
 * This is a tangible object, not a list item - designed to feel like
 * furniture placed in a room or a part added to a car.
 *
 * Part of the Practice Studio configurator experience.
 */

"use client";

import { motion } from "framer-motion";
import {
  X,
  Check,
  Zap,
  type LucideIcon,
  FileText,
  Video,
  CreditCard,
  Receipt,
  Calendar,
  Users,
  LineChart,
  Shield,
  Sparkles,
  Pill,
} from "lucide-react";
import type { PlacedProduct } from "@/domains/architect/hooks";

// Map categories to icons
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "ehr-practice-management": FileText,
  "telehealth": Video,
  "telehealth-communication": Video,
  "ai-scribe": Sparkles,
  "ai-scribe-documentation": Sparkles,
  "billing-rcm": Receipt,
  "billing-rcm-insurance": Receipt,
  "intake-scheduling-forms": Calendar,
  "care-coordination-referrals": Users,
  "measurement-based-care": LineChart,
  "measurement-outcomes-dtx": LineChart,
  "compliance-consent-security": Shield,
  "prescribing-erx": Pill,
  "credentialing-workforce": CreditCard,
};

interface PlacedToolProps {
  /** The placed product data */
  product: PlacedProduct;
  /** Whether this tool is currently selected */
  isSelected?: boolean;
  /** Callback when tool is clicked */
  onSelect?: () => void;
  /** Callback when tool is removed */
  onRemove?: () => void;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether to show coverage badge */
  showCoverage?: boolean;
  /** Optional price display */
  priceDisplay?: string;
  /** Layout mode */
  layout?: "horizontal" | "vertical";
}

export function PlacedTool({
  product,
  isSelected = false,
  onSelect,
  onRemove,
  size = "md",
  showCoverage = true,
  priceDisplay,
  layout = "vertical",
}: PlacedToolProps) {
  const Icon = CATEGORY_ICONS[product.category] || FileText;

  const sizeClasses = {
    sm: {
      container: "p-2",
      icon: "h-8 w-8",
      iconInner: "h-4 w-4",
      text: "text-xs",
      badge: "text-[10px] px-1.5 py-0.5",
    },
    md: {
      container: "p-3",
      icon: "h-12 w-12",
      iconInner: "h-5 w-5",
      text: "text-sm",
      badge: "text-xs px-2 py-0.5",
    },
    lg: {
      container: "p-4",
      icon: "h-14 w-14",
      iconInner: "h-6 w-6",
      text: "text-base",
      badge: "text-xs px-2 py-1",
    },
  };

  const classes = sizeClasses[size];

  if (layout === "horizontal") {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onSelect}
        className={`
          group relative flex items-center gap-3 rounded-xl border-2 bg-white cursor-pointer
          transition-all duration-200
          ${classes.container}
          ${isSelected
            ? "border-accent bg-accent/5 shadow-md ring-2 ring-accent/20"
            : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
          }
        `}
      >
        {/* Icon */}
        <div
          className={`
            flex shrink-0 items-center justify-center rounded-xl
            ${classes.icon}
            ${isSelected ? "bg-accent text-white" : "bg-slate-100 text-slate-600"}
          `}
        >
          <Icon className={classes.iconInner} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-label-primary truncate ${classes.text}`}>
            {product.name}
          </h4>
          {showCoverage && (
            <div className="flex items-center gap-2 mt-0.5">
              <span className="flex items-center gap-1 text-emerald-600">
                <Check className="h-3 w-3" />
                <span className="text-xs">{product.totalCoverage} needs</span>
              </span>
              {product.coverageByArea.size > 1 && (
                <span className="text-xs text-label-tertiary">
                  {product.coverageByArea.size} areas
                </span>
              )}
            </div>
          )}
          {priceDisplay && (
            <span className="text-xs text-label-secondary">{priceDisplay}</span>
          )}
        </div>

        {/* Remove button */}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="
              shrink-0 rounded-lg p-1.5 text-label-quaternary
              opacity-0 group-hover:opacity-100 hover:bg-negative/10 hover:text-negative
              transition-all
            "
            aria-label={`Remove ${product.name}`}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </motion.div>
    );
  }

  // Vertical layout (default) - more visual, like a placed object
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20, transition: { duration: 0.2 } }}
      whileHover={{ scale: 1.03, y: -2 }}
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={`
        group relative flex flex-col items-center rounded-2xl border-2 bg-white cursor-pointer
        transition-all duration-200
        ${classes.container}
        ${isSelected
          ? "border-accent bg-accent/5 shadow-lg ring-2 ring-accent/20"
          : "border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
        }
      `}
    >
      {/* Remove button - top right corner */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="
            absolute -top-2 -right-2 z-10
            flex h-6 w-6 items-center justify-center rounded-full
            bg-white border border-slate-200 text-label-tertiary
            opacity-0 group-hover:opacity-100 hover:bg-negative hover:text-white hover:border-negative
            transition-all shadow-sm
          "
          aria-label={`Remove ${product.name}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {/* Icon - the visual anchor */}
      <div
        className={`
          flex items-center justify-center rounded-xl mb-2
          transition-colors duration-200
          ${classes.icon}
          ${isSelected
            ? "bg-accent text-white"
            : "bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600 group-hover:from-accent/10 group-hover:to-accent/5 group-hover:text-accent"
          }
        `}
      >
        <Icon className={classes.iconInner} />
      </div>

      {/* Name */}
      <h4 className={`font-semibold text-label-primary text-center truncate w-full ${classes.text}`}>
        {product.name}
      </h4>

      {/* Coverage badge */}
      {showCoverage && (
        <div
          className={`
            flex items-center gap-1 rounded-full mt-1.5
            bg-emerald-100 text-emerald-700
            ${classes.badge}
          `}
        >
          <Zap className="h-3 w-3" />
          <span className="font-medium">{product.totalCoverage}</span>
        </div>
      )}

      {/* Price */}
      {priceDisplay && (
        <span className="text-xs text-label-tertiary mt-1">{priceDisplay}</span>
      )}

      {/* Selection indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-8 rounded-full bg-accent"
        />
      )}
    </motion.div>
  );
}

/**
 * Ghost version shown when dragging/hovering
 */
export function PlacedToolGhost({
  name,
  category,
}: {
  name: string;
  category: string;
}) {
  const Icon = CATEGORY_ICONS[category] || FileText;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 0.6, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex flex-col items-center p-3 rounded-2xl border-2 border-dashed border-accent/50 bg-accent/5"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-accent mb-2">
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-sm font-medium text-accent truncate max-w-[100px]">
        {name}
      </span>
    </motion.div>
  );
}

/**
 * Mini version for tight spaces
 */
export function PlacedToolMini({
  product,
  onRemove,
}: {
  product: PlacedProduct;
  onRemove?: () => void;
}) {
  const Icon = CATEGORY_ICONS[product.category] || FileText;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1.5"
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-600">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="text-xs font-medium text-label-primary truncate">
        {product.name}
      </span>
      {onRemove && (
        <button
          onClick={onRemove}
          className="shrink-0 p-0.5 rounded text-label-quaternary opacity-0 group-hover:opacity-100 hover:text-negative transition-all"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </motion.div>
  );
}
