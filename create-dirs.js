const fs = require("fs");
const path = require("path");

const baseDir = __dirname;

const dirs = [
  "prisma",
  "public",
  "public/icons",
  "src/app/(auth)/login",
  "src/app/(auth)/register",
  "src/app/dashboard",
  "src/app/habits",
  "src/app/ranking",
  "src/app/social",
  "src/app/profile",
  "src/app/notifications",
  "src/app/offline",
  "src/app/api/auth/register",
  "src/app/api/auth/login",
  "src/app/api/auth/me",
  "src/app/api/user/profile",
  "src/app/api/habits/complete",
  "src/app/api/habits/[id]/complete",
  "src/app/api/ranking",
  "src/app/api/social/follow",
  "src/app/api/social/friends",
  "src/app/api/notifications",
  "src/app/api/missions",
  "src/app/api/achievements",
  "src/app/api/users/[id]",
  "src/app/api/users/register-token",
  "src/app/api/users/notification-preferences",
  "src/app/api/cron/reminders",
  "src/app/api/cron/streak-warnings",
  "src/app/api/heatmap",
  "src/app/api/dashboard",
  "src/components/ui",
  "src/lib",
  "src/services",
  "src/repositories",
  "src/types",
  "src/hooks",
];

dirs.forEach((dir) => {
  const fullPath = path.join(baseDir, dir);
  fs.mkdirSync(fullPath, { recursive: true });
  console.log("✓ " + dir);
});

// Write files if they don't exist
const filesToWrite = [
  {
    path: "src/app/api/auth/me/route.ts",
    content: `import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken, getTokenFromHeaders, calculateLevel } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const token = getTokenFromHeaders(request.headers);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        xp: true,
        coins: true,
        streak: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...user,
      level: calculateLevel(user.xp),
    });
  } catch (error) {
    console.error("Me error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
`,
  },
  {
    path: "src/app/api/achievements/route.ts",
    content: `import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { getUserAchievements } from "@/services/achievement.service";

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const achievements = await getUserAchievements(auth.userId);

    return NextResponse.json(achievements);
  } catch (error) {
    console.error("GET /api/achievements error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
`,
  },
  {
    path: "src/app/api/heatmap/route.ts",
    content: `import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setUTCDate(ninetyDaysAgo.getUTCDate() - 90);
    ninetyDaysAgo.setUTCHours(0, 0, 0, 0);

    const completions = await prisma.habitCompletion.findMany({
      where: {
        userId: auth.userId,
        completedAt: { gte: ninetyDaysAgo },
      },
      select: { completionDate: true },
    });

    const countMap = new Map();
    for (const c of completions) {
      const dateStr = c.completionDate.toISOString().split("T")[0];
      countMap.set(dateStr, (countMap.get(dateStr) || 0) + 1);
    }

    const result = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      result.push({ date: dateStr, count: countMap.get(dateStr) || 0 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/heatmap error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
`,
  },
  {
    path: "src/app/api/dashboard/route.ts",
    content: `import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { getUserHabitsToday } from "@/services/habit.service";
import { getTodayMissions } from "@/services/mission.service";
import { getUserAchievements } from "@/services/achievement.service";
import { getUserRankingPosition } from "@/services/ranking.service";
import { calculateLevel } from "@/services/xp.service";

export async function GET(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const [user, habits, missionsRaw, achievements, rankingPosition] =
      await Promise.all([
        prisma.user.findUniqueOrThrow({
          where: { id: auth.userId },
          select: {
            id: true,
            name: true,
            email: true,
            xp: true,
            coins: true,
            streak: true,
            createdAt: true,
          },
        }),
        getUserHabitsToday(auth.userId),
        getTodayMissions(auth.userId),
        getUserAchievements(auth.userId),
        getUserRankingPosition(auth.userId),
      ]);

    const level = calculateLevel(user.xp);
    const completedCount = habits.filter((h) => h.completedToday).length;

    const missions = missionsRaw.map((um) => ({
      id: um.id,
      title: um.mission.title,
      description: um.mission.description,
      progress: um.progress,
      target: um.mission.target,
      xpReward: um.mission.xpReward,
      coinReward: um.mission.coinReward,
      status: um.status,
    }));

    return NextResponse.json({
      user: { ...user, level },
      habits,
      completedCount,
      missions,
      achievements,
      rankingPosition,
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
`,
  },
  {
    path: "src/app/api/users/register-token/route.ts",
    content: `import { NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const auth = authenticateRequest(request);
    if (auth instanceof NextResponse) return auth;

    const body = await request.json();
    const { subscription } = body;

    if (!subscription) {
      return NextResponse.json(
        { error: "Push subscription is required" },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: auth.userId },
      data: { fcmToken: JSON.stringify(subscription) },
    });

    // Ensure notification preferences exist
    await prisma.notificationPreference.upsert({
      where: { userId: auth.userId },
      update: { pushEnabled: true },
      create: { userId: auth.userId, pushEnabled: true },
    });

    console.log("[RegisterToken] Push subscription saved for user", auth.userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/users/register-token error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
`,
  },
  {
    path: "src/app/api/users/notification-preferences/route.ts",
    content: `import { NextResponse } from "next/server";
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
`,
  },
  {
    path: "src/app/api/cron/reminders/route.ts",
    content: `import { NextResponse } from "next/server";
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
          message: "Time to complete your habit: " + habit.title + " \\u{1F9D8}",
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

      console.log("[CronReminders] \\u{1F514} Reminder sent for habit \\"" + habit.title + "\\" to user " + habit.userId);
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
`,
  },
  {
    path: "src/app/api/cron/streak-warnings/route.ts",
    content: `import { NextResponse } from "next/server";
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
          message: "Your " + user.streak + "-day streak is at risk! Complete a habit today to keep it. \\u{1F525}",
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

      console.log("[CronStreakWarnings] \\u{26A0}\\u{FE0F} Streak warning sent to user " + user.id + " (streak: " + user.streak + ")");
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
`,
  },
  {
    path: "src/app/offline/page.tsx",
    content: `"use client";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0B0B0B] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">\\u{1F4E1}</div>
        <h1 className="text-2xl font-bold text-white mb-2">You&apos;re Offline</h1>
        <p className="text-[#A1A1A1] mb-6">
          It looks like you&apos;ve lost your internet connection. Reconnect and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-[#FF7A00] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#FF9F3F] transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
`,
  },
];

filesToWrite.forEach(({ path: filePath, content }) => {
  const fullPath = path.join(baseDir, filePath);
  if (!fs.existsSync(fullPath)) {
    fs.writeFileSync(fullPath, content);
    console.log("✓ Written " + filePath);
  } else {
    console.log("⏭ Skipped " + filePath + " (already exists)");
  }
});

console.log("\nAll directories and files created successfully!");

// Note about icons
console.log("\n📌 NOTES:");
console.log("- Place PWA icons in public/icons/ (icon-72x72.png through icon-512x512.png)");
console.log("- Generate VAPID keys: npx web-push generate-vapid-keys");
console.log("- Add keys to .env: NEXT_PUBLIC_VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY");
console.log("- Run: npx prisma db push && npx tsx prisma/seed.ts");
console.log("- Run: npm install && npm run dev");
