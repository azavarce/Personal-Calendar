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
  /**
   * The URL fired when the user taps "Open in [appName]" on the event
   * detail. Universal links work cross-platform:
   *   https://wa.me/<phone>?text=<encoded msg>
   *   sms:<phone>?body=<encoded msg>
   *   tel:<phone>
   *   https://m.me/<username>
   *   https://my.bible.com/bible/<book>/<chapter>
   * Native deep-link schemes (whatsapp://, dayone://) also work on the
   * device that has the app installed.
   */
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
  /** Free-form location string. Tapping it from the event detail opens Maps. */
  location?: string;
  /** Spans the entire day (start = day start, end = day end). */
  isAllDay?: boolean;
  /** Only meaningful with isAllDay. Marks the day as *reserved* — a stronger
   * signal than a normal all-day event. Renders with a brand-color border
   * and a "Day blocked" label instead of "All day." */
  isBlock?: boolean;
  /**
   * Optional reflection — a short note the user added after the moment.
   * Rendered in italic Fraunces as a journal-style entry on the event
   * detail screen. Empty/absent means no reflection has been written.
   */
  reflection?: string;
  /**
   * ISO 8601 timestamp of when the reflection was last edited. Used to
   * render a quiet "Reflected on …" line above the reflection text.
   */
  reflectionUpdatedAt?: string;
};

export type Goal = {
  id: string;
  title: string;
  cadence: string; // human-readable, e.g. "6 days a week", "every Sunday"
  category: CategoryId;
  destination?: EventDestination;
};

// Build a Date from today + offsets. Used by the Quick Capture mock
// fallback (mockCaptureResponse), which runs only when the real Claude
// endpoint is unreachable.
const at = (hours: number, minutes: number, dayOffset = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
};

// Demo content has been cleared so the app boots into a truly blank
// Today / Calendar / Goals. Everything users add through Quick Capture or
// the Planner now lives in the store (AsyncStorage). These exports are
// kept as empty arrays so the existing call sites that spread them
// (`[...mockEventsToday, ...userEvents]`) continue to work unchanged.

export const mockEventsToday: CalendarEvent[] = [];

export const mockEventsThisWeek: CalendarEvent[] = [];

export const mockGoals: Goal[] = [];

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
