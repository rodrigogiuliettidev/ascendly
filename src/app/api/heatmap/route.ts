import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getLogicalDateString, getDaysAgo, getDayOfWeekInAppTimeZone } from "@/lib/date";
import { dayIndexToKey, resolveHabitSchedule } from "@/lib/habit-schedule";

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const ninetyDaysAgo = getDaysAgo(90);

    console.log(
      `[Heatmap] Fetching completions for user=${auth.userId} since ${ninetyDaysAgo.toISOString()}`,
    );

    const [activeHabits, completions] = await Promise.all([
      prisma.habit.findMany({
        where: {
          userId: auth.userId,
          isActive: true,
        },
        select: {
          id: true,
          schedule: true,
          daysOfWeek: true,
        },
      }),
      prisma.habitCompletion.findMany({
        where: {
          userId: auth.userId,
          completionDate: { gte: ninetyDaysAgo },
        },
        select: { completionDate: true, completedAt: true, habitId: true },
      }),
    ]);

    console.log(`[Heatmap] Found ${completions.length} raw completions`);

    const completionMap = new Map<string, number>();
    for (const c of completions) {
      const dateStr = getLogicalDateString(c.completionDate);
      completionMap.set(dateStr, (completionMap.get(dateStr) || 0) + 1);
    }

    const habitSchedules = activeHabits.map((habit) =>
      resolveHabitSchedule(habit.schedule, habit.daysOfWeek),
    );

    const result = [];
    for (let i = 89; i >= 0; i--) {
      const d = getDaysAgo(i);
      const dateStr = getLogicalDateString(d);
      const dayIndex = getDayOfWeekInAppTimeZone(d);
      const dayKey = dayIndexToKey(dayIndex);
      const expected = habitSchedules.filter((schedule) =>
        schedule.includes(dayKey),
      ).length;
      const completed = completionMap.get(dateStr) || 0;
      const intensity =
        expected > 0 ? Math.round((Math.min(completed, expected) / expected) * 4) : 0;

      result.push({
        date: dateStr,
        count: expected > 0 ? intensity : 0,
        completed,
        expected,
      });
    }

    console.log(`[Heatmap] Returning last 7 days:`, result.slice(-7));

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/heatmap error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
