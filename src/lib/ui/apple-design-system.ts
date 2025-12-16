/**
 * Apple Design System Utilities
 *
 * Interprets ui_hints metadata and returns Tailwind CSS classes
 * following Apple's design principles (Clarity, Deference, Depth)
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
  const colorMap: Record<string, ReturnType<typeof getColorClasses>> = {
    '#FF3B30': { // Critical (red)
      text: 'text-red-700',
      bg: 'bg-red-500',
      border: 'border-red-300',
      bgLight: 'bg-red-50'
    },
    '#FF9500': { // Warning (orange)
      text: 'text-amber-700',
      bg: 'bg-amber-500',
      border: 'border-amber-300',
      bgLight: 'bg-amber-50'
    },
    '#007AFF': { // Info (blue)
      text: 'text-blue-700',
      bg: 'bg-blue-500',
      border: 'border-blue-300',
      bgLight: 'bg-blue-50'
    },
    '#34C759': { // Success (green)
      text: 'text-green-700',
      bg: 'bg-green-500',
      border: 'border-green-300',
      bgLight: 'bg-green-50'
    },
    '#8E8E93': { // Neutral (gray)
      text: 'text-neutral-700',
      bg: 'bg-neutral-500',
      border: 'border-neutral-300',
      bgLight: 'bg-neutral-50'
    }
  };

  return colorMap[color || '#007AFF'] || colorMap['#007AFF'];
}

/**
 * Get card style classes based on card_style hint
 */
export function getCardStyleClasses(style?: CardStyle): string {
  const styleMap: Record<CardStyle, string> = {
    'subtle': 'bg-white border border-neutral-100 shadow-sm',
    'outlined': 'bg-white border-2 border-neutral-200',
    'elevated': 'bg-white border border-neutral-100 shadow-md hover:shadow-lg transition-shadow',
    'filled': 'bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200',
    'filled_warning': 'bg-gradient-to-br from-amber-50 to-amber-100 border-2 border-amber-300',
    'filled_critical': 'bg-gradient-to-br from-red-50 to-red-100 border-2 border-red-300',
    'outlined_critical': 'bg-white border-3 border-red-500'
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
    'attention_pulse': 'animate-pulse'
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
