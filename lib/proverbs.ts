import { format } from 'date-fns';

/**
 * A small almanac of proverbs, verses, stoic notes, and quiet wisdom — a
 * single line surfaces at the bottom of Today each day, picked
 * deterministically from this list using a hash of the date so the same
 * day always shows the same line. Sourced wide — Scripture, the Stoics,
 * Poor Richard's Almanack, modern voices, and a few unattributed seasonal
 * proverbs — so no single tradition dominates.
 *
 * Voice rules: short, plain, slightly literary. Nothing that reads as a
 * push to "crush it" or "stay on track." Every line should feel like
 * something a thoughtful older friend would underline in their notebook.
 */

export type Proverb = {
  text: string;
  attribution?: string;
};

export const proverbs: readonly Proverb[] = [
  // Scripture
  {
    text: 'The plans of the diligent lead to profit as surely as haste leads to poverty.',
    attribution: 'Proverbs 21:5',
  },
  { text: 'Be still, and know that I am God.', attribution: 'Psalm 46:10' },
  {
    text: 'Teach us to number our days, that we may gain a heart of wisdom.',
    attribution: 'Psalm 90:12',
  },
  { text: 'Iron sharpens iron, so one person sharpens another.', attribution: 'Proverbs 27:17' },
  { text: 'A friend loves at all times.', attribution: 'Proverbs 17:17' },
  {
    text: 'Whatever you do, work at it with all your heart, as working for the Lord.',
    attribution: 'Colossians 3:23',
  },
  {
    text: 'There is a time for everything, and a season for every activity under the heavens.',
    attribution: 'Ecclesiastes 3:1',
  },
  {
    text: 'Commit to the Lord whatever you do, and he will establish your plans.',
    attribution: 'Proverbs 16:3',
  },

  // Stoic
  {
    text: 'You have power over your mind, not outside events. Realize this, and you will find strength.',
    attribution: 'Marcus Aurelius',
  },
  { text: 'We suffer more often in imagination than in reality.', attribution: 'Seneca' },
  {
    text: 'First say to yourself what you would be; then do what you have to do.',
    attribution: 'Epictetus',
  },
  {
    text: 'Waste no more time arguing what a good man should be. Be one.',
    attribution: 'Marcus Aurelius',
  },
  {
    text: "It is not that we have a short time to live, but that we waste a lot of it.",
    attribution: 'Seneca',
  },

  // Poor Richard's Almanack & Franklin
  {
    text: 'Lost time is never found again.',
    attribution: 'Benjamin Franklin',
  },
  {
    text: 'Well done is better than well said.',
    attribution: 'Benjamin Franklin',
  },
  {
    text: 'By failing to prepare, you are preparing to fail.',
    attribution: 'Benjamin Franklin',
  },
  {
    text: 'Early to bed and early to rise makes a man healthy, wealthy, and wise.',
    attribution: "Poor Richard's Almanack",
  },

  // Modern voices, quiet
  {
    text: 'You will never find time for anything. If you want time, you must make it.',
    attribution: 'Charles Buxton',
  },
  {
    text: 'The two most powerful warriors are patience and time.',
    attribution: 'Leo Tolstoy',
  },
  {
    text: 'How we spend our days is, of course, how we spend our lives.',
    attribution: 'Annie Dillard',
  },
  {
    text: 'The best time to plant a tree was twenty years ago. The second best time is now.',
    attribution: 'Chinese proverb',
  },
  {
    text: "Don't let the perfect be the enemy of the good.",
    attribution: 'Voltaire',
  },
  {
    text: 'A year from now you may wish you had started today.',
    attribution: 'Karen Lamb',
  },

  // Unattributed almanac-feel proverbs
  { text: 'Bloom where you are planted.' },
  { text: 'Slow is smooth, smooth is fast.' },
  { text: 'Plant a garden you may never sit in.' },
  { text: 'A small thing done daily becomes a quiet revolution.' },
  { text: 'The harvest is in the rhythm, not the season.' },
  { text: 'You become the practices you keep.' },
  { text: 'Most days will not feel like history. Live them carefully anyway.' },
  { text: 'The week is a covenant, not a queue.' },

  // Relational
  {
    text: 'People will forget what you said, but they will never forget how you made them feel.',
    attribution: 'Maya Angelou',
  },
  {
    text: 'The opposite of love is not hate, but indifference.',
    attribution: 'Elie Wiesel',
  },
];

/**
 * Pick a deterministic proverb for the given date. Same date → same proverb.
 * The hash is intentionally simple — collisions across the year are fine
 * since the pool is large enough that variation feels organic.
 */
export function getProverbForDate(date: Date): Proverb {
  const key = format(date, 'yyyy-MM-dd');
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(h) % proverbs.length;
  return proverbs[idx]!;
}
