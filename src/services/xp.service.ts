import { prisma } from "@/lib/prisma";
import {
  getWeekStart,
  getWeekStartUtc,
  startOfDay,
  endOfDay,
} from "@/lib/date";
import type { XpSummary } from "@/types";

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
 * Awards XP to a user, logs it, recalculates their level,
 * and records the XP in the weekly ranking table.
 */
export async function awardXP(
  userId: string,
  amount: number,
  reason: string = "Completed habit",
): Promise<{ xp: number; level: number; leveledUp: boolean }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const oldLevel = calculateLevel(user.xp);
  const newXp = user.xp + amount;
  const newLevel = calculateLevel(newXp);
  const leveledUp = newLevel > oldLevel;

  // Update user XP
  await prisma.user.update({
    where: { id: userId },
    data: { xp: newXp },
  });

  // Log XP gain
  await prisma.xpLog.create({
    data: {
      userId,
      amount,
      type: "GAIN",
      reason,
    },
  });

  // Track weekly XP for ranking (compatible with legacy UTC week bucket).
  const tzWeekStart = getWeekStart();
  const utcWeekStart = getWeekStartUtc();
  const candidates = [tzWeekStart, utcWeekStart];

  const existing = await prisma.weeklyXp.findFirst({
    where: {
      userId,
      weekStart: { in: candidates },
    },
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    await prisma.weeklyXp.update({
      where: { id: existing.id },
      data: { xpEarned: { increment: amount } },
    });
  } else {
    await prisma.weeklyXp.create({
      data: { userId, weekStart: tzWeekStart, xpEarned: amount },
    });
  }

  return { xp: newXp, level: newLevel, leveledUp };
}

/**
 * Applies XP penalty to a user and logs it.
 */
export async function penalizeXP(
  userId: string,
  amount: number,
  reason: string,
): Promise<{ xp: number; level: number }> {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  const newXp = Math.max(0, user.xp - amount);
  const newLevel = calculateLevel(newXp);

  // Update user XP
  await prisma.user.update({
    where: { id: userId },
    data: { xp: newXp },
  });

  // Log XP penalty (negative amount)
  await prisma.xpLog.create({
    data: {
      userId,
      amount: -amount,
      type: "PENALTY",
      reason,
    },
  });

  console.log(
    `[XPService] ⚠️ Penalty: -${amount} XP for user ${userId}: ${reason}`,
  );

  return { xp: newXp, level: newLevel };
}

/**
 * Gets XP summary for today.
 */
export async function getTodayXpSummary(userId: string): Promise<XpSummary> {
  const todayStart = startOfDay();
  const todayEnd = endOfDay();

  const logs = await prisma.xpLog.findMany({
    where: {
      userId,
      createdAt: { gte: todayStart, lte: todayEnd },
    },
  });

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { xp: true },
  });

  const gained = logs
    .filter((l) => l.type === "GAIN")
    .reduce((sum, l) => sum + l.amount, 0);
  const lost = logs
    .filter((l) => l.type === "PENALTY")
    .reduce((sum, l) => sum + Math.abs(l.amount), 0);

  return {
    gained,
    lost,
    net: gained - lost,
    total: user.xp,
  };
}

/**
 * Awards coins to a user.
 */
export async function awardCoins(
  userId: string,
  amount: number,
): Promise<number> {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: { coins: { increment: amount } },
  });
  return updated.coins;
}
