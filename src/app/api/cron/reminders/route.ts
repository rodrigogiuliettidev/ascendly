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

    const now = new Date();
    const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const todayStart = startOfDay();

    // Find habits with reminder at current time
    const habits = await prisma.habit.findMany({
      where: {
        isActive: true,
        reminderTime: currentMinutes,
        completions: {
          none: { completionDate: todayStart },
        },
      },
      include: {
        user: {
          select: { id: true, fcmToken: true },
        },
      },
    });

    console.log("[CronReminders] Found " + habits.length + " habits to remind at minute " + currentMinutes);

    for (const habit of habits) {
      // Create in-app notification
      await prisma.notification.create({
        data: {
          userId: habit.userId,
          type: "HABIT_REMINDER",
          message: "Time to complete your habit: " + habit.title + " \u{1F9D8}",
          link: "/habits",
        },
      });

      // Send push if available
      if (habit.user.fcmToken) {
        try {
          const webPush = require("web-push");
          const subscription = JSON.parse(habit.user.fcmToken);
          const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
          const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
          const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@ascendly.app";

          if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
            webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
            await webPush.sendNotification(
              subscription,
              JSON.stringify({
                title: "Time to complete your habit!",
                body: "Don't forget: " + habit.title + ".",
                url: "/habits",
                tag: "reminder-" + habit.id,
              })
            );
          }
        } catch (pushError) {
          console.error("[CronReminders] Push error for habit " + habit.id + ":", pushError);
        }
      }

      console.log("[CronReminders] \u{1F514} Reminder sent for habit \"" + habit.title + "\" to user " + habit.userId);
    }

    return NextResponse.json({ sent: habits.length });
  } catch (error) {
    console.error("POST /api/cron/reminders error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
