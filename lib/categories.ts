import type { CategoryId } from '@/theme';

export type Category = {
  id: CategoryId;
  label: string;
  /** Glyph used for dual-encoding so colour is never the sole signal (a11y). */
  glyph: string;
};

export const categories: readonly Category[] = [
  { id: 'faith', label: 'Faith', glyph: '◆' },
  { id: 'family', label: 'Family', glyph: '●' },
  { id: 'health', label: 'Health', glyph: '▲' },
  { id: 'friendship', label: 'Friendship', glyph: '■' },
  { id: 'learning', label: 'Learning', glyph: '▼' },
  { id: 'personal', label: 'Personal', glyph: '✚' },
];

export const categoryById: Record<CategoryId, Category> = categories.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CategoryId, Category>,
);
