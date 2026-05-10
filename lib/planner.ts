import { addDays, format, setHours, setMinutes, setSeconds } from 'date-fns';
import type { CategoryId } from '@/theme';

/**
 * The Planner is the AI-conducted, multi-event flow. Distinct from Quick
 * Capture (single event). Each Template has its own question set and its
 * own mock plan generator.
 *
 * Voice: warm, plain, slightly literary. No "Crush it." No "Streak."
 */

export type TemplateId = 'bible' | 'friends' | 'dateNights' | 'custom';

export type PlanEvent = {
  id: string;
  title: string;
  startISO: string;
  endISO: string;
  category: CategoryId;
  destinationApp?: string;
};

export type Plan = {
  reasoning: string;
  events: PlanEvent[];
  totalCount: number;
  goalTitle: string;
  goalCadence: string;
  category: CategoryId;
};

// ---------- Bible ----------

export const bibleTranslations = ['ESV', 'NIV', 'NLT', 'KJV', 'CSB'] as const;
export type BibleTranslation = (typeof bibleTranslations)[number];

export type BiblePlanType = 'canonical' | 'chronological' | 'mcheyne' | 'onePerDay';

export const biblePlanTypes: { id: BiblePlanType; label: string; sub: string }[] = [
  { id: 'canonical', label: 'Canonical', sub: 'Genesis to Revelation, in order' },
  { id: 'chronological', label: 'Chronological', sub: 'In the order events happened' },
  { id: 'mcheyne', label: "M'Cheyne", sub: 'Two OT + two NT chapters each day' },
  { id: 'onePerDay', label: 'One a day', sub: 'A steady walk over three years' },
];

const earlyChapters = [
  'Genesis 1 – 3',
  'Genesis 4 – 6',
  'Genesis 7 – 9',
  'Genesis 10 – 12',
  'Genesis 13 – 15',
  'Genesis 16 – 18',
  'Genesis 19 – 21',
  'Genesis 22 – 24',
  'Genesis 25 – 27',
  'Genesis 28 – 30',
  'Genesis 31 – 33',
  'Genesis 34 – 36',
  'Genesis 37 – 39',
  'Genesis 40 – 42',
];

const chronologicalEarly = [
  'Genesis 1', 'Genesis 2', 'Genesis 3', 'Genesis 4',
  'Genesis 5', 'Genesis 6', 'Job 1', 'Job 2',
  'Genesis 7', 'Genesis 8', 'Genesis 9', 'Job 3',
  'Job 4', 'Genesis 10',
];

const mcheyneEarly = [
  'Genesis 1 · Matthew 1', 'Genesis 2 · Matthew 2', 'Genesis 3 · Matthew 3',
  'Genesis 4 · Matthew 4', 'Genesis 5 · Matthew 5', 'Genesis 6 · Matthew 6',
  'Genesis 7 · Matthew 7', 'Genesis 8 · Matthew 8', 'Genesis 9 · Matthew 9',
  'Genesis 10 · Matthew 10', 'Genesis 11 · Matthew 11',
  'Genesis 12 · Matthew 12', 'Genesis 13 · Matthew 13', 'Genesis 14 · Matthew 14',
];

const reasoningByPlan: Record<BiblePlanType, (t: BibleTranslation) => string> = {
  canonical: (t) =>
    `${t}, Genesis to Revelation in order. Three chapters most mornings, lighter on Sundays. The first two and a half weeks carry you through Genesis.`,
  chronological: (t) =>
    `${t}, in the order events likely happened. You'll be in Genesis and Job in the same week — they share an era. Thirty minutes a day.`,
  mcheyne: (t) =>
    `${t}. Robert Murray M'Cheyne's plan from 1842 — two Old Testament chapters paired with two New Testament chapters every day. You finish the Old Testament once and the New Testament twice in the year.`,
  onePerDay: (t) =>
    `${t}, one chapter a day. The Bible has 1,189 chapters; this is a steady three-year walk. You'll still be in Genesis when summer arrives.`,
};

const dailyAtSixThirty = (date: Date): { startISO: string; endISO: string } => {
  const start = setSeconds(setMinutes(setHours(date, 6), 30), 0);
  const end = setSeconds(setMinutes(setHours(date, 7), 0), 0);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
};

export function generateBiblePlan(
  translation: BibleTranslation,
  planType: BiblePlanType,
): Plan {
  const today = new Date();
  const titles =
    planType === 'chronological'
      ? chronologicalEarly
      : planType === 'mcheyne'
        ? mcheyneEarly
        : earlyChapters;

  const events: PlanEvent[] = titles.map((title, i) => {
    const date = addDays(today, i);
    const { startISO, endISO } = dailyAtSixThirty(date);
    return {
      id: `bible-${i}`,
      title,
      startISO,
      endISO,
      category: 'faith',
      destinationApp: 'YouVersion',
    };
  });

  return {
    reasoning: reasoningByPlan[planType](translation),
    events,
    totalCount: 365,
    goalTitle: `Read the Bible (${translation})`,
    goalCadence:
      planType === 'mcheyne'
        ? '4 chapters daily'
        : planType === 'onePerDay'
          ? 'One chapter a day'
          : 'Daily reading at dawn',
    category: 'faith',
  };
}

