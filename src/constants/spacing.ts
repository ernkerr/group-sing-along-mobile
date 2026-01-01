// Base spacing scale (based on 4px unit)
export const SPACING = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
} as const;

// Input and button heights
export const HEIGHTS = {
  inputSm: 36,
  input: 44,
  inputLg: 48,
  buttonSm: 32,
  button: 36,
  buttonLg: 64,
} as const;

// Border radii
export const RADIUS = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  full: 9999,
} as const;

// Responsive breakpoints
export const BREAKPOINTS = {
  tablet: 768,
  desktop: 1024,
} as const;
