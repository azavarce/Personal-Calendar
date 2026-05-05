/**
 * Color tokens for The Personal Almanac.
 *
 * All values are sRGB hex approximations of OKLCH source colors. The OKLCH
 * source is in the comment beside each value so it can be regenerated if a
 * wide-gamut display target is ever added.
 *
 * Doctrine (per DESIGN.md):
 *   - Pure #FFFFFF and #000000 are forbidden. Every neutral is tinted toward
 *     warm clay (chroma 0.005–0.015 in OKLCH).
 *   - Warm Oxblood is the brand anchor. Used on ≤10% of any screen.
 *   - Six category accents are content signal only (event blocks, dots, chips).
 *     Never surface fills.
 */

export type ThemeMode = 'light' | 'dark';

export type CategoryId =
  | 'faith'
  | 'family'
  | 'health'
  | 'friendship'
  | 'learning'
  | 'personal';

export type Palette = {
  bg: {
    canvas: string;
    surface: string;
    elevated: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    onBrand: string;
  };
  hairline: string;
  brand: {
    primary: string;
    primaryPressed: string;
  };
  category: Record<CategoryId, string>;
  shadow: string;
};

const light: Palette = {
  bg: {
    canvas: '#F5EFE5',     // oklch(96% 0.008 60)  Almanac Cream
    surface: '#EFE8DB',    // oklch(93% 0.010 60)  recessed cards in light
    elevated: '#FAF5EC',   // oklch(98% 0.006 60)  FAB layer
  },
  text: {
    primary: '#2C2620',    // oklch(22% 0.010 60)
    secondary: '#6B6359',  // oklch(48% 0.010 60)
    tertiary: '#9C9385',   // oklch(65% 0.012 60)
    onBrand: '#F5EFE5',
  },
  hairline: '#DBD3C2',     // oklch(85% 0.012 60)
  brand: {
    primary: '#8B3220',    // oklch(45% 0.130 25)  Warm Oxblood
    primaryPressed: '#6E2616', // oklch(38% 0.125 25)
  },
  category: {
    faith: '#8B2929',      // oklch(43% 0.135 18)   deep claret
    family: '#B5703D',     // oklch(60% 0.120 50)   muted terracotta
    health: '#4F6B4D',     // oklch(50% 0.060 145)  quiet forest
    friendship: '#B58A3F', // oklch(62% 0.110 75)   warm amber
    learning: '#6B4E71',   // oklch(45% 0.075 320)  dusty plum
    personal: '#4F5C70',   // oklch(45% 0.045 245)  ink slate
  },
  shadow: 'rgba(54, 38, 22, 0.18)', // warm-tinted shadow
};

const dark: Palette = {
  bg: {
    canvas: '#15130F',     // oklch(15% 0.008 60)  Almanac Ink — never #000
    surface: '#1E1B16',    // oklch(20% 0.008 60)  lifted cards
    elevated: '#28241E',   // oklch(25% 0.008 60)  FAB layer
  },
  text: {
    primary: '#E8E0D2',    // oklch(90% 0.012 60)  body text in dark
    secondary: '#A0978A',  // oklch(67% 0.012 60)
    tertiary: '#6B6359',   // oklch(48% 0.010 60)
    onBrand: '#15130F',
  },
  hairline: '#2D2922',     // oklch(28% 0.010 60)
  brand: {
    primary: '#C16A4D',    // oklch(60% 0.130 25)  oxblood lifted for dark
    primaryPressed: '#A04F35', // oklch(52% 0.130 25)
  },
  category: {
    faith: '#C76060',      // oklch(63% 0.135 18)
    family: '#D49567',     // oklch(72% 0.110 50)
    health: '#7F9E7B',     // oklch(67% 0.060 145)
    friendship: '#D9B568', // oklch(78% 0.110 75)
    learning: '#9C7DA3',   // oklch(63% 0.075 320)
    personal: '#7888A0',   // oklch(60% 0.045 245)
  },
  shadow: 'rgba(0, 0, 0, 0.40)',
};

export const palettes: Record<ThemeMode, Palette> = { light, dark };

export const getPalette = (mode: ThemeMode): Palette => palettes[mode];
