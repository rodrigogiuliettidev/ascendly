import { prisma } from "@/lib/prisma";
import {
  startOfDay,
  getDayOfWeekInAppTimeZone,
  getLogicalDateString,
} from "@/lib/date";
import { hasScheduledDay, dayIndexToKey } from "@/lib/habit-schedule";

export interface StreakResult {
  streak: number;
  maintained: boolean;
  reset: boolean;
}

/**
 * Recalculates the user's streak from real completion data.
 *
 * Rule:
 * - A day counts only if all scheduled habits for that day were completed.
 * - If a scheduled day is missed, streak breaks immediately.
 * - Days with no scheduled habits are ignored.
 */
export async function updateStreak(userId: string): Promise<StreakResult> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayString = getLogicalDateString(now);

  const [user, activeHabits, latestCompletion] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { streak: true },
    }),
    prisma.habit.findMany({
      where: { userId, isActive: true },
      select: { id: true, schedule: true, daysOfWeek: true, createdAt: true },
    }),
    prisma.habitCompletion.findFirst({
      where: { userId },
      orderBy: { completionDate: "desc" },
      select: { completedAt: true },
    }),
  ]);

  if (activeHabits.length === 0) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        streak: 0,
        lastCompletionDate: latestCompletion?.completedAt ?? null,
      },
    });
    return { streak: 0, maintained: false, reset: user.streak > 0 };
  }

  const MAX_LOOKBACK_DAYS = 365;
  const lookbackStart = new Date(
    todayStart.getTime() - MAX_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
  );
  const completions = await prisma.habitCompletion.findMany({
    where: {
      userId,
      habitId: { in: activeHabits.map((h) => h.id) },
      completionDate: {
        gte: lookbackStart,
        lte: todayStart,
      },
    },
    select: { habitId: true, completionDate: true },
  });

  const completionMap = new Map<string, Set<string>>();
  for (const completion of completions) {
    const day = getLogicalDateString(completion.completionDate);
    const set = completionMap.get(day) ?? new Set<string>();
    set.add(completion.habitId);
    completionMap.set(day, set);
  }

  console.log(
    `[StreakService] Recalculating streak user=${userId} today=${todayString} ` +
      `habits=${activeHabits.length} completions=${completions.length}`,
  );

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const totalDays = MAX_LOOKBACK_DAYS + 1;

  let newStreak = 0;
  let encounteredScheduledDay = false;
  let forcedResetFromYesterdayMiss = false;

  for (let offset = 0; offset < totalDays; offset++) {
    const dayDate = new Date(todayStart.getTime() - offset * MS_PER_DAY);
    const dayString = getLogicalDateString(dayDate);
    const dayOfWeek = getDayOfWeekInAppTimeZone(dayDate);

    const scheduledHabits = activeHabits.filter(
      (habit) =>
        hasScheduledDay(habit.schedule, habit.daysOfWeek, dayOfWeek) &&
        getLogicalDateString(habit.createdAt) <= dayString,
    );

    if (scheduledHabits.length === 0) {
      continue;
    }

    encounteredScheduledDay = true;

    const completedSet = completionMap.get(dayString) ?? new Set<string>();
    const allScheduledCompleted = scheduledHabits.every((habit) =>
      completedSet.has(habit.id),
    );

    console.log(
      `[StreakService] Day=${dayString} scheduled=${scheduledHabits.length} ` +
        `completed=${completedSet.size} allDone=${allScheduledCompleted}`,
    );

    if (!allScheduledCompleted) {
      if (offset === 1 && newStreak > 0) {
        // Product rule: if yesterday was incomplete, today's streak must be 0.
        forcedResetFromYesterdayMiss = true;
      }
      break;
    }

    newStreak++;
  }

  if (forcedResetFromYesterdayMiss) {
    newStreak = 0;
  }

  // If user has scheduled habits but the nearest scheduled day is incomplete,
  // streak is guaranteed to be 0 (handled above). This log highlights that case.
  if (encounteredScheduledDay && newStreak === 0) {
    console.log(
      `[StreakService] user=${userId} streak reset to 0 due to missed scheduled day`,
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      streak: newStreak,
      lastCompletionDate: latestCompletion?.completedAt ?? null,
    },
  });

  return {
    streak: newStreak,
    maintained: newStreak > 0,
    reset: newStreak < user.streak,
  };
}

/**
 * Returns today's completion count for a user.
 */
export async function getTodayCompletionCount(userId: string): Promise<number> {
  const todayStart = startOfDay();
  return prisma.habitCompletion.count({
    where: {
      userId,
      completionDate: todayStart,
    },
  });
}

/**
 * Checks if a user's streak is at risk (not all habits completed today).
 */
export async function isStreakAtRisk(userId: string): Promise<boolean> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const dayOfWeek = getDayOfWeekInAppTimeZone(now);
  const dayKey = dayIndexToKey(dayOfWeek);

  // Get scheduled habits for today
  const scheduledCount = await prisma.habit.count({
    where: {
      userId,
      isActive: true,
      OR: [
        { schedule: { has: dayKey } },
        { daysOfWeek: { has: dayOfWeek } },
      ],
    },
  });

  // Get completions for today
  const completedCount = await prisma.habitCompletion.count({
    where: {
      userId,
      completionDate: todayStart,
    },
  });

  // At risk if there are scheduled habits that aren't completed
  return scheduledCount > completedCount;
}
