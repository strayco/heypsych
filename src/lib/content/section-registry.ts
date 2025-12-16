/**
 * Section Registry
 *
 * Maps section types to their presentation configuration.
 * This is the ONLY place where UI/presentation decisions should be made.
 *
 * Content-only JSON should specify WHAT sections exist (type, heading, content),
 * never HOW they are presented (layout, colors, animations).
 */

import type { UIHints } from '@/lib/ui/apple-design-system';

/**
 * Section Rendering Configuration
 */
export interface SectionConfig {
  // Display settings
  layout?: 'quote_carousel' | 'stat_card' | 'alert_banner' | 'timeline' | 'default';
  expandedByDefault: boolean;
  collapsible: boolean;

  // Visual settings (design system)
  uiHints?: UIHints;

  // Icon mapping (optional - can be inferred from type)
  iconName?: string;
}

/**
 * Default UI Hints for common layouts
 */
const DEFAULT_UI_HINTS: Record<string, Partial<UIHints>> = {
  quote_carousel: {
    layout: 'quote_carousel',
    icon: 'quote.bubble.fill',
    color: '#007AFF',
    visual_priority: 'hero',
    card_style: 'filled',
    animation: 'fade_slide_up'
  },
  stat_card: {
    layout: 'stat_card',
    icon: 'chart.bar.fill',
    color: '#34C759',
    visual_priority: 'high',
    card_style: 'elevated',
    animation: 'number_count_up'
  },
  alert_banner: {
    layout: 'alert_banner',
    icon: 'exclamationmark.octagon.fill',
    color: '#FF3B30',
    visual_priority: 'critical',
    card_style: 'filled_critical',
    animation: 'fade_in',
    sticky: true
  },
  timeline: {
    layout: 'timeline',
    icon: 'clock.fill',
    color: '#007AFF',
    visual_priority: 'high',
    card_style: 'outlined',
    animation: 'fade_in'
  }
};

/**
 * Section Type Registry
 *
 * Maps every known section type to its presentation configuration.
 */
const SECTION_REGISTRY: Record<string, SectionConfig> = {
  // Expanded by default sections
  indications: {
    expandedByDefault: true,
    collapsible: false,
    iconName: 'shield'
  },

  patient_experience: {
    layout: 'quote_carousel',
    expandedByDefault: true,
    collapsible: false,
    uiHints: DEFAULT_UI_HINTS.quote_carousel as UIHints,
    iconName: 'users'
  },

  onset_duration: {
    layout: 'timeline',
    expandedByDefault: true,
    collapsible: false,
    uiHints: DEFAULT_UI_HINTS.timeline as UIHints,
    iconName: 'clock'
  },

  // Critical sections (collapsible but important)
  warnings: {
    layout: 'alert_banner',
    expandedByDefault: false,
    collapsible: false,
    uiHints: DEFAULT_UI_HINTS.alert_banner as UIHints,
    iconName: 'alert-triangle'
  },

  efficacy: {
    layout: 'stat_card',
    expandedByDefault: false,
    collapsible: true,
    uiHints: DEFAULT_UI_HINTS.stat_card as UIHints,
    iconName: 'target'
  },

  // Standard collapsible sections
  adverse_effects: {
    expandedByDefault: false,
    collapsible: true,
    iconName: 'alert-triangle'
  },

  interactions: {
    expandedByDefault: false,
    collapsible: true,
    iconName: 'pill'
  },

  tapering: {
    expandedByDefault: false,
    collapsible: true,
    iconName: 'trending-down'
  },

  dosing: {
    expandedByDefault: false,
    collapsible: true,
    iconName: 'pill'
  },

  special_populations: {
    expandedByDefault: false,
    collapsible: true,
    iconName: 'users'
  },

  monitoring: {
    expandedByDefault: false,
    collapsible: true,
    iconName: 'activity'
  },

  dosage_forms: {
    expandedByDefault: false,
    collapsible: true,
    iconName: 'pill'
  },

  mechanism: {
    expandedByDefault: false,
    collapsible: true,
    iconName: 'zap'
  },

  clinical_context: {
    expandedByDefault: false,
    collapsible: true,
    iconName: 'book'
  },

  references: {
    expandedByDefault: false,
    collapsible: true,
    iconName: 'book'
  },

  // Therapy sections
  protocol: {
    expandedByDefault: false,
    collapsible: true,
    iconName: 'settings'
  },

  treatment_variants: {
    expandedByDefault: false,
    collapsible: true,
    iconName: 'activity'
  },

  expected_outcomes: {
    expandedByDefault: false,
    collapsible: true,
    iconName: 'target'
  },

  side_effects: {
    expandedByDefault: false,
    collapsible: true,
    iconName: 'alert-triangle'
  },

  contraindications: {
    expandedByDefault: false,
    collapsible: true,
    iconName: 'alert-triangle'
  },

  patient_selection: {
    expandedByDefault: false,
    collapsible: true,
    iconName: 'users'
  },

  integration_support: {
    expandedByDefault: false,
    collapsible: true,
    iconName: 'heart'
  },

  cost_considerations: {
    expandedByDefault: false,
    collapsible: true,
    iconName: 'dollar-sign'
  },

  clinical_notes: {
    expandedByDefault: false,
    collapsible: true,
    iconName: 'file-text'
  }
};

