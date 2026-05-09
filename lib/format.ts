import { format, isToday, isTomorrow, isYesterday } from 'date-fns';

/** "6:30 AM" / "5:30 PM" with tabular numerals applied at the text layer. */
export const formatTime = (iso: string): string => {
  return format(new Date(iso), 'h:mm a');
};

/** "30 min" / "1 hr 30 min" */
export const formatDuration = (startIso: string, endIso: string): string => {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  const totalMin = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMin / 60);
  const minutes = totalMin % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
};

/** "Today" / "Tomorrow" / "Yesterday" / "Friday, May 9" */
export const formatRelativeDate = (iso: string): string => {
  const d = new Date(iso);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'EEEE, MMMM d');
};

/** "Tuesday, May 5" */
export const formatLongDate = (iso: string): string =>
  format(new Date(iso), 'EEEE, MMMM d');

/** "May 2026" */
export const formatMonthYear = (iso: string): string =>
  format(new Date(iso), 'MMMM yyyy');

export const isPast = (iso: string): boolean => new Date(iso) < new Date();

export const isCurrent = (startIso: string, endIso: string): boolean => {
  const now = Date.now();
  return new Date(startIso).getTime() <= now && now < new Date(endIso).getTime();
};
