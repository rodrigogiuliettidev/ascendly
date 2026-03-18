import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { getTodayXpSummary } from "@/services/xp.service";

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const summary = await getTodayXpSummary(auth.userId);
    return NextResponse.json(summary);
  } catch (error) {
    console.error("GET /api/xp error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
