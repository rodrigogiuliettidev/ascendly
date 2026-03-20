import { NextRequest, NextResponse } from "next/server";
import { acceptUserChallenge } from "@/services/user-challenge.service";
import { authenticateRequest } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;

    const { challengeId } = await req.json();

    if (!challengeId) {
      return NextResponse.json({ error: "Challenge ID required" }, { status: 400 });
    }

    const result = await acceptUserChallenge(challengeId, auth.userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Accept user challenge error:", error);
    const message = error instanceof Error ? error.message : "Failed to accept challenge";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
