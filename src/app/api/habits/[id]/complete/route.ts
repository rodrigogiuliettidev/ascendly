import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { completeHabit } from "@/services/habit.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const result = await completeHabit(id, auth.userId);

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    if (message === "Habit already completed today") {
      return NextResponse.json({ error: message }, { status: 409 });
    }

    console.error("POST /api/habits/[id]/complete error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
