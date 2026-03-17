import { NextResponse } from "next/server";
import { verifyToken, getTokenFromHeaders } from "@/lib/auth";

/**
 * Extracts and verifies the JWT from request headers.
 * Returns the userId or a 401 NextResponse.
 */
export function authenticateRequest(
  request: Request
): { userId: string } | NextResponse {
  const token = getTokenFromHeaders(request.headers);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
  return { userId: payload.userId };
}
