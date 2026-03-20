import { NextRequest, NextResponse } from "next/server";
import { getFriends, removeFriend } from "@/services/social.service";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;

    const friends = await getFriends(auth.userId);
    return NextResponse.json(friends);
  } catch (error) {
    console.error("[API] Get friends error:", error);
    return NextResponse.json({ error: "Failed to get friends" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (auth instanceof NextResponse) return auth;

    const { friendId } = await req.json();

    if (!friendId) {
      return NextResponse.json({ error: "Friend ID required" }, { status: 400 });
    }

    const result = await removeFriend(auth.userId, friendId);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[API] Remove friend error:", error);
    const message = error instanceof Error ? error.message : "Failed to remove friend";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
