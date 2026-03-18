import { prisma } from "@/lib/prisma";
import { getWeekStart } from "@/lib/date";
import type { RankingEntry } from "@/types";

/**
 * Returns the global top-N ranking for the current week.
 */
export async function getWeeklyRanking(limit = 10): Promise<RankingEntry[]> {
  const weekStart = getWeekStart();

  const entries = await prisma.weeklyXp.findMany({
    where: { weekStart },
    orderBy: { xpEarned: "desc" },
    take: limit,
    include: { user: { select: { name: true } } },
  });

  return entries.map((entry, index) => ({
    position: index + 1,
    userId: entry.userId,
    name: entry.user.name,
    xpEarned: entry.xpEarned,
  }));
}

/**
 * Returns a single user's position and XP in the current week.
 */
export async function getUserRankingPosition(
  userId: string,
): Promise<{ position: number; xpEarned: number } | null> {
  const weekStart = getWeekStart();

  const userEntry = await prisma.weeklyXp.findUnique({
    where: { userId_weekStart: { userId, weekStart } },
  });

  if (!userEntry) return null;

  // Count how many users earned more XP this week
  const above = await prisma.weeklyXp.count({
    where: {
      weekStart,
      xpEarned: { gt: userEntry.xpEarned },
    },
  });

  return { position: above + 1, xpEarned: userEntry.xpEarned };
}

/**
 * Returns the weekly ranking filtered to users followed by `userId`.
 */
export async function getFriendsRanking(
  userId: string,
  limit = 10,
): Promise<RankingEntry[]> {
  const weekStart = getWeekStart();

  // Get IDs of users this user follows
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const friendIds = follows.map((f) => f.followingId);
  friendIds.push(userId); // include the user themselves

  const entries = await prisma.weeklyXp.findMany({
    where: {
      weekStart,
      userId: { in: friendIds },
    },
    orderBy: { xpEarned: "desc" },
    take: limit,
    include: { user: { select: { name: true } } },
  });

  return entries.map((entry, index) => ({
    position: index + 1,
    userId: entry.userId,
    name: entry.user.name,
    xpEarned: entry.xpEarned,
  }));
}

/**
 * Checks whether a user is in the top 10 this week.
 */
export async function isInTopTen(userId: string): Promise<boolean> {
  const pos = await getUserRankingPosition(userId);
  return pos !== null && pos.position <= 10;
}
