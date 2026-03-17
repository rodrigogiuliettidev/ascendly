import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { getUserAchievements } from "@/services/achievement.service";

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const achievements = await getUserAchievements(auth.userId);

    return NextResponse.json(achievements);
  } catch (error) {
    console.error("GET /api/achievements error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
