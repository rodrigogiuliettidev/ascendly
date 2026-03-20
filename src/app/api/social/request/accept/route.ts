import { NextRequest, NextResponse } from "next/server";
import { acceptFollowRequest } from "@/services/social.service";
import { authenticateRequest } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;

    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json({ error: "Request ID required" }, { status: 400 });
    }

    const result = await acceptFollowRequest(requestId, auth.userId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Accept follow request error:", error);
    const message = error instanceof Error ? error.message : "Failed to accept request";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