/**
 * Get section configuration
 *
 * @param type - Section type from JSON
 * @returns Section presentation configuration
 */
export function getSectionConfig(type: string): SectionConfig {
  // Return registered config or default
  return SECTION_REGISTRY[type] || {
    expandedByDefault: false,
    collapsible: true,
    iconName: 'info'
  };
}

/**
 * Check if section should be expanded by default
 *
 * @param type - Section type
 * @returns True if section should be expanded by default
 */
export function shouldSectionBeExpandedByDefault(type: string): boolean {
  const config = getSectionConfig(type);
  return config.expandedByDefault;
}

/**
 * Check if section is collapsible
 *
 * @param type - Section type
 * @returns True if section can be collapsed
 */
export function isSectionCollapsible(type: string): boolean {
  const config = getSectionConfig(type);
  return config.collapsible;
}

/**
 * Get UI hints for section type
 *
 * Returns ui_hints from section data if present (legacy),
 * otherwise returns default ui_hints from registry.
 *
 * @param type - Section type
 * @param sectionData - Section data from JSON (may contain legacy ui_hints)
 * @returns UIHints object
 */
export function getSectionUIHints(
  type: string,
  sectionData?: any
): UIHints | undefined {
  // Priority 1: Explicit ui_hints from JSON (legacy support)
  if (sectionData?.ui_hints) {
    return sectionData.ui_hints;
  }

  // Priority 2: Default ui_hints from registry
  const config = getSectionConfig(type);
  return config.uiHints;
}

/**
 * Get layout type for section
 *
 * @param type - Section type
 * @param sectionData - Section data from JSON
 * @returns Layout type
 */
export function getSectionLayout(
  type: string,
  sectionData?: any
): string | undefined {
  // Check explicit ui_hints first (legacy)
  if (sectionData?.ui_hints?.layout) {
    return sectionData.ui_hints.layout;
  }

  // Check registry
  const config = getSectionConfig(type);
  return config.layout;
}

/**
 * Get icon name for section type
 *
 * @param type - Section type
 * @returns Icon name (lucide-react icon name)
 */
export function getSectionIconName(type: string): string {
  const config = getSectionConfig(type);
  return config.iconName || 'info';
}

/**
 * Register a new section type
 *
 * Allows dynamic registration of new section types at runtime.
 *
 * @param type - Section type identifier
 * @param config - Section configuration
 */
export function registerSectionType(type: string, config: SectionConfig): void {
  SECTION_REGISTRY[type] = config;
}

/**
 * Get all registered section types
 *
 * @returns Array of section type identifiers
 */
export function getRegisteredSectionTypes(): string[] {
  return Object.keys(SECTION_REGISTRY);
}

/**
 * Check if section type is registered
 *
 * @param type - Section type to check
 * @returns True if section type is registered
 */
export function isSectionTypeRegistered(type: string): boolean {
  return type in SECTION_REGISTRY;
}
