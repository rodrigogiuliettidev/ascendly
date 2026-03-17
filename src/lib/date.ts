/** Returns the start of today (midnight) in UTC */
export function startOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Returns the end of today (23:59:59.999) in UTC */
export function endOfDay(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/** Returns the Monday 00:00 UTC of the week containing `date` */
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day; // Monday = 1
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

/** Checks whether two dates fall on the same UTC calendar day */
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/** Checks whether `a` is exactly 1 calendar day before `b` (UTC) */
export function isYesterday(a: Date, b: Date): boolean {
  const prev = new Date(b);
  prev.setUTCDate(prev.getUTCDate() - 1);
  return isSameDay(a, prev);
}
