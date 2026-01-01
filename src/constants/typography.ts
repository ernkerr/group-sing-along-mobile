// Base font sizes
export const FONT_SIZE = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
} as const;

// Line height multipliers
export const LINE_HEIGHT = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.625,
  loose: 1.8,
} as const;

// Font scale configuration for accessibility
export const FONT_SCALE = {
  min: 0.625,
  max: 2.0,
  default: 1.0,
  step: 0.125,
} as const;
