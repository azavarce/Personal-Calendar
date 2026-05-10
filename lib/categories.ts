import type { ColorPair } from '@/lib/category-palette';

/** A category id is now an open string. The built-in six have stable ids. */
export type CategoryId = string;

export type Category = {
  id: CategoryId;
  label: string;
  glyph: string;
  /** Resolved color pair for this category, light + dark. */
  color: ColorPair;
  /** True for the six shipped categories. False for user-added customs.
   * Built-ins cannot be deleted; customs can. */
  builtin: boolean;
  /** Glyph used for dual-encoding so colour is never the sole signal (a11y). */
};

export const BUILTIN_CATEGORY_IDS = [
  'faith',
  'family',
  'health',
  'friendship',
  'learning',
  'personal',
] as const;

export type BuiltinCategoryId = (typeof BUILTIN_CATEGORY_IDS)[number];

export const categories: readonly Category[] = [
  {
    id: 'faith',
    label: 'Faith',
    glyph: '◆',
    color: { light: '#8B2929', dark: '#C76060' },
    builtin: true,
  },
  {
    id: 'family',
    label: 'Family',
    glyph: '●',
    color: { light: '#B5703D', dark: '#D49567' },
    builtin: true,
  },
  {
    id: 'health',
    label: 'Health',
    glyph: '▲',
    color: { light: '#4F6B4D', dark: '#7F9E7B' },
    builtin: true,
  },
  {
    id: 'friendship',
    label: 'Friendship',
    glyph: '■',
    color: { light: '#B58A3F', dark: '#D9B568' },
    builtin: true,
  },
  {
    id: 'learning',
    label: 'Learning',
    glyph: '▼',
    color: { light: '#6B4E71', dark: '#9C7DA3' },
    builtin: true,
  },
  {
    id: 'personal',
    label: 'Personal',
    glyph: '✚',
    color: { light: '#4F5C70', dark: '#7888A0' },
    builtin: true,
  },
];

export const categoryById: Record<CategoryId, Category> = categories.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CategoryId, Category>,
);
