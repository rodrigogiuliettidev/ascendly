import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay } from "@/lib/date";

export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== "Bearer " + cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const todayStart = startOfDay();

    // Find users with active streaks who haven't completed any habit today
    const usersAtRisk = await prisma.user.findMany({
      where: {
        streak: { gt: 0 },
        habitCompletions: {
          none: { completionDate: todayStart },
        },
      },
      select: { id: true, streak: true, fcmToken: true },
    });

    console.log("[CronStreakWarnings] Found " + usersAtRisk.length + " users with at-risk streaks");

    for (const user of usersAtRisk) {
      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: "STREAK_WARNING",
          message: "Your " + user.streak + "-day streak is at risk! Complete a habit today to keep it. \u{1F525}",
          link: "/habits",
        },
      });

      // Send push if available
      if (user.fcmToken) {
        try {
          const webPush = require("web-push");
          const subscription = JSON.parse(user.fcmToken);
          const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
          const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
          const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@ascendly.app";

          if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
            webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
            await webPush.sendNotification(
              subscription,
              JSON.stringify({
                title: "Your streak is at risk!",
                body: "Complete a habit today to keep your " + user.streak + "-day streak alive.",
                url: "/habits",
                tag: "streak-warning",
              })
            );
          }
        } catch (pushError) {
          console.error("[CronStreakWarnings] Push error for user " + user.id + ":", pushError);
        }
      }

      console.log("[CronStreakWarnings] \u{26A0}\u{FE0F} Streak warning sent to user " + user.id + " (streak: " + user.streak + ")");
    }

    return NextResponse.json({ warned: usersAtRisk.length });
  } catch (error) {
    console.error("POST /api/cron/streak-warnings error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
