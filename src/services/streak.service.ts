import { prisma } from "@/lib/prisma";
import { startOfDay, isSameDay, isYesterday } from "@/lib/date";

export interface StreakResult {
  streak: number;
  maintained: boolean;
  reset: boolean;
}

/**
 * Updates the user's streak after a habit completion.
 *
 * - If the user already completed a habit today → no change.
 * - If the last completion was yesterday → increment streak.
 * - Otherwise → reset streak to 1.
 */
export async function updateStreak(userId: string): Promise<StreakResult> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { streak: true, lastCompletionDate: true },
  });

  const now = new Date();
  const { lastCompletionDate } = user;

  // Already completed something today — streak stays
  if (lastCompletionDate && isSameDay(lastCompletionDate, now)) {
    return { streak: user.streak, maintained: true, reset: false };
  }

  let newStreak: number;
  let reset = false;

  if (lastCompletionDate && isYesterday(lastCompletionDate, now)) {
    // Consecutive day → increment
    newStreak = user.streak + 1;
  } else {
    // Missed one or more days → reset
    newStreak = 1;
    reset = user.streak > 0;
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
 * Checks if a user's streak is at risk (no completions today).
 */
export async function isStreakAtRisk(userId: string): Promise<boolean> {
  const count = await getTodayCompletionCount(userId);
  return count === 0;
}
