import { prisma } from "@/lib/prisma";
import { getWeekStart, getWeekStartUtc } from "@/lib/date";
import type { RankingEntry } from "@/types";

function getCurrentWeekCandidates(): Date[] {
  const tzWeekStart = getWeekStart();
  const utcWeekStart = getWeekStartUtc();
  const unique = new Map<string, Date>();
  unique.set(tzWeekStart.toISOString(), tzWeekStart);
  unique.set(utcWeekStart.toISOString(), utcWeekStart);
  return Array.from(unique.values());
}

function aggregateEntries(
  entries: Array<{
    userId: string;
    xpEarned: number;
    user: { name: string };
  }>,
): RankingEntry[] {
  const byUser = new Map<string, { name: string; xpEarned: number }>();

  for (const entry of entries) {
    const current = byUser.get(entry.userId);
    if (current) {
      current.xpEarned += entry.xpEarned;
    } else {
      byUser.set(entry.userId, {
        name: entry.user.name,
        xpEarned: entry.xpEarned,
      });
    }
  }

  return Array.from(byUser.entries())
    .map(([userId, data]) => ({
      userId,
      name: data.name,
      xpEarned: data.xpEarned,
    }))
    .sort((a, b) => b.xpEarned - a.xpEarned)
    .map((entry, index) => ({ ...entry, position: index + 1 }));
}

/**
 * Returns the global top-N ranking for the current week.
 */
export async function getWeeklyRanking(limit = 10): Promise<RankingEntry[]> {
  const weekStarts = getCurrentWeekCandidates();

  const entries = await prisma.weeklyXp.findMany({
    where: { weekStart: { in: weekStarts } },
    include: { user: { select: { name: true } } },
  });

  return aggregateEntries(entries).slice(0, limit);
}

/**
 * Returns a single user's position and XP in the current week.
 */
export async function getUserRankingPosition(
  userId: string,
): Promise<{ position: number; xpEarned: number } | null> {
  const ranking = await getWeeklyRanking(10000);
  const entry = ranking.find((r) => r.userId === userId);
  if (!entry) return null;
  return { position: entry.position, xpEarned: entry.xpEarned };
}

/**
 * Returns the weekly ranking filtered to users followed by `userId`.
 */
export async function getFriendsRanking(
  userId: string,
  limit = 10,
): Promise<RankingEntry[]> {
  const weekStarts = getCurrentWeekCandidates();

  // Get IDs of users this user follows
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const friendIds = follows.map((f) => f.followingId);
  friendIds.push(userId); // include the user themselves

  const entries = await prisma.weeklyXp.findMany({
    where: {
      weekStart: { in: weekStarts },
      userId: { in: friendIds },
    },
    include: { user: { select: { name: true } } },
  });

  return aggregateEntries(entries).slice(0, limit);
}

/**
 * Checks whether a user is in the top 10 this week.
 */
export async function isInTopTen(userId: string): Promise<boolean> {
  const pos = await getUserRankingPosition(userId);
  return pos !== null && pos.position <= 10;
}
