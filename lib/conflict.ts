import type { CalendarEvent } from '@/lib/mock-data';

export type Slot = { start: Date; end: Date };

/**
 * True if slot a and slot b overlap on the timeline.
 * Half-open intervals: [start, end). Two slots that touch but don't overlap
 * (one ends exactly when the next begins) are NOT a conflict.
 */
export function overlaps(
  a: { start: Date; end: Date },
  b: { start: Date; end: Date },
): boolean {
  return a.start < b.end && b.start < a.end;
}

/**
 * Given a desired time window and the existing events, return either the
 * desired slot (if free) or the next free window of the same duration shifted
 * forward. When the blocking conflict is a Block event (isAllDay + isBlock),
 * the cursor jumps past the entire block instead of crawling 30 minutes at a
 * time — so the AI never proposes a slot inside a reserved day.
 *
 * Default search window is 7 days. If nothing free can be found within
 * `maxShiftMin`, returns the desired window with `shifted=false` and the
 * conflict event noted — the caller can surface it.
 */
export function findFreeSlot(
  desired: Slot,
  events: CalendarEvent[],
  stepMin = 30,
  maxShiftMin = 60 * 24 * 7,
): { slot: Slot; shifted: boolean; conflictWith?: CalendarEvent } {
  const duration = desired.end.getTime() - desired.start.getTime();

  const findConflict = (slot: Slot): CalendarEvent | undefined => {
    return events.find((e) => {
      const eSlot = { start: new Date(e.start), end: new Date(e.end) };
      return overlaps(slot, eSlot);
    });
  };

  const firstConflict = findConflict(desired);
  if (!firstConflict) {
    return { slot: desired, shifted: false };
  }

  const desiredEndTime =
    desired.start.getTime() + maxShiftMin * 60000;
  let cursor = new Date(desired.start);

  // Keep walking forward until we find an open window or exhaust the search
  // budget. Block events get jumped past wholesale.
  while (cursor.getTime() <= desiredEndTime) {
    const trial: Slot = {
      start: cursor,
      end: new Date(cursor.getTime() + duration),
    };
    const c = findConflict(trial);
    if (!c) {
      const shifted = cursor.getTime() !== desired.start.getTime();
      return {
        slot: trial,
        shifted,
        conflictWith: shifted ? firstConflict : undefined,
      };
    }

    if (c.isBlock) {
      // Skip past the entire blocked day.
      cursor = new Date(new Date(c.end).getTime() + 1000);
    } else {
      cursor = new Date(cursor.getTime() + stepMin * 60000);
    }
  }

  // Unable to find a free slot in the allowed window; return original so the
  // caller can either surface a warning or try a different anchor.
  return { slot: desired, shifted: false, conflictWith: firstConflict };
}
