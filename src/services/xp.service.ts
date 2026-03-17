import { prisma } from "@/lib/prisma";
import { getWeekStart } from "@/lib/date";

// level = floor(sqrt(xp / 100))
export function calculateLevel(xp: number): number {
  if (xp <= 0) return 0;
  return Math.floor(Math.sqrt(xp / 100));
}

/** XP needed to reach a given level: level² × 100 */
export function xpForLevel(level: number): number {
  return level * level * 100;
}

/** Progress percentage towards the next level (0–100) */
export function levelProgress(xp: number): number {
  const currentLevel = calculateLevel(xp);
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  const range = nextLevelXp - currentLevelXp;
  if (range === 0) return 100;
  return Math.min(100, Math.round(((xp - currentLevelXp) / range) * 100));
}

/**
 * Awards XP to a user, recalculates their level (computed, not stored),
 * and records the XP in the weekly ranking table.
 */
export async function awardXP(userId: string, amount: number): Promise<{ xp: number; level: number; leveledUp: boolean }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const oldLevel = calculateLevel(user.xp);
  const newXp = user.xp + amount;
  const newLevel = calculateLevel(newXp);
  const leveledUp = newLevel > oldLevel;

  await prisma.user.update({
    where: { id: userId },
    data: { xp: newXp },
  });

  // Track weekly XP for ranking
  const weekStart = getWeekStart();
  await prisma.weeklyXp.upsert({
    where: { userId_weekStart: { userId, weekStart } },
    update: { xpEarned: { increment: amount } },
    create: { userId, weekStart, xpEarned: amount },
  });

  return { xp: newXp, level: newLevel, leveledUp };
}

/**
 * Awards coins to a user.
 */
export async function awardCoins(userId: string, amount: number): Promise<number> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { coins: { increment: amount } },
  });
  return updated.coins;
}
