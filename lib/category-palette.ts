/**
 * The 12-swatch palette used when the user adds a custom category. Each swatch
 * is a designed light/dark pair, OKLCH-balanced to sit alongside the warm-clay
 * neutrals without breaking the system. The first six map to the built-in
 * categories (Faith / Family / Health / Friendship / Learning / Personal),
 * which means a user-added category can never look identical to a built-in
 * unless the user picks the same swatch on purpose.
 *
 * Glyphs available are likewise a curated set; new categories choose from
 * here so we don't get random unicode that breaks across font fallbacks.
 */

export type ColorPair = { light: string; dark: string };

export type ColorSwatch = {
  id: string;
  /** User-facing name shown next to the swatch. */
  name: string;
  pair: ColorPair;
};

export const categoryColorPalette: ColorSwatch[] = [
  // The six built-ins, in order.
  { id: 'claret',     name: 'Claret',     pair: { light: '#8B2929', dark: '#C76060' } },
  { id: 'terracotta', name: 'Terracotta', pair: { light: '#B5703D', dark: '#D49567' } },
  { id: 'forest',     name: 'Forest',     pair: { light: '#4F6B4D', dark: '#7F9E7B' } },
  { id: 'amber',      name: 'Amber',      pair: { light: '#B58A3F', dark: '#D9B568' } },
  { id: 'plum',       name: 'Plum',       pair: { light: '#6B4E71', dark: '#9C7DA3' } },
  { id: 'slate',      name: 'Slate',      pair: { light: '#4F5C70', dark: '#7888A0' } },
  // Six additional curated swatches for custom categories.
  { id: 'teal',       name: 'Teal',       pair: { light: '#3D6B6B', dark: '#6B9B9B' } },
  { id: 'cobalt',     name: 'Cobalt',     pair: { light: '#3D5C8B', dark: '#6B8BC9' } },
  { id: 'wine',       name: 'Wine',       pair: { light: '#7B2D52', dark: '#B85A82' } },
  { id: 'olive',      name: 'Olive',      pair: { light: '#6B6B3D', dark: '#9B9B6B' } },
  { id: 'peach',      name: 'Peach',      pair: { light: '#C97B5C', dark: '#E0A58A' } },
  { id: 'mauve',      name: 'Mauve',      pair: { light: '#8B5C7B', dark: '#B58AA0' } },
];

export function findSwatch(id: string): ColorSwatch | undefined {
  return categoryColorPalette.find((s) => s.id === id);
}

export const categoryGlyphPalette: string[] = [
  '◆', '●', '▲', '■', '▼', '✚',
  '★', '✦', '◯', '◻', '▽', '✛',
  '❖', '♦', '♣', '✱', '◬', '✧',
];
