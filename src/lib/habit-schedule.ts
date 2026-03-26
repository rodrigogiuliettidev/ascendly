export const DAY_KEYS = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
] as const;

export type DayKey = (typeof DAY_KEYS)[number];

export const DEFAULT_WEEK_SCHEDULE: DayKey[] = [...DAY_KEYS];

export function dayIndexToKey(day: number): DayKey {
  return DAY_KEYS[day] ?? "sun";
}

export function normalizeSchedule(input?: string[] | null): DayKey[] {
  if (!input || input.length === 0) {
    return [...DEFAULT_WEEK_SCHEDULE];
  }

  const normalized = Array.from(
    new Set(
      input
        .map((d) => d.trim().toLowerCase())
        .filter((d): d is DayKey => DAY_KEYS.includes(d as DayKey)),
    ),
  );

  return normalized.length > 0 ? normalized : [...DEFAULT_WEEK_SCHEDULE];
}

export function scheduleToDaysOfWeek(schedule: string[]): number[] {
  const daySet = new Set<number>();
  for (const key of schedule) {
    const idx = DAY_KEYS.indexOf(key as DayKey);
    if (idx >= 0) daySet.add(idx);
  }
  return Array.from(daySet).sort((a, b) => a - b);
}

export function resolveHabitSchedule(
  schedule: string[] | null | undefined,
  daysOfWeek: number[] | null | undefined,
): DayKey[] {
  if (schedule && schedule.length > 0) return normalizeSchedule(schedule);
  if (daysOfWeek && daysOfWeek.length > 0) {
    return normalizeSchedule(daysOfWeek.map((d) => dayIndexToKey(d)));
  }
  return [...DEFAULT_WEEK_SCHEDULE];
}

export function hasScheduledDay(
  schedule: string[] | null | undefined,
  daysOfWeek: number[] | null | undefined,
  dayIndex: number,
): boolean {
  return resolveHabitSchedule(schedule, daysOfWeek).includes(dayIndexToKey(dayIndex));
}
