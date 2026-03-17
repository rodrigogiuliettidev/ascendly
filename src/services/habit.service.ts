import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/date";
import { awardXP, awardCoins } from "./xp.service";
import { updateStreak } from "./streak.service";
import { updateMissionsOnHabitComplete } from "./mission.service";
import { checkAndUnlockAchievements } from "./achievement.service";
import { notifyHabitCompleted } from "./notification.service";
import type {
  CreateHabitInput,
  UpdateHabitInput,
  HabitWithCompletion,
} from "@/types";

function parseReminderTime(reminderTime?: string): number | null | undefined {
  if (reminderTime === undefined) {
    return undefined;
  }

  if (reminderTime.trim() === "") {
    return null;
  }

  const parsed = Number(reminderTime);
  if (Number.isNaN(parsed)) {
    throw new Error("Invalid reminderTime");
  }

  return parsed;
}

/**
 * Creates a new habit for a user.
 */
export async function createHabit(userId: string, input: CreateHabitInput) {
  return prisma.habit.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      xpReward: input.xpReward ?? 25,
      coinReward: input.coinReward ?? 10,
      reminderTime: parseReminderTime(input.reminderTime),
    },
  });
}

/**
 * Updates an existing habit.
 */
export async function updateHabit(
  habitId: string,
  userId: string,
  input: UpdateHabitInput,
) {
  const reminderTime = parseReminderTime(input.reminderTime);

  return prisma.habit.update({
    where: { id: habitId, userId },
    data: {
      ...input,
      reminderTime,
    },
  });
}

/**
 * Deletes (soft-deactivates) a habit.
 */
export async function deleteHabit(habitId: string, userId: string) {
  return prisma.habit.update({
    where: { id: habitId, userId },
    data: { isActive: false },
  });
}

/**
 * Returns all active habits for a user, with today's completion status.
 */
export async function getUserHabitsToday(
  userId: string,
): Promise<HabitWithCompletion[]> {
  const todayStart = startOfDay();

  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true },
    include: {
      completions: {
        where: { completionDate: todayStart },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return habits.map((habit) => ({
    ...habit,
    completedToday: habit.completions.length > 0,
    completions: undefined as never,
  }));
}

/**
 * Completes a habit for today. Orchestrates all side-effects:
 * XP, coins, streak, missions, achievements.
 */
export async function completeHabit(habitId: string, userId: string) {
  const habit = await prisma.habit.findUniqueOrThrow({
    where: { id: habitId, userId },
  });

  // Check if already completed today
  const todayStart = startOfDay();
  const existing = await prisma.habitCompletion.findFirst({
    where: {
      habitId,
      userId,
      completionDate: todayStart,
    },
  });

  if (existing) {
    throw new Error("Habit already completed today");
  }

  // Record completion
  const completion = await prisma.habitCompletion.create({
    data: {
      habitId,
      userId,
      completionDate: todayStart,
    },
  });

  console.log(`[HabitService] ✅ Habit "${habit.title}" completed by user ${userId}`);

  // Award XP & coins
  const xpResult = await awardXP(userId, habit.xpReward);
  const coins = await awardCoins(userId, habit.coinReward);

  console.log(
    `[HabitService] Awarded ${habit.xpReward} XP (total: ${xpResult.xp}, level: ${xpResult.level}` +
    `${xpResult.leveledUp ? " LEVEL UP!" : ""}) and ${habit.coinReward} coins (total: ${coins})`
  );

  // Update streak
  const streakResult = await updateStreak(userId);

  console.log(`[HabitService] Streak: ${streakResult.streak}${streakResult.reset ? " (reset)" : ""}`);

  // Update daily missions
  await updateMissionsOnHabitComplete(userId, habit.xpReward);

  // Check achievements
  const newAchievements = await checkAndUnlockAchievements(userId);

  // Send habit completed notification (async, don't await)
  notifyHabitCompleted(userId, habit.title, habit.xpReward).catch(console.error);

  return {
    completion,
    xp: xpResult.xp,
    level: xpResult.level,
    leveledUp: xpResult.leveledUp,
    coins,
    streak: streakResult.streak,
    newAchievements,
  };
}

/**
 * Returns a single habit by ID (must belong to the user).
 */
export async function getHabitById(habitId: string, userId: string) {
  return prisma.habit.findUnique({
    where: { id: habitId, userId },
  });
}
