import { prisma } from "@/lib/prisma";
import { calculateLevel } from "./xp.service";
import { isInTopTen } from "./ranking.service";
import { notifyAchievementUnlocked } from "./notification.service";
import type { AchievementWithStatus } from "@/types";
import type { Achievement } from "@prisma/client";

/**
 * Returns all achievements with their unlock status for a user.
 */
export async function getUserAchievements(userId: string): Promise<AchievementWithStatus[]> {
  const achievements = await prisma.achievement.findMany({
    include: {
      userAchievements: {
        where: { userId },
        take: 1,
      },
    },
  });

  console.log(`[AchievementService] Found ${achievements.length} achievements for user ${userId}`);

  return achievements.map((a) => ({
    ...a,
    unlocked: a.userAchievements.length > 0,
    unlockedAt: a.userAchievements[0]?.unlockedAt ?? null,
    userAchievements: undefined as never,
  }));
}

/**
 * Checks all achievement conditions and unlocks any newly earned ones.
 * Returns the list of achievements just unlocked.
 */
export async function checkAndUnlockAchievements(userId: string): Promise<Achievement[]> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { xp: true, streak: true },
  });

  // Total lifetime completions
  const totalCompletions = await prisma.habitCompletion.count({
    where: { userId },
  });

  // All achievements not yet unlocked by this user
  const locked = await prisma.achievement.findMany({
    where: {
      userAchievements: { none: { userId } },
    },
  });

  console.log(
    `[AchievementService] Checking ${locked.length} locked achievements. ` +
    `User stats: xp=${user.xp}, streak=${user.streak}, completions=${totalCompletions}`
  );

  const newlyUnlocked: Achievement[] = [];

  const level = calculateLevel(user.xp);

  for (const achievement of locked) {
    const earned = await evaluateCondition(achievement, {
      totalCompletions,
      streak: user.streak,
      level,
      userId,
    });

    if (earned) {
      await prisma.userAchievement.create({
        data: { userId, achievementId: achievement.id },
      });

      // Send achievement notification with push
      notifyAchievementUnlocked(userId, achievement.title).catch(console.error);

      newlyUnlocked.push(achievement);
      console.log(`[AchievementService] ✅ Unlocked "${achievement.title}" for user ${userId}`);
    }
  }

  return newlyUnlocked;
}

async function evaluateCondition(
  achievement: Achievement,
  ctx: { totalCompletions: number; streak: number; level: number; userId: string }
): Promise<boolean> {
  switch (achievement.type) {
    case "FIRST_HABIT":
      return ctx.totalCompletions >= achievement.target;

    case "STREAK_7":
    case "STREAK_30":
      return ctx.streak >= achievement.target;

    case "LEVEL_10":
      return ctx.level >= achievement.target;

    case "TOP_10_RANKING":
      return isInTopTen(ctx.userId);

    case "HABITS_COMPLETED":
      return ctx.totalCompletions >= achievement.target;

    default:
      return false;
  }
}