// ---------- Friends ----------

export const defaultFriends = [
  'Gabriel',
  'Jora',
  'Ramiro',
  'Guarino',
  'Venneth',
  'Juan Carlos',
  'Manoel',
] as const;

export type FriendCadence = 'weekly' | 'biweekly' | 'monthly';

export const friendCadences: { id: FriendCadence; label: string; sub: string }[] = [
  { id: 'weekly', label: 'Weekly', sub: 'A short check-in every week' },
  { id: 'biweekly', label: 'Every other week', sub: 'A rhythm without overload' },
  { id: 'monthly', label: 'Monthly', sub: 'A real conversation each month' },
];

export type FriendChannel = 'imessage' | 'whatsapp' | 'messenger' | 'call';

export const friendChannels: {
  id: FriendChannel;
  label: string;
  /** The verb that begins the event title for this channel. */
  verb: string;
  /** App that the deep-link targets on the event detail sheet. */
  appName: string;
}[] = [
  { id: 'imessage', label: 'iMessage', verb: 'Text', appName: 'Messages' },
  { id: 'whatsapp', label: 'WhatsApp', verb: 'WhatsApp', appName: 'WhatsApp' },
  { id: 'messenger', label: 'Messenger', verb: 'Message', appName: 'Messenger' },
  { id: 'call', label: 'Call', verb: 'Call', appName: 'Phone' },
];

export type FriendPick = { name: string; channel: FriendChannel };

export function generateFriendsPlan(
  picks: FriendPick[],
  cadence: FriendCadence,
): Plan {
  const today = new Date();
  const stepDays = cadence === 'weekly' ? 7 : cadence === 'biweekly' ? 14 : 30;
  const firstSlot = setSeconds(setMinutes(setHours(today, 12), 30), 0);

  const events: PlanEvent[] = [];
  let cursor = 0;
  const channelMeta = new Map(friendChannels.map((c) => [c.id, c]));
  // Generate the next 12 weeks of reach-outs, rotating through picks.
  for (let week = 0; week < 12; week++) {
    const dayOffset = week * stepDays + (picks.length > 0 ? 0 : 0);
    if (dayOffset > 84) break;
    for (let p = 0; p < picks.length; p++) {
      const pick = picks[p]!;
      const meta = channelMeta.get(pick.channel)!;
      const eventDate = addDays(firstSlot, week * stepDays + p * 2);
      const end = new Date(eventDate);
      end.setMinutes(end.getMinutes() + 15);
      events.push({
        id: `friends-${cursor++}`,
        title: `${meta.verb} ${pick.name}`,
        startISO: eventDate.toISOString(),
        endISO: end.toISOString(),
        category: 'friendship',
        destinationApp: meta.appName,
      });
      if (events.length >= 14) break;
    }
    if (events.length >= 14) break;
  }

  const cadenceCopy =
    cadence === 'weekly'
      ? 'a short check-in every week'
      : cadence === 'biweekly'
        ? 'a rhythm of every other week'
        : 'one real conversation each month';

  const names = picks.map((p) => p.name);
  const peopleLine =
    names.length === 1
      ? names[0]
      : names.length === 2
        ? `${names[0]} and ${names[1]}`
        : `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;

  return {
    reasoning: `Built for ${peopleLine}. ${
      cadenceCopy.charAt(0).toUpperCase() + cadenceCopy.slice(1)
    }, slotted around lunch when you're already pausing. Each one carries the channel you picked so the tap goes straight to the right app.`,
    events,
    totalCount: picks.length * (cadence === 'weekly' ? 52 : cadence === 'biweekly' ? 26 : 12),
    goalTitle: 'Stay close with my people',
    goalCadence: cadenceCopy,
    category: 'friendship',
  };
}

// ---------- Date Nights ----------

export const dateNightVibes = [
  { id: 'food', label: 'Food' },
  { id: 'outdoors', label: 'Outdoors' },
  { id: 'culture', label: 'Culture' },
  { id: 'quiet', label: 'Quiet evenings in' },
] as const;
export type DateNightVibe = (typeof dateNightVibes)[number]['id'];

export const dateNightBudgets = [
  { id: 'modest', label: 'Modest', sub: 'Under $50' },
  { id: 'moderate', label: 'Moderate', sub: '$50 – $150' },
  { id: 'splurge', label: 'Splurge', sub: '$150+' },
  { id: 'mix', label: 'Mix it up', sub: 'A little of each' },
] as const;
export type DateNightBudget = (typeof dateNightBudgets)[number]['id'];

