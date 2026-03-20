import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";
import { getLogicalDateString, getDaysAgo } from "@/lib/date";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const weeksParam = url.searchParams.get("weeks");
    const weeks = weeksParam ? parseInt(weeksParam, 10) : 4;

    const startDate = getDaysAgo(weeks * 7);

    console.log(
      `[WeeklyHabits] Fetching for user=${user.id}, weeks=${weeks}, ` +
        `since=${startDate.toISOString()}`,
    );

    const habits = await prisma.habit.findMany({
      where: { userId: user.id, isActive: true },
      include: {
        completions: {
          where: {
            completionDate: { gte: startDate },
          },
          orderBy: { completionDate: "asc" },
        },
      },
    });

    const gridData = habits.map((habit) => {
      const completionDates = new Set(
        habit.completions.map((c) => getLogicalDateString(c.completionDate)),
      );
      return {
        id: habit.id,
        title: habit.title,
        daysOfWeek: habit.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
        completions: Array.from(completionDates),
      };
    });

    console.log(`[WeeklyHabits] Returning ${gridData.length} habits`);

    return NextResponse.json({ habits: gridData });
  } catch (error) {
    console.error("[API] Error fetching weekly habits:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
