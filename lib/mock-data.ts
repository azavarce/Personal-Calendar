import type { CategoryId } from '@/theme';

/**
 * Mock data for v0. Realistic content, written in the brand voice — never
 * "Crush it / You got this / Streak / On fire."
 *
 * Each event carries a `destination` describing where tap should hand off to
 * on real builds. v0 only displays the destination as a label on the event
 * detail sheet (no real deep-linking yet).
 */

export type EventDestination = {
  /** App name shown on the detail sheet, e.g. "Day One" */
  appName: string;
  /** URL scheme the real build will fire (kept here for shape; not used in v0). */
  url?: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  start: string; // ISO 8601 — anchored to "today" via mockToday() at runtime
  end: string;
  category: CategoryId;
  destination?: EventDestination;
  notes?: string;
};

export type Goal = {
  id: string;
  title: string;
  cadence: string; // human-readable, e.g. "6 days a week", "every Sunday"
  category: CategoryId;
  destination?: EventDestination;
};

// Build a Date from today + offsets.
const at = (hours: number, minutes: number, dayOffset = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

export const mockEventsToday: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Read Proverbs 3',
    start: at(6, 30),
    end: at(7, 0),
    category: 'faith',
    destination: { appName: 'YouVersion' },
  },
  {
    id: 'e2',
    title: 'Morning pages',
    start: at(7, 0),
    end: at(7, 20),
    category: 'personal',
    destination: { appName: 'Day One' },
  },
  {
    id: 'e3',
    title: 'At the office',
    start: at(9, 0),
    end: at(17, 0),
    category: 'personal',
    notes: 'Work block. Detail lives in the work calendar.',
  },
  {
    id: 'e4',
    title: 'Call Mom',
    start: at(12, 30),
    end: at(12, 45),
    category: 'family',
    destination: { appName: 'Phone' },
  },
  {
    id: 'e5',
    title: 'Push day',
    start: at(17, 30),
    end: at(18, 30),
    category: 'health',
    destination: { appName: 'Apple Fitness' },
  },
  {
    id: 'e6',
    title: 'Read to the kids',
    start: at(19, 30),
    end: at(20, 0),
    category: 'family',
  },
  {
    id: 'e7',
    title: 'Side project — 30 min',
    start: at(21, 0),
    end: at(21, 30),
    category: 'learning',
    destination: { appName: 'Linear' },
  },
];

export const mockEventsThisWeek: CalendarEvent[] = [
  // Tomorrow
  {
    id: 'w1',
    title: 'Coffee with David',
    start: at(8, 0, 1),
    end: at(9, 0, 1),
    category: 'friendship',
  },
  {
    id: 'w2',
    title: 'Pull day',
    start: at(17, 30, 1),
    end: at(18, 30, 1),
    category: 'health',
    destination: { appName: 'Apple Fitness' },
  },
  // +2 days
  {
    id: 'w3',
    title: 'Brainstorm a date for my wife',
    start: at(13, 0, 2),
    end: at(13, 30, 2),
    category: 'family',
  },
  // +3 days
  {
    id: 'w4',
    title: 'Read 10 pages — Atomic Habits',
    start: at(21, 0, 3),
    end: at(21, 30, 3),
    category: 'learning',
  },
  // +4 days
  {
    id: 'w5',
    title: 'Text three friends',
    start: at(12, 30, 4),
    end: at(12, 45, 4),
    category: 'friendship',
  },
  // +5 days (Saturday)
  {
    id: 'w6',
    title: 'Date night',
    start: at(19, 0, 5),
    end: at(22, 0, 5),
    category: 'family',
  },
  // +6 days (Sunday)
  {
    id: 'w7',
    title: 'Sunday service',
    start: at(10, 0, 6),
    end: at(11, 30, 6),
    category: 'faith',
  },
];

export const mockGoals: Goal[] = [
  {
    id: 'g1',
    title: 'Read the Bible',
    cadence: '6 mornings a week',
    category: 'faith',
    destination: { appName: 'YouVersion' },
  },
  {
    id: 'g2',
    title: 'Sunday service',
    cadence: 'Every Sunday',
    category: 'faith',
  },
  {
    id: 'g3',
    title: 'Lift',
    cadence: '4 times a week',
    category: 'health',
    destination: { appName: 'Apple Fitness' },
  },
  {
    id: 'g4',
    title: 'Date night with my wife',
    cadence: 'Every Friday',
    category: 'family',
  },
  {
    id: 'g5',
    title: 'Call Mom',
    cadence: 'Every Sunday',
    category: 'family',
  },
  {
    id: 'g6',
    title: 'Reach out to one friend',
    cadence: 'Once a week',
    category: 'friendship',
  },
  {
    id: 'g7',
    title: 'Side project block',
    cadence: '30 minutes daily',
    category: 'learning',
    destination: { appName: 'Linear' },
  },
  {
    id: 'g8',
    title: 'Read 10 pages',
    cadence: 'Most evenings',
    category: 'learning',
  },
];

