/**
 * 4pt-based spacing scale per impeccable spatial-design.md.
 *
 * 8pt is too coarse — we frequently need 12 between 8 and 16. Use 4pt for
 * granularity. Names are semantic (`md`, `lg`), not numeric (`spacing-12`).
 */

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const hitSlop = { top: 12, bottom: 12, left: 12, right: 12 } as const;

// Minimum touch target — non-negotiable per DESIGN.md.
export const minTouch = 44;
