import { NextRequest, NextResponse } from "next/server";
import { createUserChallenge, getUserChallenges, getPendingChallenges } from "@/services/user-challenge.service";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;

    const url = new URL(req.url);
    const pending = url.searchParams.get("pending") === "true";

    if (pending) {
      const challenges = await getPendingChallenges(auth.userId);
      return NextResponse.json(challenges);
    }

    const challenges = await getUserChallenges(auth.userId);
    return NextResponse.json(challenges);
  } catch (error) {
    console.error("[API] Get user challenges error:", error);
    return NextResponse.json({ error: "Failed to get challenges" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;

    const body = await req.json();
    const { receiverId, title, targetCount, durationDays, description } = body;

    if (!receiverId || !title) {
      return NextResponse.json({ error: "Receiver ID and title required" }, { status: 400 });
    }

    const challenge = await createUserChallenge(
      auth.userId,
      receiverId,
      title,
      targetCount,
      durationDays,
      description
    );
    return NextResponse.json(challenge);
  } catch (error) {
    console.error("[API] Create user challenge error:", error);
    const message = error instanceof Error ? error.message : "Failed to create challenge";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