const ideasByVibe: Record<DateNightVibe, string[]> = {
  food: [
    'Try the new omakase place downtown',
    'A pasta-making class together',
    'Wine pairing dinner at the bistro',
    'Tacos and live music at the courtyard',
    "Brunch somewhere you've both been meaning to try",
    'Cook a recipe neither of you has made before',
    'Bakery crawl — find the best croissant in town',
    'Late-night dessert at the place with the long line',
    'A long, slow Sunday lunch with a bottle of red',
    'Build-your-own ramen night at home',
    'A tasting menu — let the chef decide',
    "Street food crawl in the neighborhood you don't know",
  ],
  outdoors: [
    'Sunset hike at the ridge',
    'Picnic in the rose garden',
    'Stargazing drive with a thermos of coffee',
    'Long walk along the river path',
    'Bike ride to the next town and back',
    'Find a tide pool at low tide',
    'Pack lunch and visit the arboretum',
    'Drive an hour out, walk in, see what you find',
    'Catch the sunrise somewhere that takes effort',
    "A canoe — you'll laugh at how badly you both paddle",
  ],
  culture: [
    'The new exhibit at the museum',
    'A poetry reading at the small theatre',
    'Symphony night — pick a piece neither of you knows',
    'An old film at the indie cinema',
    'Live jazz at the basement bar',
    'A double feature, just because',
    'Bookstore date — pick each other a book under $20',
    'Visit a gallery opening with free wine',
    'Sit in on a free university lecture',
    'A play, then debrief over dessert',
  ],
  quiet: [
    'Make pasta from scratch and watch a film',
    'Backyard fire with a bottle of red',
    'Read aloud to each other for an hour',
    'Long bath, candles, slow conversation',
    'Board game tournament — best of three',
    'Just talk. No phones. Two hours.',
    'Photo album night — print the year so far',
    "Write each other a letter you'll open later",
    'Slow cook something all afternoon, eat it on the porch',
    "Inventory the dreams — what's next, what's now",
  ],
};

export function generateDateNightsPlan(
  months: number,
  vibes: DateNightVibe[],
  budget: DateNightBudget,
): Plan {
  const today = new Date();
  const events: PlanEvent[] = [];

  const pool = vibes.length === 0
    ? Object.values(ideasByVibe).flat()
    : vibes.flatMap((v) => ideasByVibe[v]);

  for (let m = 0; m < months; m++) {
    const date = addDays(today, 14 + m * 30);
    // Anchor on a Saturday-ish evening: roughly 7pm.
    date.setHours(19, 0, 0, 0);
    const end = new Date(date);
    end.setHours(22, 0, 0, 0);
    const idea = pool[m % pool.length];
    events.push({
      id: `date-${m}`,
      title: idea ?? 'Date night',
      startISO: date.toISOString(),
      endISO: end.toISOString(),
      category: 'family',
    });
  }

  const budgetCopy: Record<DateNightBudget, string> = {
    modest: 'Held under $50 each. The point is the time, not the receipt.',
    moderate: 'Comfortable middle: a real meal out, or a small experience.',
    splurge: 'You can lean into the bigger nights — the $150+ tier.',
    mix: "Some quiet nights, some splurges — let the season decide.",
  };

  return {
    reasoning: `${months} date nights, one a month, leaning toward ${
      vibes.length === 0 ? 'whatever feels right' : vibes.map((v) => v.toString()).join(' and ')
    }. ${budgetCopy[budget]} Drop into the second Saturday so the routine is easy to remember.`,
    events,
    totalCount: months,
    goalTitle: 'A date night every month',
    goalCadence: 'Once a month',
    category: 'family',
  };
}

// ---------- Custom ----------

export function generateCustomPlan(description: string): Plan {
  const today = new Date();
  const start = addDays(today, 5);
  start.setHours(10, 0, 0, 0);
  const end = new Date(start);
  end.setHours(11, 0, 0, 0);

  return {
    reasoning: `Saturday morning is the calmest window I see. An hour, the second weekend from now. If "${description}" turns out to need more, we can shape a longer plan after the first try.`,
    events: [
      {
        id: 'custom-0',
        title: description || 'Untitled commitment',
        startISO: start.toISOString(),
        endISO: end.toISOString(),
        category: 'personal',
      },
    ],
    totalCount: 1,
    goalTitle: description || 'Untitled commitment',
    goalCadence: 'One-time',
    category: 'personal',
  };
}

// ---------- Template metadata ----------

export type Template = {
  id: TemplateId;
  glyph: string;
  category: CategoryId;
  title: string;
  blurb: string;
};

export const templates: readonly Template[] = [
  {
    id: 'bible',
    glyph: '◆',
    category: 'faith',
    title: 'Read the Bible this year',
    blurb: 'A daily reading plan that lands in the morning.',
  },
  {
    id: 'friends',
    glyph: '■',
    category: 'friendship',
    title: 'Be more intentional with my friends',
    blurb: 'A rhythm with the people who matter.',
  },
  {
    id: 'dateNights',
    glyph: '●',
    category: 'family',
    title: 'Plan monthly date nights',
    blurb: 'Six months of evenings worth showing up for.',
  },
  {
    id: 'custom',
    glyph: '✚',
    category: 'personal',
    title: 'Something else',
    blurb: 'Describe a goal in your own words.',
  },
];

// Format helpers reused by the preview screen.
export function formatPlanDate(iso: string): string {
  return format(new Date(iso), 'EEE, MMM d');
}

export function formatPlanTime(iso: string): string {
  return format(new Date(iso), 'h:mm a');
}
