import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import {
  getWeeklyRanking,
  getUserRankingPosition,
} from "@/services/ranking.service";
import { calculateLevel } from "@/services/xp.service";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const [ranking, userPosition] = await Promise.all([
      getWeeklyRanking(10),
      getUserRankingPosition(auth.userId),
    ]);

    // Enrich ranking entries with level
    const enriched = await Promise.all(
      ranking.map(async (entry) => {
        const user = await prisma.user.findUnique({
          where: { id: entry.userId },
          select: { xp: true },
        });
        return {
          ...entry,
          level: user ? calculateLevel(user.xp) : 0,
          isCurrentUser: entry.userId === auth.userId,
        };
      }),
    );

    return NextResponse.json({
      ranking: enriched,
      userPosition,
    });
  } catch (error) {
    console.error("GET /api/ranking error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
