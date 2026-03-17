import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { getUserHabitsToday, createHabit } from "@/services/habit.service";

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const habits = await getUserHabitsToday(auth.userId);
    return NextResponse.json(habits);
  } catch (error) {
    console.error("GET /api/habits error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { title, description, xpReward, coinReward, reminderTime } = body;

    if (!title?.trim()) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const habit = await createHabit(auth.userId, {
      title,
      description,
      xpReward,
      coinReward,
      reminderTime,
    });

    return NextResponse.json(habit, { status: 201 });
  } catch (error) {
    console.error("POST /api/habits error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
