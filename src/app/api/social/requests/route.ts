import { NextRequest, NextResponse } from "next/server";
import { getPendingRequests, getSentRequests } from "@/services/social.service";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;

    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "received";

    if (type === "sent") {
      const requests = await getSentRequests(auth.userId);
      return NextResponse.json(requests);
    }

    const requests = await getPendingRequests(auth.userId);
    return NextResponse.json(requests);
  } catch (error) {
    console.error("[API] Get follow requests error:", error);
    return NextResponse.json({ error: "Failed to get requests" }, { status: 500 });
  }
}
