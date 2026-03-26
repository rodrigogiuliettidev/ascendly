import { prisma } from "@/lib/prisma";
import {
  startOfDay,
  getWeekStart,
  getDayOfWeekInAppTimeZone,
  getLogicalDateString,
} from "@/lib/date";
import {
  dayIndexToKey,
  normalizeSchedule,
  scheduleToDaysOfWeek,
  resolveHabitSchedule,
} from "@/lib/habit-schedule";
import { awardXP, awardCoins } from "./xp.service";
import { updateStreak } from "./streak.service";
import { updateMissionsOnHabitComplete } from "./mission.service";
import { checkAndUnlockAchievements } from "./achievement.service";
import { notifyHabitCompleted } from "./notification.service";
import { updateChallengeProgress } from "./user-challenge.service";
import type {
  CreateHabitInput,
  UpdateHabitInput,
  HabitWithCompletion,
  WeeklyProgress,
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
  const schedule = normalizeSchedule(
    input.schedule ??
      (input.daysOfWeek ? input.daysOfWeek.map((d) => dayIndexToKey(d)) : []),
  );

  return prisma.habit.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      xpReward: input.xpReward ?? 25,
      coinReward: input.coinReward ?? 10,
      penaltyXp: input.penaltyXp ?? 5,
      reminderTime: parseReminderTime(input.reminderTime),
      schedule,
      daysOfWeek: scheduleToDaysOfWeek(schedule),
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
  const { reminderTime: _, ...rest } = input;
  const existingHabit = await prisma.habit.findUniqueOrThrow({
    where: { id: habitId, userId },
    select: { schedule: true, daysOfWeek: true },
  });

  const shouldUpdateSchedule =
    input.schedule !== undefined || input.daysOfWeek !== undefined;

  const schedule = shouldUpdateSchedule
    ? normalizeSchedule(
        input.schedule ??
          (input.daysOfWeek ? input.daysOfWeek.map((d) => dayIndexToKey(d)) : []),
      )
    : resolveHabitSchedule(existingHabit.schedule, existingHabit.daysOfWeek);

  return prisma.habit.update({
    where: { id: habitId, userId },
    data: {
      ...rest,
      reminderTime,
      schedule,
      daysOfWeek: scheduleToDaysOfWeek(schedule),
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
 * Returns all active habits for a user scheduled for today, with today's completion status.
 */
export async function getUserHabitsToday(
  userId: string,
): Promise<HabitWithCompletion[]> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const dayOfWeek = getDayOfWeekInAppTimeZone(now);

  console.log(
    `[HabitService] getUserHabitsToday: userId=${userId}, ` +
      `todayStart=${todayStart.toISOString()}, dayOfWeek=${dayOfWeek}`,
  );

  const todayKey = dayIndexToKey(dayOfWeek);
  const habits = await prisma.habit.findMany({
    where: {
      userId,
      isActive: true,
      OR: [{ schedule: { has: todayKey } }, { daysOfWeek: { has: dayOfWeek } }],
    },
    include: {
      completions: {
        where: { completionDate: todayStart },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return habits.map((habit) => {
    const schedule = resolveHabitSchedule(habit.schedule, habit.daysOfWeek);
    const scheduledToday = schedule.includes(dayIndexToKey(dayOfWeek));
    return {
      ...habit,
      schedule,
      daysOfWeek: scheduleToDaysOfWeek(schedule),
      completedToday: habit.completions.length > 0,
      scheduledToday,
      completions: undefined as never,
    };
  });
}

/**
 * Returns only habits scheduled for today.
 */
export async function getScheduledHabitsToday(
  userId: string,
): Promise<HabitWithCompletion[]> {
  const habits = await getUserHabitsToday(userId);
  return habits.filter((h) => h.scheduledToday);
}

/**
 * Returns all active habits (regardless of day).
 */
export async function getAllHabits(userId: string) {
  const now = new Date();
  const todayStart = startOfDay(now);
  const dayOfWeek = getDayOfWeekInAppTimeZone(now);

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
    schedule: resolveHabitSchedule(habit.schedule, habit.daysOfWeek),
    completedToday: habit.completions.length > 0,
    scheduledToday: resolveHabitSchedule(habit.schedule, habit.daysOfWeek).includes(dayIndexToKey(dayOfWeek)),
    daysOfWeek: scheduleToDaysOfWeek(resolveHabitSchedule(habit.schedule, habit.daysOfWeek)),
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

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayString = getLogicalDateString(now);
  const todayDayKey = dayIndexToKey(getDayOfWeekInAppTimeZone(now));
  const habitSchedule = resolveHabitSchedule(habit.schedule, habit.daysOfWeek);

  if (!habitSchedule.includes(todayDayKey)) {
    throw new Error("Habit is not scheduled for today");
  }

  console.log(
    `[HabitService] completeHabit: habit="${habit.title}", ` +
      `todayStart=${todayStart.toISOString()}, todayString=${todayString}`,
  );

  // Check if already completed today
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

  console.log(
    `[HabitService] ✅ Habit "${habit.title}" completed by user ${userId} ` +
      `(completionDate=${completion.completionDate.toISOString()})`,
  );

  // Award XP & coins with logging
  const xpResult = await awardXP(
    userId,
    habit.xpReward,
    `Completed habit: ${habit.title}`,
  );
  const coins = await awardCoins(userId, habit.coinReward);

  console.log(
    `[HabitService] Awarded ${habit.xpReward} XP (total: ${xpResult.xp}, level: ${xpResult.level}` +
      `${xpResult.leveledUp ? " LEVEL UP!" : ""}) and ${habit.coinReward} coins (total: ${coins})`,
  );

  // Update streak
  const streakResult = await updateStreak(userId);

  console.log(
    `[HabitService] Streak: ${streakResult.streak}${streakResult.reset ? " (reset)" : ""}`,
  );

  // Update daily missions
  await updateMissionsOnHabitComplete(userId, habit.xpReward);

  // Check achievements
  const newAchievements = await checkAndUnlockAchievements(userId);

  // Check if challenge day should advance (all habits completed)
  await checkChallengeProgress(userId);

  // Update user challenge progress (social challenges between friends)
  await updateChallengeProgress(userId);

  // Send habit completed notification (async, don't await)
  notifyHabitCompleted(userId, habit.title, habit.xpReward).catch(
    console.error,
  );

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
 * Checks if user completed all scheduled habits for today and advances challenge.
 * Only advances ONCE per day (uses lastAdvancedDate to prevent double-counting).
 */
async function checkChallengeProgress(userId: string) {
  const now = new Date();
  const todayString = getLogicalDateString(now);

  const challenge = await prisma.challenge.findUnique({
    where: { userId },
  });

  if (!challenge || !challenge.isActive) return;

  // Check if we already advanced today
  if (challenge.lastAdvancedDate) {
    const lastAdvancedString = getLogicalDateString(challenge.lastAdvancedDate);
    if (lastAdvancedString === todayString) {
      console.log(
        `[HabitService] Challenge already advanced today (${todayString}), skipping`,
      );
      return;
    }
  }

  const todayHabits = await getScheduledHabitsToday(userId);
  const allCompleted = todayHabits.every((h) => h.completedToday);

  console.log(
    `[HabitService] checkChallengeProgress: user=${userId}, ` +
      `scheduled=${todayHabits.length}, allCompleted=${allCompleted}`,
  );

  if (allCompleted && todayHabits.length > 0) {
    const newDay = challenge.currentDay + 1;
    const isComplete = newDay > challenge.totalDays;

    await prisma.challenge.update({
      where: { userId },
      data: {
        currentDay: isComplete ? challenge.totalDays : newDay,
        isActive: !isComplete,
        endDate: isComplete ? new Date() : undefined,
        lastAdvancedDate: now,
      },
    });

    console.log(
      `[HabitService] Challenge day ${challenge.currentDay} → ${newDay}/${challenge.totalDays} for user ${userId}`,
    );
  }
}

/**
 * Returns weekly habit completion progress.
 */
export async function getWeeklyProgress(
  userId: string,
): Promise<WeeklyProgress> {
  const weekStart = getWeekStart();
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Get all active habits
  const habits = await prisma.habit.findMany({
    where: { userId, isActive: true },
  });

  // Calculate total weekly scheduled habits for full current week (Sun-Sat)
  const totalPossible = habits.reduce((sum, habit) => {
    const schedule = resolveHabitSchedule(habit.schedule, habit.daysOfWeek);
    return sum + schedule.length;
  }, 0);

  // Count only completions that happened on a scheduled day for each habit
  const completionRows = await prisma.habitCompletion.findMany({
    where: {
      userId,
      completionDate: { gte: weekStart, lt: weekEnd },
    },
    select: {
      completionDate: true,
      habit: { select: { schedule: true, daysOfWeek: true } },
    },
  });

  let completions = 0;
  for (const row of completionRows) {
    const completionDay = getDayOfWeekInAppTimeZone(row.completionDate);
    const schedule = resolveHabitSchedule(row.habit.schedule, row.habit.daysOfWeek);
    if (schedule.includes(dayIndexToKey(completionDay))) {
      completions++;
    }
  }

  const percentage =
    totalPossible > 0 ? Math.round((completions / totalPossible) * 100) : 0;

  return {
    completed: completions,
    total: totalPossible,
    percentage,
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
