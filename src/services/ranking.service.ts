import { prisma } from "@/lib/prisma";
import type { RankingEntry } from "@/types";

function toRankingEntries(
  users: Array<{ id: string; name: string; xp: number }>,
  options?: { fillToTen?: boolean },
): RankingEntry[] {
  const entries: RankingEntry[] = users.map((user, index) => ({
    position: index + 1,
    userId: user.id,
    name: user.name,
    xpEarned: user.xp,
  }));

  if (options?.fillToTen) {
    const targetSize = 10;
    for (let i = entries.length; i < targetSize; i++) {
      entries.push({
        position: i + 1,
        userId: `placeholder-${i + 1}`,
        name: "No player yet",
        xpEarned: 0,
        isPlaceholder: true,
      });
    }
  }

  return entries;
}

/**
 * Returns the global top-N ranking based on total XP.
 */
export async function getGlobalRanking(limit = 10): Promise<RankingEntry[]> {
  const target = Math.min(limit, 10);
  const users = await prisma.user.findMany({
    select: { id: true, name: true, xp: true },
    orderBy: [{ xp: "desc" }, { createdAt: "asc" }],
    take: target,
  });

  return toRankingEntries(users, { fillToTen: target === 10 });
}

/**
 * Returns a single user's position and total XP in the global ranking.
 */
export async function getUserRankingPosition(
  userId: string,
): Promise<{ position: number; xpEarned: number } | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, createdAt: true },
  });

  if (!user) return null;

  const higherUsersCount = await prisma.user.count({
    where: {
      OR: [
        { xp: { gt: user.xp } },
        {
          AND: [{ xp: user.xp }, { createdAt: { lt: user.createdAt } }],
        },
        {
          AND: [
            { xp: user.xp },
            { createdAt: user.createdAt },
            { id: { lt: userId } },
          ],
        },
      ],
    },
  });

  return {
    position: higherUsersCount + 1,
    xpEarned: user.xp,
  };
}

/**
 * Returns global ranking filtered to users followed by `userId`.
 */
export async function getFriendsRanking(
  userId: string,
  limit = 10,
): Promise<RankingEntry[]> {
  const follows = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });

  const friendIds = follows.map((f) => f.followingId);
  friendIds.push(userId); // include the user themselves

  const users = await prisma.user.findMany({
    where: {
      id: { in: friendIds },
    },
    select: { id: true, name: true, xp: true },
    orderBy: [{ xp: "desc" }, { createdAt: "asc" }],
    take: limit,
  });

  return toRankingEntries(users);
}

/**
 * Checks whether a user is in the global top 10.
 */
export async function isInTopTen(userId: string): Promise<boolean> {
  const pos = await getUserRankingPosition(userId);
  return pos !== null && pos.position <= 10;
}
