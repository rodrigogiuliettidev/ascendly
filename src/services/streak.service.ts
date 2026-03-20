import { prisma } from "@/lib/prisma";
import {
  startOfDay,
  isSameDay,
  isYesterday,
  getDayOfWeekInAppTimeZone,
  getLogicalDateString,
} from "@/lib/date";

export interface StreakResult {
  streak: number;
  maintained: boolean;
  reset: boolean;
}

/**
 * Updates the user's streak after a habit completion.
 *
 * IMPORTANT: The streak only maintains/increments if the user
 * completed ALL scheduled habits for that day.
 *
 * - If the user already completed a habit today → check if all scheduled done
 * - If the last completion was yesterday → check if all were completed yesterday, then increment
 * - Otherwise → reset streak to 1 (or 0 if not all habits are done today)
 */
export async function updateStreak(userId: string): Promise<StreakResult> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const dayOfWeek = getDayOfWeekInAppTimeZone(now);
  const todayString = getLogicalDateString(now);

  console.log(
    `[StreakService] updateStreak: userId=${userId}, ` +
    `today=${todayString}, dayOfWeek=${dayOfWeek}`,
  );

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { streak: true, lastCompletionDate: true },
  });

  // Get scheduled habits for today
  const scheduledHabits = await prisma.habit.findMany({
    where: {
      userId,
      isActive: true,
      daysOfWeek: { has: dayOfWeek },
    },
    select: { id: true, title: true },
  });

  // Get completions for today
  const todayCompletions = await prisma.habitCompletion.findMany({
    where: {
      userId,
      completionDate: todayStart,
    },
    select: { habitId: true },
  });

  const scheduledIds = new Set(scheduledHabits.map((h) => h.id));
  const completedIds = new Set(todayCompletions.map((c) => c.habitId));
  const allScheduledCompleted =
    scheduledHabits.length > 0 &&
    scheduledHabits.every((h) => completedIds.has(h.id));

  console.log(
    `[StreakService] Today: ${scheduledHabits.length} scheduled, ` +
    `${todayCompletions.length} completed, allDone=${allScheduledCompleted}`,
  );

  const { lastCompletionDate } = user;

  // If user already completed something today, just update lastCompletionDate
  // The streak value depends on whether ALL habits are done
  if (lastCompletionDate && isSameDay(lastCompletionDate, now)) {
    // Already completed something today - streak already counted
    // Just verify it should still be valid
    console.log(`[StreakService] Already completed today, streak=${user.streak}`);
    return { streak: user.streak, maintained: true, reset: false };
  }

  // First completion of the day
  let newStreak: number;
  let reset = false;

  if (lastCompletionDate && isYesterday(lastCompletionDate, now)) {
    // Consecutive day - increment streak
    newStreak = user.streak + 1;
    console.log(
      `[StreakService] Consecutive day! Streak ${user.streak} → ${newStreak}`,
    );
  } else {
    // Missed one or more days - reset
    newStreak = 1;
    reset = user.streak > 0;
    console.log(
      `[StreakService] Streak reset! ${user.streak} → 1 ` +
      `(lastCompletion=${lastCompletionDate?.toISOString() || "none"})`,
    );
  }

  await prisma.user.update({
    where: { id: userId },
    data: { streak: newStreak, lastCompletionDate: now },
  });

  return { streak: newStreak, maintained: true, reset };
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

  // Get scheduled habits for today
  const scheduledCount = await prisma.habit.count({
    where: {
      userId,
      isActive: true,
      daysOfWeek: { has: dayOfWeek },
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
