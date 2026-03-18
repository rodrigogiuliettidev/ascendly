const APP_TIMEZONE = process.env.APP_TIMEZONE || "America/Sao_Paulo";

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  weekday: string;
};

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

  return {
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    hour: Number(read("hour")),
    minute: Number(read("minute")),
    second: Number(read("second")),
    weekday: read("weekday"),
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

/** Returns the start of day in APP_TIMEZONE (as a UTC Date) */
export function startOfDay(date: Date = new Date()): Date {
  const p = getZonedParts(date);
  return zonedMidnightToUtc(p.year, p.month, p.day);
}

/** Returns the end of day in APP_TIMEZONE (as a UTC Date) */
export function endOfDay(date: Date = new Date()): Date {
  const start = startOfDay(date);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/** Returns Monday 00:00 of the week in APP_TIMEZONE (as a UTC Date) */
export function getWeekStart(date: Date = new Date()): Date {
  const start = startOfDay(date);
  const dayIndex = getWeekdayIndexFromShortName(getZonedParts(start).weekday);
  // Week starts on Sunday (0) across the app.
  const diff = -dayIndex;
  return new Date(start.getTime() + diff * 24 * 60 * 60 * 1000);
}

/** Returns Sunday 00:00 UTC of the week containing `date` (legacy ranking bucket). */
export function getWeekStartUtc(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  const diff = -day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}

/** Returns day of week in APP_TIMEZONE using JS convention (Sun=0 ... Sat=6). */
export function getDayOfWeekInAppTimeZone(date: Date = new Date()): number {
  return getWeekdayIndexFromShortName(getZonedParts(date).weekday);
}

/** Formats date as YYYY-MM-DD in APP_TIMEZONE. */
export function formatDateInAppTimeZone(date: Date): string {
  const p = getZonedParts(date);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

/** Checks whether two dates fall on the same APP_TIMEZONE calendar day */
export function isSameDay(a: Date, b: Date): boolean {
  const pa = getZonedParts(a);
  const pb = getZonedParts(b);
  return pa.year === pb.year && pa.month === pb.month && pa.day === pb.day;
}

/** Checks whether `a` is exactly 1 calendar day before `b` in APP_TIMEZONE */
export function isYesterday(a: Date, b: Date): boolean {
  const prev = new Date(b.getTime() - 24 * 60 * 60 * 1000);
  return isSameDay(a, prev);
}
