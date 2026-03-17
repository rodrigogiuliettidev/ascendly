import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getUserHabitsToday } from "@/services/habit.service";
import { getTodayMissions } from "@/services/mission.service";
import { getUserAchievements } from "@/services/achievement.service";
import { getUserRankingPosition } from "@/services/ranking.service";
import { calculateLevel } from "@/services/xp.service";

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const [user, habits, missionsRaw, achievements, rankingPosition] =
      await Promise.all([
        prisma.user.findUniqueOrThrow({
          where: { id: auth.userId },
          select: {
            id: true,
            name: true,
            email: true,
            xp: true,
            coins: true,
            streak: true,
            createdAt: true,
          },
        }),
        getUserHabitsToday(auth.userId),
        getTodayMissions(auth.userId),
        getUserAchievements(auth.userId),
        getUserRankingPosition(auth.userId),
      ]);

    const level = calculateLevel(user.xp);
    const completedCount = habits.filter((h) => h.completedToday).length;

    const missions = missionsRaw.map((um) => ({
      id: um.id,
      title: um.mission.title,
      description: um.mission.description,
      progress: um.progress,
      target: um.mission.target,
      xpReward: um.mission.xpReward,
      coinReward: um.mission.coinReward,
      status: um.status,
    }));

    return NextResponse.json({
      user: { ...user, level },
      habits,
      completedCount,
      missions,
      achievements,
      rankingPosition,
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
