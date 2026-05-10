import { addMinutes } from 'date-fns';
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
 * forward in `stepMin` increments. If nothing free can be found within
 * `maxShiftMin`, returns the desired window with `shifted=false` and the
 * conflict event noted — the caller can decide to surface the conflict.
 */
export function findFreeSlot(
  desired: Slot,
  events: CalendarEvent[],
  stepMin = 30,
  maxShiftMin = 240,
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

  // Try walking forward in stepMin increments until a free window opens.
  for (let shift = stepMin; shift <= maxShiftMin; shift += stepMin) {
    const newStart = addMinutes(desired.start, shift);
    const newEnd = new Date(newStart.getTime() + duration);
    const slot = { start: newStart, end: newEnd };
    if (!findConflict(slot)) {
      return { slot, shifted: true, conflictWith: firstConflict };
    }
  }

  // Unable to find a free slot in the allowed window; return original so the
  // caller can either surface a warning or try a different anchor.
  return { slot: desired, shifted: false, conflictWith: firstConflict };
}