/** Mocked AI response for the Quick Capture sheet. */
export type CaptureResponse = {
  reasoning: string;
  proposedTitle: string;
  proposedStart: string;
  proposedEnd: string;
  category: CategoryId;
  /** True if the AI shifted the slot away from a conflict. */
  shifted?: boolean;
  /** Title of the conflicting event the AI moved past, for the reasoning. */
  conflictWith?: string;
};

import { findFreeSlot } from '@/lib/conflict';

type Suggestion = {
  reasoning: string;
  start: string;
  end: string;
  category: CategoryId;
};

/**
 * Mocked AI suggester. Looks at keywords in the input and returns a
 * varied, brand-voiced response. Real Claude API call drops in here
 * later; same shape, no UI change.
 *
 * If the proposed slot conflicts with an existing event, shifts forward
 * to the next free 30-minute window and notes the shift in the reasoning.
 */
export const mockCaptureResponse = (
  input: string,
  existingEvents: CalendarEvent[] = [],
): CaptureResponse => {
  const lower = input.toLowerCase();

  const isFamily = /wife|husband|kids|kid|mom|dad|family|son|daughter/.test(lower);
  const isFriend = /friend|gabriel|jora|ramiro|guarino|venneth|juan|manoel/.test(lower);
  const isHealth = /gym|run|swim|lift|workout|train|stretch|yoga/.test(lower);
  const isFaith = /bible|pray|prayer|church|worship|scripture/.test(lower);
  const isLearning = /book|read|course|learn|practice|study|side project|project/.test(lower);

  let pick: Suggestion;

  if (isFamily) {
    pick = {
      reasoning:
        "Looking at your week, Saturday afternoon is the most generous window — neither of you has anything queued. Two hours is a comfortable shape.",
      start: at(15, 0, 5),
      end: at(17, 0, 5),
      category: 'family',
    };
  } else if (isFriend) {
    pick = {
      reasoning:
        "Lunch hour mid-week tends to be the easiest moment to actually press send. Thirty minutes is enough.",
      start: at(12, 30, 2),
      end: at(13, 0, 2),
      category: 'friendship',
    };
  } else if (isHealth) {
    pick = {
      reasoning:
        "Late afternoon, three days from now — you'll have momentum from the start of the week and time to recover before Sunday.",
      start: at(17, 30, 3),
      end: at(18, 30, 3),
      category: 'health',
    };
  } else if (isFaith) {
    pick = {
      reasoning:
        "Tomorrow morning. Before the day asks anything of you. Thirty minutes feels right for something this old.",
      start: at(6, 30, 1),
      end: at(7, 0, 1),
      category: 'faith',
    };
  } else if (isLearning) {
    pick = {
      reasoning:
        "Wednesday evening, after the workday closes. Forty-five minutes — long enough to make progress, short enough to come back to.",
      start: at(20, 30, 2),
      end: at(21, 15, 2),
      category: 'learning',
    };
  } else {
    pick = {
      reasoning:
        'Saturday morning is the calmest window I see. An hour, the second weekend from now.',
      start: at(10, 0, 5),
      end: at(11, 0, 5),
      category: 'personal',
    };
  }

  // Run the proposed slot through the conflict checker. If shifted, append a
  // sentence to the reasoning so the user sees the AI thought about it.
  const desiredStart = new Date(pick.start);
  const desiredEnd = new Date(pick.end);
  const { slot, shifted, conflictWith } = findFreeSlot(
    { start: desiredStart, end: desiredEnd },
    existingEvents,
  );

  let reasoning = pick.reasoning;
  if (shifted && conflictWith) {
    reasoning = `${reasoning} The window I had in mind overlapped "${conflictWith.title}", so I nudged this one forward a bit to give it room.`;
  }

  return {
    reasoning,
    proposedTitle: input.length > 0 ? input : 'Untitled',
    proposedStart: slot.start.toISOString(),
    proposedEnd: slot.end.toISOString(),
    category: pick.category,
    shifted,
    conflictWith: conflictWith?.title,
  };
};
