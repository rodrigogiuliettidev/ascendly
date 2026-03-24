/**
 * Date utilities for Ascendly
 *
 * All dates in this app are handled in a configurable APP_TIMEZONE.
 * The "logical day" is determined by the user's timezone, NOT UTC.
 *
 * Key functions:
 * - getLogicalDateString(date) → "YYYY-MM-DD" in app timezone
 * - startOfDay(date) → UTC Date representing midnight in app timezone
 * - getDayOfWeekInAppTimeZone(date) → 0-6 (Sun-Sat) in app timezone
 */

const APP_TIMEZONE = process.env.APP_TIMEZONE || "America/Sao_Paulo";

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: string;
  weekdayIndex: number;
};

/**
 * Extracts date/time parts in the specified timezone.
 */
function getZonedParts(
  date: Date,
  timeZone: string = APP_TIMEZONE,
): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    weekday: "short",
  });

  const parts = formatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "0";

  const weekday = read("weekday");

  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    hour: Number(read("hour")),
    minute: Number(read("minute")),
    second: Number(read("second")),
    weekday,
    weekdayIndex: getWeekdayIndexFromShortName(weekday),
  };
}

function getWeekdayIndexFromShortName(weekday: string): number {
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[weekday] ?? 0;
}

function getTimeZoneOffsetMs(
  date: Date,
  timeZone: string = APP_TIMEZONE,
): number {
  const p = getZonedParts(date, timeZone);
  const asUtc = Date.UTC(
    p.year,
    p.month - 1,
    p.day,
    p.hour,
    p.minute,
    p.second,
  );
  return asUtc - date.getTime();
}

function zonedMidnightToUtc(
  year: number,
  month: number,
  day: number,
  timeZone: string = APP_TIMEZONE,
): Date {
  const utcGuess = Date.UTC(year, month - 1, day, 0, 0, 0, 0);
  const offset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
  return new Date(utcGuess - offset);
}

/**
 * Returns the "logical date string" in YYYY-MM-DD format for the app timezone.
 * This is the PRIMARY way to identify which day a completion belongs to.
 *
 * Example: If it's 2:00 AM on Thursday in São Paulo,
 * this returns "2024-03-21" (Thursday), NOT Wednesday.
 */
export function getLogicalDateString(date: Date = new Date()): string {
  const p = getZonedParts(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/**
 * Alias for getLogicalDateString for backwards compatibility.
 */
export function formatDateInAppTimeZone(date: Date): string {
  return getLogicalDateString(date);
}

/**
 * Returns the start of day (midnight) in APP_TIMEZONE as a UTC Date.
 * Use this for database queries when filtering by completionDate.
 */
export function startOfDay(date: Date = new Date()): Date {
  const p = getZonedParts(date);
  const result = zonedMidnightToUtc(p.year, p.month, p.day);
  console.log(
    `[Date] startOfDay: input=${date.toISOString()}, ` +
      `appTZ=${p.year}-${p.month}-${p.day} (${p.weekday}), ` +
      `result=${result.toISOString()}`,
  );
  return result;
}

/**
 * Returns the start of a specific date string (YYYY-MM-DD) in APP_TIMEZONE.
 */
export function startOfDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return zonedMidnightToUtc(year, month, day);
}

/**
 * Returns the end of day in APP_TIMEZONE (as a UTC Date).
 */
export function endOfDay(date: Date = new Date()): Date {
  const start = startOfDay(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/**
 * Returns Sunday 00:00 of the week in APP_TIMEZONE (as a UTC Date).
 */
export function getWeekStart(date: Date = new Date()): Date {
  const start = startOfDay(date);
  const dayIndex = getZonedParts(start).weekdayIndex;
  const diff = -dayIndex; // Go back to Sunday
  return new Date(start.getTime() + diff * 24 * 60 * 60 * 1000);
}

/**
 * Returns Sunday 00:00 UTC of the week containing `date` (legacy ranking bucket).
 */
export function getWeekStartUtc(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  const diff = -day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

/**
 * Returns day of week in APP_TIMEZONE using JS convention (Sun=0 ... Sat=6).
 * Use this to determine which habits are scheduled for today.
 */
export function getDayOfWeekInAppTimeZone(date: Date = new Date()): number {
  const result = getZonedParts(date).weekdayIndex;
  console.log(
    `[Date] getDayOfWeekInAppTimeZone: input=${date.toISOString()}, ` +
      `dayOfWeek=${result} (${["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][result]})`,
  );
  return result;
}

/**
 * Checks whether two dates fall on the same APP_TIMEZONE calendar day.
 */
export function isSameDay(a: Date, b: Date): boolean {
  const pa = getZonedParts(a);
  const pb = getZonedParts(b);
  return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day;
}

/**
 * Checks whether `a` is exactly 1 calendar day before `b` in APP_TIMEZONE.
 */
export function isYesterday(a: Date, b: Date): boolean {
  const prev = new Date(b.getTime() - 24 * 60 * 60 * 1000);
  return isSameDay(a, prev);
}

/**
 * Get the date N days ago from now, as a midnight Date in APP_TIMEZONE.
 */
export function getDaysAgo(days: number): Date {
  const now = new Date();
  const p = getZonedParts(now);
  const target = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  const tp = getZonedParts(target);
  return zonedMidnightToUtc(tp.year, tp.month, tp.day);
}

/**
 * Returns an array of date strings from startDate to endDate (inclusive).
 */
export function getDateRange(startDate: Date, endDate: Date): string[] {
  const dates: string[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    dates.push(getLogicalDateString(current));
    current.setTime(current.getTime() + 24 * 60 * 60 * 1000);
  }

  return dates;
}
