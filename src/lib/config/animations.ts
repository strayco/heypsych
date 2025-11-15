export const animationConfig = {
  // Global animation settings
  global: {
    duration: 0.3,
    ease: [0.4, 0.0, 0.2, 1] as [number, number, number, number],
    stagger: 0.1,
  },

  // Reusable animation variants
  variants: {
    fadeIn: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    },
    scaleIn: {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 },
    },
    slideIn: {
      hidden: { opacity: 0, x: -20 },
      visible: { opacity: 1, x: 0 },
    },
  },

  // Component-specific animations
  components: {
    treatmentCard: {
      hover: { scale: 1.02, y: -4 },
      tap: { scale: 0.98 },
      transition: { duration: 0.2 },
    },
    modal: {
      backdrop: { opacity: [0, 0.5] },
      content: { scale: [0.95, 1], opacity: [0, 1] },
    },
    chart: {
      bar: { scaleY: [0, 1] },
      line: { pathLength: [0, 1] },
      stagger: 0.05,
    },
  },
} as const;

export type AnimationConfig = typeof animationConfig;
