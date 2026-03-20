import { NextRequest, NextResponse } from "next/server";
import { sendFollowRequest } from "@/services/social.service";
import { authenticateRequest } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;

    const { receiverId } = await req.json();

    if (!receiverId) {
      return NextResponse.json({ error: "Receiver ID required" }, { status: 400 });
    }

    const request = await sendFollowRequest(auth.userId, receiverId);
    return NextResponse.json(request);
  } catch (error) {
    console.error("[API] Send follow request error:", error);
    const message = error instanceof Error ? error.message : "Failed to send request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
