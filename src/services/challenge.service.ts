import { prisma } from "@/lib/prisma";
import { getScheduledHabitsToday } from "./habit.service";
import { getMonthProgress } from "@/lib/date";
import type { ChallengeProgress } from "@/types";

/**
 * Gets or creates a 30-day challenge for the user.
 */
export async function getChallenge(userId: string) {
  let challenge = await prisma.challenge.findUnique({
    where: { userId },
  });

  if (!challenge) {
    challenge = await prisma.challenge.create({
      data: {
        userId,
        currentDay: 1,
        totalDays: 30,
        startDate: new Date(),
        isActive: true,
      },
    });
    console.log(
      `[ChallengeService] Created new 30-day challenge for user ${userId}`,
    );
  }

  return challenge;
}

/**
 * Gets challenge progress for the user.
 */
export async function getChallengeProgress(
  userId: string,
): Promise<ChallengeProgress> {
  const challenge = await getChallenge(userId);
  const todayHabits = await getScheduledHabitsToday(userId);
  const monthProgress = getMonthProgress();

  const habitsCompletedToday = todayHabits.filter(
    (h) => h.completedToday,
  ).length;
  const totalHabitsToday = todayHabits.length;

  const daysRemaining = challenge.isActive
    ? challenge.totalDays - challenge.currentDay + 1
    : 0;

  return {
    currentDay: challenge.currentDay,
    totalDays: challenge.totalDays,
    monthCurrentDay: monthProgress.currentDay,
    monthTotalDays: monthProgress.totalDays,
    startDate: challenge.startDate,
    isActive: challenge.isActive,
    habitsCompletedToday,
    totalHabitsToday,
    daysRemaining,
  };
}

/**
 * Resets the challenge to day 1.
 */
export async function resetChallenge(userId: string) {
  return prisma.challenge.upsert({
    where: { userId },
    update: {
      currentDay: 1,
      startDate: new Date(),
      endDate: null,
      lastAdvancedDate: null,
      isActive: true,
    },
    create: {
      userId,
      currentDay: 1,
      totalDays: 30,
      startDate: new Date(),
      isActive: true,
    },
  });
}
