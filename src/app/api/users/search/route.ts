import { NextRequest, NextResponse } from "next/server";
import { searchUsers } from "@/services/social.service";
import { authenticateRequest } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  try {
    const auth = authenticateRequest(req);
    if (auth instanceof NextResponse) {
      console.log("[API] Search users: Unauthorized");
      return auth;
    }

    const url = new URL(req.url);
    const query = url.searchParams.get("q") || "";

    console.log(
      `[API] Search users: query="${query}", userId="${auth.userId}"`,
    );

    const users = await searchUsers(query, auth.userId);

    console.log(`[API] Search users: found ${users.length} results`);

    return NextResponse.json(users);
  } catch (error) {
    console.error("[API] Search users error:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 },
    );
  }
}
