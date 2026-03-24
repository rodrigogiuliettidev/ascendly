import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import {
  getGlobalRanking,
  getUserRankingPosition,
} from "@/services/ranking.service";
import { calculateLevel } from "@/services/xp.service";

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const [ranking, userPosition] = await Promise.all([
      getGlobalRanking(10),
      getUserRankingPosition(auth.userId),
    ]);

    const enriched = ranking.map((entry) => ({
      ...entry,
      level: entry.isPlaceholder ? 0 : calculateLevel(entry.xpEarned),
      isCurrentUser: !entry.isPlaceholder && entry.userId === auth.userId,
    }));

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
