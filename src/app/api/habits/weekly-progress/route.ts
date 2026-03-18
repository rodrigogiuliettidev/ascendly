import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { getWeeklyProgress } from "@/services/habit.service";

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const progress = await getWeeklyProgress(auth.userId);
    return NextResponse.json(progress);
  } catch (error) {
    console.error("GET /api/habits/weekly-progress error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
