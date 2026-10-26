/**
 * Section Presentation Utilities
 *
 * Interprets content `ui_hints` metadata and returns Tailwind classes built
 * from the HeyPsych design tokens (see src/app/globals.css). The file and
 * function names predate the current design system and are kept for import
 * stability.
 */

export type VisualPriority = 'hero' | 'critical' | 'high' | 'medium' | 'low';
export type CardStyle = 'subtle' | 'outlined' | 'elevated' | 'filled' | 'filled_warning' | 'filled_critical' | 'outlined_critical';
export type AnimationType = 'fade_in' | 'fade_slide_up' | 'scale_up' | 'number_count_up' | 'attention_pulse';

export interface UIHints {
  layout?: string;
  icon?: string;
  color?: string;
  visual_priority?: VisualPriority;
  card_style?: CardStyle;
  animation?: AnimationType;
  sticky?: boolean;
}

/**
 * Get color classes based on semantic color hex
 */
export function getColorClasses(color?: string): {
  text: string;
  bg: string;
  border: string;
  bgLight: string;
} {
  // Content data specifies section colours with legacy semantic hex keys
  // (Apple system colours). Those keys are a data contract, so they stay; each
  // resolves to the HeyPsych semantic tokens. The brand semantic hexes are
  // accepted too, so new content can use either.
  const critical = {
    text: 'text-negative-700',
    bg: 'bg-negative',
    border: 'border-negative-border',
    bgLight: 'bg-negative-tint',
  };
  const warning = {
    text: 'text-caution-700',
    bg: 'bg-caution',
    border: 'border-caution-border',
    bgLight: 'bg-caution-tint',
  };
  const info = {
    text: 'text-accent-700',
    bg: 'bg-accent',
    border: 'border-accent-border',
    bgLight: 'bg-accent-tint',
  };
  const success = {
    text: 'text-positive-700',
    bg: 'bg-positive',
    border: 'border-positive-border',
    bgLight: 'bg-positive-tint',
  };
  const neutral = {
    text: 'text-label-secondary',
    bg: 'bg-label-tertiary',
    border: 'border-separator-opaque',
    bgLight: 'bg-surface-grouped',
  };
  const colorMap: Record<string, ReturnType<typeof getColorClasses>> = {
    '#FF3B30': critical,
    '#AD655E': critical,
    '#FF9500': warning,
    '#A98243': warning,
    '#007AFF': info,
    '#456C7E': info,
    '#34C759': success,
    '#487D66': success,
    '#8E8E93': neutral,
    '#6F746E': neutral,
  };

  return colorMap[(color || '#007AFF').toUpperCase()] || info;
}

/**
 * Get card style classes based on card_style hint
 */
export function getCardStyleClasses(style?: CardStyle): string {
  // Flat surfaces with warm hairlines, per the Worlds art direction: no
  // gradients, depth from elevation rather than colour.
  const styleMap: Record<CardStyle, string> = {
    'subtle': 'bg-surface border border-separator shadow-subtle',
    'outlined': 'bg-surface border border-separator-opaque',
    'elevated': 'bg-surface border border-separator shadow-card-2 transition-shadow hover:shadow-card-3',
    'filled': 'bg-accent-tint border border-accent-border',
    'filled_warning': 'bg-caution-tint border border-caution-border',
    'filled_critical': 'bg-negative-tint border border-negative-border',
    'outlined_critical': 'bg-surface border-2 border-negative'
  };

  return styleMap[style || 'subtle'];
}

/**
 * Get animation classes based on animation type
 */
export function getAnimationClasses(animation?: AnimationType): string {
  const animationMap: Record<AnimationType, string> = {
    'fade_in': 'animate-in fade-in duration-200',
    'fade_slide_up': 'animate-in fade-in slide-in-from-bottom-4 duration-300',
    'scale_up': 'animate-in zoom-in duration-200',
    'number_count_up': 'animate-in zoom-in duration-500',
    // No looping motion: attention comes from placement and colour.
    'attention_pulse': 'animate-in fade-in duration-200'
  };

  return animationMap[animation || 'fade_in'];
}

