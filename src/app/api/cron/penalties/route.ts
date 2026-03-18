import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { penalizeXP } from "@/services/xp.service";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== "Bearer " + cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
      where: {
        habits: { some: { isActive: true } },
      },
      include: {
        habits: {
          where: { isActive: true },
          include: {
            completions: {
              where: { completionDate: yesterday },
            },
          },
        },
      },
    });

    let totalPenalties = 0;

    for (const user of users) {
      const dayOfWeek = yesterday.getDay();
      
      for (const habit of user.habits) {
        const scheduledDays = habit.daysOfWeek || [0, 1, 2, 3, 4, 5, 6];
        const wasScheduled = scheduledDays.includes(dayOfWeek);
        const wasCompleted = habit.completions.length > 0;

        if (wasScheduled && !wasCompleted) {
          const penalty = habit.penaltyXp || 5;
          await penalizeXP(user.id, penalty, "Missed habit: " + habit.title);
          totalPenalties++;
          console.log("[CronPenalties] -" + penalty + " XP for user " + user.id + " (missed: " + habit.title + ")");
        }
      }
    }

    return NextResponse.json({ processed: users.length, penalties: totalPenalties });
  } catch (error) {
    console.error("POST /api/cron/penalties error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
