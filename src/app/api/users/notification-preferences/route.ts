import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: auth.userId },
      update: {},
      create: { userId: auth.userId },
    });

    return NextResponse.json(prefs);
  } catch (error) {
    console.error("GET /api/users/notification-preferences error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { habitReminders, achievements, rankingUpdates, streakWarnings, missions, pushEnabled } = body;

    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: auth.userId },
      update: {
        ...(habitReminders !== undefined && { habitReminders }),
        ...(achievements !== undefined && { achievements }),
        ...(rankingUpdates !== undefined && { rankingUpdates }),
        ...(streakWarnings !== undefined && { streakWarnings }),
        ...(missions !== undefined && { missions }),
        ...(pushEnabled !== undefined && { pushEnabled }),
      },
      create: {
        userId: auth.userId,
        habitReminders: habitReminders ?? true,
        achievements: achievements ?? true,
        rankingUpdates: rankingUpdates ?? true,
        streakWarnings: streakWarnings ?? true,
        missions: missions ?? true,
        pushEnabled: pushEnabled ?? false,
      },
    });

    return NextResponse.json(prefs);
  } catch (error) {
    console.error("PATCH /api/users/notification-preferences error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