/**
 * Get text size classes based on visual priority
 */
export function getPriorityTextSize(priority?: VisualPriority): string {
  const sizeMap: Record<VisualPriority, string> = {
    'hero': 'text-3xl sm:text-4xl font-bold',
    'critical': 'text-2xl sm:text-3xl font-semibold',
    'high': 'text-xl sm:text-2xl font-semibold',
    'medium': 'text-lg sm:text-xl font-medium',
    'low': 'text-base font-normal'
  };

  return sizeMap[priority || 'medium'];
}

/**
 * Get stat number size (for efficacy percentages, etc.)
 */
export function getStatNumberSize(priority?: VisualPriority): string {
  const sizeMap: Record<VisualPriority, string> = {
    'hero': 'text-6xl sm:text-7xl md:text-8xl font-bold',
    'critical': 'text-5xl sm:text-6xl md:text-7xl font-bold',
    'high': 'text-4xl sm:text-5xl md:text-6xl font-bold',
    'medium': 'text-3xl sm:text-4xl font-semibold',
    'low': 'text-2xl sm:text-3xl font-medium'
  };

  return sizeMap[priority || 'high'];
}

/**
 * Map SF Symbols icon names to Lucide React icons
 * (Since we can't use actual SF Symbols in web, we map to closest Lucide equivalent)
 */
export function mapSFSymbolToLucide(sfSymbol?: string): string {
  const iconMap: Record<string, string> = {
    'quote.bubble.fill': 'MessageCircle',
    'clock.fill': 'Clock',
    'chart.bar.fill': 'BarChart3',
    'checkmark.seal.fill': 'BadgeCheck',
    'pills.fill': 'Pill',
    'exclamationmark.octagon.fill': 'AlertOctagon',
    'exclamationmark.triangle.fill': 'AlertTriangle',
    'arrow.down.forward.circle.fill': 'TrendingDown',
    'person.2.fill': 'Users',
    'book.fill': 'Book',
    'stethoscope': 'Stethoscope',
    'waveform.path.ecg': 'Activity',
    'calendar': 'Calendar',
    'list.bullet': 'List',
    'info.circle.fill': 'Info'
  };

  return iconMap[sfSymbol || 'info.circle.fill'] || 'Info';
}

/**
 * Generate complete Apple-style card classes from ui_hints
 */
export function getAppleCardClasses(hints?: UIHints): string {
  const baseClasses = 'rounded-xl overflow-hidden';
  const cardStyle = getCardStyleClasses(hints?.card_style);
  const animation = getAnimationClasses(hints?.animation);
  const sticky = hints?.sticky ? 'sticky top-4 z-10' : '';

  return `${baseClasses} ${cardStyle} ${animation} ${sticky}`.trim();
}

/**
 * Generate SF Pro typography classes
 */
export function getSFProTypography(): {
  heading1: string;
  heading2: string;
  heading3: string;
  heading4: string;
  body: string;
  bodyLarge: string;
  caption: string;
} {
  return {
    heading1: 'text-[32px] leading-tight font-semibold tracking-tight',
    heading2: 'text-[24px] leading-tight font-semibold tracking-tight',
    heading3: 'text-[20px] leading-snug font-semibold tracking-tight',
    heading4: 'text-[17px] leading-snug font-semibold tracking-tight',
    body: 'text-[15px] leading-relaxed font-normal',
    bodyLarge: 'text-[17px] leading-relaxed font-normal',
    caption: 'text-[11px] leading-tight font-normal uppercase tracking-wide'
  };
}

/**
 * Apple spacing system
 */
export function getAppleSpacing(): {
  sectionGap: string;
  cardPadding: string;
  listItemGap: string;
  inlineGap: string;
} {
  return {
    sectionGap: 'space-y-10',
    cardPadding: 'p-6',
    listItemGap: 'space-y-3',
    inlineGap: 'gap-2'
  };
}
