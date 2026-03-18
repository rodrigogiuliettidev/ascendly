import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { getChallengeProgress, resetChallenge } from "@/services/challenge.service";

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const progress = await getChallengeProgress(auth.userId);
    return NextResponse.json(progress);
  } catch (error) {
    console.error("GET /api/challenge error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    if (body.action === "reset") {
      const challenge = await resetChallenge(auth.userId);
      return NextResponse.json(challenge);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("POST /api/challenge error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
