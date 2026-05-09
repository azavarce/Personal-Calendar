/**
 * Typography for The Personal Almanac.
 *
 * Per DESIGN.md:
 *   Display: Fraunces (variable serif with optical-size axis).
 *   Body:    Söhne (preferred) — DM Sans is the v0 Google-Fonts placeholder.
 *            Both are humanist sans. Swap to Söhne when license obtained.
 *
 * Inter, SF Pro, and Roboto are explicitly forbidden as defaults.
 *
 * Numeric data renders with `fontVariant: ['tabular-nums']` everywhere it
 * appears in time/date/duration/count form. Non-negotiable in a calendar.
 */

import type { TextStyle } from 'react-native';

// Font family names as exposed by @expo-google-fonts/* packages.
export const fontFamily = {
  displayRegular: 'Fraunces_400Regular',
  displayMedium: 'Fraunces_500Medium',
  displaySemibold: 'Fraunces_600SemiBold',
  bodyRegular: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
} as const;

export const tabularNums: TextStyle = {
  fontVariant: ['tabular-nums'],
};

type Variant = TextStyle & { lineHeight: number };

// 5-step modular scale with strong contrast (≥1.25 ratio between adjacent
// weights). Sizes are points (React Native's unit on iOS; dp on Android).
export const text: Record<string, Variant> = {
  display: {
    fontFamily: fontFamily.displayMedium,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -0.4,
  },
  displayLarge: {
    fontFamily: fontFamily.displayMedium,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -0.5,
  },
  headline: {
    fontFamily: fontFamily.displayMedium,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  title: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  body: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 16,
    lineHeight: 23,
  },
  bodyMedium: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 16,
    lineHeight: 23,
  },
  footnote: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  label: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.72, // ~+0.06em at 12pt — required for all-caps labels
    textTransform: 'uppercase',
  },
  // Numeric variant — used for times, dates, durations.
  numeric: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 13,
    lineHeight: 16,
    fontVariant: ['tabular-nums'],
  },
  numericLarge: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 17,
    lineHeight: 20,
    fontVariant: ['tabular-nums'],
  },
};

// The complete list of font assets that need to load before splash dismisses.
export const fontsToLoad = [
  'Fraunces_400Regular',
  'Fraunces_500Medium',
  'Fraunces_600SemiBold',
  'DMSans_400Regular',
  'DMSans_500Medium',
  'DMSans_700Bold',
] as const;
