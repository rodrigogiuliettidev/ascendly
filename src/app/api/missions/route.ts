import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { getTodayMissions } from "@/services/mission.service";

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const missions = await getTodayMissions(auth.userId);

    return NextResponse.json(
      missions.map((um) => ({
        id: um.id,
        title: um.mission.title,
        description: um.mission.description,
        progress: um.progress,
        target: um.mission.target,
        xpReward: um.mission.xpReward,
        coinReward: um.mission.coinReward,
        status: um.status,
      })),
    );
  } catch (error) {
    console.error("GET /api/missions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
